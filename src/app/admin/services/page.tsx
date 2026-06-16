'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Clock, Plus, AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (e) {
      console.error('Failed to fetch services:', e);
      setErrorMsg('施術メニューの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchServices);
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !duration) return;
    
    setAdding(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: parseInt(price),
          duration: parseInt(duration),
          description: description || null,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Reset form
        setName('');
        setPrice('');
        setDuration('');
        setDescription('');
        
        // Refresh services
        await fetchServices();
      } else {
        setErrorMsg(data.error || '施術メニューの追加に失敗しました。');
      }
    } catch {
      setErrorMsg('エラーが発生しました。');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`「${name}」を削除してもよろしいですか？\n※登録済みの既存のご予約は削除されません。`)) {
      return;
    }

    setErrorMsg('');
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchServices();
      } else {
        setErrorMsg(data.error || '施術メニューの削除に失敗しました。');
      }
    } catch {
      setErrorMsg('削除処理中にエラーが発生しました。');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>施術メニュー管理</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            LINE予約画面に表示される施術メニュー（料金・所要時間）を設定します。
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
        {/* Left Side: Services List */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
            </div>
          ) : services.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {services.map((service) => (
                <div key={service.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>{service.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                      {service.description || '説明文はありません。'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {service.duration}分
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>
                        ¥{service.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="btn btn-secondary"
                      style={{
                        padding: '8px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--error)',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        cursor: 'pointer',
                      }}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              登録されている施術メニューがありません。右側のフォームから追加してください。
            </div>
          )}
        </div>

        {/* Right Side: Add Service Form */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            メニューを追加
          </h3>

          <form onSubmit={handleAddService}>
            <div className="form-group">
              <label htmlFor="service-name" className="form-label">メニュー名称</label>
              <input
                id="service-name"
                type="text"
                required
                placeholder="例: デザインカット ＋ シャンプー"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service-price" className="form-label">料金 (税込・円)</label>
              <input
                id="service-price"
                type="number"
                required
                min="0"
                placeholder="例: 6000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service-duration" className="form-label">施術時間 (分)</label>
              <input
                id="service-duration"
                type="number"
                required
                min="5"
                placeholder="例: 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service-description" className="form-label">メニュー説明 (オプション)</label>
              <textarea
                id="service-description"
                placeholder="メニューの特徴や対象となるお客様について記述します。"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
                style={{ height: '80px', resize: 'none' }}
              />
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
