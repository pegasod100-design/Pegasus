import { useEffect, useState } from 'react';
import { getFacturas, createFactura, getTiendas, getProductos } from '../services/api';

const css = `
  .fact-header {
    display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap;
    gap: 10px; margin-bottom: 16px;
  }
  .fact-title { margin: 0; font-size: clamp(18px,4vw,26px); font-weight: 800; color: #1e293b; }
  .fact-add-btn {
    padding: 10px 18px; background: #2563eb; color: #fff;
    border: none; border-radius: 8px;
    font-weight: 700; cursor: pointer; font-size: 14px; white-space: nowrap;
  }
  .fact-search {
    width: 100%; padding: 10px 14px; border-radius: 8px;
    border: 1.5px solid #e2e8f0; font-size: 14px;
    margin-bottom: 14px; box-sizing: border-box;
  }
  /* Tabla con scroll horizontal en móvil */
  .fact-table-wrap {
    background: #fff; border-radius: 12px;
    box-shadow: 0 1px 8px rgba(0,0,0,.07);
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .fact-table { width: 100%; border-collapse: collapse; min-width: 480px; }
  /* Modal bottom-sheet en móvil */
  .fact-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display: flex; align-items: flex-end;
    justify-content: center; z-index: 300; padding: 0;
  }
  @media (min-width: 600px) {
    .fact-overlay { align-items: center; padding: 16px; }
  }
  .fact-modal {
    background: #fff;
    border-radius: 16px 16px 0 0;
    padding: 24px 20px;
    width: 100%; max-height: 92dvh;
    overflow-y: auto;
    box-shadow: 0 -4px 32px rgba(0,0,0,.15);
  }
  @media (min-width: 600px) {
    .fact-modal { border-radius: 16px; max-width: 540px; max-height: 90vh; }
  }
  .fact-form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
  @media (min-width: 480px) { .fact-form-grid { grid-template-columns: 1fr 1fr; } }
  .fact-item-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .fact-item-row select { flex: 1 1 160px; }
  .fact-item-row input { flex: 0 0 70px; }
`;

const inp = { padding: '9px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box' };
const lbl = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ folio_factura: '', empresa_proveedora: '', id_tienda: '', items: [] });
  const [itemForm, setItemForm] = useState({ codigo_producto: '', cantidad_entrada: '', precio_compra: '' });
  const [search, setSearch] = useState('');

  const cargar = () => {
    setLoading(true);
    getFacturas().then(r => setFacturas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    getTiendas().then(r => setTiendas(r.data));
    getProductos({ activo: true }).then(r => setProductos(r.data));
  }, []);

  const agregarItem = () => {
    const prod = productos.find(p => p.codigo_producto === itemForm.codigo_producto);
    if (!prod || !itemForm.cantidad_entrada || !itemForm.precio_compra) { alert('Completa los campos del producto'); return; }
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

  const guardar = async () => {
    if (!form.folio_factura || !form.empresa_proveedora || !form.id_tienda || !form.items.length) {
      alert('Completa todos los campos y agrega al menos un producto'); return;
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

  const filtradas = facturas.filter(f =>
    search === '' ||
    f.folio_factura?.toLowerCase().includes(search.toLowerCase()) ||
    f.empresa_proveedora?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{css}</style>
      <div>
        <div className="fact-header">
          <h1 className="fact-title">📋 Compras a Proveedores</h1>
          <button className="fact-add-btn" onClick={() => setModal(true)}>+ Nueva compra</button>
        </div>

        <input className="fact-search" placeholder="🔍 Buscar por folio o proveedor..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {loading ? <p style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>Cargando...</p> : (
          <div className="fact-table-wrap">
            <table className="fact-table">
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Folio', 'Fecha', 'Proveedor', 'Tienda', 'Registró'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((f, i) => (
                  <tr key={f.folio_factura} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{f.folio_factura}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' }}>{f.fecha}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#334155' }}>{f.empresa_proveedora}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155' }}>{f.tiendas?.nombre_tienda}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155' }}>{f.catalogo_empleados?.nombre} {f.catalogo_empleados?.apellido_paterno}</td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <div className="fact-overlay" onClick={() => setModal(false)}>
            <div className="fact-modal" onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Nueva compra</h2>

              <div className="fact-form-grid">
                <div>
                  <label style={lbl}>Folio de factura</label>
                  <input style={inp} value={form.folio_factura}
                    onChange={e => setForm(fm => ({ ...fm, folio_factura: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Empresa proveedora</label>
                  <input style={inp} value={form.empresa_proveedora}
                    onChange={e => setForm(fm => ({ ...fm, empresa_proveedora: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Tienda</label>
                  <select style={inp} value={form.id_tienda}
                    onChange={e => setForm(fm => ({ ...fm, id_tienda: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
                  </select>
                </div>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: '8px 0' }}>Agregar productos</h3>
              <div className="fact-item-row">
                <select style={{ ...inp, flex: '1 1 160px' }} value={itemForm.codigo_producto}
                  onChange={e => setItemForm(f => ({ ...f, codigo_producto: e.target.value }))}>
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => <option key={p.codigo_producto} value={p.codigo_producto}>{p.nombre_producto}</option>)}
                </select>
                <input style={{ ...inp, flex: '0 0 70px' }} type="number" placeholder="Cant."
                  value={itemForm.cantidad_entrada}
                  onChange={e => setItemForm(f => ({ ...f, cantidad_entrada: e.target.value }))} />
                <input style={{ ...inp, flex: '0 0 80px' }} type="number" placeholder="Precio"
                  value={itemForm.precio_compra}
                  onChange={e => setItemForm(f => ({ ...f, precio_compra: e.target.value }))} />
                <button style={{ padding: '9px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 800, fontSize: 18 }}
                  onClick={agregarItem}>+</button>
              </div>

              {form.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {form.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '7px 10px', borderRadius: 7, fontSize: 13, flexWrap: 'wrap' }}>
                      <span style={{ flex: 1 }}>{it.nombre_producto}</span>
                      <span>x{it.cantidad_entrada}</span>
                      <span>${it.precio_compra}</span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}
                        onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setModal(false)}>Cancelar</button>
                <button style={{ flex: 2, padding: 10, borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}
                  onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Registrar compra'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
