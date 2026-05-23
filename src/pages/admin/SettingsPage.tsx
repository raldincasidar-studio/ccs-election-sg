import { useEffect, useState } from 'react';
import { Save, Settings, ToggleLeft, ToggleRight, CalendarRange, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { getElectionSettings, updateElectionSettings, resetVotes } from '../../services/api';
import type { ElectionSettings } from '../../types';

export function SettingsPage() {
  const { showToast } = useApp();
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    getElectionSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateElectionSettings(settings);
      setSettings(updated);
      showToast('success', 'Settings saved successfully.');
    } catch {
      showToast('error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetVotes();
      showToast('success', 'All votes and student records have been reset.');
      setShowResetConfirm(false);
      setResetConfirmText('');
    } catch {
      showToast('error', 'Failed to reset votes. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Election Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-[#2b2378]" />
          <h3 className="font-bold text-gray-900">Election Information</h3>
        </div>
        <Input
          label="Election Title"
          value={settings.title}
          onChange={(e) => setSettings((p) => p && ({ ...p, title: e.target.value }))}
        />
        <Input
          label="School Year"
          placeholder="e.g. 2025-2026"
          value={settings.school_year}
          onChange={(e) => setSettings((p) => p && ({ ...p, school_year: e.target.value }))}
        />
      </div>

      {/* Election Period */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={18} className="text-[#2b2378]" />
          <h3 className="font-bold text-gray-900">Election Period</h3>
        </div>
        <Input
          label="Start Date"
          type="date"
          value={settings.start_date}
          onChange={(e) => setSettings((p) => p && ({ ...p, start_date: e.target.value }))}
        />
        <Input
          label="End Date"
          type="date"
          value={settings.end_date}
          onChange={(e) => setSettings((p) => p && ({ ...p, end_date: e.target.value }))}
        />
      </div>

      {/* Election Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">Election Status</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {settings.is_open
                ? 'Election is currently OPEN. Students can vote.'
                : 'Election is CLOSED. Voting is disabled.'}
            </p>
          </div>
          <button
            onClick={() => setSettings((p) => p && ({ ...p, is_open: !p.is_open }))}
            className="active:scale-90 transition-transform"
          >
            {settings.is_open ? (
              <ToggleRight size={44} className="text-[#2b2378]" />
            ) : (
              <ToggleLeft size={44} className="text-gray-300" />
            )}
          </button>
        </div>
        <div
          className={`mt-3 px-3 py-2 rounded-xl text-sm font-semibold text-center ${
            settings.is_open
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-500 border border-gray-200'
          }`}
        >
          {settings.is_open ? 'Election is OPEN' : 'Election is CLOSED'}
        </div>
      </div>

      <Button
        leftIcon={<Save size={16} />}
        onClick={handleSave}
        loading={saving}
        size="lg"
        fullWidth
      >
        Save Settings
      </Button>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-bold text-red-600">Danger Zone</h3>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Reset All Votes</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Clears every candidate's vote count to zero and marks all students as not-voted.
              This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => { setShowResetConfirm(true); setResetConfirmText(''); }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold
              hover:bg-red-50 active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* ── Reset Confirm Dialog ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">

            {/* Icon + Title */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                <RotateCcw size={28} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reset All Votes?</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  This will permanently clear every candidate's vote count and reset
                  all students' voting status. <strong>This action cannot be undone.</strong>
                </p>
              </div>
            </div>

            {/* What will happen */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col gap-1.5">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">What will be reset:</p>
              <ul className="text-xs text-red-700 flex flex-col gap-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  All candidate vote counts → 0
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  All students marked as "has not voted"
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  All voted position records cleared
                </li>
              </ul>
            </div>

            {/* Type to confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Type <span className="font-mono font-bold text-red-600">RESET</span> to confirm
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-mono font-semibold
                  focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600
                  hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirmText !== 'RESET' || resetting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold
                  hover:bg-red-700 active:scale-95 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    Reset All Votes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
