// src/hooks/useClientes.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const ITEMS_PER_PAGE = 10;

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'deuda' | 'al_dia'
  const [paginaActual, setPaginaActual] = useState(1);

  const [editingClient, setEditingClient] = useState(null);
  const [payingClient, setPayingClient] = useState(null);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: errSupabase } = await supabase
        .from('clientes')
        .select('*')
        .order('creado_en', { ascending: false });

      if (errSupabase) throw errSupabase;
      setClientes(data || []);
    } catch (err) {
      setError("No se pudo establecer conexión con el catálogo de clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

  const totalDeudaGeneral = clientes.reduce((acc, c) => acc + Number(c.saldo_deudor || 0), 0);
  const clientesConDeudaCount = clientes.filter(c => Number(c.saldo_deudor || 0) > 0).length;

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const q = busqueda.toLowerCase().trim();
      const matchTexto = !q || (
        c.nombre_razon_social?.toLowerCase().includes(q) ||
        c.direccion?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      );

      const deuda = Number(c.saldo_deudor || 0);
      const matchEstado = 
        filtroEstado === 'todos' ? true :
        filtroEstado === 'deuda' ? deuda > 0 :
        deuda === 0;

      return matchTexto && matchEstado;
    });
  }, [clientes, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE) || 1;
  const clientesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return clientesFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [clientesFiltrados, paginaActual]);

  const createCliente = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      const { error: errInsert } = await supabase
        .from('clientes')
        .insert([{
          nombre_razon_social: formData.nombre_razon_social.trim(),
          direccion: formData.direccion.trim(),
          telefono: formData.telefono.trim(),
          saldo_deudor: 0
        }]);

      if (errInsert) throw errInsert;
      notify("Cliente registrado exitosamente.");
      fetchClientes();
      return true;
    } catch (err) {
      setError("Ocurrió un error al intentar guardar el cliente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateCliente = async (id, editFormData) => {
    setSaving(true);
    setError(null);
    try {
      const { error: errUpdate } = await supabase
        .from('clientes')
        .update({
          nombre_razon_social: editFormData.nombre_razon_social.trim(),
          direccion: editFormData.direccion.trim(),
          telefono: editFormData.telefono.trim()
        })
        .eq('id_cliente', id);

      if (errUpdate) throw errUpdate;
      setEditingClient(null);
      notify("Datos del cliente actualizados.");
      fetchClientes();
      return true;
    } catch (err) {
      setError("No se pudieron actualizar los datos del cliente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const registrarPago = async (cliente, monto) => {
    const abono = parseFloat(monto) || 0;
    if (abono <= 0 || !cliente) return false;

    setSaving(true);
    setError(null);
    try {
      const saldoActual = Number(cliente.saldo_deudor || 0);
      const nuevoSaldo = Math.max(0, saldoActual - abono);

      const { error: errSaldo } = await supabase
        .from('clientes')
        .update({ saldo_deudor: nuevoSaldo })
        .eq('id_cliente', cliente.id_cliente);

      if (errSaldo) throw errSaldo;

      if (nuevoSaldo === 0) {
        await supabase
          .from('ventas')
          .update({ estado_pago: 'pagado' })
          .eq('cliente_id', cliente.id_cliente)
          .eq('estado_pago', 'pendiente');
      }

      setPayingClient(null);
      notify(`Cobranza asentada con éxito. Saldo restante: $${nuevoSaldo.toLocaleString('es-AR')}`);
      fetchClientes();
      return true;
    } catch (err) {
      setError("No se pudo registrar el pago en la cuenta corriente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    clientes,
    loading,
    saving,
    error,
    setError,
    toastMessage,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    totalDeudaGeneral,
    clientesConDeudaCount,
    clientesFiltrados,
    clientesPaginados,
    editingClient,
    setEditingClient,
    payingClient,
    setPayingClient,
    createCliente,
    updateCliente,
    registrarPago
  };
}