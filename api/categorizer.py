"""
Categorizer -- uses RAG context + OpenRouter LLM to classify statement lines.
Includes an evaluation step that scores the categorization quality.
"""
import json
from llm import llm_client
from config import settings
from guardrails import check_guardrails, sanitize_for_llm
from rag import rag_service
import logging

logger = logging.getLogger(__name__)

CATEGORIES = [
    "Food & Dining",
    "Groceries",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Health & Wellness",
    "Bills & Utilities",
    "Travel",
    "Education",
    "Coffee",
    "Other",
]

category_string = ""
for category in CATEGORIES:
    if category_string:
        category_string = category_string +", "+ category
    else:
        category_string = category

SYSTEM_PROMPT = """You are a Philippine credit card statement categorization assistant.
Your job is to categorize transaction descriptions from a cardholder based in Makati, Metro Manila.

You will be given:
1. A transaction description (merchant name + amount)
2. Relevant example categorizations retrieved from a knowledge base (RAG context)

Respond ONLY with a valid JSON object in this exact format:
{
  "category": "<one of the allowed categories>",
  "subcategory": "<specific subcategory>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<brief explanation in 1-2 sentences>"
}

Allowed categories: {category_string}

Rules:
- Only output JSON, no extra text
- confidence must be a number between 0.0 and 1.0
- Keep reasoning concise and factual
- Use context from Philippine merchant names and Makati location"""

async def categorize_transaction(
    raw_text: str,
    merchant_name: str,
    amount: float,
) -> dict:
    result = {
        "category": "Other",
        "subcategory": "Uncategorized",
        "confidence": 0.0,
        "reasoning": "",
        "rag_context": "",
        "guardrail_passed": True,
        "guardrail_flags": None,
        "eval_score": None,
        "eval_feedback": None,
        "model_used": settings.chat_model,
    }

    # 1. Guardrails
    combined = f"{merchant_name} {raw_text}"
    passed, flags = check_guardrails(combined)
    result["guardrail_passed"] = passed
    result["guardrail_flags"] = ", ".join(flags) if flags else None

    if not passed:
        logger.warning(f"Guardrail blocked: {flags}")
        result["reasoning"] = f"Transaction blocked by guardrails: {', '.join(flags)}"
        result["category"] = "Other"
        result["confidence"] = 0.0
        return result

    # 2. Sanitize
    safe_text = sanitize_for_llm(combined)

    # 3. RAG retrieval
    try:
        similar = await rag_service.search(safe_text, top_k=3)
        rag_context = "\n".join(
            f"- '{ex['text']}' -> {ex['category']} / {ex['subcategory']} (similarity: {ex['score']:.3f})"
            for ex in similar
        )
    except Exception as e:
        logger.error(f"RAG search failed: {e}")
        rag_context = "No RAG context available."
        similar = []

    result["rag_context"] = rag_context

    # 4. LLM Categorization
    user_message = f"""Transaction: {safe_text}
Amount: PHP {amount:,.2f}

RAG Context (similar known transactions):
{rag_context}

Categorize this transaction."""

    try:
        raw_output = await llm_client.answer(
            f"{SYSTEM_PROMPT}\n\n{user_message}"
        )

        if raw_output.startswith("```"):
            raw_output = raw_output.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        parsed = json.loads(raw_output)
        result["category"] = parsed.get("category", "Other")
        result["subcategory"] = parsed.get("subcategory", "")
        result["confidence"] = float(parsed.get("confidence", 0.5))
        result["reasoning"] = parsed.get("reasoning", "")

    except json.JSONDecodeError as e:
        logger.error(f"LLM JSON parse error: {e}")
        if similar:
            result["category"] = similar[0]["category"]
            result["subcategory"] = similar[0]["subcategory"]
            result["confidence"] = similar[0]["score"]
            result["reasoning"] = f"RAG fallback: {similar[0]['text']}"
    except Exception as e:
        logger.error(f"LLM categorization failed: {e}")
        if similar:
            result["category"] = similar[0]["category"]
            result["subcategory"] = similar[0]["subcategory"]
            result["confidence"] = float(similar[0]["score"])
            result["reasoning"] = "LLM unavailable, RAG fallback used."

    # 5. Evaluation
    result["eval_score"], result["eval_feedback"] = await _evaluate(
        raw_text=safe_text,
        amount=amount,
        category=result["category"],
        subcategory=result["subcategory"],
        reasoning=result["reasoning"],
        rag_context=rag_context,
    )

    return result


async def _evaluate(
    raw_text: str,
    amount: float,
    category: str,
    subcategory: str,
    reasoning: str,
    rag_context: str,
) -> tuple:
    eval_prompt = f"""You are an evaluator for a Philippine credit card categorization system.

Transaction: "{raw_text}" | Amount: PHP {amount:,.2f}
Assigned category: {category} / {subcategory}
Reasoning: {reasoning}
RAG context used: {rag_context[:300]}...

Score the quality of this categorization from 0.0 to 1.0 and explain why.
Respond ONLY with JSON: {{"score": <float>, "feedback": "<1 sentence>"}}"""

    try:
        raw = await llm_client.answer(eval_prompt)
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)
        return float(parsed.get("score", 0.5)), parsed.get("feedback", "")
    except Exception as e:
        logger.warning(f"Evaluation failed: {e}")
        return 0.5, "Evaluation unavailable"
