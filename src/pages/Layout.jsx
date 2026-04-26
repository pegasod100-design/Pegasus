import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── ESTILOS GLOBALES RESPONSIVOS ──────────────────
const globalCSS = `
  * { box-sizing: border-box; }

  .layout-root {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
  }

  /* ── OVERLAY (móvil) ── */
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 199;
    animation: fadeIn 0.2s ease;
  }
  .sidebar-overlay.visible { display: block; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 220px;
    background: #1e293b;
    display: flex;
    flex-direction: column;
    padding: 24px 0 0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 200;
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── TOPBAR (solo móvil) ── */
  .topbar {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    background: #1e293b;
    z-index: 150;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }
  .topbar-brand span {
    font-size: 17px;
    font-weight: 800;
    color: #f1f5f9;
  }
  .hamburger {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    transition: background 0.15s;
  }
  .hamburger:hover { background: rgba(255,255,255,0.08); }
  .hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: #f1f5f9;
    border-radius: 2px;
    transition: transform 0.25s, opacity 0.25s;
    transform-origin: center;
  }
  .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger.open span:nth-child(2) { opacity: 0; }
  .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ── MAIN ── */
  .main-content {
    margin-left: 220px;
    flex: 1;
    padding: 32px;
    max-width: calc(100vw - 220px);
    min-width: 0;
  }

  /* ── NAV LINKS ── */
  .nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    color: #94a3b8;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.15s, color 0.15s;
  }
  .nav-link:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
  .nav-link.active { background: #2563eb; color: #fff; }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .topbar { display: flex; }

    .sidebar {
      transform: translateX(-100%);
      width: 260px;
    }
    .sidebar.open { transform: translateX(0); }

    .main-content {
      margin-left: 0;
      max-width: 100vw;
      padding: 16px;
      padding-top: 72px; /* espacio para topbar */
    }
  }

  @media (min-width: 769px) {
    .sidebar { transform: translateX(0) !important; }
  }
`;

export default function Layout() {
  const { session, empleado, logout } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar menú al navegar (móvil)
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Bloquear scroll del body cuando el menú está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAbierto]);

  const puesto = empleado?.puesto ?? null;
  const esAdmin  = puesto === 'Administrador';
  const esCajero = puesto === 'Cajero';

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const NAV = [
    { to: '/',           icon: '🔍', label: 'Buscar Producto', visible: true },
    { to: '/pos',        icon: '🛒', label: 'Punto de Venta',  visible: esAdmin || esCajero },
    { to: '/dashboard',  icon: '📊', label: 'Centro de Control',       visible: esAdmin },
    { to: '/inventario', icon: '📦', label: 'Inventario',      visible: esAdmin },
    { to: '/productos',  icon: '🏷️',  label: 'Productos',       visible: esAdmin },
    { to: '/facturas',   icon: '📋', label: 'Compras',         visible: esAdmin },
    { to: '/empleados',  icon: '👥', label: 'Empleados',       visible: esAdmin },
    { to: '/tiendas',    icon: '🏪', label: 'Tiendas',         visible: esAdmin },
    { to: '/reportes',   icon: '📈', label: 'Reportes',        visible: esAdmin },
  ].filter(n => n.visible);

  const nombreUsuario = empleado
    ? `${empleado.nombre ?? ''} ${empleado.apellido_paterno ?? ''}`.trim()
    : session?.user?.email ?? 'Visitante';

  return (
    <>
      <style>{globalCSS}</style>

      <div className="layout-root">

        {/* ── TOPBAR MÓVIL ── */}
        <header className="topbar">
          <button
            className={`hamburger${menuAbierto ? ' open' : ''}`}
            onClick={() => setMenuAbierto(v => !v)}
            aria-label="Abrir menú"
          >
            <span /><span /><span />
          </button>
          <div className="topbar-brand">
            <span style={{ fontSize: 22 }}>🛒</span>
            <span>Abarrotes</span>
          </div>
        </header>

        {/* ── OVERLAY ── */}
        <div
          className={`sidebar-overlay${menuAbierto ? ' visible' : ''}`}
          onClick={() => setMenuAbierto(false)}
        />

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${menuAbierto ? ' open' : ''}`}>
          {/* Brand (solo visible en desktop, en móvil lo tapa la topbar) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px 24px',
            borderBottom: '1px solid #334155',
          }}>
            <span style={{ fontSize: 28 }}>🛒</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
              Abarrotes
            </span>
          </div>

          <nav style={{
            flex: 1,
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflowY: 'auto',
          }}>
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer usuario */}
          <div style={{
            borderTop: '1px solid #334155',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <span style={{
                display: 'block',
                color: '#f1f5f9',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {nombreUsuario}
              </span>
              {puesto && (
                <span style={{
                  display: 'inline-block',
                  marginTop: 2,
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 4,
                  padding: '1px 6px',
                }}>
                  {puesto}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 18,
                padding: 4,
                borderRadius: 6,
                flexShrink: 0,
              }}
            >
              ⏻
            </button>
          </div>
        </aside>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="main-content">
          <Outlet />
        </main>

      </div>
    </>
  );
}
