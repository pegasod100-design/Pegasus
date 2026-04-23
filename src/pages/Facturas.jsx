import { useEffect, useState } from 'react';
import { getFacturas, createFactura, getTiendas, getProductos } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Facturas() {
  const { empleado } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ folio_factura: '', empresa_proveedora: '', id_tienda: '', items: [] });
  const [itemForm, setItemForm] = useState({ codigo_producto: '', cantidad_entrada: '', precio_compra: '' });
  const [search, setSearch] = useState('');

  // Cargar facturas
  const cargar = () => {
    setLoading(true);
    getFacturas()
      .then(r => setFacturas(r.data))
      .finally(() => setLoading(false));
  };

  // Cargar tiendas y productos
  useEffect(() => {
    cargar();
    getTiendas().then(r => setTiendas(r.data));
    getProductos({ activo: true }).then(r => setProductos(r.data));
  }, []);

  // Agregar producto al formulario
  const agregarItem = () => {
    const prod = productos.find(p => p.codigo_producto === itemForm.codigo_producto);
    if (!prod || !itemForm.cantidad_entrada || !itemForm.precio_compra) {
      alert('Completa los campos del producto');
      return;
    }
    setForm(f => ({
      ...f,
      items: [...f.items, {
        codigo_producto: prod.codigo_producto,
        nombre_producto: prod.nombre_producto,
        cantidad_entrada: parseInt(itemForm.cantidad_entrada),
        precio_compra: parseFloat(itemForm.precio_compra)
      }]
    }));
    setItemForm({ codigo_producto: '', cantidad_entrada: '', precio_compra: '' });
  };

  // Guardar factura
  const guardar = async () => {
    if (!form.folio_factura || !form.empresa_proveedora || !form.id_tienda || !form.items.length) {
      alert('Completa todos los campos y agrega al menos un producto');
      return;
    }
    setSaving(true);
    try {
      await createFactura(form);
      setModal(false);
      setForm({ folio_factura: '', empresa_proveedora: '', id_tienda: '', items: [] });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar factura');
    } finally { setSaving(false); }
  };

  // Filtrado por folio o proveedor
  const filtradas = facturas.filter(f =>
    search === '' ||
    f.folio_factura?.toLowerCase().includes(search.toLowerCase()) ||
    f.empresa_proveedora?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.pageTitle}>📋 Compras a Proveedores</h1>
        <button style={s.addBtn} onClick={() => setModal(true)}>+ Nueva compra</button>
      </div>

      <input
        style={s.searchInput}
        placeholder="🔍 Buscar por folio o proveedor..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? <p style={s.loading}>Cargando...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Folio', 'Fecha', 'Proveedor', 'Tienda', 'Registró'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f, i) => (
                <tr key={f.folio_factura} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 700 }}>{f.folio_factura}</td>
                  <td style={s.td}>{f.fecha}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{f.empresa_proveedora}</td>
                  <td style={s.td}>{f.tiendas?.nombre_tienda}</td>
                  <td style={s.td}>{f.catalogo_empleados?.nombre} {f.catalogo_empleados?.apellido_paterno}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Sin registros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva compra */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Nueva compra</h2>

            <div style={s.formGrid}>
              <div>
                <label style={s.label}>Folio de factura</label>
                <input style={s.input} value={form.folio_factura}
                  onChange={e => setForm(fm => ({ ...fm, folio_factura: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Empresa proveedora</label>
                <input style={s.input} value={form.empresa_proveedora}
                  onChange={e => setForm(fm => ({ ...fm, empresa_proveedora: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Tienda</label>
                <select style={s.input} value={form.id_tienda}
                  onChange={e => setForm(fm => ({ ...fm, id_tienda: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
                </select>
              </div>
            </div>

            <h3 style={s.subTitle}>Agregar productos</h3>
            <div style={s.itemRow}>
              <select style={{ ...s.input, flex: 2 }} value={itemForm.codigo_producto}
                onChange={e => setItemForm(f => ({ ...f, codigo_producto: e.target.value }))}>
                <option value="">Seleccionar producto...</option>
                {productos.map(p => <option key={p.codigo_producto} value={p.codigo_producto}>{p.nombre_producto}</option>)}
              </select>
              <input style={{ ...s.input, width: 70 }} type="number" placeholder="Cant." value={itemForm.cantidad_entrada}
                onChange={e => setItemForm(f => ({ ...f, cantidad_entrada: e.target.value }))} />
              <input style={{ ...s.input, width: 90 }} type="number" placeholder="Precio" value={itemForm.precio_compra}
                onChange={e => setItemForm(f => ({ ...f, precio_compra: e.target.value }))} />
              <button style={s.addItemBtn} onClick={agregarItem}>+</button>
            </div>

            {form.items.length > 0 && (
              <div style={s.itemsList}>
                {form.items.map((it, i) => (
                  <div key={i} style={s.itemLine}>
                    <span style={{ flex: 1 }}>{it.nombre_producto}</span>
                    <span>x{it.cantidad_entrada}</span>
                    <span>${it.precio_compra}</span>
                    <button style={s.delItem} onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={() => setModal(false)}>Cancelar</button>
              <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  addBtn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  searchInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' },
  loading: { textAlign: 'center', color: '#64748b', padding: 32 },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f1f5f9' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  td: { padding: '11px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalCard: { background: '#fff', borderRadius: 16, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 48px rgba(0,0,0,.18)' },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 800 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 },
  input: { padding: '9px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  subTitle: { fontSize: 14, fontWeight: 700, color: '#475569', margin: '8px 0' },
  itemRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 },
  addItemBtn: { padding: '9px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 800, fontSize: 18 },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 },
  itemLine: { display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: '7px 12px', borderRadius: 7, fontSize: 13 },
  delItem: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 },
  saveBtn: { flex: 2, padding: '10px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }
};