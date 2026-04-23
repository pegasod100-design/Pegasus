import { useState } from 'react';
import { supabase } from '../services/supabase';
import { loginRFC } from '../services/empleados';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginManual } = useAuth();

  //  LOGIN RFC
  const handleLoginRFC = async () => {
    if (!rfc || !password) {
      alert('Ingresa RFC y contraseña');
      return;
    }

    setLoading(true);

    const { data, error } = await loginRFC(rfc.trim().toUpperCase(), password);

    if (error) {
      alert(error);
      setLoading(false);
      return;
    }

    // 🔹 Actualizamos sesión en AuthContext
    loginManual(data);
    localStorage.setItem('empleado', JSON.stringify(data));
    window.location.href = '/';
    setLoading(false);
  };

  // 🔥 LOGIN GOOGLE
  const handleLoginGoogle = async () => {
    setLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <span style={{ fontSize: 40 }}>🛒</span>
        <h2 style={s.title}>Abarrotes</h2>
        <p style={s.sub}>Inicia sesión</p>

        <input
          style={s.input}
          placeholder="RFC"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
        />

        <input
          style={s.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={s.btn} onClick={handleLoginRFC}>Entrar con RFC</button>

        <div style={s.divider}>o</div>

        <button style={s.btnGoogle} onClick={handleLoginGoogle}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18 }} />
          Continuar con Google
        </button>

        <p style={s.hint}>RFC = empleados<br/>Google = acceso general</p>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
  card: { background: '#fff', padding: 40, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 300, alignItems: 'center' },
  title: { margin: 0 },
  sub: { color: '#64748b' },
  input: { width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' },
  btn: { width: '100%', padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 },
  btnGoogle: { width: '100%', padding: 10, border: '1px solid #ccc', background: '#fff', borderRadius: 6, display: 'flex', gap: 8, justifyContent: 'center' },
  divider: { fontSize: 12, color: '#94a3b8' },
  hint: { fontSize: 12, color: '#94a3b8', textAlign: 'center' }
};