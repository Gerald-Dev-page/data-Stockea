// src/components/clientes/ClienteFormCard.jsx
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

export default function ClienteFormCard({ onCreate, saving }) {
  const [formData, setFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onCreate(formData);
    if (ok) {
      setFormData({ nombre_razon_social: '', direccion: '', telefono: '' });
    }
  };

  return (
    <div className="form-card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="form-title">
        <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Registrar Nuevo Cliente
      </h3>

      <form onSubmit={handleSubmit} className="productos-form">
        <div className="form-group">
          <label>Razón Social o Nombre Completo</label>
          <input
            type="text"
            placeholder="Ej: Distribuidora Central S.R.L."
            value={formData.nombre_razon_social}
            onChange={(e) => setFormData({ ...formData, nombre_razon_social: e.target.value })}
            required
          />
        </div>

        <div className="form-row" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="form-group">
            <label>Dirección de Entrega / Facturación</label>
            <input
              type="text"
              placeholder="Ej: Av. San Martín 450"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input
              type="tel"
              placeholder="Ej: +54 9 266 4123456"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : <><PlusCircle size={15} /> Registrar Cliente</>}
          </button>
        </div>
      </form>
    </div>
  );
}