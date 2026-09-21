// src/pages/Clientes.jsx
import { Users, AlertCircle } from 'lucide-react';

import { useClientes } from '../hooks/useClientes';
import ClientesStats from '../components/clientes/ClientesStats';
import ClienteFormCard from '../components/clientes/ClienteFormCard';
import ClientesTable from '../components/clientes/ClientesTable';
import ModalEditarCliente from '../components/clientes/ModalEditarCliente';
import ModalSaldarDeuda from '../components/clientes/ModalSaldarDeuda';

export default function Clientes() {
  const {
    clientes,
    loading,
    saving,
    error,
    setError,
    toastMessage,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    totalDeudaGeneral,
    clientesConDeudaCount,
    clientesFiltrados,
    clientesPaginados,
    editingClient,
    setEditingClient,
    payingClient,
    setPayingClient,
    createCliente,
    updateCliente,
    registrarPago
  } = useClientes();

  return (
    <div className="page-container dashboard-page">
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

      {toastMessage && (
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

      <ClientesStats
        totalClientes={clientes.length}
        totalDeuda={totalDeudaGeneral}
        morososCount={clientesConDeudaCount}
      />

      <ClienteFormCard
        onCreate={createCliente}
        saving={saving}
      />

      <ClientesTable
        clientesPaginados={clientesPaginados}
        totalItems={clientesFiltrados.length}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        clientesConDeudaCount={clientesConDeudaCount}
        onOpenEdit={(c) => setEditingClient(c)}
        onOpenCobranza={(c) => setPayingClient(c)}
        loading={loading}
      />

      <ModalEditarCliente
        cliente={editingClient}
        onClose={() => setEditingClient(null)}
        onUpdate={updateCliente}
        saving={saving}
      />

      <ModalSaldarDeuda
        cliente={payingClient}
        onClose={() => setPayingClient(null)}
        onPagar={registrarPago}
        saving={saving}
      />
    </div>
  );
}