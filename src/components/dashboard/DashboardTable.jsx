// src/components/dashboard/DashboardTable.jsx
import { Calendar, UserCheck, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useDashboard';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardTable({
  ultimasVentas,
  ventasPaginadas,
  paginaActual,
  setPaginaActual,
  totalPaginas
}) {
  return (
    <div className="card table-card" style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="table-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: 'var(--color-accent)' }} /> 
          Operaciones del Período
        </h3>
        <span className="table-count">{ultimasVentas.length} registros</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Operador</th>
              <th>Cliente</th>
              <th>Resumen Artículos</th>
              <th>Medio</th>
              <th>Estado de Cobro</th>
              <th>Total Facturado</th>
            </tr>
          </thead>
          <tbody>
            {ultimasVentas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2.5rem' }}>
                  No hay ventas registradas en el período seleccionado.
                </td>
              </tr>
            ) : ventasPaginadas.map(v => {
              const esPend = v.estado_pago === 'pendiente';

              return (
                <tr key={v.id_venta}>
                  <td><span className="hora-badge">{v.hora}</span></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                      <UserCheck size={13} style={{ color: 'var(--color-accent)' }} />
                      {v.operador}
                    </span>
                  </td>
                  <td className="td-nombre">{v.cliente}</td>
                  <td className="td-muted">{v.productoResumen}</td>
                  <td>
                    <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                      {v.metodo_pago}
                    </span>
                  </td>
                  <td>
                    {esPend ? (
                      <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', border: '1px solid rgba(201, 138, 39, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Pendiente {v.fecha_vencimiento ? `(${v.fecha_vencimiento.slice(5)})` : ''}
                      </span>
                    ) : (
                      <span className="estado-badge activo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Cobrado
                      </span>
                    )}
                  </td>
                  <td className="td-precio">{formatPrice(v.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ultimasVentas.length > 0 && (
        <div className="pagination-container no-print">
          <div className="pagination-info">
            Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, ultimasVentas.length)}</strong> de <strong>{ultimasVentas.length}</strong> operaciones
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
              disabled={paginaActual === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {prev && page - prev > 1 && <span className="pagination-ellipsis">...</span>}
                    <button
                      type="button"
                      className={`pagination-btn ${paginaActual === page ? 'active' : ''}`}
                      onClick={() => setPaginaActual(page)}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}