import { useState, useEffect } from 'react';
import { LogOut, Vote, CheckCircle, User, ChevronRight, GraduationCap, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VotingBallot } from './VotingBallot';
import { VoteConfirmation } from './VoteConfirmation';
import { getElectionSettings } from '../../services/api';
import type { ElectionSettings } from '../../types';

type StudentView = 'home' | 'vote' | 'confirmation';

export function StudentPage() {
  const { authUser, setAuthUser, showToast } = useApp();
  const [view, setView] = useState<StudentView>('home');
  const [settings, setSettings] = useState<ElectionSettings | null>(null);

  const student = authUser?.type === 'student' ? authUser.data : null;

  useEffect(() => {
    getElectionSettings().then(setSettings);
  }, []);

  const handleLogout = () => {
    setAuthUser(null);
    showToast('info', 'Logged out successfully.');
  };

  if (!student) return null;

  if (view === 'vote') {
    return (
      <VotingBallot
        student={student}
        onBack={() => setView('home')}
        onComplete={() => setView('confirmation')}
      />
    );
  }

  if (view === 'confirmation') {
    return (
      <VoteConfirmation
        student={student}
        onDone={() => setView('home')}
      />
    );
  }

  const hasVoted = student.has_voted;
  const electionOpen = settings?.is_open ?? false;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#2b2378] text-white px-4 py-4 flex items-center gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-xl bg-[#f9c301]/20 border border-[#f9c301]/30 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src="/jrmsu-ccs-logo.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-tight truncate">JRMSU CCS Election</h1>
          <p className="text-white/60 text-xs">{settings?.school_year ?? '2025-2026'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all flex items-center gap-1.5 text-white/80 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-[#2b2378] to-[#1e1a5a] rounded-3xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium">Welcome back,</p>
              <p className="font-bold text-lg leading-tight">
                {student.first_name} {student.last_name}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 bg-white/10 rounded-2xl p-3">
            <InfoRow icon={<GraduationCap size={14} />} label="Student ID" value={student.student_id} />
            <InfoRow icon={<ChevronRight size={14} />} label="Course" value={student.course} />
            <InfoRow icon={<ChevronRight size={14} />} label="Year Level" value={student.year_level} />
          </div>
        </div>

        {/* Election Status */}
        {!electionOpen && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="font-bold text-orange-800 text-sm">Election is Closed</p>
              <p className="text-orange-600 text-xs mt-0.5">
                Voting is not currently available. Please check back later.
              </p>
            </div>
          </div>
        )}

        {/* Voting Status */}
        <div className={`rounded-2xl p-5 border-2 ${
          hasVoted
            ? 'bg-green-50 border-green-200'
            : electionOpen
            ? 'bg-[#2b2378]/5 border-[#2b2378]/20'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              hasVoted ? 'bg-green-500' : electionOpen ? 'bg-[#2b2378]' : 'bg-gray-300'
            }`}>
              {hasVoted ? (
                <CheckCircle size={24} className="text-white" />
              ) : (
                <Vote size={24} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">
                {hasVoted ? 'Vote Submitted' : 'Ready to Vote'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                {hasVoted
                  ? 'Your ballot has been successfully submitted. Thank you for participating!'
                  : electionOpen
                  ? 'Your vote matters. Cast your ballot for the candidates you believe in.'
                  : 'Voting is currently closed.'}
              </p>
            </div>
          </div>

          {!hasVoted && electionOpen && (
            <button
              onClick={() => setView('vote')}
              className="mt-4 w-full bg-[#2b2378] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#1e1a5a] active:scale-95 transition-all shadow-md hover:shadow-lg"
            >
              <Vote size={20} />
              Cast Your Vote
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Election Information</h3>
          <div className="flex flex-col gap-2">
            <InfoRow2 label="Election" value={settings?.title ?? 'CCS Student Org Election'} />
            <InfoRow2 label="School Year" value={settings?.school_year ?? '2025-2026'} />
            <InfoRow2 label="Period" value={`${settings?.start_date ?? ''} to ${settings?.end_date ?? ''}`} />
            <InfoRow2
              label="Status"
              value={electionOpen ? 'Open' : 'Closed'}
              valueColor={electionOpen ? 'text-green-600' : 'text-red-500'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/40 shrink-0">{icon}</span>
      <span className="text-white/60 text-xs shrink-0">{label}:</span>
      <span className="text-white text-xs font-semibold truncate">{value}</span>
    </div>
  );
}

function InfoRow2({
  label,
  value,
  valueColor = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}

import React from 'react';
