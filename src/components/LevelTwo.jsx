import { useState, useMemo, useRef } from 'react';
import { useDraft } from '../hooks/useDraft';
import { ChevronLeft, Send, Check } from 'lucide-react';

export const BADGES = [
  "資料淘金客 (超會查資料、抓重點)",
  "進度小鬧鐘 (小組時空旅人，提醒截止時間)",
  "視覺魔法師 (簡報美化與排版救星)",
  "氣場麥克風 (上台發表清楚、不怯場)",
  "腦洞發明家 (點子王，解謎題目超有創意)",
  "溫暖神補位 (團隊黏著劑，默默撿起沒人做的事)"
];

const SCORES = [3, 4, 5];

export default function LevelTwo({ currentUser, onBack, onSubmit, studentsList }) {
  const groupMembers = useMemo(() => {
    const groupMembersRaw = studentsList.filter(s => parseInt(s.group) === parseInt(currentUser.group) && s.id !== currentUser.id);
    const uniqueMembersMap = new Map();
    groupMembersRaw.forEach(m => uniqueMembersMap.set(String(m.id), m));
    return Array.from(uniqueMembersMap.values()).sort((a, b) => a.id - b.id);
  }, [currentUser, studentsList]);

  const [draft, setDraft] = useDraft(`level2_${currentUser.id}`, {
    peerEvals: groupMembers.map(m => ({ id: m.id, badge1: "", score1: "", badge2: "", score2: "", moment: "" })),
    mvpId: "",
    mvpThanks: ""
  });

  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  
  const peerRefs = useRef({});
  const mvpRef = useRef(null);

  const handlePeerChange = (id, field, value) => {
    setDraft(prevDraft => {
      const currentEvals = Array.isArray(prevDraft?.peerEvals) ? prevDraft.peerEvals : [];
      
      const newEvals = groupMembers.map(member => {
        const existingEvals = currentEvals.filter(pe => pe && String(pe.id) === String(member.id));
        // Merge duplicates if any exist
        let mergedExisting = {};
        existingEvals.forEach(pe => {
          mergedExisting = { ...mergedExisting, ...pe };
        });

        if (String(member.id) === String(id)) {
          return { id: member.id, badge1: "", score1: "", badge2: "", score2: "", moment: "", ...mergedExisting, [field]: value };
        }
        return { id: member.id, badge1: "", score1: "", badge2: "", score2: "", moment: "", ...mergedExisting };
      });

      return { ...(prevDraft || {}), peerEvals: newEvals };
    });
    
    // Clear error
    const key = `peer_${id}_${field}`;
    if (errors[key]) {
      setErrors({ ...errors, [key]: false });
    }
  };

  const validate = () => {
    let newErrors = {};
    let firstErrorRef = null;

    groupMembers.forEach(member => {
      const evalArray = Array.isArray(draft?.peerEvals) ? draft.peerEvals : [];
      const pe = evalArray.find(p => p && String(p?.id) === String(member.id)) || { badge1: "", score1: "", badge2: "", score2: "", moment: "" };
      if (!pe.badge1) {
        newErrors[`peer_${member.id}_badge1`] = true;
        if (!firstErrorRef) firstErrorRef = peerRefs.current[member.id];
      }
      if (!pe.score1) {
        newErrors[`peer_${member.id}_score1`] = true;
        if (!firstErrorRef) firstErrorRef = peerRefs.current[member.id];
      }
      if (pe.badge2 && !pe.score2) {
        newErrors[`peer_${member.id}_score2`] = true;
        if (!firstErrorRef) firstErrorRef = peerRefs.current[member.id];
      }
      if (pe.moment.trim().length < 5) {
        newErrors[`peer_${member.id}_moment`] = true;
        if (!firstErrorRef) firstErrorRef = peerRefs.current[member.id];
      }
    });

    if (!draft.mvpId) {
      newErrors.mvpId = true;
      if (!firstErrorRef) firstErrorRef = mvpRef.current;
    }
    if (draft.mvpThanks.trim().length < 5) {
      newErrors.mvpThanks = true;
      if (!firstErrorRef) firstErrorRef = mvpRef.current;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      firstErrorRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 text-lg transition-colors">
        <ChevronLeft /> 返回總部
      </button>

      <div className="bg-white rounded-3xl shadow-lg border-4 border-emerald-200 p-8">
        <div className="text-center mb-10 border-b-4 border-dashed border-emerald-100 pb-8">
          <h1 className="text-4xl font-extrabold text-emerald-600 mb-4">關卡二：組內互評表</h1>
          <p className="text-xl text-slate-600 font-bold">尋找團隊超能力！每人最多可獲得兩枚勳章並給予加分（3~5分）。</p>
        </div>

        <div className="space-y-12">
          {groupMembers.map((member, index) => {
            const currentEvals = Array.isArray(draft?.peerEvals) ? draft.peerEvals : [];
            const evalData = currentEvals.find(pe => pe && String(pe.id) === String(member.id)) || { badge1: "", score1: "", badge2: "", score2: "", moment: "" };
            const hasError = errors[`peer_${member.id}_badge1`] || errors[`peer_${member.id}_score1`] || errors[`peer_${member.id}_score2`] || errors[`peer_${member.id}_moment`];
            
            return (
              <div 
                key={member.id} 
                ref={el => peerRefs.current[member.id] = el}
                className={`p-6 rounded-2xl border-2 transition-colors ${hasError ? 'shake-error border-red-300 bg-red-50' : 'border-slate-100 bg-slate-50'}`}
              >
                <h3 className="text-3xl font-extrabold text-emerald-700 mb-6 flex items-center gap-4">
                  <span className="bg-emerald-200 text-emerald-800 w-10 h-10 rounded-full flex items-center justify-center text-xl">{index + 1}</span>
                  座號：{member.id}
                </h3>
                
                <div className="space-y-6">
                  {/* Badge 1 */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <label className="block text-lg font-bold text-slate-700 mb-3">🏅 必填：第一枚勳章與評分</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <select
                        value={evalData.badge1}
                        onChange={(e) => handlePeerChange(member.id, 'badge1', e.target.value)}
                        className={`flex-1 text-lg p-3 rounded-lg border-2 outline-none font-bold ${errors[`peer_${member.id}_badge1`] ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-emerald-500'}`}
                      >
                        <option value="" disabled>-- 請選擇一枚勳章 --</option>
                        {BADGES.map(b => <option key={b} value={b} disabled={b === evalData.badge2}>{b}</option>)}
                      </select>
                      <select
                        value={evalData.score1}
                        onChange={(e) => handlePeerChange(member.id, 'score1', e.target.value)}
                        className={`w-full md:w-32 text-lg p-3 rounded-lg border-2 outline-none font-bold text-center ${errors[`peer_${member.id}_score1`] ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-emerald-500'}`}
                      >
                        <option value="" disabled>分數</option>
                        {SCORES.map(s => <option key={s} value={s}>{s} 分</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Badge 2 */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <label className="block text-lg font-bold text-slate-700 mb-3">🏅 選填：第二枚勳章與評分</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <select
                        value={evalData.badge2}
                        onChange={(e) => handlePeerChange(member.id, 'badge2', e.target.value)}
                        className={`flex-1 text-lg p-3 rounded-lg border-2 outline-none font-bold border-slate-300 focus:border-emerald-500`}
                      >
                        <option value="">-- (不選擇) --</option>
                        {BADGES.map(b => <option key={b} value={b} disabled={b === evalData.badge1}>{b}</option>)}
                      </select>
                      <select
                        value={evalData.score2}
                        onChange={(e) => handlePeerChange(member.id, 'score2', e.target.value)}
                        disabled={!evalData.badge2}
                        className={`w-full md:w-32 text-lg p-3 rounded-lg border-2 outline-none font-bold text-center ${errors[`peer_${member.id}_score2`] ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-emerald-500'} disabled:opacity-50 disabled:bg-slate-100`}
                      >
                        <option value="" disabled>分數</option>
                        {SCORES.map(s => <option key={s} value={s}>{s} 分</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xl font-bold text-slate-700 mb-3">✨ 他的具體閃光時刻：</label>
                    <textarea
                      value={evalData.moment}
                      onChange={(e) => handlePeerChange(member.id, 'moment', e.target.value)}
                      placeholder="例如：在做PPT任務時，他幫忙找了很多漂亮圖片讓我印象深刻。"
                      className={`w-full h-24 p-4 rounded-xl border-2 outline-none text-lg font-medium resize-none ${errors[`peer_${member.id}_moment`] ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-emerald-500 bg-white'}`}
                    />
                    <div className="text-right mt-1 text-sm font-bold text-slate-400">
                      目前字數：{evalData.moment.trim().length} 字 (至少 5 字)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* MVP Section */}
          <div 
            ref={mvpRef}
            className={`p-8 rounded-2xl border-4 transition-colors ${errors.mvpId || errors.mvpThanks ? 'shake-error border-red-300' : 'border-emerald-300 bg-emerald-50'}`}
          >
            <h3 className="text-3xl font-extrabold text-emerald-800 mb-2">🏆 壓軸大哉問</h3>
            <p className="text-xl text-emerald-700 font-bold mb-6">本組年度隱藏 MVP 是誰？ (獲得 MVP 者，老師後台將額外給予加分！)</p>
            
            <div className="space-y-6">
              <select
                value={draft?.mvpId || ""}
                onChange={(e) => {
                  setDraft(prev => ({ ...(prev || {}), mvpId: e.target.value }));
                  if (errors.mvpId) setErrors({ ...errors, mvpId: false });
                }}
                className={`w-full text-xl p-4 rounded-xl border-2 outline-none font-bold ${errors.mvpId ? 'border-red-400 bg-red-50' : 'border-emerald-400 focus:border-emerald-600 bg-white'}`}
              >
                <option value="" disabled>-- 請選出一位 MVP --</option>
                {groupMembers.map(m => <option key={m.id} value={m.id}>{m.id}號</option>)}
              </select>

              <div>
                <label className="block text-xl font-bold text-emerald-800 mb-3">想對他說的一句感謝：</label>
                <textarea
                  value={draft?.mvpThanks || ""}
                  onChange={(e) => {
                    setDraft(prev => ({ ...(prev || {}), mvpThanks: e.target.value }));
                    if (errors.mvpThanks && e.target.value.length >= 5) setErrors({ ...errors, mvpThanks: false });
                  }}
                  placeholder="謝謝你總是..."
                  className={`w-full h-24 p-4 rounded-xl border-2 outline-none text-lg font-medium resize-none ${errors.mvpThanks ? 'border-red-400 bg-red-50' : 'border-emerald-400 focus:border-emerald-600 bg-white'}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => validate() && setShowConfirm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Send size={28} />
            送出關卡二
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-emerald-300 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
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
                onClick={() => { setShowConfirm(false); onSubmit(draft); }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl py-3 rounded-xl transition-colors shadow-md"
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
