// src/components/clientes/ModalEditarCliente.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ModalEditarCliente({ cliente, onClose, onUpdate, saving }) {
  const [formData, setFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre_razon_social: cliente.nombre_razon_social || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || ''
      });
    }
  }, [cliente]);

  if (!cliente) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(cliente.id_cliente, formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 8, 15, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={onClose}>
      <div className="form-card" style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)', margin: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="form-title" style={{ margin: 0 }}>Actualizar Cliente</h3>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
              {cliente.nombre_razon_social}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo / Razón Social</label>
            <input 
              type="text" 
              value={formData.nombre_razon_social} 
              onChange={(e) => setFormData({ ...formData, nombre_razon_social: e.target.value })} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input 
              type="text" 
              value={formData.direccion} 
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input 
              type="tel" 
              value={formData.telefono} 
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 