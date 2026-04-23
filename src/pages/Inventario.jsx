import { useEffect, useState } from 'react';
import { getInventario, getTiendas } from '../services/api';

// 🔥 ESTADOS CORRECTOS (IGUAL QUE BACKEND)
const ESTADOS = {
  OK: 'Stock OK',
  BAJO: 'Stock bajo',
  SIN: 'Sin stock'
};

const ESTADO_COLOR = {
  [ESTADOS.OK]: '#16a34a',
  [ESTADOS.BAJO]: '#d97706',
  [ESTADOS.SIN]: '#dc2626'
};

const getBg = (estado) => {
  if (estado === ESTADOS.OK) return '#dcfce7';
  if (estado === ESTADOS.BAJO) return '#fef3c7';
  if (estado === ESTADOS.SIN) return '#fee2e2';
  return '#f1f5f9';
};

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

    getInventario(params)
      .then(r => setInventario(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getTiendas().then(r => setTiendas(r.data));
  }, []);

  useEffect(() => {
    cargar();
  }, [filtros.id_tienda, filtros.estado]);

  // 🔍 BUSCADOR
  const filtrados = inventario.filter(i =>
    filtros.search === '' ||
    i.nombre_producto?.toLowerCase().includes(filtros.search.toLowerCase()) ||
    i.codigo_producto?.includes(filtros.search)
  );

  // 📊 RESUMEN CORREGIDO
  const resumen = {
    ok: inventario.filter(i => i.estado_stock === ESTADOS.OK).length,
    bajo: inventario.filter(i => i.estado_stock === ESTADOS.BAJO).length,
    sin: inventario.filter(i => i.estado_stock === ESTADOS.SIN).length,
  };

  return (
    <div>
      <h1 style={s.pageTitle}>📦 Inventario</h1>

      {/* 🔥 RESUMEN CLICKABLE */}
      <div style={s.resumeRow}>
        {[
          { label: ESTADOS.OK, key: 'ok', color: '#16a34a', bg: '#dcfce7', count: resumen.ok },
          { label: ESTADOS.BAJO, key: 'bajo', color: '#d97706', bg: '#fef3c7', count: resumen.bajo },
          { label: ESTADOS.SIN, key: 'sin', color: '#dc2626', bg: '#fee2e2', count: resumen.sin },
        ].map(r => (
          <div
            key={r.key}
            onClick={() => setFiltros(f => ({ ...f, estado: r.label }))}
            style={{ ...s.chip, background: r.bg, color: r.color, cursor: 'pointer' }}
          >
            <span style={s.chipCount}>{r.count}</span>
            <span style={s.chipLabel}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* 🔍 FILTROS */}
      <div style={s.filtros}>
        <input
          style={s.input}
          placeholder="🔍 Buscar producto..."
          value={filtros.search}
          onChange={e => setFiltros(f => ({ ...f, search: e.target.value }))}
        />

        <select
          style={s.select}
          value={filtros.id_tienda}
          onChange={e => setFiltros(f => ({ ...f, id_tienda: e.target.value }))}
        >
          <option value="">Todas las tiendas</option>
          {tiendas.map(t => (
            <option key={t.id_tienda} value={t.id_tienda}>
              {t.nombre_tienda}
            </option>
          ))}
        </select>

        <select
          style={s.select}
          value={filtros.estado}
          onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          <option value={ESTADOS.OK}>Stock OK</option>
          <option value={ESTADOS.BAJO}>Stock bajo</option>
          <option value={ESTADOS.SIN}>Sin stock</option>
        </select>
      </div>

      {/* 📋 TABLA */}
      {loading ? (
        <p style={s.loading}>Cargando...</p>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Tienda</th>
                <th style={s.th}>Código</th>
                <th style={s.th}>Producto</th>
                <th style={s.th}>Categoría</th>
                <th style={s.th}>Stock</th>
                <th style={s.th}>Límite</th>
                <th style={s.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={s.td}>{item.nombre_tienda}</td>

                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>
                    {item.codigo_producto}
                  </td>

                  <td style={{ ...s.td, fontWeight: 600 }}>
                    {item.nombre_producto}
                  </td>

                  <td style={s.td}>
                    <span style={s.catTag}>{item.categoria}</span>
                  </td>

                  <td style={{ ...s.td, fontWeight: 700 }}>
                    {item.stock_actual}
                  </td>

                  <td style={s.td}>{item.limite_stock}</td>

                  <td style={s.td}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      color: ESTADO_COLOR[item.estado_stock],
                      background: getBg(item.estado_stock)
                    }}>
                      {item.estado_stock}
                    </span>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    {filtros.id_tienda || filtros.estado || filtros.search
                      ? 'Sin resultados para los filtros aplicados'
                      : 'No hay productos en el inventario'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 16 },
  resumeRow: { display: 'flex', gap: 12, marginBottom: 20 },
  chip: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10 },
  chipCount: { fontSize: 22, fontWeight: 800 },
  chipLabel: { fontSize: 13, fontWeight: 600 },
  filtros: { display: 'flex', gap: 12, marginBottom: 16 },
  input: { flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 },
  select: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 },
  loading: { textAlign: 'center', color: '#64748b', padding: 32 },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f1f5f9' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px' },
  td: { padding: '11px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' },
  catTag: { background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }
};