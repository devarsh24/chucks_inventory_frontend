import React, { useState } from 'react';
import { Trash2, Plus, Sparkles } from 'lucide-react';

export default function RawItems({ rawItems, onCreateRawItem, onDeleteRawItem }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter an item name');
      return;
    }

    try {
      await onCreateRawItem({ name: name.trim(), unit });
      setName('');
    } catch (err) {
      setError(err.message || 'Failed to create raw item');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Raw Ingredients</h1>
          <p className="page-subtitle">Add and manage the ingredients used in your restaurant recipes</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Add Raw Item Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} /> Add Ingredient
          </h2>
          
          {error && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Ingredient Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Beef Patty 4oz, Cheese Slice, Burger Bun"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <select
                className="input-field"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ appearance: 'none', background: 'rgba(0, 0, 0, 0.3) url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 12px center', backgroundSize: '16px' }}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="portion">Portions</option>
                <option value="oz">Ounces (oz)</option>
                <option value="lb">Pounds (lb)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="L">Liters (L)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={18} /> Add Ingredient
            </button>
          </form>
        </div>

        {/* Raw Items List Table */}
        <div className="card">
          <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Current Ingredients ({rawItems.length})</h2>
          
          {rawItems.length > 0 ? (
            <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Unit of Measure</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rawItems.map(item => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <span className="badge badge-warning" style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {item.unit}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${item.name}"? This will affect recipes using this item.`)) {
                              onDeleteRawItem(item._id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0' }}>No ingredients created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
