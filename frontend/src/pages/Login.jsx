
import { useState } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('shiven@draftly.demo');
  const [password, setPassword] = useState('Shiven@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      onLogin(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">D</div>
          <span>draftly</span>
        </div>

        <h1>Welcome back.</h1>
        <p className="login-subtitle">
          Sign in to continue to your workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to Draftly'}
          </button>
        </form>

        <div className="demo-note">
          <strong>Demo accounts</strong>
          <span>Shiven and Alex are available for testing.</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
