// src/pages/Dashboard.jsx
import { AlertCircle } from 'lucide-react';
import '../styles/dashboard.css';

import { useDashboard } from '../hooks/useDashboard';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardKpis from '../components/dashboard/DashboardKpis';
import DashboardMediosPago from '../components/dashboard/DashboardMediosPago';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardTable from '../components/dashboard/DashboardTable';

export default function Dashboard() {
  const {
    loading,
    error,
    tipoFiltro,
    setTipoFiltro,
    hoyStr,
    fechaSeleccionada,
    setFechaSeleccionada,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    metricas,
    tendencia7d,
    maxBar,
    ultimasVentas,
    ventasPaginadas,
    exportarCSV
  } = useDashboard();

  return (
    <div className="page-container dashboard-page">
      <DashboardHeader
        tipoFiltro={tipoFiltro}
        setTipoFiltro={setTipoFiltro}
        fechaSeleccionada={fechaSeleccionada}
        setFechaSeleccionada={setFechaSeleccionada}
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        fechaFin={fechaFin}
        setFechaFin={setFechaFin}
        hoyStr={hoyStr}
        onExportCSV={exportarCSV}
        onPrint={() => window.print()}
      />

      {loading && (
        <div className="dash-loading">
          <div className="loading-spinner" />
          <p>Consolidando arqueo de caja y estados de cobro...</p>
        </div>
      )}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <DashboardKpis metricas={metricas} />
          <DashboardMediosPago pagos={metricas.pagos} />
          <DashboardCharts
            tendencia7d={tendencia7d}
            maxBar={maxBar}
            hoyStr={hoyStr}
            metricas={metricas}
          />
          <DashboardTable
            ultimasVentas={ultimasVentas}
            ventasPaginadas={ventasPaginadas}
            paginaActual={paginaActual}
            setPaginaActual={setPaginaActual}
            totalPaginas={totalPaginas}
          />
        </>
      )}
    </div>
  );
}