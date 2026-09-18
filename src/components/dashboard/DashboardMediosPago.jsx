// src/components/dashboard/DashboardMediosPago.jsx
import { Banknote, Landmark, CreditCard } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardMediosPago({ pagos }) {
  return (
    <div className="medios-pago-grid">
      <div className="card medio-pago-card">
        <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
          <Banknote size={18} />
        </span>
        <div>
          <p className="medio-pago-title">Efectivo Físico Cobrado</p>
          <p className="medio-pago-val">{formatPrice(pagos.efectivo)}</p>
        </div>
      </div>

      <div className="card medio-pago-card">
        <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
          <Landmark size={18} />
        </span>
        <div>
          <p className="medio-pago-title">Transferencias Acreditadas</p>
          <p className="medio-pago-val">{formatPrice(pagos.transferencia)}</p>
        </div>
      </div>

      <div className="card medio-pago-card">
        <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
          <CreditCard size={18} />
        </span>
        <div>
          <p className="medio-pago-title">Cta. Cte. Total Registrada</p>
          <p className="medio-pago-val">{formatPrice(pagos.cuenta_corriente)}</p>
        </div>
      </div>
    </div>
  );
}