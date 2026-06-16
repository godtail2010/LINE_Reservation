'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Users, Plus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  workingDays: string; // e.g. "1,2,3,4,5"
}

const WEEKDAYS = [
  { label: '日', value: '0' },
  { label: '月', value: '1' },
  { label: '火', value: '2' },
  { label: '水', value: '3' },
  { label: '木', value: '4' },
  { label: '金', value: '5' },
  { label: '土', value: '6' },
];

export default function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']); // Default Mon-Fri

  const fetchStaff = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e);
      setErrorMsg('スタッフ情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDayToggle = (dayValue: string) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    if (selectedDays.length === 0) {
      setErrorMsg('出勤曜日を少なくとも1日以上選択してください。');
      return;
    }

    setAdding(true);
    setErrorMsg('');

    // Sort days numerically
    const sortedDays = [...selectedDays].sort((a, b) => parseInt(a) - parseInt(b)).join(',');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          avatarUrl: avatarUrl || null,
          workingDays: sortedDays,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset form
        setName('');
        setRole('');
        setAvatarUrl('');
        setSelectedDays(['1', '2', '3', '4', '5']);

        // Refresh staff
        await fetchStaff();
      } else {
        setErrorMsg(data.error || 'スタッフの追加に失敗しました。');
      }
    } catch (e) {
      setErrorMsg('エラーが発生しました。');
    } finally {
      setAdding(false);
    }
  };

  const formatWorkingDays = (daysStr: string) => {
    const days = daysStr.split(',');
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    
    // Check if it represents standard Mon-Fri
    if (days.length === 5 && days.every(d => ['1', '2', '3', '4', '5'].includes(d))) {
      return '月～金 (平日のみ)';
    }
    // Check if it represents all days
    if (days.length === 7) {
      return '年中無休 (毎日)';
    }

    return days.map((d) => dayNames[parseInt(d)]).join(', ');
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>スタッフ・シフト管理</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            サロンに所属するスタイリストのプロフィールと、基本となる出勤スケジュール（曜日）を設定します。
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Staff List */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
            </div>
          ) : staff.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {staff.map((st) => (
                <div key={st.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {st.avatarUrl ? (
                    <img src={st.avatarUrl} alt={st.name} className="user-avatar" style={{ width: '48px', height: '48px', border: '1px solid var(--glass-border)' }} />
                  ) : (
                    <div className="user-avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                      {st.name[0]}
                    </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{st.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{st.role}</span>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600 }}>出勤日:</span>
                      <span>{formatWorkingDays(st.workingDays)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              登録されているスタッフがいません。右側のフォームから追加してください。
            </div>
          )}
        </div>

        {/* Right Side: Add Staff Form */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            スタッフを追加
          </h3>

          <form onSubmit={handleAddStaff}>
            <div className="form-group">
              <label htmlFor="staff-name" className="form-label">氏名・ニックネーム</label>
              <input
                id="staff-name"
                type="text"
                required
                placeholder="例: HARU (ハル)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="staff-role" className="form-label">役職・役職名</label>
              <input
                id="staff-role"
                type="text"
                required
                placeholder="例: スタイリスト"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="staff-avatar" className="form-label">アバター画像URL (オプション)</label>
              <input
                id="staff-avatar"
                type="text"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">基本の出勤シフト (曜日)</label>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', marginTop: '8px' }}>
                {WEEKDAYS.map((day) => {
                  const isChecked = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      style={{
                        background: isChecked ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                        color: isChecked ? 'white' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--glass-border)',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="btn btn-primary"
              style={{ marginTop: '12px' }}
            >
              {adding ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                '登録する'
              )}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
