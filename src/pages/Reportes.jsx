import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getVentasPorDia, getProductosMasVendidos, getVentasPorTienda, getTiendas } from '../services/api';

const css = `
  .rep-title { font-size: clamp(18px,4vw,26px); font-weight: 800; color: #1e293b; margin: 0 0 16px; }
  .rep-filtros {
    display: flex; gap: 10px; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .rep-filtros select {
    padding: 10px 12px; border-radius: 8px;
    border: 1.5px solid #e2e8f0; font-size: 14px;
    flex: 1 1 140px; min-width: 0;
  }
  .rep-kpi {
    display: flex; flex-direction: column;
    background: #fff; border-radius: 10px;
    padding: 10px 16px;
    box-shadow: 0 1px 6px rgba(0,0,0,.07);
    flex: 1 1 120px;
  }
  .rep-charts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 700px) {
    .rep-charts-grid { grid-template-columns: 1fr 1fr; }
    .rep-full { grid-column: 1 / -1; }
  }
  .rep-card {
    background: #fff; border-radius: 12px;
    padding: 18px;
    box-shadow: 0 1px 8px rgba(0,0,0,.07);
  }
  .rep-card-title { margin: 0 0 14px; font-size: 14px; font-weight: 700; color: #1e293b; }
  .rep-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .rep-table { width: 100%; border-collapse: collapse; min-width: 440px; }
`;

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
    <>
      <style>{css}</style>
      <div>
        <h1 className="rep-title">📈 Reportes y Estadísticas</h1>

        <div className="rep-filtros">
          <select value={filtros.dias} onChange={e => setFiltros(f => ({ ...f, dias: e.target.value }))}>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
          <select value={filtros.id_tienda} onChange={e => setFiltros(f => ({ ...f, id_tienda: e.target.value }))}>
            <option value="">Todas las tiendas</option>
            {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
          </select>
          <div className="rep-kpi">
            <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
              ${totalIngresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>Ingresos totales</span>
          </div>
          <div className="rep-kpi">
            <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{totalVentas}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>Transacciones</span>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando reportes...</p> : (
          <div className="rep-charts-grid">

            {/* Ventas por día - full width */}
            <div className="rep-card rep-full">
              <h3 className="rep-card-title">Ingresos por día (con IVA)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ventasDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `$${parseFloat(v).toLocaleString('es-MX')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total $" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ventas" name="N° ventas" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top productos */}
            <div className="rep-card">
              <h3 className="rep-card-title">Productos más vendidos</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="nombre_producto" type="category" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="total_cantidad" name="Unidades" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie tiendas */}
            <div className="rep-card">
              <h3 className="rep-card-title">Ingresos por tienda</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ventasTienda} dataKey="total_ingresos" nameKey="nombre_tienda"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {ventasTienda.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${parseFloat(v).toLocaleString('es-MX')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla resumen - full width */}
            <div className="rep-card rep-full">
              <h3 className="rep-card-title">Resumen por tienda</h3>
              <div className="rep-table-wrap">
                <table className="rep-table">
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {['Tienda', 'N° Ventas', 'Ingresos totales', 'Ticket promedio'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ventasTienda.map((t, i) => (
                      <tr key={t.id_tienda} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#334155' }}>{t.nombre_tienda}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>{t.total_ventas.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                          ${t.total_ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>
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

          </div>
        )}
      </div>
    </>
  );
}
