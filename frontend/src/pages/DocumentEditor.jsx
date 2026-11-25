
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import api from '../services/api';
import ShareDialog from '../components/ShareDialog';

function DocumentEditor({ documentId, currentUserId, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [documentOwnerId, setDocumentOwnerId] = useState(null);

  const [canEdit, setCanEdit] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('Loading document...');
  const [error, setError] = useState('');

  const [showShareDialog, setShowShareDialog] = useState(false);

  // Load document and permissions
  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      try {
        const response = await api.get(`/documents/${documentId}`);

        if (!cancelled) {
          setTitle(response.data.title || 'Untitled Document');
          setContent(response.data.content || '');
          setDocumentOwnerId(response.data.owner_id);
          setCanEdit(response.data.can_edit === true);
          setLoaded(true);

          setStatus(
            response.data.can_edit
              ? 'All changes saved'
              : 'View only'
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
            'Could not load this document.'
          );
          setStatus('Failed to load');
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Automatic saving
  useEffect(() => {
    if (!loaded || !dirty || !canEdit) return;

    setStatus('Saving...');

    const timer = setTimeout(async () => {
      try {
        await api.put(`/documents/${documentId}`, {
          title: title.trim() || 'Untitled Document',
          content,
        });

        setDirty(false);
        setStatus('All changes saved');
        setError('');
      } catch (err) {
        setStatus('Save failed');
        setError(
          err.response?.data?.error ||
          'Unable to save your changes.'
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, dirty, loaded, canEdit, documentId]);

  function updateTitle(value) {
    if (!canEdit) return;

    setTitle(value);
    setDirty(true);
  }

  function updateContent(value) {
    if (!canEdit) return;

    setContent(value);
    setDirty(true);
  }

  // Delete document
  async function deleteDocument() {
    if (!isOwner) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this document? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/documents/${documentId}`);
      onBack();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Unable to delete this document.'
      );
    }
  }

  if (!loaded) {
    return (
      <div className="editor-loading">
        {error || 'Opening your document...'}
        <button onClick={onBack}>Back to workspace</button>
      </div>
    );
  }

  const isOwner = documentOwnerId === currentUserId;

  return (
    <div className="editor-page">

      <header className="editor-topbar">

        <button className="editor-back" onClick={onBack}>
          ← Workspace
        </button>

        <div className="editor-brand">
          <span className="brand-mark">D</span>
          draftly
        </div>

        <div className="editor-header-actions">

          <div className="editor-save-status">
            <span className="save-dot" />
            {status}
          </div>

          {isOwner && (
            <button
              className="share-document-button"
              onClick={() => setShowShareDialog(true)}
            >
              ↗ Share
            </button>
          )}

          {isOwner && (
            <button
              className="delete-document-button"
              onClick={deleteDocument}
            >
              Delete document
            </button>
          )}

        </div>
      </header>

      {error && (
        <div className="editor-error">
          {error}
        </div>
      )}

      <main className="editor-workspace">

        <div className="editor-document-info">

          <input
            className="document-title-input"
            value={title}
            onChange={(event) => updateTitle(event.target.value)}
            placeholder="Untitled Document"
            disabled={!canEdit}
          />

          <p>
            {isOwner
              ? 'Owner'
              : canEdit
                ? 'Editor access'
                : 'Viewer access'}
            {' · Draftly workspace'}
          </p>

        </div>

        <div className="editor-paper">

          <ReactQuill
            theme="snow"
            value={content}
            onChange={updateContent}
            readOnly={!canEdit}
            placeholder="Start writing your ideas..."
            modules={{
              toolbar: canEdit
                ? [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'link'],
                    ['clean'],
                  ]
                : false,
            }}
          />

        </div>

      </main>

      {showShareDialog && isOwner && (
        <ShareDialog
          documentId={documentId}
          onClose={() => setShowShareDialog(false)}
        />
      )}

    </div>
  );
}

export default DocumentEditor;
