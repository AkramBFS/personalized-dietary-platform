from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated 
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status

from .serializers import (
    RegisterClientSerializer,
    RegisterNutritionistSerializer,
    LoginSerializer,
    LogoutSerializer,
    get_tokens_for_user,
)


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

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user   = serializer.validated_data['user']
            if user.role == 'nutritionist' and not user.nutritionist.is_approved:
                return Response({
                "error": "Your account is not approved yet."
                }, status=403)
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