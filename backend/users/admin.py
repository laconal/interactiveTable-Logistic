from django.contrib import admin
from simple_history import register
from .models import User
from django.contrib.auth.admin import UserAdmin
# Register your models here.

class CustomUserAdmin(UserAdmin):
    list_display = ["id", "username", "department", "role"]
    readonly_fields = ["createdObjects"]
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', "department", "role", "createdObjects")}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    def save_model(self, request, obj, form, change):
        if not obj._state.adding and "password" in form.changed_data:
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

register(User)
admin.site.register(User, CustomUserAdmin)
