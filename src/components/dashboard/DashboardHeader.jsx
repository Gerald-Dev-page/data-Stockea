// src/components/dashboard/DashboardHeader.jsx
import { FileSpreadsheet, FileDown } from 'lucide-react';

export default function DashboardHeader({
  tipoFiltro,
  setTipoFiltro,
  fechaSeleccionada,
  setFechaSeleccionada,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  hoyStr,
  onExportCSV,
  onPrint
}) {
  return (
    <header className="page-header dashboard-header">
      <div>
        <h2>Panel Financiero y Control de Caja</h2>
        <p>Supervisión de liquidez real, facturación general y cuentas corrientes.</p>
      </div>

      <div className="dashboard-controls no-print">
        <select
          className="filtro-selector"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="dia">Día específico</option>
          <option value="rango">Rango de fechas</option>
        </select>

        {tipoFiltro === 'rango' ? (
          <div className="rango-fechas">
            <input 
              type="date" 
              className="fecha-selector"
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
              max={hoyStr} 
            />
            <span className="rango-sep">→</span>
            <input 
              type="date" 
              className="fecha-selector"
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
              max={hoyStr} 
            />
          </div>
        ) : (
          <input 
            type="date" 
            className="fecha-selector"
            value={fechaSeleccionada} 
            onChange={(e) => setFechaSeleccionada(e.target.value)} 
            max={hoyStr} 
          />
        )}

        <button className="btn-export no-print" onClick={onExportCSV} title="Descargar planilla CSV">
          <FileSpreadsheet size={14} /> Exportar Excel
        </button>

        <button className="btn-export no-print" onClick={onPrint} title="Imprimir reporte">
          <FileDown size={14} /> Imprimir PDF
        </button>
      </div>
    </header>
  );
}