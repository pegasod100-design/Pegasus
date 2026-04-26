import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { loginRFC } from '../services/empleados';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'https://pegasusbackrny.onrender.com';

const css = `
  .login-wrap{display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f1f5f9;padding:16px;}
  .login-card{background:#fff;padding:clamp(24px,5vw,40px);border-radius:16px;display:flex;flex-direction:column;gap:12px;width:100%;max-width:380px;align-items:center;box-shadow:0 4px 24px rgba(0,0,0,.10);}
  .login-title{margin:0;font-size:clamp(20px,5vw,26px);font-weight:800;color:#1e293b;}
  .login-sub{color:#64748b;font-size:14px;margin:0;}
  .login-input{width:100%;padding:11px 14px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:15px;box-sizing:border-box;outline:none;transition:border-color .2s;}
  .login-input:focus{border-color:#2563eb;}
  .login-btn{width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s;}
  .login-btn:hover{background:#1d4ed8;}
  .login-btn:disabled{opacity:0.6;cursor:not-allowed;}
  .login-btn-google{width:100%;padding:12px;border:1.5px solid #e2e8f0;background:#fff;border-radius:8px;display:flex;gap:8px;justify-content:center;align-items:center;font-size:14px;cursor:pointer;font-weight:600;transition:background .2s;}
  .login-btn-google:hover{background:#f8fafc;}
  .login-divider{font-size:12px;color:#94a3b8;}
  .login-hint{font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;}
  .login-error{width:100%;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;color:#dc2626;font-size:13px;box-sizing:border-box;}
  /* Forgot password */
  .forgot-panel{width:100%;display:flex;flex-direction:column;gap:10px;}
  .back-link{font-size:13px;color:#2563eb;cursor:pointer;background:none;border:none;padding:0;text-align:left;}
  .back-link:hover{text-decoration:underline;}
  .forgot-success{width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;color:#15803d;font-size:13px;box-sizing:border-box;}
`;

export default function Login() {
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('login'); // 'login' | 'forgot'
  const [rfcOlvido, setRfcOlvido] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const { loginManual } = useAuth();

  const handleLoginRFC = async () => {
    setError('');
    if (!rfc || !password) return setError('Ingresa tu RFC y contraseña.');
    setLoading(true);
    const { data, error: err } = await loginRFC(rfc.trim().toUpperCase(), password);
    if (err) { setError(err); setLoading(false); return; }
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

  const handleForgot = async () => {
    setForgotMsg('');
    setError('');
    if (!rfcOlvido) return setError('Ingresa tu RFC.');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc_empleado: rfcOlvido.trim().toUpperCase() }),
      });
      const body = await res.json();
      setForgotMsg(body.mensaje || 'Revisa tu correo.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-card">
          <span style={{ fontSize: 44 }}>🛒</span>
          <h2 className="login-title">Abarrotes</h2>

          {vista === 'login' ? (
            <>
              <p className="login-sub">Inicia sesión para continuar</p>
              {error && <div className="login-error">⚠️ {error}</div>}

              <input className="login-input" placeholder="RFC" value={rfc}
                onChange={e => { setRfc(e.target.value.toUpperCase()); setError(''); }} />
              <input className="login-input" type="password" placeholder="Contraseña"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLoginRFC()} />

              <button className="login-btn" onClick={handleLoginRFC} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar con RFC'}
              </button>

              {/* Olvidé mi contraseña */}
              <button className="back-link" onClick={() => { setVista('forgot'); setError(''); }}>
                ¿Olvidaste tu contraseña?
              </button>

              <span className="login-divider">o</span>

              <button className="login-btn-google" onClick={handleLoginGoogle} disabled={loading}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: 18 }} alt="Google" />
                Continuar con Google
              </button>

              <p className="login-hint">RFC = empleados<br />Google = acceso general</p>
            </>
          ) : (
            /* ── PANEL OLVIDÉ CONTRASEÑA ── */
            <div className="forgot-panel">
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>🔑 Recuperar contraseña</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Ingresa tu RFC y te enviaremos un enlace a tu correo para restablecer tu contraseña.
              </p>

              {error && <div className="login-error">⚠️ {error}</div>}
              {forgotMsg && <div className="forgot-success">📧 {forgotMsg}</div>}

              {!forgotMsg && (
                <>
                  <input className="login-input" placeholder="Tu RFC"
                    value={rfcOlvido}
                    onChange={e => { setRfcOlvido(e.target.value.toUpperCase()); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleForgot()} />
                  <button className="login-btn" onClick={handleForgot} disabled={loading}
                    style={{ background: '#16a34a' }}>
                    {loading ? 'Enviando...' : '📧 Enviar enlace de recuperación'}
                  </button>
                </>
              )}

              <button className="back-link" onClick={() => { setVista('login'); setError(''); setForgotMsg(''); }}>
                ← Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
