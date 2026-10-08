// src/hooks/useVentas.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;

export function useVentas() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [userId, setUserId] = useState(null);

  // Estados del POS
  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [reservasCliente, setReservasCliente] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);

  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo', 'transferencia', 'cuenta_corriente', 'mixto'
  const [esPendiente, setEsPendiente] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // ── Nuevos Campos de Operatoria Comercial ──
  const [observaciones, setObservaciones] = useState('');
  const [pagoMixto, setPagoMixto] = useState({
    efectivo: '',
    transferencia: '',
    cta_cte: ''
  });
  const [interesPorcentaje, setInteresPorcentaje] = useState(0);

  const [itemActual, setItemActual] = useState({
    id_producto: '',
    tipo_precio: 'minorista',
    cantidad: 1,
    precio_unitario: 0
  });

  // Filtros del historial
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resClientes, resProd, resHistorial] = await Promise.all([
        supabase
          .from('clientes')
          .select('id_cliente, nombre_razon_social, saldo_deudor')
          .order('nombre_razon_social', { ascending: true }),

        supabase
          .from('productos')
          .select('id_producto, sku, nombre, precio_venta, precio_mayorista, precio_mayorista_1, precio_mayorista_2, precio_mayorista_3, stock_actual, stock_reservado, activo, categorias(nombre)')
          .eq('activo', true)
          .order('nombre', { ascending: true }),

        supabase
          .from('ventas')
          .select(`
            id_venta,
            creado_en,
            total,
            metodo_pago,
            estado_pago,
            fecha_vencimiento,
            observaciones,
            pago_mixto,
            interes_porcentaje,
            monto_interes,
            cliente_id,
            clientes ( nombre_razon_social ),
            perfiles ( nombre_completo ),
            ventas_detalle (
              cantidad,
              productos ( nombre )
            )
          `)
          .order('creado_en', { ascending: false })
          .limit(200)
      ]);

      if (resClientes.error) throw resClientes.error;
      if (resProd.error) throw resProd.error;
      if (resHistorial.error) throw resHistorial.error;

      setClientes(resClientes.data || []);
      setCatalogo(resProd.data || []);
      setHistorial(resHistorial.data || []);
    } catch (err) {
      console.error(err);
      setError("Error al sincronizar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!clienteId) {
      setReservasCliente([]);
      return;
    }

    const fetchReservasCliente = async () => {
      try {
        setCargandoReservas(true);
        const { data, error: errRes } = await supabase
          .from('stock_reservas')
          .select(`
            id_reserva,
            producto_id,
            cantidad,
            estado,
            productos ( id_producto, sku, nombre, precio_venta, stock_actual, stock_reservado )
          `)
          .eq('cliente_id', clienteId)
          .eq('estado', 'activa');

        if (errRes) throw errRes;
        setReservasCliente(data || []);
      } catch (err) {
        console.error("Error al obtener reservas del cliente:", err);
      } finally {
        setCargandoReservas(false);
      }
    };

    fetchReservasCliente();
  }, [clienteId]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busquedaHistorial, filtroCliente, filtroEstadoPago, filtroFechaDesde, filtroFechaHasta, itemsPorPagina]);

  const resolverPrecio = (prod, tipo) => {
    if (!prod) return 0;
    if (tipo === 'minorista') return Number(prod.precio_venta || 0);
    if (tipo === 'mayorista_1') return Number(prod.precio_mayorista_1 || prod.precio_mayorista || 0);
    if (tipo === 'mayorista_2') return Number(prod.precio_mayorista_2 || prod.precio_mayorista_1 || prod.precio_venta || 0);
    if (tipo === 'mayorista_3') return Number(prod.precio_mayorista_3 || prod.precio_mayorista_1 || prod.precio_venta || 0);
    return Number(prod.precio_venta || 0);
  };

  const handleProductoChange = (id) => {
    const prod = catalogo.find(p => String(p.id_producto) === String(id));
    if (!prod) {
      setItemActual({ id_producto: '', tipo_precio: 'minorista', cantidad: 1, precio_unitario: 0 });
      return;
    }
    const precio = resolverPrecio(prod, itemActual.tipo_precio);
    setItemActual(prev => ({ ...prev, id_producto: id, precio_unitario: precio }));
  };

  const handleTipoPrecioChange = (tipo) => {
    const prod = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));
    const precio = resolverPrecio(prod, tipo);
    setItemActual(prev => ({ ...prev, tipo_precio: tipo, precio_unitario: precio }));
  };

  const handleAgregarAlCarrito = () => {
    const cantNumerica = parseInt(itemActual.cantidad, 10);
    if (!itemActual.id_producto || isNaN(cantNumerica) || cantNumerica <= 0) return;

    const prod = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));
    if (!prod) return;

    const yaEnCarrito = carrito.find(i => String(i.id_producto) === String(prod.id_producto));
    const cantidadTotal = (yaEnCarrito?.cantidad || 0) + cantNumerica;

    if (cantidadTotal > prod.stock_actual) {
      setError(`Stock insuficiente para "${prod.nombre}". Físico: ${prod.stock_actual} u.`);
      return;
    }

    setError(null);
    const etiquetaTipo = {
      minorista: 'Minorista',
      mayorista_1: 'Mayorista 1',
      mayorista_2: 'Mayorista 2',
      mayorista_3: 'Mayorista 3'
    }[itemActual.tipo_precio];

    if (yaEnCarrito) {
      setCarrito(carrito.map(i => String(i.id_producto) === String(prod.id_producto)
        ? { ...i, cantidad: i.cantidad + cantNumerica, total: (i.cantidad + cantNumerica) * i.precio_unitario }
        : i
      ));
    } else {
      setCarrito([...carrito, {
        id_producto: prod.id_producto,
        sku: prod.sku,
        nombre: prod.nombre,
        tipo_precio: etiquetaTipo,
        cantidad: cantNumerica,
        precio_unitario: itemActual.precio_unitario,
        total: cantNumerica * itemActual.precio_unitario,
        es_reserva: false
      }]);
    }

    setItemActual({ id_producto: '', tipo_precio: itemActual.tipo_precio, cantidad: 1, precio_unitario: 0 });
  };

  const handleCargarReservaAlTicket = (reserva) => {
    const prod = catalogo.find(p => String(p.id_producto) === String(reserva.producto_id)) || reserva.productos;
    if (!prod) return;

    const precio = Number(prod.precio_venta || 0);
    const cant = Number(reserva.cantidad || 1);

    const yaEnCarrito = carrito.find(i => String(i.id_producto) === String(prod.id_producto));
    if (yaEnCarrito) {
      setCarrito(carrito.map(i => String(i.id_producto) === String(prod.id_producto)
        ? { 
            ...i, 
            cantidad: i.cantidad + cant, 
            total: (i.cantidad + cant) * i.precio_unitario,
            id_reserva: reserva.id_reserva,
            es_reserva: true
          }
        : i
      ));
    } else {
      setCarrito(prev => [...prev, {
        id_producto: prod.id_producto,
        sku: prod.sku,
        nombre: prod.nombre,
        tipo_precio: 'Reserva',
        cantidad: cant,
        precio_unitario: precio,
        total: cant * precio,
        id_reserva: reserva.id_reserva,
        es_reserva: true
      }]);
    }

    setReservasCliente(prev => prev.filter(r => r.id_reserva !== reserva.id_reserva));
  };

  const handleEliminarItemCarrito = (id_producto) => {
    setCarrito(carrito.filter(i => String(i.id_producto) !== String(id_producto)));
  };

  const handleSeleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    if (metodo === 'cuenta_corriente') {
      setEsPendiente(true);
    } else if (metodo !== 'mixto') {
      setEsPendiente(false);
    }
  };

  const handleAsignarConsumidorFinal = () => {
    const cf = clientes.find(c => 
      c.nombre_razon_social?.toLowerCase().includes('consumidor') || 
      c.nombre_razon_social?.toLowerCase().includes('final')
    );
    if (cf) {
      setClienteId(cf.id_cliente);
    } else if (clientes.length > 0) {
      setClienteId(clientes[0].id_cliente);
    }
  };

  const subtotalCarrito = carrito.reduce((acc, i) => acc + i.total, 0);

  // Cálculo de importe a financiar y recargo por interés
  const montoAFinanciarBase = useMemo(() => {
    if (metodoPago === 'cuenta_corriente' || esPendiente) {
      return subtotalCarrito;
    }
    if (metodoPago === 'mixto') {
      return Number(pagoMixto.cta_cte || 0);
    }
    return 0;
  }, [metodoPago, esPendiente, subtotalCarrito, pagoMixto.cta_cte]);

  const montoInteres = useMemo(() => {
    const pct = Number(interesPorcentaje || 0);
    if (pct <= 0 || montoAFinanciarBase <= 0) return 0;
    return Math.round((montoAFinanciarBase * pct) / 100);
  }, [montoAFinanciarBase, interesPorcentaje]);

  const totalFactura = subtotalCarrito + montoInteres;

  const handleConfirmarVenta = async () => {
    if (!clienteId) {
      setError("Debe seleccionar un cliente antes de emitir la venta.");
      return;
    }
    if (carrito.length === 0) {
      setError("El carrito debe contener al menos un producto.");
      return;
    }
    if (!userId) {
      setError("Sesión de operador no válida. Reingrese al sistema.");
      return;
    }

    // Validaciones de Pago Mixto
    let montoEfectivo = 0;
    let montoTransf = 0;
    let montoCtaCte = 0;

    if (metodoPago === 'mixto') {
      montoEfectivo = Number(pagoMixto.efectivo || 0);
      montoTransf = Number(pagoMixto.transferencia || 0);
      montoCtaCte = Number(pagoMixto.cta_cte || 0);

      const sumaIngresadaBase = montoEfectivo + montoTransf + montoCtaCte;
      if (Math.abs(sumaIngresadaBase - subtotalCarrito) > 1) {
        setError(`En pago combinado, la suma ($${sumaIngresadaBase}) debe coincidir con el total ($${subtotalCarrito}).`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === String(clienteId));
      const esConsumidorFinal = clienteSeleccionado?.nombre_razon_social?.toLowerCase().includes('consumidor final');

      const tieneDeuda = (metodoPago === 'cuenta_corriente') || esPendiente || (metodoPago === 'mixto' && montoCtaCte > 0);

      if (tieneDeuda && esConsumidorFinal) {
        throw new Error("No se puede otorgar financiación o crédito a Consumidor Final.");
      }

      const estadoPagoFinal = (metodoPago === 'cuenta_corriente' || esPendiente) 
        ? 'pendiente' 
        : (metodoPago === 'mixto' && montoCtaCte > 0) ? 'parcial' : 'pagado';

      // 1. Insertar venta
      const { data: ventaReq, error: errVenta } = await supabase
        .from('ventas')
        .insert([{
          cliente_id: clienteId,
          usuario_id: userId,
          total: totalFactura,
          metodo_pago: metodoPago,
          estado_pago: estadoPagoFinal,
          fecha_vencimiento: tieneDeuda ? fechaVencimiento : null,
          observaciones: observaciones.trim() || null,
          pago_mixto: metodoPago === 'mixto' ? {
            efectivo: montoEfectivo,
            transferencia: montoTransf,
            cta_cte: montoCtaCte + montoInteres
          } : null,
          interes_porcentaje: Number(interesPorcentaje || 0),
          monto_interes: montoInteres
        }])
        .select()
        .single();

      if (errVenta) throw errVenta;

      // 2. Insertar detalles
      const detallesInsert = carrito.map(item => ({
        venta_id: ventaReq.id_venta,
        producto_id: item.id_producto,
        cantidad: item.cantidad,
        precio_historico: item.precio_unitario
      }));

      const { error: errDetalles } = await supabase.from('ventas_detalle').insert(detallesInsert);
      if (errDetalles) throw errDetalles;

      // 3. Descontar stock físico y de reservas
      for (const item of carrito) {
        const prod = catalogo.find(p => String(p.id_producto) === String(item.id_producto));
        const nuevoFisico = (prod?.stock_actual || 0) - item.cantidad;
        const updateData = { stock_actual: nuevoFisico };

        if (item.es_reserva) {
          const nuevoReservado = Math.max(0, (prod?.stock_reservado || 0) - item.cantidad);
          updateData.stock_reservado = nuevoReservado;

          if (item.id_reserva) {
            await supabase
              .from('stock_reservas')
              .update({ estado: 'completada' })
              .eq('id_reserva', item.id_reserva);
          }
        }

        await supabase.from('productos').update(updateData).eq('id_producto', item.id_producto);

        await supabase.from('movimientos_stock').insert([{
          producto_id: item.id_producto,
          usuario_id: userId,
          tipo: 'venta',
          cantidad: -item.cantidad
        }]);
      }

      // 4. Actualizar saldo del cliente según la parte financiada + interés
      if (tieneDeuda && clienteSeleccionado) {
        const saldoPrevio = Number(clienteSeleccionado.saldo_deudor || 0);
        const montoDeudaASumar = metodoPago === 'mixto' 
          ? (montoCtaCte + montoInteres)
          : totalFactura;

        await supabase
          .from('clientes')
          .update({ saldo_deudor: saldoPrevio + montoDeudaASumar })
          .eq('id_cliente', clienteId);
      }

      // Limpiar formulario
      setCarrito([]);
      setClienteId('');
      setReservasCliente([]);
      setMetodoPago('efectivo');
      setEsPendiente(false);
      setObservaciones('');
      setPagoMixto({ efectivo: '', transferencia: '', cta_cte: '' });
      setInteresPorcentaje(0);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      fetchInitialData();
    } catch (err) {
      setError(err.message || "Error al completar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const cancelarVenta = async (id_venta) => {
    setSaving(true);
    setError(null);

    try {
      const { data: ventaTarget, error: errVenta } = await supabase
        .from('ventas')
        .select(`
          id_venta, cliente_id, total, estado_pago, metodo_pago, pago_mixto,
          ventas_detalle ( producto_id, cantidad )
        `)
        .eq('id_venta', id_venta)
        .single();

      if (errVenta) throw errVenta;

      if (ventaTarget.estado_pago === 'cancelado') {
        throw new Error("Esta operación ya fue anulada previamente.");
      }

      for (const item of (ventaTarget.ventas_detalle || [])) {
        const { data: prodActual } = await supabase
          .from('productos')
          .select('stock_actual')
          .eq('id_producto', item.producto_id)
          .single();

        const stockRestituido = (prodActual?.stock_actual || 0) + item.cantidad;

        await supabase
          .from('productos')
          .update({ stock_actual: stockRestituido })
          .eq('id_producto', item.producto_id);

        await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: item.producto_id,
            usuario_id: userId,
            tipo: 'ajuste',
            cantidad: item.cantidad
          }]);
      }

      // Restituir deuda del cliente según el tipo de venta
      if (ventaTarget.cliente_id) {
        let montoARestar = 0;
        if (ventaTarget.estado_pago === 'pendiente') {
          montoARestar = Number(ventaTarget.total || 0);
        } else if (ventaTarget.metodo_pago === 'mixto' && ventaTarget.pago_mixto?.cta_cte) {
          montoARestar = Number(ventaTarget.pago_mixto.cta_cte || 0);
        }

        if (montoARestar > 0) {
          const { data: cli } = await supabase
            .from('clientes')
            .select('saldo_deudor')
            .eq('id_cliente', ventaTarget.cliente_id)
            .single();

          if (cli) {
            const nuevoSaldo = Math.max(0, Number(cli.saldo_deudor || 0) - montoARestar);
            await supabase
              .from('clientes')
              .update({ saldo_deudor: nuevoSaldo })
              .eq('id_cliente', ventaTarget.cliente_id);
          }
        }
      }

      const { error: updVentaErr } = await supabase
        .from('ventas')
        .update({ estado_pago: 'cancelado' })
        .eq('id_venta', id_venta);

      if (updVentaErr) throw updVentaErr;

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      fetchInitialData();
      return true;
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al anular la venta.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const historialFiltrado = useMemo(() => {
    return historial.filter(v => {
      const q = busquedaHistorial.toLowerCase().trim();
      if (q) {
        const clienteNom = (v.clientes?.nombre_razon_social || '').toLowerCase();
        const operadorNom = (v.perfiles?.nombre_completo || '').toLowerCase();
        const tieneArticulo = (v.ventas_detalle || []).some(d =>
          (d.productos?.nombre || '').toLowerCase().includes(q)
        );
        const matchObs = (v.observaciones || '').toLowerCase().includes(q);
        const matchId = String(v.id_venta).toLowerCase().includes(q);

        if (!clienteNom.includes(q) && !operadorNom.includes(q) && !tieneArticulo && !matchObs && !matchId) {
          return false;
        }
      }

      if (filtroCliente !== 'todos' && String(v.cliente_id) !== String(filtroCliente)) {
        return false;
      }

      if (filtroEstadoPago !== 'todos' && v.estado_pago !== filtroEstadoPago) {
        return false;
      }

      const fechaLocal = new Date(v.creado_en);
      const strFecha = `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`;

      if (filtroFechaDesde && strFecha < filtroFechaDesde) return false;
      if (filtroFechaHasta && strFecha > filtroFechaHasta) return false;

      return true;
    });
  }, [historial, busquedaHistorial, filtroCliente, filtroEstadoPago, filtroFechaDesde, filtroFechaHasta]);

  const totalPaginas = Math.ceil(historialFiltrado.length / itemsPorPagina) || 1;
  const historialPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return historialFiltrado.slice(inicio, inicio + itemsPorPagina);
  }, [historialFiltrado, paginaActual, itemsPorPagina]);

  const limpiarFiltros = () => {
    setBusquedaHistorial('');
    setFiltroCliente('todos');
    setFiltroEstadoPago('todos');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setPaginaActual(1);
  };

  const hoyStr = new Date().toISOString().split('T')[0];
  const totalDia = historial
    .filter(v => v.creado_en?.startsWith(hoyStr) && v.estado_pago !== 'cancelado')
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  return {
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
    reservasCliente,
    cargandoReservas,
    handleCargarReservaAlTicket,
    itemActual,
    setItemActual,
    carrito,
    metodoPago,
    esPendiente,
    setEsPendiente,
    fechaVencimiento,
    setFechaVencimiento,
    observaciones,
    setObservaciones,
    pagoMixto,
    setPagoMixto,
    interesPorcentaje,
    setInteresPorcentaje,
    montoAFinanciarBase,
    montoInteres,
    subtotalCarrito,
    totalFactura,
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
    handleProductoChange,
    handleTipoPrecioChange,
    handleAgregarAlCarrito,
    handleEliminarItemCarrito,
    handleSeleccionarMetodoPago,
    handleAsignarConsumidorFinal,
    handleConfirmarVenta,
    cancelarVenta
  };
}