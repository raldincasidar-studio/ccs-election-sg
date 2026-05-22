import { useEffect, useState } from 'react';
import { Save, Settings, ToggleLeft, ToggleRight, CalendarRange } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { getElectionSettings, updateElectionSettings } from '../../services/api';
import type { ElectionSettings } from '../../types';

export function SettingsPage() {
  const { showToast } = useApp();
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
