// src/components/clientes/ClientesStats.jsx
import { Users, AlertTriangle, Receipt } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ClientesStats({ totalClientes, totalDeuda, morososCount }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
          <Users size={18} />
        </span>
        <div>
          <p className="stat-label">Total Clientes</p>
          <p className="stat-value">{totalClientes}</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-error-soft)', color: '#F87171' }}>
          <AlertTriangle size={18} />
        </span>
        <div>
          <p className="stat-label">Total Deuda en Calle</p>
          <p className="stat-value">{formatPrice(totalDeuda)}</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
          <Receipt size={18} />
        </span>
        <div>
          <p className="stat-label">Cuentas Morosas</p>
          <p className="stat-value">{morososCount}</p>
        </div>
      </div>
    </div>
  );
}