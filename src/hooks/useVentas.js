// src/hooks/useVentas.js
import { useState, useEffect, useMemo } from 'react';
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

  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [esPendiente, setEsPendiente] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [paginaActual, setPaginaActual] = useState(1);

  const [itemActual, setItemActual] = useState({
    id_producto: '',
    tipo_precio: 'minorista',
    cantidad: 1,
    precio_unitario: 0
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resClientes, resProd] = await Promise.all([
        supabase.from('clientes').select('id_cliente, nombre_razon_social, saldo_deudor').order('nombre_razon_social', { ascending: true }),
        supabase.from('productos').select('id_producto, sku, nombre, precio_venta, precio_mayorista, precio_mayorista_1, precio_mayorista_2, precio_mayorista_3, stock_actual, activo, categorias(nombre)').eq('activo', true).order('nombre', { ascending: true })
      ]);

      if (resClientes.error) throw resClientes.error;
      if (resProd.error) throw resProd.error;

      setClientes(resClientes.data || []);
      setCatalogo(resProd.data || []);
      await fetchHistorialDia();
    } catch (err) {
      setError("Error de conexión al sincronizar catálogos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorialDia = async () => {
    try {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);

      const { data, error: errHistorial } = await supabase
        .from('ventas')
        .select(`
          id_venta, creado_en, total, metodo_pago, estado_pago, fecha_vencimiento,
          clientes ( nombre_razon_social ),
          perfiles ( nombre_completo ),
          ventas_detalle ( cantidad, precio_historico, productos ( nombre ) )
        `)
        .gte('creado_en', inicioDia.toISOString())
        .order('creado_en', { ascending: false });

      if (errHistorial) throw errHistorial;
      setHistorial(data || []);
    } catch (err) {
      console.error(err.message);
    }
  };

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
    if (!itemActual.id_producto || itemActual.cantidad <= 0) return;
    const prod = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));
    if (!prod) return;

    const yaEnCarrito = carrito.find(i => String(i.id_producto) === String(prod.id_producto));
    const cantidadTotal = (yaEnCarrito?.cantidad || 0) + itemActual.cantidad;

    if (cantidadTotal > prod.stock_actual) {
      setError(`Stock insuficiente para "${prod.nombre}". Disponibles: ${prod.stock_actual} u.`);
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
        ? { ...i, cantidad: i.cantidad + itemActual.cantidad, total: (i.cantidad + itemActual.cantidad) * i.precio_unitario }
        : i
      ));
    } else {
      setCarrito([...carrito, {
        id_producto: prod.id_producto,
        sku: prod.sku,
        nombre: prod.nombre,
        tipo_precio: etiquetaTipo,
        cantidad: itemActual.cantidad,
        precio_unitario: itemActual.precio_unitario,
        total: itemActual.cantidad * itemActual.precio_unitario
      }]);
    }

    setItemActual({ id_producto: '', tipo_precio: itemActual.tipo_precio, cantidad: 1, precio_unitario: 0 });
  };

  const handleEliminarItemCarrito = (id_producto) => {
    setCarrito(carrito.filter(i => String(i.id_producto) !== String(id_producto)));
  };

  const handleSeleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    if (metodo === 'cuenta_corriente') setEsPendiente(true);
  };

  const handleAsignarConsumidorFinal = () => {
    const cf = clientes.find(c => c.nombre_razon_social.toLowerCase().includes('consumidor final'));
    if (cf) {
      setClienteId(cf.id_cliente);
    } else if (clientes.length > 0) {
      setClienteId(clientes[0].id_cliente);
    }
  };

  const totalFactura = carrito.reduce((acc, i) => acc + i.total, 0);

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

    setSaving(true);
    setError(null);

    try {
      const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === String(clienteId));
      const esConsumidorFinal = clienteSeleccionado?.nombre_razon_social?.toLowerCase().includes('consumidor final');

      if (esPendiente && esConsumidorFinal) {
        throw new Error("No se puede emitir una venta pendiente de pago a Consumidor Final. Seleccione o registre un cliente con nombre/razón social.");
      }

      const { data: ventaReq, error: errVenta } = await supabase
        .from('ventas')
        .insert([{
          cliente_id: clienteId,
          usuario_id: userId,
          total: totalFactura,
          metodo_pago: metodoPago,
          estado_pago: esPendiente ? 'pendiente' : 'pagado',
          fecha_vencimiento: esPendiente ? fechaVencimiento : null
        }])
        .select()
        .single();

      if (errVenta) throw errVenta;

      const detallesInsert = carrito.map(item => ({
        venta_id: ventaReq.id_venta,
        producto_id: item.id_producto,
        cantidad: item.cantidad,
        precio_historico: item.precio_unitario
      }));

      const { error: errDetalles } = await supabase.from('ventas_detalle').insert(detallesInsert);
      if (errDetalles) throw errDetalles;

      for (const item of carrito) {
        const prod = catalogo.find(p => String(p.id_producto) === String(item.id_producto));
        const nuevoStock = (prod?.stock_actual || 0) - item.cantidad;

        await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id_producto', item.id_producto);
        await supabase.from('movimientos_stock').insert([{
          producto_id: item.id_producto,
          usuario_id: userId,
          tipo: 'venta',
          cantidad: -item.cantidad
        }]);
      }

      if (esPendiente && clienteSeleccionado) {
        const saldoPrevio = Number(clienteSeleccionado.saldo_deudor || 0);
        await supabase.from('clientes').update({ saldo_deudor: saldoPrevio + totalFactura }).eq('id_cliente', clienteId);
      }

      setCarrito([]);
      setClienteId('');
      setMetodoPago('efectivo');
      setEsPendiente(false);
      setPaginaActual(1);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      fetchInitialData();
    } catch (err) {
      setError(err.message || "Error al completar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const totalDia = historial.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalPaginas = Math.ceil(historial.length / ITEMS_PER_PAGE) || 1;
  const historialPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return historial.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [historial, paginaActual]);

  return {
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
  };
}