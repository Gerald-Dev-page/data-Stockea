// src/pages/Clientes.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, MapPin, Phone, PlusCircle, 
  AlertCircle, Search, Edit2, X, Building2,
  DollarSign, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight,
  Receipt
} from 'lucide-react';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const ITEMS_PER_PAGE = 10;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filtros y Paginado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'deuda' | 'al_dia'
  const [paginaActual, setPaginaActual] = useState(1);

  // Modal Edición
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({ nombre_razon_social: '', direccion: '', telefono: '' });

  // Modal Saldar / Cobrar Deuda
  const [payingClient, setPayingClient] = useState(null);
  const [montoPago, setMontoPago] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

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
          telefono: formData.telefono.trim(),
          saldo_deudor: 0
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
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || ''
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

  // Cobro parcial o total de la deuda
  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    const abono = parseFloat(montoPago) || 0;
    if (abono <= 0 || !payingClient) return;

    setSaving(true);
    setError(null);

    try {
      const saldoActual = Number(payingClient.saldo_deudor || 0);
      const nuevoSaldo = Math.max(0, saldoActual - abono);

      const { error: errSaldo } = await supabase
        .from('clientes')
        .update({ saldo_deudor: nuevoSaldo })
        .eq('id_cliente', payingClient.id_cliente);

      if (errSaldo) throw errSaldo;

      // Si canceló la totalidad, actualizar ventas pendientes asociadas
      if (nuevoSaldo === 0) {
        await supabase
          .from('ventas')
          .update({ estado_pago: 'pagado' })
          .eq('cliente_id', payingClient.id_cliente)
          .eq('estado_pago', 'pendiente');
      }

      setPayingClient(null);
      setMontoPago('');
      showNotification(`Pago de ${formatPrice(abono)} asentado. Saldo restante: ${formatPrice(nuevoSaldo)}`);
      fetchClientes();
    } catch (err) {
      console.error("Error al asentar pago:", err.message);
      setError("No se pudo registrar el pago en la cuenta corriente.");
    } finally {
      setSaving(false);
    }
  };

  // Métricas
  const totalDeudaGeneral = clientes.reduce((acc, c) => acc + Number(c.saldo_deudor || 0), 0);
  const clientesConDeudaCount = clientes.filter(c => Number(c.saldo_deudor || 0) > 0).length;

  // Filtrado
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const q = busqueda.toLowerCase().trim();
      const matchTexto = !q || (
        c.nombre_razon_social?.toLowerCase().includes(q) ||
        c.direccion?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      );

      const deuda = Number(c.saldo_deudor || 0);
      const matchEstado = 
        filtroEstado === 'todos' ? true :
        filtroEstado === 'deuda' ? deuda > 0 :
        deuda === 0;

      return matchTexto && matchEstado;
    });
  }, [clientes, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE) || 1;
  const clientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return clientesFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [clientesFiltrados, paginaActual]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Directorio y Cuentas Corrientes</h2>
          <p>Control de clientes, saldos deudores y registro de cobranzas.</p>
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
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── KPIs de Cobranzas ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Users size={18} />
          </span>
          <div>
            <p className="stat-label">Total Clientes</p>
            <p className="stat-value">{clientes.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-error-soft)', color: '#F87171' }}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <p className="stat-label">Total Deuda en Calle</p>
            <p className="stat-value">{formatPrice(totalDeudaGeneral)}</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
            <Receipt size={18} />
          </span>
          <div>
            <p className="stat-label">Cuentas Morosas</p>
            <p className="stat-value">{clientesConDeudaCount}</p>
          </div>
        </div>
      </div>

      {/* ── Formulario de Registro ── */}
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

      {/* ── Directorio con Filtros de Deuda y Paginado ── */}
      <div className="card table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className="table-title" style={{ margin: 0 }}>Cartera de Clientes</h3>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                  width: '210px'
                }}
              />
            </div>

            {/* Filtros de Cuenta Corriente */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                type="button" 
                onClick={() => setFiltroEstado('todos')} 
                className={`header-badge ${filtroEstado === 'todos' ? 'active' : ''}`}
                style={{ cursor: 'pointer', border: filtroEstado === 'todos' ? '1px solid var(--color-accent)' : '1px solid var(--color-border)' }}
              >
                Todos
              </button>
              <button 
                type="button" 
                onClick={() => setFiltroEstado('deuda')} 
                className={`header-badge ${filtroEstado === 'deuda' ? 'active' : ''}`}
                style={{ cursor: 'pointer', color: '#F87171', border: filtroEstado === 'deuda' ? '1px solid #F87171' : '1px solid var(--color-border)' }}
              >
                Con Deuda ({clientesConDeudaCount})
              </button>
              <button 
                type="button" 
                onClick={() => setFiltroEstado('al_dia')} 
                className={`header-badge ${filtroEstado === 'al_dia' ? 'active' : ''}`}
                style={{ cursor: 'pointer', color: '#5EDBA2', border: filtroEstado === 'al_dia' ? '1px solid #5EDBA2' : '1px solid var(--color-border)' }}
              >
                Al Día
              </button>
            </div>
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
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Saldo Deudor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map((c) => {
                  const deuda = Number(c.saldo_deudor || 0);
                  const tieneDeuda = deuda > 0;

                  return (
                    <tr key={c.id_cliente}>
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
                      <td style={{ fontWeight: 700, color: tieneDeuda ? '#F87171' : 'var(--color-text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(deuda)}
                      </td>
                      <td>
                        {tieneDeuda ? (
                          <span className="estado-badge" style={{ background: 'var(--color-error-soft)', color: '#F87171', borderColor: 'rgba(179, 64, 42, 0.4)' }}>
                            Deudor
                          </span>
                        ) : (
                          <span className="estado-badge activo">Al Día</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {tieneDeuda && (
                            <button
                              type="button"
                              onClick={() => { setPayingClient(c); setMontoPago(deuda); }}
                              style={{
                                background: 'var(--color-success-soft)',
                                border: '1px solid rgba(94, 219, 162, 0.4)',
                                color: '#5EDBA2',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Registrar pago de deuda"
                            >
                              <DollarSign size={12} /> Saldar
                            </button>
                          )}
                          <button 
                            type="button"
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
                              fontSize: '0.75rem'
                            }}
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No se encontraron clientes registrados bajo este criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Control de Paginado ── */}
        {!loading && clientesFiltrados.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, clientesFiltrados.length)}</strong> de <strong>{clientesFiltrados.length}</strong> clientes
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {prev && page - prev > 1 && <span className="pagination-ellipsis">...</span>}
                      <button
                        type="button"
                        className={`pagination-btn ${paginaActual === page ? 'active' : ''}`}
                        onClick={() => setPaginaActual(page)}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                title="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Registrar Cobro / Saldar Deuda ── */}
      {payingClient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 8, 15, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="form-card" style={{ width: '100%', maxWidth: '440px', border: '1px solid rgba(94, 219, 162, 0.4)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <div>
                <h3 className="form-title" style={{ margin: 0 }}>Saldar Cuenta Corriente</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{payingClient.nombre_razon_social}</span>
              </div>
              <button onClick={() => setPayingClient(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleRegistrarPago}>
              <div style={{ padding: '10px 14px', background: 'var(--color-error-soft)', border: '1px solid rgba(179, 64, 42, 0.4)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#F87171', fontWeight: 600 }}>Deuda Exigible:</span>
                <strong style={{ fontSize: '1.15rem', color: '#F87171' }}>{formatPrice(payingClient.saldo_deudor)}</strong>
              </div>

              <div className="form-group">
                <label>Monto a Abonar (ARS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={payingClient.saldo_deudor}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="Ingrese el monto recibido"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setPayingClient(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ background: 'var(--color-success-soft)', borderColor: 'rgba(94, 219, 162, 0.4)', color: '#5EDBA2' }}>
                  {saving ? 'Procesando...' : 'Confirmar Cobranza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="form-card" style={{
            width: '100%',
            maxWidth: '480px',
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
                <button type="submit" className="btn-primary" disabled={saving}>
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