
import { useEffect, useState } from 'react';
import api from '../services/api';

function ShareDialog({ documentId, onClose }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadShares() {
    try {
      const response = await api.get(`/documents/${documentId}/shares`);
      setShares(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to load sharing details.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShares();
  }, [documentId]);

  async function handleShare(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSharing(true);

    try {
      const response = await api.post(
        `/documents/${documentId}/shares`,
        { email, permission }
      );

      setMessage(response.data.message);
      setEmail('');
      await loadShares();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to share this document.'
      );
    } finally {
      setSharing(false);
    }
  }

  async function updatePermission(shareId, newPermission) {
    setError('');
    setMessage('');

    try {
      await api.post(`/documents/${documentId}/shares`, {
        email: shares.find((share) => share.id === shareId).email,
        permission: newPermission,
      });

      setMessage('Permission updated successfully.');
      await loadShares();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to update permission.'
      );
    }
  }

  async function removeAccess(shareId) {
    const confirmed = window.confirm(
      'Remove this person’s access to the document?'
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/documents/${documentId}/shares/${shareId}`
      );

      setMessage('Access removed successfully.');
      await loadShares();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to remove access.'
      );
    }
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div
        className="share-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-dialog-header">
          <div>
            <h2>Share document</h2>
            <p>Invite people to collaborate on this document.</p>
          </div>

          <button className="share-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="share-form" onSubmit={handleShare}>
          <label>Email address</label>

          <div className="share-input-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter a registered user's email"
              required
            />

            <select
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            >
              <option value="view">Viewer</option>
              <option value="edit">Editor</option>
            </select>
          </div>

          <button
            className="share-submit"
            type="submit"
            disabled={sharing}
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </form>

        {error && <div className="share-error">{error}</div>}
        {message && <div className="share-success">{message}</div>}

        <div className="share-people">
          <h3>People with access</h3>

          {loading ? (
            <p className="share-empty">Loading access details...</p>
          ) : shares.length === 0 ? (
            <p className="share-empty">
              This document hasn't been shared yet.
            </p>
          ) : (
            shares.map((share) => (
              <div className="share-person" key={share.id}>
                <div className="share-person-avatar">
                  {share.name.charAt(0).toUpperCase()}
                </div>

                <div className="share-person-info">
                  <strong>{share.name}</strong>
                  <small>{share.email}</small>
                </div>

                <select
                  value={share.permission}
                  onChange={(event) =>
                    updatePermission(share.id, event.target.value)
                  }
                  aria-label={`Permission for ${share.name}`}
                >
                  <option value="view">Viewer</option>
                  <option value="edit">Editor</option>
                </select>

                <button
                  className="share-remove"
                  onClick={() => removeAccess(share.id)}
                  title="Remove access"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="share-dialog-footer">
          Only registered Draftly users can currently be invited.
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
