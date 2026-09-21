// src/hooks/useProducts.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { comprimirAWebP } from '../utils/imageCompressor';

export const ITEMS_PER_PAGE = 10;

export function useProducts() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [userId, setUserId] = useState(null);

  const [cotizacionDolar, setCotizacionDolar] = useState(1506);
  const [guardandoDolar, setGuardandoDolar] = useState(false);
  const [dolarGuardadoOk, setDolarGuardadoOk] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    fetchInitialData();
    fetchCotizacion();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoriaFiltro]);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchCotizacion = async () => {
    try {
      const { data, error: err } = await supabase
        .from('configuracion')
        .select('cotizacion_dolar')
        .eq('id', 1)
        .single();
      if (err && err.code !== 'PGRST116') throw err;
      if (data?.cotizacion_dolar) setCotizacionDolar(Number(data.cotizacion_dolar));
    } catch (err) {
      console.error(err.message);
    }
  };

  const saveCotizacion = async () => {
    const valor = Number(cotizacionDolar);
    if (!valor || valor <= 0) return;
    try {
      setGuardandoDolar(true);
      const { error: err } = await supabase.from('configuracion').upsert({
        id: 1,
        cotizacion_dolar: valor,
        actualizado_en: new Date().toISOString()
      });
      if (err) throw err;
      setDolarGuardadoOk(true);
      notify(`Cotización guardada: $${valor.toLocaleString('es-AR')} ARS`);
      setTimeout(() => setDolarGuardadoOk(false), 2500);
    } catch (err) {
      setError('No se pudo actualizar el tipo de cambio.');
    } finally {
      setGuardandoDolar(false);
    }
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categorias').select('*').order('nombre', { ascending: true }),
        supabase.from('productos').select('*, categorias(nombre)').eq('activo', true).order('nombre', { ascending: true })
      ]);
      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;
      setCategorias(catRes.data || []);
      setProductos(prodRes.data || []);
    } catch (err) {
      setError('No se pudo sincronizar la información del catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFoto = async (file, sku) => {
    try {
      setSubiendoFoto(true);
      const webpBlob = await comprimirAWebP(file, 1200, 0.82);
      const fileName = `${sku || 'prd'}_${Date.now()}.webp`;
      const filePath = `catalogo/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, webpBlob, { contentType: 'image/webp', cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(filePath);
      notify('Imagen WebP subida exitosamente.');
      return publicUrl;
    } catch (err) {
      setError('Error al subir imagen: ' + err.message);
      return null;
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Eliminación de producto con validación de historial
  const deleteProduct = async (id_producto) => {
    try {
      setSaving(true);
      setError(null);

      // Verificamos si tiene ventas
      const { count, error: countErr } = await supabase
        .from('ventas_detalle')
        .select('*', { count: 'exact', head: true })
        .eq('producto_id', id_producto);

      if (countErr) throw countErr;

      if (count > 0) {
        // Si tiene ventas registradas, hacemos baja lógica (activo: false) para no romper FK
        const { error: updErr } = await supabase
          .from('productos')
          .update({ activo: false })
          .eq('id_producto', id_producto);

        if (updErr) throw updErr;
        notify("Producto archivado y dado de baja del catálogo activo (posee historial contable).");
      } else {
        // Si no tiene ventas, se puede eliminar de forma física
        const { error: delErr } = await supabase
          .from('productos')
          .delete()
          .eq('id_producto', id_producto);

        if (delErr) throw delErr;
        notify("Producto eliminado completamente del catálogo.");
      }

      fetchInitialData();
      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el artículo: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const calcularCostoUSD = (data) => {
    const cOrigen = parseFloat(data.costo_origen) || 0;
    const g = data.gastos_importacion || {};
    const fInt = parseFloat(data.flete_int || g.flete_int) || 0;
    const adu = parseFloat(data.impuestos_aduana || g.impuestos_aduana) || 0;
    const nac = parseFloat(data.nacionalizacion || g.nacionalizacion) || 0;
    const fLoc = parseFloat(data.flete_local || g.flete_local) || 0;
    return cOrigen + fInt + adu + nac + fLoc;
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const query = `${p.nombre} ${p.sku} ${p.codigo_barras || ''} ${p.marca || ''}`.toLowerCase();
      const matchTexto = query.includes(busqueda.toLowerCase());
      const matchCat = categoriaFiltro === 'todas' || String(p.categoria_id) === String(categoriaFiltro);
      return matchTexto && matchCat;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE) || 1;

  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [productosFiltrados, paginaActual]);

  return {
    productos,
    categorias,
    setCategorias,
    loading,
    saving,
    setSaving,
    subiendoFoto,
    error,
    setError,
    toastMessage,
    notify,
    userId,
    cotizacionDolar,
    setCotizacionDolar,
    guardandoDolar,
    dolarGuardadoOk,
    saveCotizacion,
    busqueda,
    setBusqueda,
    categoriaFiltro,
    setCategoriaFiltro,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    productosFiltrados,
    productosPaginados,
    uploadFoto,
    deleteProduct,
    calcularCostoUSD,
    fetchInitialData
  };
}