from django.urls import path
from .views import CountryListView, GoalListView, SpecializationListView

from nutritionist.views_admin import (
    PendingNutritionistListView,
    NutritionistDetailAdminView,
    ApproveNutritionistView,
    RejectNutritionistView,
    ReReviewNutritionistView,
)
from django.urls import path
from .views import (
    CountryListView,
    GoalListView,
    SpecializationListView,
    LanguageListView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserBanView,
    AdminUserDeleteView,
    AdminPlanListView,
    AdminPlanDetailView,
    AdminPlanApproveView,
    AdminPlanRejectView,
    AdminPlanArchiveView,
    AdminPostListView,
    AdminPostApproveView,
    AdminPostRejectView,
    AdminPostDeleteView,
    AdminBlogCreateView,
    AdminBlogUpdateView,
    AdminBlogDeleteView,
    SubscriptionStatusView,
    SubscriptionPurchaseView,
    AdminInquiryListView,
    AdminInquiryDetailView,
    AdminInquiryRespondView,
    ActivityLevelListView,
    DietListView,
)

urlpatterns = [
    path('countries/',       CountryListView.as_view(),       name='countries'),
    path('goals/',           GoalListView.as_view(),          name='goals'),
    path('specializations/', SpecializationListView.as_view(),name='specializations'),
    path('languages/',       LanguageListView.as_view(),      name='languages'),
    path('nutritionists/pending/',          PendingNutritionistListView.as_view()),
    path('nutritionists/<int:pk>/',         NutritionistDetailAdminView.as_view()),
    path('nutritionists/<int:pk>/approve/', ApproveNutritionistView.as_view()),
    path('nutritionists/<int:pk>/reject/',  RejectNutritionistView.as_view()),
    path('nutritionists/<int:pk>/re-review/', ReReviewNutritionistView.as_view()),
    # ── Admin User Management ──────────────────────────────────────────────────
    path('admin/users/',              AdminUserListView.as_view(),   name='admin-users'),
    path('admin/users/<int:pk>/',     AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/ban/', AdminUserBanView.as_view(),    name='admin-user-ban'),
    path('admin/users/<int:pk>/delete/', AdminUserDeleteView.as_view(), name='admin-user-delete'),

    # ── Plan Moderation ────────────────────────────────────────────────────────
    path('admin/plans/',                      AdminPlanListView.as_view(),    name='admin-plans'),
    path('admin/plans/<int:pk>/',             AdminPlanDetailView.as_view(),  name='admin-plan-detail'),
    path('admin/plans/<int:pk>/approve/',     AdminPlanApproveView.as_view(), name='admin-plan-approve'),
    path('admin/plans/<int:pk>/reject/',      AdminPlanRejectView.as_view(),  name='admin-plan-reject'),
    path('admin/plans/<int:pk>/archive/',     AdminPlanArchiveView.as_view(), name='admin-plan-archive'),

    # ── Post Moderation ────────────────────────────────────────────────────────
    path('admin/posts/',                      AdminPostListView.as_view(),    name='admin-posts'),
    path('admin/posts/<int:pk>/approve/',     AdminPostApproveView.as_view(), name='admin-post-approve'),
    path('admin/posts/<int:pk>/reject/',      AdminPostRejectView.as_view(),  name='admin-post-reject'),
    path('admin/posts/<int:pk>/',             AdminPostDeleteView.as_view(),  name='admin-post-delete'),

    # ── Blog ───────────────────────────────────────────────────────────────────
    path('admin/blog/',              AdminBlogCreateView.as_view(), name='admin-blog-create'),
    path('admin/blog/<int:pk>/',     AdminBlogUpdateView.as_view(), name='admin-blog-update'),
    path('admin/blog/<int:pk>/delete/', AdminBlogDeleteView.as_view(), name='admin-blog-delete'),

    # ── Subscriptions ──────────────────────────────────────────────────────────
    path('client/subscriptions/',          SubscriptionStatusView.as_view(),   name='subscription-status'),
    path('client/subscriptions/purchase/', SubscriptionPurchaseView.as_view(), name='subscription-purchase'),

    
    path('admin/inquiries/',                     AdminInquiryListView.as_view(),    name='admin-inquiries'),
    path('admin/inquiries/<int:pk>/',            AdminInquiryDetailView.as_view(),  name='admin-inquiry-detail'),
    path('admin/inquiries/<int:pk>/respond/',    AdminInquiryRespondView.as_view(), name='admin-inquiry-respond'),

    path('activity-levels/', ActivityLevelListView.as_view(), name='activity-levels'),
    path('diets/',           DietListView.as_view(),          name='diets'),
]




