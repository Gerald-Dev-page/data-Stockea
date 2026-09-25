// src/hooks/useDashboard.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;
export const CHART_COLORS = ['#C9A227', '#2A5A96', '#2E7D5B', '#8B5CF6', '#C98A27', '#0284C7', '#B3402A'];

export const toDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export function useDashboard() {
  const [ventas, setVentas] = useState([]);
  const [pagosDeuda, setPagosDeuda] = useState([]);
  const [clientesDeudaTotal, setClientesDeudaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hoy = new Date();
  const hoyStr = toDateStr(hoy);
  const primerDiaMes = toDateStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const [tipoFiltro, setTipoFiltro] = useState('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyStr);
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  const [filtroEstadoOperacion, setFiltroEstadoOperacion] = useState('todos');
  const [busquedaOperacion, setBusquedaOperacion] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    setPaginaActual(1);
  }, [tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin, filtroEstadoOperacion, busquedaOperacion]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaCorte = new Date();
      fechaCorte.setDate(fechaCorte.getDate() - 30);
      fechaCorte.setHours(0, 0, 0, 0);

      const [resVentas, resClientes, resPagos] = await Promise.all([
        supabase
          .from('ventas')
          .select(`
            id_venta,
            creado_en,
            total,
            metodo_pago,
            estado_pago,
            fecha_vencimiento,
            cliente_id,
            clientes ( id_cliente, nombre_razon_social, saldo_deudor ),
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
          .order('creado_en', { ascending: false }),

        supabase
          .from('clientes')
          .select('saldo_deudor'),

        supabase
          .from('pagos_clientes')
          .select('id_pago, monto, metodo_pago, creado_en, cliente_id')
          .gte('creado_en', fechaCorte.toISOString())
      ]);

      if (resVentas.error) throw resVentas.error;
      if (resPagos.error) console.warn("Aviso tabla pagos_clientes:", resPagos.error);

      const saldoTotalDeudores = (resClientes.data || []).reduce((acc, c) => acc + Number(c.saldo_deudor || 0), 0);
      setClientesDeudaTotal(saldoTotalDeudores);

      const pagosFormateados = (resPagos.data || []).map(p => {
        const f = new Date(p.creado_en);
        return {
          id_pago: p.id_pago,
          fecha: toDateStr(f),
          monto: Number(p.monto || 0),
          metodo_pago: p.metodo_pago || 'efectivo'
        };
      });
      setPagosDeuda(pagosFormateados);

      const ventasFormateadas = (resVentas.data || []).map(v => {
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
          fechaVisual: fechaLocal.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          hora: fechaLocal.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          cliente: v.clientes?.nombre_razon_social || 'Consumidor Final',
          saldoDeudorCliente: Number(v.clientes?.saldo_deudor || 0),
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

    let cobradoContado = 0;
    let cobradoDeudas = 0;
    let transaccionesValidas = 0;
    let cobradoAnt = 0;
    const porCategoria = {};
    const pagos = { efectivo: 0, transferencia: 0, cuenta_corriente: 0 };

    // 1. Ventas del período (excluyendo canceladas y pendientes)
    ventas.forEach(v => {
      if (v.estado_pago === 'cancelado') return;

      if (enRango(v.fecha)) {
        transaccionesValidas += 1;

        if (v.estado_pago !== 'pendiente') {
          cobradoContado += v.total;
          const metodo = v.metodo_pago || 'efectivo';
          pagos[metodo] = (pagos[metodo] || 0) + v.total;
        }

        Object.entries(v.categoriasCount).forEach(([cat, cant]) => {
          porCategoria[cat] = (porCategoria[cat] || 0) + cant;
        });
      }

      if (enRangoAnterior(v.fecha)) {
        if (v.estado_pago !== 'pendiente') {
          cobradoAnt += v.total;
        }
      }
    });

    // 2. Pagos de deudas recibidos en el período (entran a la caja)
    pagosDeuda.forEach(p => {
      if (enRango(p.fecha)) {
        cobradoDeudas += p.monto;
        const metodo = p.metodo_pago || 'efectivo';
        pagos[metodo] = (pagos[metodo] || 0) + p.monto;
      }
      if (enRangoAnterior(p.fecha)) {
        cobradoAnt += p.monto;
      }
    });

    // Caja total = Ventas contado ($15.000) + Cobros de deudas recibidos ($5.000) = $20.000
    const ingresosTotales = cobradoContado + cobradoDeudas;
    const deudaPendienteReal = Number(clientesDeudaTotal || 0);

    pagos.cuenta_corriente = deudaPendienteReal;

    const pctIngresos = cobradoAnt > 0 ? Math.round(((ingresosTotales - cobradoAnt) / cobradoAnt) * 100) : null;
    const totalUnidades = Object.values(porCategoria).reduce((a, b) => a + b, 0) || 1;

    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      ingresosTotales,                          // Refleja $20.000
      cobradoReal: ingresosTotales,             // Caja total en mano/bancos
      deudaPendiente: deudaPendienteReal,       // Deuda restante real: $5.000
      pctIngresos,
      transacciones: transaccionesValidas,
      ticketPromedio: transaccionesValidas > 0 ? Math.round(cobradoContado / transaccionesValidas) : 0,
      categoriasOrdenadas,
      totalUnidades,
      pagos
    };
  }, [ventas, pagosDeuda, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin, clientesDeudaTotal]);

  const tendencia7d = useMemo(() => {
    const fechaBase = parseLocalDate(tipoFiltro === 'dia' ? fechaSeleccionada : hoyStr);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(fechaBase);
      d.setDate(d.getDate() - (6 - i));
      const str = toDateStr(d);

      const totalVentas = ventas
        .filter(v => v.fecha === str && v.estado_pago !== 'pendiente' && v.estado_pago !== 'cancelado')
        .reduce((a, v) => a + v.total, 0);

      const totalPagos = pagosDeuda
        .filter(p => p.fecha === str)
        .reduce((a, p) => a + p.monto, 0);

      const total = totalVentas + totalPagos;
      const label = d.toLocaleDateString('es-AR', { weekday: 'short' });
      return { str, total, label };
    });
  }, [ventas, pagosDeuda, tipoFiltro, fechaSeleccionada, hoyStr]);

  const maxBar = Math.max(...tendencia7d.map(d => d.total), 1);

  const ultimasVentas = useMemo(() => {
    const enRango = (f) => {
      if (tipoFiltro === 'dia') return f === fechaSeleccionada;
      return f >= fechaInicio && f <= fechaFin;
    };

    return ventas.filter(v => {
      if (!enRango(v.fecha)) return false;

      if (filtroEstadoOperacion !== 'todos' && v.estado_pago !== filtroEstadoOperacion) {
        return false;
      }

      if (busquedaOperacion.trim()) {
        const query = busquedaOperacion.toLowerCase();
        const matchCliente = v.cliente.toLowerCase().includes(query);
        const matchOperador = v.operador.toLowerCase().includes(query);
        const matchArticulo = v.productoResumen.toLowerCase().includes(query);
        if (!matchCliente && !matchOperador && !matchArticulo) return false;
      }

      return true;
    });
  }, [ventas, tipoFiltro, fechaSeleccionada, fechaInicio, fechaFin, filtroEstadoOperacion, busquedaOperacion]);

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
      v.fechaVisual,
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
    filtroEstadoOperacion,
    setFiltroEstadoOperacion,
    busquedaOperacion,
    setBusquedaOperacion,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    metricas,
    tendencia7d,
    maxBar,
    ultimasVentas,
    ventasPaginadas,
    exportarCSV,
    recargarDashboard: fetchDashboardData
  };
}