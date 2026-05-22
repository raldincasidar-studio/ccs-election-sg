import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Users, Search, ImageIcon, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select, TextArea } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Card';
import { useApp } from '../../context/AppContext';
import {
  getPositions,
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getPartylists,
} from '../../services/api';
import type { Position, Candidate, Partylist } from '../../types';

// ─── Eligibility Chip Configs ─────────────────────────────────────────────────

const COURSE_CHIP = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
const YEAR_CHIP   = 'bg-violet-50 text-violet-700 border border-violet-200';
const ALL_CHIP    = 'bg-emerald-50 text-emerald-700 border border-emerald-200';

function EligibilityChips({ position, size = 'sm' }: { position: Position; size?: 'sm' | 'xs' }) {
  const base = size === 'xs'
    ? 'text-[9px] font-bold px-1.5 py-0.5 rounded-full'
    : 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full';

  if (position.voter_eligibility === 'all') {
    return (
      <div className="flex flex-wrap gap-1">
        <span className={`${base} ${ALL_CHIP}`}>All Voters</span>
      </div>
    );
  }

  const showCourses = position.voter_eligibility === 'by_course' || position.voter_eligibility === 'by_course_and_year';
  const showYears   = position.voter_eligibility === 'by_year_level' || position.voter_eligibility === 'by_course_and_year';

  return (
    <div className="flex flex-wrap gap-1">
      {showCourses && position.eligible_courses.map((c) => (
        <span key={c} className={`${base} ${COURSE_CHIP}`}>{c}</span>
      ))}
      {showYears && position.eligible_year_levels.map((y) => (
        <span key={y} className={`${base} ${YEAR_CHIP}`}>{y}</span>
      ))}
    </div>
  );
}

// ─── Custom Position Select ───────────────────────────────────────────────────

interface PositionSelectProps {
  positions: Position[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  error?: string;
}

function PositionSelect({ positions, value, onChange, required, error }: PositionSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = positions.find((p) => p.id === value) ?? null;

  const filtered = positions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.eligible_courses.some((c) => c.toLowerCase().includes(q)) ||
      p.eligible_year_levels.some((y) => y.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 60);
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-sm font-semibold text-gray-700">
        Position{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium text-left transition-all duration-150 flex items-center gap-2
          focus:outline-none focus:ring-2 focus:ring-[#2b2378]/30
          ${error ? 'border-red-400' : open ? 'border-[#2b2378]' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <span className="flex-1 min-w-0">
          {selected ? (
            <span className="flex flex-col gap-0.5">
              <span className="text-gray-800 font-semibold text-sm">{selected.title}</span>
              <EligibilityChips position={selected} size="xs" />
            </span>
          ) : (
            <span className="text-gray-400 font-normal">-- Select Position --</span>
          )}
        </span>
        <span className="shrink-0 flex items-center gap-1">
          {selected && (
            <span
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              onMouseDown={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl border-2 border-[#2b2378]/20 shadow-xl overflow-hidden"
          style={{ top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : undefined,
                   left: containerRef.current ? containerRef.current.getBoundingClientRect().left : undefined,
                   width: containerRef.current ? containerRef.current.getBoundingClientRect().width : undefined,
                   position: 'fixed',
                   maxHeight: '280px',
                   display: 'flex',
                   flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100 shrink-0">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search positions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#2b2378] focus:ring-1 focus:ring-[#2b2378]/20 transition-all"
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No positions match your search.</div>
            ) : (
              filtered.map((p) => {
                const isSelected = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-100 border-b border-gray-50 last:border-0
                      ${isSelected
                        ? 'bg-[#2b2378]/5 hover:bg-[#2b2378]/10'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight mb-1 ${isSelected ? 'text-[#2b2378]' : 'text-gray-800'}`}>
                        {p.title}
                      </p>
                      <EligibilityChips position={p} size="xs" />
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-[#2b2378] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ─── Eligibility chips used in list view ──────────────────────────────────────

function EligibilityChipsList({ position }: { position: Position }) {
  if (position.voter_eligibility === 'all') return null;
  const showCourses = position.voter_eligibility === 'by_course' || position.voter_eligibility === 'by_course_and_year';
  const showYears   = position.voter_eligibility === 'by_year_level' || position.voter_eligibility === 'by_course_and_year';
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {showCourses && position.eligible_courses.map((c) => (
        <span key={c} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${COURSE_CHIP}`}>{c}</span>
      ))}
      {showYears && position.eligible_year_levels.map((y) => (
        <span key={y} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${YEAR_CHIP}`}>{y}</span>
      ))}
    </div>
  );
}

// ─── Form default ─────────────────────────────────────────────────────────────

const defaultForm = (position_id = ''): Omit<Candidate, 'id' | 'vote_count'> => ({
  position_id,
  partylist_id: '',
  name: '',
  party: '',
  party_color: '#2b2378',
  description: '',
  candidate_photo: '',
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function CandidatesManager() {
  const { showToast } = useApp();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [partylists, setPartylists] = useState<Partylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Candidate | null>(null);
  const [editTarget, setEditTarget] = useState<Candidate | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [photoPreview, setPhotoPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getPositions(), getCandidates(), getPartylists()]).then(([p, c, pl]) => {
      setPositions(p);
      setCandidates(c);
      setPartylists(pl);
      setLoading(false);
    });
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm(filterPosition !== 'all' ? filterPosition : ''));
    setPhotoPreview('');
    setModalOpen(true);
  };

  const openEdit = (c: Candidate) => {
    setEditTarget(c);
    setForm({
      position_id: c.position_id,
      partylist_id: c.partylist_id ?? '',
      name: c.name,
      party: c.party,
      party_color: c.party_color,
      description: c.description,
      candidate_photo: c.candidate_photo,
    });
    setPhotoPreview(c.candidate_photo);
    setModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setPhotoPreview(url);
      setForm((p) => ({ ...p, candidate_photo: url }));
    };
    reader.readAsDataURL(file);
  };

  const handlePartylistChange = (partylist_id: string) => {
    if (!partylist_id) {
      setForm((p) => ({ ...p, partylist_id: '', party: '', party_color: '#2b2378' }));
      return;
    }
    const pl = partylists.find((x) => x.id === partylist_id);
    if (pl) {
      setForm((p) => ({ ...p, partylist_id: pl.id, party: pl.name, party_color: pl.color }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Candidate name is required.'); return; }
    if (!form.position_id) { showToast('error', 'Please select a position.'); return; }
    if (!form.partylist_id) { showToast('error', 'Please select a partylist.'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateCandidate(editTarget.id, form);
        setCandidates((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        showToast('success', 'Candidate updated.');
      } else {
        const created = await createCandidate(form);
        setCandidates((p) => [...p, created]);
        showToast('success', 'Candidate added.');
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
      await deleteCandidate(deleteModal.id);
      setCandidates((p) => p.filter((x) => x.id !== deleteModal.id));
      showToast('success', 'Candidate removed.');
      setDeleteModal(null);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Error deleting.');
    } finally {
      setDeleting(false);
    }
  };

  const getPositionTitle = (id: string) =>
    positions.find((p) => p.id === id)?.title ?? 'Unknown';

  const filtered = candidates.filter((c) => {
    const matchPos = filterPosition === 'all' || c.position_id === filterPosition;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.party.toLowerCase().includes(q);
    return matchPos && matchSearch;
  });

  const grouped = positions
    .filter((p) => filterPosition === 'all' || p.id === filterPosition)
    .map((p) => ({
      position: p,
      candidates: filtered.filter((c) => c.position_id === p.id),
    }))
    .filter((g) => g.candidates.length > 0 || filterPosition !== 'all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Candidates</h2>
          <p className="text-sm text-gray-500">{candidates.length} candidates registered</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div className="min-w-48">
          <Select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            options={[
              { value: 'all', label: 'All Positions' },
              ...positions.map((p) => ({ value: p.id, label: p.title })),
            ]}
          />
        </div>
      </div>

      {/* Candidate List by Position */}
      <div className="flex flex-col gap-5">
        {filterPosition === 'all' ? (
          grouped.map(({ position, candidates: posCands }) => (
            <div key={position.id}>
              <div className="mb-2">
                <h3 className="font-bold text-[#2b2378] text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f9c301] inline-block shrink-0" />
                  {position.title}
                  <span className="text-gray-400 font-normal">({posCands.length})</span>
                </h3>
                <EligibilityChipsList position={position} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {posCands.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    positionTitle={position.title}
                    onEdit={openEdit}
                    onDelete={setDeleteModal}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                positionTitle={getPositionTitle(c.position_id)}
                onEdit={openEdit}
                onDelete={setDeleteModal}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No candidates found.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Candidate' : 'Add Candidate'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Update' : 'Add Candidate'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-[#2b2378] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-gray-300" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Candidate Photo</p>
              <p className="text-xs text-gray-400 mb-2">Click to upload photo</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                Choose Photo
              </Button>
            </div>
          </div>

          <Input
            label="Full Name"
            placeholder="e.g. Juan dela Cruz"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />

          {/* Custom position dropdown */}
          <PositionSelect
            positions={positions}
            value={form.position_id}
            onChange={(id) => setForm((p) => ({ ...p, position_id: id }))}
            required
          />

          <Select
            label="Partylist"
            value={form.partylist_id ?? ''}
            onChange={(e) => handlePartylistChange(e.target.value)}
            options={[
              { value: '', label: '-- Select Partylist --' },
              ...partylists.map((pl) => ({ value: pl.id, label: pl.name })),
            ]}
            required
          />

          {form.partylist_id && (() => {
            const pl = partylists.find((x) => x.id === form.partylist_id);
            return pl ? (
              <div className="flex items-center gap-2 -mt-2 px-1">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pl.color }} />
                <span className="text-xs text-gray-500">
                  Party color will be set to <strong>{pl.color}</strong>
                </span>
              </div>
            ) : null;
          })()}

          <TextArea
            label="Description / Platform"
            placeholder="Brief description of the candidate's platform and qualifications..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message={`Remove "${deleteModal?.name}" from the election? This cannot be undone.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  positionTitle,
  onEdit,
  onDelete,
}: {
  candidate: Candidate;
  positionTitle: string;
  onEdit: (c: Candidate) => void;
  onDelete: (c: Candidate) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
      <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
        {candidate.candidate_photo ? (
          <img src={candidate.candidate_photo} alt={candidate.name} className="w-full h-full object-cover" />
        ) : (
          <Users size={22} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{candidate.name}</p>
        <p className="text-xs text-gray-500 truncate">{positionTitle}</p>
        <div className="mt-1.5">
          <Badge color={candidate.party_color}>{candidate.party}</Badge>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-medium">
          {candidate.vote_count} vote{candidate.vote_count !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => onEdit(candidate)}
          className="p-1.5 rounded-lg hover:bg-blue-50 active:scale-90 transition-all text-blue-600"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(candidate)}
          className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition-all text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
