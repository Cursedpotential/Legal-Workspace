"""Pytest configuration for Legal-Workspace tests.

This file sets up test fixtures and overrides for the test environment.

Byline: Codex · GPT-5 · 2026-09-12
"""

import os

import pytest
from fastapi.testclient import TestClient
from legal_workspace.api.main import app


@pytest.fixture(autouse=True)
def explicit_unit_test_auth_bypass():
    """Keep legacy domain tests isolated; test_auth exercises the real boundary."""

    previous = os.environ.get("LEGAL_WORKSPACE_BYPASS_AUTH")
    os.environ["LEGAL_WORKSPACE_BYPASS_AUTH"] = "true"
    yield
    if previous is None:
        os.environ.pop("LEGAL_WORKSPACE_BYPASS_AUTH", None)
    else:
        os.environ["LEGAL_WORKSPACE_BYPASS_AUTH"] = previous


@pytest.fixture
def client_with_auth():
    """Test client operating under the explicit unit-test bypass."""

    return TestClient(app)
