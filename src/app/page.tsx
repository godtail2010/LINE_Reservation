'use client';

import React, { useState, useEffect } from 'react';
import { useLiff } from '@/lib/liffContext';
import { CustomerLayout } from '@/components/CustomerLayout';
import { 
  Sparkles, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  workingDays: string;
}

const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function BookingWizard() {
  const { profile, login } = useLiff();
  
  // Wizard steps
  const [step, setStep] = useState(1);
  
  // Data lists
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  
  // Selection states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  
  // Loading states
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, staffRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/staff')
        ]);
        
        const servicesJson = await servicesRes.json();
        const staffJson = await staffRes.json();
        
        if (servicesJson.success) setServices(servicesJson.services);
        if (staffJson.success) setStaff(staffJson.staff);
      } catch (e) {
        console.error('Failed to fetch initial data:', e);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Fetch busy slots when date or staff changes
  useEffect(() => {
    if (!selectedDate) return;
    const date = selectedDate; // Local copy to help TS compiler type inference
    
    async function fetchBusySlots() {
      setLoadingSlots(true);
      setSelectedTime(null);
      setErrorMsg('');
      
      const yyyy = date.getFullYear();
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      let url = `/api/bookings/busy-slots?date=${dateStr}`;
      if (selectedStaff) {
        url += `&staffId=${selectedStaff.id}`;
      }
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setBusySlots(data.busySlots);
        }
      } catch (e) {
        console.error('Failed to fetch busy slots:', e);
      } finally {
        setLoadingSlots(false);
      }
    }
    
    fetchBusySlots();
  }, [selectedDate, selectedStaff]);

  // Generate next 14 days
  const getNext14Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isDayWorking = (date: Date, staffMember: Staff | null) => {
    if (!staffMember) return true; // No preference, assume open
    const dayOfWeek = date.getDay().toString(); // "0" (Sun) to "6" (Sat)
    const workingDaysArray = staffMember.workingDays.split(',');
    return workingDaysArray.includes(dayOfWeek);
  };

  const handleBooking = async () => {
    if (!profile) {
      login();
      return;
    }
    
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    setBookingInProgress(true);
    setErrorMsg('');
    
    const yyyy = selectedDate.getFullYear();
    const timeParts = selectedTime.split(':');
    
    // Create combined booking Date object
    const bookingDateTime = new Date(yyyy, selectedDate.getMonth(), selectedDate.getDate(), parseInt(timeParts[0]), parseInt(timeParts[1]));

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: profile.userId,
          serviceId: selectedService.id,
          staffId: selectedStaff ? selectedStaff.id : null,
          dateTime: bookingDateTime.toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setBookingSuccess(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setErrorMsg(data.error || '予約の登録に失敗しました。もう一度お試しください。');
      }
    } catch {
      setErrorMsg('通信エラーが発生しました。ネットワーク環境をご確認ください。');
    } finally {
      setBookingInProgress(false);
    }
  };

  const resetWizard = () => {
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    setBookingSuccess(false);
    setStep(1);
    setErrorMsg('');
  };

  const renderProgressBar = () => {
    const percentage = ((step - 1) / 3) * 100;
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <span style={{ color: step >= 1 ? 'var(--primary)' : 'inherit', fontWeight: step === 1 ? '700' : 'normal' }}>1. メニュー</span>
          <span style={{ color: step >= 2 ? 'var(--primary)' : 'inherit', fontWeight: step === 2 ? '700' : 'normal' }}>2. スタッフ</span>
          <span style={{ color: step >= 3 ? 'var(--primary)' : 'inherit', fontWeight: step === 3 ? '700' : 'normal' }}>3. 日時選択</span>
          <span style={{ color: step >= 4 ? 'var(--primary)' : 'inherit', fontWeight: step === 4 ? '700' : 'normal' }}>4. 確認</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
    );
  };

  if (loadingData) {
    return (
      <CustomerLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>メニュー情報を読み込み中...</span>
        </div>
      </CustomerLayout>
    );
  }

  if (bookingSuccess) {
    return (
      <CustomerLayout>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 24px', animation: 'slideUp 0.4s ease-out' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle size={40} style={{ color: 'var(--success)', margin: 'auto' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>ご予約が完了しました！</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '32px' }}>
            ご入力いただいた内容は無事に登録されました。<br />
            LINE公式アカウント宛てに、予約内容の確認メッセージをお送りしましたのでご確認ください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/my-bookings" className="btn btn-primary">
              マイ予約で確認する
            </Link>
            <button onClick={resetWizard} className="btn btn-secondary">
              新しく予約を入れる
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {renderProgressBar()}

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>施術メニューをお選びください</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className={`glass-card interactive ${selectedService?.id === service.id ? 'selected' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>{service.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                    {service.description || '詳細情報はありません。'}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {service.duration}分
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    ￥{service.price.toLocaleString()}
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Staff Selection */}
      {step === 2 && (
        <div style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>担当スタッフをお選びください</h3>
            </div>
            <button 
              onClick={() => setStep(1)} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
            >
              戻る
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* No Preference Option */}
            <div
              onClick={() => {
                setSelectedStaff(null);
                setStep(3);
              }}
              className={`glass-card interactive ${selectedStaff === null ? 'selected' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <div className="user-avatar-placeholder" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', width: '48px', height: '48px', fontSize: '1.1rem' }}>
                ⭐
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>指名なし</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  最も早い空き枠をご案内します（指名料無料）。
                </p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Individual Stylists */}
            {staff.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  setSelectedStaff(st);
                  setStep(3);
                }}
                className={`glass-card interactive ${selectedStaff?.id === st.id ? 'selected' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                {st.avatarUrl ? (
                  <img src={st.avatarUrl} alt={st.name} className="user-avatar" style={{ width: '48px', height: '48px', border: '1px solid var(--glass-border)' }} />
                ) : (
                  <div className="user-avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                    {st.name[0]}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{st.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{st.role}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Date & Time Slot Selection */}
      {step === 3 && (
        <div style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>希望の日時を選択してください</h3>
            </div>
            <button 
              onClick={() => setStep(2)} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
            >
              戻る
            </button>
          </div>

          {/* Date Picker Header */}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>日付を選択:</span>
          
          {/* Scrollable Date row */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginTop: '8px' }}>
            {getNext14Days().map((date, idx) => {
              const isWorking = isDayWorking(date, selectedStaff);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();
              
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              const dayName = dayNames[date.getDay()];
              
              return (
                <button
                  key={idx}
                  disabled={!isWorking}
                  onClick={() => setSelectedDate(date)}
                  className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  style={{ minWidth: '60px', flexShrink: 0 }}
                >
                  <span style={{ fontSize: '0.75rem', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                    {date.getMonth() + 1}/{date.getDate()}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>
                    {dayName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time Slot Picker */}
          {selectedDate ? (
            <div style={{ marginTop: '24px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>時間帯を選択:</span>
              
              {loadingSlots ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '24px 0', justifyContent: 'center' }}>
                  <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>空き枠を確認中...</span>
                </div>
              ) : (
                <div className="slots-grid">
                  {TIME_SLOTS.map((time) => {
                    const isBusy = busySlots.includes(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        disabled={isBusy}
                        onClick={() => setSelectedTime(time)}
                        className={`slot-btn ${isSelected ? 'selected' : ''}`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', marginTop: '24px', borderStyle: 'dashed' }}>
              <Info size={24} style={{ color: 'var(--primary)', marginBottom: '8px', opacity: 0.7 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                カレンダーから日付を選択すると、<br />空き時間帯スロットが表示されます。
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div style={{ marginTop: '32px' }}>
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(4)}
              className="btn btn-primary"
            >
              確認画面へ進む <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Final Confirmation */}
      {step === 4 && (
        <div style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem' }}>ご予約内容の確認</h3>
            </div>
            <button 
              onClick={() => setStep(3)} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
            >
              戻る
            </button>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {/* Service details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ご希望メニュー:</span>
                <h4 style={{ fontSize: '1.1rem', marginTop: '2px' }}>{selectedService?.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Clock size={10} /> 所要時間: {selectedService?.duration}分
                </span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
                ￥{selectedService?.price.toLocaleString()}
              </span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

            {/* Staff details */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>担当者:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedStaff ? (
                  <>
                    {selectedStaff.avatarUrl ? (
                      <img src={selectedStaff.avatarUrl} alt={selectedStaff.name} className="user-avatar" style={{ width: '28px', height: '28px' }} />
                    ) : (
                      <div className="user-avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>{selectedStaff.name[0]}</div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedStaff.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{selectedStaff.role}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.75rem', background: 'var(--bg-tertiary)' }}>⭐</div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>指名なし</span>
                  </>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />

            {/* Date details */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ご予約日時:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {selectedDate?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                </span>
                <Clock size={16} style={{ color: 'var(--primary)', marginLeft: '12px' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {selectedTime}～
                </span>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label htmlFor="notes" className="form-label">
                ご要望・ご相談（オプション）:
              </label>
              <textarea
                id="notes"
                placeholder="髪型やカラーのご要望、またはアレルギーや気になる点などがあればご記入ください。"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '80px', resize: 'none' }}
              />
            </div>
          </div>

          {/* User auth state checking */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {bookingInProgress ? (
            <button disabled className="btn btn-primary">
              <Loader2 className="animate-spin" size={18} />
              処理中...
            </button>
          ) : profile ? (
            <button onClick={handleBooking} className="btn btn-primary">
              この内容で予約を確定する
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} />
                <span>予約を完了するには、LINEアカウントのログインが必要です。</span>
              </div>
              <button onClick={() => login()} className="btn btn-line">
                LINEでログインして予約を完了する
              </button>
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  );
}
