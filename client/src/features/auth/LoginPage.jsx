import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import './auth.css';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.role === 'platform_admin' ? '/admin' : '/'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      navigate(loggedInUser.role === 'platform_admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <Card className="login-card">
        <div className="login-brand">
          <img className="login-brand-logo" src="/assets/logo-lockup.png" alt="Tabsa" />
        </div>
        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">Log in with the username and password provided by your admin.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <Field label="Username">
            <Input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <p className="login-error">{error}</p>}
          <Button type="submit" disabled={submitting} className="login-submit">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
