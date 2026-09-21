// src/components/productos/DollarWidget.jsx
import { Check } from 'lucide-react';

export default function DollarWidget({ cotizacion, onChange, onSave, isSaving, isSaved }) {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--color-bg-card)',
        border: '1px solid rgba(201, 162, 39, 0.35)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <span 
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap'
        }}
      >
        USD Hoy:
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>$</span>
        <input 
          type="number" 
          value={cotizacion} 
          onChange={(e) => onChange(e.target.value)}
          style={{ 
            width: '85px', 
            height: '34px', 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            textAlign: 'right', 
            padding: '2px 8px', 
            background: 'var(--color-bg-main)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '4px', 
            color: 'var(--color-text-heading)', 
            outline: 'none',
            fontFamily: 'var(--font-main)'
          }} 
        />
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          style={{
            height: '34px',
            padding: '0 12px',
            background: isSaved ? 'var(--color-success-soft)' : 'var(--color-accent-soft)',
            border: `1px solid ${isSaved ? 'rgba(94, 219, 162, 0.4)' : 'rgba(201, 162, 39, 0.4)'}`,
            color: isSaved ? '#5EDBA2' : 'var(--color-accent)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.76rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'var(--transition)'
          }}
        >
          <Check size={14} /> {isSaving ? '...' : isSaved ? 'Listo!' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}