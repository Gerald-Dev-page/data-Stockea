// src/pages/Productos.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { comprimirAWebP } from '../utils/imageCompressor';
import { 
  Package, PlusCircle, LayoutGrid, DollarSign, 
  AlertCircle, Edit, X, Check, Search, Filter, 
  Eye, Truck, Percent, Wand2, Maximize2,
  ChevronLeft, ChevronRight, Settings, Trash2
} from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const ITEMS_PER_PAGE = 10;

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

  // Cotización Dólar
  const [cotizacionDolar, setCotizacionDolar] = useState(1506);
  const [guardandoDolar, setGuardandoDolar] = useState(false);
  const [dolarGuardadoOk, setDolarGuardadoOk] = useState(false);

  // Visor de Foto Ampliada (Lightbox)
  const [fotoZoom, setFotoZoom] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Paginado
  const [paginaActual, setPaginaActual] = useState(1);

  // Categorías: Creación y Edición Modal
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Formulario de Alta con 3 Mayoristas
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
    costo_origen: '',      // en USD
    flete_int: '',         // en USD
    impuestos_aduana: '',  // en USD
    nacionalizacion: '',   // en USD
    flete_local: '',       // en USD
    precio_venta: '',        // Minorista ARS
    precio_mayorista_1: '',  // Mayorista 1 ARS
    precio_mayorista_2: '',  // Mayorista 2 ARS
    precio_mayorista_3: '',  // Mayorista 3 ARS
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
    fetchCotizacion();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoriaFiltro]);

  const fetchCotizacion = async () => {
    try {
      const { data, error: errCot } = await supabase
        .from('configuracion')
        .select('cotizacion_dolar')
        .eq('id', 1)
        .single();

      if (errCot && errCot.code !== 'PGRST116') throw errCot;
      if (data?.cotizacion_dolar) {
        setCotizacionDolar(Number(data.cotizacion_dolar));
      }
    } catch (err) {
      console.error("No se pudo cargar la cotización:", err.message);
    }
  };

  const handleGuardarDolar = async () => {
    const valor = Number(cotizacionDolar);
    if (!valor || valor <= 0) return;

    try {
      setGuardandoDolar(true);
      const { error: errUpsert } = await supabase
        .from('configuracion')
        .upsert({ 
          id: 1, 
          cotizacion_dolar: valor, 
          actualizado_en: new Date().toISOString() 
        });

      if (errUpsert) throw errUpsert;

      setDolarGuardadoOk(true);
      showNotification(`Cotización guardada: $${valor.toLocaleString('es-AR')} ARS`);
      setTimeout(() => setDolarGuardadoOk(false), 2500);
    } catch (err) {
      console.error("Error al guardar cotización:", err.message);
      setError("No se pudo actualizar el tipo de cambio.");
    } finally {
      setGuardandoDolar(false);
    }
  };

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

  // Generador de SKU
  const generarSkuAleatorio = (isEdit = false) => {
    const catId = isEdit ? editFormData?.categoria_id : formData.categoria_id;
    const cat = categorias.find(c => String(c.id) === String(catId));
    const prefix = cat ? cat.nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const skuGenerado = `${prefix}-${randomCode}`;

    if (isEdit) {
      setEditFormData(prev => ({ ...prev, sku: skuGenerado }));
    } else {
      setFormData(prev => ({ ...prev, sku: skuGenerado }));
    }
  };

  // Cálculo de Costos
  const calcularCostoUSD = (data) => {
    const cOrigen = parseFloat(data.costo_origen) || 0;
    const fleteInt = parseFloat(data.flete_int) || 0;
    const aduana = parseFloat(data.impuestos_aduana) || 0;
    const nac = parseFloat(data.nacionalizacion) || 0;
    const fleteLoc = parseFloat(data.flete_local) || 0;
    return cOrigen + fleteInt + aduana + nac + fleteLoc;
  };

  const costoTotalUSD = calcularCostoUSD(formData);
  const costoTotalARS = Math.round(costoTotalUSD * (Number(cotizacionDolar) || 1));

  // Márgenes formulario de alta
  const margenMinorista = (parseFloat(formData.precio_venta) || 0) - costoTotalARS;
  const rentMinorista = costoTotalARS > 0 ? Math.round((margenMinorista / costoTotalARS) * 100) : 0;
  
  const margenM1 = (parseFloat(formData.precio_mayorista_1) || 0) - costoTotalARS;
  const rentM1 = costoTotalARS > 0 ? Math.round((margenM1 / costoTotalARS) * 100) : 0;

  const margenM2 = (parseFloat(formData.precio_mayorista_2) || 0) - costoTotalARS;
  const rentM2 = costoTotalARS > 0 ? Math.round((margenM2 / costoTotalARS) * 100) : 0;

  const margenM3 = (parseFloat(formData.precio_mayorista_3) || 0) - costoTotalARS;
  const rentM3 = costoTotalARS > 0 ? Math.round((margenM3 / costoTotalARS) * 100) : 0;

  // Subida de imagen
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

      showNotification("Imagen WebP subida exitosamente.");
    } catch (err) {
      console.error("Error al procesar foto:", err.message);
      setError("Error al subir imagen: " + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Creación rápida de categoría
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

  // Modificación de Categoría existente
  const handleUpdateCategory = async (id) => {
    if (!editCategoryName.trim()) return;
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ nombre: editCategoryName.trim() })
        .eq('id', id);
      if (error) throw error;

      setCategorias(prev => prev.map(c => c.id === id ? { ...c, nombre: editCategoryName.trim() } : c));
      setEditingCategory(null);
      setEditCategoryName('');
      showNotification("Categoría modificada correctamente.");
      fetchInitialData();
    } catch (err) {
      setError("Error al modificar categoría: " + err.message);
    }
  };

  // Eliminación de Categoría
  const handleDeleteCategory = async (id) => {
    const tieneProductos = productos.some(p => p.categoria_id === id);
    if (tieneProductos) {
      setError("No se puede eliminar la categoría porque contiene productos asignados.");
      return;
    }

    if (!confirm("¿Está seguro de eliminar esta categoría?")) return;

    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;

      setCategorias(prev => prev.filter(c => c.id !== id));
      showNotification("Categoría eliminada.");
      fetchInitialData();
    } catch (err) {
      setError("Error al eliminar categoría: " + err.message);
    }
  };

  // Alta de Producto
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
      const costoFinalUSD = calcularCostoUSD(formData);

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
        costo_unitario: costoFinalUSD > 0 ? costoFinalUSD : (parseFloat(formData.costo_origen) || 0),
        precio_venta: parseFloat(formData.precio_venta),
        precio_mayorista: parseFloat(formData.precio_mayorista_1) || 0,
        precio_mayorista_1: parseFloat(formData.precio_mayorista_1) || 0,
        precio_mayorista_2: parseFloat(formData.precio_mayorista_2) || 0,
        precio_mayorista_3: parseFloat(formData.precio_mayorista_3) || 0,
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
        if (insertError.code === '23505') throw new Error("El SKU o Código de barras ya existe en el catálogo.");
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
        precio_mayorista_1: '',
        precio_mayorista_2: '',
        precio_mayorista_3: '',
        stock_minimo: '5',
        stock_inicial: '0',
        fotos: []
      });

      showNotification("Producto guardado con 3 precios mayoristas.");
      fetchInitialData();
    } catch (err) {
      console.error("Error al registrar producto:", err.message);
      setError(err.message || "Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  // Edición / Ficha
  const openEditModal = (p) => {
    setEditingProduct(p);
    const g = p.gastos_importacion || {};
    setEditFormData({
      ...p,
      costo_origen: p.costo_origen || p.costo_unitario || '',
      flete_int: g.flete_int || '',
      impuestos_aduana: g.impuestos_aduana || '',
      nacionalizacion: g.nacionalizacion || '',
      flete_local: g.flete_local || '',
      precio_mayorista_1: p.precio_mayorista_1 || p.precio_mayorista || '',
      precio_mayorista_2: p.precio_mayorista_2 || '',
      precio_mayorista_3: p.precio_mayorista_3 || '',
      fotos: p.fotos || []
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const costoFinalUSD = calcularCostoUSD(editFormData);

      const updatePayload = {
        sku: editFormData.sku,
        nombre: editFormData.nombre,
        categoria_id: parseInt(editFormData.categoria_id),
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
        costo_unitario: costoFinalUSD > 0 ? costoFinalUSD : (parseFloat(editFormData.costo_origen) || 0),
        precio_venta: parseFloat(editFormData.precio_venta),
        precio_mayorista: parseFloat(editFormData.precio_mayorista_1) || 0,
        precio_mayorista_1: parseFloat(editFormData.precio_mayorista_1) || 0,
        precio_mayorista_2: parseFloat(editFormData.precio_mayorista_2) || 0,
        precio_mayorista_3: parseFloat(editFormData.precio_mayorista_3) || 0,
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
      showNotification("Ficha técnica actualizada con éxito.");
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar ficha: " + err.message);
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

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) || 1;

  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [productosFiltrados, paginaActual]);

  const activos = productos.filter(p => p.activo).length;

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <h2>Gestión de Catálogo y Costeo</h2>
          <p>Fichas técnicas maestras, costeo multimoneda y escalas mayoristas.</p>
        </div>

        {/* ── Widget Cotización Dólar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-card)', border: '1px solid rgba(201, 162, 39, 0.35)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            USD Hoy:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>$</span>
            <input 
              type="number" 
              value={cotizacionDolar} 
              onChange={(e) => setCotizacionDolar(e.target.value)}
              style={{ 
                width: '80px', 
                height: '34px', 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                textAlign: 'right', 
                padding: '2px 6px', 
                background: 'var(--color-bg-main)', 
                border: '1px solid var(--color-border)', 
                borderRadius: '4px', 
                color: 'var(--color-text-heading)', 
                outline: 'none'
              }} 
            />
            <button
              type="button"
              onClick={handleGuardarDolar}
              disabled={guardandoDolar}
              style={{
                height: '34px',
                padding: '0 10px',
                background: dolarGuardadoOk ? 'var(--color-success-soft)' : 'var(--color-accent-soft)',
                border: `1px solid ${dolarGuardadoOk ? 'rgba(94, 219, 162, 0.4)' : 'rgba(201, 162, 39, 0.4)'}`,
                color: dolarGuardadoOk ? '#5EDBA2' : 'var(--color-accent)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={14} /> {guardandoDolar ? '...' : dolarGuardadoOk ? 'Listo!' : 'Guardar'}
            </button>
          </div>
        </div>
      </header>

      {showToast && <div className="demo-toast">✓ {toastMessage}</div>}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Stat Cards ── */}
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
              {formatPrice(
                productos.length > 0
                  ? productos.reduce((acc, p) => {
                      const gastos = p.gastos_importacion || {};
                      const cOrigen = Number(p.costo_origen) || 0;
                      const cUSD = cOrigen > 0
                        ? cOrigen + (Number(gastos.flete_int) || 0) + (Number(gastos.impuestos_aduana) || 0) + (Number(gastos.nacionalizacion) || 0) + (Number(gastos.flete_local) || 0)
                        : Number(p.costo_unitario) || 0;
                      return acc + (cUSD * (Number(cotizacionDolar) || 1));
                    }, 0) / productos.length
                  : 0
              )}
            </p>
          </div>
        </div>

        <div className="stat-card" style={{ position: 'relative' }}>
          <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
            <LayoutGrid size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="stat-label">Categorías</p>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', padding: 0 }}
                title="Modificar o administrar categorías"
              >
                <Settings size={13} /> Gestionar
              </button>
            </div>
            <p className="stat-value">{categorias.length}</p>
          </div>
        </div>
      </div>

      {/* ── Formulario de Alta ── */}
      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <h3 className="form-title">
          <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Nueva Ficha de Producto
        </h3>

        <form onSubmit={handleSubmit} className="productos-form">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1. Identificación y Clasificación
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1.4fr 1.2fr 2fr' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Código SKU</label>
                <button 
                  type="button" 
                  onClick={() => generarSkuAleatorio(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, padding: 0 }}
                  title="Generar SKU automático"
                >
                  <Wand2 size={12} /> Autogenerar
                </button>
              </div>
              <input type="text" name="sku" placeholder="Ej: PRD-A8F2" value={formData.sku} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Código de Barras</label>
              <input type="text" name="codigo_barras" placeholder="Ej: 7791234567890" value={formData.codigo_barras} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Nombre Comercial</label>
              <input type="text" name="nombre" placeholder="Ej: Amplificador de Pantalla" value={formData.nombre} onChange={handleChange} required />
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
              <input type="text" name="subcategoria" placeholder="Ej: Celulares" value={formData.subcategoria} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Marca</label>
              <input type="text" name="marca" placeholder="Ej: GadgetPro" value={formData.marca} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Modelo</label>
              <input type="text" name="modelo" placeholder="Ej: F2-Screen" value={formData.modelo} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr' }}>
            <div className="form-group">
              <label>Color</label>
              <input type="text" name="color" placeholder="Ej: Negro" value={formData.color} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Tamaño / Medidas</label>
              <input type="text" name="tamanio" placeholder="Ej: 12 pulgadas" value={formData.tamanio} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Proveedor</label>
              <input type="text" name="proveedor" placeholder="Ej: Guangzhou Trading" value={formData.proveedor} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Origen</label>
              <input type="text" name="origen" placeholder="Ej: Importado" value={formData.origen} onChange={handleChange} />
            </div>
          </div>

          {/* Bloque 2: Costeo en Dólares */}
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={15} /> 2. Costeo en Dólares (USD por unidad)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Conversión: <strong>${Number(cotizacionDolar || 0).toLocaleString('es-AR')} ARS</strong>
              </span>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="form-group">
                <label>Costo Origen (USD)</label>
                <input type="number" step="0.01" min="0" name="costo_origen" placeholder="Ej: 2.00" value={formData.costo_origen} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Flete Int. (USD)</label>
                <input type="number" step="0.01" min="0" name="flete_int" placeholder="0.00" value={formData.flete_int} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Aduana (USD)</label>
                <input type="number" step="0.01" min="0" name="impuestos_aduana" placeholder="0.00" value={formData.impuestos_aduana} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Nacionaliz. (USD)</label>
                <input type="number" step="0.01" min="0" name="nacionalizacion" placeholder="0.00" value={formData.nacionalizacion} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Flete Local (USD)</label>
                <input type="number" step="0.01" min="0" name="flete_local" placeholder="0.00" value={formData.flete_local} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(201, 162, 39, 0.3)', marginTop: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-heading)' }}>
                Subtotal Costo: <strong>USD ${costoTotalUSD.toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                Costo Real en Depósito (ARS): <strong style={{ fontSize: '1.25rem' }}>{formatPrice(costoTotalARS)}</strong>
              </div>
            </div>
          </div>

          {/* Bloque 3: Precios en PESOS (Minorista + 3 Mayoristas) */}
          <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Percent size={15} /> 3. Precios de Venta (ARS) y Rentabilidad Real
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="form-group">
              <label>P. Minorista (ARS)</label>
              <input type="number" step="0.01" min="0" name="precio_venta" placeholder="Ej: 10000" value={formData.precio_venta} onChange={handleChange} required />
              {costoTotalARS > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenMinorista >= 0 ? '#5EDBA2' : '#F87171', marginTop: '3px', display: 'block' }}>
                  {formatPrice(margenMinorista)} ({rentMinorista}%)
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Mayorista 1 (Base)</label>
              <input type="number" step="0.01" min="0" name="precio_mayorista_1" placeholder="Ej: 8000" value={formData.precio_mayorista_1} onChange={handleChange} />
              {costoTotalARS > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenM1 >= 0 ? '#6EA8FE' : '#F87171', marginTop: '3px', display: 'block' }}>
                  {formatPrice(margenM1)} ({rentM1}%)
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Mayorista 2 (Volumen)</label>
              <input type="number" step="0.01" min="0" name="precio_mayorista_2" placeholder="Ej: 7500" value={formData.precio_mayorista_2} onChange={handleChange} />
              {costoTotalARS > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenM2 >= 0 ? '#6EA8FE' : '#F87171', marginTop: '3px', display: 'block' }}>
                  {formatPrice(margenM2)} ({rentM2}%)
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Mayorista 3 (Distrib.)</label>
              <input type="number" step="0.01" min="0" name="precio_mayorista_3" placeholder="Ej: 7000" value={formData.precio_mayorista_3} onChange={handleChange} />
              {costoTotalARS > 0 && (
                <span style={{ fontSize: '0.72rem', color: margenM3 >= 0 ? '#6EA8FE' : '#F87171', marginTop: '3px', display: 'block' }}>
                  {formatPrice(margenM3)} ({rentM3}%)
                </span>
              )}
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.5rem' }}>
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
              <label>Foto del Producto (Compresión WebP)</label>
              <input type="file" accept="image/*" disabled={subiendoFoto} onChange={(e) => handleSubirFoto(e, false)} />
              {subiendoFoto && <small style={{ color: 'var(--color-accent)' }}>Comprimiendo a WebP y subiendo...</small>}
              {formData.fotos.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {formData.fotos.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      alt="Preview" 
                      onClick={() => setFotoZoom(url)}
                      style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-border)', cursor: 'pointer' }} 
                      title="Tocar para ampliar"
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: '100%' }}>
              <button className="btn-primary" type="submit" disabled={saving || subiendoFoto} style={{ width: '100%', padding: '12px' }}>
                {saving ? 'Registrando...' : <><PlusCircle size={16} /> Guardar Ficha e Importación</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Catálogo Maestro ── */}
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
                {productosPaginados.map((p) => {
                  const gastos = p.gastos_importacion || {};
                  const costoOrigen = Number(p.costo_origen) || 0;
                  
                  const costoUSD = costoOrigen > 0
                    ? costoOrigen + (Number(gastos.flete_int) || 0) + (Number(gastos.impuestos_aduana) || 0) + (Number(gastos.nacionalizacion) || 0) + (Number(gastos.flete_local) || 0)
                    : Number(p.costo_unitario) || 0;

                  const costoARS = Math.round(costoUSD * (Number(cotizacionDolar) || 1));

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
                            onClick={() => setFotoZoom(p.fotos[0])}
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
                        {p.nombre}
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.marca} {p.modelo}</span>
                      </td>

                      <td className="td-muted" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        <div>USD ${costoUSD.toFixed(2)}</div>
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

                      {/* Mayoristas (M1 / M2 / M3) con Rentabilidad al lado */}
<td style={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>
  {/* Nivel 1 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
    <strong style={{ minWidth: '22px' }}>M1:</strong>
    <span>{pM1 > 0 ? formatPrice(pM1) : '—'}</span>
    {pM1 > 0 && costoARS > 0 && (
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        color: ((pM1 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' 
      }}>
        +{Math.round(((pM1 - costoARS) / costoARS) * 100)}%
      </span>
    )}
  </div>

  {/* Nivel 2 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
    <strong style={{ minWidth: '22px' }}>M2:</strong>
    <span>{pM2 > 0 ? formatPrice(pM2) : '—'}</span>
    {pM2 > 0 && costoARS > 0 && (
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        color: ((pM2 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' 
      }}>
        +{Math.round(((pM2 - costoARS) / costoARS) * 100)}%
      </span>
    )}
  </div>

  {/* Nivel 3 */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <strong style={{ minWidth: '22px' }}>M3:</strong>
    <span>{pM3 > 0 ? formatPrice(pM3) : '—'}</span>
    {pM3 > 0 && costoARS > 0 && (
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        color: ((pM3 - costoARS) / costoARS) >= 0 ? '#6EA8FE' : '#F87171' 
      }}>
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

        {/* ── Control de Paginado ── */}
        {!loading && productosFiltrados.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, productosFiltrados.length)}</strong> de <strong>{productosFiltrados.length}</strong> artículos
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

      {/* ── Modal de Gestión y Modificación de Categorías ── */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 8, 15, 0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h3 className="form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={16} style={{ color: 'var(--color-accent)' }} /> Administrar Categorías
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categorias.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                  {editingCategory === cat.id ? (
                    <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                      <input 
                        type="text" 
                        value={editCategoryName} 
                        onChange={(e) => setEditCategoryName(e.target.value)} 
                        autoFocus
                        style={{ flex: 1, height: '32px', fontSize: '0.85rem' }} 
                      />
                      <button type="button" onClick={() => handleUpdateCategory(cat.id)} style={{ background: 'var(--color-success-soft)', border: 'none', color: '#5EDBA2', padding: '0 8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Check size={15} />
                      </button>
                      <button type="button" onClick={() => setEditingCategory(null)} style={{ background: 'var(--color-error-soft)', border: 'none', color: '#F87171', padding: '0 8px', borderRadius: '4px', cursor: 'pointer' }}>
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>{cat.nombre}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => { setEditingCategory(cat.id); setEditCategoryName(cat.nombre); }} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: '4px' }}
                          title="Modificar nombre"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteCategory(cat.id)} 
                          style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '4px' }}
                          title="Eliminar categoría"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" className="btn-primary" onClick={() => setShowCategoryModal(false)} style={{ padding: '8px 16px' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="form-row" style={{ gridTemplateColumns: '1.2fr 2fr 1fr' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>SKU</label>
                    <button type="button" onClick={() => generarSkuAleatorio(true)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                      <Wand2 size={11} style={{ display: 'inline' }} /> Nuevo
                    </button>
                  </div>
                  <input type="text" name="sku" value={editFormData.sku} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Nombre del Producto</label>
                  <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select name="categoria_id" value={editFormData.categoria_id} onChange={handleEditChange} required>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Costeo en Modal */}
              <div style={{ padding: '1rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', margin: '1rem 0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <span>Desglose en Dólares (USD)</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>Cotización: ${Number(cotizacionDolar || 0).toLocaleString('es-AR')} ARS</span>
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
                  Costo Final en Depósito: <strong>{formatPrice(calcularCostoUSD(editFormData) * (Number(cotizacionDolar) || 1))}</strong>
                </div>
              </div>

              {/* 3 Precios Mayoristas en Edición */}
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>P. Minorista (ARS)</label>
                  <input type="number" step="0.01" name="precio_venta" value={editFormData.precio_venta} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Mayorista 1 (Base)</label>
                  <input type="number" step="0.01" name="precio_mayorista_1" value={editFormData.precio_mayorista_1} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Mayorista 2 (Volumen)</label>
                  <input type="number" step="0.01" name="precio_mayorista_2" value={editFormData.precio_mayorista_2} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Mayorista 3 (Distrib.)</label>
                  <input type="number" step="0.01" name="precio_mayorista_3" value={editFormData.precio_mayorista_3} onChange={handleEditChange} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Foto del Artículo (WebP)</label>
                <input type="file" accept="image/*" disabled={subiendoFoto} onChange={(e) => handleSubirFoto(e, true)} />
                {editFormData.fotos && editFormData.fotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {editFormData.fotos.map((url, i) => (
                      <img 
                        key={i} 
                        src={url} 
                        alt="Foto" 
                        onClick={() => setFotoZoom(url)}
                        style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} 
                        title="Tocar para ampliar"
                      />
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

      {/* ── Modal Lightbox Zoom de Foto ── */}
      {fotoZoom && (
        <div 
          onClick={() => setFotoZoom(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.88)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '1rem' }}
        >
          <div style={{ position: 'relative', maxWidth: '92%', maxHeight: '90%' }}>
            <img 
              src={fotoZoom} 
              alt="Zoom" 
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} 
            />
            <button 
              onClick={() => setFotoZoom(null)} 
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '4px' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}4