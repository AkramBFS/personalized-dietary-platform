from django.db import models
from users.models import User


class Post(models.Model):
    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('published', 'Published'),
        ('removed',   'Removed'),
    ]

    author      = models.ForeignKey(User, on_delete=models.CASCADE, db_column='author_id')
    content     = models.TextField(null=True, blank=True)
    image_url   = models.CharField(max_length=255, null=True, blank=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_approved = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'posts'

    def __str__(self):
        return f"Post #{self.id} by {self.author.username}"


class Comment(models.Model):
    post    = models.ForeignKey(Post, on_delete=models.CASCADE, db_column='post_id')
    user    = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    content = models.TextField()

    class Meta:
        db_table = 'comments'


class Blog(models.Model):
    admin      = models.ForeignKey(User, on_delete=models.CASCADE, db_column='admin_id')
    title      = models.CharField(max_length=255, null=True, blank=True)
    content    = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blogs'


class FeedbackToAdmin(models.Model):
    STATUS_CHOICES = [
        ('open',     'Open'),
        ('resolved', 'Resolved'),
    ]

    user           = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    subject        = models.CharField(max_length=255, null=True, blank=True)
    message        = models.TextField(null=True, blank=True)
    admin_response = models.TextField(null=True, blank=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback_to_admin'