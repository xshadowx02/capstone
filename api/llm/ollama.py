import json, httpx
from typing import Any, cast, List
from config import Settings

global_setting = Settings()

def _present(name:str, models: list[str]) -> bool:
    return any(model == name or model.startswith(name) for model in models)

async def health() -> bool:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{global_setting.ollama_host}/v1/models")
            response.raise_for_status()
            models = response.json()
            return _present(global_setting.chat_model, models) and _present(global_setting.embed_model, models)
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
async def answer (prompt:str) -> str:
    client_factory = cast(Any, httpx).AsyncClient
    async with client_factory(timeout=120) as client:
        response: Any = await client.post(f"{global_setting.ollama_host}/api/generate", json={"model": global_setting.chat_model, "prompt": prompt, "stream": False})
        response.raise_for_status()
        return str(response.json().get("response", "")).strip()


async def embed(text: List[str], kind: str = "query") -> list[list[float]]:
  async with httpx.AsyncClient(timeout=30) as client:
    response = await client.post(
        f"{global_setting.ollama_host}/api/embed", 
        json={"model": global_setting.embed_model, "input": text}
    )
    response.raise_for_status()
    
    data = response.json()
    return data["embeddings"]
