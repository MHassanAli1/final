import React, { useState } from 'react';

const SyncButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const result = await window.api.sync.transactions();
      if (result.success) {
        setStatus(`✅ Synced ${result.synced} items, Deleted ${result.deleted}`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      setStatus(`❌ Failed: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? 'Syncing...' : 'Sync Transactions'}
      </button>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
};

export default SyncButton;
