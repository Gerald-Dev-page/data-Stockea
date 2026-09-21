// src/components/stock/StockBitacora.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useStock';

export default function StockBitacora({
  movimientosPaginados,
  totalItems,
  paginaMovs,
  setPaginaMovs,
  totalPaginasMovs,
  loading
}) {
  return (
    <div className="card table-card">
      <h3 className="table-title" style={{ marginBottom: '1rem' }}>
        Registro de Trazabilidad e Ingresos
      </h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Operador</th>
              <th>Producto</th>
              <th>Operación</th>
              <th>Variación Neta</th>
            </tr>
          </thead>
          <tbody>
            {movimientosPaginados.map(m => {
              const f = new Date(m.creado_en);
              const fechaStr = `${f.toLocaleDateString('es-AR')} ${f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
              const esPositivo = m.cantidad > 0;

              return (
                <tr key={m.id_movimiento}>
                  <td><span className="hora-badge">{fechaStr}</span></td>
                  <td className="td-muted">{m.perfiles?.nombre_completo || 'Sistema'}</td>
                  <td className="td-nombre">
                    {m.productos?.nombre}
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{m.productos?.sku}</span>
                  </td>
                  <td>
                    <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: esPositivo ? '#5EDBA2' : '#F87171' }}>
                    {esPositivo ? `+${m.cantidad}` : m.cantidad} u.
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && totalItems > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando <strong>{(paginaMovs - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaMovs * ITEMS_PER_PAGE, totalItems)}</strong> de <strong>{totalItems}</strong> movimientos
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaMovs(p => Math.max(p - 1, 1))}
              disabled={paginaMovs === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPaginasMovs }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginasMovs || Math.abs(p - paginaMovs) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {prev && page - prev > 1 && <span className="pagination-ellipsis">...</span>}
                    <button
                      type="button"
                      className={`pagination-btn ${paginaMovs === page ? 'active' : ''}`}
                      onClick={() => setPaginaMovs(page)}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaMovs(p => Math.min(p + 1, totalPaginasMovs))}
              disabled={paginaMovs === totalPaginasMovs}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}