import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Shield, GraduationCap } from 'lucide-react';

type AuthTab = 'student-login' | 'student-register' | 'admin-login';

export function AuthPage() {
  const [tab, setTab] = useState<AuthTab>('student-login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2b2378] via-[#1e1a5a] to-[#0f0d30] flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white/10 border-2 border-[#f9c301]/40 mb-4 overflow-hidden shadow-lg">
          <img
            src="/jrmsu-ccs-logo.png"
            alt="JRMSU CCS Logo"
            className="w-20 h-20 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f9c301" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`;
            }}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-center leading-tight tracking-tight">
          JRMSU CCS
        </h1>
        <h2 className="text-lg sm:text-xl font-semibold text-[#f9c301] text-center mt-0.5">
          Student Org Election
        </h2>
        <p className="text-white/50 text-xs mt-2 font-medium">Academic Year 2025–2026</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center px-4 mb-4">
        <div className="bg-white/10 rounded-2xl p-1 flex gap-1 w-full max-w-md">
          <TabBtn
            active={tab === 'student-login' || tab === 'student-register'}
            onClick={() => setTab('student-login')}
            icon={<GraduationCap size={16} />}
            label="Student"
          />
          <TabBtn
            active={tab === 'admin-login'}
            onClick={() => setTab('admin-login')}
            icon={<Shield size={16} />}
            label="Admin"
          />
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4 pb-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          {tab === 'admin-login' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#2b2378]/10 rounded-xl">
                  <Shield size={20} className="text-[#2b2378]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2b2378] text-lg leading-none">Admin Login</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Control Panel Access</p>
                </div>
              </div>
              <LoginForm mode="admin" />
              <DemoBox
                items={[
                  { label: 'Username', value: 'admin' },
                  { label: 'Password', value: 'admin123' },
                ]}
              />
            </div>
          )}

          {(tab === 'student-login' || tab === 'student-register') && (
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
              {/* Sub-tabs */}
              <div className="flex border-b border-gray-100">
                <SubTab
                  active={tab === 'student-login'}
                  onClick={() => setTab('student-login')}
                  label="Sign In"
                />
                <SubTab
                  active={tab === 'student-register'}
                  onClick={() => setTab('student-register')}
                  label="Sign Up"
                />
              </div>
              <div className="p-6 sm:p-8">
                {tab === 'student-login' ? (
                  <>
                    <LoginForm mode="student" />
                    <DemoBox
                      items={[
                        { label: 'Student ID', value: '23-A-12345' },
                        { label: 'Password', value: 'student123' },
                      ]}
                    />
                  </>
                ) : (
                  <RegisterForm onSuccess={() => setTab('student-login')} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-white/30 text-xs">
          Jose Rizal Memorial State University &bull; College of Computer Studies
        </p>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
        active
          ? 'bg-white text-[#2b2378] shadow-sm'
          : 'text-white/70 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SubTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 text-sm font-bold transition-all duration-200 border-b-2 active:scale-95 ${
        active
          ? 'border-[#2b2378] text-[#2b2378]'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

function DemoBox({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mt-5 p-3 bg-[#f9c301]/10 border border-[#f9c301]/30 rounded-xl">
      <p className="text-xs font-bold text-[#2b2378] mb-2">Demo Account</p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{item.label}:</span>
            <span className="text-xs font-mono font-bold text-[#2b2378] bg-white px-2 py-0.5 rounded-lg">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Need to import React for JSX
import React from 'react';
