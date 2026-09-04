// src/pages/Stock.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Package, AlertTriangle, CheckCircle, 
  XCircle, BarChart2, RefreshCw, AlertCircle, 
  X, ArrowUpCircle, ArrowDownCircle, Search, History, UserCheck
} from 'lucide-react';
import '../styles/stock.css';

const formatPrice = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const getEstado = (stock, minimo) => {
  if (stock === 0) return { label: 'Sin stock', color: 'error', Icon: XCircle };
  if (stock <= minimo) return { label: 'Stock bajo', color: 'warning', Icon: AlertTriangle };
  return { label: 'Normal', color: 'success', Icon: CheckCircle };
};

export default function Stock() {
  const [tabActiva, setTabActiva] = useState('inventario'); // 'inventario' | 'auditoria'
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [userId, setUserId] = useState(null);

  // Modal de modificación de stock
  const [reponiendoProducto, setReponiendoProducto] = useState(null);
  const [formData, setFormData] = useState({
    tipo: 'reposicion',
    cantidad: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Inventario actual
      const { data: dataProd, error: errProd } = await supabase
        .from('productos')
        .select(`
          id_producto,
          sku,
          nombre,
          stock_actual,
          stock_minimo,
          costo_unitario,
          categorias ( nombre )
        `)
        .order('nombre', { ascending: true });

      if (errProd) throw errProd;
      setInventario(dataProd || []);

      // 2. Bitácora de auditoría histórica
      const { data: dataMov, error: errMov } = await supabase
        .from('movimientos_stock')
        .select(`
          id_movimiento,
          creado_en,
          tipo,
          cantidad,
          productos ( sku, nombre ),
          perfiles ( nombre_completo )
        `)
        .order('creado_en', { ascending: false })
        .limit(50);

      if (errMov) throw errMov;
      setMovimientos(dataMov || []);

    } catch (err) {
      console.error("Error al cargar datos de stock:", err.message);
      setError("Error al sincronizar inventario.");
    } finally {
      setLoading(false);
    }
  };

  const openMovimientoModal = (producto) => {
    setError(null);
    setReponiendoProducto(producto);
    setFormData({ tipo: 'reposicion', cantidad: '' });
  };

  const handleConfirmarMovimiento = async (e) => {
    e.preventDefault();
    const cantidad = parseInt(formData.cantidad);

    if (isNaN(cantidad) || cantidad <= 0) {
      setError("Debe ingresar una cantidad válida mayor a cero.");
      return;
    }

    if (formData.tipo === 'ajuste' && reponiendoProducto.stock_actual < cantidad) {
      setError("No puede registrar un egreso mayor al stock disponible.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!userId) throw new Error("Sesión inválida del operador.");

      const cantidadReal = formData.tipo === 'reposicion' ? cantidad : -cantidad;
      const nuevoStock = reponiendoProducto.stock_actual + cantidadReal;

      // 1. Auditoría
      const { error: movError } = await supabase
        .from('movimientos_stock')
        .insert([{
          producto_id: reponiendoProducto.id_producto,
          usuario_id: userId,
          tipo: formData.tipo,
          cantidad: cantidadReal
        }]);
      if (movError) throw movError;

      // 2. Actualizar stock
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id_producto', reponiendoProducto.id_producto);
      if (updateError) throw updateError;

      setToastMessage(`Se registró exitosamente el ${formData.tipo === 'reposicion' ? 'ingreso' : 'egreso'} de ${cantidad} unidades.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);

      setReponiendoProducto(null);
      cargarDatos();
    } catch (err) {
      console.error("Error en movimiento:", err.message);
      setError("Error al procesar movimiento: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Métricas
  const sinStock = inventario.filter(p => p.stock_actual === 0).length;
  const stockBajo = inventario.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length;
  const normal = inventario.filter(p => p.stock_actual > p.stock_minimo).length;
  const valorTotal = inventario.reduce((a, p) => a + (p.stock_actual * Number(p.costo_unitario)), 0);

  const productosFiltrados = useMemo(() => {
    return inventario.filter(p => {
      const matchEstado = 
        filtro === 'todos' ? true :
        filtro === 'error' ? p.stock_actual === 0 :
        filtro === 'warning' ? (p.stock_actual > 0 && p.stock_actual <= p.stock_minimo) :
        p.stock_actual > p.stock_minimo;

      const q = busqueda.toLowerCase().trim();
      const matchTexto = !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);

      return matchEstado && matchTexto;
    });
  }, [inventario, filtro, busqueda]);

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      <header className="page-header">
        <div>
          <h2>Control de Stock y Auditoría</h2>
          <p>Monitoreo físico de existencias, bitácora de mermas y reposición por operador.</p>
        </div>
        <div className="header-badge">
          <BarChart2 size={14} />
          {formatPrice(valorTotal)} en capital activo
        </div>
      </header>

      {/* ── Sub-navegación de solapas ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setTabActiva('inventario')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: tabActiva === 'inventario' ? 'var(--color-accent)' : 'transparent',
            color: tabActiva === 'inventario' ? '#081527' : 'var(--color-text-muted)',
            fontWeight: '600',
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Package size={15} /> Existencias Actuales
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('auditoria')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: tabActiva === 'auditoria' ? 'var(--color-accent)' : 'transparent',
            color: tabActiva === 'auditoria' ? '#081527' : 'var(--color-text-muted)',
            fontWeight: '600',
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <History size={15} /> Bitácora de Auditoría ({movimientos.length})
        </button>
      </div>

      {showToast && (
        <div className="demo-toast">
          ✓ {toastMessage}
        </div>
      )}

      {error && !reponiendoProducto && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── TAB 1: EXISTENCIAS ACTUALES ── */}
      {tabActiva === 'inventario' && (
        <>
          <div className="stats-row stock-stats">
            <div
              className={`stat-card stat-clickable ${filtro === 'success' ? 'stat-active-success' : ''}`}
              onClick={() => setFiltro(filtro === 'success' ? 'todos' : 'success')}
            >
              <span className="stat-icon" style={{ background: 'var(--color-success-soft)', color: '#5EDBA2' }}>
                <CheckCircle size={18} />
              </span>
              <div>
                <p className="stat-label">Normal</p>
                <p className="stat-value">{normal}</p>
              </div>
            </div>

            <div
              className={`stat-card stat-clickable ${filtro === 'warning' ? 'stat-active-warning' : ''}`}
              onClick={() => setFiltro(filtro === 'warning' ? 'todos' : 'warning')}
            >
              <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="stat-label">Stock bajo</p>
                <p className="stat-value">{stockBajo}</p>
              </div>
            </div>

            <div
              className={`stat-card stat-clickable ${filtro === 'error' ? 'stat-active-error' : ''}`}
              onClick={() => setFiltro(filtro === 'error' ? 'todos' : 'error')}
            >
              <span className="stat-icon" style={{ background: 'var(--color-error-soft)', color: '#F87171' }}>
                <XCircle size={18} />
              </span>
              <div>
                <p className="stat-label">Sin stock</p>
                <p className="stat-value">{sinStock}</p>
              </div>
            </div>
          </div>

          <div className="card table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="table-title" style={{ margin: 0 }}>
                  <Package size={16} style={{ color: 'var(--color-accent)' }} /> Inventario Físico
                </h3>
                {filtro !== 'todos' && (
                  <div className="filtro-activo" style={{ marginTop: '0.4rem', marginBottom: 0 }}>
                    Filtro: <strong>{filtro === 'error' ? 'Sin stock' : filtro === 'warning' ? 'Stock bajo' : 'Normal'}</strong>
                    <button className="filtro-clear" onClick={() => setFiltro('todos')}>✕ Quitar filtro</button>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar SKU o producto..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    background: 'var(--color-bg-main)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px 6px 28px',
                    color: 'var(--color-text-heading)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '210px'
                  }}
                />
              </div>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Sincronizando inventario...
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Stock Físico</th>
                      <th>Mínimo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((p) => {
                      const estado = getEstado(p.stock_actual, p.stock_minimo);
                      const limiteVisual = p.stock_minimo === 0 ? 10 : (p.stock_minimo * 3);
                      const pct = Math.min((p.stock_actual / limiteVisual) * 100, 100);
                      
                      return (
                        <tr key={p.id_producto}>
                          <td><span className="id-badge">{p.sku}</span></td>
                          <td className="td-nombre">{p.nombre}</td>
                          <td className="td-muted">{p.categorias?.nombre || '—'}</td>
                          <td>
                            <div className="stock-cell">
                              <span className={`stock-num estado-${estado.color}`}>{p.stock_actual}</span>
                              <div className="stock-bar-track">
                                <div className={`stock-bar-fill fill-${estado.color}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="td-muted">{p.stock_minimo}</td>
                          <td>
                            <span className={`estado-badge-stock color-${estado.color}`}>
                              <estado.Icon size={12} />
                              {estado.label}
                            </span>
                          </td>
                          <td>
                            <button className="btn-reponer" onClick={() => openMovimientoModal(p)}>
                              <RefreshCw size={12} /> Modificar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: BITÁCORA DE AUDITORÍA ── */}
      {tabActiva === 'auditoria' && (
        <div className="card table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 className="table-title" style={{ margin: 0 }}>
                <History size={16} style={{ color: 'var(--color-accent)' }} /> Registro Forense de Movimientos
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Trazabilidad inmutable de modificaciones de inventario por operador autenticado.
              </p>
            </div>
            <span className="table-count">Últimos 50 movimientos</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Operador Responsable</th>
                  <th>Producto</th>
                  <th>Tipo Movimiento</th>
                  <th>Variación Unidades</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const fecha = new Date(m.creado_en);
                  const fechaStr = fecha.toLocaleDateString('es-AR');
                  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  const esSuma = m.cantidad > 0;

                  return (
                    <tr key={m.id_movimiento}>
                      <td>
                        <span className="hora-badge">{fechaStr} {horaStr}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                          <UserCheck size={13} style={{ color: 'var(--color-accent)' }} />
                          {m.perfiles?.nombre_completo || 'Operador'}
                        </span>
                      </td>
                      <td className="td-nombre">
                        {m.productos?.nombre || 'Producto'} <small className="td-muted">({m.productos?.sku})</small>
                      </td>
                      <td>
                        <span 
                          className="id-badge" 
                          style={{ 
                            textTransform: 'capitalize',
                            borderColor: m.tipo === 'reposicion' ? 'rgba(46, 125, 91, 0.4)' : m.tipo === 'venta' ? 'rgba(42, 90, 150, 0.4)' : 'rgba(179, 64, 42, 0.4)',
                            color: m.tipo === 'reposicion' ? '#5EDBA2' : m.tipo === 'venta' ? '#6EA8FE' : '#F87171'
                          }}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: esSuma ? '#5EDBA2' : '#F87171', fontVariantNumeric: 'tabular-nums' }}>
                        {esSuma ? `+${m.cantidad}` : m.cantidad} u.
                      </td>
                    </tr>
                  );
                })}
                {movimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No se han registrado movimientos de inventario en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal de Ajuste ── */}
      {reponiendoProducto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 8, 15, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="form-card" style={{
            width: '100%',
            maxWidth: '460px',
            margin: '1rem',
            padding: '2rem',
            border: '1px solid rgba(201, 162, 39, 0.3)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Modificar Inventario</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                  {reponiendoProducto.nombre} ({reponiendoProducto.sku})
                </p>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-heading)', fontSize: '0.84rem', fontWeight: '600' }}>
                  Existencia física: {reponiendoProducto.stock_actual} unidades
                </p>
              </div>
              <button onClick={() => setReponiendoProducto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarMovimiento}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Tipo de Ajuste</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.4rem' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid',
                    borderColor: formData.tipo === 'reposicion' ? 'rgba(46, 125, 91, 0.5)' : 'var(--color-border)',
                    background: formData.tipo === 'reposicion' ? 'var(--color-success-soft)' : 'var(--color-bg-main)',
                    color: formData.tipo === 'reposicion' ? '#5EDBA2' : 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500'
                  }}>
                    <input 
                      type="radio" name="tipo" value="reposicion" 
                      checked={formData.tipo === 'reposicion'} 
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} 
                      style={{ display: 'none' }}
                    />
                    <ArrowUpCircle size={16} /> Ingreso (+Suma)
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid',
                    borderColor: formData.tipo === 'ajuste' ? 'rgba(179, 64, 42, 0.5)' : 'var(--color-border)',
                    background: formData.tipo === 'ajuste' ? 'var(--color-error-soft)' : 'var(--color-bg-main)',
                    color: formData.tipo === 'ajuste' ? '#F87171' : 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500'
                  }}>
                    <input 
                      type="radio" name="tipo" value="ajuste" 
                      checked={formData.tipo === 'ajuste'} 
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} 
                      style={{ display: 'none' }}
                    />
                    <ArrowDownCircle size={16} /> Egreso (-Merma)
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Cantidad de Unidades</label>
                <input 
                  type="number" min="1" step="1" placeholder="Ej: 25" 
                  value={formData.cantidad} 
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} 
                  required autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setReponiendoProducto(null)} 
                  style={{ padding: '8px 16px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={saving}
                  style={{
                    marginTop: 0,
                    background: formData.tipo === 'reposicion' ? 'var(--gradient-accent)' : 'linear-gradient(135deg, #B3402A, #8F2F1B)',
                    color: formData.tipo === 'reposicion' ? '#081527' : '#FFFFFF'
                  }}
                >
                  {saving ? 'Registrando...' : `Confirmar ${formData.tipo === 'reposicion' ? 'Ingreso' : 'Egreso'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}