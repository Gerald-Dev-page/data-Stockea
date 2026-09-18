// src/components/ventas/VentasHistorialTable.jsx
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useVentas';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasHistorialTable({
  historial,
  historialPaginado,
  loading,
  paginaActual,
  setPaginaActual,
  totalPaginas
}) {
  return (
    <div className="card table-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="table-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} style={{ color: 'var(--color-accent)' }} /> Ventas Registradas Hoy
        </h3>
        <span className="table-count">{historial.length} operaciones</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Operador</th>
              <th>Cliente</th>
              <th>Artículos</th>
              <th>Medio</th>
              <th>Estado</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {historialPaginado.map(v => {
              const fecha = new Date(v.creado_en);
              const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
              const cantArticulos = v.ventas_detalle?.reduce((acc, d) => acc + d.cantidad, 0) || 0;
              const esPend = v.estado_pago === 'pendiente';

              return (
                <tr key={v.id_venta}>
                  <td><span className="hora-badge">{horaStr}</span></td>
                  <td className="td-muted">{v.perfiles?.nombre_completo || 'Operador'}</td>
                  <td className="td-nombre">{v.clientes?.nombre_razon_social || 'Consumidor'}</td>
                  <td className="td-muted">
                    {v.ventas_detalle?.length > 0 
                      ? `${v.ventas_detalle[0].productos?.nombre || 'Producto'} ${v.ventas_detalle.length > 1 ? `(+${v.ventas_detalle.length - 1})` : ''} (${cantArticulos} u.)`
                      : '—'
                    }
                  </td>
                  <td>
                    <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                      {v.metodo_pago || 'Efectivo'}
                    </span>
                  </td>
                  <td>
                    {esPend ? (
                      <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', border: '1px solid rgba(201, 138, 39, 0.4)' }}>
                        Pendiente {v.fecha_vencimiento ? `(${v.fecha_vencimiento.slice(5)})` : ''}
                      </span>
                    ) : (
                      <span className="estado-badge activo">Cobrado</span>
                    )}
                  </td>
                  <td className="td-precio">{formatPrice(v.total)}</td>
                </tr>
              );
            })}
            {historial.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  Sin operaciones registradas en el día de hoy.
                </td>
              </tr> 
            )}
          </tbody>
        </table>
      </div>

      {!loading && historial.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, historial.length)}</strong> de <strong>{historial.length}</strong> operaciones
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