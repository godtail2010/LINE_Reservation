'use client';

import React from 'react';
import { useLiff } from '@/lib/liffContext';
import { Calendar, User, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading, login, logout, isMock } = useLiff();
  const pathname = usePathname();

  return (
    <div className="container">
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            AURA Hair Salon
          </span>
          <h1 style={{ fontSize: '1.25rem', marginTop: '2px' }}>LINE予約システム</h1>
        </div>

        {loading ? (
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-secondary)' }} />
        ) : profile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{profile.displayName}</div>
              <button 
                onClick={logout} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.7rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '2px', 
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                <LogOut size={10} /> ログアウト
              </button>
            </div>
            {profile.pictureUrl ? (
              <img src={profile.pictureUrl} alt={profile.displayName} className="user-avatar" style={{ width: '36px', height: '36px' }} />
            ) : (
              <div className="user-avatar-placeholder" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                {profile.displayName[0]}
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => login()} 
            className="btn btn-line" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
          >
            ログイン
          </button>
        )}
      </header>

      {/* Main Content */}
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>予約する</span>
        </Link>
        <Link href="/my-bookings" className={`nav-item ${pathname === '/my-bookings' ? 'active' : ''}`}>
          <User size={20} />
          <span>マイ予約</span>
        </Link>
      </nav>

      {/* Demo watermark in development */}
      {isMock && (
        <div style={{ 
          position: 'fixed', 
          top: '12px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: 'rgba(236, 72, 153, 0.2)', 
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: 'var(--secondary)', 
          padding: '4px 12px', 
          borderRadius: '9999px', 
          fontSize: '0.65rem', 
          fontWeight: 700,
          zIndex: 9999,
          pointerEvents: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          LINE SIMULATOR MODE
        </div>
      )}
    </div>
  );
};
