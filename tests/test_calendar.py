"""Docket events persist. No invented seed dates.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from legal_workspace.api import main as main_mod
from legal_workspace.api.main import app
from legal_workspace.domain.calendar import DocketEventCreate, EventKind
from legal_workspace.services import workspace as workspace_mod
from legal_workspace.services.workspace import Workspace


def test_blank_workspace_has_no_docket_dates(tmp_path) -> None:
    state = Workspace(tmp_path).load()
    assert state.docket_events == []
    assert Workspace(tmp_path).upcoming_event_count() == 0


def test_past_and_upcoming_roundtrip(tmp_path) -> None:
    workspace = Workspace(tmp_path)
    past = workspace.add_docket_event(
        DocketEventCreate(
            occurs_at=datetime.now(UTC) - timedelta(days=30),
            title="Prior FOC conference — owner recorded",
            kind=EventKind.FOC,
            source="owner",
            confirmed=False,
        )
    )
    future = workspace.add_docket_event(
        DocketEventCreate(
            occurs_at=datetime.now(UTC) + timedelta(days=14),
            title="Owner-entered hearing placeholder only if real",
            kind=EventKind.HEARING,
            source="owner",
            confirmed=False,
        )
    )
    reloaded = Workspace(tmp_path)
    ids = {item.event_id for item in reloaded.list_docket_events()}
    assert past.event_id in ids
    assert future.event_id in ids
    assert reloaded.upcoming_event_count() == 1
    ordered = reloaded.list_docket_events()
    assert ordered[0].occurs_at <= ordered[-1].occurs_at


def test_http_docket(tmp_path) -> None:
    store = workspace_mod.get_workspace(tmp_path)
    main_mod.WORKSPACE = store
    client = TestClient(app)
    empty = client.get("/v1/docket-events")
    assert empty.status_code == 200
    assert empty.json() == []
    created = client.post(
        "/v1/docket-events",
        json={
            "occurs_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "title": "Clerk-set date to be confirmed",
            "kind": "deadline",
            "source": "owner",
            "confirmed": False,
        },
    )
    assert created.status_code == 200, created.text
    home = client.get("/v1/matter")
    assert home.json()["upcoming_event_count"] == 1
    paths = {row["path"] for row in home.json()["next_surfaces"]}
    labels = {row["label"] for row in home.json()["next_surfaces"]}
    assert "/cal" in paths and "Docket Watch" in labels
    assert "/timl" in paths and "Timeline" in labels
    assert home.json()["upcoming_events"]
    event_id = created.json()["event_id"]
    removed = client.delete(f"/v1/docket-events/{event_id}")
    assert removed.status_code == 200
    assert client.get("/v1/docket-events").json() == []
    assert client.delete(f"/v1/docket-events/{event_id}").status_code == 404
