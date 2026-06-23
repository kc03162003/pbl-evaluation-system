import { LogOut } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  if (!currentUser) return null;

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="bg-orange-100 text-orange-700 font-bold px-4 py-2 rounded-full text-lg">
          歡迎！第 {currentUser.group} 組
        </div>
        <div className="font-bold text-slate-700 text-lg">
          座號：{currentUser.id}
        </div>
      </div>
      <button 
        onClick={onLogout}
        className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold transition-colors"
      >
        <LogOut size={20} />
        登出
      </button>
    </nav>
  );
}
