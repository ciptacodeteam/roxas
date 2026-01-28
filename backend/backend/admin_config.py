"""
Django Admin Site Configuration
Customizes the admin site header, title, and index title.
"""
from django.contrib import admin

# Customize admin site header and title
admin.site.site_header = "Roxas Game Store Administration"
admin.site.site_title = "Roxas Game Store Admin"
admin.site.index_title = "Welcome to Roxas Game Store Administration"

