import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Clipboard, Upload, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

export default function ActiveSession({ activeSession, completedSessions, rawItems, refreshSession, refreshHistory }) {
  // States
  const [initialCounts, setInitialCounts] = useState({}); // { rawItemId: quantity }
  const [actualCounts, setActualCounts] = useState({}); // { rawItemId: quantity }
  const [uploadFile, setUploadFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize count state
  useEffect(() => {
    if (activeSession) {
      // Pre-fill actual counts if they exist, or default to 0
      const counts = {};
      activeSession.actualFinalInventory.forEach(item => {
        counts[item.rawItemId._id || item.rawItemId] = item.quantity || 0;
      });
      setActualCounts(counts);
    } else {
      // Default initial counts to 0 for all raw items
      const counts = {};
      rawItems.forEach(item => {
        counts[item._id] = 0;
      });
      setInitialCounts(counts);
    }
    setError('');
  }, [activeSession, rawItems]);

  // Load last session's final count to pre-fill initial inventory
  const handleLoadLastCounts = () => {
    if (completedSessions.length === 0) {
      setError('No historical sessions found to load data from.');
      return;
    }
    const lastSession = completedSessions[0];
    const counts = { ...initialCounts };
    lastSession.actualFinalInventory.forEach(item => {
      const id = item.rawItemId._id || item.rawItemId;
      if (id) {
        counts[id] = item.quantity || 0;
      }
    });
    setInitialCounts(counts);
    setError('');
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const initialArray = Object.keys(initialCounts).map(id => ({
      rawItemId: id,
      quantity: Number(initialCounts[id]) || 0
    }));

    try {
      await api.startSession(initialArray);
      await refreshSession();
    } catch (err) {
      setError(err.message || 'Failed to start inventory session');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setError('');
  };

  const handleUploadSales = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a POS sales CSV file to upload.');
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      await api.uploadSales(formData);
      setUploadFile(null);
      await refreshSession();
    } catch (err) {
      setError(err.message || 'Failed to process sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinalCounts = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const actualArray = Object.keys(actualCounts).map(id => ({
      rawItemId: id,
      quantity: Number(actualCounts[id]) || 0
    }));

    try {
      await api.submitFinalCounts(actualArray);
      await refreshSession();
      await refreshHistory();
    } catch (err) {
      setError(err.message || 'Failed to close inventory session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to cancel the current session? All uploaded sales and session changes will be lost.')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.deleteSession(activeSession._id);
      await refreshSession();
    } catch (err) {
      setError(err.message || 'Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  // 1. NO ACTIVE SESSION - INITIAL INVENTORY CONFIG
  if (!activeSession) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Day Start Count</h1>
            <p className="page-subtitle">Start a daily inventory cycle by entering initial raw ingredient stocks</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="form-label" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clipboard size={20} style={{ color: 'var(--primary)' }} /> Setup Starting Stock
            </h2>
            {completedSessions.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
                onClick={handleLoadLastCounts}
              >
                <RefreshCw size={16} /> Load from Yesterday
              </button>
            )}
          </div>

          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {rawItems.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1.5rem 0', textAlign: 'center' }}>
              Please add raw ingredients in the **Ingredients** page before initializing a session.
            </p>
          ) : (
            <form onSubmit={handleStartSession}>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Unit</th>
                      <th style={{ width: '200px' }}>Initial Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawItems.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {item.unit}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="input-field"
                            value={initialCounts[item._id] ?? ''}
                            onChange={(e) => setInitialCounts({
                              ...initialCounts,
                              [item._id]: e.target.value
                            })}
                            style={{ textAlign: 'right', fontWeight: 600 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Initializing...' : 'Initialize Starting Stock'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. ACTIVE SESSION - WAITING FOR SALES CSV UPLOAD
  if (!activeSession.salesFile) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Day End Sales</h1>
            <p className="page-subtitle">Upload the daily POS sales report file to calculate raw usage</p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={handleCancelSession}
            disabled={loading}
          >
            <Trash2 size={16} /> Cancel Session
          </button>
        </div>

        <div className="card">
          <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} style={{ color: 'var(--primary)' }} /> Upload POS Sales CSV
          </h2>

          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUploadSales}>
            <div 
              className="upload-dropzone" 
              onClick={() => document.getElementById('sales-file-input').click()}
            >
              <Upload className="upload-icon" />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {uploadFile ? uploadFile.name : 'Select or drag your POS sales report CSV'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Supports standard day_end_sales.csv exports containing items and modifier SKUs
              </p>
              <input
                id="sales-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }} 
              disabled={loading || !uploadFile}
            >
              {loading ? 'Uploading & Calculating...' : 'Upload & Compute Ingredient Usage'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. ACTIVE SESSION - UPLOADED, NEED ACTUAL FINAL INVENTORY INPUT
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Actual Count & Variance</h1>
          <p className="page-subtitle">Enter manual count values to finalize variance and spoilage reports</p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          onClick={handleCancelSession}
          disabled={loading}
        >
          <Trash2 size={16} /> Cancel Session
        </button>
      </div>

      {/* Upload Info banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', marginBottom: '2rem' }}>
        <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#fff' }}>POS Sales Data Processed</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Uploaded file: <span style={{ fontStyle: 'italic', color: '#fff' }}>{activeSession.salesFile}</span> ({activeSession.salesData.length} records parsed)
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clipboard size={20} style={{ color: 'var(--primary)' }} /> Submit Actual Count
        </h2>

        {error && (
          <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitFinalCounts}>
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Initial Count</th>
                  <th style={{ textAlign: 'right' }}>Expected Usage (Recipes)</th>
                  <th style={{ textAlign: 'right' }}>Expected Remaining</th>
                  <th style={{ width: '180px' }}>Actual Final Count</th>
                </tr>
              </thead>
              <tbody>
                {activeSession.initialInventory.map(item => {
                  const id = item.rawItemId._id || item.rawItemId;
                  const name = item.rawItemId.name || 'Unknown';
                  const unit = item.rawItemId.unit || '';
                  const initial = item.quantity;
                  
                  // find usage
                  const usageItem = activeSession.calculatedUsage.find(u => (u.rawItemId._id || u.rawItemId) === id);
                  const usage = usageItem ? usageItem.quantity : 0;
                  const expectedRemaining = Math.max(0, initial - usage);

                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {unit}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{initial.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{usage.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{expectedRemaining.toFixed(1)}</td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="input-field"
                          value={actualCounts[id] ?? ''}
                          onChange={(e) => setActualCounts({
                            ...actualCounts,
                            [id]: e.target.value
                          })}
                          style={{ textAlign: 'right', fontWeight: 600 }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Submitting & Finalizing...' : 'Calculate Variance & Complete Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
