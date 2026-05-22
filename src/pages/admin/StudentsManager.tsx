import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  GraduationCap,
  Filter,
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
} from '../../services/api';
import type { Student, Course, Gender, YearLevel } from '../../types';

const COURSES: Course[] = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Information Systems',
  'Associate in Computer Technology',
];
const YEAR_LEVELS: YearLevel[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

const defaultForm = () => ({
  student_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  year_level: '1st Year' as YearLevel,
  course: 'BS Computer Science' as Course,
  gender: 'Male' as Gender,
  birth_date: '',
  school_year: '2025-2026',
  password: 'student123',
});

export function StudentsManager() {
  const { showToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterVoted, setFilterVoted] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteModal, setDeleteModal] = useState<Student | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    const data = await getStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.student_id.toLowerCase().includes(q) ||
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q);
    const matchYear = filterYear === 'all' || s.year_level === filterYear;
    const matchCourse = filterCourse === 'all' || s.course === filterCourse;
    const matchVoted =
      filterVoted === 'all' ||
      (filterVoted === 'voted' && s.has_voted) ||
      (filterVoted === 'not_voted' && !s.has_voted);
    return matchSearch && matchYear && matchCourse && matchVoted;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({
      student_id: s.student_id,
      first_name: s.first_name,
      middle_name: s.middle_name,
      last_name: s.last_name,
      year_level: s.year_level,
      course: s.course,
      gender: s.gender,
      birth_date: s.birth_date,
      school_year: s.school_year,
      password: s.password,
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
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!form.birth_date) errs.birth_date = 'Required';
    if (!form.password) errs.password = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateStudent(editTarget.id, {
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
        setStudents((p) => p.map((x) => (x.id === updated.id ? updated : x)));
        showToast('success', 'Student updated.');
      } else {
        const created = await createStudentAdmin({
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
        setStudents((p) => [...p, created]);
        showToast('success', 'Student added.');
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
      setStudents((p) => p.filter((x) => x.id !== deleteModal.id));
      showToast('success', 'Student removed.');
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
          <h2 className="text-lg font-bold text-gray-900">Students</h2>
          <p className="text-sm text-gray-500">{students.length} registered students</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          options={[
            { value: 'all', label: 'All Year Levels' },
            ...YEAR_LEVELS.map((y) => ({ value: y, label: y })),
          ]}
        />
        <Select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          options={[
            { value: 'all', label: 'All Courses' },
            ...COURSES.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          value={filterVoted}
          onChange={(e) => setFilterVoted(e.target.value)}
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
          Showing {filtered.length} of {students.length}
        </span>
        <span className="text-green-600 font-medium flex items-center gap-1">
          <CheckCircle size={14} />
          {students.filter((s) => s.has_voted).length} voted
        </span>
        <span className="text-yellow-600 font-medium flex items-center gap-1">
          <Clock size={14} />
          {students.filter((s) => !s.has_voted).length} pending
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">
                    {s.student_id}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {s.last_name}, {s.first_name} {s.middle_name ? s.middle_name[0] + '.' : ''}
                    </p>
                    <p className="text-xs text-gray-400">{s.gender}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    <span className="text-xs">{s.course}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">{s.year_level}</td>
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
              {filtered.length === 0 && (
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
            options={COURSES.map((c) => ({ value: c, label: c }))}
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
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            required
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
