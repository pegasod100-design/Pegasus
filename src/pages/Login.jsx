import { useState } from 'react';
import { supabase } from '../services/supabase';
import { loginRFC } from '../services/empleados';
import { useAuth } from '../context/AuthContext';

const css = `
  .login-wrap {
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    padding: 16px;
  }
  .login-card {
    background: #fff;
    padding: clamp(24px, 5vw, 40px);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 380px;
    align-items: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  }
  .login-title { margin: 0; font-size: clamp(20px, 5vw, 26px); font-weight: 800; color: #1e293b; }
  .login-sub { color: #64748b; font-size: 14px; margin: 0; }
  .login-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    font-size: 15px;
    box-sizing: border-box;
    outline: none;
    transition: border-color .2s;
  }
  .login-input:focus { border-color: #2563eb; }
  .login-btn {
    width: 100%;
    padding: 12px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background .2s;
  }
  .login-btn:hover { background: #1d4ed8; }
  .login-btn-google {
    width: 100%;
    padding: 12px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    border-radius: 8px;
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    cursor: pointer;
    font-weight: 600;
    transition: background .2s;
  }
  .login-btn-google:hover { background: #f8fafc; }
  .login-divider { font-size: 12px; color: #94a3b8; }
  .login-hint { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6; }
`;

export default function Login() {
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginManual } = useAuth();

  const handleLoginRFC = async () => {
    if (!rfc || !password) { alert('Ingresa RFC y contraseña'); return; }
    setLoading(true);
    const { data, error } = await loginRFC(rfc.trim().toUpperCase(), password);
    if (error) { alert(error); setLoading(false); return; }
    loginManual(data);
    localStorage.setItem('empleado', JSON.stringify(data));
    window.location.href = '/';
    setLoading(false);
  };

  const handleLoginGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-card">
          <span style={{ fontSize: 44 }}>🛒</span>
          <h2 className="login-title">Abarrotes</h2>
          <p className="login-sub">Inicia sesión para continuar</p>

          <input className="login-input" placeholder="RFC" value={rfc}
            onChange={e => setRfc(e.target.value.toUpperCase())} />
          <input className="login-input" type="password" placeholder="Contraseña"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoginRFC()} />

          <button className="login-btn" onClick={handleLoginRFC} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar con RFC'}
          </button>

          <span className="login-divider">o</span>

          <button className="login-btn-google" onClick={handleLoginGoogle} disabled={loading}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18 }} alt="Google" />
            Continuar con Google
          </button>

          <p className="login-hint">RFC = empleados<br />Google = acceso general</p>
        </div>
      </div>
    </>
  );
}
