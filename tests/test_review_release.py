"""Owner review and deterministic release candidates persist.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from legal_workspace.api import main as main_mod
from legal_workspace.api.main import app
from legal_workspace.contracts.citations import EpistemicClass, EvidenceCitation
from legal_workspace.contracts.source_package import (
    LegalSourcePackage,
    LegalSourcePackageItem,
    ReviewState,
)
from legal_workspace.domain.factors import FactorCitationLink, FactorLetter
from legal_workspace.domain.release import ReleaseCreate, canonical_content_hash
from legal_workspace.domain.review import ReviewCreate, ReviewVerdict
from legal_workspace.domain.work_product import WorkProductState
from legal_workspace.services import workspace as workspace_mod
from legal_workspace.services.workspace import Workspace


def _approved_package() -> tuple[LegalSourcePackage, EvidenceCitation]:
    assertion_id = uuid4()
    package = LegalSourcePackage(
        package_id=uuid4(),
        manifest_hash="sha256:review-slice",
        matter_id=uuid4(),
        created_at=datetime.now(UTC),
        items=[
            LegalSourcePackageItem(
                item_id=uuid4(),
                assertion_id=assertion_id,
                assertion_version=1,
                span_locator="sms:2024-03-12:14:02",
                custody_locator="h1:review",
                content_hash="sha256:span",
                review_state=ReviewState.APPROVED,
            )
        ],
    )
    citation = EvidenceCitation(
        statement="Parenting-time exchange occurred at the ordered location.",
        package_id=package.package_id,
        assertion_id=assertion_id,
        assertion_version=1,
        span_locator="sms:2024-03-12:14:02",
        epistemic_class=EpistemicClass.ESTABLISHED_FACT,
    )
    return package, citation


def _drafted(workspace: Workspace):
    package, citation = _approved_package()
    workspace.import_package(package)
    workspace.attach_factor_citation(
        FactorCitationLink(
            letter=FactorLetter.J,
            side="petitioner",
            citation=citation,
            package_id=package.package_id,
        )
    )
    section = workspace.draft_factor_section(
        FactorLetter.J,
        heading="Factor (j) — facilitation",
        body="Dated, documented interference mapped to MCL 722.23(j).",
    )
    return section


def test_owner_review_persists_and_agent_cannot_approve(tmp_path) -> None:
    first = Workspace(tmp_path)
    section = _drafted(first)
    decision = first.add_review(
        ReviewCreate(
            section_id=section.section_id,
            verdict=ReviewVerdict.APPROVE,
            rationale="Citations resolve to the imported package.",
        )
    )
    assert decision.reviewer == "owner"
    assert decision.content_hash.startswith("sha256:")
    reloaded = Workspace(tmp_path)
    assert any(item.review_id == decision.review_id for item in reloaded.load().reviews)
    assert reloaded.load().work_product is not None
    assert reloaded.load().work_product.state is WorkProductState.OWNER_APPROVED
    try:
        first.add_review(
            ReviewCreate(
                section_id=section.section_id,
                verdict=ReviewVerdict.APPROVE,
                rationale="agent attempt",
                reviewer="agent",
            )
        )
        raise AssertionError("agent review must fail")
    except ValueError as exc:
        assert "owner" in str(exc)


def test_release_blocked_without_approval_then_same_hash(tmp_path) -> None:
    workspace = Workspace(tmp_path)
    section = _drafted(workspace)
    blocked = workspace.build_release_candidate(ReleaseCreate(section_ids=[section.section_id]))
    assert blocked.blocked is True
    assert blocked.manifest is None
    assert Workspace(tmp_path).load().releases == []

    workspace.add_review(
        ReviewCreate(
            section_id=section.section_id,
            verdict=ReviewVerdict.APPROVE,
            rationale="Ready for candidate only.",
        )
    )
    first = workspace.build_release_candidate(ReleaseCreate(section_ids=[section.section_id]))
    second = workspace.build_release_candidate(ReleaseCreate(section_ids=[section.section_id]))
    assert first.blocked is False
    assert first.manifest is not None
    assert second.manifest is not None
    assert first.manifest.content_hash == second.manifest.content_hash
    assert first.manifest.content_hash == canonical_content_hash(
        {
            "package_id": str(workspace.load().package.package_id),
            "sections": [
                {
                    "section_id": str(section.section_id),
                    "heading": section.heading,
                    "body": section.body,
                    "factor_letter": "j",
                    "citations": [item.model_dump(mode="json") for item in section.citations],
                }
            ],
        }
    )
    assert "strategy_notes" in first.manifest.omitted_private
    export = tmp_path / "releases" / f"{first.manifest.release_id}.json"
    assert export.is_file()
    assert (tmp_path / "releases" / f"{first.manifest.release_id}.md").is_file()
    docx = tmp_path / "releases" / f"{first.manifest.release_id}.docx"
    assert docx.is_file()
    assert docx.read_bytes()[:2] == b"PK"
    reloaded = Workspace(tmp_path)
    assert len(reloaded.load().releases) == 2
    assert reloaded.load().work_product.state is WorkProductState.RELEASE_CANDIDATE


def test_http_review_and_release(tmp_path) -> None:
    store = workspace_mod.get_workspace(tmp_path)
    main_mod.WORKSPACE = store
    client = TestClient(app)
    section = _drafted(store)
    rejected = client.post(
        "/v1/releases",
        json={"section_ids": [str(section.section_id)]},
    )
    assert rejected.status_code == 200
    assert rejected.json()["blocked"] is True

    reviewed = client.post(
        "/v1/reviews",
        json={
            "section_id": str(section.section_id),
            "verdict": "approve",
            "rationale": "Owner reviewed citations.",
            "reviewer": "owner",
        },
    )
    assert reviewed.status_code == 200, reviewed.text
    home = client.get("/v1/matter")
    assert home.json()["review_count"] == 1
    assert any(row["path"] == "/rvw" and row["label"] == "Owner review" for row in home.json()["next_surfaces"])

    released = client.post(
        "/v1/releases",
        json={"section_ids": [str(section.section_id)]},
    )
    assert released.status_code == 200
    body = released.json()
    assert body["blocked"] is False
    assert body["manifest"]["content_hash"].startswith("sha256:")
    assert client.get("/v1/matter").json()["release_count"] == 1
