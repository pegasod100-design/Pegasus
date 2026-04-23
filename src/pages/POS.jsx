import { useState, useEffect, useRef } from 'react';
import { getProductos, createVenta, getTiendas } from '../services/api';
import { useAuth } from '../context/AuthContext';


export default function POS() {
  const { empleado } = useAuth();

  const [productos, setProductos] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [search, setSearch] = useState('');
  const [idTienda, setIdTienda] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    getProductos({ activo: true }).then(r => setProductos(r.data));
    getTiendas().then(r => setTiendas(r.data));
    searchRef.current?.focus();
  }, []);

  const filtrados = search.length > 1
    ? productos.filter(p =>
        p.nombre_producto.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo_producto.includes(search)
      ).slice(0, 12)
    : [];

  const agregarProducto = (p) => {
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

  const cambiarCantidad = (codigo, delta) => {
    setCarrito(prev => prev.map(i =>
      i.codigo_producto === codigo
        ? { ...i, cantidad: Math.max(1, i.cantidad + delta) }
        : i
    ));
  };

  const eliminar = (codigo) => setCarrito(prev => prev.filter(i => i.codigo_producto !== codigo));

  const subtotal = carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const cobrar = async () => {
    if (!carrito.length || !idTienda) return alert('Agrega productos y selecciona tienda');
    setLoading(true);
    try {
      const { data } = await createVenta({
        iva: 16,
        id_tienda: parseInt(idTienda),
        items: carrito.map(i => ({
          codigo_producto: i.codigo_producto,
          cantidad_venta: i.cantidad,
          precio_unitario: i.precio_unitario
        }))
      });
      setTicket({ ...data, carrito, subtotal, iva, total });
      setCarrito([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      {/* Panel izquierdo - Búsqueda */}
      <div style={s.left}>
        <h2 style={s.title}>🛒 Punto de Venta</h2>
        {empleado && (
          <div style={s.empleadoBadge}>
            👤 {empleado.nombre || empleado.rfc || empleado.rfc_empleado}
            {empleado.rfc || empleado.rfc_empleado
              ? ` · RFC: ${empleado.rfc || empleado.rfc_empleado}`
              : ''}
            {empleado.puesto ? ` · ${empleado.puesto}` : ''}
          </div>
        )}

        <select style={s.select} value={idTienda} onChange={e => setIdTienda(e.target.value)}>
          <option value="">— Seleccionar tienda —</option>
          {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
        </select>

        <input
          ref={searchRef}
          style={s.searchInput}
          placeholder="🔍 Buscar producto por nombre o código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filtrados.length > 0 && (
          <div style={s.resultados}>
            {filtrados.map(p => (
              <div key={p.codigo_producto} style={s.productoRow} onClick={() => agregarProducto(p)}>
                <div>
                  <div style={s.prodNombre}>{p.nombre_producto}</div>
                  <div style={s.prodCodigo}>{p.codigo_producto} · {p.categoria}</div>
                </div>
                <div style={s.prodPrecio}>${parseFloat(p.precio).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Carrito */}
        <div style={s.carritoHeader}>Artículos en carrito ({carrito.length})</div>
        <div style={s.carritoList}>
          {carrito.length === 0 && <div style={s.empty}>Sin productos. Busca y agrega productos arriba.</div>}
          {carrito.map(item => (
            <div key={item.codigo_producto} style={s.carritoItem}>
              <div style={{ flex: 1 }}>
                <div style={s.itemNombre}>{item.nombre_producto}</div>
                <div style={s.itemPrecio}>${parseFloat(item.precio_unitario).toFixed(2)} c/u</div>
              </div>
              <div style={s.qtyCtrls}>
                <button style={s.qtyBtn} onClick={() => cambiarCantidad(item.codigo_producto, -1)}>−</button>
                <span style={s.qtyNum}>{item.cantidad}</span>
                <button style={s.qtyBtn} onClick={() => cambiarCantidad(item.codigo_producto, 1)}>+</button>
              </div>
              <div style={s.itemTotal}>${(item.precio_unitario * item.cantidad).toFixed(2)}</div>
              <button style={s.delBtn} onClick={() => eliminar(item.codigo_producto)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho - Cobro */}
      <div style={s.right}>
        <div style={s.resumenCard}>
          <h3 style={s.resumenTitle}>Resumen de venta</h3>
          <div style={s.resumenRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div style={s.resumenRow}><span>IVA (16%)</span><span>${iva.toFixed(2)}</span></div>
          <div style={{ ...s.resumenRow, ...s.resumenTotal }}><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
          <button style={{ ...s.cobrarBtn, opacity: loading || !carrito.length ? 0.6 : 1 }}
            onClick={cobrar} disabled={loading || !carrito.length}>
            {loading ? 'Procesando...' : '💳 Cobrar'}
          </button>
          <button style={s.cancelBtn} onClick={() => setCarrito([])} disabled={!carrito.length}>
            Cancelar venta
          </button>
        </div>

        {/* Ticket */}
        {ticket && (
          <div style={s.ticketCard}>
            <div style={s.ticketTitle}>✅ Venta #{ticket.folio_venta}</div>
            <div style={s.ticketSub}>{new Date().toLocaleString('es-MX')}</div>
            {empleado && (
              <div style={{ ...s.ticketSub, color: '#2563eb' }}>
                Cajero: {empleado.nombre || empleado.rfc || empleado.rfc_empleado}
                {` · RFC: ${empleado.rfc || empleado.rfc_empleado || '—'}`}
              </div>
            )}
            {ticket.carrito.map(i => (
              <div key={i.codigo_producto} style={s.ticketRow}>
                <span>{i.nombre_producto} x{i.cantidad}</span>
                <span>${(i.precio_unitario * i.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <hr style={{ borderColor: '#e2e8f0', margin: '8px 0' }} />
            <div style={s.ticketRow}><span>Subtotal</span><span>${ticket.subtotal.toFixed(2)}</span></div>
            <div style={s.ticketRow}><span>IVA</span><span>${ticket.iva.toFixed(2)}</span></div>
            <div style={{ ...s.ticketRow, fontWeight: 800, fontSize: 16 }}>
              <span>Total</span><span>${ticket.total.toFixed(2)}</span>
            </div>
            <button style={s.nuevoBtn} onClick={() => setTicket(null)}>Nueva venta</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { display: 'flex', gap: 24, height: 'calc(100vh - 64px)' },
  left: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12 },
  right: { width: 300, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' },
  select: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 },
  searchInput: { padding: '12px 16px', borderRadius: 8, border: '2px solid #2563eb', fontSize: 15, outline: 'none' },
  resultados: { background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.10)', maxHeight: 280, overflowY: 'auto' },
  productoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },
  prodNombre: { fontWeight: 600, fontSize: 14, color: '#1e293b' },
  prodCodigo: { fontSize: 12, color: '#64748b' },
  prodPrecio: { fontWeight: 700, color: '#16a34a', fontSize: 15 },
  carritoHeader: { fontWeight: 700, fontSize: 14, color: '#64748b', marginTop: 4 },
  carritoList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  empty: { textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 },
  carritoItem: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  itemNombre: { fontWeight: 600, fontSize: 13, color: '#1e293b' },
  itemPrecio: { fontSize: 12, color: '#64748b' },
  qtyCtrls: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, fontSize: 16 },
  qtyNum: { width: 24, textAlign: 'center', fontWeight: 700 },
  itemTotal: { fontWeight: 700, color: '#16a34a', minWidth: 60, textAlign: 'right' },
  delBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: 14, padding: 4 },
  resumenCard: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: 10 },
  resumenTitle: { margin: 0, fontSize: 16, fontWeight: 800 },
  resumenRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' },
  resumenTotal: { fontWeight: 800, fontSize: 20, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: 10 },
  cobrarBtn: { padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer' },
  cancelBtn: { padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ticketCard: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,.08)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 },
  ticketTitle: { fontWeight: 800, fontSize: 15, color: '#16a34a' },
  ticketSub: { color: '#64748b', fontSize: 12 },
  ticketRow: { display: 'flex', justifyContent: 'space-between', color: '#334155' },
  nuevoBtn: { marginTop: 8, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 },
  empleadoBadge: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 12px', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }
};
