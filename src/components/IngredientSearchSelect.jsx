import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function IngredientSearchSelect({ value, options, onChange, placeholder = 'Select Ingredient...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedItem = options.find(opt => opt._id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="search-select-container" style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        className="input-field search-select-trigger"
        style={{
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'rgba(0, 0, 0, 0.3)',
          width: '100%',
          padding: '0.85rem 1rem',
          color: selectedItem ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selectedItem ? `${selectedItem.name} (${selectedItem.unit})` : placeholder}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          className="search-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#12141c',
            border: 'var(--glass-border)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
            marginTop: '0.5rem',
            padding: '0.5rem'
          }}
        >
          <div className="search-select-search-wrapper" style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="input-field search-select-input"
              placeholder="Type to filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                paddingLeft: '2.2rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                fontSize: '0.9rem'
              }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }}
            />
          </div>
          <div className="search-select-options" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt._id}
                  className="search-select-option"
                  style={{
                    padding: '0.6rem 0.8rem',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    transition: 'var(--transition-fast)',
                    background: opt._id === value ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    color: opt._id === value ? 'var(--primary)' : 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    onChange(opt._id);
                    setIsOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (opt._id !== value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (opt._id !== value) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {opt.name}
                  </span>
                  <span className="badge" style={{ fontSize: '0.75rem', opacity: 0.7, padding: '0.1rem 0.4rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                    {opt.unit}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '0.5rem 0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No ingredients found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
