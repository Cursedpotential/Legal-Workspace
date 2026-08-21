"""Pytest configuration for Legal-Workspace tests.

This file sets up test fixtures and overrides for the test environment.
"""

import os
import pytest
from fastapi.testclient import TestClient
from legal_workspace.api.main import app

# Set a deterministic test secret for Context Forge JWT authentication
# This ensures tests can authenticate without relying on external configuration
@pytest.fixture(autouse=True)
def set_test_jwt_secret():
    """Set a deterministic JWT secret for testing Context Forge authentication."""
    os.environ["CF_JWT_SECRET_KEY"] = "test-jwt-secret-for-testing"
    yield
    # Clean up after the test
    if "CF_JWT_SECRET_KEY" in os.environ:
        del os.environ["CF_JWT_SECRET_KEY"]


@pytest.fixture
def client_with_auth():
    """Test client that includes Context Forge authentication header."""
    return TestClient(app)