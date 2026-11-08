"""
Guardrails module -- defends against prompt injection, jailbreak attempts,
and other LLM attacks before sending text to the model.
"""
import os
import re
from functools import lru_cache
from typing import List, Tuple

from guardrails import Guard
from guardrails_ai.detect_jailbreak import DetectJailbreak
from guardrails_ai.unusual_prompt import UnusualPrompt

from config import settings

# Forbidden patterns
PROMPT_INJECTION_PATTERNS: List[re.Pattern] = [
    re.compile(r"ignore (all |previous |above |prior )?instructions?", re.IGNORECASE),
    re.compile(r"disregard (all |previous |above |prior )?instructions?", re.IGNORECASE),
    re.compile(r"forget (all |previous |above |prior )?instructions?", re.IGNORECASE),
    re.compile(r"you are now", re.IGNORECASE),
    re.compile(r"act as (a |an )?(different|new|another)?", re.IGNORECASE),
    re.compile(r"pretend (you are|to be)", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN mode", re.IGNORECASE),
    re.compile(r"developer mode", re.IGNORECASE),
    re.compile(r"system prompt", re.IGNORECASE),
    re.compile(r"---+\s*(system|user|assistant)", re.IGNORECASE),
    re.compile(r"<\|?(system|user|assistant|im_start|im_end)\|?>", re.IGNORECASE),
    re.compile(r"\[INST\]", re.IGNORECASE),
    re.compile(r"you are (a |an )?(helpful|evil|unrestricted|uncensored)", re.IGNORECASE),
    re.compile(r"(reveal|show|print|output|display) (your |the )?(system |hidden |secret |full )?(prompt|instructions?|context)", re.IGNORECASE),
    re.compile(r"(send|email|post|transmit|leak) .{0,50}(to|via|through) .{0,100}(http|www|@)", re.IGNORECASE),
    re.compile(r"(DROP|DELETE|TRUNCATE|INSERT|UPDATE)\s+(TABLE|FROM|INTO|DATABASE)", re.IGNORECASE),
    re.compile(r"<script[^>]*>", re.IGNORECASE),
]

SUSPICIOUS_LENGTH_THRESHOLD = 1000

@lru_cache(maxsize=1)
def _get_guard() -> Guard:
    os.environ.setdefault("OLLAMA_API_BASE", settings.ollama_host)
    return Guard().use(
        DetectJailbreak(),
        UnusualPrompt(llm_callable=f"ollama/{settings.chat_model}"),
    )


def check_guardrails(text: str) -> Tuple[bool, List[str]]:
    """Returns whether text passed checks and any corresponding flags."""
    flags: List[str] = []

    if len(text) > SUSPICIOUS_LENGTH_THRESHOLD:
        flags.append(f"TEXT_TOO_LONG:{len(text)}chars")

    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            flags.append(f"PATTERN_MATCH:{pattern.pattern[:60]}")

    control_chars = [c for c in text if ord(c) < 32 and c not in ("\n", "\r", "\t")]
    if control_chars:
        flags.append(f"CONTROL_CHARS:{len(control_chars)}")

    special = sum(1 for c in text if not c.isalnum() and c not in " .,\'-/()\u20b1#")
    if len(text) > 0 and special / len(text) > 0.35:
        flags.append(f"HIGH_SPECIAL_CHAR_RATIO:{special/len(text):.2f}")

    if flags:
        return False, flags

    try:
        outcome = _get_guard().validate(text)
    except Exception as exc:
        return False, [f"VALIDATOR_ERROR:{type(exc).__name__}"]

    if not outcome.validation_passed:
        flags.append("PROMPT_VALIDATION_FAILED")

    return len(flags) == 0, flags


def sanitize_for_llm(text: str) -> str:
    """Strip dangerous characters, trim whitespace, enforce max length."""
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text[:800]