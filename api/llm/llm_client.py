# Abstraction layer to enable easy replacement of LLM calls

from . import ollama as _backend

health = _backend.health
embed = _backend.embed
answer = _backend.answer