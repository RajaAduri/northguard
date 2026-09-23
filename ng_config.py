"""The single configuration surface for the Python side (services + scripts).

Reads inputs/northGuard/.env once, tolerating a UTF-8 BOM (Windows editors add one,
which breaks naive parsers). Values already present in the real environment win over
.env, so a caller can override without editing the file. The LLM key is read but never
logged — callers pass `cfg.llm_key` straight into a request header.
"""
from __future__ import annotations

import os
from pathlib import Path

_ENV_PATH = Path(__file__).resolve().parent / ".env"


def _load_env(path: Path = _ENV_PATH) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8-sig")  # utf-8-sig strips a leading BOM
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if key and key not in os.environ:  # real environment wins
            os.environ[key] = value


_load_env()


def _req(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        raise RuntimeError(f"required configuration '{name}' is not set (see .env.example)")
    return v


class Config:
    """Resolved configuration. `repr` masks the key so it never lands in a log."""

    llm_url = os.environ.get("LOCAL_LLM_URL", "http://127.0.0.1:11434/v1")
    llm_model = os.environ.get("LOCAL_LLM_MODEL", "gemma3:4b")
    llm_model_alt = os.environ.get("LOCAL_LLM_MODEL_ALT", "")
    llm_key = os.environ.get("LOCAL_LLM_KEY", "not-required")

    backstop_port = int(os.environ.get("BACKSTOP_PORT", "8078"))
    backstop_url = os.environ.get("NORTHGUARD_BACKSTOP_URL", "http://127.0.0.1:8078/inspect")
    backstop_health_url = os.environ.get("NORTHGUARD_BACKSTOP_HEALTH_URL", "http://127.0.0.1:8078/health")

    kg_sidecar_port = int(os.environ.get("KG_SIDECAR_PORT", "8077"))
    kg_sidecar_url = os.environ.get("KG_SIDECAR_URL", "http://127.0.0.1:8077")

    embedding_model = os.environ.get("EMBEDDING_MODEL", "intfloat/multilingual-e5-base")
    embedding_model_revision = os.environ.get("EMBEDDING_MODEL_REVISION", "main")

    web_port = int(os.environ.get("WEB_PORT", "5173"))
    web_host = os.environ.get("WEB_HOST", "0.0.0.0")

    def __repr__(self) -> str:
        return (
            f"Config(llm_url={self.llm_url!r}, llm_model={self.llm_model!r}, "
            f"llm_key='***', backstop_url={self.backstop_url!r}, "
            f"kg_sidecar_url={self.kg_sidecar_url!r}, embedding_model={self.embedding_model!r})"
        )


cfg = Config()
