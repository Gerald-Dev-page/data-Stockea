// src/components/stock/StockKpis.jsx
import { PackageCheck, BookmarkCheck, Truck, AlertTriangle } from 'lucide-react';

export default function StockKpis({ totalFisico, totalReservado, totalTransito, productosBajoStock, sinStock }) {
  return (
    <div className="stats-row stock-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
          <PackageCheck size={18} />
        </span>
        <div>
          <p className="stat-label">Físico en Depósito</p>
          <p className="stat-value">{totalFisico} u.</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
          <BookmarkCheck size={18} />
        </span>
        <div>
          <p className="stat-label">Reservado / Comprometido</p>
          <p className="stat-value">{totalReservado} u.</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
          <Truck size={18} />
        </span>
        <div>
          <p className="stat-label">En Tránsito (Importación)</p>
          <p className="stat-value">{totalTransito} u.</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'var(--color-error-soft)', color: '#F87171' }}>
          <AlertTriangle size={18} />
        </span>
        <div>
          <p className="stat-label">Alertas Críticas</p>
          <p className="stat-value">{productosBajoStock + sinStock}</p>
        </div>
      </div>
    </div>
  );
}