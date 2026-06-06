import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { AdminProvider } from '../../context/AdminContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeProvider } from '../../context/ThemeContext';
import logo from '../../assets/fav.png';
import type {
  Exchange, Coin, UserRecord, ContactMessage, FeaturedCoin, DashboardStats,
} from '../../context/AdminContext';
import styles from './Admin.module.css';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
type Tab = 'dashboard' | 'exchanges' | 'coins' | 'users' | 'messages' | 'featured';

// ─────────────────────────────────────────────
//  Login screen
// ─────────────────────────────────────────────
function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await login(username, password);
    if (!result.ok) setError(result.error ?? 'Login failed');
    setLoading(false);
  };

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <img src={logo} alt="ExchangeGo" className={styles.loginLogoImg} />
          <span className={styles.loginLogoText}>Admin Portal</span>
        </div>
        <p className={styles.loginSub}>ExchangeGo Control Center</p>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            className={styles.input}
            placeholder="Admin username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className={styles.errorMsg}>{error}</p>}
          <button className={styles.accentBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Dashboard
// ─────────────────────────────────────────────
function Dashboard({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    apiFetch('/admin/dashboard').then((r: Response) => r.json()).then(setStats).catch(() => {});
  }, [apiFetch]);

  const cards = stats ? [
    { label: 'Active Exchanges',   value: `${stats.active_exchanges} / ${stats.total_exchanges}`, icon: '⚡', color: '#f0b90b' },
    { label: 'Tracked Coins',      value: stats.total_coins,          icon: '🪙', color: '#0ecb81' },
    { label: 'Registered Users',   value: stats.total_users,          icon: '👥', color: '#1890ff' },
    { label: 'Unread Messages',    value: `${stats.unread_messages} / ${stats.total_messages}`, icon: '✉️', color: '#f6465d' },
    { label: 'Featured Coins',     value: stats.featured_coins,       icon: '⭐', color: '#9945ff' },
    { label: 'Server Time',        value: stats.server_time ? new Date(stats.server_time).toLocaleTimeString() : '--', icon: '🕐', color: '#3cc8c8' },
  ] : [];

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
      <p className={styles.sectionSub}>Live system status and summary metrics</p>

      {!stats && <div className={styles.loading}>Loading stats...</div>}

      <div className={styles.statGrid}>
        {cards.map(card => (
          <div key={card.label} className={styles.statCard} style={{ '--accent-color': card.color } as React.CSSProperties}>
            <span className={styles.statIcon}>{card.icon}</span>
            <div className={styles.statValue}>{card.value}</div>
            <div className={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>🔌 WebSocket Status</h3>
          <div className={styles.statusBadge} data-status="active">● Running</div>
          <p className={styles.infoText}>Price updates every 7 seconds from all active exchanges via WebSocket broadcast manager.</p>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>🏦 Exchange Health</h3>
          <div className={styles.statusBadge} data-status="active">● {stats?.active_exchanges ?? '...'} Online</div>
          <p className={styles.infoText}>Prices are aggregated from active exchanges. Disable an exchange in Exchange Management if it returns errors.</p>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>⚙️ Quick Actions</h3>
          <div className={styles.quickActions}>
            <span className={styles.quickTag}>Add Exchange</span>
            <span className={styles.quickTag}>Add Coin</span>
            <span className={styles.quickTag}>Set Featured</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Exchange Management
// ─────────────────────────────────────────────
function ExchangeManagement({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [editItem, setEditItem] = useState<Exchange | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', api_endpoint: '', enabled: true });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/admin/exchanges').then((r: Response) => r.json()).then((d: Exchange[]) => setExchanges(d || [])).catch(() => {});
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (ex: Exchange) => { setEditItem(ex); setForm({ name: ex.name, slug: ex.slug, api_endpoint: ex.api_endpoint, enabled: ex.enabled }); };

  const save = async () => {
    const res = await apiFetch(`/admin/exchanges/${editItem!.id}`, { method: 'PUT', body: JSON.stringify(form) });
    if (res.ok) { setMsg('Exchange updated!'); setEditItem(null); load(); }
    else { const d = await res.json(); setMsg(d.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const toggle = async (ex: Exchange) => {
    await apiFetch(`/admin/exchanges/${ex.id}`, { method: 'PUT', body: JSON.stringify({ ...ex, enabled: !ex.enabled }) });
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete this exchange?')) return;
    await apiFetch(`/admin/exchanges/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Exchange Management</h2>
          <p className={styles.sectionSub}>Enable, disable, or configure crypto exchanges</p>
        </div>
      </div>
      {msg && <div className={styles.toastMsg}>{msg}</div>}

      {editItem && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Edit Exchange — {editItem.name}</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Exchange Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className={styles.input} placeholder="Slug (e.g. binance)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            <input className={styles.input} placeholder="API Endpoint URL" value={form.api_endpoint} onChange={e => setForm(f => ({ ...f, api_endpoint: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
              Enabled
            </label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.accentBtn} onClick={save}>Save Changes</button>
            <button className={styles.ghostBtn} onClick={() => setEditItem(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Exchange</th>
              <th>Slug</th>
              <th>API Endpoint</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map(ex => (
              <tr key={ex.id}>
                <td><span className={styles.exName}>{ex.name}</span></td>
                <td><code className={styles.code}>{ex.slug}</code></td>
                <td><span className={styles.endpoint}>{ex.api_endpoint || '—'}</span></td>
                <td>
                  <button
                    className={styles.statusToggle}
                    data-active={ex.enabled}
                    onClick={() => toggle(ex)}
                  >
                    {ex.enabled ? '● Active' : '○ Disabled'}
                  </button>
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.editBtn} onClick={() => openEdit(ex)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => del(ex.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exchanges.length === 0 && <div className={styles.empty}>No exchanges found.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Coin Management
// ─────────────────────────────────────────────
function CoinManagement({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [editItem, setEditItem] = useState<Coin | null>(null);
  const [form, setForm] = useState({ ticker: '', name: '', emoji: '', color: '#ffffff', display_order: 0, enabled: true });
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/admin/coins').then((r: Response) => r.json()).then((d: Coin[]) => setCoins(d || [])).catch(() => {});
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (c: Coin) => { setEditItem(c); setForm({ ticker: c.ticker, name: c.name, emoji: c.emoji, color: c.color, display_order: c.display_order, enabled: c.enabled }); };

  const save = async () => {
    const res = await apiFetch(`/admin/coins/${editItem!.id}`, { method: 'PUT', body: JSON.stringify(form) });
    if (res.ok) { setMsg('Coin updated!'); setEditItem(null); load(); }
    else { const d = await res.json(); setMsg(d.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this coin?')) return;
    await apiFetch(`/admin/coins/${id}`, { method: 'DELETE' });
    load();
  };

  const toggle = async (c: Coin) => {
    await apiFetch(`/admin/coins/${c.id}`, { method: 'PUT', body: JSON.stringify({ ...c, enabled: !c.enabled }) });
    load();
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Cryptocurrency Management</h2>
          <p className={styles.sectionSub}>Edit, reorder, or disable tracked coins</p>
        </div>
      </div>
      {msg && <div className={styles.toastMsg}>{msg}</div>}

      {editItem && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Edit Coin — {editItem.ticker}</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Ticker" value={form.ticker} disabled style={{ opacity: 0.5 }} />
            <input className={styles.input} placeholder="Full Name (e.g. Bitcoin)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className={styles.input} placeholder="Emoji symbol (e.g. ₿)" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              <input className={styles.input} placeholder="Hex Color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
            <input className={styles.input} type="number" placeholder="Display Order" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
              Enable tracking
            </label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.accentBtn} onClick={save}>Save Changes</button>
            <button className={styles.ghostBtn} onClick={() => setEditItem(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.coinGrid}>
        {coins.map(c => (
          <div key={c.id} className={styles.coinCard} style={{ '--coin-color': c.color } as React.CSSProperties} data-disabled={!c.enabled}>
            <div className={styles.coinCardTop}>
              <span className={styles.coinEmoji} style={{ background: c.color + '22' }}>{c.emoji}</span>
              <div>
                <div className={styles.coinTicker}>{c.ticker}</div>
                <div className={styles.coinName}>{c.name}</div>
              </div>
              <span className={styles.coinOrder}>#{c.display_order}</span>
            </div>
            <div className={styles.coinCardFoot}>
              <button
                className={styles.statusToggle}
                data-active={c.enabled}
                onClick={() => toggle(c)}
              >
                {c.enabled ? '● On' : '○ Off'}
              </button>
              <div className={styles.actionBtns}>
                <button className={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => del(c.id)}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {coins.length === 0 && <div className={styles.empty}>No coins found.</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  User Management
// ─────────────────────────────────────────────
function UserManagement({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/admin/users').then((r: Response) => r.json()).then((d: UserRecord[]) => setUsers(d || [])).catch(() => {});
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const del = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    setMsg('User deleted.');
    setTimeout(() => setMsg(''), 3000);
    load();
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>User Management</h2>
          <p className={styles.sectionSub}>{users.length} registered users</p>
        </div>
        <input
          className={styles.input}
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
      </div>
      {msg && <div className={styles.toastMsg}>{msg}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td className={styles.muted}>{i + 1}</td>
                <td>
                  <div className={styles.userRow}>
                    <span className={styles.avatar}>{u.username[0].toUpperCase()}</span>
                    <span>{u.username}</span>
                  </div>
                </td>
                <td className={styles.muted}>{u.email}</td>
                <td className={styles.muted}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className={styles.deleteBtn} onClick={() => del(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className={styles.empty}>No users found.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Messages
// ─────────────────────────────────────────────
function Messages({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/admin/messages').then((r: Response) => r.json()).then((d: ContactMessage[]) => setMessages(d || [])).catch(() => {});
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id: number, resolved: boolean) => {
    await apiFetch(`/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify({ resolved }) });
    setMsg(resolved ? 'Marked as resolved.' : 'Reopened.');
    setTimeout(() => setMsg(''), 2000);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await apiFetch(`/admin/messages/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.resolved;
    if (filter === 'resolved') return m.resolved;
    return true;
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>User Feedback & Messages</h2>
          <p className={styles.sectionSub}>{messages.filter(m => !m.resolved).length} unread</p>
        </div>
        <div className={styles.filterTabs}>
          {(['all', 'unread', 'resolved'] as const).map(f => (
            <button key={f} className={styles.filterTab} data-active={filter === f} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className={styles.toastMsg}>{msg}</div>}

      <div className={styles.messageList}>
        {filtered.map(m => (
          <div key={m.id} className={styles.messageCard} data-resolved={m.resolved}>
            <div className={styles.messageHeader} onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
              <div className={styles.messageInfo}>
                <span className={styles.messageName}>{m.name}</span>
                <span className={styles.messageEmail}>{m.email}</span>
                {m.subject && <span className={styles.messageSubject}>{m.subject}</span>}
              </div>
              <div className={styles.messageMeta}>
                <span className={styles.messageTime}>{new Date(m.created_at).toLocaleDateString()}</span>
                <span className={styles.messageStatus} data-resolved={m.resolved}>
                  {m.resolved ? '✓ Resolved' : '● Unread'}
                </span>
                <span className={styles.expandChevron}>{expanded === m.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded === m.id && (
              <div className={styles.messageBody}>
                <p>{m.body}</p>
                <div className={styles.messageActions}>
                  <button
                    className={m.resolved ? styles.ghostBtn : styles.accentBtn}
                    onClick={() => resolve(m.id, !m.resolved)}
                  >
                    {m.resolved ? 'Reopen' : '✓ Mark Resolved'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => del(m.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No messages.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Featured Coins
// ─────────────────────────────────────────────
const CATEGORIES = [
  { key: 'trending',    label: '🔥 Trending',       desc: 'Shown in the trending section on homepage' },
  { key: 'top_volume',  label: '📊 Top Volume',      desc: 'High trading volume coins' },
  { key: 'recommended', label: '⭐ Recommended',     desc: 'Editor-recommended coins' },
];

const ALL_COINS = ['BTC','ETH','ADA','SOL','DOGE','XRP','DOT','LTC','BCH','LINK'];

function FeaturedCoins({ apiFetch }: { apiFetch: ReturnType<typeof useAdmin>['apiFetch'] }) {
  const [featured, setFeatured] = useState<FeaturedCoin[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiFetch('/admin/featured').then((r: Response) => r.json()).then((d: FeaturedCoin[]) => {
      setFeatured(d || []);
      const map: Record<string, string[]> = {};
      (d || []).forEach(f => {
        if (!map[f.category]) map[f.category] = [];
        map[f.category].push(f.ticker);
      });
      setSelected(map);
    }).catch(() => {});
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const toggleCoin = (category: string, ticker: string) => {
    setSelected(s => {
      const current = s[category] || [];
      const next = current.includes(ticker)
        ? current.filter(t => t !== ticker)
        : [...current, ticker];
      return { ...s, [category]: next };
    });
  };

  const save = async (category: string) => {
    const tickers = selected[category] || [];
    const res = await apiFetch('/admin/featured', {
      method: 'POST',
      body: JSON.stringify({ tickers, category }),
    });
    if (res.ok) { setMsg(`${category} updated!`); load(); }
    else { const d = await res.json(); setMsg(d.error || 'Error'); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Featured Coins</h2>
          <p className={styles.sectionSub}>Select coins to highlight on the homepage in each category</p>
        </div>
      </div>
      {msg && <div className={styles.toastMsg}>{msg}</div>}

      {CATEGORIES.map(cat => (
        <div key={cat.key} className={styles.featuredCard}>
          <div className={styles.featuredCatHeader}>
            <div>
              <span className={styles.featuredCatTitle}>{cat.label}</span>
              <span className={styles.featuredCatDesc}>{cat.desc}</span>
            </div>
            <button className={styles.accentBtn} onClick={() => save(cat.key)}>Save</button>
          </div>
          <div className={styles.coinPills}>
            {ALL_COINS.map(ticker => {
              const active = (selected[cat.key] || []).includes(ticker);
              return (
                <button
                  key={ticker}
                  className={styles.coinPill}
                  data-active={active}
                  onClick={() => toggleCoin(cat.key, ticker)}
                >
                  {ticker}
                </button>
              );
            })}
          </div>
          <div className={styles.featuredSelected}>
            Selected: {(selected[cat.key] || []).join(', ') || 'None'}
          </div>
        </div>
      ))}

      <div className={styles.featuredPreview}>
        <h3 className={styles.infoTitle}>📡 Current Featured (from DB)</h3>
        <div className={styles.featuredTable}>
          {CATEGORIES.map(cat => (
            <div key={cat.key} className={styles.featuredRow}>
              <span className={styles.featuredCatLabel}>{cat.label}</span>
              <div className={styles.featuredPills}>
                {featured.filter(f => f.category === cat.key).map(f => (
                  <span key={f.id} className={styles.featuredPill}>{f.ticker}</span>
                ))}
                {featured.filter(f => f.category === cat.key).length === 0 && (
                  <span className={styles.muted}>None set</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Admin Shell
// ─────────────────────────────────────────────
function AdminShell() {
  const { isLoggedIn, admin, logout, apiFetch } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!isLoggedIn) return <AdminLogin />;

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard',  icon: '⊞',  label: 'Dashboard' },
    { key: 'exchanges',  icon: '⚡', label: 'Exchanges' },
    { key: 'coins',      icon: '🪙', label: 'Coins' },
    { key: 'users',      icon: '👥', label: 'Users' },
    { key: 'messages',   icon: '✉️', label: 'Messages' },
    { key: 'featured',   icon: '⭐', label: 'Featured' },
  ];

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src={logo} alt="ExchangeGo" className={styles.sidebarLogoImg} />
          <div>
            <div className={styles.sidebarLogoText}>ExchangeGo</div>
            <div className={styles.sidebarLogoSub}>Admin Portal</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={styles.sidebarItem}
              data-active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              <span className={styles.sidebarIcon}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminBadge}>
            <span className={styles.adminAvatar}>{admin?.username[0].toUpperCase()}</span>
            <div>
              <div className={styles.adminName}>{admin?.username}</div>
              <div className={styles.adminRole}>Administrator</div>
            </div>
          </div>
          <button className={styles.themeToggleBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀ Light Mode' : '☾ Dark Mode'}
          </button>
          <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {tab === 'dashboard' && <Dashboard apiFetch={apiFetch} />}
          {tab === 'exchanges' && <ExchangeManagement apiFetch={apiFetch} />}
          {tab === 'coins'     && <CoinManagement apiFetch={apiFetch} />}
          {tab === 'users'     && <UserManagement apiFetch={apiFetch} />}
          {tab === 'messages'  && <Messages apiFetch={apiFetch} />}
          {tab === 'featured'  && <FeaturedCoins apiFetch={apiFetch} />}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Exported page (wraps its own AdminProvider)
// ─────────────────────────────────────────────
export default function AdminPage() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AdminShell />
      </AdminProvider>
    </ThemeProvider>
  );
}
