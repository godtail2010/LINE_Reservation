'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextType {
  liff: any;
  profile: LiffProfile | null;
  loading: boolean;
  isMock: boolean;
  login: (mockUser?: LiffProfile) => void;
  logout: () => void;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  profile: null,
  loading: true,
  isMock: true,
  login: () => {},
  logout: () => {},
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liffInstance, setLiffInstance] = useState<any>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const [showMockLogin, setShowMockLogin] = useState(false);

  useEffect(() => {
    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      const useRealLiff = liffId && !liffId.startsWith('mock-') && typeof window !== 'undefined';

      if (useRealLiff) {
        try {
          setIsMock(false);
          // Dynamically import LIFF to prevent server-side rendering errors
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId });
          setLiffInstance(liff);

          if (liff.isLoggedIn()) {
            const userProfile = await liff.getProfile();
            setProfile(userProfile);
            
            // Sync user profile to backend db
            await syncUserProfile(userProfile);
          } else {
            // Not logged in, but we won't force login automatically on page load to allow browsing
          }
        } catch (err) {
          console.error('LIFF initialization failed. Falling back to mock:', err);
          setIsMock(true);
          setupMockUser();
        } finally {
          setLoading(false);
        }
      } else {
        // Mock Mode
        setIsMock(true);
        setupMockUser();
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  const setupMockUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_liff_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setProfile(user);
          syncUserProfile(user);
        } catch (e) {
          localStorage.removeItem('mock_liff_user');
        }
      }
    }
  };

  const syncUserProfile = async (user: LiffProfile) => {
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.error('Failed to sync user profile with backend db:', e);
    }
  };

  const login = (mockUser?: LiffProfile) => {
    if (!isMock && liffInstance) {
      liffInstance.login();
    } else {
      if (mockUser) {
        localStorage.setItem('mock_liff_user', JSON.stringify(mockUser));
        setProfile(mockUser);
        syncUserProfile(mockUser);
        setShowMockLogin(false);
      } else {
        setShowMockLogin(true);
      }
    }
  };

  const logout = () => {
    if (!isMock && liffInstance) {
      liffInstance.logout();
      setProfile(null);
      window.location.reload();
    } else {
      localStorage.removeItem('mock_liff_user');
      setProfile(null);
      window.location.reload();
    }
  };

  // Mock User Choices
  const mockUsers: LiffProfile[] = [
    {
      userId: 'U1234567890abcdef1234567890abcdef',
      displayName: '佐藤 みく (Sato Miku)',
      pictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
      statusMessage: '美容室探し中 💅',
    },
    {
      userId: 'U0987654321fedcba0987654321fedcba',
      displayName: '田中 健太 (Tanaka Kenta)',
      pictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
      statusMessage: 'イメチェンしたい！ 💇‍♂️',
    },
    {
      userId: 'U11223344556677889900aabbccddeeff',
      displayName: '鈴木 雅子 (Suzuki Masako)',
      pictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop',
      statusMessage: 'ヘアケア重視 ✨',
    },
  ];

  return (
    <LiffContext.Provider
      value={{
        liff: liffInstance,
        profile,
        loading,
        isMock,
        login,
        logout,
      }}
    >
      {children}

      {/* Mock LINE Login Modal */}
      {showMockLogin && (
        <div className="mock-login-overlay">
          <div className="mock-login-modal">
            <div className="mock-login-header">
              <span className="line-icon-logo">LINE</span>
              <h3>LINEログイン (デモ・シミュレータ)</h3>
              <p>ローカル開発環境用の模擬ログイン画面です。ログインするユーザーを選択してください。</p>
            </div>
            
            <div className="mock-user-list">
              {mockUsers.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => login(user)}
                  className="mock-user-card"
                >
                  {user.pictureUrl ? (
                    <img src={user.pictureUrl} alt={user.displayName} className="mock-user-avatar" />
                  ) : (
                    <div className="mock-user-avatar-placeholder">{user.displayName[0]}</div>
                  )}
                  <div className="mock-user-info">
                    <span className="mock-user-name">{user.displayName}</span>
                    <span className="mock-user-status">{user.statusMessage || ''}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMockLogin(false)}
              className="mock-login-cancel-btn"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </LiffContext.Provider>
  );
};
