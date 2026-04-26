import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard      from './pages/Dashboard';
import POS            from './pages/POS';
import Inventario     from './pages/Inventario';
import Productos      from './pages/Productos';
import Facturas       from './pages/Facturas';
import Empleados      from './pages/Empleados';
import Tiendas        from './pages/Tiendas';
import Reportes       from './pages/Reportes';
import BuscarProducto from './pages/BuscarProducto';

function RutaAutenticada({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <p style={{ padding: 40 }}>Cargando…</p>;
  return session ? children : <Navigate to="/login" replace />;
}

function RutaRol({ children, roles }) {
  const { empleado } = useAuth();
  if (!empleado || !roles.includes(empleado.puesto)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas — no requieren sesión */}
          <Route path="/login" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Privadas */}
          <Route path="/" element={<RutaAutenticada><Layout /></RutaAutenticada>}>
            <Route index element={<BuscarProducto />} />
            <Route path="buscar" element={<BuscarProducto />} />
            <Route path="pos" element={<RutaRol roles={['Cajero','Administrador']}><POS /></RutaRol>} />
            <Route path="dashboard" element={<RutaRol roles={['Administrador']}><Dashboard /></RutaRol>} />
            <Route path="inventario" element={<RutaRol roles={['Administrador']}><Inventario /></RutaRol>} />
            <Route path="productos" element={<RutaRol roles={['Administrador']}><Productos /></RutaRol>} />
            <Route path="facturas" element={<RutaRol roles={['Administrador']}><Facturas /></RutaRol>} />
            <Route path="empleados" element={<RutaRol roles={['Administrador']}><Empleados /></RutaRol>} />
            <Route path="tiendas" element={<RutaRol roles={['Administrador']}><Tiendas /></RutaRol>} />
            <Route path="reportes" element={<RutaRol roles={['Administrador']}><Reportes /></RutaRol>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
