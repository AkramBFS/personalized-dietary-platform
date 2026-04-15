from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.core.files.storage import default_storage

from users.permissions import IsClient
from .models import Post, Comment, Blog
from .serializers import (
    PostSerializer,
    CreatePostSerializer,
    CommentSerializer,
    BlogSerializer,
)


# ── Public Posts ───────────────────────────────────────────────────────────────

class PostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        posts = Post.objects.filter(
            is_approved=True,
            status='published'
        ).select_related('author').order_by('-created_at')

        serializer = PostSerializer(posts, many=True)
        return Response({"status": "success", "data": serializer.data})


# ── Client Posts ───────────────────────────────────────────────────────────────

class ClientPostCreateView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request):
        serializer = CreatePostSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        # Handle image upload
        image     = request.FILES.get('image')
        image_url = None
        if image:
            path      = default_storage.save(f'posts/{request.user.id}_{image.name}', image)
            image_url = path

        post = Post.objects.create(
            author    = request.user,
            content   = serializer.validated_data['content'],
            image_url = image_url,
            status    = 'draft',       # enters moderation queue
            is_approved = False,
        )

        return Response({
            "status":  "success",
            "message": "Post submitted for moderation.",
            "data":    PostSerializer(post).data
        }, status=201)


class ClientPostListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        posts = Post.objects.filter(
            author=request.user
        ).order_by('-created_at')

        serializer = PostSerializer(posts, many=True)
        return Response({"status": "success", "data": serializer.data})


class ClientPostDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def delete(self, request, pk):
        try:
            post = Post.objects.get(id=pk, author=request.user)
        except Post.DoesNotExist:
            return Response({"status": "error", "message": "Post not found."}, status=404)

        post.delete()
        return Response({"status": "success", "message": "Post deleted."}, status=204)


# ── Comments ───────────────────────────────────────────────────────────────────

class CommentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(id=pk, is_approved=True)
        except Post.DoesNotExist:
            return Response({"status": "error", "message": "Post not found."}, status=404)

        content = request.data.get('content')
        if not content:
            return Response({"status": "error", "message": "content is required."}, status=400)

        comment = Comment.objects.create(
            post    = post,
            user    = request.user,
            content = content,
        )

        return Response({
            "status": "success",
            "data":   CommentSerializer(comment).data
        }, status=201)


# ── Blog ───────────────────────────────────────────────────────────────────────

class BlogListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        blogs = Blog.objects.select_related('admin').order_by('-created_at')
        serializer = BlogSerializer(blogs, many=True)
        return Response({"status": "success", "data": serializer.data})


class BlogDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            blog = Blog.objects.get(id=pk)
        except Blog.DoesNotExist:
            return Response({"status": "error", "message": "Blog not found."}, status=404)

        serializer = BlogSerializer(blog)
        return Response({"status": "success", "data": serializer.data})