import { useState, useRef, useMemo } from 'react';
import { useDraft } from '../hooks/useDraft';
import { ChevronLeft, Send, Check } from 'lucide-react';

const AWARDS = [
  { id: 'award1', title: '簡報吸睛王', desc: '(台上的靈魂人物)', prompt: '我推薦... 因為他報告時：' },
  { id: 'award2', title: '金頭腦出題王', desc: '(解謎題目的設計鬼才)', prompt: '我推薦... 因為解他們題目時：' },
  { id: 'award3', title: '熱情神關主', desc: '(活動當天的最佳服務生)', prompt: '我推薦... 因為去他們攤位時：' }
];

export default function LevelThree({ currentUser, onBack, onSubmit, studentsList }) {
  const otherStudents = useMemo(() => {
    return studentsList
      .filter(s => s.group !== currentUser.group)
      .sort((a, b) => {
        if (a.group !== b.group) return a.group - b.group;
        return a.id - b.id;
      });
  }, [currentUser, studentsList]);

  const [draft, setDraft] = useDraft(`level3_${currentUser.id}`, {
    award1: { studentId: "", reason: "" },
    award2: { studentId: "", reason: "" },
    award3: { studentId: "", reason: "" }
  });

  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  
  const awardRefs = useRef({});

  const handleAwardChange = (awardId, field, value) => {
    setDraft({
      ...draft,
      [awardId]: { ...draft[awardId], [field]: value }
    });
    
    // Clear error
    const key = `${awardId}_${field}`;
    if (errors[key]) {
      if (field === 'studentId' || (field === 'reason' && value.length >= 5)) {
        setErrors({ ...errors, [key]: false });
      }
    }
  };

  const validate = () => {
    let newErrors = {};
    let firstErrorRef = null;

    AWARDS.forEach(award => {
      const data = draft[award.id];
      if (!data.studentId) {
        newErrors[`${award.id}_studentId`] = true;
        if (!firstErrorRef) firstErrorRef = awardRefs.current[award.id];
      }
      if (data.reason.trim().length < 5) {
        newErrors[`${award.id}_reason`] = true;
        if (!firstErrorRef) firstErrorRef = awardRefs.current[award.id];
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      firstErrorRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 text-lg transition-colors">
        <ChevronLeft /> 返回總部
      </button>

      <div className="bg-white rounded-3xl shadow-lg border-4 border-amber-200 p-8">
        <div className="text-center mb-10 border-b-4 border-dashed border-amber-100 pb-8">
          <h1 className="text-4xl font-extrabold text-amber-600 mb-4">關卡三：他組星探推薦</h1>
          <p className="text-xl text-slate-600 font-bold">別組也有超神隊友？發掘別組的亮點吧！</p>
        </div>

        <div className="space-y-12">
          {AWARDS.map((award, index) => {
            const awardData = draft[award.id];
            const hasError = errors[`${award.id}_studentId`] || errors[`${award.id}_reason`];
            
            return (
              <div 
                key={award.id} 
                ref={el => awardRefs.current[award.id] = el}
                className={`p-8 rounded-3xl border-4 transition-colors ${hasError ? 'shake-error border-red-300' : 'border-amber-200 bg-amber-50'}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-amber-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black shadow-md">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-amber-800">{award.title}</h3>
                    <p className="text-amber-700 font-bold">{award.desc}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <select
                      value={awardData.studentId}
                      onChange={(e) => handleAwardChange(award.id, 'studentId', e.target.value)}
                      className={`w-full text-xl p-4 rounded-xl border-2 outline-none font-bold ${errors[`${award.id}_studentId`] ? 'border-red-400 bg-red-50' : 'border-amber-300 focus:border-amber-500 bg-white'}`}
                    >
                      <option value="" disabled>-- 請選擇推薦人選 (排除本組) --</option>
                      {otherStudents.map(s => <option key={s.id} value={s.id}>第 {s.group} 組 - {s.id}號</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xl font-bold text-amber-800 mb-3">{award.prompt}</label>
                    <textarea
                      value={awardData.reason}
                      onChange={(e) => handleAwardChange(award.id, 'reason', e.target.value)}
                      placeholder="請描述具體發生了什麼事..."
                      className={`w-full h-24 p-4 rounded-xl border-2 outline-none text-lg font-medium resize-none ${errors[`${award.id}_reason`] ? 'border-red-400 bg-red-50' : 'border-amber-300 focus:border-amber-500 bg-white'}`}
                    />
                    <div className="text-right mt-1 text-sm font-bold text-slate-400">
                      目前字數：{awardData.reason.trim().length} 字 (至少 5 字)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => validate() && setShowConfirm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Send size={28} />
            送出關卡三
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-300 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-4">確定送出嗎？</h2>
            <p className="text-xl text-slate-600 font-bold mb-8">這是最後一關囉！確認送出後就不能改了。</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xl py-3 rounded-xl transition-colors"
              >
                再檢查一下
              </button>
              <button 
                onClick={() => { setShowConfirm(false); onSubmit(draft); }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xl py-3 rounded-xl transition-colors shadow-md"
              >
                確定送出！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
