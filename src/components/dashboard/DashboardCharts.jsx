// src/components/dashboard/DashboardCharts.jsx
import { BarChart2, Package } from 'lucide-react';
import { CHART_COLORS } from '../../hooks/useDashboard';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardCharts({ tendencia7d, maxBar, hoyStr, metricas }) {
  return (
    <div className="dash-modules">
      {/* Gráfico 7 días */}
      <div className="dash-module module-wide">
        <div className="module-header">
          <h3>
            <BarChart2 size={16} style={{ color: 'var(--color-accent)' }} /> Cobranzas Diarias Acreditadas (Últimos 7 días)
          </h3>
        </div>
        <div className="bar-chart">
          {tendencia7d.map((d) => {
            const pct = Math.round((d.total / maxBar) * 100);
            const esHoy = d.str === hoyStr;
            return (
              <div className="bar-col" key={d.str}>
                <div className="bar-amount">{d.total > 0 ? formatPrice(d.total) : '—'}</div>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${esHoy ? 'bar-fill-today' : ''}`}
                    style={{ height: `${Math.max(pct, 6)}%` }}
                  />
                </div>
                <div className={`bar-label ${esHoy ? 'bar-label-today' : ''}`}>
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categorías */}
      <div className="dash-module">
        <div className="module-header">
          <h3>
            <Package size={16} style={{ color: 'var(--color-accent)' }} /> Ventas por Categoría
          </h3>
        </div>
        <div className="cat-list">
          {metricas.categoriasOrdenadas.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
              Sin transacciones en el rango.
            </div>
          ) : (
            metricas.categoriasOrdenadas.map((cat, i) => {
              const pct = Math.round((cat.cantidad / metricas.totalUnidades) * 100);
              const color = CHART_COLORS[i % CHART_COLORS.length];
              return (
                <div className="cat-row" key={cat.nombre}>
                  <div className="cat-info">
                    <span className="cat-dot" style={{ background: color }} />
                    <span className="cat-name">{cat.nombre}</span>
                    <span className="cat-units">{cat.cantidad} u.</span>
                  </div>
                  <div className="cat-bar-track">
                    <div className="cat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="cat-pct">{pct}%</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}