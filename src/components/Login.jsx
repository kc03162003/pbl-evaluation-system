import { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ onLogin, studentsList }) {
  const [seatNum, setSeatNum] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    let student = studentsList.find(s => s.id === parseInt(seatNum));
    
    // Test account override
    if (parseInt(seatNum) === 31) {
      student = { id: 31, group: 6, isTestAccount: true };
    }

    if (student) {
      onLogin(student);
    } else {
      setError('找不到這個座號喔！請再確認一次。');
      setSeatNum('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full text-center border-4 border-orange-200">
        <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">校訂課程期末大挑戰</h1>
        <p className="text-slate-500 mb-8 font-medium">請輸入你的座號來登入任務總部</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <input
              type="number"
              min="1"
              max="30"
              value={seatNum}
              onChange={(e) => {
                setSeatNum(e.target.value);
                setError('');
              }}
              placeholder="請輸入座號 (1-30)"
              className="w-full text-center text-3xl font-bold py-4 rounded-2xl border-4 border-slate-200 focus:border-orange-400 focus:ring-0 outline-none transition-colors placeholder:text-slate-300"
              autoFocus
            />
            {error && <p className="text-red-500 font-bold mt-2 animate-bounce">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={!seatNum}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-2xl py-4 rounded-2xl transition-all shadow-[0_6px_0_0_#c2410c] active:shadow-none active:translate-y-[6px] flex items-center justify-center gap-2"
          >
            <LogIn size={28} />
            進入總部
          </button>
        </form>
      </div>
    </div>
  );
}
