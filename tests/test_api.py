"""Drive the shipped FastAPI app, not a reimplementation.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from legal_workspace.api import main as main_mod
from legal_workspace.api.main import app
from legal_workspace.config import get_settings
from legal_workspace.services import workspace as workspace_mod

client = TestClient(app)


def test_health_uses_service_names_not_ips() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "legal-api"
    assert body["evidence_platform"] == "evidence-platform"
    settings = get_settings()
    for value in (
        settings.legal_api_service,
        settings.evidence_platform_base_url,
        settings.model_gateway_base_url,
        settings.database_url,
    ):
        assert not any(part.isdigit() and "." in part for part in value.replace("/", " ").split())
        assert "100." not in value


def test_import_endpoint_omits_candidates(tmp_path) -> None:
    main_mod.WORKSPACE = workspace_mod.get_workspace(tmp_path)
    client = TestClient(app)
    payload = {
        "package_id": str(uuid4()),
        "manifest_hash": "sha256:pkg",
        "matter_id": str(uuid4()),
        "created_at": datetime.now(UTC).isoformat(),
        "items": [
            {
                "item_id": str(uuid4()),
                "assertion_id": str(uuid4()),
                "assertion_version": 1,
                "span_locator": "s:1",
                "custody_locator": "h1:1",
                "content_hash": "sha256:a",
                "review_state": "approved",
            },
            {
                "item_id": str(uuid4()),
                "assertion_id": str(uuid4()),
                "assertion_version": 1,
                "span_locator": "s:2",
                "custody_locator": "h1:2",
                "content_hash": "sha256:b",
                "review_state": "candidate",
            },
        ],
    }
    response = client.post("/v1/legal-source-packages:import", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["blocked"] is False
    assert body["accepted_item_count"] == 1
    assert len(body["omitted_item_ids"]) == 1
