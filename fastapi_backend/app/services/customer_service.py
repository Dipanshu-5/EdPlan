from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Customer, User
from app.schemas.customer import CustomerRequest


async def upsert_customer(db: AsyncSession, user: User, payload: CustomerRequest) -> Customer:
    result = await db.execute(select(Customer).where(Customer.user_id == user.id))
    customer = result.scalar_one_or_none()
    if not customer:
        customer = Customer(user_id=user.id)
        db.add(customer)

    customer.company_name = payload.company_name
    customer.title = payload.notes
    customer.notes = payload.notes
    await db.commit()
    await db.refresh(customer)
    return customer


async def list_customers(db: AsyncSession):
    result = await db.execute(select(Customer))
    return result.scalars().all()


async def delete_customer(db: AsyncSession, customer_id: int) -> None:
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    await db.delete(customer)
    await db.commit()
