// src/components/productos/ProductForm.jsx
import { useState } from 'react';
import { PlusCircle, Wand2, Truck, Percent, Check, X } from 'lucide-react';
import { supabase } from '../../services/supabase';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ProductForm({
  categorias,
  setCategorias,
  cotizacionDolar,
  userId,
  uploadFoto,
  subiendoFoto,
  calcularCostoUSD,
  onProductCreated,
  notify,
  setError
}) {
  const [saving, setSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    codigo_barras: '',
    nombre: '',
    categoria_id: categorias[0]?.id || '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generarSkuAleatorio = () => {
    const cat = categorias.find(c => String(c.id) === String(formData.categoria_id));
    const prefix = cat ? cat.nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${prefix}-${randomCode}` }));
  };

  const handleSubirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFoto(file, formData.sku);
    if (url) {
      setFormData(prev => ({ ...prev, fotos: [...prev.fotos, url] }));
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
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
      notify("Categoría creada exitosamente.");
    } catch (err) {
      setError("Error al crear categoría: " + err.message);
    }
  };

  const costoTotalUSD = calcularCostoUSD(formData);
  const costoTotalARS = Math.round(costoTotalUSD * (Number(cotizacionDolar) || 1));

  const margenMinorista = (parseFloat(formData.precio_venta) || 0) - costoTotalARS;
  const rentMinorista = costoTotalARS > 0 ? Math.round((margenMinorista / costoTotalARS) * 100) : 0;

  const margenM1 = (parseFloat(formData.precio_mayorista_1) || 0) - costoTotalARS;
  const rentM1 = costoTotalARS > 0 ? Math.round((margenM1 / costoTotalARS) * 100) : 0;

  const margenM2 = (parseFloat(formData.precio_mayorista_2) || 0) - costoTotalARS;
  const rentM2 = costoTotalARS > 0 ? Math.round((margenM2 / costoTotalARS) * 100) : 0;

  const margenM3 = (parseFloat(formData.precio_mayorista_3) || 0) - costoTotalARS;
  const rentM3 = costoTotalARS > 0 ? Math.round((margenM3 / costoTotalARS) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoria_id) {
      setError("Debe seleccionar una categoría.");
      return;
    }

    try {
      setSaving(true);
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
        if (insertError.code === '23505') throw new Error("El SKU o Código de barras ya existe.");
        throw insertError;
      }

      if (stockInicialVal > 0 && userId) {
        await supabase.from('movimientos_stock').insert([{
          producto_id: newProduct.id_producto,
          usuario_id: userId,
          tipo: 'reposicion',
          cantidad: stockInicialVal
        }]);
      }

      notify("Producto guardado con 3 precios mayoristas.");
      onProductCreated();
      setFormData(prev => ({
        ...prev,
        sku: '',
        codigo_barras: '',
        nombre: '',
        costo_origen: '',
        flete_int: '',
        impuestos_aduana: '',
        nacionalizacion: '',
        flete_local: '',
        precio_venta: '',
        precio_mayorista_1: '',
        precio_mayorista_2: '',
        precio_mayorista_3: '',
        fotos: []
      }));
    } catch (err) {
      setError(err.message || "Error al registrar producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-card" style={{ marginBottom: '2rem' }}>
      <h3 className="form-title">
        <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Nueva Ficha de Producto
      </h3>

      <form onSubmit={handleSubmit} className="productos-form">
        <div className="form-section-title">1. Identificación y Clasificación</div>

        <div className="form-row" style={{ gridTemplateColumns: '1.4fr 1.2fr 2fr' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Código SKU</label>
              <button
                type="button"
                onClick={generarSkuAleatorio}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, padding: 0 }}
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
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  style={{ padding: '0 8px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
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

        {/* Bloque 2: Costeo en USD */}
        <div className="cost-breakdown-box">
          <div className="form-section-title" style={{ justifyContent: 'space-between' }}>
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

          <div className="cost-summary-card">
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-heading)' }}>
              Subtotal Costo: <strong>USD ${costoTotalUSD.toFixed(2)}</strong>
            </div>
            <div className="cost-summary-total">
              Costo Real en Depósito (ARS): <strong>{formatPrice(costoTotalARS)}</strong>
            </div>
          </div>
        </div>

        {/* Bloque 3: Precios ARS */}
        <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
          <Percent size={15} /> 3. Precios de Venta (ARS) y Rentabilidad Real
        </div>

        <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="form-group">
            <label>P. Minorista (ARS)</label>
            <input type="number" step="0.01" min="0" name="precio_venta" placeholder="Ej: 10000" value={formData.precio_venta} onChange={handleChange} required />
            {costoTotalARS > 0 && (
              <span className={`profit-badge ${margenMinorista >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                {formatPrice(margenMinorista)} ({rentMinorista}%)
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Mayorista 1 (Base)</label>
            <input type="number" step="0.01" min="0" name="precio_mayorista_1" placeholder="Ej: 8000" value={formData.precio_mayorista_1} onChange={handleChange} />
            {costoTotalARS > 0 && (
              <span className={`profit-badge ${margenM1 >= 0 ? 'profit-wholesale' : 'profit-negative'}`}>
                {formatPrice(margenM1)} ({rentM1}%)
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Mayorista 2 (Volumen)</label>
            <input type="number" step="0.01" min="0" name="precio_mayorista_2" placeholder="Ej: 7500" value={formData.precio_mayorista_2} onChange={handleChange} />
            {costoTotalARS > 0 && (
              <span className={`profit-badge ${margenM2 >= 0 ? 'profit-wholesale' : 'profit-negative'}`}>
                {formatPrice(margenM2)} ({rentM2}%)
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Mayorista 3 (Distrib.)</label>
            <input type="number" step="0.01" min="0" name="precio_mayorista_3" placeholder="Ej: 7000" value={formData.precio_mayorista_3} onChange={handleChange} />
            {costoTotalARS > 0 && (
              <span className={`profit-badge ${margenM3 >= 0 ? 'profit-wholesale' : 'profit-negative'}`}>
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
            <input 
              type="file" 
              accept="image/*" 
              disabled={subiendoFoto} 
              onChange={handleSubirFoto} 
              style={{
                background: 'var(--color-bg-main)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                color: 'var(--color-text-muted)',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
            {subiendoFoto && <small style={{ color: 'var(--color-accent)', display: 'block', marginTop: '4px' }}>Comprimiendo a WebP y subiendo...</small>}
            {formData.fotos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {formData.fotos.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt="Preview" 
                    style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-border)' }} 
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: '100%' }}>
            <button 
              className="btn-primary" 
              type="submit" 
              disabled={saving || subiendoFoto} 
              style={{ width: '100%', padding: '12px' }}
            >
              {saving ? 'Registrando...' : <><PlusCircle size={16} /> Guardar Ficha e Importación</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}