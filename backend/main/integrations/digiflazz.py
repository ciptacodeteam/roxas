"""
Digiflazz API Integration Helper
Dokumentasi: https://developer.digiflazz.com/api/

Fitur:
- Get price list (daftar harga)
- Create topup transaction
- Check transaction status
- Validate webhook signature
"""

import hashlib
import hmac
import os
import requests
import logging
from typing import Dict, Any, Optional, List
from decimal import Decimal

logger = logging.getLogger(__name__)


class DigiflazzException(Exception):
    """Custom exception untuk Digiflazz API errors"""
    pass


class DigiflazzClient:
    """
    Digiflazz API Client untuk game top-up
    
    Environment Variables Required:
    - DIGIFLAZZ_USERNAME: Username dari member.digiflazz.com
    - DIGIFLAZZ_API_KEY: Production API key
    - DIGIFLAZZ_ENVIRONMENT: 'sandbox' atau 'production'
    - DIGIFLAZZ_API_URL: https://api.digiflazz.com/v1 (default)
    """
    
    def __init__(
        self,
        username: Optional[str] = None,
        api_key: Optional[str] = None,
        environment: Optional[str] = None,
        api_url: Optional[str] = None,
    ):
        """
        Initialize Digiflazz client
        
        Args:
            username: Username Digiflazz (default dari env)
            api_key: API Key Digiflazz (default dari env)
            environment: 'sandbox' atau 'production' (default dari env)
            api_url: Base URL API (default dari env)
        """
        self.username = username or os.environ.get("DIGIFLAZZ_USERNAME")
        self.api_key = api_key or os.environ.get("DIGIFLAZZ_API_KEY")
        self.environment = environment or os.environ.get("DIGIFLAZZ_ENVIRONMENT", "production")
        self.api_url = api_url or os.environ.get(
            "DIGIFLAZZ_API_URL", "https://api.digiflazz.com/v1"
        )
        
        if not self.username or not self.api_key:
            raise DigiflazzException(
                "DIGIFLAZZ_USERNAME dan DIGIFLAZZ_API_KEY harus diatur di environment variables"
            )
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
        })
    
    def _generate_signature(self, data: str) -> str:
        """
        Generate MD5 signature untuk request
        
        Args:
            data: String yang akan di-hash
            
        Returns:
            MD5 hash dalam format hex
        """
        return hashlib.md5(data.encode()).hexdigest()
    
    def _make_request(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Make HTTP POST request ke Digiflazz API
        
        Args:
            endpoint: API endpoint (contoh: /price-list)
            payload: Request payload
            timeout: Request timeout dalam detik
            
        Returns:
            Response JSON
            
        Raises:
            DigiflazzException: Jika request gagal
        """
        url = f"{self.api_url}{endpoint}"
        
        try:
            logger.info(f"Digiflazz Request: {endpoint} - Payload: {payload}")
            
            response = self.session.post(
                url,
                json=payload,
                timeout=timeout
            )
            
            # Log response
            logger.info(f"Digiflazz Response: {response.status_code} - {response.text[:500]}")
            
            response.raise_for_status()
            result = response.json()
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Digiflazz API Error: {str(e)}")
            raise DigiflazzException(f"Request gagal: {str(e)}")
        except ValueError as e:
            logger.error(f"Digiflazz JSON Parse Error: {str(e)}")
            raise DigiflazzException(f"Response tidak valid: {str(e)}")
    
    def get_price_list(
        self,
        cmd: str = "prepaid",
        buyer_sku_code: Optional[str] = None,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        product_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get daftar harga produk dari Digiflazz
        
        API Doc: https://developer.digiflazz.com/api/buyer/daftar-harga/
        
        Args:
            cmd: 'prepaid' atau 'pasca'
            buyer_sku_code: Filter by SKU code (optional)
            category: Filter by kategori (optional)
            brand: Filter by brand (optional)
            product_type: Filter by tipe produk (optional)
            
        Returns:
            List of products dengan harga
            
        Example Response (Prepaid):
            [{
                "product_name": "Mobile Legends 100 Diamonds",
                "category": "Games",
                "brand": "MOBILE LEGENDS",
                "type": "Umum",
                "seller_name": "PT. ABC",
                "price": 25000,
                "buyer_sku_code": "ML100",
                "buyer_product_status": true,
                "seller_product_status": true,
                "unlimited_stock": true,
                "stock": 0,
                "multi": true,
                "start_cut_off": "",
                "end_cut_off": "",
                "desc": "Mobile Legends 100 Diamonds"
            }]
        """
        # Generate signature: md5(username + apiKey + "pricelist")
        sign = self._generate_signature(f"{self.username}{self.api_key}pricelist")
        
        payload = {
            "cmd": cmd,
            "username": self.username,
            "sign": sign
        }
        
        # Add optional filters
        if buyer_sku_code:
            payload["code"] = buyer_sku_code
        if category:
            payload["category"] = category
        if brand:
            payload["brand"] = brand
        if product_type:
            payload["type"] = product_type
        
        try:
            result = self._make_request("/price-list", payload)
            
            # Response dibungkus dalam 'data' key
            products = result.get("data", [])
            
            logger.info(f"Retrieved {len(products)} products from Digiflazz")
            return products
            
        except DigiflazzException as e:
            logger.error(f"Failed to get price list: {str(e)}")
            raise
    
    def create_transaction(
        self,
        buyer_sku_code: str,
        customer_no: str,
        ref_id: str,
        testing: bool = False,
        max_price: Optional[int] = None,
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create transaksi top-up (prepaid)
        
        API Doc: https://developer.digiflazz.com/api/buyer/topup/
        
        Args:
            buyer_sku_code: Kode SKU produk Anda
            customer_no: Nomor pelanggan/user ID game
            ref_id: Reference ID unik dari sistem Anda
            testing: True untuk development testing
            max_price: Limit harga maksimal (optional)
            callback_url: URL webhook khusus untuk transaksi ini (optional)
            
        Returns:
            Transaction response
            
        Example Response:
            {
                "data": {
                    "ref_id": "TRX123456",
                    "customer_no": "1234567890",
                    "buyer_sku_code": "ML100",
                    "message": "Transaksi Pending",
                    "status": "Pending",  # Sukses, Pending, Gagal
                    "rc": "03",  # Response code
                    "sn": "",  # Serial number (jika sukses)
                    "buyer_last_saldo": 1000000,
                    "price": 25000,
                    "tele": "@telegram",
                    "wa": "081234567890"
                }
            }
        """
        # Generate signature: md5(username + apiKey + ref_id)
        sign = self._generate_signature(f"{self.username}{self.api_key}{ref_id}")
        
        payload = {
            "username": self.username,
            "buyer_sku_code": buyer_sku_code,
            "customer_no": customer_no,
            "ref_id": ref_id,
            "sign": sign
        }
        
        # Add optional parameters
        if testing or self.environment == "sandbox":
            payload["testing"] = True
        if max_price:
            payload["max_price"] = max_price
        if callback_url:
            payload["cb_url"] = callback_url
        
        try:
            result = self._make_request("/transaction", payload)
            
            # Response dibungkus dalam 'data' key
            transaction = result.get("data", {})
            
            logger.info(
                f"Transaction created - Ref ID: {ref_id}, "
                f"Status: {transaction.get('status')}, "
                f"RC: {transaction.get('rc')}"
            )
            
            return transaction
            
        except DigiflazzException as e:
            logger.error(f"Failed to create transaction: {str(e)}")
            raise
    
    def check_transaction_status(
        self,
        buyer_sku_code: str,
        customer_no: str,
        ref_id: str
    ) -> Dict[str, Any]:
        """
        Check status transaksi (prepaid)
        
        Untuk prepaid, cek status dilakukan dengan melakukan topup ulang
        dengan ref_id yang sama.
        
        PENTING: Jangan cek status untuk transaksi > 90 hari karena akan
        membuat transaksi baru!
        
        API Doc: https://developer.digiflazz.com/api/buyer/cek-status/
        
        Args:
            buyer_sku_code: Kode SKU produk
            customer_no: Nomor pelanggan
            ref_id: Reference ID transaksi sebelumnya
            
        Returns:
            Transaction status (sama seperti create_transaction)
        """
        logger.info(f"Checking transaction status for Ref ID: {ref_id}")
        
        # Cek status = topup ulang dengan ref_id yang sama
        return self.create_transaction(
            buyer_sku_code=buyer_sku_code,
            customer_no=customer_no,
            ref_id=ref_id
        )
    
    @staticmethod
    def validate_webhook_signature(
        payload: str,
        signature_header: str,
        secret: str
    ) -> bool:
        """
        Validate webhook signature dari Digiflazz
        
        API Doc: https://developer.digiflazz.com/api/buyer/webhook/
        
        Args:
            payload: Raw request body (string)
            signature_header: Value dari header 'X-Hub-Signature'
            secret: Webhook secret yang diatur di Digiflazz
            
        Returns:
            True jika signature valid
            
        Example:
            # Di Django view:
            payload = request.body.decode('utf-8')
            signature = request.headers.get('X-Hub-Signature')
            secret = os.environ.get('DIGIFLAZZ_WEBHOOK_SECRET')
            
            if DigiflazzClient.validate_webhook_signature(payload, signature, secret):
                # Process webhook
                pass
        """
        if not signature_header or not signature_header.startswith('sha1='):
            return False
        
        # Extract signature dari header
        expected_signature = signature_header[5:]  # Remove 'sha1=' prefix
        
        # Calculate HMAC SHA1
        calculated_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha1
        ).hexdigest()
        
        # Constant time comparison untuk mencegah timing attacks
        return hmac.compare_digest(calculated_signature, expected_signature)
    
    @staticmethod
    def parse_webhook_event(
        headers: Dict[str, str],
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse webhook event dari Digiflazz
        
        Args:
            headers: Request headers
            payload: Request body (already parsed to dict)
            
        Returns:
            Parsed event dengan metadata
            
        Example:
            {
                "event_type": "create",  # create atau update
                "transaction_type": "prepaid",  # prepaid atau postpaid
                "data": { ... }  # Transaction data
            }
        """
        event_type = headers.get('X-Digiflazz-Event', 'unknown')
        user_agent = headers.get('User-Agent', '')
        
        # Determine transaction type from User-Agent
        if 'Digiflazz-Pasca-Hookshot' in user_agent:
            transaction_type = 'postpaid'
        elif 'Digiflazz-Hookshot' in user_agent:
            transaction_type = 'prepaid'
        else:
            transaction_type = 'unknown'
        
        return {
            "event_type": event_type,
            "transaction_type": transaction_type,
            "data": payload.get("data", {})
        }
    
    def get_balance(self) -> Dict[str, Any]:
        """
        Cek saldo akun Digiflazz
        
        API Doc: https://developer.digiflazz.com/api/buyer/cek-saldo/
        
        Returns:
            Saldo information
            
        Example Response:
            {
                "data": {
                    "deposit": 1000000
                }
            }
        """
        # Generate signature: md5(username + apiKey + "depo")
        sign = self._generate_signature(f"{self.username}{self.api_key}depo")
        
        payload = {
            "cmd": "deposit",
            "username": self.username,
            "sign": sign
        }
        
        try:
            result = self._make_request("/cek-saldo", payload)
            balance_data = result.get("data", {})
            
            logger.info(f"Balance check - Deposit: {balance_data.get('deposit')}")
            return balance_data
            
        except DigiflazzException as e:
            logger.error(f"Failed to get balance: {str(e)}")
            raise
    
    def get_response_code_message(self, rc: str) -> str:
        """
        Get deskripsi response code dari Digiflazz
        
        API Doc: https://developer.digiflazz.com/api/buyer/response-code/
        
        Args:
            rc: Response code (contoh: '00', '03', '99')
            
        Returns:
            Deskripsi response code
        """
        response_codes = {
            "00": "Sukses",
            "01": "Gagal",
            "02": "Gangguan",
            "03": "Pending / Proses",
            "06": "Undefined Error",
            "07": "Duplikat",
            "13": "Produk Gangguan",
            "14": "Produk Tidak Ditemukan",
            "39": "Transaksi Gagal / Batal",
            "99": "Dibatalkan oleh user",
            "102": "IP tidak terdaftar",
            "104": "Signature salah",
            "105": "Parameter tidak lengkap",
            "106": "Username tidak ditemukan",
            "107": "SKU tidak ditemukan",
            "201": "Saldo tidak cukup",
            "202": "Transaksi sudah pernah dilakukan",
            "204": "Status produk nonaktif",
        }
        
        return response_codes.get(rc, f"Unknown response code: {rc}")
    
    def is_transaction_success(self, status: str, rc: str) -> bool:
        """
        Check apakah transaksi sukses
        
        Args:
            status: Status string dari response
            rc: Response code dari response
            
        Returns:
            True jika transaksi sukses
        """
        return status.lower() == "sukses" and rc == "00"
    
    def is_transaction_pending(self, status: str, rc: str) -> bool:
        """
        Check apakah transaksi pending (termasuk timeout yang perlu dicek ulang)
        
        Args:
            status: Status string dari response
            rc: Response code dari response
            
        Returns:
            True jika transaksi pending atau perlu dicek ulang
        """
        # Codes that indicate pending or need status checking
        pending_codes = {
            "03",  # Transaksi Pending
            "01",  # Timeout - needs retry checking
            "70",  # Timeout Dari Biller - needs retry
            "85",  # Rate limited - needs retry
            "86",  # PLN inquiry limit - needs retry
            "99",  # DF Router Issue - needs monitoring
            "50",  # Transaksi Tidak Ditemukan - might be processing
            "53",  # Produk Seller Sedang Tidak Tersedia - temporary
            "55",  # Produk Sedang Gangguan - temporary
            "58",  # Sedang Cut Off - temporary
            "60",  # Tagihan belum tersedia - might come later
            "71"   # Produk Sedang Tidak Stabil - temporary
        }
        
        return status.lower() == "pending" or rc in pending_codes
    
    def is_transaction_failed(self, status: str, rc: str) -> bool:
        """
        Check apakah transaksi gagal
        
        Args:
            status: Status string dari response
            rc: Response code dari response
            
        Returns:
            True jika transaksi gagal
        """
        # Final failure codes - no retry needed
        failure_codes = {
            "02",  # Transaksi Gagal
            "40", "41", "42", "43", "44", "45", "47", "49",  # Configuration/Auth errors
            "51", "52", "54", "56", "57", "59", "61", "62", "63", "64", "65", "66", "67", "68", "69",  # Product/Target errors
            "72", "73", "74", "80", "81", "82", "84", "87"  # Business logic errors
        }
        
        return status.lower() == "gagal" or rc in failure_codes
    
    def needs_status_check(self, status: str, rc: str) -> bool:
        """
        Check apakah transaksi perlu dicek status ulang
        
        Args:
            status: Status string dari response
            rc: Response code dari response
            
        Returns:
            True jika perlu dicek status ulang
        """
        # Codes that might resolve with status checking
        retry_codes = {
            "01",  # Timeout - could be processed later
            "70",  # Timeout Dari Biller - could be processed later
            "99",  # DF Router Issue - system issue, might resolve
            "50",  # Transaksi Tidak Ditemukan - might be processing
            "53",  # Produk Seller Sedang Tidak Tersedia - temporary issue
            "55",  # Produk Sedang Gangguan - temporary issue
            "58",  # Sedang Cut Off - temporary issue
            "71"   # Produk Sedang Tidak Stabil - temporary issue
        }
        
        return (status.lower() in ["pending", "timeout"]) or rc in retry_codes
    
    def get_retry_delay_minutes(self, rc: str) -> int:
        """
        Get recommended delay in minutes before retrying status check
        
        Args:
            rc: Response code
            
        Returns:
            Delay in minutes
        """
        # Specific delays based on error type
        delay_map = {
            "01": 3,    # Timeout - check in 3 minutes
            "70": 5,    # Timeout Dari Biller - check in 5 minutes
            "99": 2,    # DF Router Issue - check in 2 minutes
            "50": 1,    # Not found - check in 1 minute
            "53": 10,   # Product unavailable - check in 10 minutes
            "55": 15,   # Product disrupted - check in 15 minutes
            "58": 30,   # Cut off - check in 30 minutes
            "71": 5,    # Product unstable - check in 5 minutes
            "85": 2,    # Rate limited - check in 2 minutes
            "86": 5     # PLN limit - check in 5 minutes
        }
        
        return delay_map.get(rc, 1)  # Default 1 minute
    
    def is_transaction_expired(self, created_at) -> bool:
        """
        Check if transaction is beyond 90-day limit for status checking
        
        Args:
            created_at: DateTime when transaction was created
            
        Returns:
            True if transaction is expired (>90 days)
        """
        from django.utils import timezone
        from datetime import timedelta
        
        if not created_at:
            return False
            
        expiry_date = created_at + timedelta(days=90)
        return timezone.now() > expiry_date


# Singleton instance untuk convenience
_default_client: Optional[DigiflazzClient] = None


def get_digiflazz_client() -> DigiflazzClient:
    """
    Get default Digiflazz client instance (singleton)
    
    Returns:
        DigiflazzClient instance
    """
    global _default_client
    if _default_client is None:
        _default_client = DigiflazzClient()
    return _default_client
