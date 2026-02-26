"""
Utility helpers for the main app.
"""

import re
import logging

logger = logging.getLogger(__name__)


def build_customer_no(customer_data: dict, template: str) -> str:
    """
    Build the ``customer_no`` string sent to Digiflazz.

    The ``template`` is a Python str.format-style string where the keys
    correspond to the ``key`` values in the product's ``input_fields``.

    Examples
    --------
    >>> build_customer_no({"userId": "123456", "serverId": "1001"}, "{userId}{serverId}")
    '1234561001'
    >>> build_customer_no({"phoneNumber": "081234567890"}, "{phoneNumber}")
    '081234567890'
    >>> build_customer_no({}, "")
    ''

    Args:
        customer_data: Dict of field key → value submitted by the customer.
        template:      The product's ``customer_no_template`` field value.

    Returns:
        Rendered customer_no string.

    Raises:
        ValueError: If a required key referenced in the template is missing.
    """
    if not template:
        return ""

    try:
        return template.format(**{k: str(v) for k, v in customer_data.items()})
    except KeyError as missing:
        raise ValueError(
            f"Field {missing} diperlukan untuk membangun customer_no "
            f"(template: '{template}')"
        )


def validate_customer_data_against_fields(
    customer_data: dict,
    input_fields: list,
) -> dict:
    """
    Validate ``customer_data`` against the product's structured ``input_fields``.

    Returns a dict of ``{field_key: error_message}`` for every validation
    failure found.  An empty dict means the data is valid.

    Args:
        customer_data: Dict of field key → value.
        input_fields:  List of field definition dicts from ``Product.input_fields``.

    Returns:
        Dict of field errors (empty if all valid).
    """
    errors = {}

    for field_def in input_fields:
        key = field_def.get("key", "")
        label = field_def.get("label", key)
        required = field_def.get("required", True)
        validation = field_def.get("validation", {})

        raw = customer_data.get(key)
        value = str(raw).strip() if raw is not None else ""

        if required and not value:
            errors[key] = f"{label} harus diisi."
            continue

        if not value:
            # Field is optional and empty — skip remaining checks
            continue

        pattern = validation.get("pattern")
        if pattern and not re.match(pattern, value):
            errors[key] = f"Format {label} tidak valid."
            continue

        min_len = validation.get("min_length")
        if min_len and len(value) < int(min_len):
            errors[key] = f"{label} minimal {min_len} karakter."
            continue

        max_len = validation.get("max_length")
        if max_len and len(value) > int(max_len):
            errors[key] = f"{label} maksimal {max_len} karakter."

    return errors
