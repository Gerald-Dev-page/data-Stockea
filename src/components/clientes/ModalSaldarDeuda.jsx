// src/components/clientes/ModalSaldarDeuda.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function ModalSaldarDeuda({ cliente, onClose, onPagar, saving }) {
  const [montoPago, setMontoPago] = useState('');

  useEffect(() => {
    if (cliente) {
      setMontoPago(cliente.saldo_deudor || '');
    }
  }, [cliente]);

  if (!cliente) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onPagar(cliente, montoPago);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 8, 15, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={onClose}>
      <div className="form-card" style={{ width: '100%', maxWidth: '440px', border: '1px solid rgba(94, 219, 162, 0.4)', boxShadow: 'var(--shadow-md)', margin: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="form-title" style={{ margin: 0 }}>Saldar Cuenta Corriente</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cliente.nombre_razon_social}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '10px 14px', background: 'var(--color-error-soft)', border: '1px solid rgba(179, 64, 42, 0.4)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#F87171', fontWeight: 600 }}>Deuda Exigible:</span>
            <strong style={{ fontSize: '1.15rem', color: '#F87171' }}>{formatPrice(cliente.saldo_deudor)}</strong>
          </div>

          <div className="form-group">
            <label>Monto a Abonar (ARS)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={cliente.saldo_deudor}
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              placeholder="Ingrese el monto recibido"
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving} 
              style={{ background: 'var(--color-success-soft)', border: '1px solid rgba(94, 219, 162, 0.4)', color: '#5EDBA2' }}
            >
              {saving ? 'Procesando...' : 'Confirmar Cobranza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}