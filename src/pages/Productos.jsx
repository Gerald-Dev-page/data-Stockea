// src/pages/Productos.jsx
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import '../styles/productos.css';

import { useProducts } from '../hooks/useProducts';
import DollarWidget from '../components/productos/DollarWidget';
import ProductStats from '../components/productos/ProductStats';
import ProductForm from '../components/productos/ProductForm';
import ProductTable from '../components/productos/ProductTable';
import CategoryModal from '../components/productos/CategoryModal';
import ProductEditModal from '../components/productos/ProductEditModal';
import ImageLightbox from '../components/productos/ImageLightbox';

export default function Productos() {
  const {
    productos,
    categorias,
    setCategorias,
    loading,
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
    subiendoFoto,
    calcularCostoUSD,
    fetchInitialData
  } = useProducts();

  const [fotoZoom, setFotoZoom] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  return (
    <div className="page-container dashboard-page">
      <header className="page-header">
        <div>
          <h2>Gestión de Catálogo y Costeo</h2>
          <p>Fichas técnicas maestras, costeo multimoneda y escalas mayoristas.</p>
        </div>

        <DollarWidget
          cotizacion={cotizacionDolar}
          onChange={setCotizacionDolar}
          onSave={saveCotizacion}
          isSaving={guardandoDolar}
          isSaved={dolarGuardadoOk}
        />
      </header>

      {toastMessage && <div className="demo-toast">✓ {toastMessage}</div>}

      {error && (
        <div className="demo-toast" style={{ background: 'var(--color-error-soft)', borderColor: 'rgba(179, 64, 42, 0.4)', color: '#F87171' }}>
          <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <ProductStats
        productos={productos}
        categorias={categorias}
        cotizacion={cotizacionDolar}
        onOpenCategoryModal={() => setShowCategoryModal(true)}
      />

      <ProductForm
        categorias={categorias}
        setCategorias={setCategorias}
        cotizacionDolar={cotizacionDolar}
        userId={userId}
        uploadFoto={uploadFoto}
        subiendoFoto={subiendoFoto}
        calcularCostoUSD={calcularCostoUSD}
        onProductCreated={fetchInitialData}
        notify={notify}
        setError={setError}
      />

      <ProductTable
        loading={loading}
        productos={productosPaginados}
        totalItems={productosFiltrados.length}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        setPaginaActual={setPaginaActual}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        categoriaFiltro={categoriaFiltro}
        setCategoriaFiltro={setCategoriaFiltro}
        categorias={categorias}
        cotizacionDolar={cotizacionDolar}
        onOpenEdit={(p) => setEditingProduct(p)}
        onZoomFoto={(url) => setFotoZoom(url)}
      />

      <CategoryModal
        show={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categorias={categorias}
        setCategorias={setCategorias}
        productos={productos}
        onRefresh={fetchInitialData}
        notify={notify}
        setError={setError}
      />

      <ProductEditModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        categorias={categorias}
        cotizacionDolar={cotizacionDolar}
        uploadFoto={uploadFoto}
        subiendoFoto={subiendoFoto}
        calcularCostoUSD={calcularCostoUSD}
        onUpdated={fetchInitialData}
        notify={notify}
        setError={setError}
        onZoomFoto={(url) => setFotoZoom(url)}
      />

      <ImageLightbox
        url={fotoZoom}
        onClose={() => setFotoZoom(null)}
      />
    </div>
  );
}