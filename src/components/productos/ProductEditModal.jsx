// src/components/productos/ProductEditModal.jsx
import { useState, useEffect } from 'react';
import { X, Wand2, Truck, Trash2, AlertTriangle, ImagePlus } from 'lucide-react';
import { supabase } from '../../services/supabase';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ProductEditModal({
  product,
  onClose,
  categorias,
  cotizacionDolar,
  uploadFoto,
  subiendoFoto,
  calcularCostoUSD,
  onUpdated,
  onDeleteProduct,
  notify,
  setError,
  onZoomFoto
}) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (product) {
      const g = product.gastos_importacion || {};
      setFormData({
        ...product,
        costo_origen: product.costo_origen || product.costo_unitario || '',
        flete_int: g.flete_int || '',
        impuestos_aduana: g.impuestos_aduana || '',
        nacionalizacion: g.nacionalizacion || '',
        flete_local: g.flete_local || '',
        precio_mayorista_1: product.precio_mayorista_1 || product.precio_mayorista || '',
        precio_mayorista_2: product.precio_mayorista_2 || '',
        precio_mayorista_3: product.precio_mayorista_3 || '',
        fotos: product.fotos || []
      });
      setShowConfirmDelete(false);
    }
  }, [product]);

  if (!product || !formData) return null;

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
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), url] }));
    }
  };

  const handleEliminarFoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const costoFinalUSD = calcularCostoUSD(formData);

      const updatePayload = {
        sku: formData.sku,
        nombre: formData.nombre,
        categoria_id: parseInt(formData.categoria_id),
        codigo_barras: formData.codigo_barras || null,
        subcategoria: formData.subcategoria || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        color: formData.color || null,
        tamanio: formData.tamanio || null,
        proveedor: formData.proveedor || null,
        origen: formData.origen || 'Importado',
        descripcion: formData.descripcion || null,
        especificaciones: formData.especificaciones || null,
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
        activo: formData.activo,
        fotos: formData.fotos
      };

      const { error: updErr } = await supabase
        .from('productos')
        .update(updatePayload)
        .eq('id_producto', product.id_producto);

      if (updErr) throw updErr;

      notify("Ficha técnica actualizada con éxito.");
      onUpdated();
      onClose();
    } catch (err) {
      setError("Error al actualizar ficha: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const ejecutarEliminacion = async () => {
    const ok = await onDeleteProduct(product.id_producto);
    if (ok) onClose();
  };

  const costoFinalUSD = calcularCostoUSD(formData);
  const costoFinalARS = Math.round(costoFinalUSD * (Number(cotizacionDolar) || 1));

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 8, 15, 0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
    >
      <div 
        className="form-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(201, 162, 39, 0.4)',
          boxShadow: 'var(--shadow-md)',
          margin: 0
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="form-title" style={{ margin: 0 }}>Ficha Técnica del Artículo</h3>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              {formData.sku} — {formData.nombre}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Identificación */}
          <div className="form-row" style={{ gridTemplateColumns: '1.2fr 2fr 1fr' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>SKU</label>
                <button type="button" onClick={generarSkuAleatorio} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                  <Wand2 size={11} style={{ display: 'inline' }} /> Nuevo
                </button>
              </div>
              <input type="text" name="sku" value={formData.sku} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Nombre del Producto</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} required>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Bloque Costeo en USD */}
          <div 
            style={{ 
              marginTop: '1.25rem', 
              padding: '1.2rem', 
              background: 'linear-gradient(180deg, #09121D 0%, #0c1827 100%)', 
              border: '1px solid rgba(201, 162, 39, 0.3)', 
              borderRadius: 'var(--radius-sm)' 
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} /> Desglose en Dólares (USD)
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.76rem' }}>
                Cotización: ${Number(cotizacionDolar || 0).toLocaleString('es-AR')} ARS
              </span>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="form-group">
                <label>Costo Origen</label>
                <input type="number" step="0.01" name="costo_origen" value={formData.costo_origen} onChange={handleChange} style={{ background: 'var(--color-bg-card)' }} />
              </div>
              <div className="form-group">
                <label>Flete Int.</label>
                <input type="number" step="0.01" name="flete_int" value={formData.flete_int} onChange={handleChange} style={{ background: 'var(--color-bg-card)' }} />
              </div>
              <div className="form-group">
                <label>Aduana</label>
                <input type="number" step="0.01" name="impuestos_aduana" value={formData.impuestos_aduana} onChange={handleChange} style={{ background: 'var(--color-bg-card)' }} />
              </div>
              <div className="form-group">
                <label>Nacionaliz.</label>
                <input type="number" step="0.01" name="nacionalizacion" value={formData.nacionalizacion} onChange={handleChange} style={{ background: 'var(--color-bg-card)' }} />
              </div>
              <div className="form-group">
                <label>Flete Local</label>
                <input type="number" step="0.01" name="flete_local" value={formData.flete_local} onChange={handleChange} style={{ background: 'var(--color-bg-card)' }} />
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-heading)', marginTop: '6px' }}>
              Costo Final en Depósito: <strong style={{ color: 'var(--color-accent)' }}>{formatPrice(costoFinalARS)}</strong>
            </div>
          </div>

          {/* Precios de Venta */}
          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '1rem' }}>
            <div className="form-group">
              <label>P. Minorista (ARS)</label>
              <input type="number" step="0.01" name="precio_venta" value={formData.precio_venta} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Mayorista 1 (Base)</label>
              <input type="number" step="0.01" name="precio_mayorista_1" value={formData.precio_mayorista_1} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mayorista 2 (Volumen)</label>
              <input type="number" step="0.01" name="precio_mayorista_2" value={formData.precio_mayorista_2} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mayorista 3 (Distrib.)</label>
              <input type="number" step="0.01" name="precio_mayorista_3" value={formData.precio_mayorista_3} onChange={handleChange} />
            </div>
          </div>

          {/* ── Gestión Completa de Fotos (Subir, Reemplazar y Eliminar) ── */}
          <div className="form-group" style={{ marginTop: '1rem', padding: '12px', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-heading)' }}>
              <ImagePlus size={15} style={{ color: 'var(--color-accent)' }} /> Fotos del Producto ({formData.fotos?.length || 0})
            </label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
              {formData.fotos && formData.fotos.map((url, i) => (
                <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={url} 
                    alt={`Foto ${i + 1}`} 
                    onClick={() => onZoomFoto(url)}
                    style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                    title="Clic para ampliar"
                  />
                  <button
                    type="button"
                    onClick={() => handleEliminarFoto(i)}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--color-error)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '11px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                    }}
                    title="Eliminar esta foto"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <label 
                style={{
                  width: '60px',
                  height: '60px',
                  border: '1px dashed var(--color-accent)',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: subiendoFoto ? 'not-allowed' : 'pointer',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-accent)',
                  fontSize: '0.68rem',
                  gap: '2px'
                }}
              >
                <ImagePlus size={16} />
                <span>{subiendoFoto ? '...' : '+ Añadir'}</span>
                <input type="file" accept="image/*" disabled={subiendoFoto} onChange={handleSubirFoto} style={{ display: 'none' }} />
              </label>
            </div>
            {subiendoFoto && <small style={{ color: 'var(--color-accent)', display: 'block', marginTop: '4px' }}>Comprimiendo WebP y subiendo a Storage...</small>}
          </div>

          {/* ── Zona de Peligro: Eliminar Producto ── */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(179, 64, 42, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(179, 64, 42, 0.4)',
                  color: '#F87171',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} /> Eliminar Producto
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-error-soft)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(179, 64, 42, 0.5)' }}>
                <AlertTriangle size={15} color="#F87171" />
                <span style={{ fontSize: '0.76rem', color: '#F87171', fontWeight: 600 }}>¿Confirmar eliminación?</span>
                <button
                  type="button"
                  onClick={ejecutarEliminacion}
                  disabled={saving}
                  style={{ background: 'var(--color-error)', border: 'none', color: '#FFF', padding: '4px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sí, Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Guardar cambios */}
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
              <button 
                type="button" 
                onClick={onClose} 
                style={{
                  padding: '9px 18px',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
              <button type="submit" className="btn-primary" disabled={saving || subiendoFoto}>
                {saving ? 'Guardando...' : 'Confirmar Cambios en Ficha'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}