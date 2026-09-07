import logging
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from groq import Groq

from .knowledge import PLATFORM_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def sanitize_context_str(val, max_len: int = 120) -> str:
    """
    Sanitize user variables before prompt injection.
    Strips control characters, newlines, tabs, and braces to prevent prompt jailbreaks.
    """
    if not val:
        return "Not set"
    clean = re.sub(r'[\r\n\t]+', ' ', str(val))
    clean = clean.replace('{', '').replace('}', '').strip()
    return clean[:max_len].strip() or "Not set"


class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()

        if not message:
            return Response({
                "status":  "error",
                "message": "message is required."
            }, status=400)

        if len(message) > 500:
            return Response({
                "status":  "error",
                "message": "Message too long. Maximum 500 characters."
            }, status=400)

        # Build sanitized user context
        user         = request.user
        role_clean   = sanitize_context_str(getattr(user, 'role', 'client'))
        user_clean   = sanitize_context_str(getattr(user, 'username', ''))
        user_context = f"\n\n## CURRENT USER\n- Role: {role_clean}\n- Username: {user_clean}"

        if getattr(user, 'role', None) == 'client':
            try:
                client = user.client
                goal_val = client.goal.name if getattr(client, 'goal', None) else 'Not set'
                user_context += f"\n- Goal: {sanitize_context_str(goal_val)}"
                user_context += f"\n- Premium: {'Yes' if getattr(client, 'is_premium', False) else 'No'}"
                user_context += f"\n- Diet: {sanitize_context_str(getattr(client, 'diet', None))}"
                user_context += f"\n- Activity Level: {sanitize_context_str(getattr(client, 'activity_level', None))}"
                if getattr(client, 'health_history', None):
                    user_context += f"\n- Health History: {sanitize_context_str(client.health_history)}"
            except Exception as ctx_err:
                logger.debug("Failed extracting client context: %s", ctx_err)

        try:
            groq_key = getattr(settings, 'GROQ_API_KEY', None)
            if not groq_key:
                raise ValueError("GROQ_API_KEY is not configured")

            client_groq = Groq(api_key=groq_key, timeout=10.0, max_retries=2)
            MODELS_TO_TRY = [
                "llama-3.1-8b-instant",
                "llama-3.3-70b-versatile",
                "llama3-70b-8192",
                "mixtral-8x7b-32768"
            ]

            messages = [
                {
                    "role":    "system",
                    "content": PLATFORM_SYSTEM_PROMPT + user_context
                },
                {
                    "role":    "user",
                    "content": message
                }
            ]

            reply = None
            for model_name in MODELS_TO_TRY:
                try:
                    response = client_groq.chat.completions.create(
                        model       = model_name,
                        messages    = messages,
                        max_tokens  = 500,
                        temperature = 0.7,
                    )
                    reply = response.choices[0].message.content.strip()
                    break
                except Exception as model_err:
                    logger.warning(f"Model {model_name} failed: {model_err}")
                    continue

            if not reply:
                raise RuntimeError("All LLM model providers failed")

        except Exception as e:
            logger.exception("Chatbot provider error: %s", e)
            return Response({
                "status":  "error",
                "message": "AI assistant is temporarily unavailable. Please try again shortly.",
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            "status": "success",
            "data": {
                "reply": reply,
                "role":  "assistant",
            }
        })