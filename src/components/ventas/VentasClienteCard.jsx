// src/components/ventas/VentasClienteCard.jsx
import { User, UserPlus } from 'lucide-react';

export default function VentasClienteCard({
  clientes,
  clienteId,
  setClienteId,
  onAsignarConsumidorFinal
}) {
  return (
    <div className="form-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <h3 className="form-title" style={{ margin: 0 }}>
          <User size={16} style={{ color: 'var(--color-accent)' }} /> Titular de la Operación
        </h3>
        <button
          type="button"
          onClick={onAsignarConsumidorFinal}
          style={{
            background: 'var(--color-accent-soft)',
            border: '1px solid rgba(201, 162, 39, 0.4)',
            color: 'var(--color-accent)',
            fontSize: '0.74rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <UserPlus size={13} /> + Consumidor Final
        </button>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          required
          style={{ width: '100%', height: '42px' }}
        >
          <option value="">Seleccione un cliente registrado...</option>
          {clientes.map(c => (
            <option key={c.id_cliente} value={c.id_cliente}>
              {c.nombre_razon_social} {Number(c.saldo_deudor || 0) > 0 ? `(Deuda: $${Number(c.saldo_deudor).toLocaleString('es-AR')})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}