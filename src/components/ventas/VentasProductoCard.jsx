// src/components/ventas/VentasProductoCard.jsx
import { Package, Plus } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function VentasProductoCard({
  catalogo,
  itemActual,
  setItemActual,
  onProductoChange,
  onTipoPrecioChange,
  onAgregar,
  saving
}) {
  const productoActivo = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));

  return (
    <div className="form-card">
      <h3 className="form-title">
        <Package size={16} style={{ color: 'var(--color-accent)' }} /> Agregar Producto
      </h3>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>Artículo</label>
          {productoActivo && (
            <span style={{ fontSize: '0.72rem', color: productoActivo.stock_actual <= 0 ? '#F87171' : 'var(--color-text-muted)' }}>
              Físico: <strong>{productoActivo.stock_actual} u.</strong>
            </span>
          )}
        </div>
        <select value={itemActual.id_producto} onChange={(e) => onProductoChange(e.target.value)} disabled={saving}>
          <option value="">— Seleccione un artículo —</option>
          {catalogo.map(p => (
            <option key={p.id_producto} value={p.id_producto} disabled={p.stock_actual <= 0}>
              {p.nombre} ({p.stock_actual <= 0 ? 'Sin stock' : `${p.stock_actual} u.`})
            </option>
          ))}
        </select>
      </div>

      <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
        <div className="form-group">
          <label>Lista de Precio</label>
          <select 
            value={itemActual.tipo_precio} 
            onChange={(e) => onTipoPrecioChange(e.target.value)} 
            disabled={!itemActual.id_producto || saving}
          >
            <option value="minorista">Minorista</option>
            <option value="mayorista_1">Mayorista 1 (Base)</option>
            <option value="mayorista_2">Mayorista 2 (Volumen)</option>
            <option value="mayorista_3">Mayorista 3 (Distrib.)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Precio Unit.</label>
          <input 
            type="text" 
            value={formatPrice(itemActual.precio_unitario)} 
            disabled 
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-heading)' }} 
          />
        </div>

        <div className="form-group">
          <label>Cantidad</label>
  <input
    type="number"
    min="1"
    max={productoActivo?.stock_actual || 9999}
    value={itemActual.cantidad}
    onChange={(e) => {
      const val = e.target.value;
      // Permite dejar el campo vacío temporalmente mientras se tipea
      setItemActual(prev => ({
        ...prev,
        cantidad: val === '' ? '' : parseInt(val, 10)
      }));
    }}
    onBlur={() => {
      // Si el usuario sale del input dejándolo vacío o menor a 1, restablece a 1
      if (!itemActual.cantidad || Number(itemActual.cantidad) < 1) {
        setItemActual(prev => ({ ...prev, cantidad: 1 }));
      }
    }}
    disabled={!itemActual.id_producto || saving}
  />
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={onAgregar}
        disabled={saving || !itemActual.id_producto || itemActual.cantidad <= 0}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <Plus size={15} /> Añadir al Carrito
      </button>
    </div>
  );
}