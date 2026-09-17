// src/pages/Ventas.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  ShoppingCart, User, Package, Clock, TrendingUp, 
  AlertCircle, Trash2, Plus, CreditCard, Banknote, Landmark, CheckCircle2,
  ChevronLeft, ChevronRight, Calendar, AlertTriangle
} from 'lucide-react';
import '../styles/ventas.css';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const ITEMS_PER_PAGE = 10;

export default function Ventas() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [userId, setUserId] = useState(null);

  // Cliente seleccionado
  const [clienteId, setClienteId] = useState('');

  // Formulario selector de ítem actual con 3 listas mayoristas
  const [itemActual, setItemActual] = useState({
    id_producto: '',
    tipo_precio: 'minorista', // 'minorista' | 'mayorista_1' | 'mayorista_2' | 'mayorista_3'
    cantidad: 1,
    precio_unitario: 0
  });

  // Carrito de compras temporal
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Estado de cobro y vencimiento
  const [esPendiente, setEsPendiente] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // 15 días por defecto
    return d.toISOString().split('T')[0];
  });

  // Control de paginación del historial
  const [paginaActual, setPaginaActual] = useState(1);

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

      // 1. Clientes con saldo deudor
      const { data: dataClientes, error: errClientes } = await supabase
        .from('clientes')
        .select('id_cliente, nombre_razon_social, saldo_deudor')
        .order('nombre_razon_social', { ascending: true });
      if (errClientes) throw errClientes;
      setClientes(dataClientes || []);

      // 2. Catálogo con las 3 columnas mayoristas
      const { data: dataProductos, error: errProductos } = await supabase
        .from('productos')
        .select('id_producto, sku, nombre, precio_venta, precio_mayorista, precio_mayorista_1, precio_mayorista_2, precio_mayorista_3, stock_actual, activo, categorias(nombre)')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      if (errProductos) throw errProductos;
      setCatalogo(dataProductos || []);

      await fetchHistorialDia();
    } catch (err) {
      console.error("Error al cargar ventas:", err.message);
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
            precio_historico,
            productos ( nombre )
          )
        `)
        .gte('creado_en', inicioDia.toISOString())
        .order('creado_en', { ascending: false });

      if (errHistorial) throw errHistorial;
      setHistorial(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err.message);
    }
  };

  const handleAsignarConsumidorFinal = () => {
    const cf = clientes.find(c => c.nombre_razon_social.toLowerCase().includes('consumidor final'));
    if (cf) {
      setClienteId(cf.id_cliente);
    } else if (clientes.length > 0) {
      setClienteId(clientes[0].id_cliente);
    }
  };

  // Helper para resolver precio según lista seleccionada
  const resolverPrecio = (prod, tipo) => {
    if (!prod) return 0;
    if (tipo === 'minorista') return Number(prod.precio_venta || 0);
    if (tipo === 'mayorista_1') return Number(prod.precio_mayorista_1 || prod.precio_mayorista || 0);
    if (tipo === 'mayorista_2') return Number(prod.precio_mayorista_2 || prod.precio_mayorista_1 || prod.precio_venta || 0);
    if (tipo === 'mayorista_3') return Number(prod.precio_mayorista_3 || prod.precio_mayorista_1 || prod.precio_venta || 0);
    return Number(prod.precio_venta || 0);
  };

  const handleProductoChange = (e) => {
    const id = e.target.value;
    const prod = catalogo.find(p => String(p.id_producto) === String(id));
    if (!prod) {
      setItemActual({ id_producto: '', tipo_precio: 'minorista', cantidad: 1, precio_unitario: 0 });
      return;
    }
    const precio = resolverPrecio(prod, itemActual.tipo_precio);
    setItemActual(prev => ({
      ...prev,
      id_producto: id,
      precio_unitario: precio
    }));
  };

  const handleTipoPrecioChange = (e) => {
    const tipo = e.target.value;
    const prod = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));
    const precio = resolverPrecio(prod, tipo);
    setItemActual(prev => ({
      ...prev,
      tipo_precio: tipo,
      precio_unitario: precio
    }));
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

  const totalFactura = carrito.reduce((acc, i) => acc + i.total, 0);

  // Auto activar "pendiente de pago" al seleccionar cuenta corriente
  const handleSeleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    if (metodo === 'cuenta_corriente') {
      setEsPendiente(true);
    }
  };

  // Confirmar Venta
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

      // 1. Insertar Cabecera de Venta
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

      // 2. Insertar Detalles de Venta
      const detallesInsert = carrito.map(item => ({
        venta_id: ventaReq.id_venta,
        producto_id: item.id_producto,
        cantidad: item.cantidad,
        precio_historico: item.precio_unitario
      }));

      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detallesInsert);
      if (errDetalles) throw errDetalles;

      // 3. Descontar Stock y Registrar Auditoría
      for (const item of carrito) {
        const prod = catalogo.find(p => String(p.id_producto) === String(item.id_producto));
        const nuevoStock = (prod?.stock_actual || 0) - item.cantidad;

        await supabase
          .from('productos')
          .update({ stock_actual: nuevoStock })
          .eq('id_producto', item.id_producto);

        await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: item.id_producto,
            usuario_id: userId,
            tipo: 'venta',
            cantidad: -item.cantidad
          }]);
      }

      // 4. Si es pendiente, sumar deuda a la ficha de Clientes
      if (esPendiente && clienteSeleccionado) {
        const saldoPrevio = Number(clienteSeleccionado.saldo_deudor || 0);
        const nuevoSaldo = saldoPrevio + totalFactura;

        await supabase
          .from('clientes')
          .update({ saldo_deudor: nuevoSaldo })
          .eq('id_cliente', clienteId);
      }

      // Reset
      setCarrito([]);
      setClienteId('');
      setMetodoPago('efectivo');
      setEsPendiente(false);
      setPaginaActual(1);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);

      fetchInitialData();
    } catch (err) {
      console.error("Error al procesar venta:", err.message);
      setError(err.message || "Error al completar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const totalDia = historial.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const productoActivo = catalogo.find(p => String(p.id_producto) === String(itemActual.id_producto));
  const clienteActivo = clientes.find(c => String(c.id_cliente) === String(clienteId));

  const totalPaginas = Math.ceil(historial.length / ITEMS_PER_PAGE) || 1;
  const historialPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return historial.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [historial, paginaActual]);

  return (
    <div className="page-container">
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
        {/* ── PANEL IZQUIERDO: Selección y Artículos ── */}
        <div>
          {/* Tarjeta Cliente */}
          <div className="form-card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-text-heading)' }}>
                <User size={15} style={{ color: 'var(--color-accent)' }} /> Cliente
              </label>
              <button
                type="button"
                onClick={handleAsignarConsumidorFinal}
                style={{
                  background: 'var(--color-accent-soft)',
                  border: '1px solid rgba(201, 162, 39, 0.3)',
                  color: 'var(--color-accent)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Consumidor Final
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <select 
                value={clienteId} 
                onChange={(e) => setClienteId(e.target.value)} 
                disabled={saving}
              >
                <option value="">— Seleccione un cliente —</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre_razon_social} {Number(c.saldo_deudor || 0) > 0 ? `(Deuda: ${formatPrice(c.saldo_deudor)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {clienteActivo && Number(clienteActivo.saldo_deudor || 0) > 0 && (
              <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} /> Saldo deudor acumulado: <strong>{formatPrice(clienteActivo.saldo_deudor)}</strong>
              </div>
            )}
          </div>

          {/* Tarjeta Agregar Producto */}
          <div className="form-card">
            <h3 className="form-title">
              <Package size={16} style={{ color: 'var(--color-accent)' }} /> Agregar Producto
            </h3>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Artículo</label>
                {productoActivo && (
                  <span style={{ fontSize: '0.72rem', color: productoActivo.stock_actual <= 0 ? '#F87171' : 'var(--color-text-muted)' }}>
                    Físico: <strong>{productoActivo.stock_actual} u.</strong>
                  </span>
                )}
              </div>
              <select value={itemActual.id_producto} onChange={handleProductoChange} disabled={saving}>
                <option value="">— Seleccione un artículo —</option>
                {catalogo.map(p => (
                  <option key={p.id_producto} value={p.id_producto} disabled={p.stock_actual <= 0}>
                    {p.nombre} ({p.stock_actual <= 0 ? 'Sin stock' : `${p.stock_actual} u.`})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Lista de Precio</label>
                <select value={itemActual.tipo_precio} onChange={handleTipoPrecioChange} disabled={!itemActual.id_producto || saving}>
                  <option value="minorista">Minorista</option>
                  <option value="mayorista_1">Mayorista 1 (Base)</option>
                  <option value="mayorista_2">Mayorista 2 (Volumen)</option>
                  <option value="mayorista_3">Mayorista 3 (Distrib.)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Precio Unit.</label>
                <input 
                  type="text" 
                  value={formatPrice(itemActual.precio_unitario)} 
                  disabled 
                  style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-heading)' }} 
                />
              </div>

              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  max={productoActivo?.stock_actual || 9999}
                  value={itemActual.cantidad}
                  onChange={(e) => setItemActual(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                  disabled={!itemActual.id_producto || saving}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAgregarAlCarrito}
              disabled={saving || !itemActual.id_producto || itemActual.cantidad <= 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={15} /> Añadir al Carrito
            </button>
          </div>
        </div>

        {/* ── PANEL DERECHO: Resumen del Ticket y Cobro ── */}
        <div className="form-card" style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="form-title" style={{ margin: 0 }}>
              <ShoppingCart size={16} style={{ color: 'var(--color-accent)' }} /> Resumen del Ticket
            </h3>
            <span className="id-badge" style={{ color: 'var(--color-accent)', borderColor: 'rgba(201, 162, 39, 0.3)' }}>
              {carrito.length} ítems
            </span>
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem' }}>
            {carrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                El carrito está vacío. Agregue productos desde el panel izquierdo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {carrito.map(item => (
                  <div 
                    key={item.id_producto}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--color-bg-main)',
                      border: '1px solid var(--color-border)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-heading)' }}>
                        {item.nombre}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        {item.cantidad} u. × {formatPrice(item.precio_unitario)} ({item.tipo_precio})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                        {formatPrice(item.total)}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleEliminarItemCarrito(item.id_producto)}
                        style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0 }}
                        title="Quitar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medio de Pago */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Medio de Cobro</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
              <button
                type="button"
                onClick={() => handleSeleccionarMetodoPago('efectivo')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: metodoPago === 'efectivo' ? 'var(--color-accent)' : 'var(--color-border)',
                  background: metodoPago === 'efectivo' ? 'var(--color-accent-soft)' : 'var(--color-bg-main)',
                  color: metodoPago === 'efectivo' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Banknote size={14} /> Efectivo
              </button>

              <button
                type="button"
                onClick={() => handleSeleccionarMetodoPago('transferencia')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: metodoPago === 'transferencia' ? '#6EA8FE' : 'var(--color-border)',
                  background: metodoPago === 'transferencia' ? 'rgba(42, 90, 150, 0.15)' : 'var(--color-bg-main)',
                  color: metodoPago === 'transferencia' ? '#6EA8FE' : 'var(--color-text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Landmark size={14} /> Transfer.
              </button>

              <button
                type="button"
                onClick={() => handleSeleccionarMetodoPago('cuenta_corriente')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: metodoPago === 'cuenta_corriente' ? '#FBBF24' : 'var(--color-border)',
                  background: metodoPago === 'cuenta_corriente' ? 'var(--color-warning-soft)' : 'var(--color-bg-main)',
                  color: metodoPago === 'cuenta_corriente' ? '#FBBF24' : 'var(--color-text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={14} /> Cta. Cte.
              </button>
            </div>
          </div>

          {/* Bloque: Pendiente de Pago y Vencimiento */}
          <div style={{ padding: '0.75rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.82rem', fontWeight: 600, color: esPendiente ? '#FBBF24' : 'var(--color-text-heading)' }}>
              <input 
                type="checkbox" 
                checked={esPendiente} 
                onChange={(e) => setEsPendiente(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              Dejar como Venta Pendiente de Pago (Deuda)
            </label>

            {esPendiente && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> Fecha límite / Vencimiento:
                </span>
                <input 
                  type="date" 
                  value={fechaVencimiento} 
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  style={{ height: '36px', fontSize: '0.85rem' }}
                  required
                />
              </div>
            )}
          </div>

          {/* Gran Total */}
          <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total a Facturar
              </span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice(totalFactura)}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary btn-full"
            onClick={handleConfirmarVenta}
            disabled={saving || !clienteId || carrito.length === 0}
            style={{ padding: '12px' }}
          >
            {saving ? 'Procesando venta...' : <><CheckCircle2 size={16} /> Emitir Comprobante</>}
          </button>
        </div>
      </div>

      {/* ── Historial de Hoy ── */}
      <div className="card table-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="table-title" style={{ margin: 0 }}>
            <Clock size={15} style={{ color: 'var(--color-accent)' }} /> 
            Ventas Registradas Hoy
          </h3>
          <span className="table-count">{historial.length} operaciones</span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Operador</th>
                <th>Cliente</th>
                <th>Artículos</th>
                <th>Medio</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {historialPaginado.map(v => {
                const fecha = new Date(v.creado_en);
                const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                const cantArticulos = v.ventas_detalle?.reduce((acc, d) => acc + d.cantidad, 0) || 0;
                const esPend = v.estado_pago === 'pendiente';

                return (
                  <tr key={v.id_venta}>
                    <td><span className="hora-badge">{horaStr}</span></td>
                    <td className="td-muted">{v.perfiles?.nombre_completo || 'Operador'}</td>
                    <td className="td-nombre">{v.clientes?.nombre_razon_social || 'Consumidor'}</td>
                    <td className="td-muted">
                      {v.ventas_detalle?.length > 0 
                        ? `${v.ventas_detalle[0].productos?.nombre || 'Producto'} ${v.ventas_detalle.length > 1 ? `(+${v.ventas_detalle.length - 1})` : ''} (${cantArticulos} u.)`
                        : '—'
                      }
                    </td>
                    <td>
                      <span className="id-badge" style={{ textTransform: 'capitalize' }}>
                        {v.metodo_pago || 'Efectivo'}
                      </span>
                    </td>
                    <td>
                      {esPend ? (
                        <span className="estado-badge" style={{ background: 'var(--color-warning-soft)', color: '#FBBF24', borderColor: 'rgba(201, 138, 39, 0.4)' }}>
                          Pendiente {v.fecha_vencimiento ? `(${v.fecha_vencimiento.slice(5)})` : ''}
                        </span>
                      ) : (
                        <span className="estado-badge activo">Cobrado</span>
                      )}
                    </td>
                    <td className="td-precio">{formatPrice(v.total)}</td>
                  </tr>
                );
              })}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                    Sin operaciones registradas en el día de hoy.
                  </td>
                </tr> 
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación del Historial */}
        {!loading && historial.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando <strong>{(paginaActual - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(paginaActual * ITEMS_PER_PAGE, historial.length)}</strong> de <strong>{historial.length}</strong> operaciones
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
    </div>
  );
}