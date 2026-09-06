// src/pages/Productos.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { comprimirAWebP } from '../utils/imageCompressor';
import { 
  Package, PlusCircle, LayoutGrid, DollarSign, 
  AlertCircle, Edit, X, Check, Search, Filter, 
  UploadCloud, Eye, Barcode, Globe, Truck, Percent
} from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userId, setUserId] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Categoría inline
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Formulario de Alta
  const [formData, setFormData] = useState({
    sku: '',
    codigo_barras: '',
    nombre: '',
    categoria_id: '',
    subcategoria: '',
    marca: '',
    modelo: '',
    color: '',
    tamanio: '',
    proveedor: '',
    origen: 'Importado',
    descripcion: '',
    especificaciones: '',
    costo_origen: '',
    flete_int: '',
    impuestos_aduana: '',
    nacionalizacion: '',
    flete_local: '',
    precio_venta: '',
    precio_mayorista: '',
    stock_minimo: '5',
    stock_inicial: '0',
    fotos: []
  });

  // Modal de Edición / Ficha Completa
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

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
        .select(`*, categorias(nombre)`)
        .order('nombre', { ascending: true });
      if (prodError) throw prodError;
      setProductos(prodData || []);

      if (catData && catData.length > 0 && !formData.categoria_id) {
        setFormData(prev => ({ ...prev, categoria_id: catData[0].id }));
      }
    } catch (err) {
      console.error("Error al cargar datos:", err.message);
      setError("No se pudo sincronizar la información del catálogo.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── CÁLCULO DE COSTO PUESTO EN DEPÓSITO ──
  const calcularCostoTotal = (data) => {
    const cOrigen = parseFloat(data.costo_origen) || 0;
    const fleteInt = parseFloat(data.flete_int) || 0;
    const aduana = parseFloat(data.impuestos_aduana) || 0;
    const nac = parseFloat(data.nacionalizacion) || 0;
    const fleteLoc = parseFloat(data.flete_local) || 0;
    return cOrigen + fleteInt + aduana + nac + fleteLoc;
  };

  const costoFinalUnitario = calcularCostoTotal(formData);
  const margenMinorista = (parseFloat(formData.precio_venta) || 0) - costoFinalUnitario;
  const rentabilidadMinorista = costoFinalUnitario > 0 ? Math.round((margenMinorista / costoFinalUnitario) * 100) : 0;
  const margenMayorista = (parseFloat(formData.precio_mayorista) || 0) - costoFinalUnitario;
  const rentabilidadMayorista = costoFinalUnitario > 0 ? Math.round((margenMayorista / costoFinalUnitario) * 100) : 0;

  // ── SUBIDA DE FOTO OPTIMIZADA A WEBP ──
  const handleSubirFoto = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSubiendoFoto(true);
      const webpBlob = await comprimirAWebP(file, 1200, 0.82);
      const skuTarget = isEdit ? editFormData?.sku : formData.sku;
      const fileName = `${skuTarget || 'prd'}_${Date.now()}.webp`;
      const filePath = `catalogo/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      if (isEdit) {
        setEditFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), publicUrl] }));
      } else {
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, publicUrl] }));
      }

      showNotification("Imagen comprimida a WebP y subida con éxito.");
    } catch (err) {
      console.error("Error al procesar foto:", err.message);
      setError("Error al subir imagen: " + err.message);
    } finally {
      setSubiendoFoto(false);
    }
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
      setError("Error al crear categoría: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── GUARDAR PRODUCTO NUEVO ──
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
      const costoFinal = calcularCostoTotal(formData);

      const payload = {
        sku: formData.sku.trim(),
        codigo_barras: formData.codigo_barras.trim() || null,
        nombre: formData.nombre.trim(),
        categoria_id: parseInt(formData.categoria_id),
        subcategoria: formData.subcategoria.trim() || null,
        marca: formData.marca.trim() || null,
        modelo: formData.modelo.trim() || null,
        color: formData.color.trim() || null,
        tamanio: formData.tamanio.trim() || null,
        proveedor: formData.proveedor.trim() || null,
        origen: formData.origen.trim() || 'Importado',
        descripcion: formData.descripcion.trim() || null,
        especificaciones: formData.especificaciones.trim() || null,
        costo_origen: parseFloat(formData.costo_origen) || 0,
        gastos_importacion: {
          flete_int: parseFloat(formData.flete_int) || 0,
          impuestos_aduana: parseFloat(formData.impuestos_aduana) || 0,
          nacionalizacion: parseFloat(formData.nacionalizacion) || 0,
          flete_local: parseFloat(formData.flete_local) || 0
        },
        costo_unitario: costoFinal,
        precio_venta: parseFloat(formData.precio_venta),
        precio_mayorista: parseFloat(formData.precio_mayorista) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 0,
        stock_actual: stockInicialVal,
        fotos: formData.fotos,
        activo: true
      };

      const { data: newProduct, error: insertError } = await supabase
        .from('productos')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') throw new Error("El SKU o Código de barras ya existe en el sistema.");
        throw insertError;
      }

      if (stockInicialVal > 0 && userId) {
        await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: newProduct.id_producto,
            usuario_id: userId,
            tipo: 'reposicion',
            cantidad: stockInicialVal
          }]);
      }

      setFormData({
        sku: '',
        codigo_barras: '',
        nombre: '',
        categoria_id: categorias.length > 0 ? categorias[0].id : '',
        subcategoria: '',
        marca: '',
        modelo: '',
        color: '',
        tamanio: '',
        proveedor: '',
        origen: 'Importado',
        descripcion: '',
        especificaciones: '',
        costo_origen: '',
        flete_int: '',
        impuestos_aduana: '',
        nacionalizacion: '',
        flete_local: '',
        precio_venta: '',
        precio_mayorista: '',
        stock_minimo: '5',
        stock_inicial: '0',
        fotos: []
      });

      showNotification("Producto y costeo de importación registrados exitosamente.");
      fetchInitialData();
    } catch (err) {
      console.error("Error al registrar producto:", err.message);
      setError(err.message || "Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  // ── MODAL EDITAR / VER FICHA ──
  const openEditModal = (p) => {
    setEditingProduct(p);
    const g = p.gastos_importacion || {};
    setEditFormData({
      ...p,
      costo_origen: p.costo_origen || '',
      flete_int: g.flete_int || '',
      impuestos_aduana: g.impuestos_aduana || '',
      nacionalizacion: g.nacionalizacion || '',
      flete_local: g.flete_local || '',
      fotos: p.fotos || []
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const costoFinal = calcularCostoTotal(editFormData);
      const updatePayload = {
        nombre: editFormData.nombre,
        codigo_barras: editFormData.codigo_barras || null,
        subcategoria: editFormData.subcategoria || null,
        marca: editFormData.marca || null,
        modelo: editFormData.modelo || null,
        color: editFormData.color || null,
        tamanio: editFormData.tamanio || null,
        proveedor: editFormData.proveedor || null,
        origen: editFormData.origen || 'Importado',
        descripcion: editFormData.descripcion || null,
        especificaciones: editFormData.especificaciones || null,
        costo_origen: parseFloat(editFormData.costo_origen) || 0,
        gastos_importacion: {
          flete_int: parseFloat(editFormData.flete_int) || 0,
          impuestos_aduana: parseFloat(editFormData.impuestos_aduana) || 0,
          nacionalizacion: parseFloat(editFormData.nacionalizacion) || 0,
          flete_local: parseFloat(editFormData.flete_local) || 0
        },
        costo_unitario: costoFinal,
        precio_venta: parseFloat(editFormData.precio_venta),
        precio_mayorista: parseFloat(editFormData.precio_mayorista) || 0,
        stock_minimo: parseInt(editFormData.stock_minimo) || 0,
        activo: editFormData.activo,
        fotos: editFormData.fotos
      };

      const { error: updErr } = await supabase
        .from('productos')
        .update(updatePayload)
        .eq('id_producto', editingProduct.id_producto);

      if (updErr) throw updErr;

      setEditingProduct(null);
      showNotification("Ficha técnica y márgenes actualizados con éxito.");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la ficha: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtrado
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const texto = `${p.nombre} ${p.sku} ${p.codigo_barras || ''} ${p.marca || ''}`.toLowerCase();
      const matchTexto = texto.includes(busqueda.toLowerCase());
      const matchCat = categoriaFiltro === 'todas' || String(p.categoria_id) === String(categoriaFiltro);
      return matchTexto && matchCat;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const activos = productos.filter(p => p.activo).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Gestión de Catálogo y Costeo</h2>
          <p>Fichas técnicas maestras, costeo de importación (Land-in Cost) y cálculo de rentabilidad.</p>
        </div>
        <div className="header-badge">
          <Package size={14} />
          {productos.length} artículos registrados
        </div>
      </header>

      {showToast && (
        <div className="demo-toast">✓ {toastMessage}</div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Métricas Rápidas ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Package size={18} />
          </span>
          <div>
            <p className="stat-label">Artículos Activos</p>
            <p className="stat-value">{activos}</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-success-soft)', color: '#5EDBA2' }}>
            <DollarSign size={18} />
          </span>
          <div>
            <p className="stat-label">Costo Depósito Promedio</p>
            <p className="stat-value">
              {formatPrice(productos.length > 0 ? productos.reduce((a, b) => a + Number(b.costo_unitario || 0), 0) / productos.length : 0)}
            </p>
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

      {/* ── Formulario de Alta con Ficha Integral ── */}
      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <h3 className="form-title">
          <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Nueva Ficha de Producto
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Bloque 1: Identificación y Clasificación */}
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Identificación y Especificaciones
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1.2fr 2fr' }}>
            <div className="form-group">
              <label>Código SKU (Interno)</label>
              <input type="text" name="sku" placeholder="Ej: IMP-LMP-01" value={formData.sku} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Código de Barras</label>
              <input type="text" name="codigo_barras" placeholder="Ej: 7791234567890" value={formData.codigo_barras} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Nombre Comercial del Producto</label>
              <input type="text" name="nombre" placeholder="Ej: Lámpara LED Táctil Recargable" value={formData.nombre} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr' }}>
            <div className="form-group">
              <label>Categoría</label>
              {!isCreatingCategory ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} required style={{ flex: 1 }}>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsCreatingCategory(true)} style={{ padding: '0 8px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    + Nueva
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="text" placeholder="Nueva categoría..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus />
                  <button type="button" onClick={handleSaveCategory} style={{ background: 'var(--color-success-soft)', border: 'none', color: '#5EDBA2', padding: '0 8px', cursor: 'pointer', borderRadius: '4px' }}><Check size={15} /></button>
                  <button type="button" onClick={() => setIsCreatingCategory(false)} style={{ background: 'var(--color-error-soft)', border: 'none', color: '#F87171', padding: '0 8px', cursor: 'pointer', borderRadius: '4px' }}><X size={15} /></button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Subcategoría</label>
              <input type="text" name="subcategoria" placeholder="Ej: Escritorio" value={formData.subcategoria} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Marca</label>
              <input type="text" name="marca" placeholder="Ej: Lumina" value={formData.marca} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input type="text" name="modelo" placeholder="Ej: Pro-X" value={formData.modelo} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr' }}>
            <div className="form-group">
              <label>Color</label>
              <input type="text" name="color" placeholder="Ej: Negro Mate" value={formData.color} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Tamaño / Medidas</label>
              <input type="text" name="tamanio" placeholder="Ej: 35 x 12 cm" value={formData.tamanio} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Proveedor</label>
              <input type="text" name="proveedor" placeholder="Ej: ShenZhen Electronics Ltd." value={formData.proveedor} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Origen</label>
              <input type="text" name="origen" placeholder="Ej: China / Nacional" value={formData.origen} onChange={handleChange} />
            </div>
          </div>

          {/* Bloque 2: Costeo de Importación (Land-in Cost) */}
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={15} /> 2. Estructura de Costeo de Importación (Por Unidad)
            </div>

            <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="form-group">
                <label>Costo Origen (FOB)</label>
                <input type="number" step="0.01" min="0" name="costo_origen" placeholder="0.00" value={formData.costo_origen} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Flete Internacional</label>
                <input type="number" step="0.01" min="0" name="flete_int" placeholder="0.00" value={formData.flete_int} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Impuestos / Aduana</label>
                <input type="number" step="0.01" min="0" name="impuestos_aduana" placeholder="0.00" value={formData.impuestos_aduana} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Nacionalización</label>
                <input type="number" step="0.01" min="0" name="nacionalizacion" placeholder="0.00" value={formData.nacionalizacion} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Flete Interno Local</label>
                <input type="number" step="0.01" min="0" name="flete_local" placeholder="0.00" value={formData.flete_local} onChange={handleChange} />
              </div>
            </div>

            {/* Resumen del Costo Unitario en Depósito */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(201, 162, 39, 0.3)', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                Costo Real Final en Depósito (Unitario):
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-accent)' }}>
                {formatPrice(costoFinalUnitario)}
              </strong>
            </div>
          </div>

          {/* Bloque 3: Precios, Márgenes y Rentabilidad */}
          <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={15} /> 3. Precios de Venta y Rentabilidad
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr' }}>
            <div className="form-group">
              <label>Precio Venta (Minorista)</label>
              <input type="number" step="0.01" min="0" name="precio_venta" placeholder="0.00" value={formData.precio_venta} onChange={handleChange} required />
              {costoFinalUnitario > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenMinorista >= 0 ? '#5EDBA2' : '#F87171', marginTop: '3px', display: 'block' }}>
                  Ganancia: <strong>{formatPrice(margenMinorista)}</strong> ({rentabilidadMinorista}%)
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Precio Mayorista</label>
              <input type="number" step="0.01" min="0" name="precio_mayorista" placeholder="0.00" value={formData.precio_mayorista} onChange={handleChange} />
              {costoFinalUnitario > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenMayorista >= 0 ? '#6EA8FE' : '#F87171', marginTop: '3px', display: 'block' }}>
                  Ganancia: <strong>{formatPrice(margenMayorista)}</strong> ({rentabilidadMayorista}%)
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Stock Inicial</label>
              <input type="number" min="0" name="stock_inicial" value={formData.stock_inicial} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Stock Mínimo</label>
              <input type="number" min="0" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} required />
            </div>
          </div>

          {/* Bloque 4: Multimedia y Guardado */}
          <div className="form-row" style={{ gridTemplateColumns: '1.5fr 2fr', alignItems: 'center', marginTop: '1rem' }}>
            <div className="form-group">
              <label>Foto del Producto (Compresión WebP automática)</label>
              <input type="file" accept="image/*" disabled={subiendoFoto} onChange={(e) => handleSubirFoto(e, false)} />
              {subiendoFoto && <small style={{ color: 'var(--color-accent)' }}>Comprimiendo a WebP y subiendo a la nube...</small>}
              {formData.fotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {formData.fotos.map((url, i) => (
                    <img key={i} src={url} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: '100%' }}>
              <button className="btn-primary" type="submit" disabled={saving || subiendoFoto} style={{ width: '100%', padding: '12px' }}>
                {saving ? 'Registrando Ficha...' : <><PlusCircle size={16} /> Guardar Producto e Importación</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Catálogo Maestro con Buscador y Selector ── */}
      <div className="card table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className="table-title" style={{ margin: 0 }}>Catálogo Centralizado</h3>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar SKU, código o nombre..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 28px', color: 'var(--color-text-heading)', fontSize: '0.8rem', width: '220px' }} 
              />
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
              <select 
                value={categoriaFiltro} 
                onChange={(e) => setCategoriaFiltro(e.target.value)} 
                style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px 6px 28px', color: 'var(--color-text-heading)', fontSize: '0.8rem' }}
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sincronizando inventario y costos...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>SKU / Barras</th>
                  <th>Artículo</th>
                  <th>Costo Real</th>
                  <th>Minorista (Rent.)</th>
                  <th>Mayorista (Rent.)</th>
                  <th>Físico</th>
                  <th>Estado</th>
                  <th>Ficha</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => {
                  const costoU = Number(p.costo_unitario || 0);
                  const pMin = Number(p.precio_venta || 0);
                  const pMay = Number(p.precio_mayorista || 0);
                  const rentMin = costoU > 0 ? Math.round(((pMin - costoU) / costoU) * 100) : 0;
                  const rentMay = costoU > 0 ? Math.round(((pMay - costoU) / costoU) * 100) : 0;

                  return (
                    <tr key={p.id_producto}>
                      <td style={{ width: '45px', textAlign: 'center' }}>
                        {p.fotos && p.fotos.length > 0 ? (
                          <img src={p.fotos[0]} alt={p.nombre} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', background: 'var(--color-bg-main)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
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
                      <td className="td-muted" style={{ fontWeight: 600 }}>{formatPrice(costoU)}</td>
                      <td>
                        <span className="td-precio">{formatPrice(pMin)}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: rentMin >= 0 ? '#5EDBA2' : '#F87171' }}>+{rentMin}%</span>
                      </td>
                      <td>
                        <span className="td-muted">{pMay > 0 ? formatPrice(pMay) : '—'}</span>
                        {pMay > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: rentMay >= 0 ? '#6EA8FE' : '#F87171' }}>+{rentMay}%</span>}
                      </td>
                      <td style={{ fontWeight: '700', color: p.stock_actual <= p.stock_minimo ? '#FBBF24' : 'var(--color-text-heading)' }}>
                        {p.stock_actual} u.
                      </td>
                      <td>
                        <span className={`estado-badge ${p.activo ? 'activo' : 'inactivo'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                      </td>
                      <td>
                        <button 
                          onClick={() => openEditModal(p)} 
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
      </div>

      {/* ── Modal Ficha Técnica y Edición Completa ── */}
      {editingProduct && editFormData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 8, 15, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Ficha Técnica del Artículo</h3>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{editFormData.sku} — {editFormData.nombre}</span>
              </div>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="form-group">
                  <label>Nombre del Producto</label>
                  <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Código de Barras</label>
                  <input type="text" name="codigo_barras" value={editFormData.codigo_barras || ''} onChange={handleEditChange} />
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Marca</label>
                  <input type="text" name="marca" value={editFormData.marca || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input type="text" name="modelo" value={editFormData.modelo || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" name="color" value={editFormData.color || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Tamaño</label>
                  <input type="text" name="tamanio" value={editFormData.tamanio || ''} onChange={handleEditChange} />
                </div>
              </div>

              {/* Costeo de Importación en Modal */}
              <div style={{ padding: '1rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', margin: '1rem 0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Desglose de Costo Unitario
                </div>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  <div className="form-group">
                    <label>Costo Origen</label>
                    <input type="number" step="0.01" name="costo_origen" value={editFormData.costo_origen} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Flete Int.</label>
                    <input type="number" step="0.01" name="flete_int" value={editFormData.flete_int} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Aduana</label>
                    <input type="number" step="0.01" name="impuestos_aduana" value={editFormData.impuestos_aduana} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Nacionaliz.</label>
                    <input type="number" step="0.01" name="nacionalizacion" value={editFormData.nacionalizacion} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Flete Local</label>
                    <input type="number" step="0.01" name="flete_local" value={editFormData.flete_local} onChange={handleEditChange} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-heading)', marginTop: '4px' }}>
                  Costo Final en Depósito: <strong>{formatPrice(calcularCostoTotal(editFormData))}</strong>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr' }}>
                <div className="form-group">
                  <label>Precio Venta Minorista</label>
                  <input type="number" step="0.01" name="precio_venta" value={editFormData.precio_venta} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Precio Mayorista</label>
                  <input type="number" step="0.01" name="precio_mayorista" value={editFormData.precio_mayorista} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input type="number" name="stock_minimo" value={editFormData.stock_minimo} onChange={handleEditChange} required />
                </div>
              </div>

              {/* Subir foto adicional */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Agregar / Reemplazar Imagen (WebP)</label>
                <input type="file" accept="image/*" disabled={subiendoFoto} onChange={(e) => handleSubirFoto(e, true)} />
                {editFormData.fotos && editFormData.fotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {editFormData.fotos.map((url, i) => (
                      <img key={i} src={url} alt="Foto" style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: '9px 18px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving || subiendoFoto}>
                  {saving ? 'Guardando...' : 'Confirmar Cambios en Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}