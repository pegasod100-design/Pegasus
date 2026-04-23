import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getVentasPorDia, getProductosMasVendidos, getVentasPorTienda, getTiendas } from '../services/api';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2'];

export default function Reportes() {
  const [ventasDia, setVentasDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasTienda, setVentasTienda] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [filtros, setFiltros] = useState({ id_tienda: '', dias: '30' });
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    const fechaInicio = (() => {
      const d = new Date(); d.setDate(d.getDate() - parseInt(filtros.dias));
      return d.toISOString().split('T')[0];
    })();
    const params = { fecha_inicio: fechaInicio };
    if (filtros.id_tienda) params.id_tienda = filtros.id_tienda;

    Promise.all([
      getVentasPorDia(params),
      getProductosMasVendidos({ ...params, limit: 8 }),
      getVentasPorTienda(params)
    ]).then(([vd, tp, vt]) => {
      setVentasDia(vd.data.map(r => ({
        fecha: r.fecha_venta?.slice(5),
        total: parseFloat(r.total_con_iva || 0),
        ventas: parseInt(r.num_ventas || 0)
      })));
      setTopProductos(tp.data);
      setVentasTienda(vt.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { getTiendas().then(r => setTiendas(r.data)); }, []);
  useEffect(() => { cargar(); }, [filtros]);

  const totalIngresos = ventasDia.reduce((a, r) => a + r.total, 0);
  const totalVentas = ventasDia.reduce((a, r) => a + r.ventas, 0);

  return (
    <div>
      <h1 style={s.pageTitle}>📈 Reportes y Estadísticas</h1>

      {/* Filtros */}
      <div style={s.filtrosRow}>
        <select style={s.select} value={filtros.dias}
          onChange={e => setFiltros(f => ({ ...f, dias: e.target.value }))}>
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
        <select style={s.select} value={filtros.id_tienda}
          onChange={e => setFiltros(f => ({ ...f, id_tienda: e.target.value }))}>
          <option value="">Todas las tiendas</option>
          {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
        </select>
        <div style={s.kpiMini}>
          <span style={s.kpiVal}>${totalIngresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
          <span style={s.kpiLabel}>Ingresos totales</span>
        </div>
        <div style={s.kpiMini}>
          <span style={s.kpiVal}>{totalVentas}</span>
          <span style={s.kpiLabel}>Transacciones</span>
        </div>
      </div>

      {loading ? <p style={s.loading}>Cargando reportes...</p> : (
        <div style={s.chartsGrid}>
          {/* Ventas por día */}
          <div style={{ ...s.chartCard, gridColumn: '1 / -1' }}>
            <h3 style={s.chartTitle}>Ingresos por día (con IVA)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ventasDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `$${parseFloat(v).toLocaleString('es-MX')}`} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total $" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="ventas" name="N° ventas" stroke="#16a34a" strokeWidth={2} dot={false} yAxisId={0} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top productos */}
          <div style={s.chartCard}>
            <h3 style={s.chartTitle}>Productos más vendidos (cantidad)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="nombre_producto" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="total_cantidad" name="Unidades" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ventas por tienda - Pie */}
          <div style={s.chartCard}>
            <h3 style={s.chartTitle}>Ingresos por tienda</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ventasTienda} dataKey="total_ingresos" nameKey="nombre_tienda"
                  cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {ventasTienda.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `$${parseFloat(v).toLocaleString('es-MX')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla resumen por tienda */}
          <div style={{ ...s.chartCard, gridColumn: '1 / -1' }}>
            <h3 style={s.chartTitle}>Resumen por tienda</h3>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Tienda', 'N° Ventas', 'Ingresos totales', 'Ticket promedio'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventasTienda.map((t, i) => (
                  <tr key={t.id_tienda} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>{t.nombre_tienda}</td>
                    <td style={s.td}>{t.total_ventas.toLocaleString()}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#16a34a' }}>
                      ${t.total_ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={s.td}>
                      ${t.total_ventas > 0 ? (t.total_ingresos / t.total_ventas).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
                {ventasTienda.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Sin datos en el período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 16 },
  filtrosRow: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  select: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 },
  kpiMini: { display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 10, padding: '10px 18px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' },
  kpiVal: { fontSize: 20, fontWeight: 800, color: '#2563eb' },
  kpiLabel: { fontSize: 11, color: '#64748b' },
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  chartCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.07)' },
  chartTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f1f5f9' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  td: { padding: '10px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' }
};
