import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { registerStudent, getPrograms } from '../../services/api';
import type { Gender, YearLevel, Program } from '../../types';

const YEAR_LEVELS: YearLevel[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

interface Props {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: Props) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    year_level: '1st Year' as YearLevel,
    course: '',
    gender: 'Male' as Gender,
    birth_date: '',
    school_year: '2025-2026',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getPrograms().then((progs) => {
      setPrograms(progs);
      if (progs.length > 0) {
        setForm((prev) => ({ ...prev, course: progs[0].name }));
      }
    });
  }, []);

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.student_id.trim()) errs.student_id = 'Student ID is required.';
    else if (!/^\d{2}-[A-Z]-\d{5}$/.test(form.student_id.trim()))
      errs.student_id = 'Format must be: 23-A-12345';
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!form.birth_date) errs.birth_date = 'Birth date is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters.';
    if (form.password !== form.confirm_password)
      errs.confirm_password = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await registerStudent({
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
      showToast('success', 'Account created! You can now sign in.');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Student ID"
        placeholder="e.g. 23-A-12345"
        value={form.student_id}
        onChange={(e) => set('student_id', e.target.value)}
        error={errors.student_id}
        hint="Format: YY-X-#####"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          placeholder="Juan"
          value={form.first_name}
          onChange={(e) => set('first_name', e.target.value)}
          error={errors.first_name}
          required
        />
        <Input
          label="Middle Name"
          placeholder="(optional)"
          value={form.middle_name}
          onChange={(e) => set('middle_name', e.target.value)}
        />
      </div>
      <Input
        label="Last Name"
        placeholder="dela Cruz"
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
          required
        />
        <Select
          label="Gender"
          value={form.gender}
          onChange={(e) => set('gender', e.target.value)}
          options={GENDERS.map((g) => ({ value: g, label: g }))}
          required
        />
      </div>
      <Select
        label="Course / Program"
        value={form.course}
        onChange={(e) => set('course', e.target.value)}
        options={programs.map((p) => ({ value: p.name, label: `${p.code} — ${p.name}` }))}
        required
      />
      <Input
        label="Birth Date"
        type="date"
        value={form.birth_date}
        onChange={(e) => set('birth_date', e.target.value)}
        error={errors.birth_date}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Minimum 6 characters"
        value={form.password}
        onChange={(e) => set('password', e.target.value)}
        error={errors.password}
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter password"
        value={form.confirm_password}
        onChange={(e) => set('confirm_password', e.target.value)}
        error={errors.confirm_password}
        required
      />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        leftIcon={<UserPlus size={18} />}
        className="mt-2"
      >
        Create Account
      </Button>
    </form>
  );
}
