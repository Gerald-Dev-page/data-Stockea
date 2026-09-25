// src/components/stock/StockModalAjuste.jsx
import { X, Calendar, UserCheck } from 'lucide-react';

export default function StockModalAjuste({
  selectedProduct,
  onClose,
  ajusteForm,
  setAjusteForm,
  onSubmit,
  saving,
  clientes = []
}) {
  if (!selectedProduct) return null;

  const hoyMin = new Date().toISOString().split('T')[0];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(3, 8, 15, 0.85)', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backdropFilter: 'blur(4px)', 
        padding: '1rem' 
      }}
      onClick={onClose}
    >
      <div 
        className="form-card" 
        style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="form-title" style={{ margin: 0 }}>Modificar Existencias</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {selectedProduct.sku} — {selectedProduct.nombre}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Área a Modificar</label>
            <select 
              value={ajusteForm.destino} 
              onChange={(e) => setAjusteForm(prev => ({ ...prev, destino: e.target.value }))}
            >
              <option value="fisico">Físico en Depósito (Actual: {selectedProduct.stock_actual} u.)</option>
              <option value="reservado">Reservas Comerciales (Actual: {selectedProduct.stock_reservado || 0} u.)</option>
              <option value="transito">En Tránsito / Importación (Actual: {selectedProduct.stock_transito || 0} u.)</option>
            </select>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Tipo de Acción</label>
              <select 
                value={ajusteForm.tipo} 
                onChange={(e) => setAjusteForm(prev => ({ ...prev, tipo: e.target.value }))}
              >
                <option value="ingreso">+ Sumar (Ingreso/Asignar)</option>
                <option value="egreso">- Restar (Salida/Baja)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cantidad de Unidades</label>
              <input 
                type="number" 
                min="1" 
                value={ajusteForm.cantidad} 
                onChange={(e) => setAjusteForm(prev => ({ ...prev, cantidad: e.target.value }))} 
                required 
              />
            </div>
          </div>

          {/* Campo condicional: Fecha de llegada para Tránsito */}
          {ajusteForm.destino === 'transito' && ajusteForm.tipo === 'ingreso' && (
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
                Fecha Estimada de Llegada
              </label>
              <input 
                type="date" 
                min={hoyMin}
                value={ajusteForm.fecha_estimada} 
                onChange={(e) => setAjusteForm(prev => ({ ...prev, fecha_estimada: e.target.value }))} 
                required 
              />
            </div>
          )}

          {/* Campo condicional: Cliente para Reservas Comerciales */}
          {ajusteForm.destino === 'reservado' && ajusteForm.tipo === 'ingreso' && (
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} style={{ color: 'var(--color-accent)' }} />
                Asignar Reserva al Cliente
              </label>
              <select 
                value={ajusteForm.cliente_id} 
                onChange={(e) => setAjusteForm(prev => ({ ...prev, cliente_id: e.target.value }))}
                required
              >
                <option value="">Seleccione el cliente solicitante...</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
    {c.nombre_razon_social || `Cliente #${c.id_cliente.slice(0, 6)}`}
  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Registrando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}