"""
Midtrans Payment Gateway Integration - Core API

This module provides integration with Midtrans Core API for custom payment flows.
Supports multiple payment methods: credit cards, e-wallets, bank transfers (VA), and QRIS.

Core API gives full control over payment UI and flow, allowing custom-branded experiences.
Includes API logging for monitoring and debugging.

Documentation: https://docs.midtrans.com/reference/core-api-overview

Author: Roxas Backend Team
Created: 2026
"""

import base64
import hashlib
import hmac
import requests
import logging
import time
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class MidtransException(Exception):
    """Custom exception for Midtrans API errors"""
    pass


def log_api_call(provider: str, endpoint: str, method: str, status_code: int, response_time: int, error_message: str = ""):
    """Helper function to log API calls to database"""
    try:
        from ..models import ApiLog
        ApiLog.objects.create(
            provider=provider,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            error_message=error_message,
            created_at=timezone.now()
        )
    except Exception as e:
        logger.error(f"Failed to log API call: {str(e)}")


class MidtransClient:
    """
    Midtrans Core API Client
    
    Environment Variables Required:
    - MIDTRANS_SERVER_KEY: Server key from dashboard
    - MIDTRANS_PRODUCTION: 'True' for production, 'False' for sandbox
    """
    
    def __init__(
        self,
        server_key: Optional[str] = None,
        is_production: Optional[bool] = None,
    ):
        """
        Initialize Midtrans client.
        
        Args:
            server_key: Midtrans server key (defaults to settings.MIDTRANS_SERVER_KEY)
            is_production: Production mode flag (defaults to settings.MIDTRANS_PRODUCTION)
        """
        self.server_key = server_key or getattr(settings, 'MIDTRANS_SERVER_KEY', None)
        self.is_production = (
            is_production 
            if is_production is not None 
            else getattr(settings, 'MIDTRANS_PRODUCTION', False)
        )
        
        if not self.server_key:
            logger.error("MIDTRANS_SERVER_KEY is not configured in Django settings!")
            raise MidtransException("MIDTRANS_SERVER_KEY is required but not configured")
        
        # Set API base URL
        if self.is_production:
            self.api_url = "https://api.midtrans.com/v2"
        else:
            self.api_url = "https://api.sandbox.midtrans.com/v2"
        
        logger.info(
            f"Midtrans client initialized | Mode: {'Production' if self.is_production else 'Sandbox'} | "
            f"API URL: {self.api_url} | Server Key: {'***' + self.server_key[-4:] if len(self.server_key) > 4 else '***'}"
        )
    
    def _generate_auth_header(self) -> str:
        """
        Generate Basic Auth header for Midtrans API.
        
        Returns:
            str: Base64 encoded "server_key:" string
        """
        # Midtrans uses server_key as username with empty password
        auth_string = f"{self.server_key}:"
        encoded = base64.b64encode(auth_string.encode()).decode()
        return f"Basic {encoded}"
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        order_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to Midtrans API with logging.
        
        Args:
            method: HTTP method (GET, POST, PATCH)
            endpoint: API endpoint
            data: Request payload
            order_id: Order ID for logging
            
        Returns:
            dict: API response
            
        Raises:
            MidtransException: If request fails
        """
        url = f"{self.api_url}/{endpoint}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": self._generate_auth_header(),
        }
        
        start_time = time.time()
        status_code = 0
        error_message = ""
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            else:
                raise MidtransException(f"Unsupported HTTP method: {method}")
            
            status_code = response.status_code
            response_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
            
            # Parse response
            result = response.json()
            
            # Log request with response keys for debugging
            logger.info(f"Midtrans {method} {endpoint} - Status: {response.status_code} - Keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}")
            
            # Check for HTTP-level errors
            if response.status_code >= 400:
                error_message = result.get('status_message', 'Unknown error')
                logger.error(f"Midtrans HTTP error: {error_message}")
                
                # Log failed API call
                log_api_call('MIDTRANS', endpoint, method, status_code, response_time, error_message)
                
                raise MidtransException(f"API error: {error_message}")
            
            # CRITICAL: Check Midtrans body-level status_code
            # Midtrans returns HTTP 200 for EVERYTHING, including errors.
            # The real status is a STRING inside the response body (e.g., "201", "400", "500").
            midtrans_status_code = result.get('status_code', '200')
            try:
                midtrans_status_int = int(midtrans_status_code)
                if midtrans_status_int >= 400:
                    error_message = result.get('status_message', 'Unknown Midtrans error')
                    logger.error(
                        f"Midtrans body error ({midtrans_status_code}): {error_message} | "
                        f"Order: {order_id} | Full response: {result}"
                    )
                    log_api_call('MIDTRANS', endpoint, method, midtrans_status_int, response_time, error_message)
                    raise MidtransException(
                        f"Midtrans error ({midtrans_status_code}): {error_message}"
                    )
            except (ValueError, TypeError):
                logger.warning(f"Midtrans returned non-numeric status_code: {midtrans_status_code}")
            
            # Log successful API call
            log_api_call('MIDTRANS', endpoint, method, status_code, response_time)
            
            return result
            
        except requests.exceptions.RequestException as e:
            response_time = int((time.time() - start_time) * 1000)
            error_message = str(e)
            logger.error(f"Midtrans request failed: {error_message}")
            
            # Log failed API call
            if status_code == 0:
                status_code = 500  # Default for connection errors
            log_api_call('MIDTRANS', endpoint, method, status_code, response_time, error_message)
            
            raise MidtransException(f"Request failed: {error_message}")
    
    # =========================================================================
    # CHARGE API - Create Payment
    # =========================================================================
    
    def charge_credit_card(
        self,
        order_id: str,
        gross_amount: int,
        card_token: str,
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Charge credit card payment.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            card_token: Card token from frontend (Midtrans.js)
            customer_details: Customer information
            item_details: List of purchased items
            
        Returns:
            dict: Payment response with redirect_url for 3DS
        """
        payload = {
            "payment_type": "credit_card",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount,
            },
            "credit_card": {
                "token_id": card_token,
                "authentication": True,  # Enable 3D Secure
            }
        }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_bank_transfer(
        self,
        order_id: str,
        gross_amount: int,
        bank: str,  # 'bca', 'bni', 'bri', 'bsi', 'cimb', etc.
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Create Virtual Account payment.
        
        NOTE: 
        - For Mandiri Bill Payment, use charge_mandiri_bill() instead.
          Midtrans uses payment_type 'echannel' for Mandiri, not 'bank_transfer'.
        - For Permata Virtual Account, use charge_permata() instead.
          Permata uses payment_type 'permata' directly, not 'bank_transfer'.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            bank: Bank code ('bca', 'bni', 'bri', 'bsi', 'cimb', 'danamon')
            customer_details: Customer information
            item_details: List of purchased items
            
        Returns:
            dict: Payment response with VA number
        """
        payload = {
            "payment_type": "bank_transfer",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
            "bank_transfer": {
                "bank": bank,
            }
        }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_mandiri_bill(
        self,
        order_id: str,
        gross_amount: int,
        bill_info1: str = "Payment For:",
        bill_info2: str = "Online Purchase",
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Create Mandiri Bill Payment (echannel).
        
        Mandiri uses a different payment_type 'echannel' instead of 'bank_transfer'.
        Response returns biller_code and bill_key instead of va_numbers.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            bill_info1: Label for bill info line 1
            bill_info2: Label for bill info line 2
            customer_details: Customer information
            item_details: List of purchased items
            
        Returns:
            dict: Payment response with biller_code and bill_key
        """
        payload = {
            "payment_type": "echannel",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
            "echannel": {
                "bill_info1": bill_info1,
                "bill_info2": bill_info2,
            }
        }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_permata(
        self,
        order_id: str,
        gross_amount: int,
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Create Permata Virtual Account payment.
        
        Permata uses payment_type 'permata' directly, not 'bank_transfer' with bank parameter.
        Response returns permata_va_number instead of va_numbers array.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            customer_details: Customer information
            item_details: List of purchased items
            
        Returns:
            dict: Payment response with permata_va_number
        """
        payload = {
            "payment_type": "permata",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
        }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_gopay(
        self,
        order_id: str,
        gross_amount: int,
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
        callback_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create GoPay payment.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            customer_details: Customer information
            item_details: List of purchased items
            callback_url: URL to redirect after payment
            
        Returns:
            dict: Payment response with deeplink for Gojek app
        """
        gopay_data = {
            "enable_callback": True if callback_url else False,
        }
        if callback_url:
            gopay_data["callback_url"] = callback_url
        
        payload = {
            "payment_type": "gopay",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
            "gopay": gopay_data,
        }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_shopeepay(
        self,
        order_id: str,
        gross_amount: int,
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
        callback_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create ShopeePay payment.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            customer_details: Customer information
            item_details: List of purchased items
            callback_url: URL to redirect after payment
            
        Returns:
            dict: Payment response with deeplink for Shopee app
        """
        shopeepay_data = {}
        if callback_url:
            shopeepay_data["callback_url"] = callback_url
        
        payload = {
            "payment_type": "shopeepay",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
        }
        
        if shopeepay_data:
            payload["shopeepay"] = shopeepay_data
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    def charge_qris(
        self,
        order_id: str,
        gross_amount: int,
        acquirer: Optional[str] = None,
        customer_details: Optional[Dict[str, Any]] = None,
        item_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Create QRIS payment.
        
        For standard QRIS (QRIS Dinamis GoPay), omit the acquirer parameter.
        Only specify acquirer if you need a specific acquirer like 'airpay shopee'.
        
        Args:
            order_id: Unique order identifier
            gross_amount: Total amount in IDR
            acquirer: QRIS acquirer (optional) - 'gopay' or 'airpay shopee'
                     If None, uses default QRIS without acquirer specification
            customer_details: Customer information
            item_details: List of purchased items
            
        Returns:
            dict: Payment response with QR code URL in actions array
        """
        payload = {
            "payment_type": "qris",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(gross_amount),
            },
        }
        
        # Only include acquirer if explicitly specified
        # For standard QRIS Dinamis GoPay, omit this parameter
        if acquirer:
            payload["qris"] = {
                "acquirer": acquirer,
            }
        
        if customer_details:
            payload["customer_details"] = customer_details
        
        if item_details:
            payload["item_details"] = item_details
        
        return self._make_request("POST", "charge", payload, order_id)
    
    # =========================================================================
    # TRANSACTION MANAGEMENT
    # =========================================================================
    
    def get_transaction_status(self, order_id: str) -> Dict[str, Any]:
        """
        Get transaction status from Midtrans.
        
        Args:
            order_id: The order ID to check
            
        Returns:
            dict: Transaction status response
            
        Example response:
        {
            "status_code": "200",
            "status_message": "Success, transaction found",
            "transaction_id": "abc-123",
            "transaction_status": "settlement",
            "fraud_status": "accept",
            "gross_amount": "150000.00",
            "payment_type": "bank_transfer",
            "transaction_time": "2024-01-15 10:30:00"
        }
        """
        return self._make_request("GET", f"{order_id}/status", order_id=order_id)
    
    def cancel_transaction(self, order_id: str) -> Dict[str, Any]:
        """
        Cancel a pending transaction.
        
        Args:
            order_id: The order ID to cancel
            
        Returns:
            dict: Cancellation response
        """
        return self._make_request("POST", f"{order_id}/cancel", order_id=order_id)
    
    def expire_transaction(self, order_id: str) -> Dict[str, Any]:
        """
        Expire a pending transaction.
        
        Args:
            order_id: The order ID to expire
            
        Returns:
            dict: Expiration response
        """
        return self._make_request("POST", f"{order_id}/expire", order_id=order_id)
    
    def approve_transaction(self, order_id: str) -> Dict[str, Any]:
        """
        Approve a challenged transaction (fraud detection).
        
        Args:
            order_id: The order ID to approve
            
        Returns:
            dict: Approval response
        """
        return self._make_request("POST", f"{order_id}/approve", order_id=order_id)
    
    def deny_transaction(self, order_id: str) -> Dict[str, Any]:
        """
        Deny a challenged transaction (fraud detection).
        
        Args:
            order_id: The order ID to deny
            
        Returns:
            dict: Denial response
        """
        return self._make_request("POST", f"{order_id}/deny", order_id=order_id)
    
    def refund_transaction(
        self,
        order_id: str,
        amount: Optional[int] = None,
        reason: str = "Customer request",
    ) -> Dict[str, Any]:
        """
        Refund a successful transaction.
        
        Args:
            order_id: The order ID to refund
            amount: Refund amount in IDR (None for full refund)
            reason: Reason for refund
            
        Returns:
            dict: Refund response
        """
        payload = {
            "reason": reason,
        }
        if amount is not None:
            payload["refund_amount"] = amount
        
        return self._make_request("POST", f"{order_id}/refund", payload, order_id)
    
    # =========================================================================
    # WEBHOOK SIGNATURE VALIDATION
    # =========================================================================
    
    @staticmethod
    def validate_signature(
        order_id: str,
        status_code: str,
        gross_amount: str,
        signature_key: str,
        server_key: str,
    ) -> bool:
        """
        Validate webhook notification signature.
        
        Midtrans signature formula:
        SHA512(order_id + status_code + gross_amount + server_key)
        
        Args:
            order_id: Order ID from notification
            status_code: Status code from notification
            gross_amount: Gross amount from notification
            signature_key: Signature from notification
            server_key: Your Midtrans server key
            
        Returns:
            bool: True if signature is valid
        """
        # Create signature string
        signature_string = f"{order_id}{status_code}{gross_amount}{server_key}"
        
        # Generate SHA512 hash
        calculated_signature = hashlib.sha512(signature_string.encode()).hexdigest()
        
        # Compare signatures (constant-time comparison for security)
        return hmac.compare_digest(calculated_signature, signature_key)
    
    def validate_notification(self, notification: Dict[str, Any]) -> bool:
        """
        Validate webhook notification signature.
        
        Args:
            notification: Webhook notification payload
            
        Returns:
            bool: True if signature is valid
        """
        required_fields = ['order_id', 'status_code', 'gross_amount', 'signature_key']
        
        # Check required fields
        for field in required_fields:
            if field not in notification:
                logger.error(f"Missing required field in notification: {field}")
                return False
        
        return self.validate_signature(
            order_id=notification['order_id'],
            status_code=notification['status_code'],
            gross_amount=notification['gross_amount'],
            signature_key=notification['signature_key'],
            server_key=self.server_key,
        )
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def is_transaction_success(self, status: Dict[str, Any]) -> bool:
        """
        Check if transaction is successful.
        
        Args:
            status: Transaction status response
            
        Returns:
            bool: True if transaction is successful
        """
        transaction_status = status.get('transaction_status', '').lower()
        fraud_status = status.get('fraud_status', 'accept').lower()
        
        # settlement = payment complete
        # capture = card captured, waiting for settlement (usually auto-settles)
        if transaction_status == 'settlement':
            return True
        
        if transaction_status == 'capture' and fraud_status == 'accept':
            return True
        
        return False
    
    def is_transaction_pending(self, status: Dict[str, Any]) -> bool:
        """
        Check if transaction is pending.
        
        Args:
            status: Transaction status response
            
        Returns:
            bool: True if transaction is pending
        """
        transaction_status = status.get('transaction_status', '').lower()
        return transaction_status == 'pending'
    
    def is_transaction_failed(self, status: Dict[str, Any]) -> bool:
        """
        Check if transaction failed.
        
        Args:
            status: Transaction status response
            
        Returns:
            bool: True if transaction failed
        """
        transaction_status = status.get('transaction_status', '').lower()
        fraud_status = status.get('fraud_status', 'accept').lower()
        
        failed_statuses = ['deny', 'cancel', 'expire', 'failure']
        
        if transaction_status in failed_statuses:
            return True
        
        if transaction_status == 'capture' and fraud_status in ['deny', 'challenge']:
            return True
        
        return False
    
    def get_transaction_status_message(self, status: Dict[str, Any]) -> str:
        """
        Get human-readable status message.
        
        Args:
            status: Transaction status response
            
        Returns:
            str: Status message
        """
        transaction_status = status.get('transaction_status', '').lower()
        
        messages = {
            'settlement': 'Payment successful',
            'pending': 'Payment pending',
            'capture': 'Payment captured (pending verification)',
            'deny': 'Payment denied',
            'cancel': 'Payment cancelled',
            'expire': 'Payment expired',
            'failure': 'Payment failed',
        }
        
        return messages.get(transaction_status, f'Unknown status: {transaction_status}')


# =============================================================================
# SINGLETON CLIENT (recreated if settings change, e.g. env fix in production)
# =============================================================================

_midtrans_client = None


def get_midtrans_client() -> MidtransClient:
    """
    Get Midtrans client instance. Uses cached client only if settings match,
    so production env (MIDTRANS_IS_PRODUCTION, MIDTRANS_SERVER_KEY) is always
    respected after restart or env change.
    """
    global _midtrans_client
    current_production = getattr(settings, 'MIDTRANS_PRODUCTION', False)
    current_server_key = getattr(settings, 'MIDTRANS_SERVER_KEY', None) or ""

    if _midtrans_client is not None:
        if _midtrans_client.is_production != current_production or _midtrans_client.server_key != current_server_key:
            _midtrans_client = None

    if _midtrans_client is None:
        _midtrans_client = MidtransClient()

    return _midtrans_client
