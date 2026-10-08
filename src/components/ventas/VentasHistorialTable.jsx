// src/components/ventas/VentasHistorialTable.jsx
import { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Ban, Search, RotateCcw, FileText, X } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasHistorialTable({
  historialFiltrado,
  historialPaginado,
  clientes,
  loading,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  itemsPorPagina,
  setItemsPorPagina,
  busqueda,
  setBusqueda,
  filtroCliente,
  setFiltroCliente,
  filtroEstado,
  setFiltroEstado,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  onLimpiarFiltros,
  onCancelarVenta,
  saving
}) {
  const [notaActiva, setNotaActiva] = useState(null);
  const hayFiltrosActivos = busqueda || filtroCliente !== 'todos' || filtroEstado !== 'todos' || fechaDesde || fechaHasta;

  return (
    <div className="card table-card" style={{ marginTop: '1.5rem', position: 'relative' }}>
      {/* ── Modal Pop-over para leer la observación completa ── */}
      {notaActiva && (
        <div 
          onClick={() => setNotaActiva(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 8, 15, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #09121D 0%, #0c1827 100%)',
              border: '1px solid rgba(201, 162, 39, 0.4)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                <FileText size={15} /> Observación de Venta #{notaActiva.id_venta}
              </div>
              <button 
                type="button" 
                onClick={() => setNotaActiva(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Cliente: <strong style={{ color: 'var(--color-text-heading)' }}>{notaActiva.cliente}</strong> • Fecha: {notaActiva.fecha}
            </div>

            <div style={{ 
              background: 'var(--color-bg-main)', 
              border: '1px solid var(--color-border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '10px', 
              fontSize: '0.82rem', 
              color: 'var(--color-text-main)', 
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              {notaActiva.texto}
            </div>

            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setNotaActiva(null)}
                style={{
                  background: 'var(--color-accent)',
                  border: 'none',
                  color: '#FFF',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="table-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} style={{ color: 'var(--color-accent)' }} /> Historial y Cobranzas
        </h3>
        <span className="table-count">
          {historialFiltrado.length} {historialFiltrado.length === 1 ? 'operación encontrada' : 'operaciones encontradas'}
        </span>
      </div>

      {/* ── Barra de Filtros Multidimensional Responsiva ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '10px', 
          background: 'var(--color-bg-main)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px', 
          marginBottom: '1.25rem',
          alignItems: 'end'
        }}
      >
        {/* 1. Búsqueda por texto */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>Búsqueda</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Cliente, operador, observación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px 0 30px',
                fontSize: '0.8rem',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-heading)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* 2. Filtro por Cliente */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>Cliente</label>
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 10px',
              fontSize: '0.8rem',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-heading)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre_razon_social}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filtro por Estado de Cobro */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>Estado de Cobro</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 10px',
              fontSize: '0.8rem',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-heading)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="pagado">Cobrado / Pagado</option>
            <option value="pendiente">Pendiente (Deuda)</option>
            <option value="parcial">Cobro Parcial / Mixto</option>
            <option value="cancelado">Anulada / Cancelada</option>
          </select>
        </div>

        {/* 4. Rango de Fechas */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 8px',
              fontSize: '0.8rem',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-heading)',
              outline: 'none'
            }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600 }}>Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 8px',
              fontSize: '0.8rem',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-heading)',
              outline: 'none'
            }}
          />
        </div>

        {/* 5. Filas por Página & Reset */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Filas
            </label>
            <select
              value={itemsPorPagina}
              onChange={(e) => setItemsPorPagina(Number(e.target.value))}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 8px',
                fontSize: '0.8rem',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-heading)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              style={{
                height: '38px',
                padding: '0 12px',
                marginTop: '19px',
                background: 'var(--color-error-soft)',
                border: '1px solid rgba(179, 64, 42, 0.4)',
                color: '#F87171',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla de Historial ── */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Operador</th>
              <th>Cliente / Razón Social</th>
              <th>Artículos</th>
              <th>Medio</th>
              <th>Estado Cobro</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {historialPaginado.map(v => {
              const fecha = new Date(v.creado_en);
              const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
              const fechaStr = fecha.toLocaleDateString('es-AR');
              const cantArticulos = v.ventas_detalle?.reduce((acc, d) => acc + d.cantidad, 0) || 0;
              const esCancelado = v.estado_pago === 'cancelado';
              const esPend = v.estado_pago === 'pendiente';
              const tieneNota = Boolean(v.observaciones && v.observaciones.trim());

              return (
                <tr key={v.id_venta} style={{ opacity: esCancelado ? 0.6 : 1 }}>
                  <td>
                    <span className="hora-badge">{horaStr}</span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{fechaStr}</span>
                  </td>
                  <td className="td-muted">{v.perfiles?.nombre_completo || 'Operador'}</td>
                  <td className="td-nombre">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span>{v.clientes?.nombre_razon_social || 'Consumidor Final'}</span>
                      {/* Pill interactivo de Observación */}
                      {tieneNota && (
                        <button
                          type="button"
                          onClick={() => setNotaActiva({
                            id_venta: v.id_venta,
                            cliente: v.clientes?.nombre_razon_social || 'Consumidor Final',
                            fecha: `${fechaStr} ${horaStr} hs`,
                            texto: v.observaciones
                          })}
                          style={{
                            background: 'var(--color-accent-soft)',
                            border: '1px solid rgba(201, 162, 39, 0.4)',
                            color: 'var(--color-accent)',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content'
                          }}
                          title="Clic para ver observación completa"
                        >
                          <FileText size={10} /> Nota
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="td-muted">
                    {v.ventas_detalle?.length > 0 
                      ? `${v.ventas_detalle[0].productos?.nombre || 'Producto'} ${v.ventas_detalle.length > 1 ? `(+${v.ventas_detalle.length - 1})` : ''} (${cantArticulos} u.)`
                      : '—'
                    }
                  </td>
                  <td>
                    <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                      {v.metodo_pago === 'mixto' ? 'Mixto' : (v.metodo_pago || 'Efectivo')}
                    </span>
                  </td>
                  <td>
                    {esCancelado ? (
                      <span className="estado-badge inactivo" style={{ background: 'rgba(179,64,42,0.2)', color: '#F87171' }}>
                        Anulada
                      </span>
                    ) : esPend ? (
                      <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', border: '1px solid rgba(201, 138, 39, 0.4)' }}>
                        Pendiente {v.fecha_vencimiento ? `(${v.fecha_vencimiento.slice(5)})` : ''}
                      </span>
                    ) : v.estado_pago === 'parcial' ? (
                      <span className="estado-badge" style={{ background: 'rgba(42, 90, 150, 0.2)', color: '#6EA8FE', border: '1px solid rgba(42, 90, 150, 0.4)' }}>
                        Cobro Parcial
                      </span>
                    ) : (
                      <span className="estado-badge activo">Cobrado</span>
                    )}
                  </td>
                  <td className="td-precio" style={{ textDecoration: esCancelado ? 'line-through' : 'none' }}>
                    {formatPrice(v.total)}
                  </td>
                  <td>
                    {!esCancelado && (
                      <button
                        type="button"
                        onClick={() => onCancelarVenta(v.id_venta)}
                        disabled={saving}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(179, 64, 42, 0.3)',
                          color: '#F87171',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem'
                        }}
                        title="Anular venta y reponer stock"
                      >
                        <Ban size={12} /> Anular
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {historialFiltrado.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  No se encontraron ventas bajo los criterios seleccionados.
                </td>
              </tr> 
            )}
          </tbody>
        </table>
      </div>

      {/* ── Control de Paginado ── */}
      {!loading && historialFiltrado.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando <strong>{(paginaActual - 1) * itemsPorPagina + 1}</strong> a <strong>{Math.min(paginaActual * itemsPorPagina, historialFiltrado.length)}</strong> de <strong>{historialFiltrado.length}</strong> operaciones
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