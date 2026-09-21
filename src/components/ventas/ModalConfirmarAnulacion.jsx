// src/components/ventas/ModalConfirmarAnulacion.jsx
import { AlertTriangle, X, ArrowLeft, Ban } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ModalConfirmarAnulacion({
  venta,
  onClose,
  onConfirm,
  saving
}) {
  if (!venta) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 8, 15, 0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
    >
      <div 
        className="form-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          border: '1px solid rgba(179, 64, 42, 0.5)',
          boxShadow: 'var(--shadow-md)',
          margin: 0
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#F87171', display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={20} />
            </span>
            <h3 className="form-title" style={{ margin: 0, color: '#F87171' }}>Anular Operación</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido / Advertencia */}
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
          ¿Estás seguro de anular la venta correspondiente a <strong style={{ color: 'var(--color-text-heading)' }}>{venta.clientes?.nombre_razon_social || 'Consumidor Final'}</strong> por un total de <strong style={{ color: '#F87171' }}>{formatPrice(venta.total)}</strong>?
        </p>

        <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Efectos de la anulación contable:
          </span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            <li>Se reincorporará el stock de cada artículo vendido al depósito físico.</li>
            <li>Se registrará el movimiento de ajuste en la auditoría de stock.</li>
            {venta.estado_pago === 'pendiente' && (
              <li>Se restará el saldo adeudado de la cuenta corriente del cliente.</li>
            )}
            <li>El comprobante pasará a estado <strong>Anulada</strong> sin destruirse el registro histórico.</li>
          </ul>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            Cancelar
          </button>

          <button 
            type="button" 
            onClick={() => onConfirm(venta.id_venta)} 
            disabled={saving}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(179, 64, 42, 0.6)',
              background: 'var(--color-error-soft)',
              color: '#F87171',
              borderRadius: 'var(--radius-sm)',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Ban size={14} /> {saving ? 'Anulando...' : 'Confirmar Anulación'}
          </button>
        </div>
      </div>
    </div>
  );
}