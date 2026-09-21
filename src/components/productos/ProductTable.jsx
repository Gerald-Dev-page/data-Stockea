// src/components/productos/ProductTable.jsx
import { Search, Filter, Eye, Package, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../../hooks/useProducts';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

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

      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Sincronizando inventario y costos...
        </div>
      ) : (
        <>
          {/* ── 1. VISTA MÓVIL: Tarjetas compactas con TODOS los datos legibles (< 768px) ── */}
          <div className="catalogo-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: '0.85rem' }}>
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
                <div 
                  key={p.id_producto}
                  style={{
                    background: 'var(--color-bg-main)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Fila Superior: Foto + Info básica + Botón Ficha */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {p.fotos && p.fotos.length > 0 ? (
                      <div 
                        style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => onZoomFoto(p.fotos[0])}
                      >
                        <img src={p.fotos[0]} alt={p.nombre} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', borderRadius: '2px', padding: '1px' }}>
                          <Maximize2 size={10} color="#FFF" />
                        </span>
                      </div>
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-card)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        <Package size={20} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span className="id-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{p.sku}</span>
                        <span className={`estado-badge ${p.activo ? 'activo' : 'inactivo'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nombre}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {p.marca} {p.modelo} {p.codigo_barras ? `• ${p.codigo_barras}` : ''}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => onOpenEdit(p)} 
                      style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontSize: '0.74rem', flexShrink: 0 }}
                    >
                      <Eye size={13} /> Ficha
                    </button>
                  </div>

                  {/* Fila Central: PRECIO MINORISTA DESTACADO (Siempre visible) */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(201, 162, 39, 0.12)', 
                      border: '1px solid rgba(201, 162, 39, 0.35)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '8px 12px' 
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600, display: 'block' }}>
                        Precio Minorista:
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(pMin)}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Rentabilidad</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: rentMin >= 0 ? '#5EDBA2' : '#F87171' }}>
                        {rentMin >= 0 ? `+${rentMin}%` : `${rentMin}%`}
                      </span>
                    </div>
                  </div>

                  {/* Fila Inferior: Costo Real, Stock y Mayoristas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', background: 'var(--color-bg-card)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.68rem' }}>Costo Depósito:</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{formatPrice(costoARS)}</strong>
                      <small style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>USD ${cUSD.toFixed(2)}</small>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.68rem' }}>Stock Disponible:</span>
                      <strong style={{ color: p.stock_actual <= p.stock_minimo ? '#FBBF24' : '#5EDBA2', fontSize: '0.9rem' }}>
                        {p.stock_actual} u.
                      </strong>
                      <small style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>Mín: {p.stock_minimo} u.</small>
                    </div>

                    <div style={{ gridColumn: 'span 2', paddingTop: '4px', borderTop: '1px dashed var(--color-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                      <span>M1: <strong style={{ color: '#F3F5F7' }}>{pM1 > 0 ? formatPrice(pM1) : '—'}</strong></span>
                      <span>M2: <strong style={{ color: '#F3F5F7' }}>{pM2 > 0 ? formatPrice(pM2) : '—'}</strong></span>
                      <span>M3: <strong style={{ color: '#F3F5F7' }}>{pM3 > 0 ? formatPrice(pM3) : '—'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 2. VISTA ESCRITORIO: Tabla tradicional completa (>= 769px) ── */}
          <div className="table-wrapper">
  <table className="data-table productos-table">
    <thead>
      <tr>
        <th>Foto</th>
        <th>SKU</th>
        <th>Artículo</th>
        <th>Costo Real</th>
        <th style={{ minWidth: '110px' }}>Minorista</th>
        <th style={{ minWidth: '140px' }}>Mayoristas (M1 / M2 / M3)</th>
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
                          <div 
                            style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                            onClick={() => onZoomFoto(p.fotos[0])}
                            title="Tocar para ampliar foto"
                          >
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
                        <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                          {p.nombre}
                        </div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          {p.marca} {p.modelo}
                        </span>
                      </td>

                      <td className="td-muted" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        <div>USD ${cUSD.toFixed(2)}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>
                          {formatPrice(costoARS)}
                        </div>
                      </td>

                      <td>
                        <span className="td-precio">{formatPrice(pMin)}</span>
                        <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: rentMin >= 0 ? '#5EDBA2' : '#F87171' }}>
                          {rentMin >= 0 ? `+${rentMin}%` : `${rentMin}%`}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <strong style={{ minWidth: '22px' }}>M1:</strong>
                          <span>{pM1 > 0 ? formatPrice(pM1) : '—'}</span>
                          {pM1 > 0 && costoARS > 0 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ((pM1 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' }}>
                              +{Math.round(((pM1 - costoARS) / costoARS) * 100)}%
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <strong style={{ minWidth: '22px' }}>M2:</strong>
                          <span>{pM2 > 0 ? formatPrice(pM2) : '—'}</span>
                          {pM2 > 0 && costoARS > 0 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ((pM2 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' }}>
                              +{Math.round(((pM2 - costoARS) / costoARS) * 100)}%
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ minWidth: '22px' }}>M3:</strong>
                          <span>{pM3 > 0 ? formatPrice(pM3) : '—'}</span>
                          {pM3 > 0 && costoARS > 0 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ((pM3 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' }}>
                              +{Math.round(((pM3 - costoARS) / costoARS) * 100)}%
                            </span>
                          )}
                        </div>
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
          </div>
        </>
      )}

      {/* ── Control de Paginado ── */}
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
              title="Página anterior"
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
              title="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}