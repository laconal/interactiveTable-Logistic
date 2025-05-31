from rest_framework import serializers
from .models import Order

class ItemSerializer(serializers.ModelSerializer):
    toDeleteRequest = serializers.SlugRelatedField(
        read_only = True,
        slug_field = "username",
        allow_null = True
    )
    class Meta:
        model = Order
        fields = "__all__"
