
import pytest

from app import app
from models import db, User


@pytest.fixture
def client():
    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
        SQLALCHEMY_DATABASE_URI="sqlite://"
    )

    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(
            name="Shiven",
            email="shiven@draftly.demo"
        )
        user.set_password("Shiven@123")

        db.session.add(user)
        db.session.commit()

        yield app.test_client()

        db.session.remove()
        db.drop_all()


def test_login_and_create_document(client):
    # Unauthenticated users cannot access documents
    response = client.get("/api/documents")
    assert response.status_code == 401

    # Log in
    response = client.post(
        "/api/auth/login",
        json={
            "email": "shiven@draftly.demo",
            "password": "Shiven@123"
        }
    )

    assert response.status_code == 200

    # Create a document
    response = client.post(
        "/api/documents",
        json={"title": "Automated Test Document"}
    )

    assert response.status_code == 201

    document = response.get_json()
    assert document["title"] == "Automated Test Document"

    # Verify it appears in the document list
    response = client.get("/api/documents")

    assert response.status_code == 200

    documents = response.get_json()
    assert any(
        doc["title"] == "Automated Test Document"
        for doc in documents
    )
