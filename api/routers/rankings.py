from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rankings", tags=["rankings"])


@router.get("/stores")
async def store_rankings(cardholder_id: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT
                sv.merchant_name,
                sv.visit_count,
                sv.total_spent,
                sv.last_visit,
                c.category
            FROM store_visits sv
            LEFT JOIN LATERAL (
                SELECT cat.category FROM statement_lines sl
                JOIN categorizations cat ON cat.statement_line_id = sl.id
                WHERE sl.merchant_name = sv.merchant_name
                  AND sl.cardholder_id = sv.cardholder_id
                LIMIT 1
            ) c ON true
            WHERE sv.cardholder_id = :cid
            ORDER BY sv.visit_count DESC, sv.total_spent DESC
            LIMIT :lim
        """),
        {"cid": cardholder_id, "lim": limit},
    )
    rows = result.mappings().all()
    return [
        {k: (str(v) if hasattr(v, 'isoformat') else v) for k, v in row.items()}
        for row in rows
    ]


@router.get("/cardholder")
async def get_cardholder(cardholder_id: int = 1, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM cardholders WHERE id = :cid"),
        {"cid": cardholder_id},
    )
    row = result.mappings().first()
    if not row:
        return {"error": "Not found"}
    return {k: (str(v) if hasattr(v, 'isoformat') else v) for k, v in row.items()}
