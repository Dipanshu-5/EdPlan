from pydantic import BaseModel


class ResponseEnvelope(BaseModel):
    success: bool
    message: str | None = None


class DataEnvelope(ResponseEnvelope):
    data: dict | list | None = None
