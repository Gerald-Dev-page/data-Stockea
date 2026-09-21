// src/components/productos/CategoryModal.jsx
import { useState } from 'react';
import { Settings, X, Check, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function CategoryModal({
  show,
  onClose,
  categorias,
  setCategorias,
  productos,
  onRefresh,
  notify,
  setError
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  if (!show) return null;

  const handleUpdateCategory = async (id) => {
    if (!editCategoryName.trim()) return;
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ nombre: editCategoryName.trim() })
        .eq('id', id);
      if (error) throw error;

      setCategorias(prev => prev.map(c => c.id === id ? { ...c, nombre: editCategoryName.trim() } : c));
      setEditingCategory(null);
      setEditCategoryName('');
      notify("Categoría modificada correctamente.");
      onRefresh();
    } catch (err) {
      setError("Error al modificar categoría: " + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    const tieneProductos = productos.some(p => p.categoria_id === id);
    if (tieneProductos) {
      setError("No se puede eliminar la categoría porque contiene productos asignados.");
      return;
    }
    if (!confirm("¿Está seguro de eliminar esta categoría?")) return;

    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;

      setCategorias(prev => prev.filter(c => c.id !== id));
      notify("Categoría eliminada.");
      onRefresh();
    } catch (err) {
      setError("Error al eliminar categoría: " + err.message);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(3, 8, 15, 0.85)', 
        zIndex: 10000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backdropFilter: 'blur(4px)', 
        padding: '1rem' 
      }}
      onClick={onClose}
    >
      <div 
        className="form-card" 
        style={{ width: '100%', maxWidth: '480px', border: '1px solid rgba(201, 162, 39, 0.4)', boxShadow: 'var(--shadow-md)', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <h3 className="form-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} style={{ color: 'var(--color-accent)' }} /> Administrar Categorías
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categorias.map(cat => (
            <div 
              key={cat.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '8px 12px', 
                background: 'var(--color-bg-main)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-sm)' 
              }}
            >
              {editingCategory === cat.id ? (
                <>
                  <input 
                    type="text" 
                    value={editCategoryName} 
                    onChange={(e) => setEditCategoryName(e.target.value)} 
                    autoFocus
                    style={{ 
                      background: 'var(--color-bg-card)', 
                      border: '1px solid var(--color-accent)', 
                      borderRadius: '4px', 
                      padding: '4px 10px', 
                      color: 'var(--color-text-heading)', 
                      fontSize: '0.85rem',
                      height: '32px',
                      outline: 'none',
                      width: '100%'
                    }} 
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateCategory(cat.id)} 
                      style={{ background: 'var(--color-success-soft)', border: 'none', color: '#5EDBA2', padding: '0 10px', height: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Check size={15} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingCategory(null)} 
                      style={{ background: 'var(--color-error-soft)', border: 'none', color: '#F87171', padding: '0 10px', height: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.nombre}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => { setEditingCategory(cat.id); setEditCategoryName(cat.nombre); }} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', padding: '4px' }}
                      title="Modificar nombre"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteCategory(cat.id)} 
                      style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '8px 20px', width: '100%', justifyContent: 'center' }}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}