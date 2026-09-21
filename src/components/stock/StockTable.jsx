// src/components/stock/StockTable.jsx
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useStock';

export default function StockTable({
  productosPaginados,
  totalItems,
  paginaStock,
  setPaginaStock,
  totalPaginasStock,
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
  productosBajoStock,
  onOpenAjuste,
  loading
}) {
  return (
    <div className="card table-card">
      <div className="stock-toolbar">
        <div className="stock-search-box">
          <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--color-accent)' }} />
          <input 
            type="text" 
            className="stock-search-input"
            placeholder="Buscar SKU o nombre..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        <div className="stock-filter-buttons">
          <button 
            type="button"
            onClick={() => setFiltroEstado('todos')} 
            className={`stock-filter-btn ${filtroEstado === 'todos' ? 'active-todos' : ''}`}
          >
            Todos
          </button>
          <button 
            type="button"
            onClick={() => setFiltroEstado('bajo')} 
            className={`stock-filter-btn ${filtroEstado === 'bajo' ? 'active-bajo' : ''}`}
          >
            Bajo Stock ({productosBajoStock})
          </button>
          <button 
            type="button"
            onClick={() => setFiltroEstado('transito')} 
            className={`stock-filter-btn ${filtroEstado === 'transito' ? 'active-transito' : ''}`}
          >
            En Tránsito
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Artículo</th>
              <th>Físico (Depósito)</th>
              <th>Reservado</th>
              <th>Disponible Real</th>
              <th>En Tránsito</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosPaginados.map(p => {
              const disponible = (p.stock_actual || 0) - (p.stock_reservado || 0);
              const esCritico = disponible <= p.stock_minimo;

              return (
                <tr key={p.id_producto}>
                  <td><span className="id-badge">{p.sku}</span></td>
                  <td className="td-nombre">
                    {p.nombre}
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Mínimo: {p.stock_minimo} u.
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {p.stock_actual || 0} u.
                  </td>
                  <td style={{ color: p.stock_reservado > 0 ? '#FBBF24' : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {p.stock_reservado || 0} u.
                  </td>
                  <td>
                    <strong style={{ color: esCritico ? '#F87171' : '#5EDBA2', fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                      {disponible} u.
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: p.stock_transito > 0 ? '#6EA8FE' : 'var(--color-text-muted)', fontWeight: p.stock_transito > 0 ? 600 : 400 }}>
                      {p.stock_transito > 0 ? `+${p.stock_transito} u.` : '—'}
                    </span>
                  </td>
                  <td>
                    {disponible <= 0 ? (
                      <span className="estado-badge inactivo">Sin Stock</span>
                    ) : esCritico ? (
                      <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', border: '1px solid rgba(201, 138, 39, 0.4)' }}>
                        Stock Bajo
                      </span>
                    ) : (
                      <span className="estado-badge activo">Óptimo</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-reponer"
                      onClick={() => onOpenAjuste(p)}
                    >
                      <ArrowUpDown size={12} /> Modificar
                    </button>
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
            Mostrando <strong>{(paginaStock - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaStock * ITEMS_PER_PAGE, totalItems)}</strong> de <strong>{totalItems}</strong> artículos
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaStock(p => Math.max(p - 1, 1))}
              disabled={paginaStock === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPaginasStock }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginasStock || Math.abs(p - paginaStock) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {prev && page - prev > 1 && <span className="pagination-ellipsis">...</span>}
                    <button
                      type="button"
                      className={`pagination-btn ${paginaStock === page ? 'active' : ''}`}
                      onClick={() => setPaginaStock(page)}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPaginaStock(p => Math.min(p + 1, totalPaginasStock))}
              disabled={paginaStock === totalPaginasStock}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}