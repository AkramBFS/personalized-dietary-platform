import logging
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.conf import settings
from client.models import Client, PremiumSubscription
from marketplace.models import UserPlan, Plan, Invoice, CheckoutSession

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Audits and purges unearned entitlements (UserPlan and PremiumSubscription) created without verified payment."

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            default=False,
            help='Execute actual revocation. Defaults to dry-run mode.'
        )
        parser.add_argument(
            '--approved-sub-ids',
            type=str,
            default='',
            help='Comma-separated IDs of admin-approved PremiumSubscription rows to exempt.'
        )
        parser.add_argument(
            '--approved-plan-ids',
            type=str,
            default='',
            help='Comma-separated IDs of admin-approved UserPlan rows to exempt.'
        )

    def verify_stripe_payment(self, payment_ref, expected_cents, user_id=None):
        """
        Cryptographically verifies payment against Stripe API when keys are configured.
        Treats unverified string prefixes as invalid.
        """
        stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        if not stripe_key or not payment_ref or not payment_ref.startswith('pi_'):
            return False

        try:
            import stripe
            stripe.api_key = stripe_key
            intent = stripe.PaymentIntent.retrieve(payment_ref)
            if getattr(intent, 'status', None) != 'succeeded':
                return False
            if getattr(intent, 'amount_received', 0) < expected_cents:
                return False
            if user_id is not None:
                meta = getattr(intent, 'metadata', {}) or {}
                if 'user_id' in meta and str(meta['user_id']) != str(user_id):
                    return False
            return True
        except Exception as e:
            logger.warning(f"[Audit] Stripe verification failed for {payment_ref}: {e}")
            return False

    def handle(self, *args, **options):
        dry_run = not options['apply']
        mode_label = "[DRY-RUN]" if dry_run else "[APPLYING CHANGES]"
        self.stdout.write(f"--- Running unearned entitlements cleanup {mode_label} ---")

        # Parse approved IDs from CLI
        approved_sub_ids = set()
        if options['approved_sub_ids']:
            approved_sub_ids = {int(x.strip()) for x in options['approved_sub_ids'].split(',') if x.strip().isdigit()}

        approved_plan_ids = set()
        if options['approved_plan_ids']:
            approved_plan_ids = {int(x.strip()) for x in options['approved_plan_ids'].split(',') if x.strip().isdigit()}

        has_stripe = bool(getattr(settings, 'STRIPE_SECRET_KEY', ''))
        self.stdout.write(f"Stripe API Verification: {'ACTIVE' if has_stripe else 'UNAVAILABLE (treating unverified pi_* as unverified)'}")

        # Execute inside transaction with transaction-local RLS staff context
        with transaction.atomic():
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SET LOCAL app.is_staff = 'true';")

            # ── Diagnostic Breakdown ──────────────────────────────────────────
            total_db_subs = PremiumSubscription.objects.count()
            total_db_plans = UserPlan.objects.count()
            distinct_plan_types = list(Plan.objects.values_list('plan_type', flat=True).distinct())

            # Analyze distinct transaction number patterns
            inv_patterns = set()
            for inv in Invoice.objects.all():
                txn = inv.transaction_number or ""
                if txn.startswith('pi_'):
                    inv_patterns.add('pi_* (Stripe)')
                elif txn.startswith('MEALPLAN-'):
                    inv_patterns.add('MEALPLAN-* (Bypass Token)')
                elif txn.startswith('TXg-'):
                    inv_patterns.add('TXg-* (Legacy Mock)')
                elif not txn:
                    inv_patterns.add('<empty>')
                else:
                    inv_patterns.add(txn.split('-')[0] + '-*' if '-' in txn else 'custom_string')

            self.stdout.write(f"\n[DIAGNOSTIC CENSUS]")
            self.stdout.write(f"  Total PremiumSubscription rows: {total_db_subs}")
            self.stdout.write(f"  Total UserPlan rows:            {total_db_plans}")
            self.stdout.write(f"  Distinct plan_type values:      {distinct_plan_types}")
            self.stdout.write(f"  Invoice transaction patterns:   {sorted(list(inv_patterns))}\n")

            # ── 1. Audit Premium Subscriptions ────────────────────────────────
            total_subs = 0
            kept_subs_admin = 0
            kept_subs_verified = 0
            revoked_subs = 0

            for sub in PremiumSubscription.objects.select_related('client__user').all():
                total_subs += 1
                txn = sub.transaction_number or ""

                if sub.id in approved_sub_ids:
                    kept_subs_admin += 1
                    continue

                # Verified Stripe payment verification
                is_verified = False
                expected_cents = 1999  # standard tier
                if self.verify_stripe_payment(txn, expected_cents, sub.client.user.id):
                    is_verified = True
                else:
                    # Check confirmed CheckoutSession
                    cs = CheckoutSession.objects.filter(
                        user=sub.client.user,
                        item_type='SUBSCRIPTION',
                        status='confirmed'
                    ).first()
                    if cs and self.verify_stripe_payment(cs.payment_intent_id, expected_cents, sub.client.user.id):
                        is_verified = True

                if is_verified:
                    kept_subs_verified += 1
                    continue

                # Unearned subscription detected
                revoked_subs += 1
                if not dry_run:
                    sub.status = 'cancelled'
                    sub.save(update_fields=['status'])
                    if not PremiumSubscription.objects.filter(client=sub.client, status='active').exclude(id=sub.id).exists():
                        sub.client.is_premium = False
                        sub.client.save(update_fields=['is_premium'])

            self.stdout.write(
                f"Subscriptions: Total {total_subs} | Kept Admin: {kept_subs_admin} | "
                f"Kept Verified: {kept_subs_verified} | {'Would Revoke' if dry_run else 'Revoked'}: {revoked_subs}"
            )

            # ── 2. Audit User Plans ───────────────────────────────────────────
            total_plans = 0
            kept_plans_creator = 0
            kept_plans_verified = 0
            revoked_plans = 0

            for up in UserPlan.objects.select_related('client__user', 'plan__creator__user').all():
                total_plans += 1

                if up.id in approved_plan_ids:
                    kept_plans_verified += 1
                    continue

                # Free plan or private-custom assigned directly by patient's nutritionist with price $0
                is_free_custom = (
                    up.plan.plan_type != 'public-predefined'
                    and float(up.plan.price or 0.0) <= 0.0
                    and up.plan.creator is not None
                )
                if is_free_custom:
                    kept_plans_creator += 1
                    continue

                # If public plan is free:
                if float(up.plan.price or 0.0) <= 0.0:
                    kept_plans_verified += 1
                    continue

                # Paid plan: requires verified payment
                is_plan_verified = False
                expected_cents = int(round(float(up.plan.price) * 100))

                # Check invoice with verified Stripe payment
                invoices = Invoice.objects.filter(
                    client=up.client,
                    item_type='plan',
                    status='paid'
                )
                for inv in invoices:
                    if self.verify_stripe_payment(inv.transaction_number, expected_cents, up.client.user.id):
                        is_plan_verified = True
                        break

                if not is_plan_verified:
                    cs = CheckoutSession.objects.filter(
                        user=up.client.user,
                        item_type='MEAL_PLAN',
                        item_id=up.plan.id,
                        status='confirmed'
                    ).first()
                    if cs and self.verify_stripe_payment(cs.payment_intent_id, expected_cents, up.client.user.id):
                        is_plan_verified = True

                if is_plan_verified:
                    kept_plans_verified += 1
                    continue

                # Unearned plan detected
                revoked_plans += 1
                if not dry_run:
                    up.status = 'cancelled'
                    up.save(update_fields=['status'])

            self.stdout.write(
                f"User Plans:    Total {total_plans} | Kept Custom/Free: {kept_plans_creator} | "
                f"Kept Verified: {kept_plans_verified} | {'Would Revoke' if dry_run else 'Revoked'}: {revoked_plans}\n"
            )

            if dry_run:
                self.stdout.write("Run with --apply to commit revocation changes.")
            else:
                self.stdout.write("Revocation completed successfully.")
