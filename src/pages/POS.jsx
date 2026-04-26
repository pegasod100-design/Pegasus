import { useState, useEffect, useRef } from 'react';
import { getProductos, createVenta, getTiendas } from '../services/api';
import { useAuth } from '../context/AuthContext';

const css = `
  .pos-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (min-width: 700px) {
    .pos-root { flex-direction: row; height: calc(100vh - 120px); }
    .pos-left { flex: 1; overflow-y: auto; }
    .pos-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
  }
  .pos-title { margin: 0 0 8px; font-size: clamp(17px,3vw,20px); font-weight: 800; color: #1e293b; }
  .pos-select {
    width: 100%; padding: 10px 12px; border-radius: 8px;
    border: 1.5px solid #e2e8f0; font-size: 14px; box-sizing: border-box;
  }
  .pos-search {
    width: 100%; padding: 12px 16px; border-radius: 8px;
    border: 2px solid #2563eb; font-size: 15px; outline: none;
    box-sizing: border-box;
  }
  .pos-resultados {
    background: #fff; border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0,0,0,.10);
    max-height: 240px; overflow-y: auto;
  }
  .pos-prod-row {
    display: flex; justify-content: space-between;
    align-items: center; padding: 10px 14px;
    cursor: pointer; border-bottom: 1px solid #f1f5f9;
  }
  .pos-prod-row:hover { background: #f0f9ff; }
  .pos-carrito-list { display: flex; flex-direction: column; gap: 6px; }
  .pos-item {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border-radius: 8px;
    padding: 10px 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
    flex-wrap: wrap;
  }
  .pos-resumen {
    background: #fff; border-radius: 12px;
    padding: 18px; box-shadow: 0 1px 8px rgba(0,0,0,.08);
    display: flex; flex-direction: column; gap: 10px;
  }
  .pos-cobrar {
    padding: 14px; background: #16a34a; color: #fff;
    border: none; border-radius: 8px;
    font-size: 16px; font-weight: 800; cursor: pointer;
    width: 100%;
  }
  .pos-cobrar:disabled { opacity: 0.6; cursor: not-allowed; }
  .pos-cancel {
    padding: 10px; background: #fee2e2; color: #dc2626;
    border: none; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; width: 100%;
  }
  .pos-ticket {
    background: #fff; border-radius: 12px;
    padding: 16px; box-shadow: 0 1px 8px rgba(0,0,0,.08);
    font-size: 13px; display: flex;
    flex-direction: column; gap: 6px;
  }
`;

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
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const cobrar = async () => {
    if (!carrito.length || !idTienda) return alert('Agrega productos y selecciona tienda');
    setLoading(true);
    try {
      const { data } = await createVenta({
        iva: 16, id_tienda: parseInt(idTienda),
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
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="pos-root">

        {/* ── PANEL IZQUIERDO ── */}
        <div className="pos-left" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="pos-title">🛒 Punto de Venta</h2>

          {empleado && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 12px', fontSize: 12, color: '#1d4ed8', fontWeight: 600 }}>
              👤 {empleado.nombre || empleado.rfc_empleado} · {empleado.puesto}
            </div>
          )}

          <select className="pos-select" value={idTienda} onChange={e => setIdTienda(e.target.value)}>
            <option value="">— Seleccionar tienda —</option>
            {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
          </select>

          <input ref={searchRef} className="pos-search"
            placeholder="🔍 Buscar producto por nombre o código..."
            value={search} onChange={e => setSearch(e.target.value)} />

          {filtrados.length > 0 && (
            <div className="pos-resultados">
              {filtrados.map(p => (
                <div key={p.codigo_producto} className="pos-prod-row" onClick={() => agregarProducto(p)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{p.nombre_producto}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.codigo_producto} · {p.categoria}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>${parseFloat(p.precio).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontWeight: 700, fontSize: 13, color: '#64748b' }}>Artículos ({carrito.length})</div>
          <div className="pos-carrito-list">
            {carrito.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>
                Sin productos. Busca y agrega productos arriba.
              </div>
            )}
            {carrito.map(item => (
              <div key={item.codigo_producto} className="pos-item">
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre_producto}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>${parseFloat(item.precio_unitario).toFixed(2)} c/u</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                    onClick={() => cambiarCantidad(item.codigo_producto, -1)}>−</button>
                  <span style={{ width: 22, textAlign: 'center', fontWeight: 700 }}>{item.cantidad}</span>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                    onClick={() => cambiarCantidad(item.codigo_producto, 1)}>+</button>
                </div>
                <div style={{ fontWeight: 700, color: '#16a34a', minWidth: 60, textAlign: 'right' }}>
                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}
                  onClick={() => eliminar(item.codigo_producto)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="pos-right">
          <div className="pos-resumen">
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Resumen</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#475569' }}>
              <span>IVA (16%)</span><span>${iva.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, color: '#1e293b', borderTop: '2px solid #e2e8f0', paddingTop: 10 }}>
              <span>TOTAL</span><span>${total.toFixed(2)}</span>
            </div>
            <button className="pos-cobrar" onClick={cobrar} disabled={loading || !carrito.length}>
              {loading ? 'Procesando...' : '💳 Cobrar'}
            </button>
            <button className="pos-cancel" onClick={() => setCarrito([])} disabled={!carrito.length}>
              Cancelar venta
            </button>
          </div>

          {ticket && (
            <div className="pos-ticket">
              <div style={{ fontWeight: 800, fontSize: 15, color: '#16a34a' }}>✅ Venta #{ticket.folio_venta}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{new Date().toLocaleString('es-MX')}</div>
              {empleado && (
                <div style={{ color: '#2563eb', fontSize: 12 }}>
                  Cajero: {empleado.nombre || empleado.rfc_empleado}
                </div>
              )}
              {ticket.carrito.map(i => (
                <div key={i.codigo_producto} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>{i.nombre_producto} x{i.cantidad}</span>
                  <span>${(i.precio_unitario * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <hr style={{ borderColor: '#e2e8f0', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 }}>
                <span>Total</span><span>${ticket.total.toFixed(2)}</span>
              </div>
              <button style={{ marginTop: 8, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, width: '100%' }}
                onClick={() => setTicket(null)}>Nueva venta</button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
