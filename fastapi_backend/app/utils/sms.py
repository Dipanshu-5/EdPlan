from twilio.rest import Client

from app.core.config import settings


def send_sms(body: str, to_number: str) -> None:
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_from_number:
        raise RuntimeError("Twilio settings missing")

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    client.messages.create(body=body, from_=settings.twilio_from_number, to=to_number)
