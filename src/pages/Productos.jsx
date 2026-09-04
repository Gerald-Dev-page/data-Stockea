// src/pages/Productos.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Package, PlusCircle, LayoutGrid, DollarSign, 
  AlertCircle, Edit, X, Check, Search, Filter 
} from 'lucide-react';

const formatPrice = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userId, setUserId] = useState(null);

  // Filtros de tabla
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Creación de categoría inline
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Edición modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    precio_venta: '',
    precio_mayorista: '',
    costo_unitario: '',
    stock_minimo: ''
  });

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    categoria_id: '',
    precio_venta: '',
    precio_mayorista: '',
    costo_unitario: '',
    stock_minimo: '',
    stock_inicial: '0'
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: catData, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (catError) throw catError;
      setCategorias(catData || []);

      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select(`
          *,
          categorias ( nombre )
        `)
        .order('nombre', { ascending: true });

      if (prodError) throw prodError;
      setProductos(prodData || []);

      if (catData && catData.length > 0 && !formData.categoria_id) {
        setFormData(prev => ({ ...prev, categoria_id: catData[0].id }));
      }

    } catch (err) {
      console.error("Error al cargar datos:", err.message);
      setError("No se pudo establecer conexión con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ nombre: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;
      
      setCategorias(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, categoria_id: data.id }));
      setIsCreatingCategory(false);
      setNewCategoryName('');
      showNotification("Categoría creada exitosamente.");
    } catch (err) {
      console.error(err);
      setError("Error al crear categoría. Es posible que el nombre ya exista.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.categoria_id) {
      setError("Debe seleccionar una categoría.");
      setSaving(false);
      return;
    }

    try {
      const stockInicialVal = parseInt(formData.stock_inicial) || 0;

      const { data: newProduct, error } = await supabase
        .from('productos')
        .insert([{
          sku: formData.sku.trim(),
          nombre: formData.nombre.trim(),
          categoria_id: parseInt(formData.categoria_id),
          precio_venta: parseFloat(formData.precio_venta),
          precio_mayorista: parseFloat(formData.precio_mayorista) || 0,
          costo_unitario: parseFloat(formData.costo_unitario) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 0,
          stock_actual: stockInicialVal,
          activo: true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error("El SKU ingresado ya existe en el sistema.");
        throw error;
      }

      if (stockInicialVal > 0 && userId) {
        const { error: movError } = await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: newProduct.id_producto,
            usuario_id: userId,
            tipo: 'reposicion',
            cantidad: stockInicialVal
          }]);
        
        if (movError) console.error("Error al registrar movimiento inicial:", movError);
      }

      setFormData({
        sku: '',
        nombre: '',
        categoria_id: categorias.length > 0 ? categorias[0].id : '',
        precio_venta: '',
        precio_mayorista: '',
        costo_unitario: '',
        stock_minimo: '',
        stock_inicial: '0'
      });
      
      showNotification("Producto registrado exitosamente.");
      fetchInitialData();
    } catch (err) {
      console.error("Error al registrar producto:", err.message);
      setError(err.message || "Ocurrió un error al intentar guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (producto) => {
    setEditingProduct(producto);
    setEditFormData({
      precio_venta: producto.precio_venta,
      precio_mayorista: producto.precio_mayorista,
      costo_unitario: producto.costo_unitario,
      stock_minimo: producto.stock_minimo
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('productos')
        .update({
          precio_venta: parseFloat(editFormData.precio_venta),
          precio_mayorista: parseFloat(editFormData.precio_mayorista) || 0,
          costo_unitario: parseFloat(editFormData.costo_unitario) || 0,
          stock_minimo: parseInt(editFormData.stock_minimo) || 0
        })
        .eq('id_producto', editingProduct.id_producto);

      if (error) throw error;

      setEditingProduct(null);
      showNotification("Precios actualizados exitosamente.");
      fetchInitialData();
    } catch (err) {
      console.error("Error al editar producto:", err.message);
      setError("Error al guardar los cambios del producto.");
    } finally {
      setSaving(false);
    }
  };

  // Filtrado de productos para la tabla
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                         p.sku.toLowerCase().includes(busqueda.toLowerCase());
      const matchCat = categoriaFiltro === 'todas' || String(p.categoria_id) === String(categoriaFiltro);
      return matchTexto && matchCat;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const activos = productos.filter(p => p.activo).length;
  const promedio = productos.length > 0 
    ? Math.round(productos.reduce((a, p) => a + Number(p.precio_venta), 0) / productos.length) 
    : 0;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Gestión de Catálogo</h2>
          <p>Control de productos, listas de precios diferenciadas y alertas de reposición.</p>
        </div>
        <div className="header-badge">
          <Package size={14} />
          {productos.length} artículos totales
        </div>
      </header>

      {showToast && (
        <div className="demo-toast">
          ✓ {toastMessage}
        </div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Package size={18} />
          </span>
          <div>
            <p className="stat-label">Total Activos</p>
            <p className="stat-value">{activos}</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-success-soft)', color: '#5EDBA2' }}>
            <DollarSign size={18} />
          </span>
          <div>
            <p className="stat-label">Precio Promedio</p>
            <p className="stat-value">{formatPrice(promedio)}</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
            <LayoutGrid size={18} />
          </span>
          <div>
            <p className="stat-label">Categorías</p>
            <p className="stat-value">{categorias.length}</p>
          </div>
        </div>
      </div>

      {/* ── Formulario de Alta ── */}
      <div className="form-card">
        <h3 className="form-title">
          <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Registrar Nuevo Producto
        </h3>
        
        {categorias.length === 0 && !loading && (
          <div style={{ padding: '0.85rem 1rem', background: 'var(--color-warning-soft)', border: '1px solid rgba(201, 138, 39, 0.3)', color: '#FBBF24', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
            Debe registrar al menos una categoría para vincular el producto.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>SKU (Código Interno)</label>
              <input 
                type="text" 
                name="sku" 
                placeholder="Ej: PRD-001" 
                value={formData.sku} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input 
                type="text" 
                name="nombre" 
                placeholder="Ej: Bidón 20L" 
                value={formData.nombre} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Categoría</label>
              {!isCreatingCategory ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    name="categoria_id" 
                    value={formData.categoria_id} 
                    onChange={handleChange} 
                    required 
                    disabled={categorias.length === 0} 
                    style={{ flex: 1 }}
                  >
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingCategory(true)} 
                    style={{ padding: '0 0.85rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                  >
                    + Nueva
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre categoría..." 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)} 
                    style={{ flex: 1 }} 
                    autoFocus 
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveCategory} 
                    style={{ background: 'var(--color-success-soft)', border: '1px solid rgba(46, 125, 91, 0.4)', color: '#5EDBA2', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem', cursor: 'pointer' }}
                  >
                    <Check size={16}/>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingCategory(false)} 
                    style={{ background: 'var(--color-error-soft)', border: '1px solid rgba(179, 64, 42, 0.4)', color: '#F87171', borderRadius: 'var(--radius-sm)', padding: '0 0.75rem', cursor: 'pointer' }}
                  >
                    <X size={16}/>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>Precio Venta (Minorista)</label>
              <input 
                type="number" 
                name="precio_venta" 
                step="0.01" 
                min="0" 
                placeholder="0.00"
                value={formData.precio_venta} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Precio Mayorista</label>
              <input 
                type="number" 
                name="precio_mayorista" 
                step="0.01" 
                min="0" 
                placeholder="0.00"
                value={formData.precio_mayorista} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label>Costo Unitario</label>
              <input 
                type="number" 
                name="costo_unitario" 
                step="0.01" 
                min="0" 
                placeholder="0.00"
                value={formData.costo_unitario} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1.2fr' }}>
            <div className="form-group">
              <label>Stock Inicial</label>
              <input 
                type="number" 
                name="stock_inicial" 
                min="0" 
                value={formData.stock_inicial} 
                onChange={handleChange} 
                required 
              />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                Se auditará con su usuario.
              </span>
            </div>
            <div className="form-group">
              <label>Alerta de Stock Mínimo</label>
              <input 
                type="number" 
                name="stock_minimo" 
                min="0" 
                value={formData.stock_minimo} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn-primary" 
                type="submit" 
                disabled={saving || categorias.length === 0} 
                style={{ width: '100%', padding: '10px' }}
              >
                {saving ? 'Registrando...' : <><PlusCircle size={16} /> Guardar Producto</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Tabla Maestro con Filtros ── */}
      <div className="card table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className="table-title" style={{ margin: 0 }}>Catálogo de Productos</h3>
          
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {/* Buscador Rápido */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar SKU o nombre..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 28px', color: 'var(--color-text-heading)', fontSize: '0.8rem', outline: 'none', width: '180px' }}
              />
            </div>

            {/* Selector de Categoría */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <select 
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 28px', color: 'var(--color-text-heading)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
             <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
               Sincronizando catálogo con la base de datos...
             </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Minorista</th>
                  <th>Mayorista</th>
                  <th>Stock Físico</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.id_producto}>
                    <td><span className="id-badge">{p.sku}</span></td>
                    <td className="td-nombre">{p.nombre}</td>
                    <td>
                      <span className="id-badge" style={{ color: 'var(--color-accent)', borderColor: 'rgba(201, 162, 39, 0.25)' }}>
                        {p.categorias?.nombre || '—'}
                      </span>
                    </td>
                    <td className="td-precio">{formatPrice(p.precio_venta)}</td>
                    <td className="td-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {p.precio_mayorista > 0 ? formatPrice(p.precio_mayorista) : '—'}
                    </td>
                    <td style={{ fontWeight: '600', color: p.stock_actual <= p.stock_minimo ? '#FBBF24' : 'var(--color-text-heading)' }}>
                      {p.stock_actual}
                    </td>
                    <td>
                      <span className={`estado-badge ${p.activo ? 'activo' : 'inactivo'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => openEditModal(p)} 
                        style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '0.75rem', transition: 'var(--transition)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                      >
                        <Edit size={13} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {productosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No se encontraron productos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal de Edición Estilizado al Tema ── */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 8, 15, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem', border: '1px solid rgba(201, 162, 39, 0.3)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Modificar Precios</h3>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{editingProduct.nombre} ({editingProduct.sku})</span>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio Venta (Minorista)</label>
                  <input 
                    type="number" 
                    name="precio_venta" 
                    step="0.01" 
                    min="0" 
                    value={editFormData.precio_venta} 
                    onChange={handleEditChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Precio Mayorista</label>
                  <input 
                    type="number" 
                    name="precio_mayorista" 
                    step="0.01" 
                    min="0" 
                    value={editFormData.precio_mayorista} 
                    onChange={handleEditChange} 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Costo Unitario</label>
                  <input 
                    type="number" 
                    name="costo_unitario" 
                    step="0.01" 
                    min="0" 
                    value={editFormData.costo_unitario} 
                    onChange={handleEditChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Alerta Stock Mínimo</label>
                  <input 
                    type="number" 
                    name="stock_minimo" 
                    min="0" 
                    value={editFormData.stock_minimo} 
                    onChange={handleEditChange} 
                    required 
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  style={{ padding: '9px 18px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 0 }}>
                  {saving ? 'Guardando...' : 'Confirmar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}