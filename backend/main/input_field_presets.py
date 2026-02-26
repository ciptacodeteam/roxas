"""
Input Field Presets for Digiflazz Product Types
================================================

A preset defines two things:
  1. ``input_fields``      – structured field definitions the frontend renders
  2. ``customer_no_template`` – Python str.format template that builds the
                               ``customer_no`` string sent to Digiflazz

Available field ``type`` values:
  - ``text``   – generic text input
  - ``tel``    – phone number (numeric, tel keyboard on mobile)
  - ``number`` – numeric-only input

``validation`` keys (all optional):
  - ``pattern``    – regex the value must match (checked on both ends)
  - ``min_length`` – minimum character length
  - ``max_length`` – maximum character length

Usage in Django Admin or management commands:

    from main.input_field_presets import INPUT_FIELD_PRESETS
    preset = INPUT_FIELD_PRESETS['GAME_WITH_SERVER']
    product.input_fields = preset['input_fields']
    product.customer_no_template = preset['customer_no_template']
    product.save()

Auto-assign preset from Digiflazz category/brand:

    from main.input_field_presets import get_preset_for_digiflazz
    preset_key = get_preset_for_digiflazz(category="Pulsa", brand="TELKOMSEL")
    # → "PHONE_NUMBER"
"""

import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# Common reusable field definitions
# ═══════════════════════════════════════════════════════════════════════════════

_USER_ID = {
    "key": "userId",
    "label": "User ID",
    "type": "text",
    "placeholder": "Masukkan User ID kamu",
    "hint": "Temukan di menu profil dalam game",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]+$",
        "min_length": 1,
        "max_length": 30,
    },
}

_SERVER_ID = {
    "key": "serverId",
    "label": "Server ID (Zone)",
    "type": "text",
    "placeholder": "Masukkan Server ID",
    "hint": "Nomor zona / server dari akun kamu",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]+$",
        "min_length": 1,
        "max_length": 10,
    },
}

_PHONE_NUMBER = {
    "key": "phoneNumber",
    "label": "Nomor HP",
    "type": "tel",
    "placeholder": "08xxxxxxxxxx",
    "hint": "Nomor HP yang aktif (diawali 08 atau +62)",
    "required": True,
    "validation": {
        "pattern": r"^(\+62|62|0)[0-9]{8,13}$",
        "min_length": 10,
        "max_length": 15,
    },
}

_PLN_CUSTOMER_ID = {
    "key": "customerNo",
    "label": "Nomor Meter / ID Pelanggan PLN",
    "type": "text",
    "placeholder": "Masukkan nomor meter listrik",
    "hint": "Tertera pada struk / tagihan PLN kamu (10-13 digit)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{10,13}$",
        "min_length": 10,
        "max_length": 13,
    },
}

_PDAM_CUSTOMER_ID = {
    "key": "customerNo",
    "label": "ID Pelanggan PDAM",
    "type": "text",
    "placeholder": "Masukkan ID pelanggan PDAM",
    "hint": "Tertera pada tagihan PDAM kamu",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{5,20}$",
        "min_length": 5,
        "max_length": 20,
    },
}

_INTERNET_TV_CUSTOMER_ID = {
    "key": "customerNo",
    "label": "ID Pelanggan",
    "type": "text",
    "placeholder": "Masukkan ID pelanggan / nomor registrasi",
    "hint": "Nomor pelanggan dari tagihan internet atau TV kamu",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{5,20}$",
        "min_length": 5,
        "max_length": 20,
    },
}

_BPJS_NUMBER = {
    "key": "customerNo",
    "label": "Nomor BPJS Kesehatan",
    "type": "text",
    "placeholder": "Masukkan nomor BPJS Kesehatan",
    "hint": "Nomor peserta BPJS Kesehatan (13 digit)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{13,16}$",
        "min_length": 13,
        "max_length": 16,
    },
}

_BPJS_TK_NUMBER = {
    "key": "customerNo",
    "label": "Nomor BPJS Ketenagakerjaan",
    "type": "text",
    "placeholder": "Masukkan nomor BPJS TK",
    "hint": "Nomor peserta BPJS Ketenagakerjaan (16 digit)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{12,20}$",
        "min_length": 12,
        "max_length": 20,
    },
}

_GAS_CUSTOMER_ID = {
    "key": "customerNo",
    "label": "Nomor Pelanggan PGN",
    "type": "text",
    "placeholder": "Masukkan nomor pelanggan gas",
    "hint": "Nomor pelanggan dari tagihan Gas Negara (PGN)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{8,15}$",
        "min_length": 8,
        "max_length": 15,
    },
}

_MULTIFINANCE_CONTRACT = {
    "key": "customerNo",
    "label": "Nomor Kontrak / Perjanjian",
    "type": "text",
    "placeholder": "Masukkan nomor kontrak",
    "hint": "Nomor kontrak dari perusahaan multifinance",
    "required": True,
    "validation": {
        "pattern": r"^[0-9A-Za-z]{5,25}$",
        "min_length": 5,
        "max_length": 25,
    },
}

_PBB_NOP = {
    "key": "customerNo",
    "label": "NOP (Nomor Objek Pajak)",
    "type": "text",
    "placeholder": "Masukkan NOP PBB",
    "hint": "Nomor Objek Pajak dari SPPT PBB (18 digit)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{10,20}$",
        "min_length": 10,
        "max_length": 20,
    },
}

_SAMSAT_NIK = {
    "key": "noIdentitas",
    "label": "Nomor Identitas (NIK)",
    "type": "text",
    "placeholder": "Masukkan NIK",
    "hint": "NIK pemilik kendaraan (16 digit)",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{16}$",
        "min_length": 16,
        "max_length": 16,
    },
}

_SAMSAT_NO_RANGKA = {
    "key": "noRangka",
    "label": "Nomor Rangka Kendaraan",
    "type": "text",
    "placeholder": "Masukkan 5 digit terakhir no rangka",
    "hint": "5 digit terakhir nomor rangka kendaraan, lihat di STNK",
    "required": True,
    "validation": {
        "pattern": r"^[0-9A-Za-z]{5,25}$",
        "min_length": 5,
        "max_length": 25,
    },
}

_EMONEY_NUMBER = {
    "key": "customerNo",
    "label": "Nomor E-Wallet / E-Money",
    "type": "tel",
    "placeholder": "08xxxxxxxxxx",
    "hint": "Nomor HP atau nomor kartu e-money terdaftar",
    "required": True,
    "validation": {
        "pattern": r"^[0-9]{10,20}$",
        "min_length": 10,
        "max_length": 20,
    },
}

_VOUCHER_CODE = {
    "key": "userId",
    "label": "Email / ID Akun",
    "type": "text",
    "placeholder": "Masukkan email atau ID akun",
    "hint": "Email atau ID akun platform tujuan",
    "required": True,
    "validation": {
        "min_length": 3,
        "max_length": 100,
    },
}

_GENERIC_CUSTOMER_NO = {
    "key": "customerNo",
    "label": "Nomor Pelanggan",
    "type": "text",
    "placeholder": "Masukkan nomor pelanggan",
    "hint": "Nomor pelanggan dari tagihan terkait",
    "required": True,
    "validation": {
        "min_length": 3,
        "max_length": 30,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# Presets – keyed by type identifier, used in admin dropdown and auto-mapping
# ═══════════════════════════════════════════════════════════════════════════════

INPUT_FIELD_PRESETS = {
    # ─── Games ────────────────────────────────────────────────────────────────
    "GAME_WITH_SERVER": {
        "label": "Game (User ID + Server ID)",
        "description": (
            "Games like Mobile Legends, Genshin Impact, Honkai Star Rail "
            "that need both user ID and server/zone ID."
        ),
        "input_fields": [_USER_ID, _SERVER_ID],
        "customer_no_template": "{userId}{serverId}",
    },
    "GAME_USER_ONLY": {
        "label": "Game (User ID saja)",
        "description": (
            "Games like Free Fire, PUBG Mobile, Valorant, "
            "Call of Duty Mobile that only need a user ID."
        ),
        "input_fields": [_USER_ID],
        "customer_no_template": "{userId}",
    },

    # ─── Pulsa & Data ────────────────────────────────────────────────────────
    "PHONE_NUMBER": {
        "label": "Pulsa / Paket Data (Nomor HP)",
        "description": (
            "Phone credit (pulsa), data packages, SMS packages. "
            "Requires a phone number (Telkomsel, XL, Indosat, etc.)."
        ),
        "input_fields": [_PHONE_NUMBER],
        "customer_no_template": "{phoneNumber}",
    },

    # ─── PLN / Listrik ───────────────────────────────────────────────────────
    "PLN_PREPAID": {
        "label": "PLN Token / Listrik Prabayar",
        "description": "PLN prepaid electricity token. Requires meter/customer ID (10-13 digits).",
        "input_fields": [_PLN_CUSTOMER_ID],
        "customer_no_template": "{customerNo}",
    },
    "PLN_POSTPAID": {
        "label": "PLN Pascabayar / Nontaglis",
        "description": "PLN postpaid electricity & PLN non-tagihan listrik (Nontaglis). Requires ID pelanggan.",
        "input_fields": [_PLN_CUSTOMER_ID],
        "customer_no_template": "{customerNo}",
    },

    # ─── PDAM (Air) ──────────────────────────────────────────────────────────
    "PDAM": {
        "label": "PDAM (Tagihan Air)",
        "description": "Water utility bills (PDAM). Requires customer ID number.",
        "input_fields": [_PDAM_CUSTOMER_ID],
        "customer_no_template": "{customerNo}",
    },

    # ─── Internet & TV ───────────────────────────────────────────────────────
    "INTERNET_TV": {
        "label": "Internet / TV Kabel",
        "description": (
            "Internet bills (IndiHome, Biznet, MyRepublic, etc.) and "
            "TV cable (Indovision, Transvision, etc.). Requires customer ID."
        ),
        "input_fields": [_INTERNET_TV_CUSTOMER_ID],
        "customer_no_template": "{customerNo}",
    },

    # ─── BPJS Kesehatan ──────────────────────────────────────────────────────
    "BPJS": {
        "label": "BPJS Kesehatan",
        "description": "BPJS Kesehatan health insurance. Requires BPJS member number (13 digits).",
        "input_fields": [_BPJS_NUMBER],
        "customer_no_template": "{customerNo}",
    },

    # ─── BPJS Ketenagakerjaan ────────────────────────────────────────────────
    "BPJS_TK": {
        "label": "BPJS Ketenagakerjaan (BPJSTK)",
        "description": (
            "BPJS Ketenagakerjaan (BPJSTK) and BPJSTKPU (Penerima Upah). "
            "Requires BPJS TK member number."
        ),
        "input_fields": [_BPJS_TK_NUMBER],
        "customer_no_template": "{customerNo}",
    },

    # ─── Gas Negara ──────────────────────────────────────────────────────────
    "GAS_NEGARA": {
        "label": "Gas Negara (PGN)",
        "description": "Perusahaan Gas Negara (PGN) bills. Requires PGN customer ID.",
        "input_fields": [_GAS_CUSTOMER_ID],
        "customer_no_template": "{customerNo}",
    },

    # ─── Multifinance ────────────────────────────────────────────────────────
    "MULTIFINANCE": {
        "label": "Multifinance (Cicilan)",
        "description": (
            "Multifinance installment payments (Adira, FIF, WOM, BAF, etc.). "
            "Requires contract/agreement number."
        ),
        "input_fields": [_MULTIFINANCE_CONTRACT],
        "customer_no_template": "{customerNo}",
    },

    # ─── PBB & Pajak Daerah ──────────────────────────────────────────────────
    "PBB_TAX": {
        "label": "PBB / Pajak Daerah",
        "description": (
            "Property tax (PBB) and other regional taxes (Pajak Daerah). "
            "Requires NOP (Nomor Objek Pajak)."
        ),
        "input_fields": [_PBB_NOP],
        "customer_no_template": "{customerNo}",
    },

    # ─── SAMSAT ──────────────────────────────────────────────────────────────
    "SAMSAT": {
        "label": "SAMSAT (Pajak Kendaraan)",
        "description": (
            "Vehicle tax payment (SAMSAT). Requires NIK + last 5 digits of "
            "vehicle frame number. Sent as \"{noIdentitas},{noRangka}\"."
        ),
        "input_fields": [_SAMSAT_NIK, _SAMSAT_NO_RANGKA],
        "customer_no_template": "{noIdentitas},{noRangka}",
    },

    # ─── E-Money / E-Wallet ──────────────────────────────────────────────────
    "E_WALLET": {
        "label": "E-Money / E-Wallet",
        "description": (
            "E-Money / E-Wallet top-up & postpaid (GoPay, OVO, DANA, "
            "ShopeePay, LinkAja, Mandiri e-money, etc.). "
            "Requires phone number or card number."
        ),
        "input_fields": [_EMONEY_NUMBER],
        "customer_no_template": "{customerNo}",
    },

    # ─── HP Pascabayar / Tagihan Lainnya ─────────────────────────────────────
    "HP_POSTPAID": {
        "label": "HP Pascabayar / Tagihan HP",
        "description": (
            "Postpaid mobile phone bills and other telecom bills. "
            "Requires phone number."
        ),
        "input_fields": [_PHONE_NUMBER],
        "customer_no_template": "{phoneNumber}",
    },

    # ─── Voucher / Wallet ────────────────────────────────────────────────────
    "VOUCHER_ACCOUNT": {
        "label": "Voucher / Wallet (Email atau ID Akun)",
        "description": (
            "Platform vouchers like Steam, Google Play, Spotify, Netflix "
            "that require an account ID or email."
        ),
        "input_fields": [_VOUCHER_CODE],
        "customer_no_template": "{userId}",
    },

    # ─── Generic (catchall) ──────────────────────────────────────────────────
    "GENERIC": {
        "label": "Umum (Nomor Pelanggan)",
        "description": (
            "Generic customer number input. Use when no other preset fits. "
            "Customer enters a free-form customer number."
        ),
        "input_fields": [_GENERIC_CUSTOMER_NO],
        "customer_no_template": "{customerNo}",
    },

    # ─── No input ────────────────────────────────────────────────────────────
    "NO_INPUT": {
        "label": "Tanpa Input",
        "description": "Products that do not require any customer input (e.g. auto-delivered voucher codes).",
        "input_fields": [],
        "customer_no_template": "",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# Admin select/dropdown choices
# ═══════════════════════════════════════════════════════════════════════════════

INPUT_FIELD_PRESET_CHOICES = [
    (key, val["label"]) for key, val in INPUT_FIELD_PRESETS.items()
]


# ═══════════════════════════════════════════════════════════════════════════════
# Auto-mapping: Digiflazz category/brand → preset key
# ═══════════════════════════════════════════════════════════════════════════════

# Maps Digiflazz ``category`` (lowercase) to preset key.
# Checked first; if no match, falls through to brand mapping.
_CATEGORY_MAP: dict[str, str] = {
    "pulsa":        "PHONE_NUMBER",
    "data":         "PHONE_NUMBER",
    "sms":          "PHONE_NUMBER",
    "paket sms":    "PHONE_NUMBER",
    "paket telepon": "PHONE_NUMBER",
    "games":        "GAME_USER_ONLY",       # default; brand-level override below
    "game":         "GAME_USER_ONLY",
    "e-money":      "E_WALLET",
    "e-wallet":     "E_WALLET",
    "pln":          "PLN_PREPAID",
    "voucher":      "VOUCHER_ACCOUNT",
    "pascabayar":   "GENERIC",              # broad; brand-level override below
}

# Maps Digiflazz ``brand`` (lowercase) to preset key.
# Takes precedence when both category and brand match.
_BRAND_MAP: dict[str, str] = {
    # ── Games needing User ID + Server ID ─────────────────────────────────
    "mobile legends":           "GAME_WITH_SERVER",
    "mobile legend":            "GAME_WITH_SERVER",
    "genshin impact":           "GAME_WITH_SERVER",
    "honkai star rail":         "GAME_WITH_SERVER",
    "honkai: star rail":        "GAME_WITH_SERVER",
    "tower of fantasy":         "GAME_WITH_SERVER",
    "ragnarok":                 "GAME_WITH_SERVER",
    "ragnarok m":               "GAME_WITH_SERVER",
    "sausage man":              "GAME_WITH_SERVER",
    "arena of valor":           "GAME_WITH_SERVER",
    "aov":                      "GAME_WITH_SERVER",
    "clash of clans":           "GAME_WITH_SERVER",
    "dragon raja":              "GAME_WITH_SERVER",
    "lost saga":                "GAME_WITH_SERVER",
    "love nikki":               "GAME_WITH_SERVER",
    "one punch man":            "GAME_WITH_SERVER",
    "super sus":                "GAME_WITH_SERVER",
    "tom and jerry":            "GAME_WITH_SERVER",

    # ── Games needing User ID only ────────────────────────────────────────
    "free fire":                "GAME_USER_ONLY",
    "garena free fire":         "GAME_USER_ONLY",
    "pubg mobile":              "GAME_USER_ONLY",
    "pubg":                     "GAME_USER_ONLY",
    "valorant":                 "GAME_USER_ONLY",
    "call of duty":             "GAME_USER_ONLY",
    "call of duty mobile":      "GAME_USER_ONLY",
    "undawn":                   "GAME_USER_ONLY",
    "stumble guys":             "GAME_USER_ONLY",
    "point blank":              "GAME_USER_ONLY",
    "higgs domino":             "GAME_USER_ONLY",
    "hago":                     "GAME_USER_ONLY",
    "lords mobile":             "GAME_USER_ONLY",
    "metal slug":               "GAME_USER_ONLY",
    "night crows":              "GAME_USER_ONLY",
    "super mecha champions":    "GAME_USER_ONLY",
    "blockman go":              "GAME_USER_ONLY",
    "eight ball pool":          "GAME_USER_ONLY",
    "fifa mobile":              "GAME_USER_ONLY",
    "auto chess":               "GAME_USER_ONLY",
    "speed drifters":           "GAME_USER_ONLY",
    "lifeafter":                "GAME_USER_ONLY",
    "chip ungu":                "GAME_USER_ONLY",

    # ── Postpaid brand overrides ──────────────────────────────────────────
    "pln":                      "PLN_POSTPAID",
    "pln nontaglis":            "PLN_POSTPAID",
    "plnnontaglist":            "PLN_POSTPAID",
    "pdam":                     "PDAM",
    "bpjs":                     "BPJS",
    "bpjs kesehatan":           "BPJS",
    "bpjstk":                   "BPJS_TK",
    "bpjstkpu":                 "BPJS_TK",
    "internet":                 "INTERNET_TV",
    "indihome":                 "INTERNET_TV",
    "biznet":                   "INTERNET_TV",
    "myrepublic":               "INTERNET_TV",
    "cbn":                      "INTERNET_TV",
    "tv":                       "INTERNET_TV",
    "transvision":              "INTERNET_TV",
    "indovision":               "INTERNET_TV",
    "topas tv":                 "INTERNET_TV",
    "big tv":                   "INTERNET_TV",
    "mnc vision":               "INTERNET_TV",
    "nex media":                "INTERNET_TV",
    "pgas":                     "GAS_NEGARA",
    "gas negara":               "GAS_NEGARA",
    "pgn":                      "GAS_NEGARA",
    "multifinance":             "MULTIFINANCE",
    "adira":                    "MULTIFINANCE",
    "fif":                      "MULTIFINANCE",
    "wom":                      "MULTIFINANCE",
    "baf":                      "MULTIFINANCE",
    "maf":                      "MULTIFINANCE",
    "pbb":                      "PBB_TAX",
    "pajak daerah":             "PBB_TAX",
    "pdl":                      "PBB_TAX",
    "samsat":                   "SAMSAT",
    "hp":                       "HP_POSTPAID",
    "telkomsel postpaid":       "HP_POSTPAID",
    "emoney":                   "E_WALLET",
    "e-money":                  "E_WALLET",
    "gopay":                    "E_WALLET",
    "ovo":                      "E_WALLET",
    "dana":                     "E_WALLET",
    "shopeepay":                "E_WALLET",
    "linkaja":                  "E_WALLET",

    # ── Voucher brands ────────────────────────────────────────────────────
    "steam":                    "VOUCHER_ACCOUNT",
    "steam wallet":             "VOUCHER_ACCOUNT",
    "google play":              "VOUCHER_ACCOUNT",
    "spotify":                  "VOUCHER_ACCOUNT",
    "netflix":                  "VOUCHER_ACCOUNT",
}


def get_preset_for_digiflazz(category: str, brand: str) -> str:
    """
    Return the best-matching preset key for a Digiflazz product.

    Resolution order:
    1. Exact brand match (most specific)
    2. Category match
    3. ``"GENERIC"`` fallback

    Both ``category`` and ``brand`` are matched case-insensitively.

    Args:
        category: The Digiflazz ``category`` string (e.g. "Pulsa", "Games", "Pascabayar").
        brand:    The Digiflazz ``brand`` string (e.g. "TELKOMSEL", "MOBILE LEGENDS").

    Returns:
        A key from ``INPUT_FIELD_PRESETS``.

    Examples:
        >>> get_preset_for_digiflazz("Pulsa", "TELKOMSEL")
        'PHONE_NUMBER'
        >>> get_preset_for_digiflazz("Games", "MOBILE LEGENDS")
        'GAME_WITH_SERVER'
        >>> get_preset_for_digiflazz("Games", "FREE FIRE")
        'GAME_USER_ONLY'
        >>> get_preset_for_digiflazz("Pascabayar", "PLN")
        'PLN_POSTPAID'
        >>> get_preset_for_digiflazz("Pascabayar", "SAMSAT")
        'SAMSAT'
    """
    brand_lower = (brand or "").strip().lower()
    category_lower = (category or "").strip().lower()

    # 1. Brand-level match (most specific)
    if brand_lower in _BRAND_MAP:
        return _BRAND_MAP[brand_lower]

    # 2. Category-level match
    if category_lower in _CATEGORY_MAP:
        return _CATEGORY_MAP[category_lower]

    logger.info(
        "No preset match for category=%r brand=%r; defaulting to GENERIC",
        category, brand,
    )
    return "GENERIC"


def apply_preset_to_product(product, preset_key: str) -> None:
    """
    Apply a preset's ``input_fields`` and ``customer_no_template`` to a
    Product instance (does NOT call ``save()``).

    Args:
        product:    A ``Product`` model instance.
        preset_key: A key from ``INPUT_FIELD_PRESETS``.

    Raises:
        KeyError: If ``preset_key`` is not a valid preset.
    """
    preset = INPUT_FIELD_PRESETS[preset_key]
    product.input_fields = preset["input_fields"]
    product.customer_no_template = preset["customer_no_template"]
