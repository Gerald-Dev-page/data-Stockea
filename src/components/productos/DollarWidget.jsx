// src/components/productos/DollarWidget.jsx
import { DollarSign, Check, Percent } from 'lucide-react';

export default function DollarWidget({
  cotizacion,
  onChange,
  onSave,
  isSaving,
  isSaved,
  aplicarIva,
  onToggleIva,
  porcentajeIva = 21,
  onChangeIva
}) {
  return (
    <div 
      className="dollar-widget-card" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'var(--color-bg-card)',
        border: '1px solid rgba(201, 162, 39, 0.4)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        flexWrap: 'wrap'
      }}
    >
      {/* ── Cotización USD ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <DollarSign size={16} style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
          USD Hoy:
        </span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>$</span>
          <input
            type="number"
            value={cotizacion}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '85px',
              height: '32px',
              padding: '0 6px 0 16px',
              background: 'var(--color-bg-main)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-heading)',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── Sección IVA (Al lado, sin el ON/OFF) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
        <button
          type="button"
          onClick={onToggleIva}
          style={{
            background: aplicarIva ? 'var(--color-accent-soft)' : 'var(--color-bg-main)',
            border: `1px solid ${aplicarIva ? 'var(--color-accent)' : 'var(--color-border)'}`,
            color: aplicarIva ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            height: '32px',
            transition: 'var(--transition)'
          }}
          title="Activar o desactivar cálculo descontando IVA"
        >
          <Percent size={12} /> IVA
        </button>

        {/* Input editable del porcentaje de IVA */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={porcentajeIva}
            onChange={(e) => onChangeIva ? onChangeIva(e.target.value) : null}
            disabled={!aplicarIva}
            style={{
              width: '60px',
              height: '32px',
              padding: '0 16px 0 8px',
              background: 'var(--color-bg-main)',
              border: `1px solid ${aplicarIva ? 'rgba(201, 162, 39, 0.4)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: aplicarIva ? 'var(--color-text-heading)' : 'var(--color-text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
              textAlign: 'center',
              opacity: aplicarIva ? 1 : 0.45,
              cursor: aplicarIva ? 'text' : 'not-allowed'
            }}
          />
          <span style={{ position: 'absolute', right: '5px', color: 'var(--color-text-muted)', fontSize: '0.75rem', pointerEvents: 'none' }}>%</span>
        </div>
      </div>

      {/* ── Botón Fijar / Guardar ── */}
      <button
        type="button"
        className="btn-primary"
        onClick={onSave}
        disabled={isSaving}
        style={{
          height: '32px',
          padding: '0 10px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {isSaving ? '...' : isSaved ? <><Check size={13} /> Ok</> : 'Fijar'}
      </button>
    </div>
  );
}