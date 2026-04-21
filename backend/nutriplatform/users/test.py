from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from client.models import Client, PremiumSubscription
from admin_panel.models import Country, Goal
from django.utils import timezone
import datetime


class AuthTests(TestCase):

    def setUp(self):
        self.client_api = APIClient()
        self.country = Country.objects.create(name='Algeria')
        self.goal    = Goal.objects.create(name='Weight Loss')

    # ── Registration ───────────────────────────────────────────────────────────

    def test_client_registration_success(self):
        response = self.client_api.post('/api/v1/auth/register/client/', {
            'username':   'testclient',
            'email':      'test@client.com',
            'password':   'Test1234!',
            'age':        25,
            'weight':     75,
            'height':     175,
            'gender':     'male',
            'country_id': self.country.id,
            'goal_id':    self.goal.id,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['role'], 'client')

    def test_client_registration_duplicate_email(self):
        User.objects.create_user(
            username='existing', email='existing@test.com', password='Test1234!'
        )
        response = self.client_api.post('/api/v1/auth/register/client/', {
            'username':   'newuser',
            'email':      'existing@test.com',
            'password':   'Test1234!',
            'age':        25,
            'weight':     75,
            'height':     175,
            'gender':     'male',
            'country_id': self.country.id,
            'goal_id':    self.goal.id,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_registration_weak_password(self):
        response = self.client_api.post('/api/v1/auth/register/client/', {
            'username':   'testclient2',
            'email':      'test2@client.com',
            'password':   '123',            # too short
            'age':        25,
            'weight':     75,
            'height':     175,
            'gender':     'male',
            'country_id': self.country.id,
            'goal_id':    self.goal.id,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Login ──────────────────────────────────────────────────────────────────

    def test_login_success(self):
        User.objects.create_user(
            username='loginuser',
            email='login@test.com',
            password='Test1234!',
            role='client'
        )
        response = self.client_api.post('/api/v1/auth/login/', {
            'email':    'login@test.com',
            'password': 'Test1234!',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['data']['tokens'])
        self.assertIn('refresh', response.data['data']['tokens'])

    def test_login_wrong_password(self):
        User.objects.create_user(
            username='loginuser2',
            email='login2@test.com',
            password='Test1234!',
            role='client'
        )
        response = self.client_api.post('/api/v1/auth/login/', {
            'email':    'login2@test.com',
            'password': 'wrongpassword',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_inactive_user(self):
        user = User.objects.create_user(
            username='banneduser',
            email='banned@test.com',
            password='Test1234!',
            role='client',
            is_active=False,
        )
        response = self.client_api.post('/api/v1/auth/login/', {
            'email':    'banned@test.com',
            'password': 'Test1234!',
        }, format='json')

        self.assertNotEqual(response.status_code, status.HTTP_200_OK)

    # ── BMI/BMR Calculation ────────────────────────────────────────────────────

    def test_bmi_bmr_calculated_on_registration(self):
        response = self.client_api.post('/api/v1/auth/register/client/', {
            'username':   'bmrtest',
            'email':      'bmr@test.com',
            'password':   'Test1234!',
            'age':        25,
            'weight':     75,
            'height':     175,
            'gender':     'male',
            'country_id': self.country.id,
            'goal_id':    self.goal.id,
        }, format='multipart')

        self.assertEqual(response.status_code, 201)
        bmi = response.data['data']['client']['bmi']
        bmr = response.data['data']['client']['bmr']
        self.assertIsNotNone(bmi)
        self.assertIsNotNone(bmr)
        # BMI = 75 / (1.75)^2 = 24.49
        self.assertAlmostEqual(bmi, 24.49, delta=0.1)


class PermissionTests(TestCase):

    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Test1234!',
            role='client'
        )
        self.country = Country.objects.create(name='Algeria')
        self.goal    = Goal.objects.create(name='Weight Loss')
        self.client_profile = Client.objects.create(
            user       = self.user,
            age        = 25,
            weight     = 75,
            height     = 175,
            gender     = 'male',
            country    = self.country,
            goal       = self.goal,
        )

    def get_token(self):
        response = self.client_api.post('/api/v1/auth/login/', {
            'email':    'test@test.com',
            'password': 'Test1234!',
        }, format='json')
        return response.data['data']['tokens']['access']

    # ── Profile Access ─────────────────────────────────────────────────────────

    def test_profile_requires_auth(self):
        response = self.client_api.get('/api/v1/client/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_accessible_with_token(self):
        token = self.get_token()
        self.client_api.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client_api.get('/api/v1/client/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ── Premium Gating ─────────────────────────────────────────────────────────

    def test_ai_tracker_blocked_for_non_premium(self):
        token = self.get_token()
        self.client_api.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client_api.post('/api/v1/client/calorie-tracker/ai/', {
            'meal_type': 'lunch',
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ai_tracker_allowed_for_premium(self):
        # Create active subscription
        PremiumSubscription.objects.create(
            client             = self.client_profile,
            plan_type          = 'monthly',
            amount_paid        = 9.99,
            transaction_number = 'TXN-TEST-001',
            start_date         = timezone.now(),
            end_date           = timezone.now() + datetime.timedelta(days=30),
            status             = 'active',
        )
        self.client_profile.is_premium = True
        self.client_profile.save()

        token = self.get_token()
        self.client_api.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        # Just test permission — no real image uploaded
        response = self.client_api.post('/api/v1/client/calorie-tracker/ai/', {
            'meal_type': 'lunch',
        }, format='multipart')
        # 400 means permission passed but image missing — that's correct
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LogoutTests(TestCase):

    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            username='logoutuser',
            email='logout@test.com',
            password='Test1234!',
            role='client'
        )

    def test_logout_blacklists_token(self):
        # Login
        login = self.client_api.post('/api/v1/auth/login/', {
            'email':    'logout@test.com',
            'password': 'Test1234!',
        }, format='json')

        access  = login.data['data']['tokens']['access']
        refresh = login.data['data']['tokens']['refresh']

        # Logout
        self.client_api.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client_api.post('/api/v1/auth/logout/', {
            'refresh': refresh
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Try refresh after logout — should fail
        refresh_response = self.client_api.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh
        }, format='json')

        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)