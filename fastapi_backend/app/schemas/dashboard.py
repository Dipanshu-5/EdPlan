from pydantic import BaseModel


class DashboardCounts(BaseModel):
    customers: int
    plans: int
    reschedules: int
