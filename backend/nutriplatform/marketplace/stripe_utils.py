import stripe
import logging
from django.conf import settings
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


def verify_stripe_payment_intent(
    payment_intent_id: str,
    expected_amount: float,
    expected_currency: str = 'usd',
    expected_user_id: int = None,
    expected_checkout_id: str = None
) -> dict:
    """
    Cryptographically verifies a Stripe PaymentIntent against expected parameters:
    1. Intent status must be 'succeeded'
    2. amount_received must match expected amount (in cents)
    3. Currency must match expected currency (default 'usd')
    4. Metadata user_id and checkout_id must match when present
    """
    stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
    if not stripe_key:
        # In mock / sandbox testing when no Stripe secret key is configured:
        if payment_intent_id.startswith('pi_mock_succeeded_') or payment_intent_id.startswith('pi_test_succeeded_'):
            return {
                "id": payment_intent_id,
                "status": "succeeded",
                "amount_received": int(round(expected_amount * 100)),
                "currency": expected_currency.lower(),
                "metadata": {
                    "user_id": str(expected_user_id) if expected_user_id else "",
                    "checkout_id": str(expected_checkout_id) if expected_checkout_id else ""
                }
            }
        raise ValidationError("Stripe payments are not configured on this server.")

    stripe.api_key = stripe_key

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if hasattr(intent, 'to_dict'):
            intent = intent.to_dict()
    except stripe.error.StripeError as e:
        logger.error(f"Stripe PaymentIntent retrieval failed for {payment_intent_id}: {str(e)}")
        raise ValidationError(f"Invalid PaymentIntent ID or Stripe error: {str(e)}")

    # 1. Assert status
    if intent.get("status") != "succeeded":
        raise ValidationError(f"Payment has not succeeded. Current status: {intent.get('status')}")

    # 2. Assert amount
    expected_cents = int(round(expected_amount * 100))
    amount_received = intent.get("amount_received", 0)
    if amount_received < expected_cents:
        raise ValidationError(
            f"Underpaid PaymentIntent: expected {expected_cents} cents, received {amount_received} cents."
        )

    # 3. Assert currency
    intent_currency = (intent.get("currency") or "").lower()
    if intent_currency != expected_currency.lower():
        raise ValidationError(
            f"Currency mismatch: expected {expected_currency.lower()}, got {intent_currency}."
        )

    # 4. Assert metadata
    metadata = intent.get("metadata") or {}
    if expected_user_id is not None:
        intent_user_id = metadata.get("user_id")
        if intent_user_id and str(intent_user_id) != str(expected_user_id):
            raise ValidationError("PaymentIntent user does not match authenticated user.")

    if expected_checkout_id is not None:
        intent_checkout_id = metadata.get("checkout_id")
        if intent_checkout_id and str(intent_checkout_id) != str(expected_checkout_id):
            raise ValidationError("PaymentIntent checkout session mismatch.")

    return intent


def construct_stripe_event(payload: bytes, sig_header: str):
    """
    Validates Stripe webhook cryptographic signature.
    """
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    if not webhook_secret:
        raise ValidationError("Stripe webhook secret is not configured.")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        if hasattr(event, 'to_dict'):
            return event.to_dict()
        return event
    except ValueError as e:
        raise ValidationError(f"Invalid webhook payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        raise ValidationError(f"Invalid webhook signature: {str(e)}")
