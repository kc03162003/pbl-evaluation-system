import { useState, useRef } from 'react';
import { useDraft } from '../hooks/useDraft';
import { ChevronLeft, Send, Check } from 'lucide-react';
import { BADGES } from './LevelTwo';

const QUESTIONS = [
  {
    title: "1. 資料蒐集整理(使用可信來源、整理內容資訊)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "2. 資料整理(去蕪存菁、用自己的文字產出)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "3. 小組討論(尊重發言、貢獻想法)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "4. 簡報討論(努力貢獻心力、尊重組員想法、呈現最佳內容)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "5. 簡報製作(盡力完成自己部份、適時支援協助組員)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "6. 口頭報告(有條有理、抑揚頓挫、音調適中)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  },
  {
    title: "7. 解謎與活動(堅守岡位、機動支援)",
    options: [
      { val: 5, label: "5分 積極用心" },
      { val: 4, label: "4分 表現良好" },
      { val: 3, label: "3分 表現平平" },
      { val: 2, label: "2分 仍需努力" },
      { val: 1, label: "1分 勉強做到" }
    ]
  }
];

const getColorClass = (val) => {
  switch(val) {
    case 5: return { color: "bg-emerald-500", hover: "hover:bg-emerald-600" };
    case 4: return { color: "bg-teal-500", hover: "hover:bg-teal-600" };
    case 3: return { color: "bg-sky-500", hover: "hover:bg-sky-600" };
    case 2: return { color: "bg-amber-500", hover: "hover:bg-amber-600" };
    case 1: return { color: "bg-rose-500", hover: "hover:bg-rose-600" };
    default: return { color: "bg-slate-400", hover: "hover:bg-slate-500" };
  }
};

export default function LevelOne({ currentUser, onBack, onSubmit }) {
  const [draft, setDraft] = useDraft(`level1_${currentUser.id}`, {
    scores: Array(QUESTIONS.length).fill(null),
    reflection1: "",
    reflection2: "",
    selfBadge: ""
  });

  const safeScores = Array.isArray(draft.scores) 
    ? [...draft.scores, ...Array(Math.max(0, QUESTIONS.length - draft.scores.length)).fill(null)].slice(0, QUESTIONS.length)
    : Array(QUESTIONS.length).fill(null);
  const safeRef1 = draft.reflection1 !== undefined ? draft.reflection1 : (draft.reflection || "");
  const safeRef2 = draft.reflection2 !== undefined ? draft.reflection2 : "";
  const safeSelfBadge = draft.selfBadge !== undefined ? draft.selfBadge : "";
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  
  const questionRefs = useRef([]);
  const reflection1Ref = useRef(null);
  const reflection2Ref = useRef(null);
  const selfBadgeRef = useRef(null);

  const handleScoreChange = (index, val) => {
    const newScores = [...safeScores];
    newScores[index] = val;
    setDraft({ ...draft, scores: newScores, reflection1: safeRef1, reflection2: safeRef2, selfBadge: safeSelfBadge });
    if (errors[`q${index}`]) setErrors({ ...errors, [`q${index}`]: false });
  };

  const handleReflection1Change = (e) => {
    setDraft({ ...draft, scores: safeScores, reflection2: safeRef2, selfBadge: safeSelfBadge, reflection1: e.target.value });
    if (errors.reflection1 && e.target.value.length >= 5) {
      setErrors({ ...errors, reflection1: false });
    }
  };

  const handleReflection2Change = (e) => {
    setDraft({ ...draft, scores: safeScores, reflection1: safeRef1, selfBadge: safeSelfBadge, reflection2: e.target.value });
    if (errors.reflection2 && e.target.value.length >= 5) {
      setErrors({ ...errors, reflection2: false });
    }
  };

  const validate = () => {
    let newErrors = {};
    let firstErrorRef = null;

    safeScores.forEach((score, i) => {
      if (score === null) {
        newErrors[`q${i}`] = true;
        if (!firstErrorRef) firstErrorRef = questionRefs.current[i];
      }
    });

    if (safeRef1.trim().length < 5) {
      newErrors.reflection1 = true;
      if (!firstErrorRef) firstErrorRef = reflection1Ref.current;
    }

    if (safeRef2.trim().length < 5) {
      newErrors.reflection2 = true;
      if (!firstErrorRef) firstErrorRef = reflection2Ref.current;
    }

    if (!safeSelfBadge) {
      newErrors.selfBadge = true;
      if (!firstErrorRef) firstErrorRef = selfBadgeRef.current;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      firstErrorRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleSubmitClick = () => {
    if (validate()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(false);
    onSubmit({ scores: safeScores, reflection1: safeRef1, reflection2: safeRef2, selfBadge: safeSelfBadge });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 text-lg transition-colors">
        <ChevronLeft /> 返回總部
      </button>

      <div className="bg-white rounded-3xl shadow-lg border-4 border-sky-200 p-8">
        <div className="text-center mb-10 border-b-4 border-dashed border-sky-100 pb-8">
          <h1 className="text-4xl font-extrabold text-sky-600 mb-4">關卡一：學生自評表</h1>
          <p className="text-xl text-slate-600 font-bold">為自己這兩學期的表現打個分數吧！</p>
        </div>

        <div className="space-y-12">
          {QUESTIONS.map((q, i) => (
            <div 
              key={i} 
              ref={el => questionRefs.current[i] = el}
              className={`p-6 rounded-2xl border-2 transition-colors ${errors[`q${i}`] ? 'shake-error' : 'border-slate-100 bg-slate-50'}`}
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-6">{q.title}</h3>
              <div className="flex flex-col md:flex-row gap-3">
                {q.options.map(opt => {
                  const isSelected = safeScores[i] === opt.val;
                  const theme = getColorClass(opt.val);
                  return (
                    <button
                      key={opt.val}
                      onClick={() => handleScoreChange(i, opt.val)}
                      className={`flex-1 py-4 px-3 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all leading-snug text-center min-h-[5rem]
                        ${isSelected 
                          ? `${theme.color} text-white shadow-inner ring-4 ring-offset-2 ring-${theme.color.split('-')[1]}-300` 
                          : `bg-white text-slate-600 border-2 border-slate-200 ${theme.hover} hover:text-white shadow-sm`
                        }`}
                    >
                      {isSelected && <Check size={20} className="mb-1 shrink-0" />}
                      <span className="text-base break-words w-full">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Textareas */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-slate-800 border-l-8 border-sky-500 pl-4">壓軸大哉問</h3>
            
            {/* Self Badge */}
            <div 
              ref={selfBadgeRef}
              className={`p-6 rounded-2xl border-2 transition-colors ${errors.selfBadge ? 'shake-error border-rose-300 bg-rose-50' : 'border-sky-200 bg-sky-50'}`}
            >
              <p className="text-xl text-slate-700 font-bold mb-4">🏅 給自己一枚勳章</p>
              <select
                value={safeSelfBadge}
                onChange={(e) => {
                  setDraft({ ...draft, scores: safeScores, reflection1: safeRef1, reflection2: safeRef2, selfBadge: e.target.value });
                  if (errors.selfBadge) setErrors({ ...errors, selfBadge: false });
                }}
                className={`w-full text-lg p-4 rounded-xl border-2 outline-none font-bold ${errors.selfBadge ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-sky-500 bg-white'}`}
              >
                <option value="" disabled>-- 請選擇一枚最適合自己的勳章 --</option>
                {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Reflection 1 */}
            <div 
              ref={reflection1Ref}
              className={`p-6 rounded-2xl border-2 transition-colors ${errors.reflection1 ? 'shake-error border-rose-300 bg-rose-50' : 'border-sky-200 bg-sky-50'}`}
            >
              <p className="text-xl text-slate-700 font-bold mb-4">1. 整個課程中，我最喜歡的部分是？</p>
              <textarea
                value={safeRef1}
                onChange={handleReflection1Change}
                placeholder="請敘述完整，最好有舉例說明 (至少 5 個字)"
                className="w-full h-32 p-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-lg font-medium resize-none"
              />
              <div className="text-right mt-2 text-sm font-bold text-slate-400">
                目前字數：{safeRef1.trim().length} 字
              </div>
            </div>

            {/* Reflection 2 */}
            <div 
              ref={reflection2Ref}
              className={`p-6 rounded-2xl border-2 transition-colors ${errors.reflection2 ? 'shake-error border-rose-300 bg-rose-50' : 'border-sky-200 bg-sky-50'}`}
            >
              <p className="text-xl text-slate-700 font-bold mb-4">2. 透過課程學習，我覺得我學到了哪些能力？</p>
              <textarea
                value={safeRef2}
                onChange={handleReflection2Change}
                placeholder="請敘述完整，最好有舉例說明 (至少 5 個字)"
                className="w-full h-32 p-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none text-lg font-medium resize-none"
              />
              <div className="text-right mt-2 text-sm font-bold text-slate-400">
                目前字數：{safeRef2.trim().length} 字
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleSubmitClick}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_0_#0284c7] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Send size={28} />
            送出關卡一
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-sky-300 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-4">確定送出嗎？</h2>
            <p className="text-xl text-slate-600 font-bold mb-8">送出後就不能偷改囉！請確認都填寫完畢。</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xl py-3 rounded-xl transition-colors"
              >
                再檢查一下
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl py-3 rounded-xl transition-colors shadow-md"
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
