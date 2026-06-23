import { useState, useEffect } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import LevelOne from './components/LevelOne';
import LevelTwo from './components/LevelTwo';
import LevelThree from './components/LevelThree';
import TeacherAdmin from './components/TeacherAdmin';
import ConfettiOverlay from './components/ConfettiOverlay';
import { getUserStatus, saveUserStatus, getAdminData } from './data/firestoreService';

function App() {
  const [studentsList, setStudentsList] = useState([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, level1, level2, level3
  const [completedLevels, setCompletedLevels] = useState([]);
  const [showTeacherAdmin, setShowTeacherAdmin] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check login state and fetch initial data
  useEffect(() => {
    const initApp = async () => {
      try {
        const adminData = await getAdminData();
        if (adminData?.studentsList) {
          setStudentsList(adminData.studentsList);
        }
        
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          await checkCompletedLevels(user.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

  const checkCompletedLevels = async (userId) => {
    let completed = [];
    try {
      const status = await getUserStatus(userId);
      if (status && status.completedLevels) {
        completed = status.completedLevels;
      }
    } catch(e) {}
    
    setCompletedLevels(completed);
    
    if (completed.length === 3 && !localStorage.getItem(`confetti_${userId}`)) {
      setShowConfetti(true);
      localStorage.setItem(`confetti_${userId}`, 'true');
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    checkCompletedLevels(user.id);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    if (confirm('確定要登出嗎？未送出的草稿會自動保留喔！')) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setCurrentView('dashboard');
    }
  };

  const handleSubmitLevel = async (levelId, data) => {
    const newCompleted = [...new Set([...completedLevels, levelId])];
    setCompletedLevels(newCompleted);
    await saveUserStatus(currentUser.id, { completedLevels: newCompleted });
    setCurrentView('dashboard');
  };

  if (isAppLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-amber-50 text-2xl font-bold text-slate-500">載入中...</div>;
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} studentsList={studentsList} />
        {/* Hidden Admin Button */}
        <button 
          onClick={() => setShowTeacherAdmin(true)}
          className="fixed bottom-2 right-2 text-sm text-slate-400 hover:text-slate-600 bg-white/50 px-2 py-1 rounded-md opacity-80 transition-all z-50 shadow-sm"
        >
          Teacher Admin
        </button>
        {showTeacherAdmin && <TeacherAdmin onClose={() => setShowTeacherAdmin(false)} globalStudentsList={studentsList} setGlobalStudentsList={setStudentsList} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="container mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard 
            completedLevels={completedLevels} 
            onSelectLevel={(level) => setCurrentView(`level${level}`)} 
          />
        )}
        
        {currentView === 'level1' && (
          <LevelOne 
            currentUser={currentUser} 
            onBack={() => setCurrentView('dashboard')} 
            onSubmit={(data) => handleSubmitLevel(1, data)}
          />
        )}
        
        {currentView === 'level2' && (
          <LevelTwo 
            currentUser={currentUser} 
            studentsList={studentsList}
            onBack={() => setCurrentView('dashboard')} 
            onSubmit={(data) => handleSubmitLevel(2, data)}
          />
        )}
        
        {currentView === 'level3' && (
          <LevelThree 
            currentUser={currentUser}
            studentsList={studentsList} 
            onBack={() => setCurrentView('dashboard')} 
            onSubmit={(data) => handleSubmitLevel(3, data)}
          />
        )}
      </main>

      {showConfetti && (
        <ConfettiOverlay onBack={() => setShowConfetti(false)} />
      )}
      
      <button 
        onClick={() => setShowTeacherAdmin(true)}
        className="fixed bottom-2 right-2 text-sm text-slate-400 hover:text-slate-600 bg-white/50 px-2 py-1 rounded-md opacity-80 transition-all z-50 shadow-sm"
      >
        Teacher Admin
      </button>
      {showTeacherAdmin && <TeacherAdmin onClose={() => setShowTeacherAdmin(false)} globalStudentsList={studentsList} setGlobalStudentsList={setStudentsList} />}
    </div>
  );
}

export default App;
