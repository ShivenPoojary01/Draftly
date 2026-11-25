
import { useEffect, useState } from "react";
import "./App.css";
import ImportFile from "./components/ImportFile";
import Login from "./pages/Login";
import DocumentEditor from "./pages/DocumentEditor";
import api from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("All documents");
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Restore user session
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await api.get("/auth/me");
        if (!cancelled) setUser(response.data);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch documents
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchDocuments() {
      setDocumentsLoading(true);
      setDocumentError("");

      try {
        const response = await api.get("/documents");

        if (!cancelled) {
          setDocuments(
            response.data.map((doc) => ({
              ...doc,
              updated: doc.updated_at
                ? new Date(doc.updated_at).toLocaleString()
                : "Recently",
              icon: "📄",
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setDocumentError(
            error.response?.data?.error ||
              "Unable to load documents. Please try again."
          );
        }
      } finally {
        if (!cancelled) setDocumentsLoading(false);
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  // Create document
  async function createDocument() {
    setDocumentError("");

    try {
      const response = await api.post("/documents", {
        title: "Untitled Document",
      });

      setRefreshKey((current) => current + 1);
      setSelectedDocumentId(response.data.id);
    } catch (error) {
      setDocumentError(
        error.response?.data?.error || "Could not create document."
      );
    }
  }

  // Logout
  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    }

    setUser(null);
    setSelectedDocumentId(null);
    setDocuments([]);
    setActiveMenuId(null);
  }

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(search.toLowerCase());

    if (activeTab === "Shared with me") {
      return matchesSearch && doc.type === "shared";
    }

    if (activeTab === "My documents") {
      return matchesSearch && doc.type === "owned";
    }

    return matchesSearch;
  });

  if (!user) return <Login onLogin={setUser} />;

  if (selectedDocumentId) {
    return (
      <DocumentEditor
        documentId={selectedDocumentId}
        currentUserId={user.id}
        onBack={() => {
          setSelectedDocumentId(null);
          setActiveMenuId(null);
          setRefreshKey((current) => current + 1);
        }}
      />
    );
  }

  return (
    <div className="draftly-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <span>draftly</span>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">S</div>
          <div className="workspace-info">
            <strong>Personal workspace</strong>
            <small>Free plan</small>
          </div>
          <span className="switch-arrow">⌄</span>
        </div>

        <button className="sidebar-create" onClick={createDocument}>
          <span>＋</span> New document
        </button>

        <div className="sidebar-section">
          <span className="sidebar-label">WORKSPACE</span>

          {[
            ["All documents", "▤"],
            ["My documents", "▧"],
            ["Shared with me", "⇄"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${
                activeTab === label ? "selected" : ""
              }`}
              onClick={() => {
                setActiveTab(label);
                setActiveMenuId(null);
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">YOUR SPACE</span>

          <button className="nav-item">
            <span>☆</span> Starred
          </button>

          <button className="nav-item">
            <span>⌛</span> Recent
          </button>

          <button className="nav-item">
            <span>⌫</span> Trash
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="storage-info">
            <div className="storage-heading">
              <span>Storage</span>
              <span>12% used</span>
            </div>

            <div className="storage-track">
              <div className="storage-fill" />
            </div>

            <small>120 MB of 1 GB used</small>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="user-details">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>

            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main
        className="main-area"
        onClick={() => {
          if (activeMenuId !== null) setActiveMenuId(null);
        }}
      >
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>{activeTab}</strong>
          </div>

          <div className="topbar-actions">
            <div className="top-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">YOUR WORKSPACE</div>
              <h1>Make room for ideas.</h1>
              <p>Everything you're working on, all in one place.</p>
            </div>

            <button className="primary-button" onClick={createDocument}>
              <span>＋</span> Create document
            </button>
          </section>

          <section className="quick-create">
            <button
              className="quick-card blank-card"
              onClick={createDocument}
            >
              <div className="quick-icon purple">＋</div>

              <div>
                <strong>Blank document</strong>
                <small>Start with a fresh page</small>
              </div>

              <span className="quick-arrow">↗</span>
            </button>

            <button
  type="button"
  className="quick-card shared-card"
  onClick={() => {
    setActiveTab("Shared with me");
    setSearch("");
    setActiveMenuId(null);
  }}
>
  <div className="quick-icon blue">↗</div>

  <div>
    <strong>Shared workspace</strong>
    <small>Work together on documents</small>
  </div>
</button>

            <ImportFile
              onImported={(documentId) => {
                setRefreshKey((current) => current + 1);
                setSelectedDocumentId(documentId);
              }}
            />
          </section>

          <section className="documents-area">
            <div className="documents-heading">
              <div>
                <h2>{activeTab}</h2>
                <p>Manage and find your documents.</p>
              </div>

              <div className="document-tools">
                <div className="search-box">
                  <span>⌕</span>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search documents..."
                  />
                </div>
              </div>
            </div>

            <div className="document-table">
              <div className="table-header">
                <span>NAME</span>
                <span>OWNER</span>
                <span>LAST MODIFIED</span>
                <span>ACCESS</span>
                <span></span>
              </div>

              {documentError && (
                <div style={{ padding: "15px", color: "#c03939" }}>
                  {documentError}
                </div>
              )}

              {documentsLoading && (
                <div className="empty-state">Loading documents...</div>
              )}

              {!documentsLoading &&
                filteredDocuments.map((doc) => (
                  <div
                    className="document-row clickable-row"
                    key={doc.id}
                    onClick={() => setSelectedDocumentId(doc.id)}
                  >
                    <div className="document-name">
                      <div className="file-icon">
                        {doc.icon || "📄"}
                      </div>

                      <strong>{doc.title}</strong>
                    </div>

                    <div className="owner-cell">
                      <div className="mini-avatar">
                        {doc.owner?.charAt(0).toUpperCase()}
                      </div>

                      {doc.owner}
                    </div>

                    <span className="modified-cell">
                      {doc.updated}
                    </span>

                    <span>
                      <span
                        className={`access-tag ${
                          doc.type === "shared" ? "shared" : "owned"
                        }`}
                      >
                        {doc.type === "shared" ? "Shared" : "Private"}
                      </span>
                    </span>

                    <div
                      className="document-menu-container"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="more-button"
                        aria-label={`Options for ${doc.title}`}
                        aria-expanded={activeMenuId === doc.id}
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === doc.id ? null : doc.id
                          )
                        }
                      >
                        ⋯
                      </button>

                      {activeMenuId === doc.id && (
                        <div
                          className="document-dropdown"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setSelectedDocumentId(doc.id);
                            }}
                          >
                            Open document
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setSelectedDocumentId(doc.id);
                            }}
                          >
                            Manage sharing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {!documentsLoading && filteredDocuments.length === 0 && (
                <div className="empty-state">
                  <div>📄</div>
                  <strong>No documents found</strong>
                  <p>Try another search or create a new document.</p>

                  <button
                    className="primary-button"
                    onClick={createDocument}
                  >
                    Create document
                  </button>
                </div>
              )}
            </div>

            <div className="table-footer">
              Showing {filteredDocuments.length} documents
              <span>Draftly Workspace</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
