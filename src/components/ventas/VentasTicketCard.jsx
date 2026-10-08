// src/components/ventas/VentasTicketCard.jsx
import { useState } from 'react';
import { 
  ShoppingCart, Banknote, Landmark, CreditCard, 
  Calendar, CheckCircle2, Trash2, BookmarkCheck, 
  Layers, FileText, Percent 
} from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasTicketCard({
  carrito,
  subtotalCarrito,
  totalFactura,
  montoInteres,
  metodoPago,
  onSeleccionarMetodoPago,
  esPendiente,
  setEsPendiente,
  fechaVencimiento,
  setFechaVencimiento,
  observaciones,
  setObservaciones,
  pagoMixto,
  setPagoMixto,
  interesPorcentaje,
  setInteresPorcentaje,
  onEliminarItem,
  onConfirmar,
  disabledSubmit,
  saving,
  reservasCliente = [],
  onCargarReserva
}) {
  const [mostrarNotas, setMostrarNotas] = useState(Boolean(observaciones));

  const tieneFinanciacion = metodoPago === 'cuenta_corriente' || esPendiente || (metodoPago === 'mixto' && Number(pagoMixto.cta_cte || 0) > 0);

  const sumaMixta = (Number(pagoMixto.efectivo) || 0) + (Number(pagoMixto.transferencia) || 0) + (Number(pagoMixto.cta_cte) || 0);
  const diferenciaMixta = (subtotalCarrito || 0) - sumaMixta;

  return (
    <div className="form-card" style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}>
      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="form-title" style={{ margin: 0 }}>
          <ShoppingCart size={16} style={{ color: 'var(--color-accent)' }} /> Resumen del Ticket
        </h3>
        <span className="id-badge" style={{ color: 'var(--color-accent)', borderColor: 'rgba(201, 162, 39, 0.3)' }}>
          {carrito.length} ítems
        </span>
      </div>

      {/* ── Mercadería Reservada ── */}
      {reservasCliente.length > 0 && (
        <div style={{ 
          marginBottom: '1rem', 
          background: 'var(--color-accent-soft)', 
          border: '1px solid var(--color-accent)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '8px 12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--color-accent)', fontSize: '0.78rem', fontWeight: 700 }}>
            <BookmarkCheck size={15} />
            <span>Mercadería reservada por este cliente:</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {reservasCliente.map(res => (
              <div 
                key={res.id_reserva} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.76rem', 
                  background: 'var(--color-bg-card)', 
                  padding: '4px 8px', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span>
                  <strong>{res.cantidad} u.</strong> {res.productos?.nombre || 'Artículo'}
                </span>
                <button
                  type="button"
                  onClick={() => onCargarReserva && onCargarReserva(res)}
                  style={{
                    background: 'var(--color-accent)',
                    border: 'none',
                    color: '#FFF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Cargar al ticket
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Carrito ── */}
      <div style={{ maxHeight: '190px', overflowY: 'auto', marginBottom: '1rem' }}>
        {carrito.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            El carrito está vacío. Agregue productos desde el panel izquierdo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {carrito.map(item => (
              <div key={item.id_producto} className="cart-item-row">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {item.nombre}
                    {item.es_reserva && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--color-accent-soft)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', padding: '1px 5px', borderRadius: '4px' }}>
                        Reserva
                      </span>
                    )}
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

      {/* ── Medios de Cobro (Grid Clásico de 3) + Toggle Mixto Elegante ── */}
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ margin: 0 }}>Medio de Cobro</label>
          <button
            type="button"
            onClick={() => onSeleccionarMetodoPago(metodoPago === 'mixto' ? 'efectivo' : 'mixto')}
            style={{
              background: metodoPago === 'mixto' ? 'var(--color-accent-soft)' : 'transparent',
              border: `1px solid ${metodoPago === 'mixto' ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: metodoPago === 'mixto' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'var(--transition)'
            }}
          >
            <Layers size={12} /> {metodoPago === 'mixto' ? 'Pago Mixto Activo' : 'Dividir Pago'}
          </button>
        </div>

        {/* Los 3 botones clásicos impecables */}
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

      {/* ── Desglose de Pago Mixto con los estilos Dark Navy del Sistema ── */}
      {metodoPago === 'mixto' && (
        <div style={{ 
          background: 'linear-gradient(180deg, #09121D 0%, #0c1827 100%)', 
          border: '1px solid rgba(201, 162, 39, 0.35)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px', 
          marginBottom: '1rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Distribución de Montos
            </span>
            <span style={{ fontSize: '0.7rem', color: diferenciaMixta === 0 ? 'var(--color-success)' : 'var(--color-accent)' }}>
              {diferenciaMixta === 0 ? '✓ Monto asignado' : `Resta: ${formatPrice(diferenciaMixta)}`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '3px', display: 'block' }}>Efectivo</label>
              <input 
                type="number"
                min="0"
                value={pagoMixto.efectivo}
                placeholder="$ 0"
                onChange={(e) => setPagoMixto(prev => ({ ...prev, efectivo: e.target.value }))}
                style={{ 
                  background: 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-heading)', 
                  padding: '7px 9px', 
                  fontSize: '0.8rem', 
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '3px', display: 'block' }}>Transferencia</label>
              <input 
                type="number"
                min="0"
                value={pagoMixto.transferencia}
                placeholder="$ 0"
                onChange={(e) => setPagoMixto(prev => ({ ...prev, transferencia: e.target.value }))}
                style={{ 
                  background: 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-heading)', 
                  padding: '7px 9px', 
                  fontSize: '0.8rem', 
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '3px', display: 'block' }}>Cta. Cte.</label>
              <input 
                type="number"
                min="0"
                value={pagoMixto.cta_cte}
                placeholder="$ 0"
                onChange={(e) => setPagoMixto(prev => ({ ...prev, cta_cte: e.target.value }))}
                style={{ 
                  background: 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-heading)', 
                  padding: '7px 9px', 
                  fontSize: '0.8rem', 
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Panel de Venta Pendiente / Cta Cte / Financiación ── */}
      {metodoPago !== 'mixto' && (
        <div className={`pendiente-panel ${esPendiente ? 'is-active' : ''}`} style={{ marginBottom: '1rem' }}>
          <div className="pendiente-toggle-row" onClick={() => setEsPendiente(!esPendiente)}>
            <span className="pendiente-toggle-label">
              Dejar como Venta Pendiente (Deuda)
            </span>
            <div className={`custom-switch ${esPendiente ? 'checked' : ''}`}>
              <div className="custom-switch-thumb" />
            </div>
          </div>
        </div>
      )}

      {/* ── Interés y Fecha Límite (solo si hay Cta. Cte. o saldo pendiente) ── */}
      {tieneFinanciacion && (
        <div style={{ 
          background: 'var(--color-bg-main)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '10px 12px', 
          marginBottom: '1rem' 
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                <Calendar size={13} style={{ color: 'var(--color-accent)' }} /> Vencimiento
              </label>
              <input 
                type="date" 
                className="custom-date-input"
                value={fechaVencimiento} 
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
                style={{ height: '34px', fontSize: '0.78rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                <Percent size={13} style={{ color: 'var(--color-accent)' }} /> % Interés / Recargo
              </label>
              <input 
                type="number"
                min="0"
                step="0.5"
                value={interesPorcentaje || ''}
                onChange={(e) => setInteresPorcentaje(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                placeholder="0 %"
                style={{ 
                  height: '34px', 
                  fontSize: '0.8rem', 
                  padding: '6px 9px', 
                  background: 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-heading)',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {montoInteres > 0 && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--color-accent)', textAlign: 'right' }}>
              + Recargo financiero: <strong>{formatPrice(montoInteres)}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Observaciones (Discretas y Plegables) ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        {!mostrarNotas ? (
          <button
            type="button"
            onClick={() => setMostrarNotas(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '0.74rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <FileText size={13} style={{ color: 'var(--color-accent)' }} /> + Añadir observación a esta venta
          </button>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0 }}>
                <FileText size={12} style={{ color: 'var(--color-accent)' }} /> Observaciones
              </label>
              <button
                type="button"
                onClick={() => {
                  setMostrarNotas(false);
                  setObservaciones('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.68rem', cursor: 'pointer' }}
              >
                Ocultar
              </button>
            </div>
            <textarea 
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Retira el viernes / Seña acordada..."
              style={{
                width: '100%',
                background: 'var(--color-bg-main)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-heading)',
                padding: '7px 9px',
                fontSize: '0.78rem',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
      </div>

      {/* ── Total a Facturar ── */}
      <div style={{ 
        background: 'var(--color-bg-main)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 'var(--radius-sm)', 
        padding: '1rem', 
        marginBottom: '1.25rem' 
      }}>
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