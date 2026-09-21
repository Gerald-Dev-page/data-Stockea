// src/hooks/useDashboard.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;
export const CHART_COLORS = ['#C9A227', '#2A5A96', '#2E7D5B', '#8B5CF6', '#C98A27', '#0284C7', '#B3402A'];

// Convierte un objeto Date a 'YYYY-MM-DD' en hora LOCAL (sin desfasaje UTC)
export const toDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parsea 'YYYY-MM-DD' a Date local a las 00:00:00 exactas
export const parseLocalDate = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export function useDashboard() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hoy = new Date();
  const hoyStr = toDateStr(hoy);
  const primerDiaMes = toDateStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const [tipoFiltro, setTipoFiltro] = useState('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    setPaginaActual(1);
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Traemos el historial con un margen de seguridad de 30 días hacia atrás
      // para asegurar que las ventas del mes (como la del día 11) siempre estén en memoria
      const fechaCorte = new Date();
      fechaCorte.setDate(fechaCorte.getDate() - 30);
      fechaCorte.setHours(0, 0, 0, 0);

      const { data, error: errSupabase } = await supabase
        .from('ventas')
        .select(`
          id_venta,
          creado_en,
          total,
          metodo_pago,
          estado_pago,
          fecha_vencimiento,
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
        .gte('creado_en', fechaCorte.toISOString())
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
          estado_pago: v.estado_pago || 'pagado',
          fecha_vencimiento: v.fecha_vencimiento || null,
          total: Number(v.total || 0),
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Cálculo de KPIs y métricas del período
  const metricas = useMemo(() => {
    const enRango = (fechaStr) => {
      if (tipoFiltro === 'dia') return fechaStr === fechaSeleccionada;
      return fechaStr >= fechaInicio && fechaStr <= fechaFin;
    };

    const diasRango = tipoFiltro === 'dia'
      ? 1
      : Math.max(1, Math.round((parseLocalDate(fechaFin) - parseLocalDate(fechaInicio)) / 86400000) + 1);

    const inicioAnterior = parseLocalDate(tipoFiltro === 'dia' ? fechaSeleccionada : fechaInicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasRango);

    const finAnterior = parseLocalDate(tipoFiltro === 'dia' ? fechaSeleccionada : fechaFin);
    finAnterior.setDate(finAnterior.getDate() - diasRango);

    const inicioAntStr = toDateStr(inicioAnterior);
    const finAntStr = toDateStr(finAnterior);
    const enRangoAnterior = (f) => f >= inicioAntStr && f <= finAntStr;

    let ingresosTotales = 0;
    let cobradoReal = 0;
    let deudaPendiente = 0;
    let ingresosAnt = 0;
    let transacciones = 0;
    let transaccionesAnt = 0;
    const porCategoria = {};
    const pagos = { efectivo: 0, transferencia: 0, cuenta_corriente: 0 };

    ventas.forEach(v => {
      if (enRango(v.fecha)) {
        ingresosTotales += v.total;
        transacciones += 1;

        if (v.estado_pago === 'pendiente') {
          deudaPendiente += v.total;
        } else {
          cobradoReal += v.total;
          const metodo = v.metodo_pago || 'efectivo';
          pagos[metodo] = (pagos[metodo] || 0) + v.total;
        }

        if (v.metodo_pago === 'cuenta_corriente') {
          pagos.cuenta_corriente += v.total;
        }

        Object.entries(v.categoriasCount).forEach(([cat, cant]) => {
          porCategoria[cat] = (porCategoria[cat] || 0) + cant;
        });
      }

      if (enRangoAnterior(v.fecha)) {
        ingresosAnt += v.total;
        transaccionesAnt += 1;
      }
    });

    const pctIngresos = ingresosAnt > 0 ? Math.round(((ingresosTotales - ingresosAnt) / ingresosAnt) * 100) : null;
    const totalUnidades = Object.values(porCategoria).reduce((a, b) => a + b, 0) || 1;

    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      ingresosTotales,
      cobradoReal,
      deudaPendiente,
      pctIngresos,
      transacciones,
      ticketPromedio: transacciones > 0 ? Math.round(ingresosTotales / transacciones) : 0,
      categoriasOrdenadas,
      totalUnidades,
      pagos
    };
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  // Gráfico de los últimos 7 días con formato de fecha y timezone seguro
  const tendencia7d = useMemo(() => {
    // Si estamos viendo un día específico del pasado, centramos los 7 días en esa fecha
    const fechaBase = parseLocalDate(tipoFiltro === 'dia' ? fechaSeleccionada : hoyStr);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(fechaBase);
      d.setDate(d.getDate() - (6 - i));
      const str = toDateStr(d);

      const total = ventas
        .filter(v => v.fecha === str && v.estado_pago !== 'pendiente')
        .reduce((a, v) => a + v.total, 0);

      // Nombre del día abreviado en español (lun, mar, mié...)
      const label = d.toLocaleDateString('es-AR', { weekday: 'short' });
      return { str, total, label };
    });
  }, [ventas, tipoFiltro, fechaSeleccionada, hoyStr]);

  const maxBar = Math.max(...tendencia7d.map(d => d.total), 1);

  // Filtro para la tabla de operaciones
  const ultimasVentas = useMemo(() => {
    const enRango = (f) => {
      if (tipoFiltro === 'dia') return f === fechaSeleccionada;
      return f >= fechaInicio && f <= fechaFin;
    };
    return ventas.filter(v => enRango(v.fecha));
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin]);

  const totalPaginas = Math.ceil(ultimasVentas.length / ITEMS_PER_PAGE) || 1;

  const ventasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return ultimasVentas.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [ultimasVentas, paginaActual]);

  const exportarCSV = () => {
    if (ultimasVentas.length === 0) return;
    const headers = ["ID Venta", "Fecha", "Hora", "Operador", "Cliente", "Articulos", "Unidades", "Medio", "Estado Cobro", "Total"];
    const rows = ultimasVentas.map(v => [
      v.id_venta,
      v.fecha,
      v.hora,
      `"${v.operador}"`,
      `"${v.cliente}"`,
      `"${v.productoResumen}"`,
      v.totalUnidades,
      v.metodo_pago,
      v.estado_pago,
      v.total
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${tipoFiltro}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
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
  };
}