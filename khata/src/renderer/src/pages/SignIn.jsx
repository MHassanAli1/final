import { useState } from 'react';
import { Shield } from 'lucide-react';

export default function SignIn() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestPing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.api?.test?.ping();
      setResponse(res);
    } catch (err) {
      setError(err.message || 'Unknown error');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="background-pattern"></div>

      <div className="admin-card">
        <div className="admin-header">
          <div className="admin-icon">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="admin-title">Test IPC Ping</h2>
          <p className="admin-subtitle">🚀 Test your IPC connection with main process</p>
        </div>

        <div className="form-group">
          <button
            onClick={handleTestPing}
            className="admin-button"
            disabled={loading}
          >
            {loading ? 'Pinging...' : 'Ping Main Process'}
          </button>
        </div>

        {response && (
          <div className="response success">
            Response: <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
        {error && (
          <div className="response error">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
