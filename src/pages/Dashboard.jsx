import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { getDashboard, getVentasPorDia, getProductosMasVendidos } from '../services/api';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [grafVentas, setGrafVentas] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getVentasPorDia({ fecha_inicio: hace30() }),
      getProductosMasVendidos({ limit: 6 })
    ]).then(([d, v, p]) => {
      setKpis(d.data);
      setGrafVentas(v.data.map(r => ({
        fecha: r.fecha_venta?.slice(5),
        total: parseFloat(r.total_con_iva || 0).toFixed(2),
        ventas: r.num_ventas
      })));
      setTopProductos(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.center}>Cargando dashboard...</div>;

  const cards = [
    { label: 'Ventas hoy', value: `$${(kpis?.ventas_hoy?.total || 0).toLocaleString()}`, sub: `${kpis?.ventas_hoy?.num_ventas || 0} transacciones`, color: '#2563eb', icon: '💰' },
    { label: 'Ingresos 30 días', value: `$${(kpis?.ventas_30_dias || 0).toLocaleString()}`, sub: 'Últimos 30 días', color: '#16a34a', icon: '📈' },
    { label: 'Alertas de stock', value: kpis?.alertas_stock || 0, sub: 'Productos con stock bajo', color: '#dc2626', icon: '⚠️' },
    { label: 'Productos activos', value: kpis?.total_productos_activos || 0, sub: `${kpis?.total_tiendas_activas || 0} tiendas activas`, color: '#7c3aed', icon: '🏷️' },
  ];

  return (
    <div>
      <h1 style={s.pageTitle}>Dashboard</h1>

      {/* KPI Cards */}
      <div style={s.kpiGrid}>
        {cards.map(c => (
          <div key={c.label} style={{ ...s.card, borderTop: `4px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={s.cardLabel}>{c.label}</div>
                <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
                <div style={s.cardSub}>{c.sub}</div>
              </div>
              <span style={{ fontSize: 32 }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Ventas últimos 30 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={grafVentas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `$${parseFloat(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Productos más vendidos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="nombre_producto" type="category" tick={{ fontSize: 10 }} width={110} />
              <Tooltip />
              <Bar dataKey="total_cantidad" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const hace30 = () => {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

const s = {
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 24 },
  center: { textAlign: 'center', padding: 80, color: '#64748b' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.07)' },
  cardLabel: { fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 4 },
  cardValue: { fontSize: 28, fontWeight: 800, lineHeight: 1.2 },
  cardSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  chartCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.07)' },
  chartTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }
};
