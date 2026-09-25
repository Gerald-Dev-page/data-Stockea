// En src/pages/Stock.jsx:
import { Boxes, AlertTriangle, Truck, CheckCircle2 } from 'lucide-react';
import '../styles/stock.css';

import { useStock } from '../hooks/useStock';
import StockKpis from '../components/stock/StockKpis';
import StockTabs from '../components/stock/StockTabs';
import StockTable from '../components/stock/StockTable';
import StockBitacora from '../components/stock/StockBitacora';
import StockModalAjuste from '../components/stock/StockModalAjuste';

export default function Stock() {
  const {
    loading,
    saving,
    error,
    setError,
    successMsg,
    activeTab,
    setActiveTab,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    paginaStock,
    setPaginaStock,
    totalPaginasStock,
    productosFiltrados,
    productosPaginados,
    paginaMovs,
    setPaginaMovs,
    totalPaginasMovs,
    movimientos,
    movimientosPaginados,
    totalFisico,
    totalReservado,
    totalTransito,
    productosBajoStock,
    sinStock,
    selectedProduct,
    setSelectedProduct,
    ajusteForm,
    setAjusteForm,
    openAjusteModal,
    handleConfirmarAjuste,
    arribosPendientes,
    handleConfirmarArribo,
    clientes
  } = useStock();

  return (
    <div className="page-container dashboard-page">
      <header className="page-header">
        <div>
          <h2>Control de Existencias y Logística</h2>
          <p>Auditoría de stock físico, reservas comerciales y mercadería importada en tránsito.</p>
        </div>
        <div className="header-badge">
          <Boxes size={14} />
          {totalFisico} u. físicas totales
        </div>
      </header>

      {/* Notificación de éxito */}
      {successMsg && (
        <div className="demo-toast" style={{ background: 'var(--color-success-soft)', borderColor: 'rgba(46, 125, 91, 0.4)', color: '#5EDBA2' }}>
          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {successMsg}
        </div>
      )}

      {/* Notificación de error */}
      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Banner de Mercadería en Tránsito con Fecha Cumplida ── */}
      {arribosPendientes.length > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {arribosPendientes.map(p => (
            <div 
              key={p.id_producto}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                border: '1px solid rgba(201, 162, 39, 0.5)',
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-sm)',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={20} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-heading)' }}>
                  Llegada programada cumplida: <strong>{p.stock_transito} u.</strong> de <strong>{p.nombre}</strong> ({p.sku}).
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Fecha prevista: {p.fecha_estimada_llegada}
                  </span>
                </span>
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => handleConfirmarArribo(p)}
                style={{ height: '32px', padding: '0 12px', fontSize: '0.76rem' }}
              >
                ¿Llegó el pedido? Confirmar Ingreso
              </button>
            </div>
          ))}
        </div>
      )}

      <StockKpis 
        totalFisico={totalFisico}
        totalReservado={totalReservado}
        totalTransito={totalTransito}
        productosBajoStock={productosBajoStock}
        sinStock={sinStock}
      />

      <StockTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {activeTab === 'existencias' ? (
        <StockTable
          productosPaginados={productosPaginados}
          totalItems={productosFiltrados.length}
          paginaStock={paginaStock}
          setPaginaStock={setPaginaStock}
          totalPaginasStock={totalPaginasStock}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          productosBajoStock={productosBajoStock}
          onOpenAjuste={openAjusteModal}
          loading={loading}
        />
      ) : (
        <StockBitacora
          movimientosPaginados={movimientosPaginados}
          totalItems={movimientos.length}
          paginaMovs={paginaMovs}
          setPaginaMovs={setPaginaMovs}
          totalPaginasMovs={totalPaginasMovs}
          loading={loading}
        />
      )}

      <StockModalAjuste
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        ajusteForm={ajusteForm}
        setAjusteForm={setAjusteForm}
        onSubmit={handleConfirmarAjuste}
        saving={saving}
        clientes={clientes}
      />
    </div>
  );
}