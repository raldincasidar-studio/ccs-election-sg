import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../../services/api';
import type { Program } from '../../types';

const defaultForm = () => ({ code: '', name: '' });

export function ProgramsManager() {
  const { showToast } = useApp();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);
  const [deleteModal, setDeleteModal] = useState<Program | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const data = await getPrograms();
    setPrograms(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditTarget(p);
    setForm({ code: p.code, name: p.name });
    setErrors({});
    setModalOpen(true);
  };

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = 'Code is required.';
    else if (form.code.trim().length > 20) errs.code = 'Max 20 characters.';
    if (!form.name.trim()) errs.name = 'Program name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateProgram(editTarget.id, {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
        });
        setPrograms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast('success', 'Program updated.');
      } else {
        const created = await createProgram({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
        });
        setPrograms((prev) => [...prev, created]);
        showToast('success', 'Program added.');
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
      await deleteProgram(deleteModal.id);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteModal.id));
      showToast('success', 'Program removed.');
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
          <h2 className="text-lg font-bold text-gray-900">Programs / Courses</h2>
          <p className="text-sm text-gray-500">
            {programs.length} program{programs.length !== 1 ? 's' : ''} — used across student registration, dropdowns, and position eligibility
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Program
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Program Name</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog) => (
                <tr
                  key={prog.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#2b2378]/10 text-[#2b2378] font-bold text-xs font-mono">
                      {prog.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{prog.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(prog)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 active:scale-90 transition-all text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteModal(prog)}
                        className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition-all text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
                    <p>No programs yet. Add your first program.</p>
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
        title={editTarget ? 'Edit Program' : 'Add Program'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Update' : 'Add Program'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Program Code"
            placeholder="e.g. BSCS"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            error={errors.code}
            hint="Short abbreviation (will be uppercased)"
            required
          />
          <Input
            label="Program Name"
            placeholder="e.g. BS Computer Science"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            hint="Full program name shown in dropdowns"
            required
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Remove Program"
        message={`Remove "${deleteModal?.name}" (${deleteModal?.code})? Students already assigned to this program will not be affected, but it will no longer appear in dropdowns.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}
