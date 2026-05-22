import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Flag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import {
  getPartylists,
  createPartylist,
  updatePartylist,
  deletePartylist,
} from '../../services/api';
import type { Partylist } from '../../types';

const defaultForm = () => ({ name: '', color: '#2b2378' });

export function PartylistManager() {
  const { showToast } = useApp();
  const [partylists, setPartylists] = useState<Partylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partylist | null>(null);
  const [deleteModal, setDeleteModal] = useState<Partylist | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const data = await getPartylists();
    setPartylists(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Partylist) => {
    setEditTarget(p);
    setForm({ name: p.name, color: p.color });
    setErrors({});
    setModalOpen(true);
  };

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Partylist name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updatePartylist(editTarget.id, {
          name: form.name.trim(),
          color: form.color,
        });
        setPartylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast('success', 'Partylist updated.');
      } else {
        const created = await createPartylist({ name: form.name.trim(), color: form.color });
        setPartylists((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        showToast('success', 'Partylist added.');
      }
      setModalOpen(false);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deletePartylist(deleteModal.id);
      setPartylists((prev) => prev.filter((p) => p.id !== deleteModal.id));
      showToast('success', 'Partylist removed.');
      setDeleteModal(null);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Error deleting.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Partylists</h2>
          <p className="text-sm text-gray-500">
            {partylists.length} partylist{partylists.length !== 1 ? 's' : ''} — select from these when adding candidates
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Partylist
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Color</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Partylist Name</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partylists.map((pl) => (
                <tr
                  key={pl.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg border border-gray-200 shrink-0"
                        style={{ backgroundColor: pl.color }}
                      />
                      <span className="text-xs text-gray-400 font-mono">{pl.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: pl.color }}
                    >
                      <Flag size={10} />
                      {pl.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(pl)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 active:scale-90 transition-all text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteModal(pl)}
                        className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition-all text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {partylists.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">
                    <Flag size={36} className="mx-auto mb-2 opacity-40" />
                    <p>No partylists yet. Add your first partylist.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Partylist' : 'Add Partylist'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Update' : 'Add Partylist'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Partylist Name"
            placeholder="e.g. TechForward Alliance"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Party Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className="w-14 h-11 rounded-xl border-2 border-gray-200 p-1 cursor-pointer"
              />
              <div
                className="flex-1 h-11 rounded-xl flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: form.color }}
              >
                <Flag size={12} className="mr-1.5" />
                {form.name || 'Preview'}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Remove Partylist"
        message={`Remove "${deleteModal?.name}"? Candidates already assigned to this partylist will keep their party name, but it will no longer appear in the dropdown.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}
