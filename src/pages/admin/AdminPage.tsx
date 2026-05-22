import { useState } from 'react';
import { AdminLayout, type AdminTab } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { PositionsManager } from './PositionsManager';
import { PartylistManager } from './PartylistManager';
import { CandidatesManager } from './CandidatesManager';
import { StudentsManager } from './StudentsManager';
import { ProgramsManager } from './ProgramsManager';
import { ReportsPage } from './ReportsPage';
import { SettingsPage } from './SettingsPage';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'positions': return <PositionsManager />;
      case 'partylists': return <PartylistManager />;
      case 'candidates': return <CandidatesManager />;
      case 'students': return <StudentsManager />;
      case 'programs': return <ProgramsManager />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}
