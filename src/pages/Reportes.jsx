import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getVentasPorDia, getProductosMasVendidos, getVentasPorTienda, getTiendas } from '../services/api';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#0d9488','#b45309'];

const css = `
  .rep-wrap { font-family: 'DM Sans', sans-serif; }
  .rep-title { font-size:clamp(18px,4vw,26px); font-weight:800; color:#1e293b; margin:0 0 4px; }
  .rep-subtitle { font-size:13px; color:#64748b; margin:0 0 20px; }
  /* TABS */
  .rep-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px; }
  .rep-tab { padding:8px 18px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#64748b; transition:all .15s; white-space:nowrap; }
  .rep-tab.active { background:#2563eb; color:#fff; border-color:#2563eb; }
  .rep-tab:hover:not(.active) { background:#f8fafc; }
  /* FILTROS */
  .rep-filtros { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:20px; background:#fff; padding:14px 16px; border-radius:12px; box-shadow:0 1px 6px rgba(0,0,0,.06); }
  .rep-filtros select, .rep-filtros input[type=date] { padding:9px 12px; border-radius:8px; border:1.5px solid #e2e8f0; font-size:13px; flex:1 1 140px; min-width:0; }
  /* KPI */
  .rep-kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:20px; }
  @media(min-width:640px){ .rep-kpis { grid-template-columns:repeat(4,1fr); } }
  .rep-kpi { background:#fff; border-radius:12px; padding:14px 16px; box-shadow:0 1px 6px rgba(0,0,0,.07); display:flex; flex-direction:column; gap:4px; }
  .rep-kpi-val { font-size:22px; font-weight:800; }
  .rep-kpi-lbl { font-size:11px; color:#64748b; font-weight:500; }
  /* GRID CHARTS */
  .rep-grid { display:grid; grid-template-columns:1fr; gap:16px; }
  @media(min-width:700px){ .rep-grid { grid-template-columns:1fr 1fr; } .rep-full { grid-column:1/-1; } }
  .rep-card { background:#fff; border-radius:12px; padding:18px; box-shadow:0 1px 8px rgba(0,0,0,.07); }
  .rep-card-title { margin:0 0 14px; font-size:14px; font-weight:700; color:#1e293b; }
  .rep-table-wrap { overflow-x:auto; }
  .rep-table { width:100%; border-collapse:collapse; min-width:420px; }
  /* BOTÓN PDF */
  .btn-pdf { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; background:#dc2626; color:#fff; border:none; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .btn-pdf:hover { background:#b91c1c; }
  .btn-pdf:disabled { opacity:.6; cursor:not-allowed; }
`;

// ── Generar PDF sin librería externa (usa window.print con iframe oculto) ────
function generarPDF(htmlContent, nombreArchivo) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:900px;height:600px;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${nombreArchivo}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;padding:24px;}
      h1{font-size:20px;font-weight:800;margin-bottom:4px;}
      h2{font-size:15px;font-weight:700;margin:20px 0 10px;color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:6px;}
      p{font-size:11px;color:#64748b;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;}
      th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;color:#475569;font-weight:700;}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;}
      tr:nth-child(even) td{background:#f8fafc;}
      .kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
      .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;min-width:150px;}
      .kpi-val{font-size:22px;font-weight:800;color:#2563eb;}
      .kpi-lbl{font-size:10px;color:#64748b;text-transform:uppercase;margin-top:2px;}
      .verde{color:#16a34a;} .rojo{color:#dc2626;}
      @media print{body{padding:12px;} button{display:none;}}
    </style>
  </head><body>${htmlContent}</body></html>`);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

// Períodos predefinidos
function getPeriodo(tipo) {
  const hoy = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const add = (d, days) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };
  const subMonth = (d, m) => { const r = new Date(d); r.setMonth(r.getMonth() - m); return r; };
  switch(tipo) {
    case 'hoy':    return { ini: fmt(hoy), fin: fmt(hoy), label: 'Hoy' };
    case 'semana': return { ini: fmt(add(hoy, -7)), fin: fmt(hoy), label: 'Últimos 7 días' };
    case 'mes':    return { ini: fmt(add(hoy, -30)), fin: fmt(hoy), label: 'Últimos 30 días' };
    case 'mes_actual': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { ini: fmt(ini), fin: fmt(hoy), label: 'Mes actual' };
    }
    case 'mes_anterior': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      return { ini: fmt(ini), fin: fmt(fin), label: 'Mes anterior' };
    }
    case 'trimestre': return { ini: fmt(subMonth(hoy, 3)), fin: fmt(hoy), label: 'Últimos 3 meses' };
    default: return { ini: fmt(add(hoy, -30)), fin: fmt(hoy), label: 'Últimos 30 días' };
  }
}

export default function Reportes() {
  const [tab, setTab]                 = useState('ventas');
  const [ventasDia, setVentasDia]     = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasTienda, setVentasTienda] = useState([]);
  const [tiendas, setTiendas]         = useState([]);
  const [periodo, setPeriodo]         = useState('mes');
  const [idTienda, setIdTienda]       = useState('');
  const [fechaIni, setFechaIni]       = useState('');
  const [fechaFin, setFechaFin]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const periodoObj = getPeriodo(periodo);
  const ini = fechaIni || periodoObj.ini;
  const fin = fechaFin || periodoObj.fin;

  const cargar = () => {
    setLoading(true);
    const params = { fecha_inicio: ini, fecha_fin: fin };
    if (idTienda) params.id_tienda = idTienda;
    Promise.all([
      getVentasPorDia(params),
      getProductosMasVendidos({ ...params, limit: 10 }),
      getVentasPorTienda(params)
    ]).then(([vd, tp, vt]) => {
      setVentasDia(vd.data.map(r => ({
        fecha: r.fecha_venta?.slice(5),
        fecha_completa: r.fecha_venta,
        total: parseFloat(r.total_con_iva || 0),
        ventas: parseInt(r.num_ventas || 0)
      })));
      setTopProductos(tp.data);
      setVentasTienda(vt.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { getTiendas().then(r => setTiendas(r.data)); }, []);
  useEffect(() => { cargar(); }, [ini, fin, idTienda]);

  const totalIngresos = ventasDia.reduce((a, r) => a + r.total, 0);
  const totalVentas   = ventasDia.reduce((a, r) => a + r.ventas, 0);
  const ticketProm    = totalVentas > 0 ? totalIngresos / totalVentas : 0;
  const mejorDia      = ventasDia.length ? ventasDia.reduce((a,b) => b.total > a.total ? b : a, ventasDia[0]) : null;

  // ── Generar HTML para PDF ──────────────────────────────────────────────────
  const descargarPDF = () => {
    setGenerandoPDF(true);
    const tiendaNombre = tiendas.find(t => String(t.id_tienda) === String(idTienda))?.nombre_tienda || 'Todas las tiendas';
    const periodoLabel = fechaIni ? `${fechaIni} al ${fechaFin}` : periodoObj.label;

    const filasVentas = ventasDia.map(r => `
      <tr>
        <td>${r.fecha_completa || r.fecha}</td>
        <td>${r.ventas}</td>
        <td class="verde">$${r.total.toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
        <td>${r.ventas > 0 ? '$'+(r.total/r.ventas).toFixed(2) : '-'}</td>
      </tr>`).join('');

    const filasProductos = topProductos.map((p, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${p.nombre_producto}</td>
        <td>${p.categoria || '-'}</td>
        <td>${p.total_cantidad?.toLocaleString()}</td>
        <td class="verde">$${parseFloat(p.total_ingresos||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
      </tr>`).join('');

    const filasTiendas = ventasTienda.map((t, i) => `
      <tr>
        <td>${t.nombre_tienda}</td>
        <td>${t.total_ventas?.toLocaleString()}</td>
        <td class="verde">$${t.total_ingresos?.toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
        <td>$${t.total_ventas > 0 ? (t.total_ingresos/t.total_ventas).toFixed(2) : '0.00'}</td>
      </tr>`).join('');

    const html = `
      <h1>📊 Reporte de Ventas — Abarrotes</h1>
      <p>Período: <strong>${periodoLabel}</strong> &nbsp;|&nbsp; Tienda: <strong>${tiendaNombre}</strong> &nbsp;|&nbsp; Generado: ${new Date().toLocaleString('es-MX')}</p>

      <div class="kpis">
        <div class="kpi"><div class="kpi-val verde">$${totalIngresos.toLocaleString('es-MX',{maximumFractionDigits:0})}</div><div class="kpi-lbl">Ingresos totales</div></div>
        <div class="kpi"><div class="kpi-val" style="color:#7c3aed">${totalVentas.toLocaleString()}</div><div class="kpi-lbl">Transacciones</div></div>
        <div class="kpi"><div class="kpi-val" style="color:#d97706">$${ticketProm.toFixed(2)}</div><div class="kpi-lbl">Ticket promedio</div></div>
        <div class="kpi"><div class="kpi-val" style="color:#0891b2">${mejorDia ? mejorDia.fecha : '-'}</div><div class="kpi-lbl">Mejor día</div></div>
      </div>

      <h2>Ventas por día</h2>
      <table>
        <thead><tr><th>Fecha</th><th>N° Ventas</th><th>Ingresos</th><th>Ticket prom.</th></tr></thead>
        <tbody>${filasVentas || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Sin datos</td></tr>'}</tbody>
      </table>

      <h2>Productos más vendidos</h2>
      <table>
        <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Unidades</th><th>Ingresos</th></tr></thead>
        <tbody>${filasProductos || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Sin datos</td></tr>'}</tbody>
      </table>

      <h2>Resumen por tienda</h2>
      <table>
        <thead><tr><th>Tienda</th><th>N° Ventas</th><th>Ingresos</th><th>Ticket prom.</th></tr></thead>
        <tbody>${filasTiendas || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Sin datos</td></tr>'}</tbody>
      </table>
    `;

    generarPDF(html, `Reporte_Ventas_${ini}_${fin}`);
    setTimeout(() => setGenerandoPDF(false), 2000);
  };

  const th = { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', whiteSpace:'nowrap', background:'#f1f5f9' };
  const td = { padding:'9px 14px', fontSize:13, color:'#334155', borderBottom:'1px solid #f1f5f9' };

  return (
    <>
      <style>{css}</style>
      <div className="rep-wrap">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:4 }}>
          <div>
            <h1 className="rep-title">📈 Reportes de Ventas</h1>
            <p className="rep-subtitle">Análisis de ventas por día, mes, tienda y productos</p>
          </div>
          <button className="btn-pdf" onClick={descargarPDF} disabled={generandoPDF || loading}>
            {generandoPDF ? '⏳ Generando...' : '📄 Descargar PDF'}
          </button>
        </div>

        {/* TABS */}
        <div className="rep-tabs">
          {[
            { id:'ventas',    label:'📅 Por día' },
            { id:'mensual',   label:'📆 Por mes' },
            { id:'tiendas',   label:'🏪 Por tienda' },
            { id:'productos', label:'🏷️ Productos' },
          ].map(t => (
            <button key={t.id} className={`rep-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* FILTROS */}
        <div className="rep-filtros">
          <select value={periodo} onChange={e => { setPeriodo(e.target.value); setFechaIni(''); setFechaFin(''); }}>
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Últimos 30 días</option>
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="trimestre">Últimos 3 meses</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {periodo === 'personalizado' && (
            <>
              <input type="date" value={fechaIni} onChange={e => setFechaIni(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </>
          )}

          <select value={idTienda} onChange={e => setIdTienda(e.target.value)} style={{ flex:'1 1 160px' }}>
            <option value="">Todas las tiendas</option>
            {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
          </select>
        </div>

        {/* KPIs */}
        <div className="rep-kpis">
          {[
            { val: `$${totalIngresos.toLocaleString('es-MX',{maximumFractionDigits:0})}`, lbl:'Ingresos totales', color:'#2563eb' },
            { val: totalVentas.toLocaleString(), lbl:'Transacciones', color:'#7c3aed' },
            { val: `$${ticketProm.toFixed(2)}`, lbl:'Ticket promedio', color:'#d97706' },
            { val: mejorDia ? mejorDia.fecha : '-', lbl:'Mejor día', color:'#16a34a' },
          ].map(k => (
            <div key={k.lbl} className="rep-kpi">
              <span className="rep-kpi-val" style={{ color:k.color }}>{k.val}</span>
              <span className="rep-kpi-lbl">{k.lbl}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', padding:40, color:'#64748b' }}>Cargando reportes...</p>
        ) : (
          <div className="rep-grid">

            {/* ── TAB: VENTAS POR DÍA ── */}
            {tab === 'ventas' && (
              <>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Ingresos por día</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={ventasDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => `$${parseFloat(v).toLocaleString('es-MX')}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Ingresos $" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="ventas" name="N° ventas" stroke="#16a34a" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Detalle por día</h3>
                  <div className="rep-table-wrap">
                    <table className="rep-table">
                      <thead><tr>
                        {['Fecha','N° Ventas','Ingresos (c/IVA)','Ticket promedio'].map(h=><th key={h} style={th}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {ventasDia.map((r,i) => (
                          <tr key={i} style={{ background: i%2 ? '#f8fafc' : '#fff' }}>
                            <td style={td}>{r.fecha_completa || r.fecha}</td>
                            <td style={td}>{r.ventas}</td>
                            <td style={{ ...td, fontWeight:700, color:'#16a34a' }}>${r.total.toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
                            <td style={td}>${r.ventas>0?(r.total/r.ventas).toFixed(2):'-'}</td>
                          </tr>
                        ))}
                        {ventasDia.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign:'center', color:'#94a3b8' }}>Sin datos en el período</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB: MENSUAL ── */}
            {tab === 'mensual' && (() => {
              // Agrupar ventasDia por mes
              const porMes = {};
              ventasDia.forEach(r => {
                const mes = (r.fecha_completa || r.fecha)?.slice(0,7) || r.fecha?.slice(0,4+1+2);
                if (!porMes[mes]) porMes[mes] = { mes, total:0, ventas:0 };
                porMes[mes].total += r.total;
                porMes[mes].ventas += r.ventas;
              });
              const datosMes = Object.values(porMes).sort((a,b)=>a.mes.localeCompare(b.mes));
              return (
                <>
                  <div className="rep-card rep-full">
                    <h3 className="rep-card-title">Ingresos por mes</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={datosMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="mes" tick={{ fontSize:11 }} />
                        <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                        <Bar dataKey="total" name="Ingresos $" fill="#2563eb" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rep-card rep-full">
                    <h3 className="rep-card-title">Resumen mensual</h3>
                    <div className="rep-table-wrap">
                      <table className="rep-table">
                        <thead><tr>
                          {['Mes','N° Ventas','Ingresos','Ticket promedio'].map(h=><th key={h} style={th}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {datosMes.map((r,i)=>(
                            <tr key={i} style={{ background:i%2?'#f8fafc':'#fff' }}>
                              <td style={{ ...td, fontWeight:700 }}>{r.mes}</td>
                              <td style={td}>{r.ventas.toLocaleString()}</td>
                              <td style={{ ...td, fontWeight:700, color:'#16a34a' }}>${r.total.toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
                              <td style={td}>${r.ventas>0?(r.total/r.ventas).toFixed(2):'-'}</td>
                            </tr>
                          ))}
                          {datosMes.length===0 && <tr><td colSpan={4} style={{ ...td, textAlign:'center', color:'#94a3b8' }}>Sin datos</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* ── TAB: POR TIENDA ── */}
            {tab === 'tiendas' && (
              <>
                <div className="rep-card">
                  <h3 className="rep-card-title">Distribución de ingresos por tienda</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={ventasTienda} dataKey="total_ingresos" nameKey="nombre_tienda"
                        cx="50%" cy="50%" outerRadius={100}
                        label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {ventasTienda.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rep-card">
                  <h3 className="rep-card-title">Ventas por tienda</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ventasTienda}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nombre_tienda" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                      <Bar dataKey="total_ingresos" name="Ingresos" fill="#2563eb" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Tabla comparativa por tienda</h3>
                  <div className="rep-table-wrap">
                    <table className="rep-table">
                      <thead><tr>
                        {['Tienda','N° Ventas','Ingresos totales','Ticket promedio','% del total'].map(h=><th key={h} style={th}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {ventasTienda.map((t,i)=>(
                          <tr key={t.id_tienda} style={{ background:i%2?'#f8fafc':'#fff' }}>
                            <td style={{ ...td, fontWeight:700 }}>{t.nombre_tienda}</td>
                            <td style={td}>{t.total_ventas?.toLocaleString()}</td>
                            <td style={{ ...td, fontWeight:700, color:'#16a34a' }}>${t.total_ingresos?.toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
                            <td style={td}>${t.total_ventas>0?(t.total_ingresos/t.total_ventas).toFixed(2):'0.00'}</td>
                            <td style={td}>{totalIngresos>0?((t.total_ingresos/totalIngresos)*100).toFixed(1)+'%':'0%'}</td>
                          </tr>
                        ))}
                        {ventasTienda.length===0 && <tr><td colSpan={5} style={{ ...td, textAlign:'center', color:'#94a3b8' }}>Sin datos</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB: PRODUCTOS ── */}
            {tab === 'productos' && (
              <>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Productos más vendidos (unidades)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProductos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize:10 }} />
                      <YAxis dataKey="nombre_producto" type="category" tick={{ fontSize:9 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="total_cantidad" name="Unidades" fill="#2563eb" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Ranking de productos</h3>
                  <div className="rep-table-wrap">
                    <table className="rep-table">
                      <thead><tr>
                        {['#','Producto','Categoría','Unidades','Ingresos'].map(h=><th key={h} style={th}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {topProductos.map((p,i)=>(
                          <tr key={p.codigo_producto} style={{ background:i%2?'#f8fafc':'#fff' }}>
                            <td style={{ ...td, fontWeight:800, color:'#2563eb' }}>{i+1}</td>
                            <td style={{ ...td, fontWeight:600 }}>{p.nombre_producto}</td>
                            <td style={td}><span style={{ background:'#ede9fe', color:'#6d28d9', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{p.categoria||'-'}</span></td>
                            <td style={{ ...td, fontWeight:700 }}>{p.total_cantidad?.toLocaleString()}</td>
                            <td style={{ ...td, fontWeight:700, color:'#16a34a' }}>${parseFloat(p.total_ingresos||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
                          </tr>
                        ))}
                        {topProductos.length===0 && <tr><td colSpan={5} style={{ ...td, textAlign:'center', color:'#94a3b8' }}>Sin datos</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </>
  );
}
