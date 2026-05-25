import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Contact.module.css';

const SUBJECTS = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Exchange Issue',
  'Price Data Issue',
  'Account Support',
  'Other',
];

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], body: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.body.trim()) {
      setErrorMsg('Please fill in all required fields.'); return;
    }
    setStatus('sending'); setErrorMsg('');
    try {
      const res = await fetch('http://localhost:8081/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: SUBJECTS[0], body: '' });
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Something went wrong. Try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Cannot reach the server. Make sure the backend is running.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>✉️ Support & Feedback</span>
          <h1 className={styles.heroTitle}>
            We'd love to<br />
            <span className={styles.heroAccent}>hear from you</span>
          </h1>
          <p className={styles.heroDesc}>
            Found a bug? Have a feature idea? Want to report a price issue?
            Submit a ticket and our team will get back to you.
          </p>
        </div>

        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>⚡</span>
            <div className={styles.infoText}>
              <strong>Fast Response</strong>
              <p>We review all tickets within 24 hours</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🔒</span>
            <div className={styles.infoText}>
              <strong>Private & Secure</strong>
              <p>Your message goes directly to our admin</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🪙</span>
            <div className={styles.infoText}>
              <strong>Exchange Issues?</strong>
              <p>Report bad data or missing exchange prices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className={styles.formSection}>
        <div className={styles.formWrap}>

          {status === 'success' ? (
            <div className={styles.successCard}>
              <span className={styles.successIcon}>✓</span>
              <h2>Message Sent!</h2>
              <p>Thanks for reaching out. We've received your message and will respond within 24 hours.</p>
              <div className={styles.successActions}>
                <button className={styles.accentBtn} onClick={() => setStatus('idle')}>
                  Send Another
                </button>
                <Link to="/" className={styles.ghostBtn}>Back to Dashboard</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Submit a Ticket</h2>
                <p className={styles.formSub}>All fields marked * are required</p>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name *</label>
                  <input
                    className={styles.input}
                    placeholder="Your name"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address *</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Subject</label>
                <select className={styles.select} value={form.subject} onChange={set('subject')}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Message *</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe your issue or feedback in detail..."
                  rows={6}
                  value={form.body}
                  onChange={set('body')}
                />
                <span className={styles.charCount}>{form.body.length} / 2000</span>
              </div>

              {errorMsg && <p className={styles.errorMsg}>⚠ {errorMsg}</p>}

              <button
                className={styles.submitBtn}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  <><span className={styles.spinner} /> Sending...</>
                ) : (
                  '✉ Send Message'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Side info */}
        <div className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Common Topics</h3>
            <ul className={styles.topicList}>
              {SUBJECTS.map(s => (
                <li key={s} className={styles.topicItem}>
                  <button
                    className={styles.topicBtn}
                    onClick={() => setForm(f => ({ ...f, subject: s }))}
                    data-active={form.subject === s}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Other Ways to Reach Us</h3>
            <div className={styles.contactLinks}>
              <a href="mailto:support@exchangego.com" className={styles.contactLink}>
                <span>📧</span> support@exchangego.com
              </a>
              <a href="https://github.com/Moiz2112" target="_blank" rel="noreferrer" className={styles.contactLink}>
                <span>🐙</span> GitHub Issues
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}