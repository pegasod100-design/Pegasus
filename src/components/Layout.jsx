import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { session, empleado, logout } = useAuth();
  const navigate = useNavigate();

  const puesto = empleado?.puesto ?? null;
  const esAdmin   = puesto === 'Administrador';
  const esCajero  = puesto === 'Cajero';

  // 🔥 Logout corregido
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login'; // ← redirección segura
  };

  // Menú filtrado según el rol
  const NAV = [
    { to: '/',           icon: '🔍', label: 'Buscar Producto', visible: true },
    { to: '/pos',        icon: '🛒', label: 'Punto de Venta',  visible: esAdmin || esCajero },
    { to: '/dashboard',  icon: '📊', label: 'Dashboard',       visible: esAdmin },
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
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <span style={{ fontSize: 28 }}>🛒</span>
          <span style={s.brandText}>Abarrotes</span>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                ...s.link,
                ...(isActive ? s.linkActive : {}),
              })}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario + logout */}
        <div style={s.footer}>
          <div style={s.userInfo}>
            <span style={s.userName}>{nombreUsuario}</span>
            {puesto && <span style={s.userRole}>{puesto}</span>}
          </div>

          <button
            style={s.logoutBtn}
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            ⏻
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

/* ─── Estilos ───────────────────────── */

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  sidebar: {
    width: 220,
    background: '#1e293b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0 0',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 20px 24px',
    borderBottom: '1px solid #334155',
  },
  brandText: {
    fontSize: 20,
    fontWeight: 800,
    color: '#f1f5f9',
  },
  nav: {
    flex: 1,
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  linkActive: {
    background: '#2563eb',
    color: '#fff',
  },
  footer: {
    borderTop: '1px solid #334155',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  userName: {
    display: 'block',
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    display: 'inline-block',
    marginTop: 2,
    background: '#2563eb',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 4,
    padding: '1px 6px',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  main: {
    marginLeft: 220,
    flex: 1,
    padding: 32,
    maxWidth: 'calc(100vw - 220px)',
  },
};