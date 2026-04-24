import { supabase } from '../services/supabase';

const BASE = import.meta.env.VITE_API_URL || "https://pegasusbackrny.onrender.com";

//  GOOGLE
export const getEmpleadoPorEmail = async (email) => {
  const { data } = await supabase
    .from('catalogo_empleados')
    .select('*')
    .eq('correo_electronico', email)
    .maybeSingle();

  return data;
};

//  LOGIN RFC
export const loginRFC = async (rfc, password) => {
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfc_empleado: rfc.trim().toUpperCase(),
        clave: password
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { error: body.error || 'Credenciales incorrectas' };
    }

    localStorage.setItem('jwt_token', body.token);

    return { data: body.empleado };

  } catch (err) {
    console.error(err);
    return { error: 'Error al conectar con el servidor' };
  }
};