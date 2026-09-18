// src/pages/Stock.jsx
import { Boxes, AlertTriangle } from 'lucide-react';
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
    handleConfirmarAjuste
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

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
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
      />
    </div>
  );
}