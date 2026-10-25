from django.contrib import admin

from accounts.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at', 'has_avatar')
    search_fields = ('user__username', 'user__first_name')

    @admin.display(boolean=True, description='Аватар')
    def has_avatar(self, obj: UserProfile) -> bool:
        return bool(obj.avatar_data)
