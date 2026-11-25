
import { useRef, useState } from 'react';
import api from '../services/api';

function ImportFile({ onImported }) {
  const fileInput = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError('');

    const extension = file.name.split('.').pop().toLowerCase();

    if (!['txt', 'md'].includes(extension)) {
      setError('Please select a TXT or Markdown file.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be smaller than 2 MB.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);

    try {
      const response = await api.post('/documents/import', formData);

      onImported(response.data.id);
    } catch (err) {
      console.log('IMPORT ERROR:', err.response?.data);
setError(err.response?.data?.error || 'Unable to import this file.');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <>
      <button
        className="quick-card import-card"
        onClick={() => fileInput.current?.click()}
        disabled={loading}
      >
        <div className="quick-icon orange">↑</div>
        <div>
          <strong>{loading ? 'Importing...' : 'Import a file'}</strong>
          <small>TXT and Markdown files</small>
        </div>
      </button>

      <input
        ref={fileInput}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        hidden
        onChange={handleFileChange}
      />

      {error && <p className="import-error">{error}</p>}
    </>
  );
}

export default ImportFile;
