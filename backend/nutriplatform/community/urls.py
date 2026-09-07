from django.urls import path
from .views import (
    PostListView,
    ClientPostCreateView,
    ClientPostListView,
    ClientPostDeleteView,
    CommentCreateView,
    BlogListView,
    BlogDetailView,
)

urlpatterns = [
    # Public
    path('posts/',                   PostListView.as_view(),         name='posts-public'),
    path('posts/<int:pk>/comments/', CommentCreateView.as_view(),    name='post-comment'),
    path('blog/',                    BlogListView.as_view(),         name='blog-list'),
    path('blog/<int:pk>/',           BlogDetailView.as_view(),       name='blog-detail'),

    # Client
    path('client/posts/',            ClientPostCreateView.as_view(), name='post-create'),
    path('client/posts/mine/',       ClientPostListView.as_view(),   name='posts-mine'),
    path('client/posts/<int:pk>/',   ClientPostDeleteView.as_view(), name='post-delete'),
]