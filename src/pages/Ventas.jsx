// src/pages/Ventas.jsx
import { useState } from 'react';
import { ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/ventas.css';

import { useVentas } from '../hooks/useVentas';
import VentasClienteCard from '../components/ventas/VentasClienteCard';
import VentasProductoCard from '../components/ventas/VentasProductoCard';
import VentasTicketCard from '../components/ventas/VentasTicketCard';
import VentasHistorialTable from '../components/ventas/VentasHistorialTable';
import ModalConfirmarAnulacion from '../components/ventas/ModalConfirmarAnulacion';

export default function Ventas() {
  const {
    clientes,
    catalogo,
    historial,
    historialFiltrado,
    historialPaginado,
    loading,
    saving,
    error,
    setError,
    showToast,
    clienteId,
    setClienteId,
    itemActual,
    setItemActual,
    carrito,
    metodoPago,
    esPendiente,
    setEsPendiente,
    fechaVencimiento,
    setFechaVencimiento,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    itemsPorPagina,
    setItemsPorPagina,
    busquedaHistorial,
    setBusquedaHistorial,
    filtroCliente,
    setFiltroCliente,
    filtroEstadoPago,
    setFiltroEstadoPago,
    filtroFechaDesde,
    setFiltroFechaDesde,
    filtroFechaHasta,
    setFiltroFechaHasta,
    limpiarFiltros,
    totalDia,
    totalFactura,
    handleProductoChange,
    handleTipoPrecioChange,
    handleAgregarAlCarrito,
    handleEliminarItemCarrito,
    handleSeleccionarMetodoPago,
    handleAsignarConsumidorFinal,
    handleConfirmarVenta,
    cancelarVenta,
    reservasCliente,
  handleCargarReservaAlTicket
  } = useVentas();

  const [ventaParaAnular, setVentaParaAnular] = useState(null);

  const handleConfirmarAnulacionModal = async (id_venta) => {
    const ok = await cancelarVenta(id_venta);
    if (ok) {
      setVentaParaAnular(null);
    }
  };

  return (
    <div className="page-container dashboard-page">
      <header className="page-header">
        <div>
          <h2>Punto de Venta y Facturación</h2>
          <p>Emisión de comprobantes, control de crédito y caja diaria.</p>
        </div>
        <div className="header-badge">
          <ShoppingCart size={14} />
          Facturado Hoy: ${Number(totalDia || 0).toLocaleString('es-AR')}
        </div>
      </header>

      {showToast && (
        <div className="demo-toast">
          <CheckCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Operación procesada exitosamente.
        </div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Layout en 2 Columnas de tu CSS original (.ventas-layout-grid) ── */}
      <div className="ventas-layout-grid" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <VentasClienteCard
            clientes={clientes}
            clienteId={clienteId}
            setClienteId={setClienteId}
            onAsignarConsumidorFinal={handleAsignarConsumidorFinal}
          />

          <VentasProductoCard
            catalogo={catalogo}
            itemActual={itemActual}
            onProductoChange={handleProductoChange}
            onTipoPrecioChange={handleTipoPrecioChange}
            setItemActual={setItemActual}
            onAgregar={handleAgregarAlCarrito}
          />
        </div>

        <div>
          <VentasTicketCard
  carrito={carrito}
  totalFactura={totalFactura}
  metodoPago={metodoPago}
  onSeleccionarMetodoPago={handleSeleccionarMetodoPago}
  esPendiente={esPendiente}
  setEsPendiente={setEsPendiente}
  fechaVencimiento={fechaVencimiento}
  setFechaVencimiento={setFechaVencimiento}
  onEliminarItem={handleEliminarItemCarrito}
  onConfirmar={handleConfirmarVenta}
  disabledSubmit={saving || carrito.length === 0 || !clienteId}
  saving={saving}
  reservasCliente={reservasCliente}                
  onCargarReserva={handleCargarReservaAlTicket}    
/>
        </div>
      </div>

      {/* Historial con filtros */}
      <VentasHistorialTable
        historialFiltrado={historialFiltrado}
        historialPaginado={historialPaginado}
        clientes={clientes}
        loading={loading}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        itemsPorPagina={itemsPorPagina}
        setItemsPorPagina={setItemsPorPagina}
        busqueda={busquedaHistorial}
        setBusqueda={setBusquedaHistorial}
        filtroCliente={filtroCliente}
        setFiltroCliente={setFiltroCliente}
        filtroEstado={filtroEstadoPago}
        setFiltroEstado={setFiltroEstadoPago}
        fechaDesde={filtroFechaDesde}
        setFechaDesde={setFiltroFechaDesde}
        fechaHasta={filtroFechaHasta}
        setFechaHasta={setFiltroFechaHasta}
        onLimpiarFiltros={limpiarFiltros}
        onCancelarVenta={(id_venta) => {
          const v = historial.find(item => item.id_venta === id_venta);
          if (v) setVentaParaAnular(v);
        }}
        saving={saving}
      />

      {/* Modal de Anulación corporativo */}
      <ModalConfirmarAnulacion
        venta={ventaParaAnular}
        onClose={() => setVentaParaAnular(null)}
        onConfirm={handleConfirmarAnulacionModal}
        saving={saving}
      />
    </div>
  );
}