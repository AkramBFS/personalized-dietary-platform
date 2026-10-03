from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from users.models import User
from client.models import Client, PremiumSubscription


class Command(BaseCommand):
    help = "Seeds N premium client users for concurrency and load testing."

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of load test clients to create (default: 20)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='LoadTest123!',
            help='Password for the created users'
        )
        parser.add_argument(
            '--export-tokens',
            type=str,
            default=None,
            help='Optional path to export JWT access tokens JSON file'
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not getattr(settings, "ALLOW_TEST_SEEDING", False):
            raise CommandError("seed_loadtest_users can only be executed when DEBUG=True or ALLOW_TEST_SEEDING=True.")

        count = options['count']
        password = options['password']
        now = timezone.now()
        end_date = now + timedelta(days=60)

        created_count = 0
        updated_count = 0

        for i in range(1, count + 1):
            email = f"loadtest_user_{i}@nutriplatform.local"
            username = f"loadtest_user_{i}"

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'role': 'client',
                    'is_active': True,
                }
            )

            if created:
                user.set_password(password)
                user.save()
                created_count += 1
            else:
                user.role = 'client'
                user.is_active = True
                user.set_password(password)
                user.save()
                updated_count += 1

            client, _ = Client.objects.get_or_create(
                user=user,
                defaults={
                    'is_premium': True,
                    'is_banned': False,
                    'age': 30,
                    'weight': 70.0,
                    'height': 175.0,
                }
            )
            client.is_premium = True
            client.is_banned = False
            client.save()

            sub, _ = PremiumSubscription.objects.get_or_create(
                client=client,
                defaults={
                    'status': 'active',
                    'plan_type': 'annual_pro',
                    'amount_paid': 99.0,
                    'transaction_number': f"sim_loadtest_{client.client_id}_{now.timestamp()}",
                    'end_date': end_date,
                }
            )
            sub.status = 'active'
            sub.end_date = end_date
            sub.save()

        if options.get('export_tokens'):
            import json
            from rest_framework_simplejwt.tokens import RefreshToken
            tokens = []
            for i in range(1, count + 1):
                email = f"loadtest_user_{i}@nutriplatform.local"
                u = User.objects.get(email=email)
                refresh = RefreshToken.for_user(u)
                tokens.append(str(refresh.access_token))
            out_path = options['export_tokens']
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump({"tokens": tokens}, f, indent=2)
            self.stdout.write(f"Exported {len(tokens)} JWT access tokens to {out_path}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {count} load test users ({created_count} created, {updated_count} refreshed). "
                f"Default password: {password}"
            )
        )
