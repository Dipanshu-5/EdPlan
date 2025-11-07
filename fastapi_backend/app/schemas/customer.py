from pydantic import BaseModel, EmailStr


class CustomerRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str | None = None
    company_name: str | None = None
    notes: str | None = None
