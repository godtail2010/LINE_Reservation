'use client';

import React from 'react';
import { CalendarRange, ClipboardList, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="admin-grid">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo">AURA SALON</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            管理者用ダッシュボード
          </span>
        </div>

        <nav className="admin-menu">
          <Link href="/admin" className={`admin-menu-item ${pathname === '/admin' ? 'active' : ''}`}>
            <CalendarRange size={18} />
            <span>予約スケジュール</span>
          </Link>
          <Link href="/admin/services" className={`admin-menu-item ${pathname === '/admin/services' ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span>施術メニュー管理</span>
          </Link>
          <Link href="/admin/staff" className={`admin-menu-item ${pathname === '/admin/staff' ? 'active' : ''}`}>
            <Users size={18} />
            <span>スタッフ・シフト</span>
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'var(--text-secondary)', 
              fontSize: '0.85rem', 
              textDecoration: 'none' 
            }}
          >
            <LogOut size={16} />
            <span>予約画面へ戻る</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};
