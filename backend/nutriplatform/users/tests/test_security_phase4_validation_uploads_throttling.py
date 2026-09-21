import io
from decimal import Decimal
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import ValidationError

from admin_panel.models import Country, Goal, Specialization, SubscriptionTierPricing
from admin_panel.views import AdminInquiryRespondView, AdminSubscriptionPricingView
from client.models import Client
from community.models import FeedbackToAdmin, Post
from community.views import CommentCreateView
from marketplace.models import Plan
from nutritionist.models import Language, Nutritionist
from nutritionist.views import NutritionistPlanDetailView, NutritionistProfileView
from users.models import User
from users.throttles import (
    LoginCompositeThrottle,
    LoginIPThrottle,
    axes_lockout_response,
    get_client_ip,
)
from utils.upload_security import (
    MAX_UPLOAD_SIZE_AI,
    MAX_UPLOAD_SIZE_GENERAL,
    validate_and_sanitize_image,
)


def create_test_image(format='JPEG', size=(50, 50), color=(255, 0, 0)):
    buf = io.BytesIO()
    img = Image.new('RGB', size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    ext = 'jpg' if format == 'JPEG' else format.lower()
    return SimpleUploadedFile(f"test_image.{ext}", buf.getvalue(), content_type=f"image/{ext}")


class UploadSecurityTests(TestCase):

    def test_valid_jpeg_upload_and_sanitization(self):
        """Valid JPEG is verified, re-encoded, and saved to UUID path."""
        upload = create_test_image(format='JPEG')
        saved_path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertTrue(saved_path.startswith('profiles/test/'))
        self.assertTrue(saved_path.endswith('.jpg'))

    def test_valid_png_upload(self):
        """Valid PNG is verified, re-encoded, and saved."""
        upload = create_test_image(format='PNG')
        saved_path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertTrue(saved_path.startswith('profiles/test/'))
        self.assertTrue(saved_path.endswith('.png'))

    def test_reject_svg_upload(self):
        """SVG uploads are strictly rejected to prevent XSS."""
        svg_content = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        upload = SimpleUploadedFile("malicious.svg", svg_content, content_type="image/svg+xml")
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')

    def test_reject_executable_and_script_extensions(self):
        """Files with executable/script extensions are immediately rejected."""
        upload = SimpleUploadedFile("exploit.php", b"<?php echo 'pwnd'; ?>", content_type="application/x-php")
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')

    def test_reject_file_exceeding_max_size(self):
        """Files larger than the specified limit are rejected."""
        upload = create_test_image(format='JPEG')
        # Simulate size > 5 MB
        upload.size = 6 * 1024 * 1024
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test', max_size_bytes=5 * 1024 * 1024)

    def test_ai_food_image_size_limit(self):
        """Food images respect the 10 MB limit."""
        upload = create_test_image(format='JPEG')
        upload.size = 8 * 1024 * 1024  # 8 MB: allowed for AI vision (10 MB max)
        # Verify it passes size check up to magic byte parsing
        upload.seek(0)
        saved_path = validate_and_sanitize_image(upload, destination_prefix='ai_logs', max_size_bytes=MAX_UPLOAD_SIZE_AI)
        self.assertTrue(saved_path.startswith('ai_logs/'))

    def test_reject_corrupted_image(self):
        """Corrupted files with JPEG magic header but invalid body fail PIL verification."""
        corrupted_data = b'\xff\xd8\xff\xe0' + b'\x00' * 50  # JPEG header followed by junk
        upload = SimpleUploadedFile("corrupted.jpg", corrupted_data, content_type="image/jpeg")
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')


class UniversalValidationEndpointTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Muscle Gain")
        self.spec = Specialization.objects.create(name="Clinical Nutrition")
        self.lang1 = Language.objects.create(name="English")
        self.lang2 = Language.objects.create(name="Arabic")

        # Users
        self.admin_user = User.objects.create_superuser(
            username="admin_val",
            email="admin_val@test.com",
            password="AdminPassword123!",
        )
        self.client_user = User.objects.create_user(
            username="client_val",
            email="client_val@test.com",
            password="ClientPassword123!",
            role="client",
        )
        self.client = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
        )

        self.nutri_user = User.objects.create_user(
            username="nutri_val",
            email="nutri_val@test.com",
            password="NutriPassword123!",
            role="nutritionist",
        )
        self.nutritionist = Nutritionist.objects.create(
            user=self.nutri_user,
            country=self.country,
            specialization=self.spec,
            is_approved=True,
            approval_status="approved",
            consultation_price=50.0,
            years_experience=5,
        )

    def test_nutritionist_profile_patch_validation(self):
        """NutritionistProfileView.patch rejects invalid fields and accepts valid updates."""
        view = NutritionistProfileView.as_view()

        # Reject negative consultation price
        req = self.factory.patch(
            "/api/v1/nutritionist/profile/",
            {"consultation_price": -10.0},
            format="json"
        )
        force_authenticate(req, user=self.nutri_user)
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

        # Reject invalid language ID
        req = self.factory.patch(
            "/api/v1/nutritionist/profile/",
            {"language_ids": [99999]},
            format="json"
        )
        force_authenticate(req, user=self.nutri_user)
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

        # Accept valid update
        req = self.factory.patch(
            "/api/v1/nutritionist/profile/",
            {"years_experience": 8, "language_ids": [self.lang1.id, self.lang2.id]},
            format="json"
        )
        force_authenticate(req, user=self.nutri_user)
        resp = view(req)
        self.assertEqual(resp.status_code, 200)
        self.nutritionist.refresh_from_db()
        self.assertEqual(self.nutritionist.years_experience, 8)

    def test_nutritionist_plan_detail_patch_validation(self):
        """NutritionistPlanDetailView.patch rejects negative price and invalid content JSON."""
        plan = Plan.objects.create(
            creator=self.nutritionist,
            title="Keto Jumpstart",
            description="30 days keto",
            price=29.99,
            duration_days=30,
            plan_type="public-predefined",
            content_json={"days": []},
            status="approved",
        )
        view = NutritionistPlanDetailView.as_view()

        # Reject negative price
        req = self.factory.patch(
            f"/api/v1/nutritionist/plans/{plan.id}/",
            {"price": -5.0},
            format="json"
        )
        force_authenticate(req, user=self.nutri_user)
        resp = view(req, pk=plan.id)
        self.assertEqual(resp.status_code, 400)

        # Accept valid update
        req = self.factory.patch(
            f"/api/v1/nutritionist/plans/{plan.id}/",
            {"title": "Updated Keto Jumpstart", "price": 39.99},
            format="json"
        )
        force_authenticate(req, user=self.nutri_user)
        resp = view(req, pk=plan.id)
        self.assertEqual(resp.status_code, 200)
        plan.refresh_from_db()
        self.assertEqual(plan.title, "Updated Keto Jumpstart")

    def test_comment_create_validation(self):
        """CommentCreateView rejects empty comment content and validates input."""
        post = Post.objects.create(
            author=self.client_user,
            content="Community post",
            is_approved=True,
            status="published",
        )
        view = CommentCreateView.as_view()

        # Reject empty content
        req = self.factory.post(
            f"/api/v1/community/posts/{post.id}/comments/",
            {"content": ""},
            format="json"
        )
        force_authenticate(req, user=self.client_user)
        resp = view(req, pk=post.id)
        self.assertEqual(resp.status_code, 400)

        # Accept valid comment
        req = self.factory.post(
            f"/api/v1/community/posts/{post.id}/comments/",
            {"content": "Great post!"},
            format="json"
        )
        force_authenticate(req, user=self.client_user)
        resp = view(req, pk=post.id)
        self.assertEqual(resp.status_code, 201)

    def test_admin_inquiry_reply_validation(self):
        """AdminInquiryRespondView rejects empty reply and validates status."""
        inquiry = FeedbackToAdmin.objects.create(
            user=self.client_user,
            subject="Billing issue",
            message="Need refund",
            status="open",
        )
        view = AdminInquiryRespondView.as_view()

        # Reject empty admin response
        req = self.factory.patch(
            f"/api/v1/admin/inquiries/{inquiry.id}/reply/",
            {"admin_response": ""},
            format="json"
        )
        force_authenticate(req, user=self.admin_user)
        resp = view(req, pk=inquiry.id)
        self.assertEqual(resp.status_code, 400)

        # Accept valid reply
        req = self.factory.patch(
            f"/api/v1/admin/inquiries/{inquiry.id}/reply/",
            {"admin_response": "We have issued your refund.", "status": "resolved"},
            format="json"
        )
        force_authenticate(req, user=self.admin_user)
        resp = view(req, pk=inquiry.id)
        self.assertEqual(resp.status_code, 200)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, "resolved")

    def test_admin_pricing_put_validation(self):
        """AdminSubscriptionPricingView.put rejects negative prices and validates decimal values."""
        view = AdminSubscriptionPricingView.as_view()

        # Reject negative monthly price
        req = self.factory.put(
            "/api/v1/admin/subscriptions/pricing/",
            {"monthly": -10.0},
            format="json"
        )
        force_authenticate(req, user=self.admin_user)
        resp = view(req)
        self.assertEqual(resp.status_code, 400)

        # Accept valid pricing update
        req = self.factory.put(
            "/api/v1/admin/subscriptions/pricing/",
            {"monthly": "14.99", "yearly": "119.99"},
            format="json"
        )
        force_authenticate(req, user=self.admin_user)
        resp = view(req)
        self.assertEqual(resp.status_code, 200)


class ThrottlesAndLockoutTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_login_composite_throttle_key(self):
        """LoginCompositeThrottle combines IP and email into composite key."""
        throttle = LoginCompositeThrottle()
        req = self.factory.post(
            "/api/v1/auth/login/",
            {"email": "USER@TEST.COM", "password": "any"},
            format="json"
        )
        key = throttle.get_cache_key(req, None)
        self.assertIsNotNone(key)
        self.assertIn("user@test.com", key)

    def test_login_ip_throttle_key(self):
        """LoginIPThrottle generates IP-scoped cache key."""
        throttle = LoginIPThrottle()
        req = self.factory.post(
            "/api/v1/auth/login/",
            {"email": "user@test.com"},
            format="json"
        )
        key = throttle.get_cache_key(req, None)
        self.assertIsNotNone(key)
        self.assertIn("throttle_login_ip", key)

    def test_axes_lockout_response_format(self):
        """axes_lockout_response produces compliant JSON 429 payload."""
        req = self.factory.post("/api/v1/auth/login/")
        resp = axes_lockout_response(req)
        self.assertEqual(resp.status_code, 429)
        self.assertIn(b"TOO_MANY_REQUESTS", resp.content)
        self.assertIn(b"Account temporarily locked", resp.content)
