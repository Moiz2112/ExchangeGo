import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Profile.module.css';

interface UserProfile {
  email: string;
  username: string;
  created_at: string;
}

interface Favorite {
  ticker?: string;
  name?: string;
  type: 'coin' | 'exchange';
}

export default function Profile() {
  const { isLoggedIn, user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'favorites' | 'security'>('info');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    loadProfile();
    loadFavorites();
  }, [isLoggedIn, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      // For now, use the user data from context
      if (user) {
        setProfile({
          email: user.email,
          username: user.username,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('exchangego_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  };

  const removeFavorite = (type: 'coin' | 'exchange', identifier: string) => {
    const updated = favorites.filter(
      f => !(f.type === type && (f.ticker || f.name) === identifier)
    );
    setFavorites(updated);
    localStorage.setItem('exchangego_favorites', JSON.stringify(updated));
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');

    if (!passwordForm.new || !passwordForm.confirm) {
      setPasswordMsg('Please fill in all fields');
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMsg('Passwords do not match');
      return;
    }

    if (passwordForm.new.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('http://localhost:8081/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.new,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg(data.error || 'Failed to reset password');
      } else {
        setPasswordMsg('Password updated successfully!');
        setPasswordForm({ current: '', new: '', confirm: '' });
        setShowPasswordForm(false);
        setTimeout(() => setPasswordMsg(''), 3000);
      }
    } catch (err) {
      setPasswordMsg('Error connecting to server');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className={styles.page} data-theme={theme}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-theme={theme}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>
              {user?.username[0].toUpperCase()}
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.username}>{user?.username}</h1>
              <p className={styles.email}>{user?.email}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <span className={styles.tabIcon}>👤</span>
            Profile Info
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <span className={styles.tabIcon}>❤️</span>
            Favorites
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className={styles.tabIcon}>🔒</span>
            Security
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && <div className={styles.errorMsg}>{error}</div>}

          {/* Info Tab */}
          {activeTab === 'info' && profile && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Username</label>
                  <p className={styles.infoValue}>{profile.username}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Email</label>
                  <p className={styles.infoValue}>{profile.email}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Member Since</label>
                  <p className={styles.infoValue}>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Favorites</h2>
              {favorites.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>❤️</div>
                  <p className={styles.emptyText}>
                    No favorites yet. Click the heart icon on coins and exchanges to add them here!
                  </p>
                </div>
              ) : (
                <div className={styles.favoritesList}>
                  <div className={styles.favoritesGroup}>
                    <h3 className={styles.groupTitle}>💰 Coins</h3>
                    <div className={styles.favoritesGrid}>
                      {favorites
                        .filter(f => f.type === 'coin')
                        .map((fav, idx) => (
                          <div key={idx} className={styles.favoriteCard}>
                            <div className={styles.favoriteContent}>
                              <span className={styles.favoriteTicker}>{fav.ticker}</span>
                              <span className={styles.favoriteName}>{fav.name}</span>
                            </div>
                            <button
                              className={styles.removeFavBtn}
                              onClick={() => removeFavorite('coin', fav.ticker!)}
                              title="Remove from favorites"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className={styles.favoritesGroup}>
                    <h3 className={styles.groupTitle}>🏢 Exchanges</h3>
                    <div className={styles.favoritesGrid}>
                      {favorites
                        .filter(f => f.type === 'exchange')
                        .map((fav, idx) => (
                          <div key={idx} className={styles.favoriteCard}>
                            <div className={styles.favoriteContent}>
                              <span className={styles.favoriteName}>{fav.name}</span>
                            </div>
                            <button
                              className={styles.removeFavBtn}
                              onClick={() => removeFavorite('exchange', fav.name!)}
                              title="Remove from favorites"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Security Settings</h2>
              
              {!showPasswordForm ? (
                <button
                  className={styles.resetBtn}
                  onClick={() => setShowPasswordForm(true)}
                >
                  🔑 Reset Password
                </button>
              ) : (
                <form onSubmit={handlePasswordReset} className={styles.passwordForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Enter new password"
                      value={passwordForm.new}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Confirm new password"
                      value={passwordForm.confirm}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm: e.target.value })
                      }
                      required
                    />
                  </div>

                  {passwordMsg && (
                    <div
                      className={`${styles.message} ${
                        passwordMsg.includes('success') ? styles.successMsg : styles.errorMsg
                      }`}
                    >
                      {passwordMsg}
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setShowPasswordForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
