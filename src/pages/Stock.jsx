// src/pages/Stock.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Boxes, AlertTriangle, CheckCircle, XCircle, 
  ArrowUpDown, Search, Filter, History, Truck, BookmarkCheck, PackageCheck,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import '../styles/stock.css';

const ITEMS_PER_PAGE = 10;

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('existencias');
  const [userId, setUserId] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Paginado independiente
  const [paginaStock, setPaginaStock] = useState(1);
  const [paginaMovs, setPaginaMovs] = useState(1);

  // Modal de Ajuste
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ajusteForm, setAjusteForm] = useState({
    destino: 'fisico', // 'fisico' | 'transito' | 'reservado'
    tipo: 'ingreso',   // 'ingreso' | 'egreso'
    cantidad: 1,
    motivo: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchStockData();
  }, []);

  // Reiniciar página de stock al buscar o cambiar estado de filtro
  useEffect(() => {
    setPaginaStock(1);
  }, [busqueda, filtroEstado]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Productos con stock discriminado
      const { data: prods, error: errProds } = await supabase
        .from('productos')
        .select('*, categorias(nombre)')
        .order('nombre', { ascending: true });
      if (errProds) throw errProds;
      setProductos(prods || []);

      // 2. Bitácora de Auditoría
      const { data: movs, error: errMovs } = await supabase
        .from('movimientos_stock')
        .select(`
          id_movimiento,
          tipo,
          cantidad,
          creado_en,
          productos ( nombre, sku ),
          perfiles ( nombre_completo )
        `)
        .order('creado_en', { ascending: false })
        .limit(100);
      if (errMovs) throw errMovs;
      setMovimientos(movs || []);

    } catch (err) {
      console.error("Error al cargar stock:", err.message);
      setError("Error de sincronización con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  // Métricas rápidas
  const totalFisico = productos.reduce((acc, p) => acc + (p.stock_actual || 0), 0);
  const totalReservado = productos.reduce((acc, p) => acc + (p.stock_reservado || 0), 0);
  const totalTransito = productos.reduce((acc, p) => acc + (p.stock_transito || 0), 0);
  const productosBajoStock = productos.filter(p => (p.stock_actual - (p.stock_reservado || 0)) <= p.stock_minimo && p.stock_actual > 0).length;
  const sinStock = productos.filter(p => (p.stock_actual - (p.stock_reservado || 0)) <= 0).length;

  // Filtrado de tabla
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                         p.sku.toLowerCase().includes(busqueda.toLowerCase());
      
      const disponible = (p.stock_actual || 0) - (p.stock_reservado || 0);

      if (!matchTexto) return false;
      if (filtroEstado === 'bajo') return disponible <= p.stock_minimo && disponible > 0;
      if (filtroEstado === 'sin') return disponible <= 0;
      if (filtroEstado === 'transito') return (p.stock_transito || 0) > 0;
      return true;
    });
  }, [productos, busqueda, filtroEstado]);

  // Paginación de existencias
  const totalPaginasStock = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) || 1;
  const productosPaginados = useMemo(() => {
    const inicio = (paginaStock - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [productosFiltrados, paginaStock]);

  // Paginación de bitácora
  const totalPaginasMovs = Math.ceil(movimientos.length / ITEMS_PER_PAGE) || 1;
  const movimientosPaginados = useMemo(() => {
    const inicio = (paginaMovs - 1) * ITEMS_PER_PAGE;
    return movimientos.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [movimientos, paginaMovs]);

  const openAjusteModal = (prod) => {
    setSelectedProduct(prod);
    setAjusteForm({
      destino: 'fisico',
      tipo: 'ingreso',
      cantidad: 1,
      motivo: ''
    });
  };

  const handleConfirmarAjuste = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !userId) return;

    const cant = parseInt(ajusteForm.cantidad) || 0;
    if (cant <= 0) return;

    setSaving(true);
    setError(null);

    try {
      let updateFields = {};
      let tipoAuditoria = 'ajuste';
      let factor = ajusteForm.tipo === 'ingreso' ? 1 : -1;
      let cantidadNeta = cant * factor;

      if (ajusteForm.destino === 'fisico') {
        const nuevoFisico = (selectedProduct.stock_actual || 0) + cantidadNeta;
        if (nuevoFisico < 0) throw new Error("No puede tener existencias físicas negativas.");
        updateFields.stock_actual = nuevoFisico;
        tipoAuditoria = ajusteForm.tipo === 'ingreso' ? 'reposicion' : 'ajuste';
      } 
      else if (ajusteForm.destino === 'transito') {
        const nuevoTransito = (selectedProduct.stock_transito || 0) + cantidadNeta;
        if (nuevoTransito < 0) throw new Error("El stock en tránsito no puede ser negativo.");
        updateFields.stock_transito = nuevoTransito;
        tipoAuditoria = 'transito';
      } 
      else if (ajusteForm.destino === 'reservado') {
        const nuevoReservado = (selectedProduct.stock_reservado || 0) + cantidadNeta;
        if (nuevoReservado < 0) throw new Error("El stock reservado no puede ser negativo.");
        if (nuevoReservado > selectedProduct.stock_actual) {
          throw new Error("No puede reservar más unidades de las disponibles físicamente en depósito.");
        }
        updateFields.stock_reservado = nuevoReservado;
        tipoAuditoria = 'reserva';
      }

      // 1. Actualizar producto
      const { error: errUpd } = await supabase
        .from('productos')
        .update(updateFields)
        .eq('id_producto', selectedProduct.id_producto);
      if (errUpd) throw errUpd;

      // 2. Registrar en auditoría
      const { error: errAud } = await supabase
        .from('movimientos_stock')
        .insert([{
          producto_id: selectedProduct.id_producto,
          usuario_id: userId,
          tipo: tipoAuditoria,
          cantidad: cantidadNeta
        }]);
      if (errAud) throw errAud;

      setSelectedProduct(null);
      fetchStockData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Control de Existencias y Logística</h2>
          <p>Auditoría de stock físico, reservas comerciales y mercadería importada en tránsito.</p>
        </div>
        <div className="header-badge">
          <Boxes size={14} />
          {totalFisico} u. físicas totales
        </div>
      </header>

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── KPIs de Almacén ── */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

      {/* ── Selector de Pestañas ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('existencias')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'existencias' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'existencias' ? '2px solid var(--color-accent)' : 'none'
          }}
        >
          <Boxes size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Existencias y Disponibilidad
        </button>

        <button
          onClick={() => setActiveTab('bitacora')}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'bitacora' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'bitacora' ? '2px solid var(--color-accent)' : 'none'
          }}
        >
          <History size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Bitácora de Auditoría Forense
        </button>
      </div>

      {/* ── CONTENIDO SOLAPA 1: EXISTENCIAS ── */}
      {activeTab === 'existencias' && (
        <div className="card table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar SKU o nombre..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 28px', color: 'var(--color-text-heading)', fontSize: '0.8rem', width: '220px' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setFiltroEstado('todos')} 
                className={`header-badge ${filtroEstado === 'todos' ? 'active' : ''}`}
                style={{ cursor: 'pointer', border: filtroEstado === 'todos' ? '1px solid var(--color-accent)' : '1px solid var(--color-border)' }}
              >
                Todos
              </button>
              <button 
                onClick={() => setFiltroEstado('bajo')} 
                className={`header-badge ${filtroEstado === 'bajo' ? 'active' : ''}`}
                style={{ cursor: 'pointer', color: '#FBBF24', border: filtroEstado === 'bajo' ? '1px solid #FBBF24' : '1px solid var(--color-border)' }}
              >
                Bajo Stock ({productosBajoStock})
              </button>
              <button 
                onClick={() => setFiltroEstado('transito')} 
                className={`header-badge ${filtroEstado === 'transito' ? 'active' : ''}`}
                style={{ cursor: 'pointer', color: '#6EA8FE', border: filtroEstado === 'transito' ? '1px solid #6EA8FE' : '1px solid var(--color-border)' }}
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
                          Mínimo requerido: {p.stock_minimo} u.
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
                          <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', borderColor: 'rgba(201, 138, 39, 0.4)' }}>
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="estado-badge activo">Óptimo</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openAjusteModal(p)}
                          style={{
                            background: 'var(--color-accent-soft)',
                            border: '1px solid rgba(201, 162, 39, 0.3)',
                            color: 'var(--color-accent)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 9px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
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

          {/* ── Barra de Paginado Existencias ── */}
          {!loading && productosFiltrados.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Mostrando <strong>{(paginaStock - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaStock * ITEMS_PER_PAGE, productosFiltrados.length)}</strong> de <strong>{productosFiltrados.length}</strong> artículos
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPaginaStock(p => Math.max(p - 1, 1))}
                  disabled={paginaStock === 1}
                  title="Página anterior"
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
                  title="Página siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONTENIDO SOLAPA 2: AUDITORÍA ── */}
      {activeTab === 'bitacora' && (
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

          {/* ── Barra de Paginado Auditoría ── */}
          {!loading && movimientos.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Mostrando <strong>{(paginaMovs - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaMovs * ITEMS_PER_PAGE, movimientos.length)}</strong> de <strong>{movimientos.length}</strong> movimientos
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPaginaMovs(p => Math.max(p - 1, 1))}
                  disabled={paginaMovs === 1}
                  title="Página anterior"
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
                  title="Página siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Modificar Físico / Reserva / Tránsito ── */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 8, 15, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Modificar Existencias</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {selectedProduct.sku} — {selectedProduct.nombre}
                </span>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleConfirmarAjuste}>
              <div className="form-group">
                <label>Área a Modificar</label>
                <select 
                  value={ajusteForm.destino} 
                  onChange={(e) => setAjusteForm(prev => ({ ...prev, destino: e.target.value }))}
                >
                  <option value="fisico">Físico en Depósito (Actual: {selectedProduct.stock_actual} u.)</option>
                  <option value="reservado">Reservas Comerciales (Actual: {selectedProduct.stock_reservado || 0} u.)</option>
                  <option value="transito">En Tránsito / Importación (Actual: {selectedProduct.stock_transito || 0} u.)</option>
                </select>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Tipo de Acción</label>
                  <select 
                    value={ajusteForm.tipo} 
                    onChange={(e) => setAjusteForm(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="ingreso">+ Sumar (Ingreso/Embarque)</option>
                    <option value="egreso">- Restar (Salida/Baja)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad de Unidades</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={ajusteForm.cantidad} 
                    onChange={(e) => setAjusteForm(prev => ({ ...prev, cantidad: e.target.value }))} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setSelectedProduct(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Registrando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}