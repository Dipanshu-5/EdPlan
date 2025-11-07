from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.customer import CustomerRequest
from app.security.auth import get_current_user
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("")
async def upsert_customer(
    payload: CustomerRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    customer = await customer_service.upsert_customer(db, current_user, payload)
    return {"success": True, "message": "Customer saved", "data": {"id": customer.id}}


@router.get("")
async def list_customers(db: AsyncSession = Depends(get_db)):
    customers = await customer_service.list_customers(db)
    return {"success": True, "data": [
        {
            "id": customer.id,
            "company_name": customer.company_name,
            "notes": customer.notes,
            "user_id": customer.user_id,
        }
        for customer in customers
    ]}


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    await customer_service.delete_customer(db, customer_id)
    return {"success": True, "message": "Customer deleted"}
