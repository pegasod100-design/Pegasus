import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'https://pegasusbackrny.onrender.com';

function barraFuerza(p) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const LABELS = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
const COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

const css = `
  .rp-wrap{display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f1f5f9;padding:16px;}
  .rp-card{background:#fff;padding:clamp(24px,5vw,40px);border-radius:16px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.10);display:flex;flex-direction:column;gap:16px;align-items:center;}
  .rp-title{margin:0;font-size:22px;font-weight:800;color:#1e293b;text-align:center;}
  .rp-sub{font-size:14px;color:#64748b;text-align:center;margin:0;}
  .rp-input{width:100%;padding:12px 14px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:15px;box-sizing:border-box;outline:none;transition:border-color .2s;}
  .rp-input:focus{border-color:#16a34a;}
  .rp-btn{width:100%;padding:13px;background:#16a34a;color:#fff;border:none;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer;}
  .rp-btn:hover{background:#15803d;}
  .rp-btn:disabled{opacity:0.6;cursor:not-allowed;}
  .rp-error{width:100%;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;color:#dc2626;font-size:13px;box-sizing:border-box;}
  .rp-success{width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;color:#15803d;font-size:13px;box-sizing:border-box;}
  .bar-wrap{width:100%;height:6px;background:#e2e8f0;border-radius:4px;overflow:hidden;}
  .bar-fill{height:100%;border-radius:4px;transition:width .3s,background .3s;}
`;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [clave, setClave] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!token) setError('Enlace inválido. Solicita uno nuevo desde el login.'); }, [token]);

  const score = barraFuerza(clave);

  const handleSubmit = async () => {
    setError('');
    if (!clave || clave.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (clave !== confirmar) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nueva_clave: clave }),
      });
      const body = await res.json();
      if (!res.ok) return setError(body.error || 'Error al restablecer contraseña.');
      setSuccess(body.mensaje || '¡Contraseña restablecida! Ya puedes iniciar sesión.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="rp-wrap">
        <div className="rp-card">
          <span style={{ fontSize: 44 }}>🔑</span>
          <h2 className="rp-title">Nueva contraseña</h2>
          <p className="rp-sub">Elige una contraseña segura para recuperar tu acceso.</p>

          {error && <div className="rp-error">⚠️ {error}</div>}

          {success ? (
            <>
              <div className="rp-success">✅ {success}</div>
              <Link to="/login" style={{ width: '100%' }}>
                <button className="rp-btn">Ir al inicio de sesión →</button>
              </Link>
            </>
          ) : (
            <>
              <input className="rp-input" type="password" placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={clave} onChange={e => setClave(e.target.value)} disabled={!token} />

              {clave && (
                <>
                  <div className="bar-wrap" style={{ width: '100%' }}>
                    <div className="bar-fill" style={{ width: `${(score / 5) * 100}%`, background: COLORS[score] }} />
                  </div>
                  <p style={{ width: '100%', margin: 0, fontSize: 12, color: COLORS[score], fontWeight: 600 }}>
                    Seguridad: {LABELS[score]}
                  </p>
                </>
              )}

              <input className="rp-input" type="password" placeholder="Confirmar contraseña"
                value={confirmar} onChange={e => setConfirmar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={!token} />

              <button className="rp-btn" onClick={handleSubmit} disabled={loading || !token}>
                {loading ? 'Guardando...' : '🔓 Restablecer contraseña'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
