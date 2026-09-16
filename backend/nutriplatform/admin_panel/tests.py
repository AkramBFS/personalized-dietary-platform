from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from admin_panel.models import SubscriptionTierPricing
from community.models import Blog

User = get_user_model()

class SubscriptionPricingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@test.com",
            password="adminpassword123",
            role="admin",
            is_staff=True,
        )
        self.regular_user = User.objects.create_user(
            username="clientuser",
            email="client@test.com",
            password="clientpassword123",
            role="client",
        )

    def test_client_can_fetch_default_subscription_pricing_unauthenticated(self):
        # Client endpoint should be accessible without auth
        response = self.client.get("/api/v1/client/subscriptions/pricing/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("data", response.data)
        self.assertIn("monthly", data)
        self.assertIn("yearly", data)
        self.assertEqual(float(data["monthly"]), 9.99)
        self.assertEqual(float(data["yearly"]), 89.99)

    def test_admin_can_update_subscription_pricing(self):
        self.client.force_authenticate(user=self.admin_user)
        update_payload = {"monthly": 29.99, "yearly": 249.99}
        response = self.client.put("/api/v1/admin/subscriptions/pricing/", update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify through client view as well
        self.client.force_authenticate(user=None)
        client_response = self.client.get("/api/v1/client/subscriptions/pricing/")
        client_data = client_response.data.get("data", client_response.data)
        self.assertEqual(float(client_data["monthly"]), 29.99)
        self.assertEqual(float(client_data["yearly"]), 249.99)

    def test_unauthorized_user_cannot_update_pricing(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put("/api/v1/admin/subscriptions/pricing/", {"monthly": 5.0}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class BlogCategoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="blogadmin",
            email="blogadmin@test.com",
            password="password123",
            role="admin",
            is_staff=True,
        )

    def test_blog_has_category_and_defaults_to_nutrition(self):
        blog = Blog.objects.create(
            admin=self.admin_user,
            title="Healthy Eating Habits",
            content="Eat more greens and fiber.",
        )
        self.assertEqual(blog.category, "Nutrition")

        blog2 = Blog.objects.create(
            admin=self.admin_user,
            title="Mental Resilience",
            content="Mindfulness practices.",
            category="Mental Health",
        )
        self.assertEqual(blog2.category, "Mental Health")
