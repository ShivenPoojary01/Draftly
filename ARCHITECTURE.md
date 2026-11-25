
# Draftly – System Architecture

## 1. Overview

Draftly follows a client-server architecture. The React frontend communicates with a Flask REST API, which handles authentication, document operations, permissions, and database interactions.

SQLite is used for persistent storage.

## 2. Architecture Diagram

```text
                 USER
                   |
                   v
          React Frontend (Vite)
                   |
             Axios HTTP Client
                   |
                   v
             Flask REST API
                   |
          Authentication Layer
                   |
          Document Access Checks
                   |
                   v
             SQLAlchemy ORM
                   |
                   v
              SQLite Database
              /      |       \
             /       |        \
          Users   Documents   Shares
```

## 3. Technology Responsibilities

### Frontend – React

The frontend provides the user interface and handles:

- Login and logout.
- Document dashboard and search.
- Document creation and editing.
- Rich-text formatting through React Quill.
- Document sharing interface.
- Viewer and Editor interface restrictions.
- File selection and upload.

Axios is used to communicate with backend API endpoints.

### Backend – Flask

The Flask backend exposes REST API endpoints for:

- User authentication.
- Document creation, retrieval, updating, and deletion.
- Document sharing and permission management.
- File importing.
- Access control and request validation.

Session-based authentication is used to identify logged-in users.

### Database – SQLite

SQLAlchemy manages database operations through three main models.

| Model | Responsibility |
|---|---|
| User | Stores user details and password hashes |
| Document | Stores document title, content, ownership and timestamps |
| DocumentShare | Stores document sharing relationships and permissions |

## 4. Authentication Flow

1. The user submits their email and password.
2. Flask verifies the credentials.
3. The session is cleared and the authenticated user's ID is stored in the session.
4. Subsequent protected API requests use the session cookie.
5. The backend checks authentication before allowing access to protected endpoints.

Passwords are stored as hashes rather than plain text.

## 5. Document Management Flow

1. A user creates a document through the React interface.
2. Axios sends a POST request to the Flask API.
3. Flask validates the document title and identifies the owner from the session.
4. SQLAlchemy stores the document in SQLite.
5. The frontend retrieves and displays the document.
6. Updates are sent to the backend and persisted in the database.

## 6. Sharing and Permission Model

Draftly supports three access levels:

- **Owner:** Full control over the document, including sharing and deletion.
- **Editor:** Can view and modify document content.
- **Viewer:** Can view document content without modifying it.

The backend verifies document access and permissions before allowing protected operations. The frontend also provides a read-only interface for Viewer users.

## 7. File Import Flow

1. The user selects a TXT or Markdown file.
2. The frontend checks the file extension and size.
3. The file is sent to the backend using multipart form data.
4. Flask validates the file type, size, and UTF-8 encoding.
5. The content is converted into HTML paragraphs.
6. A new document is created and stored in SQLite.

The current maximum file size is 2 MB.

## 8. Security and Validation

- Password hashing using Werkzeug.
- Session-based authentication.
- Protected API endpoints.
- Backend permission checks.
- File extension and size validation.
- UTF-8 encoding validation.
- HTML sanitization using Bleach where applicable.

## 9. Current Scope

The current implementation supports persistent document editing and permission-based sharing.

Real-time simultaneous editing, comments, version history, and production deployment are outside the current implemented scope.
