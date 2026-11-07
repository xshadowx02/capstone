from config import Settings

global_setting = Settings()

if global_setting.llm_backend == "openrouter":
    from . import openrouter as _backend
else:
    from . import ollama as _backend

health = _backend.health
classify = _backend.classify
embed = _backend.embed
answer = _backend.answer