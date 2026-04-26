import { useState, useEffect, useRef } from 'react';
import { getProductos, createVenta, getTiendas } from '../services/api';
import { useAuth } from '../context/AuthContext';

const css = `
  .pos-root { display:flex; flex-direction:column; gap:16px; }
  @media (min-width:700px) {
    .pos-root { flex-direction:row; height:calc(100vh - 120px); }
    .pos-left { flex:1; overflow-y:auto; padding-right:4px; }
    .pos-right { width:300px; flex-shrink:0; display:flex; flex-direction:column; gap:12px; overflow-y:auto; }
  }
  .pos-title { margin:0 0 8px; font-size:clamp(17px,3vw,20px); font-weight:800; color:#1e293b; }
  .pos-select { width:100%; padding:10px 12px; border-radius:8px; border:1.5px solid #e2e8f0; font-size:14px; box-sizing:border-box; }
  .pos-search { width:100%; padding:12px 16px; border-radius:8px; border:2px solid #2563eb; font-size:15px; outline:none; box-sizing:border-box; transition:border-color .2s; }
  .pos-search.error { border-color:#ef4444; background:#fef2f2; }
  .pos-resultados { background:#fff; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,.10); max-height:240px; overflow-y:auto; }
  .pos-prod-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:background .1s; }
  .pos-prod-row:hover { background:#f0f9ff; }
  .pos-prod-row.sin-stock { opacity:0.5; cursor:not-allowed; background:#fef2f2; }
  .pos-carrito-list { display:flex; flex-direction:column; gap:6px; }
  .pos-item { display:flex; align-items:center; gap:8px; background:#fff; border-radius:8px; padding:10px 12px; box-shadow:0 1px 4px rgba(0,0,0,.06); flex-wrap:wrap; }
  .pos-resumen { background:#fff; border-radius:12px; padding:18px; box-shadow:0 1px 8px rgba(0,0,0,.08); display:flex; flex-direction:column; gap:10px; }
  .pos-cobrar { padding:14px; background:#16a34a; color:#fff; border:none; border-radius:8px; font-size:16px; font-weight:800; cursor:pointer; width:100%; transition:background .2s; }
  .pos-cobrar:hover:not(:disabled) { background:#15803d; }
  .pos-cobrar:disabled { opacity:0.6; cursor:not-allowed; }
  .pos-cancel { padding:10px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; width:100%; }
  /* Alerta producto no disponible */
  .alerta-stock { background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; padding:14px 16px; display:flex; align-items:flex-start; gap:10px; animation:slideIn .2s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  /* Email cliente */
  .email-cliente-wrap { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
  .email-cliente-input { width:100%; padding:9px 12px; border-radius:7px; border:1.5px solid #e2e8f0; font-size:13px; box-sizing:border-box; outline:none; transition:border-color .2s; }
  .email-cliente-input:focus { border-color:#2563eb; }
  /* Ticket visual */
  .ticket-wrap { background:#fff; border-radius:12px; box-shadow:0 1px 8px rgba(0,0,0,.08); overflow:hidden; }
  .ticket-header { background:#16a34a; color:#fff; padding:14px 18px; text-align:center; }
  .ticket-body { padding:16px; font-size:13px; display:flex; flex-direction:column; gap:6px; }
  .ticket-row { display:flex; justify-content:space-between; color:#334155; padding:4px 0; border-bottom:1px dashed #f1f5f9; }
  .ticket-row:last-of-type { border-bottom:none; }
  .ticket-total { display:flex; justify-content:space-between; font-weight:800; font-size:17px; color:#1e293b; border-top:2px solid #e2e8f0; padding-top:10px; margin-top:4px; }
  .tienda-badge { background:#dcfce7; border:1px solid #bbf7d0; border-radius:8px; padding:6px 12px; font-size:12px; color:#15803d; font-weight:600; }
`;

export default function POS() {
  const { empleado } = useAuth();
  const [productos, setProductos] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [search, setSearch] = useState('');
  const [idTienda, setIdTienda] = useState('');
  const [tiendaNombre, setTiendaNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [alertaStock, setAlertaStock] = useState(null);   // { nombre, codigo }
  const [correoCliente, setCorreoCliente] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const searchRef = useRef();

  useEffect(() => {
    getProductos({ activo: true }).then(r => setProductos(r.data));
    getTiendas().then(r => setTiendas(r.data));
    searchRef.current?.focus();
  }, []);

  // Detectar tienda del empleado automáticamente
  useEffect(() => {
    if (!empleado || !tiendas.length) return;
    const id = empleado.id_tienda;
    if (id) {
      const t = tiendas.find(t => String(t.id_tienda) === String(id));
      if (t) { setIdTienda(String(t.id_tienda)); setTiendaNombre(t.nombre_tienda); return; }
    }
    const nombre = empleado.tiendas?.nombre_tienda;
    if (nombre) {
      const t = tiendas.find(t => t.nombre_tienda === nombre);
      if (t) { setIdTienda(String(t.id_tienda)); setTiendaNombre(t.nombre_tienda); }
    }
  }, [empleado, tiendas]);

  const esAdmin = empleado?.puesto === 'Administrador';

  // Filtrar resultados de búsqueda
  const filtrados = search.length > 1
    ? productos.filter(p =>
        p.nombre_producto.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo_producto.includes(search)
      ).slice(0, 12)
    : [];

  // Al presionar Enter en el buscador — agrega si hay 1 resultado exacto o lanza alerta
  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (filtrados.length === 0 && search.length > 1) {
      setAlertaStock({ nombre: search, codigo: search, noEncontrado: true });
      setTimeout(() => setAlertaStock(null), 3500);
      return;
    }
    if (filtrados.length === 1) {
      intentarAgregar(filtrados[0]);
    }
  };

  const intentarAgregar = (p) => {
    setAlertaStock(null);
    // Si el producto no tiene stock en la tienda actual, mostrar alerta
    // (stock_actual viene del producto si la API lo incluye, si no, lo dejamos pasar)
    if (p.stock_actual !== undefined && p.stock_actual <= 0 && idTienda) {
      setAlertaStock({ nombre: p.nombre_producto, codigo: p.codigo_producto, sinStock: true });
      setTimeout(() => setAlertaStock(null), 3500);
      setSearch('');
      return;
    }
    agregarProducto(p);
  };

  const agregarProducto = p => {
    setCarrito(prev => {
      const exist = prev.find(i => i.codigo_producto === p.codigo_producto);
      if (exist) return prev.map(i =>
        i.codigo_producto === p.codigo_producto ? { ...i, cantidad: i.cantidad + 1 } : i
      );
      return [...prev, { ...p, cantidad: 1, precio_unitario: p.precio }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const cambiarCantidad = (codigo, delta) =>
    setCarrito(prev => prev.map(i =>
      i.codigo_producto === codigo ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i
    ));

  const eliminar = codigo => setCarrito(prev => prev.filter(i => i.codigo_producto !== codigo));

  const subtotal = carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);
  const iva      = 0;
  const total    = subtotal;

  const cobrar = async () => {
    if (!carrito.length || !idTienda) return alert('Agrega productos y verifica la tienda');
    setLoading(true);
    try {
      const { data } = await createVenta({
        iva: 0,
        id_tienda: parseInt(idTienda),
        correo_cliente: correoCliente.trim() || null,
        nombre_cliente: nombreCliente.trim() || 'Cliente',
        items: carrito.map(i => ({
          codigo_producto:  i.codigo_producto,
          cantidad_venta:   i.cantidad,
          precio_unitario:  i.precio_unitario
        }))
      });
      setTicket({ ...data, carrito, subtotal, iva, total });
      setCarrito([]);
      setCorreoCliente('');
      setNombreCliente('');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar venta');
    } finally { setLoading(false); }
  };

  const nuevaVenta = () => {
    setTicket(null);
    searchRef.current?.focus();
  };

  return (
    <>
      <style>{css}</style>
      <div className="pos-root">

        {/* ── PANEL IZQUIERDO ── */}
        <div className="pos-left" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <h2 className="pos-title">🛒 Punto de Venta</h2>

          {/* Badge empleado */}
          {empleado && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:7, padding:'6px 12px', fontSize:12, color:'#1d4ed8', fontWeight:600 }}>
              👤 {empleado.nombre || empleado.rfc_empleado} · {empleado.puesto}
            </div>
          )}

          {/* Tienda */}
          {idTienda && !esAdmin ? (
            <div className="tienda-badge">🏪 Tienda: <strong>{tiendaNombre}</strong></div>
          ) : (
            <select className="pos-select" value={idTienda}
              onChange={e => {
                setIdTienda(e.target.value);
                const t = tiendas.find(t => String(t.id_tienda) === e.target.value);
                setTiendaNombre(t?.nombre_tienda || '');
              }}>
              <option value="">— Seleccionar tienda —</option>
              {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
            </select>
          )}

          {!idTienda && !esAdmin && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#c2410c' }}>
              ⚠️ Sin tienda asignada. Contacta al administrador.
            </div>
          )}

          {/* Buscador / escáner */}
          <input
            ref={searchRef}
            className={`pos-search${alertaStock ? ' error' : ''}`}
            placeholder="🔍 Buscar o escanear código de producto..."
            value={search}
            onChange={e => { setSearch(e.target.value); setAlertaStock(null); }}
            onKeyDown={handleSearchKeyDown}
          />

          {/* ── ALERTA PRODUCTO NO DISPONIBLE ── */}
          {alertaStock && (
            <div className="alerta-stock">
              <span style={{ fontSize:24 }}>🚫</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#dc2626' }}>
                  {alertaStock.noEncontrado ? 'Producto no encontrado' : 'Producto no disponible'}
                </div>
                <div style={{ fontSize:12, color:'#ef4444', marginTop:2 }}>
                  {alertaStock.noEncontrado
                    ? `No existe ningún producto con el código "${alertaStock.codigo}".`
                    : `"${alertaStock.nombre}" no tiene stock disponible en esta tienda.`}
                </div>
              </div>
            </div>
          )}

          {/* Resultados búsqueda */}
          {filtrados.length > 0 && !alertaStock && (
            <div className="pos-resultados">
              {filtrados.map(p => {
                const sinStock = p.stock_actual !== undefined && p.stock_actual <= 0 && idTienda;
                return (
                  <div key={p.codigo_producto}
                    className={`pos-prod-row${sinStock ? ' sin-stock' : ''}`}
                    onClick={() => !sinStock && intentarAgregar(p)}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>{p.nombre_producto}</div>
                      <div style={{ fontSize:12, color:'#64748b' }}>{p.codigo_producto} · {p.categoria}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'#16a34a', fontSize:15 }}>${parseFloat(p.precio).toFixed(2)}</div>
                      {sinStock && <div style={{ fontSize:11, color:'#ef4444', fontWeight:600 }}>Sin stock</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Carrito */}
          <div style={{ fontWeight:700, fontSize:13, color:'#64748b' }}>
            Artículos en carrito ({carrito.length})
          </div>
          <div className="pos-carrito-list">
            {carrito.length === 0 && (
              <div style={{ textAlign:'center', padding:24, color:'#94a3b8', fontSize:13 }}>
                Sin productos. Busca o escanea un código de barras.
              </div>
            )}
            {carrito.map(item => (
              <div key={item.codigo_producto} className="pos-item">
                <div style={{ flex:1, minWidth:100 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{item.nombre_producto}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>${parseFloat(item.precio_unitario).toFixed(2)} c/u</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button style={{ width:28, height:28, borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:16 }}
                    onClick={() => cambiarCantidad(item.codigo_producto, -1)}>−</button>
                  <span style={{ width:24, textAlign:'center', fontWeight:700 }}>{item.cantidad}</span>
                  <button style={{ width:28, height:28, borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontWeight:700, fontSize:16 }}
                    onClick={() => cambiarCantidad(item.codigo_producto, 1)}>+</button>
                </div>
                <div style={{ fontWeight:700, color:'#16a34a', minWidth:64, textAlign:'right' }}>
                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                </div>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontWeight:700, fontSize:16 }}
                  onClick={() => eliminar(item.codigo_producto)}>✕</button>
              </div>
            ))}
          </div>

          {/* Email del cliente */}
          {carrito.length > 0 && (
            <div className="email-cliente-wrap">
              <div style={{ fontSize:12, fontWeight:700, color:'#475569' }}>
                📧 Enviar ticket al cliente (opcional)
              </div>
              <input className="email-cliente-input" placeholder="Nombre del cliente"
                value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} />
              <input className="email-cliente-input" type="email" placeholder="correo@cliente.com"
                value={correoCliente} onChange={e => setCorreoCliente(e.target.value)} />
              {correoCliente && (
                <div style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>
                  ✓ Se enviará el ticket a {correoCliente}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="pos-right">

          {/* Resumen y cobro */}
          {!ticket && (
            <div className="pos-resumen">
              <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>Resumen</h3>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#475569' }}>
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, color:'#475569' }}>
                
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:20, color:'#1e293b', borderTop:'2px solid #e2e8f0', paddingTop:10 }}>
                <span>TOTAL</span><span>${total.toFixed(2)}</span>
              </div>
              <button className="pos-cobrar" onClick={cobrar} disabled={loading || !carrito.length || !idTienda}>
                {loading ? 'Procesando...' : '💳 Cobrar'}
              </button>
              <button className="pos-cancel" onClick={() => setCarrito([])} disabled={!carrito.length}>
                Cancelar venta
              </button>
            </div>
          )}

          {/* ── TICKET VISUAL ── */}
          {ticket && (
            <div className="ticket-wrap">
              <div className="ticket-header">
                <div style={{ fontSize:28 }}>🧾</div>
                <div style={{ fontSize:16, fontWeight:800, marginTop:4 }}>Venta #{ticket.folio_venta}</div>
                <div style={{ fontSize:12, opacity:0.85, marginTop:2 }}>
                  {new Date().toLocaleString('es-MX')}
                </div>
              </div>

              <div className="ticket-body">
                {/* Info tienda y cajero */}
                <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px', marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>🏪 {ticket.tienda}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                    Cajero: <strong>{ticket.cajero}</strong>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ fontWeight:700, fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, margin:'6px 0 4px' }}>
                  Productos
                </div>
                {ticket.items?.map(i => (
                  <div key={i.codigo_producto} className="ticket-row">
                    <span style={{ flex:1 }}>{i.nombre_producto} <span style={{ color:'#94a3b8' }}>x{i.cantidad_venta}</span></span>
                    <span style={{ fontWeight:600 }}>${(i.precio_unitario * i.cantidad_venta).toFixed(2)}</span>
                  </div>
                ))}

                {/* Totales */}
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', padding:'3px 0' }}>
                    <span>Subtotal</span><span>${ticket.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', padding:'3px 0' }}>
                    
                  </div>
                  <div className="ticket-total">
                    <span>TOTAL</span><span>${ticket.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Estado de envío */}
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                  {ticket.ticket_admin && (
                    <div style={{ fontSize:11, color:'#7c3aed', background:'#f5f3ff', padding:'5px 10px', borderRadius:6 }}>
                      📧 Ticket enviado al administrador
                    </div>
                  )}
                  {ticket.ticket_cliente && (
                    <div style={{ fontSize:11, color:'#16a34a', background:'#f0fdf4', padding:'5px 10px', borderRadius:6 }}>
                      📧 Ticket enviado al cliente
                    </div>
                  )}
                </div>

                <button style={{ marginTop:12, padding:'11px', background:'#2563eb', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, width:'100%', fontSize:14 }}
                  onClick={nuevaVenta}>
                  + Nueva venta
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}