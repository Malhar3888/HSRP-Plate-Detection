import os
import uuid
from datetime import datetime
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class SmsResponse(BaseModel):
    status: str
    message_id: str | None = None
    message: str | None = None

class SmsService:
    def __init__(self):
        self.provider = os.getenv("SMS_PROVIDER", "mock")
        self.api_key = os.getenv("SMS_API_KEY", "")
        self.api_secret = os.getenv("SMS_API_SECRET", "")
        self.sender_id = os.getenv("SMS_SENDER_ID", "ANPR_HSRP")
        
        # Twilio specific
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.twilio_from_number = os.getenv("TWILIO_FROM_NUMBER", "")
        
    def send_sms(self, phone_number: str, message: str) -> SmsResponse:
        """
        Sends an SMS to the specified phone number.
        """
        if self.provider.lower() == "mock":
            return self._send_mock_sms(phone_number, message)
        elif self.provider.lower() == "twilio":
            return self._send_twilio_sms(phone_number, message)
        else:
            return SmsResponse(status="failed", message=f"Unsupported SMS provider: {self.provider}")

    def _send_mock_sms(self, phone_number: str, message: str) -> SmsResponse:
        """Simulates sending an SMS (for development)."""
        print(f"--- MOCK SMS ---")
        print(f"To: {phone_number}")
        print(f"From: {self.sender_id}")
        print(f"Message: {message}")
        print(f"----------------")
        return SmsResponse(
            status="sent", 
            message_id=f"mock-{uuid.uuid4()}", 
            message="Mock SMS sent successfully"
        )
        
    def _send_twilio_sms(self, phone_number: str, message: str) -> SmsResponse:
        """Sends an SMS using Twilio."""
        try:
            # Lazy import to avoid crash if not installed
            from twilio.rest import Client
            from twilio.base.exceptions import TwilioRestException
            
            if not self.twilio_account_sid or not self.twilio_auth_token:
                return SmsResponse(status="failed", message="Twilio credentials not configured")
                
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            msg = client.messages.create(
                body=message,
                from_=self.twilio_from_number,
                to=phone_number
            )
            
            return SmsResponse(
                status="sent",
                message_id=msg.sid,
                message="SMS sent successfully via Twilio"
            )
        except ImportError:
            return SmsResponse(status="failed", message="Twilio package not installed. Run 'pip install twilio'")
        except Exception as e:
            return SmsResponse(status="failed", message=str(e))

sms_service = SmsService()
