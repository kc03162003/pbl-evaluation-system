import { useState } from 'react';
import { LogIn, Lock, Info } from 'lucide-react';

export default function Login({ onLogin, studentsList, adminSettings }) {
  const [seatNum, setSeatNum] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isTestSeat = parseInt(seatNum) === 31;

  const handleLogin = (e) => {
    e.preventDefault();
    const id = parseInt(seatNum);
    
    // 1. 測試帳號 31 號：無須檢查登入密碼，直接登入
    if (id === 31) {
      onLogin({ id: 31, group: 6, isTestAccount: true });
      return;
    }

    // 2. 檢查座號是否存在
    const student = studentsList.find(s => parseInt(s.id) === id);
    if (!student) {
      setError('找不到這個座號喔！請再確認一次。');
      return;
    }

    // 3. 檢查登入密碼（預設為 c1723，可透過教師後台設定 studentPassword）
    const requiredPassword = adminSettings?.studentPassword || 'c1723';
    if (!password || password.trim().toLowerCase() !== requiredPassword.toLowerCase()) {
      setError('登入密碼錯誤！請輸入正確的登入密碼。');
      return;
    }

    onLogin(student);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 max-w-md w-full text-center border-4 border-orange-200">
        <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 mb-2">校訂課程期末大挑戰</h1>
        <p className="text-slate-500 mb-6 font-bold">請輸入座號與密碼登入任務總部</p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-left font-bold text-slate-600 text-sm mb-1.5 pl-1">
              座號
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={seatNum}
              onChange={(e) => {
                setSeatNum(e.target.value);
                setError('');
              }}
              placeholder="請輸入座號 (1-31)"
              className="w-full text-center text-2xl font-bold py-3.5 rounded-2xl border-4 border-slate-200 focus:border-orange-400 outline-none transition-colors placeholder:text-slate-300"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-left font-bold text-slate-600 text-sm mb-1.5 pl-1 flex justify-between items-center">
              <span>登入密碼</span>
              {isTestSeat && (
                <span className="text-xs font-bold text-emerald-600">✅ 測試帳號免填密碼</span>
              )}
            </label>
            <div className="relative">
              <input
                type="password"
                value={isTestSeat ? '' : password}
                disabled={isTestSeat}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={isTestSeat ? "測試帳號無須登入密碼" : "請輸入登入密碼"}
                className={`w-full text-center text-xl font-bold py-3.5 rounded-2xl border-4 outline-none transition-colors placeholder:text-slate-300 ${
                  isTestSeat
                    ? 'bg-slate-100 border-slate-200 text-slate-400'
                    : 'border-slate-200 focus:border-orange-400'
                }`}
              />
            </div>
            {error && <p className="text-red-500 font-bold mt-2 animate-bounce">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={!seatNum}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-2xl py-4 rounded-2xl transition-all shadow-[0_6px_0_0_#c2410c] active:shadow-none active:translate-y-[6px] flex items-center justify-center gap-2 mt-1"
          >
            <LogIn size={26} />
            進入總部
          </button>
        </form>

        {/* 測試帳號說明卡片 */}
        <div className="mt-6 bg-amber-50/90 border-2 border-amber-200 text-amber-900 rounded-2xl p-4 text-left text-xs font-bold space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-sm">
            <Info size={16} />
            <span>測試帳號說明</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            測試帳號為 <span className="text-orange-600 font-extrabold">31號</span>，<span className="text-orange-600 font-extrabold">無須登入密碼</span>即可進入體驗，且測試填寫內容<span className="text-orange-600 font-extrabold">不會列入後台紀錄</span>。
          </p>
        </div>
      </div>
    </div>
  );
}
