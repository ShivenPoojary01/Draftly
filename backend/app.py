
import os
from functools import wraps

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from models import db, User, Document, DocumentShare
from werkzeug.utils import secure_filename
from html import escape
import bleach

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "draftly-development-secret"
)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///draftly.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

db.init_app(app)


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return func(*args, **kwargs)
    return wrapper


def get_access(document_id, edit=False):
    document = db.session.get(Document, document_id)

    if not document:
        return None

    user_id = session["user_id"]

    if document.owner_id == user_id:
        return document

    share = DocumentShare.query.filter_by(
        document_id=document_id,
        user_id=user_id
    ).first()

    if not share:
        return None

    if edit and share.permission != "edit":
        return None

    return document


@app.route("/api/documents/import", methods=["POST"])
@login_required
def import_document():
    uploaded_file = request.files.get("file")

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"error": "Please select a file"}), 400

    filename = secure_filename(uploaded_file.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ["txt", "md"]:
        return jsonify({"error": "Only TXT and Markdown files are supported"}), 400

    file_content = uploaded_file.stream.read(2 * 1024 * 1024 + 1)

    if len(file_content) > 2 * 1024 * 1024:
        return jsonify({"error": "File must be smaller than 2 MB"}), 413

    try:
        text_content = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return jsonify({"error": "File must use UTF-8 encoding"}), 400

    # Escape imported text so it cannot inject HTML.
    safe_content = "".join(
        f"<p>{escape(line) or '<br>'}</p>"
        for line in text_content.splitlines()
    )

    doc = Document(
        title=filename.rsplit(".", 1)[0][:200] or "Imported Document",
        content=safe_content,
        owner_id=session["user_id"]
    )

    db.session.add(doc)
    db.session.commit()

    return jsonify({
        "message": "File imported successfully",
        "id": doc.id,
        "title": doc.title
    }), 201

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "Draftly"})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    session.clear()
    session["user_id"] = user.id

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    })


@app.route("/api/auth/me", methods=["GET"])
@login_required
def current_user():
    user = db.session.get(User, session["user_id"])

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email
    })


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/documents", methods=["GET"])
@login_required
def list_documents():
    user_id = session["user_id"]

    owned = Document.query.filter_by(owner_id=user_id).all()

    shared_shares = DocumentShare.query.filter_by(
        user_id=user_id
    ).all()

    result = []

    for doc in owned:
        result.append({
            "id": doc.id,
            "title": doc.title,
            "content": doc.content,
            "owner": doc.owner.name,
            "type": "owned",
            "updated_at": doc.updated_at.isoformat()
        })

    for share in shared_shares:
        doc = share.document
        result.append({
            "id": doc.id,
            "title": doc.title,
            "content": doc.content,
            "owner": doc.owner.name,
            "type": "shared",
            "permission": share.permission,
            "updated_at": doc.updated_at.isoformat()
        })

    return jsonify(result)


@app.route("/api/documents", methods=["POST"])
@login_required
def create_document():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "Untitled Document").strip()

    if not title or len(title) > 200:
        return jsonify({"error": "Invalid document title"}), 400

    doc = Document(
        title=title,
        content="",
        owner_id=session["user_id"]
    )

    db.session.add(doc)
    db.session.commit()

    return jsonify({
        "id": doc.id,
        "title": doc.title,
        "content": doc.content
    }), 201



@app.route("/api/documents/<int:doc_id>", methods=["GET"])
@login_required
def get_document(doc_id):
    doc = get_access(doc_id)

    if not doc:
        return jsonify({
            "error": "Document not found or access denied"
        }), 404

    is_owner = doc.owner_id == session["user_id"]

    if is_owner:
        permission = "owner"
        can_edit = True
    else:
        share = DocumentShare.query.filter_by(
            document_id=doc_id,
            user_id=session["user_id"]
        ).first()

        permission = share.permission if share else "view"
        can_edit = permission == "edit"

    return jsonify({
        "id": doc.id,
        "title": doc.title,
        "content": doc.content,
        "owner": doc.owner.name,
        "owner_id": doc.owner_id,
        "permission": permission,
        "can_edit": can_edit
    })

@app.route("/api/documents/<int:doc_id>", methods=["PUT"])
@login_required
def update_document(doc_id):
    doc = get_access(doc_id, edit=True)

    if not doc:
        return jsonify({"error": "Document not found or edit access denied"}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = data["title"].strip()

        if not title or len(title) > 200:
            return jsonify({"error": "Invalid title"}), 400

        doc.title = title

    if "content" in data:
        allowed_tags = [
            "p", "br", "strong", "b", "em", "i", "u",
            "h1", "h2", "h3", "ol", "ul", "li",
            "blockquote", "a"
        ]

        allowed_attributes = {"a": ["href", "title"]}

        doc.content = bleach.clean(
            data["content"],
            tags=allowed_tags,
            attributes=allowed_attributes,
            protocols=["http", "https", "mailto"],
            strip=True
        )

    db.session.commit()

    return jsonify({"message": "Document saved"})


@app.route("/api/documents/<int:doc_id>", methods=["DELETE"])
@login_required
def delete_document(doc_id):
    doc = Document.query.filter_by(
        id=doc_id,
        owner_id=session["user_id"]
    ).first()

    if not doc:
        return jsonify({"error": "Only the owner can delete this document"}), 403

    db.session.delete(doc)
    db.session.commit()

    return jsonify({"message": "Document deleted"})


def seed_users():
    if not User.query.filter_by(email="shiven@draftly.demo").first():
        user = User(name="Shiven", email="shiven@draftly.demo")
        user.set_password("Shiven@123")
        db.session.add(user)

    if not User.query.filter_by(email="alex@draftly.demo").first():
        user = User(name="Alex", email="alex@draftly.demo")
        user.set_password("Alex@123")
        db.session.add(user)

    db.session.commit()



@app.route("/api/documents/<int:doc_id>/shares", methods=["GET"])
@login_required
def list_shares(doc_id):
    doc = Document.query.filter_by(
        id=doc_id,
        owner_id=session["user_id"]
    ).first()

    if not doc:
        return jsonify({"error": "Document not found or access denied"}), 404

    shares = DocumentShare.query.filter_by(document_id=doc_id).all()

    return jsonify([
        {
            "id": share.id,
            "user_id": share.user_id,
            "name": db.session.get(User, share.user_id).name,
            "email": db.session.get(User, share.user_id).email,
            "permission": share.permission
        }
        for share in shares
    ])


@app.route("/api/documents/<int:doc_id>/shares", methods=["POST"])
@login_required
def share_document(doc_id):
    doc = Document.query.filter_by(
        id=doc_id,
        owner_id=session["user_id"]
    ).first()

    if not doc:
        return jsonify({"error": "Only the owner can share this document"}), 403

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    permission = data.get("permission", "view")

    if permission not in ["view", "edit"]:
        return jsonify({"error": "Permission must be view or edit"}), 400

    recipient = User.query.filter_by(email=email).first()

    if not recipient:
        return jsonify({"error": "User not found"}), 404

    if recipient.id == doc.owner_id:
        return jsonify({"error": "Cannot share with yourself"}), 400

    existing = DocumentShare.query.filter_by(
        document_id=doc_id,
        user_id=recipient.id
    ).first()

    if existing:
        existing.permission = permission
    else:
        existing = DocumentShare(
            document_id=doc_id,
            user_id=recipient.id,
            permission=permission
        )
        db.session.add(existing)

    db.session.commit()

    return jsonify({
        "message": "Document shared successfully",
        "recipient": recipient.email,
        "permission": permission
    }), 200


@app.route("/api/documents/<int:doc_id>/shares/<int:share_id>", methods=["DELETE"])
@login_required
def revoke_share(doc_id, share_id):
    doc = Document.query.filter_by(
        id=doc_id,
        owner_id=session["user_id"]
    ).first()

    if not doc:
        return jsonify({"error": "Only the owner can manage sharing"}), 403

    share = DocumentShare.query.filter_by(
        id=share_id,
        document_id=doc_id
    ).first()

    if not share:
        return jsonify({"error": "Share not found"}), 404

    db.session.delete(share)
    db.session.commit()

    return jsonify({"message": "Access revoked successfully"})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_users()

    app.run(debug=True, port=5000)