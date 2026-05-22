import { useApp } from './context/AppContext';
import { AuthPage } from './pages/auth/AuthPage';
import { AdminPage } from './pages/admin/AdminPage';
import { StudentPage } from './pages/student/StudentPage';
import { ToastContainer } from './components/ui/Toast';
import { DeveloperFab } from './components/DeveloperFab';

function AppContent() {
  const { authUser } = useApp();

  if (!authUser) {
    return <AuthPage />;
  }

  if (authUser.type === 'admin') {
    return <AdminPage />;
  }

  if (authUser.type === 'student') {
    return <StudentPage />;
  }

  return null;
}

export default function App() {
  return (
    <>
      <AppContent />
      <ToastContainer />
      <DeveloperFab />
    </>
  );
}
