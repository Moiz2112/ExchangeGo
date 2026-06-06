import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginModal.module.css';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
  defaultView?: 'signin' | 'signup';
}

const LoginModal = ({ onClose, onSuccess, message, defaultView = 'signin' }: Props) => {
  const { login, register } = useAuth();
  const [view, setView] = useState<'signin' | 'signup'>(defaultView);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sign in fields
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign up fields
  const [suEmail, setSuEmail] = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [showSuPass, setShowSuPass] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Reset errors when switching view
  const switchView = (v: 'signin' | 'signup') => {
    setView(v);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Password strength
  const strength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#f85149', '#f7931a', '#f3ba2f', '#3fb950'];
  const pw = suPassword;
  const pwStr = strength(pw);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!siUsername || !siPassword) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const res = await login(siUsername, siPassword);
    setLoading(false);
    if (res.ok) {
      setSuccess('Signed in successfully!');
      setTimeout(() => { onSuccess?.(); handleClose(); }, 800);
    } else {
      setError(res.error || 'Sign in failed.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!suEmail || !suUsername || !suPassword || !suConfirm) { setError('Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) { setError('Please enter a valid email address.'); return; }
    if (suUsername.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (suPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (suPassword !== suConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await register(suEmail, suUsername, suPassword);
    setLoading(false);
    if (res.ok) {
      setSuccess('Account created! Welcome to ExchangeGO.');
      setTimeout(() => { onSuccess?.(); handleClose(); }, 900);
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`} onClick={handleClose}>
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ''}`} onClick={e => e.stopPropagation()}>

        {/* Background orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        {/* Close */}
        <button className={styles.closeBtn} onClick={handleClose}>✕</button>

        {/* Logo */}
        <div className={styles.logoMark}>
          <span className={styles.logoDot} />
          <span className={styles.logoText}>ExchangeGO</span>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${view === 'signin' ? styles.tabActive : ''}`}
            onClick={() => switchView('signin')}
          >Sign In</button>
          <button
            className={`${styles.tab} ${view === 'signup' ? styles.tabActive : ''}`}
            onClick={() => switchView('signup')}
          >Create Account</button>
          <div className={`${styles.tabSlider} ${view === 'signup' ? styles.tabSliderRight : ''}`} />
        </div>

        {/* ── SIGN IN ── */}
        {view === 'signin' && (
          <div className={styles.formWrap}>
            <div className={styles.heading}>
              <h2 className={styles.title}>Welcome back</h2>
              <p className={styles.subtitle}>{message || 'Sign in to your account to continue.'}</p>
            </div>
            <form onSubmit={handleSignIn} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username or Email</label>
                <input
                  className={styles.input}
                  placeholder="Enter your username or email"
                  value={siUsername}
                  onChange={e => { setSiUsername(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={siPassword}
                  onChange={e => { setSiPassword(e.target.value); setError(''); }}
                />
              </div>
              {error   && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.successMsg}>✓ {success}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.btnLoader} /> : 'Sign In →'}
              </button>
            </form>
            <p className={styles.switchHint}>
              Don't have an account?{' '}
              <button className={styles.switchLink} onClick={() => switchView('signup')}>Create one</button>
            </p>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {view === 'signup' && (
          <div className={styles.formWrap}>
            <div className={styles.heading}>
              <h2 className={styles.title}>Create account</h2>
              <p className={styles.subtitle}>Join ExchangeGO to track live crypto markets.</p>
            </div>
            <form onSubmit={handleSignUp} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={suEmail}
                  onChange={e => { setSuEmail(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <input
                  className={styles.input}
                  placeholder="Choose a username"
                  value={suUsername}
                  onChange={e => { setSuUsername(e.target.value); setError(''); }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordWrap}>
                  <input
                    type={showSuPass ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="At least 6 characters"
                    value={suPassword}
                    onChange={e => { setSuPassword(e.target.value); setError(''); }}
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowSuPass(p => !p)}>
                    {showSuPass ? '🙈' : '👁'}
                  </button>
                </div>
                {suPassword && (
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthBars}>
                      {[1,2,3,4].map(i => (
                        <div key={i} className={styles.strengthBar}
                          style={{ background: i <= pwStr ? strengthColor[pwStr] : 'var(--border-strong)' }} />
                      ))}
                    </div>
                    <span className={styles.strengthLabel} style={{ color: strengthColor[pwStr] }}>
                      {strengthLabel[pwStr]}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.confirmWrap}>
                  <input
                    type="password"
                    className={`${styles.input} ${suConfirm && suPassword !== suConfirm ? styles.inputError : suConfirm && suPassword === suConfirm ? styles.inputSuccess : ''}`}
                    placeholder="Re-enter your password"
                    value={suConfirm}
                    onChange={e => { setSuConfirm(e.target.value); setError(''); }}
                  />
                  {suConfirm && (
                    <span className={styles.matchIcon}>
                      {suPassword === suConfirm ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </div>
              {error   && <p className={styles.error}>{error}</p>}
              {success && <p className={styles.successMsg}>✓ {success}</p>}
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.btnLoader} /> : 'Create Account →'}
              </button>
            </form>
            <p className={styles.switchHint}>
              Already have an account?{' '}
              <button className={styles.switchLink} onClick={() => switchView('signin')}>Sign in</button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginModal;