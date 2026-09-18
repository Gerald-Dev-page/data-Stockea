import { Check } from 'lucide-react';

export default function DollarWidget({ cotizacion, onChange, onSave, isSaving, isSaved }) {
  return (
    <div className="dollar-widget">
      <span className="dollar-widget-label">USD Hoy:</span>
      <div className="dollar-widget-controls">
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>$</span>
        <input
          type="number"
          className="dollar-widget-input"
          value={cotizacion}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className={`dollar-widget-btn ${isSaved ? 'saved' : ''}`}
          onClick={onSave}
          disabled={isSaving}
        >
          <Check size={14} /> {isSaving ? '...' : isSaved ? 'Listo!' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}