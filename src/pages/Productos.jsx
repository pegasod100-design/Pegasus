import { useEffect, useState } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto, getCategorias } from '../services/api';

const EMPTY = { codigo_producto: '', nombre_producto: '', unidad_medida: '', precio: '', categoria: '', descripcion: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [modal, setModal] = useState(null); // null | 'nuevo' | producto
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar productos activos
      const respProductos = await getProductos({ activo: true });
      setProductos(respProductos.data || []);
      
      // Cargar categorías
      try {
        const respCategorias = await getCategorias();
        setCategorias(respCategorias.data || []);
      } catch {
        setCategorias([]);
      }
    } catch (err) {
      setError('Error al cargar productos: ' + (err.response?.data?.error || err.message));
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrir = (p = null) => {
    setForm(p ? { ...p } : EMPTY);
    setModal(p ? 'editar' : 'nuevo');
  };

  const guardar = async () => {
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        await createProducto(form);
      } else {
        await updateProducto(form.codigo_producto, form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (codigo) => {
    if (!confirm('¿Desactivar este producto?')) return;
    try {
      await deleteProducto(codigo);
      cargar();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  // Filtrar productos
  const filtrados = productos.filter(p => {
    const matchSearch = p.nombre_producto?.toLowerCase().includes(search.toLowerCase()) ||
                       p.codigo_producto?.includes(search.toUpperCase()) ||
                       p.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  const estadisticas = {
    total: productos.length,
    categorias: [...new Set(productos.map(p => p.categoria))].length,
    promedioPrecio: productos.length > 0 ? 
      (productos.reduce((acc, p) => acc + parseFloat(p.precio || 0), 0) / productos.length).toFixed(2) : 0
  };

  return (
    <div style={s.page}>
      {/* Header con estadísticas */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>🏷️ Catálogo de Productos</h1>
          <div style={s.estadisticas}>
            <div style={s.estatCard}>
              <span style={s.estatNum}>{estadisticas.total}</span>
              <span style={s.estatLabel}>Total productos</span>
            </div>
            <div style={s.estatCard}>
              <span style={s.estatNum}>{estadisticas.categorias}</span>
              <span style={s.estatLabel}>Categorías</span>
            </div>
            <div style={s.estatCard}>
              <span style={s.estatNum}>${estadisticas.promedioPrecio}</span>
              <span style={s.estatLabel}>Precio promedio</span>
            </div>
          </div>
        </div>
        <button style={s.addBtn} onClick={() => abrir()}>+ Nuevo producto</button>
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        <div style={s.searchBox}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Buscar por nombre, código o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        
        <select
          style={s.categoriaSelect}
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div style={s.errorBox}>
          <span style={s.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button style={s.retryBtn} onClick={cargar}>Reintentar</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={s.loadingBox}>
          <span style={s.spinner}>⏳</span>
          <span>Cargando productos desde la base de datos...</span>
        </div>
      )}

      {/* Lista de productos */}
      {!loading && !error && (
        <>
          <div style={s.resultInfo}>
            {search || categoriaFiltro ? (
              <span>Mostrando {filtrados.length} de {productos.length} productos</span>
            ) : (
              <span>{productos.length} productos en total</span>
            )}
            {(search || categoriaFiltro) && (
              <button style={s.clearFilters} onClick={() => { setSearch(''); setCategoriaFiltro(''); }}>
                Limpiar filtros
              </button>
            )}
          </div>

          {filtrados.length === 0 ? (
            <div style={s.emptyState}>
              {search || categoriaFiltro ? (
                <>
                  <span style={s.emptyIcon}>🔍</span>
                  <div style={s.emptyTitle}>No se encontraron productos</div>
                  <div style={s.emptyText}>Intenta con otros términos de búsqueda o categoría</div>
                </>
              ) : (
                <>
                  <span style={s.emptyIcon}>📦</span>
                  <div style={s.emptyTitle}>No hay productos registrados</div>
                  <div style={s.emptyText}>Agrega tu primer producto para empezar</div>
                  <button style={s.emptyBtn} onClick={() => abrir()}>+ Agregar producto</button>
                </>
              )}
            </div>
          ) : (
            <div style={s.grid}>
              {filtrados.map(p => (
                <div key={p.codigo_producto} style={s.card}>
                  <div style={s.cardTop}>
                    <span style={s.catChip}>{p.categoria}</span>
                    <span style={s.codigo}>{p.codigo_producto}</span>
                  </div>
                  
                  <div style={s.prodNombre}>{p.nombre_producto}</div>
                  
                  <div style={s.prodInfo}>
                    <div style={s.unidad}>📏 {p.unidad_medida}</div>
                    {p.descripcion && (
                      <div style={s.descripcion}>{p.descripcion.slice(0, 80)}{p.descripcion.length > 80 ? '...' : ''}</div>
                    )}
                  </div>

                  <div style={s.cardBottom}>
                    <span style={s.precio}>${parseFloat(p.precio || 0).toFixed(2)}</span>
                    <div style={s.actions}>
                      <button style={s.editBtn} onClick={() => abrir(p)} title="Editar">✏️</button>
                      <button style={s.delBtn} onClick={() => eliminar(p.codigo_producto)} title="Desactivar">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{modal === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}</h2>
              <button style={s.modalClose} onClick={() => setModal(null)}>✕</button>
            </div>
            
            <div style={s.modalBody}>
              {[
                { label: 'Código del producto', key: 'codigo_producto', disabled: modal === 'editar', required: true },
                { label: 'Nombre del producto', key: 'nombre_producto', required: true },
                { label: 'Unidad de medida', key: 'unidad_medida', required: true, placeholder: 'kg, pza, lt, etc.' },
                { label: 'Precio', key: 'precio', type: 'number', step: '0.01', required: true },
                { label: 'Categoría', key: 'categoria', required: true },
              ].map(f => (
                <div key={f.key} style={s.formField}>
                  <label style={s.label}>
                    {f.label} {f.required && <span style={s.required}>*</span>}
                  </label>
                  <input
                    style={{ ...s.input, background: f.disabled ? '#f1f5f9' : '#fff' }}
                    type={f.type || 'text'}
                    step={f.step}
                    placeholder={f.placeholder}
                    value={form[f.key] || ''}
                    disabled={f.disabled}
                    onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              
              <div style={s.formField}>
                <label style={s.label}>Descripción</label>
                <textarea
                  style={{ ...s.input, height: 80, resize: 'vertical' }}
                  placeholder="Descripción opcional del producto..."
                  value={form.descripcion || ''}
                  onChange={e => setForm(fm => ({ ...fm, descripcion: e.target.value }))}
                />
              </div>
            </div>

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
              <button
                style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
                onClick={guardar}
                disabled={saving || !form.codigo_producto || !form.nombre_producto}
              >
                {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '0 0 12px' },
  estadisticas: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  estatCard: { background: '#fff', padding: '8px 16px', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.08)', minWidth: 80 },
  estatNum: { fontSize: 18, fontWeight: 800, color: '#2563eb' },
  estatLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  addBtn: { padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },

  filtros: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchBox: { flex: '1 1 300px', display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #e2e8f0', borderRadius: 10, padding: '2px 12px', gap: 8 },
  searchIcon: { fontSize: 18, color: '#94a3b8' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '10px 0', background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8', padding: 4 },
  categoriaSelect: { padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14, minWidth: 160, background: '#fff' },

  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', marginBottom: 16 },
  errorIcon: { fontSize: 18, flexShrink: 0 },
  retryBtn: { marginLeft: 'auto', padding: '4px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },

  loadingBox: { background: '#f8fafc', borderRadius: 8, padding: 40, textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 },
  spinner: { fontSize: 20, animation: 'spin 2s linear infinite' },

  resultInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, color: '#64748b', fontSize: 14 },
  clearFilters: { background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: '#64748b' },

  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
  emptyIcon: { fontSize: 48, marginBottom: 16, display: 'block' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', marginBottom: 8 },
  emptyText: { fontSize: 14, marginBottom: 20 },
  emptyBtn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform .2s, box-shadow .2s', cursor: 'default', border: '1px solid #f1f5f9' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  catChip: { background: '#ede9fe', color: '#6d28d9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 },
  codigo: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 },
  prodNombre: { fontWeight: 700, fontSize: 16, color: '#1e293b', lineHeight: '1.3' },
  prodInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  unidad: { fontSize: 12, color: '#64748b' },
  descripcion: { fontSize: 13, color: '#64748b', lineHeight: '1.4' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: '1px solid #f1f5f9' },
  precio: { fontSize: 20, fontWeight: 800, color: '#16a34a' },
  actions: { display: 'flex', gap: 6 },
  editBtn: { padding: '6px 10px', borderRadius: 6, background: '#dbeafe', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  delBtn: { padding: '6px 10px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modalCard: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: 4 },
  modalBody: { padding: '24px' },
  formField: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  required: { color: '#dc2626' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', gap: 12, padding: '20px 24px', borderTop: '1px solid #f1f5f9' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600 },
  saveBtn: { flex: 1, padding: '12px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 },
};

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
