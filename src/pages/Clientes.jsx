// src/pages/Clientes.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, MapPin, Phone, PlusCircle, 
  AlertCircle, Search, Edit2, X, Building2 
} from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Buscador y modal de edición
  const [busqueda, setBusqueda] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: errSupabase } = await supabase
        .from('clientes')
        .select('*')
        .order('creado_en', { ascending: false });

      if (errSupabase) throw errSupabase;
      setClientes(data || []);
    } catch (err) {
      console.error("Error al cargar clientes:", err.message);
      setError("No se pudo establecer conexión con el catálogo de clientes.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: errInsert } = await supabase
        .from('clientes')
        .insert([{
          nombre_razon_social: formData.nombre_razon_social.trim(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim()
        }]);

      if (errInsert) throw errInsert;

      setFormData({ nombre_razon_social: '', direccion: '', telefono: '' });
      showNotification("Cliente registrado exitosamente.");
      fetchClientes();
    } catch (err) {
      console.error("Error al registrar cliente:", err.message);
      setError("Ocurrió un error al intentar guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (cliente) => {
    setEditingClient(cliente);
    setEditFormData({
      nombre_razon_social: cliente.nombre_razon_social,
      direccion: cliente.direccion,
      telefono: cliente.telefono
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: errUpdate } = await supabase
        .from('clientes')
        .update({
          nombre_razon_social: editFormData.nombre_razon_social.trim(),
          direccion: editFormData.direccion.trim(),
          telefono: editFormData.telefono.trim()
        })
        .eq('id_cliente', editingClient.id_cliente);

      if (errUpdate) throw errUpdate;

      setEditingClient(null);
      showNotification("Datos del cliente actualizados.");
      fetchClientes();
    } catch (err) {
      console.error("Error al editar cliente:", err.message);
      setError("No se pudieron actualizar los datos del cliente.");
    } finally {
      setSaving(false);
    }
  };

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter(c => 
      c.nombre_razon_social?.toLowerCase().includes(q) ||
      c.direccion?.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q)
    );
  }, [clientes, busqueda]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Directorio de Clientes</h2>
          <p>Administración de cuentas comerciales, contactos y puntos de entrega.</p>
        </div>
        <div className="header-badge">
          <Users size={14} />
          {clientes.length} cuentas registradas
        </div>
      </header>

      {showToast && (
        <div className="demo-toast">
          ✓ {toastMessage}
        </div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Formulario de Registro ── */}
      <div className="form-card">
        <h3 className="form-title">
          <PlusCircle size={17} style={{ color: 'var(--color-accent)' }} /> Registrar Nuevo Cliente
        </h3>

        <form onSubmit={handleSubmit}>
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

          <div className="form-row">
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

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : <><PlusCircle size={15} /> Registrar Cliente</>}
          </button>
        </form>
      </div>

      {/* ── Tabla de Directorio ── */}
      <div className="card table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className="table-title" style={{ margin: 0 }}>Cartera de Clientes</h3>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, tel o dir..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                background: 'var(--color-bg-main)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px 6px 28px',
                color: 'var(--color-text-heading)',
                fontSize: '0.8rem',
                outline: 'none',
                width: '240px'
              }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Cargando directorio comercial...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Razón Social</th>
                  <th><MapPin size={12} /> Dirección</th>
                  <th><Phone size={12} /> Teléfono</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr key={c.id_cliente}>
                    <td>
                      <span className="id-badge" title={c.id_cliente}>
                        {c.id_cliente.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="td-nombre">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} style={{ color: 'var(--color-accent)' }} />
                        {c.nombre_razon_social}
                      </span>
                    </td>
                    <td className="td-muted">{c.direccion || '—'}</td>
                    <td className="td-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {c.telefono || '—'}
                    </td>
                    <td>
                      <button 
                        onClick={() => openEditModal(c)} 
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.75rem',
                          transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.color = 'var(--color-accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No se encontraron clientes registrados bajo este criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal de Edición de Cliente ── */}
      {editingClient && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 8, 15, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="form-card" style={{
            width: '100%',
            maxWidth: '480px',
            margin: '1rem',
            padding: '2rem',
            border: '1px solid rgba(201, 162, 39, 0.3)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Actualizar Cliente</h3>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  ID: {editingClient.id_cliente.substring(0, 12)}...
                </span>
              </div>
              <button 
                onClick={() => setEditingClient(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Nombre Completo / Razón Social</label>
                <input 
                  type="text" 
                  value={editFormData.nombre_razon_social} 
                  onChange={(e) => setEditFormData({ ...editFormData, nombre_razon_social: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input 
                  type="text" 
                  value={editFormData.direccion} 
                  onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  value={editFormData.telefono} 
                  onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })} 
                  required 
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingClient(null)} 
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 0 }}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}