"""Persistence is the source of truth. A new Workspace must reload disk.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from legal_workspace.contracts.citations import EvidenceCitation
from legal_workspace.contracts.source_package import (
    LegalSourcePackage,
    LegalSourcePackageItem,
    ReviewState,
)
from legal_workspace.domain.factors import FactorCitationLink, FactorLetter
from legal_workspace.services.workspace import Workspace


def test_reload_from_disk_keeps_import_factor_and_draft(tmp_path) -> None:
    first = Workspace(tmp_path)
    assertion_id = uuid4()
    package = LegalSourcePackage(
        package_id=uuid4(),
        manifest_hash="sha256:persist",
        matter_id=uuid4(),
        created_at=datetime.now(UTC),
        items=[
            LegalSourcePackageItem(
                item_id=uuid4(),
                assertion_id=assertion_id,
                assertion_version=1,
                span_locator="span:1",
                custody_locator="h1:1",
                content_hash="sha256:1",
                review_state=ReviewState.APPROVED,
            )
        ],
    )
    citation = EvidenceCitation(
        statement="Documented exchange occurred as ordered.",
        package_id=package.package_id,
        assertion_id=assertion_id,
        assertion_version=1,
        span_locator="span:1",
    )
    first.import_package(package)
    first.attach_factor_citation(
        FactorCitationLink(
            letter=FactorLetter.J,
            side="petitioner",
            citation=citation,
            package_id=package.package_id,
        )
    )
    drafted = first.draft_factor_section(FactorLetter.J, "Factor (j)", "Dated conduct.")

    assert (tmp_path / "state.json").is_file()
    assert (tmp_path / "events.jsonl").is_file()

    reloaded = Workspace(tmp_path)
    state = reloaded.load()
    assert state.package is not None
    assert state.package.package_id == package.package_id
    factor_j = next(row for row in state.factors if row.letter is FactorLetter.J)
    assert len(factor_j.petitioner.citations) == 1
    assert state.drafts[0].section_id == drafted.section_id
    assert reloaded.gate_draft(drafted.section_id).ok is True
    log = (tmp_path / "events.jsonl").read_text(encoding="utf-8")
    assert "import" in log
    assert "draft" in log
    assert "gate" in log
