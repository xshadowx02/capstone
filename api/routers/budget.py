from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/budget", tags=["budget"])


class BudgetUpdateItem(BaseModel):
    category: str
    monthly_limit: float


class BudgetUpdateRequest(BaseModel):
    cardholder_id: int = 1
    items: List[BudgetUpdateItem]


@router.get("/overview")
async def budget_overview(cardholder_id: int = 1, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT
                bs.category,
                bs.monthly_limit,
                COALESCE(SUM(sl.amount), 0) as spent,
                COUNT(sl.id) as txn_count
            FROM budget_settings bs
            LEFT JOIN (
                SELECT sl.id, sl.cardholder_id, sl.amount, c.category
                FROM statement_lines sl
                JOIN categorizations c ON c.statement_line_id = sl.id
                WHERE EXTRACT(MONTH FROM sl.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM sl.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            ) sl ON sl.cardholder_id = bs.cardholder_id AND sl.category = bs.category
            WHERE bs.cardholder_id = :cid
            GROUP BY bs.category, bs.monthly_limit
            ORDER BY bs.monthly_limit DESC
        """),
        {"cid": cardholder_id},
    )
    rows = result.mappings().all()
    budget_data = []
    for row in rows:
        d = dict(row)
        d["remaining"] = float(d["monthly_limit"]) - float(d["spent"])
        d["pct_used"] = round(float(d["spent"]) / float(d["monthly_limit"]) * 100, 1) if d["monthly_limit"] else 0
        budget_data.append(d)
    return budget_data


@router.put("/update")
async def update_budget(req: BudgetUpdateRequest, db: AsyncSession = Depends(get_db)):
    for item in req.items:
        await db.execute(
            text("""
                INSERT INTO budget_settings (cardholder_id, category, monthly_limit)
                VALUES (:cid, :cat, :lim)
                ON CONFLICT (cardholder_id, category)
                DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
            """),
            {"cid": req.cardholder_id, "cat": item.category, "lim": item.monthly_limit},
        )
    await db.commit()
    return {"updated": len(req.items)}
