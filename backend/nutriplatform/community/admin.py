from django.contrib import admin
from .models import Post, Comment, Blog, FeedbackToAdmin
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Blog)
admin.site.register(FeedbackToAdmin)