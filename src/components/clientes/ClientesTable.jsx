// src/components/clientes/ClientesTable.jsx
import { Search, Building2, DollarSign, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useClientes';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ClientesTable({
  clientesPaginados,
  totalItems,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  busqueda,
  setBusqueda,
  filtroEstado,
  setFiltroEstado,
  clientesConDeudaCount,
  onOpenEdit,
  onOpenCobranza,
  loading
}) {
  return (
    <div className="card table-card">
      <div className="clientes-toolbar">
        <h3 className="table-title" style={{ margin: 0 }}>Cartera de Clientes</h3>

        <div className="clientes-toolbar-controls">
          <div className="clientes-search-box">
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--color-accent)' }} />
            <input 
              type="text" 
              className="clientes-search-input"
              placeholder="Buscar por nombre, tel o dir..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="clientes-filter-group">
            <button 
              type="button" 
              onClick={() => setFiltroEstado('todos')} 
              className={`cliente-filter-btn ${filtroEstado === 'todos' ? 'active-todos' : ''}`}
            >
              Todos
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroEstado('deuda')} 
              className={`cliente-filter-btn ${filtroEstado === 'deuda' ? 'active-deuda' : ''}`}
            >
              Con Deuda ({clientesConDeudaCount})
            </button>
            <button 
              type="button" 
              onClick={() => setFiltroEstado('al_dia')} 
              className={`cliente-filter-btn ${filtroEstado === 'al_dia' ? 'active-aldia' : ''}`}
            >
              Al Día
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando directorio comercial...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Saldo Deudor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesPaginados.map((c) => {
                const deuda = Number(c.saldo_deudor || 0);
                const tieneDeuda = deuda > 0;

                return (
                  <tr key={c.id_cliente}>
                    <td className="td-nombre">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} style={{ color: 'var(--color-accent)' }} />
                        {c.nombre_razon_social}
                      </span>
                    </td>
                    <td className="td-muted">{c.direccion || '—'}</td>
                    <td className="td-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.telefono || '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: tieneDeuda ? '#F87171' : 'var(--color-text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPrice(deuda)}
                    </td>
                    <td>
                      {tieneDeuda ? (
                        <span className="estado-badge" style={{ background: 'var(--color-error-soft)', color: '#F87171', border: '1px solid rgba(179, 64, 42, 0.4)' }}>
                          Deudor
                        </span>
                      ) : (
                        <span className="estado-badge activo">Al Día</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {tieneDeuda && (
                          <button
                            type="button"
                            onClick={() => onOpenCobranza(c)}
                            style={{
                              background: 'var(--color-success-soft)',
                              border: '1px solid rgba(94, 219, 162, 0.4)',
                              color: '#5EDBA2',
                              borderRadius: 'var(--radius-sm)',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Registrar pago de deuda"
                          >
                            <DollarSign size={12} /> Saldar
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => onOpenEdit(c)} 
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {clientesPaginados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    No se encontraron clientes registrados bajo este criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalItems > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, totalItems)}</strong> de <strong>{totalItems}</strong> clientes
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