'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Calendar, Users, DollarSign, RefreshCw, Trash, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface Booking {
  id: string;
  dateTime: string;
  status: string; // CONFIRMED, CANCELLED
  notes: string | null;
  user: {
    name: string;
    pictureUrl: string | null;
    lineId: string;
  };
  service: {
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    name: string;
    role: string;
  } | null;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error('Failed to fetch admin bookings:', e);
      setErrorMsg('予約情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchBookings);
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (newStatus === 'CANCELLED' && !confirm('この予約をキャンセル状態に変更しますか？')) return;
    
    setUpdatingId(bookingId);
    setErrorMsg('');
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Refresh local bookings list
        await fetchBookings();
      } else {
        setErrorMsg(data.error || 'ステータスの更新に失敗しました。');
      }
    } catch {
      setErrorMsg('エラーが発生しました。');
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculate stats
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const uniqueUsers = Array.from(new Set(bookings.map((b) => b.user.lineId))).length;
  const estimatedRevenue = activeBookings.reduce((sum, b) => sum + b.service.price, 0);

  const formatDateTime = (dateTimeStr: string) => {
    const d = new Date(dateTimeStr);
    const dateStr = d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', weekday: 'short' });
    const timeStr = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>予約スケジュール</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            サロンの全予約状況をリアルタイムで確認・管理できます。
          </p>
        </div>
        
        <button 
          onClick={fetchBookings} 
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>更新</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Stats cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>確定ご予約数</span>
            <Calendar size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="admin-stat-num">{activeBookings.length} 件</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>累計予約: {bookings.length} 件</span>
        </div>

        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>登録顧客数</span>
            <Users size={20} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className="admin-stat-num">{uniqueUsers} 名</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LINE連携済みユーザー</span>
        </div>

        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>見込み売上</span>
            <DollarSign size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div className="admin-stat-num">¥{estimatedRevenue.toLocaleString()}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>※確定予約の施術料金合計</span>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>予約スケジュールを読み込み中...</span>
        </div>
      ) : bookings.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ご予約日時</th>
                <th>お客様</th>
                <th>施術メニュー</th>
                <th>担当者</th>
                <th>ステータス</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const isCancelled = booking.status === 'CANCELLED';
                return (
                  <tr key={booking.id} style={{ opacity: isCancelled ? 0.5 : 1 }}>
                    <td style={{ fontWeight: 600 }}>
                      {formatDateTime(booking.dateTime)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {booking.user.pictureUrl ? (
                          <img src={booking.user.pictureUrl} alt={booking.user.name} className="user-avatar" style={{ width: '28px', height: '28px' }} />
                        ) : (
                          <div className="user-avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                            {booking.user.name[0]}
                          </div>
                        )}
                        <div>
                          <span style={{ fontWeight: 500, display: 'block' }}>{booking.user.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {booking.user.lineId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 500 }}>{booking.service.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                          ¥{booking.service.price.toLocaleString()} / {booking.service.duration}分
                        </span>
                      </div>
                    </td>
                    <td>
                      {booking.staff ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{booking.staff.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{booking.staff.role}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>指名なし</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>
                        {booking.status === 'CONFIRMED' ? '確定' : 'キャンセル済'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {isCancelled ? (
                          <button
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}
                          >
                            <CheckCircle2 size={12} />
                            予約を戻す
                          </button>
                        ) : (
                          <button
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}
                          >
                            <Trash size={12} />
                            キャンセル
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={32} style={{ color: 'var(--primary)', marginBottom: '12px', opacity: 0.7 }} />
          <h3>予約スケジュールはありません。</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            顧客がLINE予約を入れるとここに表示されます。
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
