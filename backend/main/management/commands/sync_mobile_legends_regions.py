"""
Management command to ensure all Mobile Legends regional products
share the same input configuration as the canonical/global product.

Use-case:
- Mobile Legends has many region-specific products (e.g. Global, Japan, Korea).
- The "global" product is already configured correctly with username/server
  input fields (including validation).
- Newly added regional products sometimes have missing/incorrect input fields,
  so the username check / account validation breaks.

This command:
- Finds a template Mobile Legends product (by slug or name).
- Copies its ``input_fields`` and ``customer_no_template`` to all other
  Mobile Legends products.

Example usage:
    python manage.py sync_mobile_legends_regions
    python manage.py sync_mobile_legends_regions --dry-run

You can adjust the NAME_FILTERS / TEMPLATE_SLUG below if your naming
convention differs.
"""

from django.core.management.base import BaseCommand
from django.db import transaction, models

from main.models import Product


# Slug of the canonical Mobile Legends product, if you have one.
# If this slug is not found, we fall back to name-based matching.
TEMPLATE_SLUG = "mobile-legends-global"

# Substrings used to detect Mobile Legends products by name (case-insensitive)
NAME_FILTERS = ["mobile legends", "mobile legend"]


class Command(BaseCommand):
    help = (
        "Sync Mobile Legends regional products so they use the same "
        "input_fields and customer_no_template as the global/template product, "
        "and ensure each region has a validation item so the 'cek username' "
        "button works consistently."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be updated without saving changes.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        template_product = self._find_template_product()
        if not template_product:
            self.stdout.write(
                self.style.ERROR(
                    "Could not find template Mobile Legends product. "
                    f"Tried slug='{TEMPLATE_SLUG}' and name filters={NAME_FILTERS!r}."
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Using template product: {template_product.name} (slug={template_product.slug})"
            )
        )

        template_input_fields = template_product.input_fields
        template_customer_no_template = template_product.customer_no_template

        # Find all other Mobile Legends products (excluding the template)
        all_ml_products = self._find_all_mobile_legends_products().exclude(
            pk=template_product.pk
        )

        if not all_ml_products.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No other Mobile Legends products found to sync."
                )
            )
            return

        self.stdout.write(
            f"Found {all_ml_products.count()} Mobile Legends regional products."
        )

        updated_config_count = 0

        with transaction.atomic():
            for product in all_ml_products:
                # Sync input configuration
                needs_update = (
                    product.input_fields != template_input_fields
                    or product.customer_no_template != template_customer_no_template
                )

                if needs_update:
                    self.stdout.write(
                        self.style.WARNING(
                            f"- {product.name} (slug={product.slug}): WILL be updated "
                            "to match template input configuration."
                        )
                    )
                    if not dry_run:
                        product.input_fields = template_input_fields
                        product.customer_no_template = template_customer_no_template
                        product.save(
                            update_fields=[
                                "input_fields",
                                "customer_no_template",
                                "updated_at",
                            ]
                        )
                        updated_config_count += 1
                else:
                    self.stdout.write(
                        f"- {product.name} (slug={product.slug}): input config already in sync."
                    )

            if dry_run:
                # Roll back any accidental writes within this atomic block
                transaction.set_rollback(True)

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "DRY RUN complete. No changes were saved to the database."
                )
            )
        else:
            summary = (
                f"Sync complete. "
                f"Updated config for {updated_config_count} products."
            )
            self.stdout.write(self.style.SUCCESS(summary))

    def _find_template_product(self) -> Product | None:
        """
        Try to find the canonical/template Mobile Legends product.

        Resolution order:
        1. Exact slug match (TEMPLATE_SLUG)
        2. First product whose name contains both 'mobile legends' and 'global'
        3. First product whose name contains 'mobile legends' (any)
        """
        # 1. Try slug
        try:
            return Product.objects.get(slug=TEMPLATE_SLUG)
        except Product.DoesNotExist:
            pass

        # 2. Name contains both "mobile legends" and "global"
        qs = Product.objects.all()
        for f in NAME_FILTERS:
            qs = qs.filter(name__icontains=f)
        global_like = qs.filter(name__icontains="global").first()
        if global_like:
            return global_like

        # 3. Fallback: any Mobile Legends product
        any_ml = self._find_all_mobile_legends_products().first()
        return any_ml

    def _find_all_mobile_legends_products(self):
        """
        Return a queryset of all products that look like Mobile Legends.
        """
        qs = Product.objects.all()
        name_filter = None
        for fragment in NAME_FILTERS:
            condition = {"name__icontains": fragment}
            if name_filter is None:
                name_filter = models.Q(**condition)  # type: ignore[name-defined]
            else:
                name_filter |= models.Q(**condition)  # type: ignore[name-defined]

        # Fallback: no filters defined (should never happen with default NAME_FILTERS)
        if name_filter is None:
            return qs.none()

        return qs.filter(name_filter)

