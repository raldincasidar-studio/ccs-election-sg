import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Card';
import { useApp } from '../../context/AppContext';
import {
  getStudents,
  createStudentAdmin,
  updateStudent,
  deleteStudent,
  getPrograms,
} from '../../services/api';
import type { Pagination } from '../../services/api';
import type { Student, Gender, YearLevel, Program } from '../../types';

const YEAR_LEVELS: YearLevel[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const PAGE_LIMIT = 20;

interface Filters {
  page: number;
  search: string;
  year: string;
  course: string;
  voted: string;
}

const defaultForm = (firstCourse: string) => ({
  student_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  year_level: '1st Year' as YearLevel,
  course: firstCourse,
  gender: 'Male' as Gender,
  birth_date: '',
  school_year: '2025-2026',
  password: 'student123',
});

export function StudentsManager() {
  const { showToast } = useApp();
  const [students, setStudents]   = useState<Student[]>([]);
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_LIMIT, total: 0, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState<Filters>({ page: 1, search: '', year: 'all', course: 'all', voted: 'all' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteModal, setDeleteModal] = useState<Student | null>(null);
  const [form, setForm]           = useState(defaultForm(''));
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const [result, progs] = await Promise.all([
        getStudents({
          page:       f.page,
          limit:      PAGE_LIMIT,
          search:     f.search || undefined,
          year_level: f.year  !== 'all' ? f.year  : undefined,
          course:     f.course !== 'all' ? f.course : undefined,
          voted:      f.voted !== 'all' ? f.voted : undefined,
        }),
        programs.length === 0 ? getPrograms() : Promise.resolve(programs),
      ]);
      setStudents(result.data);
      setPagination(result.pagination);
      if (programs.length === 0) setPrograms(progs as Program[]);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  const setFilter = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm(programs[0]?.name ?? ''));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({
      student_id:  s.student_id,
      first_name:  s.first_name,
      middle_name: s.middle_name,
      last_name:   s.last_name,
      year_level:  s.year_level,
      course:      s.course,
      gender:      s.gender,
      birth_date:  s.birth_date,
      school_year: s.school_year,
      password:    '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.student_id.trim()) errs.student_id = 'Required';
    else if (!/^\d{2}-[A-Z]-\d{5}$/.test(form.student_id.trim()))
      errs.student_id = 'Format: 23-A-12345';
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim())  errs.last_name  = 'Required';
    if (!form.birth_date)        errs.birth_date  = 'Required';
    if (!editTarget && !form.password) errs.password = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Partial<Student> = {
        student_id:  form.student_id.trim(),
        first_name:  form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name:   form.last_name.trim(),
        year_level:  form.year_level,
        course:      form.course,
        gender:      form.gender,
        birth_date:  form.birth_date,
        school_year: form.school_year,
      };
      if (form.password) payload.password = form.password;

      if (editTarget) {
        const updated = await updateStudent(editTarget.id, payload);
        setStudents((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        showToast('success', 'Student updated.');
      } else {
        await createStudentAdmin({
          ...payload,
          student_id: form.student_id.trim(),
          first_name: form.first_name.trim(),
          middle_name: form.middle_name.trim(),
          last_name: form.last_name.trim(),
          year_level: form.year_level,
          course: form.course,
          gender: form.gender,
          birth_date: form.birth_date,
          school_year: form.school_year,
          password: form.password,
        });
        showToast('success', 'Student added.');
        load(filters);
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
      await deleteStudent(deleteModal.id);
      showToast('success', 'Student removed.');
      setDeleteModal(null);
      load(filters);
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Error deleting.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{pagination.total} registered students</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search students..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          value={filters.year}
          onChange={(e) => setFilter('year', e.target.value)}
          options={[
            { value: 'all', label: 'All Year Levels' },
            ...YEAR_LEVELS.map((y) => ({ value: y, label: y })),
          ]}
        />
        <Select
          value={filters.course}
          onChange={(e) => setFilter('course', e.target.value)}
          options={[
            { value: 'all', label: 'All Courses' },
            ...programs.map((p) => ({ value: p.name, label: `${p.code} — ${p.name}` })),
          ]}
        />
        <Select
          value={filters.voted}
          onChange={(e) => setFilter('voted', e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'voted', label: 'Voted' },
            { value: 'not_voted', label: 'Not Yet Voted' },
          ]}
        />
      </div>

      {/* Stats strip */}
      <div className="flex gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Filter size={14} />
          {pagination.total} students
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Course</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Year</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">
                      {s.student_id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {s.last_name}, {s.first_name}{' '}
                        {s.middle_name ? s.middle_name[0] + '.' : ''}
                      </p>
                      <p className="text-xs text-gray-400">{s.gender}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <span className="text-xs">{s.course}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">
                      {s.year_level}
                    </td>
                    <td className="px-4 py-3">
                      {s.has_voted ? (
                        <Badge color="#16a34a"><CheckCircle size={11} /> Voted</Badge>
                      ) : (
                        <Badge color="#d97706"><Clock size={11} /> Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 active:scale-90 transition-all text-blue-600"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal(s)}
                          className="p-1.5 rounded-lg hover:bg-red-50 active:scale-90 transition-all text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <GraduationCap size={36} className="mx-auto mb-2 opacity-40" />
                      <p>No students found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} &bull; {pagination.total} total
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('page', pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const start = Math.max(1, Math.min(pagination.page - 2, pagination.pages - 4));
                const p = start + i;
                return (
                  <button
                    key={p}
                    onClick={() => setFilter('page', p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      p === pagination.page
                        ? 'bg-[#2b2378] text-white'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setFilter('page', pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Student' : 'Add Student'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editTarget ? 'Update' : 'Add Student'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Student ID"
            placeholder="23-A-12345"
            value={form.student_id}
            onChange={(e) => set('student_id', e.target.value)}
            error={errors.student_id}
            disabled={!!editTarget}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              error={errors.first_name}
              required
            />
            <Input
              label="Middle Name"
              value={form.middle_name}
              onChange={(e) => set('middle_name', e.target.value)}
            />
          </div>
          <Input
            label="Last Name"
            value={form.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            error={errors.last_name}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Year Level"
              value={form.year_level}
              onChange={(e) => set('year_level', e.target.value)}
              options={YEAR_LEVELS.map((y) => ({ value: y, label: y }))}
            />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              options={GENDERS.map((g) => ({ value: g, label: g }))}
            />
          </div>
          <Select
            label="Course / Program"
            value={form.course}
            onChange={(e) => set('course', e.target.value)}
            options={programs.map((p) => ({ value: p.name, label: `${p.code} — ${p.name}` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Birth Date"
              type="date"
              value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)}
              error={errors.birth_date}
              required
            />
            <Input
              label="School Year"
              value={form.school_year}
              onChange={(e) => set('school_year', e.target.value)}
            />
          </div>
          <Input
            label="Password"
            type="password"
            hint={editTarget ? 'Leave blank to keep current password' : undefined}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            required={!editTarget}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Remove Student"
        message={`Remove student "${deleteModal?.first_name} ${deleteModal?.last_name}" (${deleteModal?.student_id})? This cannot be undone.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}
