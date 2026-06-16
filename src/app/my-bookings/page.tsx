'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/lib/liffContext';
import { CustomerLayout } from '@/components/CustomerLayout';
import { Clock, Calendar, AlertTriangle, AlertCircle, Trash2, Check, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  dateTime: string;
  status: string; // CONFIRMED, CANCELLED
  notes: string | null;
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

export default function MyBookings() {
  const { profile, loading: liffLoading, login } = useLiff();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBookings = async () => {
    if (!profile) return;
    setLoadingBookings(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/bookings?lineUserId=${profile.userId}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
      setErrorMsg('予約情報の取得に失敗しました。');
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchBookings();
    }
  }, [profile]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('本当にこのご予約をキャンセルしますか？')) return;
    
    setCancellingId(bookingId);
    setErrorMsg('');
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Refresh bookings
        await fetchBookings();
      } else {
        setErrorMsg(data.error || '予約のキャンセルに失敗しました。');
      }
    } catch (e) {
      setErrorMsg('通信エラーが発生しました。');
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  
  // Separate upcoming and past bookings
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.dateTime) >= now && b.status === 'CONFIRMED'
  );
  const pastOrCancelledBookings = bookings.filter(
    (b) => new Date(b.dateTime) < now || b.status === 'CANCELLED'
  );

  const formatBookingDateTime = (dateTimeStr: string) => {
    const d = new Date(dateTimeStr);
    const dateStr = d.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const timeStr = d.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr} ${timeStr}～`;
  };

  if (liffLoading) {
    return (
      <CustomerLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>読み込み中...</span>
        </div>
      </CustomerLayout>
    );
  }

  if (!profile) {
    return (
      <CustomerLayout>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px', animation: 'slideUp 0.3s ease-out' }}>
          <AlertCircle size={40} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>マイ予約の確認</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '24px' }}>
            ご予約状況の確認や、キャンセル手続きを行うには、<br />LINE公式アカウントへのログインが必要です。
          </p>
          <button onClick={() => login()} className="btn btn-line">
            LINEでログインする
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div style={{ animation: 'slideUp 0.3s ease-out' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>予約状況の確認</h3>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Section 1: Upcoming Bookings */}
        <section style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: '6px' }}>
            現在のご予約予定 ({upcomingBookings.length})
          </h4>

          {loadingBookings ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
              <Loader2 className="animate-spin" size={20} style={{ color: 'var(--primary)' }} />
            </div>
          ) : upcomingBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-confirmed">予約確定</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      ￥{booking.service.price.toLocaleString()}
                    </span>
                  </div>

                  <h5 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>
                    {booking.service.name}
                  </h5>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} /> 日時: {formatBookingDateTime(booking.dateTime)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} /> 施術時間: {booking.service.duration}分
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={12} /> 担当: {booking.staff ? `${booking.staff.name} (${booking.staff.role})` : '指名なし'}
                    </div>
                  </div>

                  {booking.notes && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '16px', color: 'var(--text-secondary)', borderLeft: '2px solid var(--primary)' }}>
                      <strong>ご要望:</strong> {booking.notes}
                    </div>
                  )}

                  <button
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', marginLeft: 'auto' }}
                  >
                    {cancellingId === booking.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    予約をキャンセルする
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              現在のご予約予定はありません。
            </div>
          )}
        </section>

        {/* Section 2: Past / Cancelled Bookings */}
        <section>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
            過去・キャンセル履歴
          </h4>

          {loadingBookings ? null : pastOrCancelledBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.6 }}>
              {pastOrCancelledBookings.map((booking) => {
                const isCancelled = booking.status === 'CANCELLED';
                return (
                  <div key={booking.id} className="glass-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ fontSize: '0.95rem', fontWeight: 600, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                        {booking.service.name}
                      </h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        {formatBookingDateTime(booking.dateTime)}
                      </span>
                    </div>
                    <div>
                      {isCancelled ? (
                        <span className="badge badge-cancelled">キャンセル済</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>来店済</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px 0' }}>
              履歴はありません。
            </div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
