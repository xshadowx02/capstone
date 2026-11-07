import json, httpx
from config import Settings

global_setting = Settings()

_MISSING_KEY = "REPLACE_WITH_OPENROUTER_API_KEY"

def _ready() -> bool:
    return bool(global_setting.openrouter_api_key) and global_setting.openrouter_api_key != _MISSING_KEY

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {global_setting.openrouter_api_key}", "Content-Type": "application/json"}

def _url(path:str) -> str:
    return global_setting.openrouter_base_url.rstrip("/") + path

async def _chat(prompt: str, json_mode: bool, timeout: float, model: str | None = None) -> str:
    payload = {
        "model": model or global_setting.chat_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(_url("/chat/completions"), json=payload, headers=_headers())
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

async def health() -> dict:
    if not _ready():
        return {
            "available": False,
            "backend": "openrouter",
            "models": [],
            "message": "Replace the placeholder in environment with your open router key"
        }
    
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(_url("/models"), headers=_headers())
            response.raise_for_status()
            response.json()["data"]
        return {
                "available": True,
                "backend": "openrouter",
                "models": [global_setting.chat_model, global_setting.embed_model],
                "message": ""
        }

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            return {
                "available": False,
                "backend": "openrouter",
                "models": [],
                "message": "OpenRouter Rejected the API Key, Replace the value"
            }

        return {
                "available": False,
                "backend": "openrouter",
                "models": [],
                "message": "OpenRouter not reachable "
            }

async def classify(
    merchant: str,
    model: str = global_setting.chat_model,
    categories: list[str] | None = None,
    evidence: list | dict | None = None,
) -> dict:
    if not categories:
        raise ValueError("At least one category is required")

    prompt = (
        f"Classify the merchant {json.dumps(merchant)} into exactly one allowed category.\n"
        f"Allowed categories: {', '.join(categories)}\n"
        f"Evidence: {json.dumps(evidence or [])}\n"
        'Reply only with JSON in this format: '
        '{"category": "one allowed category", "confidence": 0.0, "reason": "short reason"}'
    )

    result = json.loads(await _chat(prompt, True, 120, model))
    category = result.get("category")
    if category not in categories:
        raise ValueError(f"Model returned an invalid category: {category!r}")

    try:
        confidence = max(0.0, min(1.0, float(result.get("confidence", 0.0))))
    except (TypeError, ValueError):
        confidence = 0.0
    return {
        "category": category,
        "confidence": confidence,
        "reason": str(result.get("reason", "")),
    }

async def answer (prompt:str) -> str:
    return (await _chat(prompt, False, 120)).strip()

async def embed(text: list[str], kind: str = "query") -> list[list[float]]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(_url("/embeddings"), json={"model": global_setting.embed_model, "input": text}, headers=_headers())
        response.raise_for_status()
        items = response.json()["data"]
        items.sort(key=lambda item: item.get("index", 0))
        return [item["embedding"] for item in items]