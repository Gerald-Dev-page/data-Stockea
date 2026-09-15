// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import {
  TrendingUp, TrendingDown, DollarSign,
  ShoppingCart, Package, BarChart2,
  FileDown, Calendar, AlertCircle, UserCheck,
  Banknote, Landmark, CreditCard, FileSpreadsheet,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import '../styles/dashboard.css';

const toDateStr = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatPrice = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const CHART_COLORS = ['#C9A227', '#2A5A96', '#2E7D5B', '#8B5CF6', '#C98A27', '#0284C7', '#B3402A'];

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tipoFiltro, setTipoFiltro] = useState('dia');
  const hoyStr = toDateStr(new Date());
  const primerDiaMes = toDateStr(new Date(new Date().setDate(1)));
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  // Control de paginado
  const [paginaActual, setPaginaActual] = useState(1);

  // Resetear paginado al cambiar cualquier filtro de fecha
  useEffect(() => {
    setPaginaActual(1);
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let diasRango = 1;
      let fechaInicioFiltro = new Date(fechaSeleccionada);
      
      if (tipoFiltro === 'rango') {
        fechaInicioFiltro = new Date(fechaInicio);
        diasRango = Math.max(1, Math.round((new Date(fechaFin) - new Date(fechaInicio)) / 86400000) + 1);
      }
      
      const fechaInicioAnterior = new Date(fechaInicioFiltro);
      fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - diasRango);
      
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      
      const minDate = new Date(Math.min(fechaInicioAnterior, sieteDiasAtras));
      minDate.setHours(0, 0, 0, 0);

      const { data, error: errSupabase } = await supabase
        .from('ventas')
        .select(`
          id_venta,
          creado_en,
          total,
          metodo_pago,
          clientes ( nombre_razon_social ),
          perfiles ( nombre_completo ),
          ventas_detalle (
            cantidad,
            productos (
              nombre,
              categorias ( nombre )
            )
          )
        `)
        .gte('creado_en', minDate.toISOString())
        .order('creado_en', { ascending: false });

      if (errSupabase) throw errSupabase;

      const ventasFormateadas = (data || []).map(v => {
        const fechaLocal = new Date(v.creado_en);
        const detalles = v.ventas_detalle || [];
        
        let totalUnidades = 0;
        const categoriasCount = {};
        let productoResumen = 'Sin productos';

        if (detalles.length > 0) {
          productoResumen = detalles[0].productos?.nombre || 'Desconocido';
          if (detalles.length > 1) productoResumen += ` (+${detalles.length - 1})`;
          
          detalles.forEach(d => {
            const catName = d.productos?.categorias?.nombre || 'Sin categoría';
            categoriasCount[catName] = (categoriasCount[catName] || 0) + d.cantidad;
            totalUnidades += d.cantidad;
          });
        }

        return {
          id_venta: v.id_venta,
          fecha: toDateStr(fechaLocal),
          hora: fechaLocal.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          cliente: v.clientes?.nombre_razon_social || 'Consumidor Final',
          operador: v.perfiles?.nombre_completo || 'Operador',
          metodo_pago: v.metodo_pago || 'efectivo',
          total: Number(v.total),
          totalUnidades,
          categoriasCount,
          productoResumen
        };
      });

      setVentas(ventasFormateadas);
    } catch (err) {
      console.error("Error al cargar métricas:", err.message);
      setError("No se pudieron cargar los datos del panel analítico.");
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metricas = useMemo(() => {
    const enRango = (fechaStr) => tipoFiltro === 'dia'
      ? fechaStr === fechaSeleccionada
      : fechaStr >= fechaInicio && fechaStr <= fechaFin;

    const diasRango = tipoFiltro === 'dia' ? 1
      : Math.max(1, Math.round((new Date(fechaFin) - new Date(fechaInicio)) / 86400000) + 1);

    const inicioAnterior = new Date(tipoFiltro === 'dia' ? fechaSeleccionada : fechaInicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasRango);
    const finAnterior = new Date(tipoFiltro === 'dia' ? fechaSeleccionada : fechaFin);
    finAnterior.setDate(finAnterior.getDate() - diasRango);
    
    const inicioAntStr = toDateStr(inicioAnterior);
    const finAntStr = toDateStr(finAnterior);
    const enRangoAnterior = (f) => f >= inicioAntStr && f <= finAntStr;

    let ingresos = 0, ingresosAnt = 0, ingresosHoy = 0;
    let transacciones = 0, transaccionesAnt = 0;
    const porCategoria = {};
    const pagos = { efectivo: 0, transferencia: 0, cuenta_corriente: 0 };

    ventas.forEach(v => {
      if (v.fecha === hoyStr) ingresosHoy += v.total;
      
      if (enRango(v.fecha)) {
        ingresos += v.total;
        transacciones += 1;

        const metodo = v.metodo_pago || 'efectivo';
        pagos[metodo] = (pagos[metodo] || 0) + v.total;

        Object.entries(v.categoriasCount).forEach(([cat, cant]) => {
          porCategoria[cat] = (porCategoria[cat] || 0) + cant;
        });
      }
      
      if (enRangoAnterior(v.fecha)) {
        ingresosAnt += v.total;
        transaccionesAnt += 1;
      }
    });

    const pctIngresos = ingresosAnt > 0 ? Math.round(((ingresos - ingresosAnt) / ingresosAnt) * 100) : null;
    const pctTrans = transaccionesAnt > 0 ? Math.round(((transacciones - transaccionesAnt) / transaccionesAnt) * 100) : null;
    const totalUnidades = Object.values(porCategoria).reduce((a, b) => a + b, 0) || 1;

    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      ingresosHoy, ingresos, pctIngresos,
      transacciones, pctTrans,
      ticketPromedio: transacciones > 0 ? Math.round(ingresos / transacciones) : 0,
      categoriasOrdenadas, totalUnidades,
      pagos
    };
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin, hoyStr]);

  const tendencia7d = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const str = toDateStr(d);
      
      const total = ventas
        .filter(v => v.fecha === str)
        .reduce((a, v) => a + v.total, 0);
      
      const label = d.toLocaleDateString('es-AR', { weekday: 'short' });
      return { str, total, label };
    });
  }, [ventas]);

  const maxBar = Math.max(...tendencia7d.map(d => d.total), 1);

  const ultimasVentas = useMemo(() => {
    const enRango = (f) => tipoFiltro === 'dia'
      ? f === fechaSeleccionada
      : f >= fechaInicio && f <= fechaFin;
    return ventas.filter(v => enRango(v.fecha));
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  // Paginado en memoria
  const totalPaginas = Math.ceil(ultimasVentas.length / ITEMS_PER_PAGE) || 1;

  const ventasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return ultimasVentas.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [ultimasVentas, paginaActual]);

  const exportarCSV = () => {
    if (ultimasVentas.length === 0) return;
    const headers = ["ID Venta", "Fecha", "Hora", "Operador", "Cliente", "Articulos", "Unidades", "Medio de Pago", "Total"];
    const rows = ultimasVentas.map(v => [
      v.id_venta,
      v.fecha,
      v.hora,
      `"${v.operador}"`,
      `"${v.cliente}"`,
      `"${v.productoResumen}"`,
      v.totalUnidades,
      v.metodo_pago,
      v.total
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${tipoFiltro}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <h2>Panel de Rendimiento</h2>
          <p>Métricas de facturación, volumen transaccional e inventario en tiempo real.</p>
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

          <button className="btn-export no-print" onClick={exportarCSV} title="Descargar planilla CSV">
            <FileSpreadsheet size={14} /> Exportar Excel
          </button>

          <button className="btn-export no-print" onClick={() => window.print()} title="Imprimir reporte">
            <FileDown size={14} /> Imprimir PDF
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Consolidando métricas operativas...
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
          {/* ── KPIs Generales ── */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-highlight">
              <div className="kpi-icon"><DollarSign size={18} /></div>
              <div className="kpi-label">Ingresos del Día</div>
              <div className="kpi-value">{formatPrice(metricas.ingresosHoy)}</div>
              <div className="kpi-sub">Cierre diario 23:59 hs</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-blue"><TrendingUp size={18} /></div>
              <div className="kpi-label">Facturación del Período</div>
              <div className="kpi-value">{formatPrice(metricas.ingresos)}</div>
              {metricas.pctIngresos !== null && (
                <div className={`kpi-badge ${metricas.pctIngresos >= 0 ? 'badge-up' : 'badge-down'}`}>
                  {metricas.pctIngresos >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(metricas.pctIngresos)}% vs ciclo anterior
                </div>
              )}
            </div>

            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-green"><ShoppingCart size={18} /></div>
              <div className="kpi-label">Transacciones</div>
              <div className="kpi-value">{metricas.transacciones}</div>
              <div className="kpi-sub">Ticket promedio: {formatPrice(metricas.ticketPromedio)}</div>
              {metricas.pctTrans !== null && (
                <div className={`kpi-badge ${metricas.pctTrans >= 0 ? 'badge-up' : 'badge-down'}`}>
                  {metricas.pctTrans >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(metricas.pctTrans)}% vs ciclo anterior
                </div>
              )}
            </div>
          </div>

          {/* ── Desglose de Medios de Pago (Arqueo de Caja) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="stat-icon" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                <Banknote size={18} />
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Efectivo en Caja
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(metricas.pagos.efectivo)}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="stat-icon" style={{ background: 'rgba(42, 90, 150, 0.15)', color: '#6EA8FE' }}>
                <Landmark size={18} />
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Transferencias
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(metricas.pagos.transferencia)}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="stat-icon" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24' }}>
                <CreditCard size={18} />
              </span>
              <div>
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  A Cobrar (Cta. Cte.)
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-heading)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(metricas.pagos.cuenta_corriente)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Visualización de Tendencias y Categorías ── */}
          <div className="dash-modules">
            <div className="dash-module module-wide">
              <div className="module-header">
                <h3><BarChart2 size={16} style={{ color: 'var(--color-accent)' }} /> Facturación Diaria (Últimos 7 días)</h3>
              </div>
              <div className="bar-chart">
                {tendencia7d.map((d) => {
                  const pct = Math.round((d.total / maxBar) * 100);
                  const esHoy = d.str === hoyStr;
                  return (
                    <div className="bar-col" key={d.str}>
                      <div className="bar-amount">{d.total > 0 ? formatPrice(d.total) : '—'}</div>
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${esHoy ? 'bar-fill-today' : ''}`}
                          style={{ height: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                      <div className={`bar-label ${esHoy ? 'bar-label-today' : ''}`}>
                        {d.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dash-module">
              <div className="module-header">
                <h3><Package size={16} style={{ color: 'var(--color-accent)' }} /> Ventas por Categoría</h3>
              </div>
              <div className="cat-list">
                {metricas.categoriasOrdenadas.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                    Sin transacciones en el rango.
                  </div>
                ) : (
                  metricas.categoriasOrdenadas.map((cat, i) => {
                    const pct = Math.round((cat.cantidad / metricas.totalUnidades) * 100);
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <div className="cat-row" key={cat.nombre}>
                        <div className="cat-info">
                          <span className="cat-dot" style={{ background: color }} />
                          <span className="cat-name">{cat.nombre}</span>
                          <span className="cat-units">{cat.cantidad} u.</span>
                        </div>
                        <div className="cat-bar-track">
                          <div className="cat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="cat-pct">{pct}%</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Tabla de Operaciones ── */}
          <div className="card table-card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="table-title" style={{ margin: 0 }}>
                <Calendar size={15} style={{ color: 'var(--color-accent)' }} /> 
                Operaciones del Período
              </h3>
              <span className="table-count">{ultimasVentas.length} transacciones</span>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Operador</th>
                    <th>Cliente</th>
                    <th>Resumen Artículos</th>
                    <th>Medio</th>
                    <th>Unidades</th>
                    <th>Total Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVentas.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2.5rem' }}>
                        No hay ventas registradas en el período seleccionado.
                      </td>
                    </tr>
                  ) : ventasPaginadas.map(v => (
                    <tr key={v.id_venta}>
                      <td><span className="hora-badge">{v.hora}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                          <UserCheck size={13} style={{ color: 'var(--color-accent)' }} />
                          {v.operador}
                        </span>
                      </td>
                      <td className="td-nombre">{v.cliente}</td>
                      <td className="td-muted">{v.productoResumen}</td>
                      <td>
                        <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                          {v.metodo_pago}
                        </span>
                      </td>
                      <td className="td-muted">{v.totalUnidades}</td>
                      <td className="td-precio">{formatPrice(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Control de Paginado ── */}
            {ultimasVentas.length > 0 && (
              <div className="pagination-container no-print">
                <div className="pagination-info">
                  Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, ultimasVentas.length)}</strong> de <strong>{ultimasVentas.length}</strong> operaciones
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
        </>
      )}
    </div>
  );
}