// src/components/productos/ProductEditModal.jsx
import { useState, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';
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
  notify,
  setError,
  onZoomFoto
}) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const costoFinalUSD = calcularCostoUSD(formData);
  const costoFinalARS = Math.round(costoFinalUSD * (Number(cotizacionDolar) || 1));

  return (
    <div className="modal-overlay">
      <div className="form-card modal-content">
        <div className="modal-header">
          <div>
            <h3 className="form-title" style={{ margin: 0 }}>Ficha Técnica del Artículo</h3>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              {formData.sku} — {formData.nombre}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          {/* Costeo en Modal */}
          <div className="cost-breakdown-box" style={{ margin: '1rem 0' }}>
            <div className="form-section-title" style={{ justifyContent: 'space-between' }}>
              <span>Desglose en Dólares (USD)</span>
              <span style={{ color: 'var(--color-text-muted)' }}>Cotización: ${Number(cotizacionDolar || 0).toLocaleString('es-AR')} ARS</span>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="form-group">
                <label>Costo Origen</label>
                <input type="number" step="0.01" name="costo_origen" value={formData.costo_origen} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Flete Int.</label>
                <input type="number" step="0.01" name="flete_int" value={formData.flete_int} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Aduana</label>
                <input type="number" step="0.01" name="impuestos_aduana" value={formData.impuestos_aduana} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Nacionaliz.</label>
                <input type="number" step="0.01" name="nacionalizacion" value={formData.nacionalizacion} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Flete Local</label>
                <input type="number" step="0.01" name="flete_local" value={formData.flete_local} onChange={handleChange} />
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-heading)', marginTop: '4px' }}>
              Costo Final en Depósito: <strong>{formatPrice(costoFinalARS)}</strong>
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Foto del Artículo (WebP)</label>
            <input type="file" accept="image/*" disabled={subiendoFoto} onChange={handleSubirFoto} />
            {formData.fotos && formData.fotos.length > 0 && (
              <div className="photo-previews">
                {formData.fotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Foto"
                    className="photo-thumb"
                    onClick={() => onZoomFoto(url)}
                    title="Tocar para ampliar"
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || subiendoFoto}>
              {saving ? 'Guardando...' : 'Confirmar Cambios en Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}