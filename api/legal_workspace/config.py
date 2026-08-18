"""Service-name configuration. Tailnet IPs are forbidden.

> _Byline: Claude Code · Kimi K2.7 · 2026-08-18_
"""

from __future__ import annotations

import re

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from legal_workspace.db.engine import default_sqlite_url

_IP_RE = re.compile(r"(?:^|[\s/=])(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "legal-workspace"
    environment: str = Field(default="dev", alias="LEGAL_WORKSPACE_ENV")
    legal_api_service: str = Field(default="legal-api")
    legal_web_service: str = Field(default="legal-web")
    legal_postgres_service: str = Field(default="legal-postgres")
    evidence_platform_service: str = Field(default="evidence-platform")
    model_gateway_service: str = Field(default="model-gateway")
    legal_api_port: int = Field(default=8010)
    display_timezone: str = Field(default="America/New_York")
    evidence_platform_base_url: str = Field(default="http://evidence-platform:8000")
    model_gateway_base_url: str = Field(default="http://model-gateway:4000")
    database_url: str = Field(default_factory=default_sqlite_url)
    invoke_models: bool = Field(default=False, alias="LEGAL_WORKSPACE_INVOKE_MODELS")

    @field_validator(
        "legal_api_service",
        "legal_web_service",
        "legal_postgres_service",
        "evidence_platform_service",
        "model_gateway_service",
        "evidence_platform_base_url",
        "model_gateway_base_url",
        "database_url",
    )
    @classmethod
    def no_embedded_ips(cls, value: str) -> str:
        if _IP_RE.search(value):
            raise ValueError("service configuration must use names, not tailnet IPs")
        return value


def get_settings() -> Settings:
    return Settings()
