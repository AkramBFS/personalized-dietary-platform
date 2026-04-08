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