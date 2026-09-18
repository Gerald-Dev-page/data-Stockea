// src/components/dashboard/DashboardKpis.jsx
import { CheckCircle2, AlertTriangle, DollarSign, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardKpis({ metricas }) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="kpi-card kpi-highlight">
        <div className="kpi-icon" style={{ background: 'var(--color-success-soft)', color: '#5EDBA2' }}>
          <CheckCircle2 size={18} />
        </div>
        <div className="kpi-label">Efectivo / Cobrado Real</div>
        <div className="kpi-value" style={{ color: '#5EDBA2' }}>
          {formatPrice(metricas.cobradoReal)}
        </div>
        <div className="kpi-sub">Dinero ingresado a caja</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
          <AlertTriangle size={18} />
        </div>
        <div className="kpi-label">Pendiente de Cobro (Deuda)</div>
        <div className="kpi-value" style={{ color: '#FBBF24' }}>
          {formatPrice(metricas.deudaPendiente)}
        </div>
        <div className="kpi-sub">Ventas a plazo en el período</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon kpi-icon-blue">
          <DollarSign size={18} />
        </div>
        <div className="kpi-label">Facturación Contable Total</div>
        <div className="kpi-value">{formatPrice(metricas.ingresosTotales)}</div>
        {metricas.pctIngresos !== null && (
          <div className={`kpi-badge ${metricas.pctIngresos >= 0 ? 'badge-up' : 'badge-down'}`}>
            {metricas.pctIngresos >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(metricas.pctIngresos)}% vs ciclo anterior
          </div>
        )}
      </div>

      <div className="kpi-card">
        <div className="kpi-icon kpi-icon-green">
          <ShoppingCart size={18} />
        </div>
        <div className="kpi-label">Operaciones Realizadas</div>
        <div className="kpi-value">{metricas.transacciones}</div>
        <div className="kpi-sub">Ticket prom: {formatPrice(metricas.ticketPromedio)}</div>
      </div>
    </div>
  );
}