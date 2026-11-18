// src/components/ventas/VentasProductoCard.jsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { Package, Plus, Search, X } from 'lucide-react';

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
  const [busqueda, setBusqueda] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const productoActivo = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return catalogo;
    return catalogo.filter(p => 
      p.nombre?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.codigo_barras?.toLowerCase().includes(q)
    );
  }, [catalogo, busqueda]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (prod) => {
    onProductoChange(prod.id_producto);
    setBusqueda('');
    setIsOpen(false);
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    onProductoChange('');
    setBusqueda('');
  };

  return (
    <div className="form-card">
      <h3 className="form-title">
        <Package size={16} style={{ color: 'var(--color-accent)' }} /> Agregar Producto
      </h3>

      <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ margin: 0 }}>Artículo (Escribir o Seleccionar)</label>
          {productoActivo && (
            <span style={{ fontSize: '0.72rem', color: productoActivo.stock_actual <= 0 ? '#F87171' : 'var(--color-text-muted)' }}>
              Físico: <strong>{productoActivo.stock_actual} u.</strong>
            </span>
          )}
        </div>

        <div 
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-bg-main)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            cursor: 'pointer',
            minHeight: '38px',
            boxSizing: 'border-box'
          }}
        >
          <Search size={15} style={{ color: 'var(--color-text-muted)', marginRight: '8px', flexShrink: 0 }} />
          <input 
            type="text"
            placeholder={productoActivo ? `${productoActivo.nombre} [SKU: ${productoActivo.sku}]` : "Buscar por nombre, SKU o código..."}
            value={isOpen ? busqueda : (productoActivo ? productoActivo.nombre : '')}
            onChange={(e) => {
              setBusqueda(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={saving}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              color: 'var(--color-text-heading)',
              fontSize: '0.84rem',
              padding: 0
            }}
          />
          {productoActivo && (
            <button 
              type="button"
              onClick={handleClearSelection}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0 4px', display: 'flex' }}
              title="Limpiar selección"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            {productosFiltrados.length === 0 ? (
              <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                No se encontraron artículos.
              </div>
            ) : (
              productosFiltrados.map(p => {
                const sinStock = p.stock_actual <= 0;
                const seleccionado = String(p.id_producto) === String(itemActual.id_producto);

                return (
                  <div
                    key={p.id_producto}
                    onClick={() => !sinStock && handleSelectProduct(p)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      cursor: sinStock ? 'not-allowed' : 'pointer',
                      background: seleccionado ? 'var(--color-accent-soft)' : 'transparent',
                      color: sinStock ? 'var(--color-text-muted)' : 'var(--color-text-heading)',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: sinStock ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!sinStock) e.currentTarget.style.background = 'var(--color-bg-main)';
                    }}
                    onMouseLeave={(e) => {
                      if (!sinStock && !seleccionado) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>SKU: {p.sku}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: sinStock ? '#F87171' : 'var(--color-text-muted)' }}>
                      {sinStock ? 'Sin stock' : `${p.stock_actual} u.`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
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
              setItemActual(prev => ({
                ...prev,
                cantidad: val === '' ? '' : parseInt(val, 10)
              }));
            }}
            onBlur={() => {
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