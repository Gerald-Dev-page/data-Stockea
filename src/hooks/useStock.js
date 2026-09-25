// src/hooks/useStock.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;

export function useStock() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('existencias');
  const [userId, setUserId] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [paginaStock, setPaginaStock] = useState(1);
  const [paginaMovs, setPaginaMovs] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ajusteForm, setAjusteForm] = useState({
    destino: 'fisico',
    tipo: 'ingreso',
    cantidad: 1,
    fecha_estimada: '',
    cliente_id: '',
    motivo: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchStockData();
  }, []);

  useEffect(() => {
    setPaginaStock(1);
  }, [busqueda, filtroEstado]);

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resProds, resMovs, resCli] = await Promise.all([
        supabase.from('productos').select('*, categorias(nombre)').order('nombre', { ascending: true }),
        supabase.from('movimientos_stock').select(`
          id_movimiento,
          tipo,
          cantidad,
          creado_en,
          productos ( nombre, sku )
        `).order('creado_en', { ascending: false }).limit(100),
       supabase.from('clientes').select('*').order('nombre_razon_social', { ascending: true })
      ]);

      if (resProds.error) throw resProds.error;
      if (resMovs.error) throw resMovs.error;
      if (resCli.error) console.warn("No se pudieron cargar clientes para reservas:", resCli.error);

      setProductos(resProds.data || []);
      setMovimientos(resMovs.data || []);
      setClientes(resCli.data || []);
    } catch (err) {
      setError("Error de sincronización con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Alertas de pedidos en tránsito cuya fecha ya llegó o se superó
  const arribosPendientes = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return productos.filter(p => 
      (p.stock_transito || 0) > 0 && 
      p.fecha_estimada_llegada && 
      p.fecha_estimada_llegada <= hoy
    );
  }, [productos]);

  // Acción rápida: Confirmar recepción de mercadería en tránsito
  const handleConfirmarArribo = async (producto) => {
    if (!userId) return;
    const transito = producto.stock_transito || 0;
    if (transito <= 0) return;

    try {
      setSaving(true);
      setError(null);

      // 1. Restamos de tránsito y sumamos al stock físico real
      const nuevoFisico = (producto.stock_actual || 0) + transito;
      const { error: errUpd } = await supabase
        .from('productos')
        .update({
          stock_actual: nuevoFisico,
          stock_transito: 0,
          fecha_estimada_llegada: null
        })
        .eq('id_producto', producto.id_producto);

      if (errUpd) throw errUpd;

      // 2. Registro de auditoría
      await supabase.from('movimientos_stock').insert([{
        producto_id: producto.id_producto,
        usuario_id: userId,
        tipo: 'reposicion',
        cantidad: transito
      }]);

      notify(`Arribo confirmado: se sumaron ${transito} u. a existencias físicas de ${producto.nombre}.`);
      fetchStockData();
    } catch (err) {
      setError("Error al confirmar el arribo: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalFisico = productos.reduce((acc, p) => acc + (p.stock_actual || 0), 0);
  const totalReservado = productos.reduce((acc, p) => acc + (p.stock_reservado || 0), 0);
  const totalTransito = productos.reduce((acc, p) => acc + (p.stock_transito || 0), 0);
  const productosBajoStock = productos.filter(p => (p.stock_actual - (p.stock_reservado || 0)) <= p.stock_minimo && p.stock_actual > 0).length;
  const sinStock = productos.filter(p => (p.stock_actual - (p.stock_reservado || 0)) <= 0).length;

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                         p.sku.toLowerCase().includes(busqueda.toLowerCase());
      const disponible = (p.stock_actual || 0) - (p.stock_reservado || 0);

      if (!matchTexto) return false;
      if (filtroEstado === 'bajo') return disponible <= p.stock_minimo && disponible > 0;
      if (filtroEstado === 'sin') return disponible <= 0;
      if (filtroEstado === 'transito') return (p.stock_transito || 0) > 0;
      return true;
    });
  }, [productos, busqueda, filtroEstado]);

  const totalPaginasStock = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) || 1;
  const productosPaginados = useMemo(() => {
    const inicio = (paginaStock - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [productosFiltrados, paginaStock]);

  const totalPaginasMovs = Math.ceil(movimientos.length / ITEMS_PER_PAGE) || 1;
  const movimientosPaginados = useMemo(() => {
    const inicio = (paginaMovs - 1) * ITEMS_PER_PAGE;
    return movimientos.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [movimientos, paginaMovs]);

  const openAjusteModal = (prod) => {
    setSelectedProduct(prod);
    setAjusteForm({
      destino: 'fisico',
      tipo: 'ingreso',
      cantidad: 1,
      fecha_estimada: '',
      cliente_id: '',
      motivo: ''
    });
  };

  const handleConfirmarAjuste = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !userId) return;

    const cant = parseInt(ajusteForm.cantidad) || 0;
    if (cant <= 0) return;

    setSaving(true);
    setError(null);

    try {
      let updateFields = {};
      let tipoAuditoria = ajusteForm.tipo === 'ingreso' ? 'reposicion' : 'ajuste';
      let factor = ajusteForm.tipo === 'ingreso' ? 1 : -1;
      let cantidadNeta = cant * factor;

      if (ajusteForm.destino === 'fisico') {
        const nuevoFisico = (selectedProduct.stock_actual || 0) + cantidadNeta;
        if (nuevoFisico < 0) throw new Error("No puede tener existencias físicas negativas.");
        updateFields.stock_actual = nuevoFisico;
      } else if (ajusteForm.destino === 'transito') {
        const nuevoTransito = (selectedProduct.stock_transito || 0) + cantidadNeta;
        if (nuevoTransito < 0) throw new Error("El stock en tránsito no puede ser negativo.");
        updateFields.stock_transito = nuevoTransito;

        if (ajusteForm.tipo === 'ingreso') {
          if (!ajusteForm.fecha_estimada) throw new Error("Debe indicar la fecha estimada de llegada del embarque.");
          updateFields.fecha_estimada_llegada = ajusteForm.fecha_estimada;
        } else if (nuevoTransito === 0) {
          updateFields.fecha_estimada_llegada = null;
        }
      } else if (ajusteForm.destino === 'reservado') {
        if (ajusteForm.tipo === 'ingreso') {
          if (!ajusteForm.cliente_id) throw new Error("Debe seleccionar el cliente a quien se le asigna la reserva.");

          const disponible = (selectedProduct.stock_actual || 0) - (selectedProduct.stock_reservado || 0);
          if (cant > disponible) {
            throw new Error(`Solo hay ${disponible} u. disponibles para reservar.`);
          }

          // Insertamos en stock_reservas para el cliente
          const { error: errRes } = await supabase.from('stock_reservas').insert([{
            producto_id: selectedProduct.id_producto,
            cliente_id: ajusteForm.cliente_id,
            cantidad: cant,
            estado: 'activa',
            usuario_id: userId
          }]);
          if (errRes) throw errRes;

          updateFields.stock_reservado = (selectedProduct.stock_reservado || 0) + cant;
        } else {
          // Salida/Cancelación de reserva
          const nuevoReservado = (selectedProduct.stock_reservado || 0) - cant;
          if (nuevoReservado < 0) throw new Error("El stock reservado no puede ser menor a cero.");
          updateFields.stock_reservado = nuevoReservado;
        }
      }

      // Guardamos la actualización de cantidades
      const { error: errUpd } = await supabase
        .from('productos')
        .update(updateFields)
        .eq('id_producto', selectedProduct.id_producto);
      if (errUpd) throw errUpd;

      // Auditoría: siempre usamos tipos válidos para que PostgreSQL no arroje error
      await supabase.from('movimientos_stock').insert([{
        producto_id: selectedProduct.id_producto,
        usuario_id: userId,
        tipo: tipoAuditoria,
        cantidad: cantidadNeta
      }]);

      notify("Ajuste registrado correctamente.");
      setSelectedProduct(null);
      fetchStockData();
    } catch (err) {
      setError(err.message || "Error al registrar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return {
    productos,
    movimientos,
    clientes,
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
    handleConfirmarArribo
  };
}