"""Contract tests for the held D08 LegalSourcePackage v1 consumer boundary.

Byline: Codex D09 · GPT-5 · 2026-09-23
"""

from __future__ import annotations

from dataclasses import FrozenInstanceError
from datetime import UTC, datetime
from inspect import signature
from uuid import uuid4

import pytest
from legal_workspace.integrations.legal_source_package_v1 import (
    HeldLegalSourcePackageV1Consumer,
    LegalSourcePackageV1Consumer,
    LegalSourcePackageV1Held,
    PackageAvailabilityReceipt,
)
from legal_workspace.services.workspace import Workspace


def _files(path) -> dict[str, bytes]:
    return {
        str(item.relative_to(path)): item.read_bytes() for item in path.rglob("*") if item.is_file()
    }


def test_held_consumer_fails_closed_and_exposes_only_atomic_acceptance() -> None:
    consumer = HeldLegalSourcePackageV1Consumer()

    assert isinstance(consumer, LegalSourcePackageV1Consumer)
    assert tuple(signature(consumer.accept_if_current).parameters) == (
        "serialized_package",
        "expected_matter_id",
    )
    assert not hasattr(consumer, "verify")
    assert not hasattr(consumer, "acknowledge")
    assert not hasattr(consumer, "persist")

    with pytest.raises(
        LegalSourcePackageV1Held,
        match="trusted issuer keys.*canonical producer snapshot.*atomic conditional inbox",
    ):
        consumer.accept_if_current(b"{}", expected_matter_id=uuid4())


def test_held_consumer_cannot_mutate_existing_workspace(tmp_path) -> None:
    workspace = Workspace(tmp_path)
    matter_id = workspace.load().matter.matter_id
    before = _files(tmp_path)

    with pytest.raises(LegalSourcePackageV1Held):
        HeldLegalSourcePackageV1Consumer().accept_if_current(
            b'{"schema_version":"legal-source-package/v1"}',
            expected_matter_id=matter_id,
        )

    assert _files(tmp_path) == before
    assert workspace.load().package is None


def test_availability_receipt_is_immutable_and_revision_bound() -> None:
    receipt = PackageAvailabilityReceipt(
        package_id=uuid4(),
        matter_id=uuid4(),
        package_digest="sha256:" + "a" * 64,
        producer_revision="sha256:" + "b" * 64,
        accepted_at=datetime.now(UTC),
    )

    with pytest.raises(FrozenInstanceError):
        receipt.producer_revision = "sha256:" + "c" * 64  # type: ignore[misc]
