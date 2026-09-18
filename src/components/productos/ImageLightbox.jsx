// src/components/productos/ImageLightbox.jsx
import { X } from 'lucide-react';

export default function ImageLightbox({ url, onClose }) {
  if (!url) return null;

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.90)', 
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        cursor: 'zoom-out', 
        padding: '1rem' 
      }}
    >
      <div 
        style={{ position: 'relative', maxWidth: '92%', maxHeight: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={url} 
          alt="Zoom" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '85vh', 
            borderRadius: '8px', 
            objectFit: 'contain', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)' 
          }} 
        />
        <button 
          type="button"
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '-38px', 
            right: '0', 
            background: 'none', 
            border: 'none', 
            color: '#FFF', 
            cursor: 'pointer', 
            padding: '4px' 
          }}
        >
          <X size={26} />
        </button>
      </div>
    </div>
  );
}