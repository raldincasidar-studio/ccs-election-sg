import { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { loginAdmin, loginStudent } from '../../services/api';

interface LoginFormProps {
  mode: 'admin' | 'student';
}

export function LoginForm({ mode }: LoginFormProps) {
  const { setAuthUser, showToast } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!identifier.trim()) {
      errs.identifier = mode === 'admin' ? 'Username is required.' : 'Student ID is required.';
    }
    if (!password.trim()) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'admin') {
        const admin = await loginAdmin(identifier.trim(), password);
        setAuthUser({ type: 'admin', data: admin });
        showToast('success', `Welcome back, ${admin.name}!`);
      } else {
        const student = await loginStudent(identifier.trim(), password);
        setAuthUser({ type: 'student', data: student });
        showToast('success', `Welcome, ${student.first_name}!`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={mode === 'admin' ? 'Username' : 'Student ID'}
        placeholder={mode === 'admin' ? 'Enter username' : 'e.g. 23-A-12345'}
        value={identifier}
        onChange={(e) => {
          setIdentifier(e.target.value);
          setErrors((p) => ({ ...p, identifier: undefined }));
        }}
        leftIcon={<User size={16} />}
        error={errors.identifier}
        required
        autoCapitalize="none"
      />
      <Input
        label={mode === 'student' ? 'Last Name' : 'Password'}
        type={showPass ? 'text' : 'password'}
        placeholder={mode === 'student' ? 'e.g. DELA CRUZ' : 'Enter your password'}
        hint={mode === 'student' ? 'Enter your last name exactly as registered in SSAAM' : undefined}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrors((p) => ({ ...p, password: undefined }));
        }}
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="active:scale-90 transition-transform"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        error={errors.password}
        required
      />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        leftIcon={<LogIn size={18} />}
        className="mt-2"
      >
        Sign In
      </Button>
    </form>
  );
}
