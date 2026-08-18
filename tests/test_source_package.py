"""Territory tests for LegalSourcePackage import.

> _Byline: Grok · grok-4.6 · 2026-08-18_
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from legal_workspace.contracts.source_package import (
    LegalSourcePackage,
    LegalSourcePackageItem,
    ReviewState,
)
from legal_workspace.services.source_package import import_legal_source_package


def _item(state: ReviewState) -> LegalSourcePackageItem:
    return LegalSourcePackageItem(
        item_id=uuid4(),
        assertion_id=uuid4(),
        assertion_version=1,
        span_locator="src:msg:12:4-12:80",
        custody_locator="h1:abc",
        content_hash="sha256:deadbeef",
        review_state=state,
    )


def test_import_drops_unapproved_candidates_and_keeps_approved() -> None:
    approved = _item(ReviewState.APPROVED)
    candidate = _item(ReviewState.CANDIDATE)
    revoked = _item(ReviewState.REVOKED)
    package = LegalSourcePackage(
        package_id=uuid4(),
        manifest_hash="sha256:pkg",
        matter_id=uuid4(),
        items=[approved, candidate, revoked],
        created_at=datetime.now(UTC),
    )

    result = import_legal_source_package(package)

    assert result.blocked is False
    assert [item.item_id for item in result.accepted.items] == [approved.item_id]
    assert set(result.omitted_item_ids) == {str(candidate.item_id), str(revoked.item_id)}


def test_import_blocks_when_nothing_is_approved() -> None:
    package = LegalSourcePackage(
        package_id=uuid4(),
        manifest_hash="sha256:pkg",
        matter_id=uuid4(),
        items=[_item(ReviewState.CANDIDATE)],
        created_at=datetime.now(UTC),
    )

    result = import_legal_source_package(package)

    assert result.blocked is True
    assert result.accepted.items == []
    assert result.reason == "no approved items in package"
