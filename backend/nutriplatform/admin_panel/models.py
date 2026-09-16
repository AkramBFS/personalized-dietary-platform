from django.db import models


class Country(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'countries'

    def __str__(self):
        return self.name


class Goal(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'goals'

    def __str__(self):
        return self.name


class Specialization(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'specializations'

    def __str__(self):
        return self.name


class SubscriptionTierPricing(models.Model):
    tier_code = models.CharField(max_length=50, unique=True)  # 'pro_monthly', 'pro_yearly'
    display_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    billing_cycle = models.CharField(max_length=20, choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')])
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_tier_pricing'

    def __str__(self):
        return f"{self.display_name} ({self.billing_cycle}): ${self.price}"