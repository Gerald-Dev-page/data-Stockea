// src/pages/Ventas.jsx
import { TrendingUp, AlertCircle } from 'lucide-react';
import '../styles/ventas.css';

import { useVentas } from '../hooks/useVentas';
import VentasClienteCard from '../components/ventas/VentasClienteCard';
import VentasProductoCard from '../components/ventas/VentasProductoCard';
import VentasTicketCard from '../components/ventas/VentasTicketCard';
import VentasHistorialTable from '../components/ventas/VentasHistorialTable';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function Ventas() {
  const {
    clientes,
    catalogo,
    historial,
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
    historialPaginado,
    totalDia,
    totalFactura,
    handleProductoChange,
    handleTipoPrecioChange,
    handleAgregarAlCarrito,
    handleEliminarItemCarrito,
    handleSeleccionarMetodoPago,
    handleAsignarConsumidorFinal,
    handleConfirmarVenta
  } = useVentas();

  return (
    <div className="page-container dashboard-page">
      <header className="page-header">
        <div>
          <h2>Punto de Venta</h2>
          <p>Facturación con escalas mayoristas, medios de cobro y registro de cuentas corrientes.</p>
        </div>
        <div className="header-badge">
          <TrendingUp size={14} />
          {formatPrice(totalDia)} facturado hoy
        </div>
      </header>

      {showToast && (
        <div className="demo-toast">
          ✓ Venta registrada con éxito en el sistema.
        </div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="ventas-layout-grid">
        {/* Panel Izquierdo */}
        <div>
          <VentasClienteCard
            clientes={clientes}
            clienteId={clienteId}
            setClienteId={setClienteId}
            onConsumidorFinal={handleAsignarConsumidorFinal}
            saving={saving}
          />
          <VentasProductoCard
            catalogo={catalogo}
            itemActual={itemActual}
            setItemActual={setItemActual}
            onProductoChange={handleProductoChange}
            onTipoPrecioChange={handleTipoPrecioChange}
            onAgregar={handleAgregarAlCarrito}
            saving={saving}
          />
        </div>

        {/* Panel Derecho */}
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
          disabledSubmit={saving || !clienteId || carrito.length === 0}
          saving={saving}
        />
      </div>

      {/* Historial */}
      <VentasHistorialTable
        historial={historial}
        historialPaginado={historialPaginado}
        loading={loading}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
      />
    </div>
  );
}