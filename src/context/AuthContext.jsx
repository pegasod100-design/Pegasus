import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getEmpleadoPorEmail } from '../services/empleados';

// 🔥 CONTEXTO
const AuthContext = createContext();

// 🔥 PROVIDER
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Resolver empleado por correo (Google)
  const resolveEmpleado = async (ses) => {
    if (!ses?.user?.email) {
      setEmpleado(null);
      return;
    }
    try {
      const data = await getEmpleadoPorEmail(ses.user.email);
      setEmpleado(data ?? { puesto: 'usuario', correo_electronico: ses.user.email });
    } catch (error) {
      console.error('Error obteniendo empleado:', error);
      setEmpleado({ puesto: 'usuario', correo_electronico: ses.user.email });
    }
  };

  // 🔹 LOGIN MANUAL RFC
  const loginManual = (empleadoData) => {
    setEmpleado(empleadoData);
    setSession({ user: { email: empleadoData.correo_electronico || 'rfc@login' } });
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: ses } } = await supabase.auth.getSession();
        const empleadoLocal = localStorage.getItem('empleado');

        if (empleadoLocal) {
          let emp = null;
          try {
            emp = JSON.parse(empleadoLocal);
          } catch {
            console.warn('Empleado en localStorage inválido');
          }

          if (emp) {
            loginManual(emp);
            setLoading(false);
            return;
          }
        }

        if (ses) {
          setSession(ses);
          await resolveEmpleado(ses);
        } else {
          setSession(null);
          setEmpleado(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error obteniendo sesión inicial:', error);
        setSession(null);
        setEmpleado(null);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, ses) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setEmpleado(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(ses);
          await resolveEmpleado(ses);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 🔥 LOGOUT COMPLETO
  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.error(e);
    }

    setSession(null);
    setEmpleado(null);
    localStorage.removeItem('empleado');
    localStorage.removeItem('jwt_token');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, empleado, logout, loading, loginManual }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔥 HOOK
export const useAuth = () => useContext(AuthContext);
export default AuthContext;