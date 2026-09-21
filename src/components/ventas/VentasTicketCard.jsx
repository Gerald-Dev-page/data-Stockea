// src/components/ventas/VentasTicketCard.jsx
import { ShoppingCart, Banknote, Landmark, CreditCard, Calendar, CheckCircle2, Trash2 } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasTicketCard({
  carrito,
  totalFactura,
  metodoPago,
  onSeleccionarMetodoPago,
  esPendiente,
  setEsPendiente,
  fechaVencimiento,
  setFechaVencimiento,
  onEliminarItem,
  onConfirmar,
  disabledSubmit,
  saving
}) {
  return (
    <div className="form-card" style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="form-title" style={{ margin: 0 }}>
          <ShoppingCart size={16} style={{ color: 'var(--color-accent)' }} /> Resumen del Ticket
        </h3>
        <span className="id-badge" style={{ color: 'var(--color-accent)', borderColor: 'rgba(201, 162, 39, 0.3)' }}>
          {carrito.length} ítems
        </span>
      </div>

      {/* Lista del Carrito */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem' }}>
        {carrito.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            El carrito está vacío. Agregue productos desde el panel izquierdo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {carrito.map(item => (
              <div key={item.id_producto} className="cart-item-row">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-heading)' }}>
                    {item.nombre}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                    {item.cantidad} u. × {formatPrice(item.precio_unitario)} ({item.tipo_precio})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                    {formatPrice(item.total)}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => onEliminarItem(item.id_producto)} 
                    style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0 }}
                    title="Quitar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selector de Medios de Cobro */}
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label>Medio de Cobro</label>
        <div className="metodos-pago-grid">
          <button
            type="button"
            className={`metodo-pago-btn ${metodoPago === 'efectivo' ? 'active-efectivo' : ''}`}
            onClick={() => onSeleccionarMetodoPago('efectivo')}
          >
            <Banknote size={15} /> Efectivo
          </button>
          <button
            type="button"
            className={`metodo-pago-btn ${metodoPago === 'transferencia' ? 'active-transferencia' : ''}`}
            onClick={() => onSeleccionarMetodoPago('transferencia')}
          >
            <Landmark size={15} /> Transfer.
          </button>
          <button
            type="button"
            className={`metodo-pago-btn ${metodoPago === 'cuenta_corriente' ? 'active-cta-cte' : ''}`}
            onClick={() => onSeleccionarMetodoPago('cuenta_corriente')}
          >
            <CreditCard size={15} /> Cta. Cte.
          </button>
        </div>
      </div>

      {/* Bloque Pendiente de Pago y Fecha estilizados */}
      <div className={`pendiente-panel ${esPendiente ? 'is-active' : ''}`}>
        <div className="pendiente-toggle-row" onClick={() => setEsPendiente(!esPendiente)}>
          <span className="pendiente-toggle-label">
            Dejar como Venta Pendiente (Deuda)
          </span>
          <div className={`custom-switch ${esPendiente ? 'checked' : ''}`}>
            <div className="custom-switch-thumb" />
          </div>
        </div>

        {esPendiente && (
          <div className="vencimiento-container">
            <label className="vencimiento-label">
              <Calendar size={13} style={{ color: 'var(--color-accent)' }} /> Fecha límite / Vencimiento
            </label>
            <input 
              type="date" 
              className="custom-date-input"
              value={fechaVencimiento} 
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </div>
        )}
      </div>

      {/* Total a Facturar */}
      <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total a Facturar
          </span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice(totalFactura)}
          </strong>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary btn-full"
        onClick={onConfirmar}
        disabled={disabledSubmit}
        style={{ padding: '12px' }}
      >
        {saving ? 'Procesando venta...' : <><CheckCircle2 size={16} /> Emitir Comprobante</>}
      </button>
    </div>
  );
}