from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CustomUser,
    StaffProfile,
    CustomerProfile,
)

# Register your models here.

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = (
        'email',
        'role',
        'email_verified',
        'is_active',
        'is_staff',
        'is_superuser',
    )
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'email_verified')
    search_fields = ('email',)
    ordering = ('email',)
    readonly_fields = ('email_verified_at', 'date_joined', 'last_login')
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password', 'role', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Email Verification', {
            'fields': ('email_verified', 'email_verified_at')
        }),
        ('Timestamps', {
            'fields': ('date_joined', 'last_login')
        }),
    )


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'contact_phone')
    list_filter = ('user__role', 'user__is_active', 'created_at')
    search_fields = ('user__email', 'full_name')
    readonly_fields = ('photo_preview', 'created_at', 'updated_at')
    list_select_related = ('user',)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        return super().get_queryset(request).select_related('user')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Staff Information', {
            'fields': ('full_name', 'contact_phone')
        }),
        ('Profile Photo', {
            'fields': ('photo', 'photo_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def photo_preview(self, obj):
        """Display photo preview in admin."""
        if obj.photo:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.photo.url
            )
        return "No photo"
    photo_preview.short_description = "Photo Preview"


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    """Admin interface for customer profiles."""
    list_display = ('user', 'full_name', 'contact_phone', 'created_at')
    list_filter = ('user__is_active', 'created_at')
    search_fields = ('user__email', 'full_name', 'contact_phone')
    readonly_fields = ('photo_preview', 'created_at', 'updated_at')
    list_select_related = ('user',)
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to avoid N+1 queries."""
        return super().get_queryset(request).select_related('user')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Customer Information', {
            'fields': ('full_name', 'contact_phone')
        }),
        ('Profile Photo', {
            'fields': ('photo', 'photo_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def photo_preview(self, obj):
        """Display photo preview in admin."""
        if obj.photo:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.photo.url
            )
        return "No photo"
    photo_preview.short_description = "Photo Preview"
