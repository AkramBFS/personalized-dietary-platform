from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from groq import Groq

from .knowledge import PLATFORM_SYSTEM_PROMPT


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

        # Build user context
        user         = request.user
        user_context = f"\n\n## CURRENT USER\n- Role: {user.role}\n- Username: {user.username}"

        if user.role == 'client':
            try:
                client = user.client
                user_context += f"\n- Goal: {client.goal.name if client.goal else 'Not set'}"
                user_context += f"\n- Premium: {'Yes' if client.is_premium else 'No'}"
                user_context += f"\n- Diet: {client.diet or 'Not set'}"
                user_context += f"\n- Activity Level: {client.activity_level or 'Not set'}"
            except Exception:
                pass

        try:
            client_groq = Groq(api_key=settings.GROQ_API_KEY)

            response = client_groq.chat.completions.create(
                model    = "llama-3.1-8b-instant",  # free, fast, smart
                messages = [
                    {
                        "role":    "system",
                        "content": PLATFORM_SYSTEM_PROMPT + user_context
                    },
                    {
                        "role":    "user",
                        "content": message
                    }
                ],
                max_tokens  = 500,
                temperature = 0.7,
            )

            reply = response.choices[0].message.content.strip()

        except Exception as e:
            return Response({
                "status":  "error",
                "message": str(e),
            }, status=503)

        return Response({
            "status": "success",
            "data": {
                "reply": reply,
                "role":  "assistant",
            }
        })