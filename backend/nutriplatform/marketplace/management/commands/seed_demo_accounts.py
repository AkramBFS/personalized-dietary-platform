import datetime
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from users.models import User
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization
from marketplace.models import Invoice, CheckoutSession


class Command(BaseCommand):
    help = "Seeds demo client and nutritionist accounts for local testing (strictly DEBUG=True only)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--premium',
            action='store_true',
            default=False,
            help='Provision an active premium subscription for the demo client'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='DemoPassword123!',
            help='Password for the demo accounts (default: DemoPassword123!)'
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo_accounts is strictly forbidden when DEBUG is False.")

        with_premium = options['premium']
        password = options['password']
        now = timezone.now()

        # Ensure reference lookup data exists
        country, _ = Country.objects.get_or_create(name="United States")
        goal, _ = Goal.objects.get_or_create(name="Healthy Lifestyle")
        spec, _ = Specialization.objects.get_or_create(name="General Wellness")

        # 1. Demo Nutritionist
        nutri_user, nutri_user_created = User.objects.get_or_create(
            username="demo_nutritionist",
            defaults={
                "email": "demo_nutritionist@nutriplatform.local",
                "role": "nutritionist",
                "is_active": True,
            }
        )
        if nutri_user_created:
            nutri_user.set_password(password)
            nutri_user.save()

        nutri_profile, _ = Nutritionist.objects.get_or_create(
            user=nutri_user,
            defaults={
                "country": country,
                "specialization": spec,
                "years_experience": 5,
                "consultation_price": 50.0,
                "bio": "Demo nutritionist account for test environment.",
                "is_approved": True,
                "approval_status": "approved",
                "rating": 5.0,
            }
        )

        # 2. Demo Client
        client_user, client_user_created = User.objects.get_or_create(
            username="demo_client",
            defaults={
                "email": "demo_client@nutriplatform.local",
                "role": "client",
                "is_active": True,
            }
        )
        if client_user_created:
            client_user.set_password(password)
            client_user.save()

        client_profile, _ = Client.objects.get_or_create(
            user=client_user,
            defaults={
                "country": country,
                "goal": goal,
                "age": 30,
                "weight": 70.0,
                "height": 175.0,
                "gender": "female",
            }
        )

        self.stdout.write(f"Demo nutritionist ready: demo_nutritionist (ID {nutri_profile.nutritionist_id})")
        self.stdout.write(f"Demo client ready: demo_client (ID {client_profile.client_id})")

        # 3. Premium Entitlement handling
        if with_premium:
            end_date = now + datetime.timedelta(days=365)
            txn_num = f"demo_premium_txn_{client_user.id}"
            sub, sub_created = PremiumSubscription.objects.update_or_create(
                client=client_profile,
                defaults={
                    "plan_type": "monthly",
                    "amount_paid": 19.99,
                    "transaction_number": txn_num,
                    "status": "active",
                    "start_date": now,
                    "end_date": end_date,
                }
            )

            # Ensure corresponding Invoice and CheckoutSession exist for audit verification
            Invoice.objects.update_or_create(
                transaction_number=txn_num,
                defaults={
                    "client": client_profile,
                    "nutritionist": nutri_profile,
                    "total_paid": 19.99,
                    "item_type": "subscription",
                    "status": "paid",
                    "created_at": now,
                }
            )

            CheckoutSession.objects.update_or_create(
                payment_intent_id=f"pi_demo_premium_{client_user.id}",
                defaults={
                    "user": client_user,
                    "item_type": "SUBSCRIPTION",
                    "item_id": 1,
                    "resolved_price": 19.99,
                    "currency": "USD",
                    "status": "confirmed",
                    "created_at": now,
                    "expires_at": end_date,
                    "metadata": {"demo_seeded": True, "transaction_number": txn_num},
                }
            )
            self.stdout.write(f"Provisioned active PremiumSubscription (ID {sub.id}, expires {end_date.date()}).")
        else:
            self.stdout.write("Created standard (non-premium) demo accounts.")

        # 4. Demo Admin
        admin_user, admin_user_created = User.objects.get_or_create(
            username="demo_admin",
            defaults={
                "email": "demo_admin@nutriplatform.local",
                "role": "high_admin",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if admin_user_created:
            admin_user.set_password(password)
            admin_user.save()
        self.stdout.write(f"Demo admin ready: demo_admin (ID {admin_user.id})")
