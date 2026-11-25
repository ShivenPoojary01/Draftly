
# AI-Assisted Development Workflow

## 1. Overview

AI tools were used throughout the development of Draftly as a programming assistant, debugging resource, and technical learning aid.

The goal was to accelerate development while understanding, reviewing, and testing the generated implementation.

## 2. Tools Used

- ChatGPT – implementation guidance, debugging, code review, and technical explanations.
- Visual Studio Code – development environment and code editing.
- Browser Developer Tools – frontend debugging and network request inspection.
- Terminal and Pytest – running the application and validating backend functionality.

## 3. How AI Was Used

### Application Development

AI assistance was used to help implement and connect:

- React frontend components.
- Flask REST API endpoints.
- Authentication and session handling.
- Document creation, editing, and persistence.
- Document sharing and permission handling.
- TXT and Markdown file importing.

### Debugging

AI was used to investigate errors encountered during development.

One example was the file import failure. The frontend was sending requests with a globally configured JSON Content-Type header. This interfered with multipart file uploads.

After reviewing the Axios configuration, the global header was removed. Axios could then handle the request content type automatically, and file importing worked successfully.

### Learning and Understanding

Technical explanations were used to understand:

- REST API communication.
- Session-based authentication.
- SQLAlchemy relationships.
- Document ownership and access permissions.
- HTTP methods and response codes.
- File uploads using multipart form data.

## 4. Human Review and Verification

AI-generated suggestions were not treated as automatically correct.

The implementation was reviewed and tested through:

- Running the frontend and backend locally.
- Testing document creation, editing, and deletion.
- Logging in with separate demo accounts.
- Testing Editor and Viewer permissions.
- Verifying persistence after refreshing and logging in again.
- Testing file importing.
- Running automated backend tests using Pytest.

UI suggestions were also reviewed against the intended application design and adjusted where necessary.

## 5. Decisions and Scope

Development decisions were made based on the assessment requirements and available time.

The focus was placed on core document management, authentication, sharing, persistence, and file importing rather than implementing optional features such as real-time collaboration or version history.

## 6. Outcome

AI assistance helped speed up implementation and troubleshooting while providing explanations of the underlying concepts.

The final application was tested manually and with an automated backend test. Further testing and deployment validation remain part of the submission process.
