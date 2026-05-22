import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Globe,
  BookOpen,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Card';
import { useApp } from '../../context/AppContext';
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getPrograms,
} from '../../services/api';
import type { Position, VoterEligibility, YearLevel, Program } from '../../types';

const YEAR_LEVELS: YearLevel[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const ELIGIBILITY_OPTIONS: { value: VoterEligibility; label: string }[] = [
  { value: 'all', label: 'All Students' },
  { value: 'by_course', label: 'By Course/Program' },
  { value: 'by_year_level', label: 'By Year Level' },
  { value: 'by_course_and_year', label: 'By Course and Year Level' },
];

const eligibilityIcon = (e: VoterEligibility) => {
  switch (e) {
    case 'all': return <Globe size={14} />;
    case 'by_course': return <BookOpen size={14} />;
    case 'by_year_level': return <GraduationCap size={14} />;
    case 'by_course_and_year': return <Layers size={14} />;
  }
};

const eligibilityLabel = (e: VoterEligibility) =>
  ELIGIBILITY_OPTIONS.find((o) => o.value === e)?.label ?? e;

const defaultForm = (): Omit<Position, 'id'> => ({
  title: '',
  order: 1,
  max_votes: 1,
  voter_eligibility: 'all',
  eligible_courses: [],
  eligible_year_levels: [],
  is_active: true,
});

export function PositionsManager() {
  const { showToast } = useApp();
  const [positions, setPositions] = useState<Position[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Position | null>(null);
  const [editTarget, setEditTarget] = useState<Position | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [data, progs] = await Promise.all([getPositions(), getPrograms()]);
    setPositions(data);
    setPrograms(progs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm());
    setModalOpen(true);
  };

  const openEdit = (pos: Position) => {
    setEditTarget(pos);
    setForm({
      title: pos.title,
      order: pos.order,
      max_votes: pos.max_votes,
      voter_eligibility: pos.voter_eligibility,
      eligible_courses: [...pos.eligible_courses],
      eligible_year_levels: [...pos.eligible_year_levels],
      is_active: pos.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('error', 'Position title is required.'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updatePosition(editTarget.id, form);
        setPositions((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        showToast('success', 'Position updated.');
      } else {
        const created = await createPosition(form);
        setPositions((p) => [...p, created].sort((a, b) => a.order - b.order));
        showToast('success', 'Position created.');
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
      await deletePosition(deleteModal.id);
      setPositions((p) => p.filter((x) => x.id !== deleteModal.id));
      showToast('success', 'Position deleted.');
      setDeleteModal(null);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Error deleting.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleCourse = (name: string) => {
    setForm((p) => ({
      ...p,
      eligible_courses: p.eligible_courses.includes(name)
        ? p.eligible_courses.filter((x) => x !== name)
        : [...p.eligible_courses, name],
    }));
  };

  const toggleYear = (y: YearLevel) => {
    setForm((p) => ({
      ...p,
      eligible_year_levels: p.eligible_year_levels.includes(y)
        ? p.eligible_year_levels.filter((x) => x !== y)
        : [...p.eligible_year_levels, y],
    }));
  };

  const changeOrder = async (pos: Position, dir: 'up' | 'down') => {
    const sorted = [...positions].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === pos.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapPos = sorted[swapIdx];
    await updatePosition(pos.id, { order: swapPos.order });
    await updatePosition(swapPos.id, { order: pos.order });
    load();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Positions</h2>
          <p className="text-sm text-gray-500">{positions.length} positions configured</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Position
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {positions.map((pos, idx) => (
          <div
            key={pos.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            {/* Order controls */}
            <div className="hidden sm:flex flex-col items-center gap-0.5">
              <button
                onClick={() => changeOrder(pos, 'up')}
                disabled={idx === 0}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 active:scale-90 transition-all"
              >
                <ChevronUp size={16} className="text-gray-500" />
              </button>
              <span className="text-xs font-bold text-gray-400 w-6 text-center">{pos.order}</span>
              <button
                onClick={() => changeOrder(pos, 'down')}
                disabled={idx === positions.length - 1}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 active:scale-90 transition-all"
              >
                <ChevronDown size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{pos.title}</h3>
                {pos.is_active ? (
                  <Badge color="#16a34a"><CheckCircle size={11} /> Active</Badge>
                ) : (
                  <Badge color="#9ca3af"><XCircle size={11} /> Inactive</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge color="#2b2378">
                  <Users size={11} /> Max {pos.max_votes} vote{pos.max_votes > 1 ? 's' : ''}
                </Badge>
                <Badge color="#7c3aed">
                  {eligibilityIcon(pos.voter_eligibility)}
                  {eligibilityLabel(pos.voter_eligibility)}
                </Badge>
                {pos.eligible_courses.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {pos.eligible_courses.join(', ')}
                  </span>
                )}
                {pos.eligible_year_levels.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {pos.eligible_year_levels.join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openEdit(pos)}
                className="p-2 rounded-xl hover:bg-blue-50 active:scale-90 transition-all text-blue-600"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteModal(pos)}
                className="p-2 rounded-xl hover:bg-red-50 active:scale-90 transition-all text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {positions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Layers size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No positions yet. Add your first position.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Position' : 'Add Position'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Position Title"
            placeholder="e.g. President"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Display Order"
              type="number"
              min={1}
              value={form.order}
              onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
            />
            <Input
              label="Max Votes (per student)"
              type="number"
              min={1}
              value={form.max_votes}
              onChange={(e) => setForm((p) => ({ ...p, max_votes: Number(e.target.value) }))}
              hint="How many candidates can a student select"
            />
          </div>

          <Select
            label="Voter Eligibility"
            value={form.voter_eligibility}
            onChange={(e) =>
              setForm((p) => ({ ...p, voter_eligibility: e.target.value as VoterEligibility }))
            }
            options={ELIGIBILITY_OPTIONS}
          />

          {(form.voter_eligibility === 'by_course' || form.voter_eligibility === 'by_course_and_year') && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Eligible Courses</p>
              <div className="flex flex-col gap-2">
                {programs.map((prog) => (
                  <label key={prog.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.eligible_courses.includes(prog.name)}
                      onChange={() => toggleCourse(prog.name)}
                      className="w-4 h-4 accent-[#2b2378] rounded"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold text-[#2b2378] mr-1">{prog.code}</span>
                      {prog.name}
                    </span>
                  </label>
                ))}
                {programs.length === 0 && (
                  <p className="text-xs text-gray-400">No programs found. Add programs in the Programs module.</p>
                )}
              </div>
            </div>
          )}

          {(form.voter_eligibility === 'by_year_level' || form.voter_eligibility === 'by_course_and_year') && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Eligible Year Levels</p>
              <div className="flex flex-col gap-2">
                {YEAR_LEVELS.map((y) => (
                  <label key={y} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.eligible_year_levels.includes(y)}
                      onChange={() => toggleYear(y)}
                      className="w-4 h-4 accent-[#2b2378] rounded"
                    />
                    <span className="text-sm text-gray-700">{y}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-[#2b2378] rounded"
            />
            <span className="text-sm font-semibold text-gray-700">Position is Active</span>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Position"
        message={`Are you sure you want to delete "${deleteModal?.title}"? All candidates in this position will also be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
