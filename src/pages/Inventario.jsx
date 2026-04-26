import { useEffect, useState } from 'react';
import { getInventario, getTiendas } from '../services/api';

const css = `
  .inv-title { font-size: clamp(18px,4vw,26px); font-weight: 800; color: #1e293b; margin: 0 0 16px; }
  .inv-chips { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .inv-chip { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; cursor: pointer; flex: 1 1 auto; min-width: 100px; }
  .inv-filtros { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .inv-filtros input, .inv-filtros select { flex: 1 1 140px; padding: 10px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0; font-size: 14px; min-width: 0; }
  .inv-table-wrap { background: #fff; border-radius: 12px; box-shadow: 0 1px 8px rgba(0,0,0,.07); overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .inv-table { width: 100%; border-collapse: collapse; min-width: 560px; }
`;

const ESTADOS = { OK: 'Stock OK', BAJO: 'Stock bajo', SIN: 'Sin stock' };
const ESTADO_COLOR = { 'Stock OK': '#16a34a', 'Stock bajo': '#d97706', 'Sin stock': '#dc2626' };
const getBg = e => ({ 'Stock OK': '#dcfce7', 'Stock bajo': '#fef3c7', 'Sin stock': '#fee2e2' }[e] || '#f1f5f9');

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [filtros, setFiltros] = useState({ id_tienda: '', estado: '', search: '' });
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtros.id_tienda) params.id_tienda = filtros.id_tienda;
    if (filtros.estado) params.estado = filtros.estado;
    getInventario(params).then(r => setInventario(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { getTiendas().then(r => setTiendas(r.data)); }, []);
  useEffect(() => { cargar(); }, [filtros.id_tienda, filtros.estado]);

  const filtrados = inventario.filter(i =>
    filtros.search === '' ||
    i.nombre_producto?.toLowerCase().includes(filtros.search.toLowerCase()) ||
    i.codigo_producto?.includes(filtros.search)
  );

  const resumen = {
    ok: inventario.filter(i => i.estado_stock === ESTADOS.OK).length,
    bajo: inventario.filter(i => i.estado_stock === ESTADOS.BAJO).length,
    sin: inventario.filter(i => i.estado_stock === ESTADOS.SIN).length,
  };

  return (
    <>
      <style>{css}</style>
      <div>
        <h1 className="inv-title">📦 Inventario</h1>

        <div className="inv-chips">
          {[
            { label: ESTADOS.OK, key: 'ok', color: '#16a34a', bg: '#dcfce7', count: resumen.ok },
            { label: ESTADOS.BAJO, key: 'bajo', color: '#d97706', bg: '#fef3c7', count: resumen.bajo },
            { label: ESTADOS.SIN, key: 'sin', color: '#dc2626', bg: '#fee2e2', count: resumen.sin },
          ].map(r => (
            <div key={r.key} className="inv-chip"
              style={{ background: r.bg, color: r.color }}
              onClick={() => setFiltros(f => ({ ...f, estado: r.label }))}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{r.count}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</span>
            </div>
          ))}
        </div>

        <div className="inv-filtros">
          <input placeholder="🔍 Buscar producto..." value={filtros.search}
            onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))} />
          <select value={filtros.id_tienda} onChange={e => setFiltros(f => ({ ...f, id_tienda: e.target.value }))}>
            <option value="">Todas las tiendas</option>
            {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
          </select>
          <select value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            <option value={ESTADOS.OK}>Stock OK</option>
            <option value={ESTADOS.BAJO}>Stock bajo</option>
            <option value={ESTADOS.SIN}>Sin stock</option>
          </select>
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>Cargando...</p> : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Tienda', 'Código', 'Producto', 'Categoría', 'Stock', 'Límite', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#334155' }}>{item.nombre_tienda}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>{item.codigo_producto}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.nombre_producto}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{item.categoria}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#334155' }}>{item.stock_actual}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#334155' }}>{item.limite_stock}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: ESTADO_COLOR[item.estado_stock], background: getBg(item.estado_stock), whiteSpace: 'nowrap' }}>
                        {item.estado_stock}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
