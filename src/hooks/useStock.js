// src/hooks/useStock.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;

export function useStock() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resProds, resMovs] = await Promise.all([
        supabase.from('productos').select('*, categorias(nombre)').order('nombre', { ascending: true }),
        supabase.from('movimientos_stock').select(`
          id_movimiento,
          tipo,
          cantidad,
          creado_en,
          productos ( nombre, sku ),
          perfiles ( nombre_completo )
        `).order('creado_en', { ascending: false }).limit(100)
      ]);

      if (resProds.error) throw resProds.error;
      if (resMovs.error) throw resMovs.error;

      setProductos(resProds.data || []);
      setMovimientos(resMovs.data || []);
    } catch (err) {
      setError("Error de sincronización con la base de datos.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      let tipoAuditoria = 'ajuste';
      let factor = ajusteForm.tipo === 'ingreso' ? 1 : -1;
      let cantidadNeta = cant * factor;

      if (ajusteForm.destino === 'fisico') {
        const nuevoFisico = (selectedProduct.stock_actual || 0) + cantidadNeta;
        if (nuevoFisico < 0) throw new Error("No puede tener existencias físicas negativas.");
        updateFields.stock_actual = nuevoFisico;
        tipoAuditoria = ajusteForm.tipo === 'ingreso' ? 'reposicion' : 'ajuste';
      } else if (ajusteForm.destino === 'transito') {
        const nuevoTransito = (selectedProduct.stock_transito || 0) + cantidadNeta;
        if (nuevoTransito < 0) throw new Error("El stock en tránsito no puede ser negativo.");
        updateFields.stock_transito = nuevoTransito;
        tipoAuditoria = 'transito';
      } else if (ajusteForm.destino === 'reservado') {
        const nuevoReservado = (selectedProduct.stock_reservado || 0) + cantidadNeta;
        if (nuevoReservado < 0) throw new Error("El stock reservado no puede ser negativo.");
        if (nuevoReservado > selectedProduct.stock_actual) {
          throw new Error("No puede reservar más unidades de las disponibles físicamente en depósito.");
        }
        updateFields.stock_reservado = nuevoReservado;
        tipoAuditoria = 'reserva';
      }

      const { error: errUpd } = await supabase
        .from('productos')
        .update(updateFields)
        .eq('id_producto', selectedProduct.id_producto);
      if (errUpd) throw errUpd;

      const { error: errAud } = await supabase
        .from('movimientos_stock')
        .insert([{
          producto_id: selectedProduct.id_producto,
          usuario_id: userId,
          tipo: tipoAuditoria,
          cantidad: cantidadNeta
        }]);
      if (errAud) throw errAud;

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
  };
}