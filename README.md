
# Draftly – Full-Stack Document Editor

Draftly is a lightweight full-stack document management application that allows users to create, edit, organize, import, and share documents with different access permissions.

The project was built using React for the frontend and Flask for the backend, with SQLite for persistent data storage.

## Features

- User authentication with session-based login.
- Create, edit, rename, and delete documents.
- Rich-text editing with formatting options.
- Automatic saving of document changes.
- Import TXT and Markdown files.
- Share documents with other registered users.
- Editor and Viewer permission levels.
- Read-only access for Viewer users.
- Dashboard with document search and filtering.
- Persistent document and sharing data using SQLite.

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- React Quill
- Axios
- CSS

### Backend
- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- Bleach

### Database
- SQLite

### Testing
- Pytest

## Project Structure

```text
draftly/
│
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── requirements.txt
│   ├── tests/
│   │   └── test_app.py
│   └── venv/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── index.html
│
├── README.md
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
└── SUBMISSION.md
```

## Getting Started

### Prerequisites

- Python 3.10 or later
- Node.js and npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd draftly
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Activate the virtual environment.

Windows:

```powershell
.\venv\Scripts\Activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python app.py
```

The backend runs at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## Demo Accounts

The application includes two demo accounts:

| User | Email | Password |
|---|---|---|
| Shiven | shiven@draftly.demo | Shiven@123 |
| Alex | alex@draftly.demo | Alex@123 |

These accounts can be used to test document sharing and access permissions.

## Document Permissions

| Role | View | Edit | Share | Delete |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Editor | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

## File Import

Draftly currently supports importing:

- `.txt`
- `.md`

Maximum supported file size: 2 MB.

Files must use UTF-8 encoding.

## Running Automated Tests

From the backend directory, activate the virtual environment and run:

```bash
python -m pytest -v
```

## Current Limitations

- File import currently supports TXT and Markdown formats.
- Sharing is limited to users registered in Draftly.
- Real-time collaborative editing is not currently implemented.
- The application currently uses SQLite for data storage.

## Project Status

Developed as a full-stack application demonstrating frontend development, REST API integration, authentication, database management, document permissions, and automated testing.
