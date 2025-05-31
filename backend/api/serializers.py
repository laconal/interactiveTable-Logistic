from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

UserModel = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ("id", "username", "department", "role")

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add the custom fields to the token payload
        user = self.user
        data['username'] = user.username
        data["department"] = user.department
        data['role'] = user.role  # Assuming your user has a 'profile' with a 'role' field
        
        # You can add any other fields you want here
        
        return data        