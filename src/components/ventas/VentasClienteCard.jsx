// src/components/ventas/VentasClienteCard.jsx
import { User, AlertTriangle } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasClienteCard({
  clientes,
  clienteId,
  setClienteId,
  onConsumidorFinal,
  saving
}) {
  const clienteActivo = clientes.find(c => String(c.id_cliente) === String(clienteId));

  return (
    <div className="form-card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-text-heading)' }}>
          <User size={15} style={{ color: 'var(--color-accent)' }} /> Cliente
        </label>
        <button
          type="button"
          onClick={onConsumidorFinal}
          style={{
            background: 'var(--color-accent-soft)',
            border: '1px solid rgba(201, 162, 39, 0.3)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: '0.72rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Consumidor Final
        </button>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <select 
          value={clienteId} 
          onChange={(e) => setClienteId(e.target.value)} 
          disabled={saving}
        >
          <option value="">— Seleccione un cliente —</option>
          {clientes.map(c => (
            <option key={c.id_cliente} value={c.id_cliente}>
              {c.nombre_razon_social} {Number(c.saldo_deudor || 0) > 0 ? `(Deuda: ${formatPrice(c.saldo_deudor)})` : ''}
            </option>
          ))}
        </select>
      </div>

      {clienteActivo && Number(clienteActivo.saldo_deudor || 0) > 0 && (
        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={13} /> Saldo deudor acumulado: <strong>{formatPrice(clienteActivo.saldo_deudor)}</strong>
        </div>
      )}
    </div>
  );
}