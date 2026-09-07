from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated 
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .serializers import (
    RegisterClientSerializer,
    RegisterNutritionistSerializer,
    LoginSerializer,
    LogoutSerializer,
    get_tokens_for_user,
)


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class RegisterClientView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = RegisterClientSerializer(data=request.data)
        if serializer.is_valid():
            user, client = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                "status": "success",
                "data": {
                    "user": {
                        "id":       user.id,
                        "username": user.username,
                        "email":    user.email,
                        "role":     user.role,
                    },
                    "tokens": tokens,
                    "client": {
                        "client_id": client.client_id,
                        "bmi":       client.bmi,
                        "bmr":       client.bmr,
                    }
                }
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Validation failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class RegisterNutritionistView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            serializer = RegisterNutritionistSerializer(data=request.data)

            if serializer.is_valid():
                print("✅ Serializer valid")

                user, nutritionist = serializer.save()
                print("✅ Saved user & nutritionist")

                # 👇 comment this if still present
                # tokens = get_tokens_for_user(user)

                print("✅ Before response")

                return Response({
                    "status": "success",
                    "data": {
                        "user": {
                            "id": user.id,
                            "role": user.role,
                        },
                        "nutritionist": {
                            "nutritionist_id": nutritionist.nutritionist_id,
                            "approval_status": nutritionist.approval_status,
                            "rating": nutritionist.rating,
                        }
                    }
                }, status=status.HTTP_201_CREATED)

            print("❌ Validation failed")
            return Response({
                "errors": serializer.errors
            }, status=400)

        except Exception as e:
            print("💥 ERROR:", str(e))
            return Response({"error": str(e)}, status=500)

class LoginView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [JSONParser, FormParser]
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            return Response({
                "status": "success",
                "data": {
                    "tokens": tokens,
                    "user": {
                        "id":        user.id,
                        "email":     user.email,
                        "role":      user.role,
                        "is_active": user.is_active,
                    }
                }
            }, status=status.HTTP_200_OK)

        # Check if error is an account approval restriction
        errors = serializer.errors
        code = None
        detail = None
        rejection_reason = None

        if isinstance(errors, dict):
            if 'code' in errors:
                c = errors['code']
                code = c[0] if isinstance(c, list) else c
                d = errors.get('detail', [])
                detail = d[0] if isinstance(d, list) else d
                r = errors.get('rejection_reason', [])
                rejection_reason = r[0] if isinstance(r, list) else r
            elif 'non_field_errors' in errors:
                nfe = errors['non_field_errors']
                if nfe and isinstance(nfe[0], dict):
                    code = nfe[0].get('code')
                    detail = nfe[0].get('detail')
                    rejection_reason = nfe[0].get('rejection_reason')

        if code in ['ACCOUNT_PENDING', 'ACCOUNT_REJECTED']:
            return Response({
                "status": "error",
                "message": str(detail) if detail else f"Account approval {code.replace('ACCOUNT_', '').lower()}.",
                "code": str(code),
                "rejection_reason": rejection_reason
            }, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "status": "error",
            "message": "Invalid credentials",
            "errors": serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "message": "Logged out successfully."},
                status=status.HTTP_204_NO_CONTENT
            )

        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)