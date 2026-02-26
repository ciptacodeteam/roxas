"""
Management command to assign input field presets to all products.

Uses the product's Category name (≈ Digiflazz category) and Product name
(≈ Digiflazz brand) to auto-detect the correct preset via
``get_preset_for_digiflazz()``.

Usage:
    # Preview what would change (dry-run, default)
    python manage.py assign_input_presets

    # Actually apply the changes
    python manage.py assign_input_presets --apply

    # Force overwrite products that already have input_fields set
    python manage.py assign_input_presets --apply --force

    # Apply only to a specific product by slug
    python manage.py assign_input_presets --apply --slug mobile-legends
"""

from django.core.management.base import BaseCommand
from main.models import Product
from main.input_field_presets import (
    INPUT_FIELD_PRESETS,
    get_preset_for_digiflazz,
    apply_preset_to_product,
)


class Command(BaseCommand):
    help = (
        "Assign input field presets to products based on their category/brand. "
        "Dry-run by default; pass --apply to save changes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually save changes to the database (default is dry-run).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite products that already have input_fields set.",
        )
        parser.add_argument(
            "--slug",
            type=str,
            default=None,
            help="Only update a specific product by slug.",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        force = options["force"]
        slug_filter = options.get("slug")

        mode = "APPLY" if apply else "DRY-RUN"
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  Assign Input Presets — {mode}")
        self.stdout.write(f"{'='*60}\n")

        qs = Product.objects.select_related("category").all()
        if slug_filter:
            qs = qs.filter(slug=slug_filter)

        updated = 0
        skipped = 0
        total = qs.count()

        for product in qs:
            category_name = product.category.name if product.category_id else ""
            brand_name = product.name

            # Skip products that already have input_fields unless --force
            has_fields = bool(product.input_fields)
            if has_fields and not force:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"  SKIP  {brand_name:<30} "
                        f"(already has {len(product.input_fields)} field(s), use --force to overwrite)"
                    )
                )
                continue

            preset_key = get_preset_for_digiflazz(category_name, brand_name)
            preset = INPUT_FIELD_PRESETS[preset_key]

            old_template = product.customer_no_template or "(empty)"
            new_template = preset["customer_no_template"] or "(empty)"
            field_keys = [f.get("key", "?") for f in preset["input_fields"]]

            self.stdout.write(
                f"  {'UPDATE' if apply else 'WOULD':>6}  "
                f"{brand_name:<30} "
                f"cat={category_name:<15} "
                f"→ preset={preset_key:<20} "
                f"fields={field_keys}  "
                f"template: {old_template} → {new_template}"
            )

            if apply:
                apply_preset_to_product(product, preset_key)
                product.save(update_fields=["input_fields", "customer_no_template", "updated_at"])

            updated += 1

        self.stdout.write(f"\n{'─'*60}")
        self.stdout.write(f"  Total: {total}  |  {'Updated' if apply else 'Would update'}: {updated}  |  Skipped: {skipped}")

        if not apply and updated > 0:
            self.stdout.write(
                self.style.WARNING(
                    "\n  ⚠  This was a DRY-RUN. Run with --apply to save changes."
                )
            )
        elif apply and updated > 0:
            self.stdout.write(self.style.SUCCESS(f"\n  ✅ {updated} product(s) updated successfully."))
        else:
            self.stdout.write("\n  Nothing to update.")

        self.stdout.write("")
