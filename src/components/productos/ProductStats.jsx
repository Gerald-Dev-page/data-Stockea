import { Package, DollarSign, LayoutGrid, Settings } from 'lucide-react';

export default function ProductStats({ productos, categorias, cotizacion, onOpenCategoryModal }) {
  const activos = productos.filter(p => p.activo).length;

  const formatPrice = (n) =>
    Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  const costoPromedio = productos.length > 0
    ? productos.reduce((acc, p) => {
        const g = p.gastos_importacion || {};
        const cOrigen = Number(p.costo_origen) || 0;
        const cUSD = cOrigen > 0
          ? cOrigen + (Number(g.flete_int) || 0) + (Number(g.impuestos_aduana) || 0) + (Number(g.nacionalizacion) || 0) + (Number(g.flete_local) || 0)
          : Number(p.costo_unitario) || 0;
        return acc + (cUSD * (Number(cotizacion) || 1));
      }, 0) / productos.length
    : 0;

  return (
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
          <p className="stat-value">{formatPrice(costoPromedio)}</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
          <LayoutGrid size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="stat-label">Categorías</p>
            <button
              type="button"
              onClick={onOpenCategoryModal}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', padding: 0 }}
            >
              <Settings size={13} /> Gestionar
            </button>
          </div>
          <p className="stat-value">{categorias.length}</p>
        </div>
      </div>
    </div>
  );
}