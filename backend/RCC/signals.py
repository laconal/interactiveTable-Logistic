from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import Order
import requests
import json

@receiver(post_delete, sender = Order)
def decrementUserCreatedCounter(sender, instance, **kwargs):
    if instance.createdByUser:
        user = instance.createdByUser
        user.createdObjects = max(0, user.createdObjects - 1)
        user.save()