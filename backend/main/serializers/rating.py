"""ProductRating serializer."""
from rest_framework import serializers
from ..models.rating import ProductRating


class ProductRatingSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ProductRating
        fields = [
            'id', 'product', 'product_name', 'user', 'user_email',
            'user_name', 'rating', 'comment', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductRatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRating
        fields = ['product', 'user_name', 'rating', 'comment']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
