from rest_framework import serializers
from .models import Post, Comment, Blog


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = Comment
        fields = ['id', 'username', 'content', 'post']
        read_only_fields = ['id', 'post']


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    comments        = CommentSerializer(many=True, read_only=True, source='comment_set')

    class Meta:
        model  = Post
        fields = [
            'id', 'author_username',
            'content', 'image_url',
            'status', 'is_approved',
            'created_at', 'comments',
        ]
        read_only_fields = ['id', 'status', 'is_approved', 'created_at']


class CreatePostSerializer(serializers.Serializer):
    content = serializers.CharField()
    image   = serializers.ImageField(required=False)


class BlogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)

    class Meta:
        model  = Blog
        fields = ['id', 'admin_username', 'title', 'content', 'created_at']
        read_only_fields = ['id', 'admin_username', 'created_at']