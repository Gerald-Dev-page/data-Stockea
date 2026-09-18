import { Search, Filter, Eye, Package, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useProducts';

export default function ProductTable({
  loading,
  productos,
  totalItems,
  paginaActual,
  totalPaginas,
  setPaginaActual,
  busqueda,
  setBusqueda,
  categoriaFiltro,
  setCategoriaFiltro,
  categorias,
  cotizacionDolar,
  onOpenEdit,
  onZoomFoto
}) {
  const formatPrice = (n) =>
    Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  return (
    <div className="card table-card">
      {/* ── Barra de Herramientas y Filtros ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 className="table-title" style={{ margin: 0 }}>Catálogo Centralizado</h3>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '520px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--color-accent)', zIndex: 1 }} />
            <input 
              type="text" 
              placeholder="Buscar SKU, código o nombre..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              style={{ 
                background: 'var(--color-bg-main)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '8px 12px 8px 34px', 
                color: 'var(--color-text-heading)', 
                fontSize: '0.85rem', 
                width: '100%',
                outline: 'none',
                height: '40px'
              }} 
            />
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 180px' }}>
            <Filter size={15} style={{ position: 'absolute', left: '10px', color: 'var(--color-accent)', zIndex: 1 }} />
            <select 
              value={categoriaFiltro} 
              onChange={(e) => setCategoriaFiltro(e.target.value)} 
              style={{ 
                background: 'var(--color-bg-main)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '8px 12px 8px 34px', 
                color: 'var(--color-text-heading)', 
                fontSize: '0.85rem', 
                width: '100%',
                outline: 'none',
                height: '40px',
                cursor: 'pointer'
              }}
            >
              <option value="todas" style={{ background: 'var(--color-bg-card)', color: '#CBD5E1' }}>Todas las categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id} style={{ background: 'var(--color-bg-card)', color: '#CBD5E1' }}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Sincronizando inventario y costos...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>SKU</th>
                <th>Artículo</th>
                <th>Costo Real</th>
                <th>Minorista</th>
                <th>Mayoristas (M1 / M2 / M3)</th>
                <th>Físico</th>
                <th>Estado</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const g = p.gastos_importacion || {};
                const cOrigen = Number(p.costo_origen) || 0;
                const cUSD = cOrigen > 0
                  ? cOrigen + (Number(g.flete_int) || 0) + (Number(g.impuestos_aduana) || 0) + (Number(g.nacionalizacion) || 0) + (Number(g.flete_local) || 0)
                  : Number(p.costo_unitario) || 0;
                const costoARS = Math.round(cUSD * (Number(cotizacionDolar) || 1));
                const pMin = Number(p.precio_venta || 0);
                const pM1 = Number(p.precio_mayorista_1 || p.precio_mayorista || 0);
                const pM2 = Number(p.precio_mayorista_2 || 0);
                const pM3 = Number(p.precio_mayorista_3 || 0);
                const rentMin = costoARS > 0 ? Math.round(((pMin - costoARS) / costoARS) * 100) : 0;

                return (
                  <tr key={p.id_producto}>
                    <td style={{ width: '50px', textAlign: 'center' }}>
                      {p.fotos && p.fotos.length > 0 ? (
                        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => onZoomFoto(p.fotos[0])}>
                          <img src={p.fotos[0]} alt={p.nombre} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', borderRadius: '2px', padding: '1px' }}>
                            <Maximize2 size={10} color="#FFF" />
                          </span>
                        </div>
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: 'var(--color-bg-main)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                          <Package size={16} />
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="id-badge">{p.sku}</span>
                      {p.codigo_barras && <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{p.codigo_barras}</span>}
                    </td>
                    <td className="td-nombre">
                      {p.nombre}
                      <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.marca} {p.modelo}</span>
                    </td>
                    <td className="td-muted" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      <div>USD ${cUSD.toFixed(2)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>{formatPrice(costoARS)}</div>
                    </td>
                    <td>
                      <span className="td-precio">{formatPrice(pMin)}</span>
                      <span className={`profit-badge ${rentMin >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                        {rentMin >= 0 ? `+${rentMin}%` : `${rentMin}%`}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
                      {[ { label: 'M1', val: pM1 }, { label: 'M2', val: pM2 }, { label: 'M3', val: pM3 } ].map((m, idx) => {
                        const rent = costoARS > 0 ? Math.round(((m.val - costoARS) / costoARS) * 100) : 0;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: idx === 2 ? 0 : '2px' }}>
                            <strong style={{ minWidth: '22px' }}>{m.label}:</strong>
                            <span>{m.val > 0 ? formatPrice(m.val) : '—'}</span>
                            {m.val > 0 && costoARS > 0 && (
                              <span className={`profit-badge ${rent >= 0 ? 'profit-wholesale' : 'profit-negative'}`} style={{ marginTop: 0 }}>
                                +{rent}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </td>
                    <td style={{ fontWeight: '700', color: p.stock_actual <= p.stock_minimo ? '#FBBF24' : 'var(--color-text-heading)' }}>
                      {p.stock_actual} u.
                    </td>
                    <td>
                      <span className={`estado-badge ${p.activo ? 'activo' : 'inactivo'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenEdit(p)}
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} /> Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalItems > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, totalItems)}</strong> de <strong>{totalItems}</strong> artículos
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