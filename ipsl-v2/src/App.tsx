import { useUiStore } from './stores/uiStore';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useDarkMode } from './hooks/useDarkMode';

import Header from './components/layout/Header';
import TabNav from './components/layout/TabNav';
import Footer from './components/layout/Footer';
import Toast from './components/layout/Toast';

import BylawsPanel from './components/bylaws/BylawsPanel';
import MembersPanel from './components/members/MembersPanel';
import MemberModal from './components/members/MemberModal';
import FeesPanel from './components/fees/FeesPanel';
import FeeModal from './components/fees/FeeModal';
import SupportPanel from './components/support/SupportPanel';
import EventModal from './components/support/EventModal';
import StatementsPanel from './components/statements/StatementsPanel';
import TransactionModal from './components/statements/TransactionModal';
import CalendarPanel from './components/calendar/CalendarPanel';
import ScheduleModal from './components/calendar/ScheduleModal';
import VotingPanel from './components/voting/VotingPanel';
import VotingSessionModal from './components/voting/VotingSessionModal';
import VoteCastModal from './components/voting/VoteCastModal';
import SettingsModal from './components/settings/SettingsModal';

export default function App() {
  useFirestoreSync();
  useDarkMode();

  const currentTab = useUiStore(s => s.currentTab);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 min-h-screen flex flex-col transition-colors duration-200">
      <Header />
      <TabNav />

      {currentTab === 'bylaws' && <BylawsPanel />}
      {currentTab === 'members' && <MembersPanel />}
      {currentTab === 'fees' && <FeesPanel />}
      {currentTab === 'support' && <SupportPanel />}
      {currentTab === 'statements' && <StatementsPanel />}
      {currentTab === 'calendar' && <CalendarPanel />}
      {currentTab === 'voting' && <VotingPanel />}

      <Footer />

      {/* Modals */}
      <MemberModal />
      <FeeModal />
      <TransactionModal />
      <EventModal />
      <ScheduleModal />
      <VotingSessionModal />
      <VoteCastModal />
      <SettingsModal />

      <Toast />
    </div>
  );
}
