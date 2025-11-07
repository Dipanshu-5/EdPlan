import { useEffect, useMemo, useState } from 'react';
import Dashboard from '../components/dashboard/Dashboard.jsx';
import Chatbot from '../components/chatbot/Chatbot.jsx';
import EducationPlan from '../components/education/EducationPlan.jsx';
import EducationPlanEditor from '../components/education/EducationPlanEditor.jsx';
import ViewEducationPlan from '../components/education/ViewEducationPlan.jsx';
import ScheduleMyCourse from '../components/schedule/ScheduleMyCourse.jsx';
import FindUniversity from '../components/university/FindUniversity.jsx';
import ProgramDetail from '../components/university/ProgramDetail.jsx';
import SupportChat from '../components/support/SupportChat.jsx';
import { load as loadStorage, save as saveStorage } from '../utils/storage.js';

const menuItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'education', label: 'Plan Builder' },
  { key: 'saved', label: 'Saved Plans' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'university', label: 'Find University' },
  { key: 'program', label: 'Program Detail' },
  { key: 'chat', label: 'Chatbot' },
  { key: 'support', label: 'Support' }
];

const LandingPage = () => {
  const storedComponent = loadStorage('selectedComponent') || 'dashboard';
  const [selectedComponent, setSelectedComponent] = useState(storedComponent);

  useEffect(() => {
    saveStorage('selectedComponent', selectedComponent);
  }, [selectedComponent]);

  const activeLabel = useMemo(
    () => menuItems.find((item) => item.key === selectedComponent)?.label ?? '',
    [selectedComponent]
  );

  const renderContent = () => {
    switch (selectedComponent) {
      case 'dashboard':
        return (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Dashboard />
            <SupportChat />
          </div>
        );
      case 'education':
        return <EducationPlanEditor />;
      case 'saved':
        return <ViewEducationPlan />;
      case 'schedule':
        return <ScheduleMyCourse />;
      case 'university':
        return <FindUniversity onSelectProgram={() => setSelectedComponent('program')} />;
      case 'program':
        return <ProgramDetail onNavigateToPlan={() => setSelectedComponent('education')} />;
      case 'chat':
        return <Chatbot />;
      case 'support':
        return <SupportChat />;
      default:
        return <EducationPlan />;
    }
  };

  return (
    <section className="h-full w-full p-6 space-y-6">
      <header className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Workspace</h1>
            <p className="text-sm text-slate-500">{activeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedComponent(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedComponent === item.key
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-6">{renderContent()}</div>
    </section>
  );
};

export default LandingPage;
