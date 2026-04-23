import { supabase } from '../services/supabase';

//  GOOGLE
export const getEmpleadoPorEmail = async (email) => {
  const { data } = await supabase
    .from('catalogo_empleados')
    .select('*')
    .eq('correo_electronico', email)
    .maybeSingle();

  return data;
};

//  LOGIN RFC — llama al backend para obtener JWT
export const loginRFC = async (rfc, password) => {
  try {
    const BASE = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc_empleado: rfc.trim().toUpperCase(), clave: password }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { error: body.error || 'Credenciales incorrectas' };
    }

    // Guardar JWT para que el interceptor de axios lo use en todas las peticiones
    localStorage.setItem('jwt_token', body.token);

    return { data: body.empleado };

  } catch (err) {
    console.error(err);
    return { error: 'Error al conectar con el servidor' };
  }
};