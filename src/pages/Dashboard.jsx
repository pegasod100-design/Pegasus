import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { getDashboard, getVentasPorDia, getProductosMasVendidos } from '../services/api';

const css = `
  .dash-kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  @media (min-width: 640px) {
    .dash-kpi-grid { grid-template-columns: repeat(4, 1fr); }
  }
  .dash-charts-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 700px) {
    .dash-charts-row { grid-template-columns: 1fr 1fr; }
  }
  .dash-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 8px rgba(0,0,0,.07);
  }
  .dash-page-title {
    font-size: clamp(20px, 4vw, 26px);
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 20px;
  }
  .dash-card-value {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 800;
    line-height: 1.2;
  }
`;

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

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>Cargando dashboard...</div>;

  const cards = [
    { label: 'Ventas hoy', value: `$${(kpis?.ventas_hoy?.total || 0).toLocaleString()}`, sub: `${kpis?.ventas_hoy?.num_ventas || 0} transacciones`, color: '#2563eb', icon: '💰' },
    { label: 'Ingresos 30 días', value: `$${(kpis?.ventas_30_dias || 0).toLocaleString()}`, sub: 'Últimos 30 días', color: '#16a34a', icon: '📈' },
    { label: 'Alertas stock', value: kpis?.alertas_stock || 0, sub: 'Stock bajo', color: '#dc2626', icon: '⚠️' },
    { label: 'Productos activos', value: kpis?.total_productos_activos || 0, sub: `${kpis?.total_tiendas_activas || 0} tiendas`, color: '#7c3aed', icon: '🏷️' },
  ];

  return (
    <>
      <style>{css}</style>
      <div>
        <h1 className="dash-page-title">📊 Dashboard</h1>

        <div className="dash-kpi-grid">
          {cards.map(c => (
            <div key={c.label} className="dash-card" style={{ borderTop: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{c.label}</div>
                  <div className="dash-card-value" style={{ color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{c.sub}</div>
                </div>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-charts-row">
          <div className="dash-card">
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Ventas últimos 30 días</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={grafVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${parseFloat(v).toLocaleString()}`} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="dash-card">
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Productos más vendidos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProductos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="nombre_producto" type="category" tick={{ fontSize: 9 }} width={90} />
                <Tooltip />
                <Bar dataKey="total_cantidad" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

const hace30 = () => {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
