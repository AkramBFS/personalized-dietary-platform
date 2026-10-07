import datetime
import logging
import stripe
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from marketplace.models import CheckoutSession, Consultation

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Cancels expired checkout sessions, stale consultation holds, and abandoned Stripe PaymentIntents."

    def handle(self, *args, **options):
        now = timezone.now()
        stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        if stripe_key:
            stripe.api_key = stripe_key

        # 1. Expire stale pending consultation holds (> 15 min old)
        stale_threshold = now - datetime.timedelta(minutes=15)
        stale_holds = Consultation.objects.filter(
            status='pending_payment',
            created_at__lt=stale_threshold
        )
        cancelled_holds_count = stale_holds.update(status='cancelled')
        self.stdout.write(f"Cancelled {cancelled_holds_count} stale consultation hold(s).")

        # 2. Find expired pending checkout sessions
        expired_sessions = CheckoutSession.objects.filter(
            status='pending',
            expires_at__lt=now
        )
        expired_count = 0
        cancelled_pi_count = 0

        for session in expired_sessions:
            # Safely handle associated Stripe PaymentIntent if present
            if session.payment_intent_id and stripe_key:
                try:
                    intent = stripe.PaymentIntent.retrieve(session.payment_intent_id)
                    if getattr(intent, 'status', '') == 'succeeded':
                        # Intent just succeeded; fulfill rather than cancel!
                        from marketplace.services.fulfillment import fulfill_checkout_session
                        fulfill_checkout_session(
                            str(session.checkout_id),
                            session.payment_intent_id,
                            session.resolved_price,
                            source='cleanup_job'
                        )
                        self.stdout.write(f"Fulfilled recently succeeded checkout {session.checkout_id}.")
                        continue
                    elif getattr(intent, 'status', '') == 'processing':
                        # Intent is currently processing; leave session pending and do not cancel
                        self.stdout.write(
                            f"PaymentIntent {session.payment_intent_id} is processing; leaving session {session.checkout_id} pending."
                        )
                        continue
                    elif intent.status in ('requires_payment_method', 'requires_confirmation', 'requires_action'):
                        stripe.PaymentIntent.cancel(session.payment_intent_id)
                        cancelled_pi_count += 1
                except Exception as e:
                    logger.warning(
                        f"[Cleanup] Could not inspect/cancel PaymentIntent {session.payment_intent_id} on Stripe: {e}"
                    )

            session.status = 'expired'
            session.save(update_fields=['status'])
            expired_count += 1

        self.stdout.write(
            f"Expired {expired_count} checkout session(s); cancelled {cancelled_pi_count} PaymentIntent(s) on Stripe."
        )
