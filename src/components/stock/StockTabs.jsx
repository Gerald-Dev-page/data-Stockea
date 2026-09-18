// src/components/stock/StockTabs.jsx
import { Boxes, History } from 'lucide-react';

export default function StockTabs({ activeTab, setActiveTab }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
      <button
        type="button"
        onClick={() => setActiveTab('existencias')}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px 14px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          color: activeTab === 'existencias' ? 'var(--color-accent)' : 'var(--color-text-muted)',
          borderBottom: activeTab === 'existencias' ? '2px solid var(--color-accent)' : 'none'
        }}
      >
        <Boxes size={14} style={{ display: 'inline', marginRight: '6px' }} />
        Existencias y Disponibilidad
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('bitacora')}
        style={{
          background: 'none',
          border: 'none',
          padding: '8px 14px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          color: activeTab === 'bitacora' ? 'var(--color-accent)' : 'var(--color-text-muted)',
          borderBottom: activeTab === 'bitacora' ? '2px solid var(--color-accent)' : 'none'
        }}
      >
        <History size={14} style={{ display: 'inline', marginRight: '6px' }} />
        Bitácora de Auditoría Forense
      </button>
    </div>
  );
}