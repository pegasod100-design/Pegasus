import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getVentasPorDia, getProductosMasVendidos, getVentasPorTienda, getTiendas } from '../services/api';
import api from '../services/api';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#0d9488','#b45309'];

const css = `
  .rep-title{font-size:clamp(18px,4vw,26px);font-weight:800;color:#1e293b;margin:0 0 4px;}
  .rep-subtitle{font-size:13px;color:#64748b;margin:0 0 18px;}
  .rep-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}
  .rep-tab{padding:8px 18px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:all .15s;white-space:nowrap;}
  .rep-tab.active{background:#2563eb;color:#fff;border-color:#2563eb;}
  .rep-tab:hover:not(.active){background:#f8fafc;}
  .rep-filtros{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px;background:#fff;padding:14px 16px;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
  .rep-filtros select,.rep-filtros input[type=date]{padding:9px 12px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:13px;flex:1 1 140px;min-width:0;}
  .rep-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px;}
  @media(min-width:640px){.rep-kpis{grid-template-columns:repeat(4,1fr);}}
  .rep-kpi{background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.07);display:flex;flex-direction:column;gap:4px;}
  .rep-kpi-val{font-size:22px;font-weight:800;}
  .rep-kpi-lbl{font-size:11px;color:#64748b;font-weight:500;}
  .rep-grid{display:grid;grid-template-columns:1fr;gap:16px;}
  @media(min-width:700px){.rep-grid{grid-template-columns:1fr 1fr;}.rep-full{grid-column:1/-1;}}
  .rep-card{background:#fff;border-radius:12px;padding:18px;box-shadow:0 1px 8px rgba(0,0,0,.07);}
  .rep-card-title{margin:0 0 14px;font-size:14px;font-weight:700;color:#1e293b;}
  .rep-table-wrap{overflow-x:auto;}
  .rep-table{width:100%;border-collapse:collapse;min-width:380px;}
  .btn-pdf{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#1e293b;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;white-space:nowrap;}
  .btn-pdf:hover{background:#0f172a;}
  .btn-pdf:disabled{opacity:.6;cursor:not-allowed;}
  .pdf-btns{display:flex;gap:8px;flex-wrap:wrap;}
`;

// ── Estilos del PDF (sin emojis) ─────────────────────────────────────────────
const PDF_CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;padding:28px 32px;}
  .encabezado{border-bottom:2px solid #1e293b;padding-bottom:12px;margin-bottom:18px;}
  .titulo-reporte{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:2px;}
  .subtitulo{font-size:11px;color:#64748b;}
  .seccion{margin-bottom:24px;}
  .seccion-titulo{font-size:14px;font-weight:800;color:#1e293b;margin-bottom:10px;padding:6px 10px;background:#f1f5f9;border-left:4px solid #2563eb;}
  .tienda-encabezado{font-size:16px;font-weight:800;color:#2563eb;margin:20px 0 8px;padding:8px 12px;background:#eff6ff;border-radius:6px;}
  .dia-encabezado{font-size:12px;font-weight:700;color:#475569;margin:12px 0 4px;padding:4px 8px;background:#f8fafc;border-left:3px solid #94a3b8;}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;}
  th{background:#1e293b;color:#fff;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;}
  th.num{text-align:right;}
  td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;}
  td.num{text-align:right;font-variant-numeric:tabular-nums;}
  tr:nth-child(even) td{background:#f8fafc;}
  .total-row td{font-weight:800;border-top:2px solid #1e293b;background:#f1f5f9!important;font-size:12px;}
  .resumen-final{margin-top:16px;padding:14px 16px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:6px;}
  .resumen-final h4{font-size:12px;font-weight:800;color:#15803d;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;}
  .resumen-final p{font-size:11px;color:#166534;margin:3px 0;line-height:1.5;}
  .kpis-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
  .kpi-box{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;}
  .kpi-val{font-size:18px;font-weight:800;color:#2563eb;}
  .kpi-lbl{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-top:2px;}
  .pie-legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
  .pie-legend-item{display:flex;align-items:center;gap:4px;font-size:10px;}
  .pie-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
  @media print{
    body{padding:16px 20px;}
    .btn-pdf{display:none;}
    @page{margin:12mm;}
  }
`;

// ── Función para abrir ventana de impresión / guardar PDF ─────────────────────
function abrirPDF(htmlBody, titulo) {
  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) { alert('Permite las ventanas emergentes para descargar el PDF.'); return; }
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="utf-8"/>
    <title>${titulo}</title>
    <style>${PDF_CSS}</style>
  </head><body>${htmlBody}
    <script>
      window.onload = function(){ window.print(); };
    </script>
  </body></html>`);
  win.document.close();
}

function fmt(n) { return parseFloat(n||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtN(n) { return parseInt(n||0).toLocaleString('es-MX'); }

// ── GENERADORES DE PDF ────────────────────────────────────────────────────────

// PDF 1: Reporte por Producto
function generarPDFProductos(detalle, periodo, tiendaNombre) {
  const fecha = new Date().toLocaleString('es-MX');
  let html = `
  <div class="encabezado">
    <div class="titulo-reporte">REPORTE DE VENTAS POR PRODUCTO</div>
    <div class="subtitulo">Periodo: ${periodo} &nbsp;|&nbsp; Tienda: ${tiendaNombre} &nbsp;|&nbsp; Generado: ${fecha}</div>
  </div>`;

  // Consolidar todos los productos de todas las tiendas del detalle
  const todosProd = {};
  const todasFechas = {};

  detalle.forEach(tienda => {
    tienda.fechas.forEach(f => {
      if (!todasFechas[f.fecha]) todasFechas[f.fecha] = { fecha: f.fecha, productos: {}, total_dia: 0 };
      f.productos.forEach(p => {
        // Acumular por fecha
        if (!todasFechas[f.fecha].productos[p.codigo_producto])
          todasFechas[f.fecha].productos[p.codigo_producto] = { ...p, cantidad: 0, importe: 0 };
        todasFechas[f.fecha].productos[p.codigo_producto].cantidad += p.cantidad;
        todasFechas[f.fecha].productos[p.codigo_producto].importe  += p.importe;
        todasFechas[f.fecha].total_dia += p.importe;

        // Acumular total período
        if (!todosProd[p.codigo_producto])
          todosProd[p.codigo_producto] = { ...p, cantidad: 0, importe: 0 };
        todosProd[p.codigo_producto].cantidad += p.cantidad;
        todosProd[p.codigo_producto].importe  += p.importe;
      });
    });
  });

  // Tabla por día
  const fechasOrdenadas = Object.values(todasFechas).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  fechasOrdenadas.forEach(diaData => {
    const prods = Object.values(diaData.productos).sort((a,b)=>b.importe-a.importe);
    html += `
    <div class="dia-encabezado">Fecha: ${diaData.fecha}</div>
    <table>
      <thead><tr>
        <th>ID Producto</th><th>Nombre del Producto</th><th>Categoria</th>
        <th class="num">Cant. Vendida</th><th class="num">Importe ($)</th>
      </tr></thead>
      <tbody>
        ${prods.map(p=>`<tr>
          <td>${p.codigo_producto}</td>
          <td>${p.nombre_producto}</td>
          <td>${p.categoria}</td>
          <td class="num">${fmtN(p.cantidad)}</td>
          <td class="num">$${fmt(p.importe)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="3">TOTAL DEL DIA ${diaData.fecha}</td>
          <td class="num">${fmtN(prods.reduce((s,p)=>s+p.cantidad,0))}</td>
          <td class="num">$${fmt(diaData.total_dia)}</td>
        </tr>
      </tbody>
    </table>`;
  });

  // Tabla resumen del período completo
  const prodsArr = Object.values(todosProd).sort((a,b)=>b.importe-a.importe);
  const totalPeriodo = prodsArr.reduce((s,p)=>s+p.importe,0);
  const totalUnidades = prodsArr.reduce((s,p)=>s+p.cantidad,0);

  html += `
  <div class="seccion-titulo">RESUMEN TOTAL DEL PERIODO</div>
  <table>
    <thead><tr>
      <th>ID Producto</th><th>Nombre del Producto</th><th>Categoria</th>
      <th class="num">Total Unidades</th><th class="num">Total Importe ($)</th>
    </tr></thead>
    <tbody>
      ${prodsArr.map(p=>`<tr>
        <td>${p.codigo_producto}</td>
        <td>${p.nombre_producto}</td>
        <td>${p.categoria}</td>
        <td class="num">${fmtN(p.cantidad)}</td>
        <td class="num">$${fmt(p.importe)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="3">TOTAL GENERAL DEL PERIODO</td>
        <td class="num">${fmtN(totalUnidades)}</td>
        <td class="num">$${fmt(totalPeriodo)}</td>
      </tr>
    </tbody>
  </table>`;

  // Resumen final — productos mas vendidos
  if (prodsArr.length > 0) {
    const top3 = prodsArr.slice(0,3);
    html += `
    <div class="resumen-final">
      <h4>PRODUCTOS MAS VENDIDOS EN ESTE PERIODO</h4>
      ${top3.map((p,i)=>`<p>${i+1}. ${p.nombre_producto} (${p.codigo_producto}) — ${fmtN(p.cantidad)} unidades — $${fmt(p.importe)}</p>`).join('')}
    </div>`;
  }

  abrirPDF(html, `Reporte_Productos_${periodo}`);
}

// PDF 2: Reporte por Tienda (cada tienda con sus productos)
function generarPDFPorTienda(detalle, periodo) {
  const fecha = new Date().toLocaleString('es-MX');
  let html = `
  <div class="encabezado">
    <div class="titulo-reporte">REPORTE DE VENTAS POR TIENDA</div>
    <div class="subtitulo">Periodo: ${periodo} &nbsp;|&nbsp; Todas las tiendas &nbsp;|&nbsp; Generado: ${fecha}</div>
  </div>`;

  detalle.forEach(tienda => {
    html += `<div class="tienda-encabezado">${tienda.nombre_tienda.toUpperCase()}</div>`;

    // Por fecha
    tienda.fechas.forEach(diaData => {
      html += `
      <div class="dia-encabezado">Fecha: ${diaData.fecha}</div>
      <table>
        <thead><tr>
          <th>ID Producto</th><th>Nombre del Producto</th><th>Categoria</th>
          <th class="num">Cant. Vendida</th><th class="num">Importe ($)</th>
        </tr></thead>
        <tbody>
          ${diaData.productos.map(p=>`<tr>
            <td>${p.codigo_producto}</td>
            <td>${p.nombre_producto}</td>
            <td>${p.categoria}</td>
            <td class="num">${fmtN(p.cantidad)}</td>
            <td class="num">$${fmt(p.importe)}</td>
          </tr>`).join('')}
          <tr class="total-row">
            <td colspan="3">TOTAL DEL DIA — ${tienda.nombre_tienda}</td>
            <td class="num">${fmtN(diaData.productos.reduce((s,p)=>s+p.cantidad,0))}</td>
            <td class="num">$${fmt(diaData.total_dia)}</td>
          </tr>
        </tbody>
      </table>`;
    });

    // Resumen período por tienda
    html += `
    <table>
      <thead><tr>
        <th colspan="3">RESUMEN DEL PERIODO — ${tienda.nombre_tienda.toUpperCase()}</th>
        <th class="num">Total Unidades</th><th class="num">Total Importe ($)</th>
      </tr></thead>
      <tbody>
        ${tienda.productos_periodo.map(p=>`<tr>
          <td>${p.codigo_producto}</td>
          <td>${p.nombre_producto}</td>
          <td>${p.categoria}</td>
          <td class="num">${fmtN(p.cantidad)}</td>
          <td class="num">$${fmt(p.importe)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="3">TOTAL GENERAL — ${tienda.nombre_tienda.toUpperCase()}</td>
          <td class="num">${fmtN(tienda.productos_periodo.reduce((s,p)=>s+p.cantidad,0))}</td>
          <td class="num">$${fmt(tienda.total_periodo)}</td>
        </tr>
      </tbody>
    </table>`;

    // Producto mas vendido de esta tienda
    if (tienda.mas_vendido) {
      html += `
      <div class="resumen-final">
        <h4>PRODUCTO MAS VENDIDO EN ${tienda.nombre_tienda.toUpperCase()}</h4>
        <p>${tienda.mas_vendido.nombre_producto} (${tienda.mas_vendido.codigo_producto}) — ${fmtN(tienda.mas_vendido.cantidad)} unidades — $${fmt(tienda.mas_vendido.importe)}</p>
      </div>`;
    }
  });

  abrirPDF(html, `Reporte_Por_Tienda_${periodo}`);
}

// PDF 3: Comparativo de Tiendas
function generarPDFComparativoTiendas(detalle, ventasTienda, periodo) {
  const fecha = new Date().toLocaleString('es-MX');
  const totalGeneral = ventasTienda.reduce((s,t)=>s+t.total_ingresos,0);
  const mejorTienda  = ventasTienda.reduce((a,b)=>b.total_ingresos>a.total_ingresos?b:a, ventasTienda[0]||{});

  let html = `
  <div class="encabezado">
    <div class="titulo-reporte">REPORTE COMPARATIVO DE TIENDAS</div>
    <div class="subtitulo">Periodo: ${periodo} &nbsp;|&nbsp; Generado: ${fecha}</div>
  </div>

  <div class="seccion-titulo">COMPARATIVO GENERAL DE VENTAS POR TIENDA</div>
  <table>
    <thead><tr>
      <th>Tienda</th>
      <th class="num">N. de Ventas</th>
      <th class="num">Total Ingresos ($)</th>
      <th class="num">Ticket Promedio ($)</th>
      <th class="num">% del Total</th>
    </tr></thead>
    <tbody>
      ${ventasTienda.sort((a,b)=>b.total_ingresos-a.total_ingresos).map((t,i)=>`<tr>
        <td>${t.nombre_tienda}</td>
        <td class="num">${fmtN(t.total_ventas)}</td>
        <td class="num">$${fmt(t.total_ingresos)}</td>
        <td class="num">$${t.total_ventas>0?fmt(t.total_ingresos/t.total_ventas):'-'}</td>
        <td class="num">${totalGeneral>0?((t.total_ingresos/totalGeneral)*100).toFixed(1)+'%':'-'}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td>TOTAL GENERAL</td>
        <td class="num">${fmtN(ventasTienda.reduce((s,t)=>s+t.total_ventas,0))}</td>
        <td class="num">$${fmt(totalGeneral)}</td>
        <td class="num"></td>
        <td class="num">100%</td>
      </tr>
    </tbody>
  </table>`;

  // Detalle de productos por tienda (resumen, sin desglose por día)
  html += `<div class="seccion-titulo">PRODUCTOS VENDIDOS POR TIENDA EN EL PERIODO</div>`;
  detalle.forEach(tienda => {
    html += `
    <div class="tienda-encabezado">${tienda.nombre_tienda.toUpperCase()}</div>
    <table>
      <thead><tr>
        <th>ID Producto</th><th>Nombre del Producto</th><th>Categoria</th>
        <th class="num">Total Unidades</th><th class="num">Total Importe ($)</th>
      </tr></thead>
      <tbody>
        ${tienda.productos_periodo.map(p=>`<tr>
          <td>${p.codigo_producto}</td>
          <td>${p.nombre_producto}</td>
          <td>${p.categoria}</td>
          <td class="num">${fmtN(p.cantidad)}</td>
          <td class="num">$${fmt(p.importe)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="3">TOTAL — ${tienda.nombre_tienda.toUpperCase()}</td>
          <td class="num">${fmtN(tienda.productos_periodo.reduce((s,p)=>s+p.cantidad,0))}</td>
          <td class="num">$${fmt(tienda.total_periodo)}</td>
        </tr>
      </tbody>
    </table>`;
  });

  // Resumen final comparativo
  html += `
  <div class="resumen-final">
    <h4>TIENDA CON MAYOR VOLUMEN DE VENTAS EN EL PERIODO</h4>
    <p>Tienda: ${mejorTienda.nombre_tienda || '-'}</p>
    <p>Ingresos totales: $${fmt(mejorTienda.total_ingresos||0)}</p>
    <p>Numero de transacciones: ${fmtN(mejorTienda.total_ventas||0)}</p>
    <p>Participacion en ventas totales: ${totalGeneral>0?((( mejorTienda.total_ingresos||0)/totalGeneral)*100).toFixed(1)+'%':'-'}</p>`;

  // Producto más vendido por tienda
  if (detalle.length > 0) {
    html += `<br/><h4>PRODUCTO MAS VENDIDO POR TIENDA</h4>`;
    detalle.forEach(t => {
      if (t.mas_vendido) {
        html += `<p>${t.nombre_tienda}: ${t.mas_vendido.nombre_producto} — ${fmtN(t.mas_vendido.cantidad)} unidades — $${fmt(t.mas_vendido.importe)}</p>`;
      }
    });
  }

  html += `</div>`;
  abrirPDF(html, `Reporte_Comparativo_Tiendas_${periodo}`);
}

// ── Períodos ─────────────────────────────────────────────────────────────────
function getPeriodo(tipo) {
  const hoy = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const add = (d,days) => { const r=new Date(d); r.setDate(r.getDate()+days); return r; };
  switch(tipo) {
    case 'hoy':          return { ini: fmt(hoy), fin: fmt(hoy), label:'Hoy' };
    case 'semana':       return { ini: fmt(add(hoy,-7)), fin: fmt(hoy), label:'Ultimos 7 dias' };
    case 'mes':          return { ini: fmt(add(hoy,-30)), fin: fmt(hoy), label:'Ultimos 30 dias' };
    case 'mes_actual':   { const ini=new Date(hoy.getFullYear(),hoy.getMonth(),1); return { ini:fmt(ini), fin:fmt(hoy), label:'Mes actual' }; }
    case 'mes_anterior': { const ini=new Date(hoy.getFullYear(),hoy.getMonth()-1,1); const fin=new Date(hoy.getFullYear(),hoy.getMonth(),0); return { ini:fmt(ini), fin:fmt(fin), label:'Mes anterior' }; }
    case 'trimestre':    return { ini: fmt(add(hoy,-90)), fin: fmt(hoy), label:'Ultimos 3 meses' };
    default:             return { ini: fmt(add(hoy,-30)), fin: fmt(hoy), label:'Ultimos 30 dias' };
  }
}

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export default function Reportes() {
  const [tab, setTab]               = useState('ventas');
  const [ventasDia, setVentasDia]   = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasTienda, setVentasTienda] = useState([]);
  const [tiendas, setTiendas]       = useState([]);
  const [detalleCompleto, setDetalleCompleto] = useState([]);
  const [periodo, setPeriodo]       = useState('mes');
  const [idTienda, setIdTienda]     = useState('');
  const [fechaIni, setFechaIni]     = useState('');
  const [fechaFin, setFechaFin]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const periodoObj = getPeriodo(periodo);
  const ini = fechaIni || periodoObj.ini;
  const fin = fechaFin || periodoObj.fin;
  const periodoLabel = fechaIni ? `${ini} al ${fin}` : periodoObj.label;

  const cargar = () => {
    setLoading(true);
    const params = { fecha_inicio: ini, fecha_fin: fin };
    if (idTienda) params.id_tienda = idTienda;
    Promise.all([
      getVentasPorDia(params),
      getProductosMasVendidos({ ...params, limit:10 }),
      getVentasPorTienda(params),
      api.get('/reportes/detalle-productos', { params }),
    ]).then(([vd, tp, vt, det]) => {
      setVentasDia(vd.data.map(r => ({
        fecha: r.fecha_venta?.slice(5),
        fecha_completa: r.fecha_venta,
        total: parseFloat(r.total_con_iva||0),
        ventas: parseInt(r.num_ventas||0)
      })));
      setTopProductos(tp.data);
      setVentasTienda(vt.data);
      setDetalleCompleto(det.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { getTiendas().then(r => setTiendas(r.data)); }, []);
  useEffect(() => { cargar(); }, [ini, fin, idTienda]);

  const totalIngresos = ventasDia.reduce((a,r)=>a+r.total,0);
  const totalVentas   = ventasDia.reduce((a,r)=>a+r.ventas,0);
  const ticketProm    = totalVentas>0 ? totalIngresos/totalVentas : 0;
  const mejorDia      = ventasDia.length ? ventasDia.reduce((a,b)=>b.total>a.total?b:a,ventasDia[0]) : null;

  const tiendaNombreFiltro = tiendas.find(t=>String(t.id_tienda)===String(idTienda))?.nombre_tienda || 'Todas las tiendas';

  const th = { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', whiteSpace:'nowrap', background:'#f1f5f9' };
  const thr = { ...th, textAlign:'right' };
  const td = { padding:'9px 14px', fontSize:13, color:'#334155', borderBottom:'1px solid #f1f5f9' };
  const tdr = { ...td, textAlign:'right' };

  const handlePDF = async (tipo) => {
    setLoadingPDF(true);
    try {
      const detalle = detalleCompleto.length
        ? detalleCompleto
        : (await api.get('/reportes/detalle-productos', { params:{ fecha_inicio:ini, fecha_fin:fin, ...(idTienda?{id_tienda:idTienda}:{}) } })).data;

      if (tipo === 'productos')   generarPDFProductos(detalle, periodoLabel, tiendaNombreFiltro);
      if (tipo === 'por_tienda')  generarPDFPorTienda(detalle, periodoLabel);
      if (tipo === 'comparativo') generarPDFComparativoTiendas(detalle, ventasTienda, periodoLabel);
    } finally { setLoadingPDF(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <h1 className="rep-title">Reportes de Ventas</h1>
            <p className="rep-subtitle">Analisis de ventas por dia, mes, tienda y productos</p>
          </div>
          <div className="pdf-btns">
            <button className="btn-pdf" onClick={()=>handlePDF('productos')} disabled={loadingPDF||loading}>
              {loadingPDF?'Generando...':'PDF — Por Producto'}
            </button>
            <button className="btn-pdf" onClick={()=>handlePDF('por_tienda')} disabled={loadingPDF||loading}
              style={{ background:'#1d4ed8' }}>
              PDF — Por Tienda
            </button>
            <button className="btn-pdf" onClick={()=>handlePDF('comparativo')} disabled={loadingPDF||loading}
              style={{ background:'#15803d' }}>
              PDF — Comparativo
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="rep-tabs">
          {[
            {id:'ventas',    label:'Por Dia'},
            {id:'mensual',   label:'Por Mes'},
            {id:'tiendas',   label:'Por Tienda'},
            {id:'productos', label:'Por Producto'},
          ].map(t=>(
            <button key={t.id} className={`rep-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* FILTROS */}
        <div className="rep-filtros">
          <select value={periodo} onChange={e=>{setPeriodo(e.target.value);setFechaIni('');setFechaFin('');}}>
            <option value="hoy">Hoy</option>
            <option value="semana">Ultimos 7 dias</option>
            <option value="mes">Ultimos 30 dias</option>
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="trimestre">Ultimos 3 meses</option>
            <option value="personalizado">Personalizado</option>
          </select>
          {periodo==='personalizado' && (
            <>
              <input type="date" value={fechaIni} onChange={e=>setFechaIni(e.target.value)} />
              <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
            </>
          )}
          <select value={idTienda} onChange={e=>setIdTienda(e.target.value)}>
            <option value="">Todas las tiendas</option>
            {tiendas.map(t=><option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
          </select>
        </div>

        {/* KPIs */}
        <div className="rep-kpis">
          {[
            {val:`$${totalIngresos.toLocaleString('es-MX',{maximumFractionDigits:0})}`, lbl:'Ingresos totales', color:'#2563eb'},
            {val:totalVentas.toLocaleString(), lbl:'Transacciones', color:'#7c3aed'},
            {val:`$${ticketProm.toFixed(2)}`, lbl:'Ticket promedio', color:'#d97706'},
            {val:mejorDia?mejorDia.fecha:'-', lbl:'Mejor dia', color:'#16a34a'},
          ].map(k=>(
            <div key={k.lbl} className="rep-kpi">
              <span className="rep-kpi-val" style={{color:k.color}}>{k.val}</span>
              <span className="rep-kpi-lbl">{k.lbl}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{textAlign:'center',padding:40,color:'#64748b'}}>Cargando reportes...</p>
        ) : (
          <div className="rep-grid">

            {/* ── TAB VENTAS POR DIA ── */}
            {tab==='ventas' && <>
              <div className="rep-card rep-full">
                <h3 className="rep-card-title">Ingresos por dia</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={ventasDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="fecha" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Ingresos $" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="ventas" name="N ventas" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rep-card rep-full">
                <h3 className="rep-card-title">Detalle por dia</h3>
                <div className="rep-table-wrap">
                  <table className="rep-table">
                    <thead><tr>
                      <th style={th}>Fecha</th><th style={thr}>N Ventas</th>
                      <th style={thr}>Ingresos</th><th style={thr}>Ticket promedio</th>
                    </tr></thead>
                    <tbody>
                      {ventasDia.map((r,i)=>(
                        <tr key={i} style={{background:i%2?'#f8fafc':'#fff'}}>
                          <td style={td}>{r.fecha_completa||r.fecha}</td>
                          <td style={tdr}>{r.ventas}</td>
                          <td style={{...tdr,fontWeight:700,color:'#16a34a'}}>${fmt(r.total)}</td>
                          <td style={tdr}>${r.ventas>0?fmt(r.total/r.ventas):'-'}</td>
                        </tr>
                      ))}
                      {ventasDia.length===0 && <tr><td colSpan={4} style={{...td,textAlign:'center',color:'#94a3b8'}}>Sin datos en el periodo</td></tr>}
                      {ventasDia.length>0 && (
                        <tr style={{background:'#f1f5f9',fontWeight:800}}>
                          <td style={{...td,fontWeight:800}}>TOTAL</td>
                          <td style={{...tdr,fontWeight:800}}>{fmtN(totalVentas)}</td>
                          <td style={{...tdr,fontWeight:800,color:'#16a34a'}}>${fmt(totalIngresos)}</td>
                          <td style={{...tdr,fontWeight:800}}>${fmt(ticketProm)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}

            {/* ── TAB MENSUAL ── */}
            {tab==='mensual' && (()=>{
              const porMes={};
              ventasDia.forEach(r=>{
                const mes=(r.fecha_completa||'').slice(0,7)||r.fecha?.slice(0,5);
                if(!porMes[mes]) porMes[mes]={mes,total:0,ventas:0};
                porMes[mes].total+=r.total; porMes[mes].ventas+=r.ventas;
              });
              const datos=Object.values(porMes).sort((a,b)=>a.mes.localeCompare(b.mes));
              const totalM=datos.reduce((s,r)=>s+r.total,0);
              const ventasM=datos.reduce((s,r)=>s+r.ventas,0);
              return <>
                <div className="rep-card rep-full">
                  <h3 className="rep-card-title">Ingresos por mes</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={datos}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" tick={{fontSize:11}} />
                      <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
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
                        <th style={th}>Mes</th><th style={thr}>N Ventas</th>
                        <th style={thr}>Ingresos</th><th style={thr}>Ticket promedio</th>
                      </tr></thead>
                      <tbody>
                        {datos.map((r,i)=>(
                          <tr key={i} style={{background:i%2?'#f8fafc':'#fff'}}>
                            <td style={{...td,fontWeight:700}}>{r.mes}</td>
                            <td style={tdr}>{fmtN(r.ventas)}</td>
                            <td style={{...tdr,fontWeight:700,color:'#16a34a'}}>${fmt(r.total)}</td>
                            <td style={tdr}>${r.ventas>0?fmt(r.total/r.ventas):'-'}</td>
                          </tr>
                        ))}
                        {datos.length>0 && (
                          <tr style={{background:'#f1f5f9',fontWeight:800}}>
                            <td style={{...td,fontWeight:800}}>TOTAL</td>
                            <td style={{...tdr,fontWeight:800}}>{fmtN(ventasM)}</td>
                            <td style={{...tdr,fontWeight:800,color:'#16a34a'}}>${fmt(totalM)}</td>
                            <td style={{...tdr,fontWeight:800}}>${ventasM>0?fmt(totalM/ventasM):'-'}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>;
            })()}

            {/* ── TAB TIENDAS ── */}
            {tab==='tiendas' && <>
              <div className="rep-card">
                <h3 className="rep-card-title">Distribucion por tienda</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={ventasTienda} dataKey="total_ingresos" nameKey="nombre_tienda"
                      cx="50%" cy="50%" outerRadius={95}
                      label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {ventasTienda.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rep-card">
                <h3 className="rep-card-title">Ventas por tienda</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...ventasTienda].sort((a,b)=>b.total_ingresos-a.total_ingresos)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nombre_tienda" tick={{fontSize:10}} />
                    <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v=>`$${parseFloat(v).toLocaleString('es-MX')}`} />
                    <Bar dataKey="total_ingresos" name="Ingresos" fill="#2563eb" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rep-card rep-full">
                <h3 className="rep-card-title">Comparativo de tiendas</h3>
                <div className="rep-table-wrap">
                  <table className="rep-table">
                    <thead><tr>
                      <th style={th}>Tienda</th><th style={thr}>N Ventas</th>
                      <th style={thr}>Ingresos</th><th style={thr}>Ticket prom.</th><th style={thr}>% del total</th>
                    </tr></thead>
                    <tbody>
                      {[...ventasTienda].sort((a,b)=>b.total_ingresos-a.total_ingresos).map((t,i)=>(
                        <tr key={t.id_tienda} style={{background:i%2?'#f8fafc':'#fff'}}>
                          <td style={{...td,fontWeight:700}}>{t.nombre_tienda}</td>
                          <td style={tdr}>{fmtN(t.total_ventas)}</td>
                          <td style={{...tdr,fontWeight:700,color:'#16a34a'}}>${fmt(t.total_ingresos)}</td>
                          <td style={tdr}>${t.total_ventas>0?fmt(t.total_ingresos/t.total_ventas):'-'}</td>
                          <td style={tdr}>{totalIngresos>0?((t.total_ingresos/totalIngresos)*100).toFixed(1)+'%':'-'}</td>
                        </tr>
                      ))}
                      {ventasTienda.length>0 && (
                        <tr style={{background:'#f1f5f9',fontWeight:800}}>
                          <td style={{...td,fontWeight:800}}>TOTAL</td>
                          <td style={{...tdr,fontWeight:800}}>{fmtN(ventasTienda.reduce((s,t)=>s+t.total_ventas,0))}</td>
                          <td style={{...tdr,fontWeight:800,color:'#16a34a'}}>${fmt(totalIngresos)}</td>
                          <td style={tdr}></td>
                          <td style={{...tdr,fontWeight:800}}>100%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}

            {/* ── TAB PRODUCTOS ── */}
            {tab==='productos' && <>
              <div className="rep-card rep-full">
                <h3 className="rep-card-title">Productos mas vendidos (unidades)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProductos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{fontSize:10}} />
                    <YAxis dataKey="nombre_producto" type="category" tick={{fontSize:9}} width={120} />
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
                      <th style={th}>#</th><th style={th}>ID Producto</th><th style={th}>Nombre del Producto</th>
                      <th style={th}>Categoria</th><th style={thr}>Unidades</th><th style={thr}>Ingresos ($)</th>
                    </tr></thead>
                    <tbody>
                      {topProductos.map((p,i)=>(
                        <tr key={p.codigo_producto} style={{background:i%2?'#f8fafc':'#fff'}}>
                          <td style={{...td,fontWeight:800,color:'#2563eb'}}>{i+1}</td>
                          <td style={{...td,fontFamily:'monospace',fontSize:12}}>{p.codigo_producto}</td>
                          <td style={{...td,fontWeight:600}}>{p.nombre_producto}</td>
                          <td style={td}><span style={{background:'#ede9fe',color:'#6d28d9',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600}}>{p.categoria||'-'}</span></td>
                          <td style={{...tdr,fontWeight:700}}>{fmtN(p.total_cantidad)}</td>
                          <td style={{...tdr,fontWeight:700,color:'#16a34a'}}>${fmt(p.total_ingresos)}</td>
                        </tr>
                      ))}
                      {topProductos.length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#94a3b8'}}>Sin datos</td></tr>}
                      {topProductos.length>0 && (
                        <tr style={{background:'#f1f5f9',fontWeight:800}}>
                          <td colSpan={4} style={{...td,fontWeight:800}}>TOTAL</td>
                          <td style={{...tdr,fontWeight:800}}>{fmtN(topProductos.reduce((s,p)=>s+p.total_cantidad,0))}</td>
                          <td style={{...tdr,fontWeight:800,color:'#16a34a'}}>${fmt(topProductos.reduce((s,p)=>s+p.total_ingresos,0))}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}

          </div>
        )}
      </div>
    </>
  );
}
