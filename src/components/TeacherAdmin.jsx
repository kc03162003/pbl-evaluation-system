import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getAdminData, saveAdminData, getAllEvaluations } from '../data/firestoreService';
import { Download, Lock, X, Settings, Users, Table, Save, Plus, Trash2 } from 'lucide-react';

export default function TeacherAdmin({ onClose, globalStudentsList, setGlobalStudentsList }) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [settings, setSettings] = useState({ selfWeight: 30, peerWeight: 20, teacherWeight: 50, mvpPoints: 1, starPoints: 2 });
  const [teacherScores, setTeacherScores] = useState({});
  const [studentsList, setStudentsList] = useState(globalStudentsList || []);
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    setIsLoading(true);
    const adminData = await getAdminData();
    if (adminData?.settings) setSettings(adminData.settings);
    if (adminData?.teacherScores) setTeacherScores(adminData.teacherScores);
    
    const evals = await getAllEvaluations();
    const currentStudents = adminData?.studentsList || globalStudentsList || [];
    setStudentsList(currentStudents);
    
    const newRawData = currentStudents.map(student => ({
      student,
      l1: evals[`level1_${student.id}`] || null,
      l2: evals[`level2_${student.id}`] || null,
      l3: evals[`level3_${student.id}`] || null,
    }));
    setRawData(newRawData);
    setIsLoading(false);
  };

  const getCalculatedScores = (studentId) => {
    const student = studentsList.find(s => s.id === studentId);
    if (!student) return null;
    const data = rawData.find(d => d.student.id === studentId) || { student, l1: null, l2: null, l3: null };
    
    // 1. Self Eval (Convert to 100 scale)
    let selfRaw = 0;
    let selfTotal = 0;
    if (data.l1 && data.l1.scores) {
      selfRaw = data.l1.scores.reduce((a, b) => a + (b || 0), 0);
      selfTotal = data.l1.scores.length * 5; // 7 questions * 5 points
    }
    const selfPercent = selfTotal > 0 ? (selfRaw / selfTotal) * 100 : 0;
    
    // 2. Peer Eval (Bonus points accumulation)
    let peerBonus = 0;
    let peerFeedback = [];
    let mvpCount = 0;
    const groupMembers = rawData.filter(d => d.student.group === student.group && d.student.id !== studentId);
    groupMembers.forEach(m => {
      if (m.l2 && m.l2.peerEvals) {
        const evalForMe = m.l2.peerEvals.find(pe => pe.id === studentId);
        if (evalForMe) {
          if (evalForMe.score1) {
            peerBonus += parseInt(evalForMe.score1);
            peerFeedback.push(`[${m.student.id}號]: ${evalForMe.badge1}(${evalForMe.score1}分)`);
          }
          if (evalForMe.score2) {
            peerBonus += parseInt(evalForMe.score2);
            peerFeedback.push(`[${m.student.id}號]: ${evalForMe.badge2}(${evalForMe.score2}分)`);
          }
        }
      }
      if (m.l2 && parseInt(m.l2.mvpId) === studentId) {
        peerBonus += parseInt(settings.mvpPoints);
        peerFeedback.push(`[${m.student.id}號投了MVP]`);
        mvpCount++;
      }
    });

    const otherGroups = rawData.filter(d => d.student.group !== student.group);
    otherGroups.forEach(m => {
      if (m.l3) {
        if (parseInt(m.l3.award1?.studentId) === studentId) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
        if (parseInt(m.l3.award2?.studentId) === studentId) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
        if (parseInt(m.l3.award3?.studentId) === studentId) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
      }
    });

    // 3. Teacher Eval
    const teacherScore = parseInt(teacherScores[studentId] || 0);

    // Final Calculation
    const selfFinal = selfPercent * (settings.selfWeight / 100);
    const peerFinal = peerBonus * (settings.peerWeight / 100);
    const teacherFinal = teacherScore * (settings.teacherWeight / 100);
    const finalScore = selfFinal + peerFinal + teacherFinal;

    return {
      selfRaw,
      selfPercent: selfPercent.toFixed(1),
      peerBonus,
      teacherScore,
      mvpCount,
      finalScore: finalScore.toFixed(1),
      peerFeedback: peerFeedback.join(', ') || '無',
      selfBadge: data.l1?.selfBadge || '無'
    };
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'c1723') {
      setAuthenticated(true);
    } else {
      alert('密碼錯誤！');
      setPassword('');
    }
  };

  const saveSettings = async () => {
    await saveAdminData({ settings, teacherScores, studentsList });
    alert('設定已儲存！');
  };

  const handleTeacherScoreChange = async (id, score) => {
    const updated = { ...teacherScores, [id]: score };
    setTeacherScores(updated);
    await saveAdminData({ settings, teacherScores: updated, studentsList });
  };

  const saveStudentsListToCloud = async () => {
    setGlobalStudentsList(studentsList);
    await saveAdminData({ settings, teacherScores, studentsList });
    alert('名單已儲存至雲端！系統將自動重整。');
    window.location.reload();
  };

  const handleExport = () => {
    const analysisData = studentsList.map(student => {
      const scores = getCalculatedScores(student.id);
      return {
        "座號": student.id,
        "組別": student.group,
        "自評原始總分": scores.selfRaw,
        "自評百分制": scores.selfPercent,
        "他評加分總和": scores.peerBonus,
        "老師評分": scores.teacherScore,
        "最終綜合分數": scores.finalScore,
        "MVP得票數 (加分參考)": scores.mvpCount,
        "自給勳章 (參考)": scores.selfBadge,
        "自評權重(%)": settings.selfWeight,
        "他評權重(%)": settings.peerWeight,
        "老師權重(%)": settings.teacherWeight,
        "互評明細": scores.peerFeedback
      };
    });

    const ws = XLSX.utils.json_to_sheet(analysisData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "結算總表");
    XLSX.writeFile(wb, "綜合評量成績總表.xlsx");
  };

  const handleClearAll = () => {
    if (confirm('警告！這將會清除所有學生的填寫資料（包含 LocalStorage），確定要清空嗎？')) {
      if (confirm('再次確認：真的要清空嗎？清空後無法復原！')) {
        localStorage.clear();
        alert('所有資料已清空！');
        window.location.reload();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10">
          <X size={28} />
        </button>

        {!authenticated ? (
          <div className="p-12 text-center my-auto">
            <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 mb-8">老師專屬後台</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-6 max-w-sm mx-auto">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="請輸入後台密碼"
                className="text-center text-2xl font-bold py-4 rounded-2xl border-4 border-slate-200 focus:border-slate-500 outline-none"
                autoFocus
              />
              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-2xl py-4 rounded-2xl transition-colors">
                登入後台
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Tabs */}
            <div className="flex border-b-4 border-slate-100 p-6 pb-0 gap-4 shrink-0">
              <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-6 py-4 font-bold text-xl rounded-t-2xl transition-colors ${activeTab === 'overview' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Table size={24} /> 成績結算與打分
              </button>
              <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-6 py-4 font-bold text-xl rounded-t-2xl transition-colors ${activeTab === 'students' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Users size={24} /> 名單管理
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-4 font-bold text-xl rounded-t-2xl transition-colors ${activeTab === 'settings' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Settings size={24} /> 計分權重設定
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              
              {/* Tab 1: Overview & Grading */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {isLoading && <div className="text-center font-bold text-slate-500 py-8">載入雲端資料中...</div>}
                  {!isLoading && (
                    <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-3xl font-extrabold text-slate-800">學生成績總覽與老師打分</h3>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-3 px-6 rounded-xl shadow-md transition-transform active:scale-95">
                      <Download size={20} /> 匯出 Excel 總表
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-800 text-white font-bold">
                        <tr>
                          <th className="p-4">座號</th>
                          <th className="p-4">組別</th>
                          <th className="p-4 text-center">自評百分制<br/>({settings.selfWeight}%)</th>
                          <th className="p-4 text-center">他評加分總和<br/>({settings.peerWeight}%)</th>
                          <th className="p-4 text-center w-40 bg-sky-700">老師綜合評分<br/>({settings.teacherWeight}%)</th>
                          <th className="p-4 text-center bg-emerald-700">最終綜合分數</th>
                          <th className="p-4 text-center bg-amber-500">MVP票數<br/>(參考)</th>
                          <th className="p-4 text-center bg-amber-500">自給勳章<br/>(參考)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsList.map(student => {
                          const scores = getCalculatedScores(student.id);
                          return (
                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-4 font-bold text-slate-500">{student.id}</td>
                              <td className="p-4 font-bold text-slate-500">第 {student.group} 組</td>
                              <td className="p-4 text-center font-bold text-slate-700">{scores.selfPercent}</td>
                              <td className="p-4 text-center font-bold text-slate-700">{scores.peerBonus} 分</td>
                              <td className="p-4 text-center bg-sky-50">
                                <input 
                                  type="number" 
                                  min="0" max="100"
                                  value={teacherScores[student.id] || ''}
                                  onChange={(e) => handleTeacherScoreChange(student.id, e.target.value)}
                                  placeholder="0-100"
                                  className="w-full text-center p-2 rounded border border-slate-300 font-bold focus:border-sky-500 outline-none"
                                />
                              </td>
                              <td className="p-4 text-center font-extrabold text-emerald-600 text-xl">{scores.finalScore}</td>
                              <td className="p-4 text-center font-extrabold text-amber-600 text-xl">{scores.mvpCount}</td>
                              <td className="p-4 text-center font-bold text-amber-600">{scores.selfBadge}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                 )}
                </div>
              )}

              {/* Tab 2: Students List */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-3xl font-extrabold text-slate-800">小組名單管理</h3>
                    <button onClick={saveStudentsListToCloud} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg py-3 px-6 rounded-xl shadow-md transition-transform active:scale-95">
                      <Save size={20} /> 儲存並套用名單
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => {
                        const groupId = i + 1;
                        const groupStudents = studentsList.filter(s => parseInt(s.group) === groupId);
                        return (
                          <div key={groupId} className="border-2 border-slate-100 rounded-xl p-4">
                            <h4 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-slate-100 pb-2">第 {groupId} 組</h4>
                            <div className="space-y-2">
                              {groupStudents.map((student, gIdx) => (
                                <div key={gIdx} className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={student.id} 
                                    className="w-16 p-2 rounded border border-slate-200 text-center font-bold"
                                    onChange={(e) => {
                                      const globalIdx = studentsList.findIndex(s => s === student);
                                      if (globalIdx !== -1) {
                                        const newList = [...studentsList];
                                        newList[globalIdx] = { ...student, id: parseInt(e.target.value) || '' };
                                        setStudentsList(newList);
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => {
                                      const globalIdx = studentsList.findIndex(s => s === student);
                                      if (globalIdx !== -1) {
                                        const newList = [...studentsList];
                                        newList.splice(globalIdx, 1);
                                        setStudentsList(newList);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-600 p-2"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => {
                                  const validIds = studentsList.map(s => parseInt(s.id)).filter(id => !isNaN(id));
                                  const nextId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
                                  setStudentsList([...studentsList, { id: nextId, group: groupId }]);
                                }}
                                className="w-full mt-4 flex items-center justify-center gap-1 text-sky-500 font-bold p-2 border-2 border-dashed border-sky-200 rounded-lg hover:bg-sky-50"
                              >
                                <Plus size={20} /> 新增組員
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <h3 className="text-3xl font-extrabold text-slate-800 mb-8 text-center">計分權重與規則設定</h3>
                  
                  <div className="bg-white p-8 rounded-3xl shadow border-4 border-slate-100 space-y-6">
                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">自評權重 (%)</label>
                      <input 
                        type="number" 
                        value={settings.selfWeight} 
                        onChange={(e) => setSettings({...settings, selfWeight: e.target.value})}
                        className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">他評加分總和權重 (%)</label>
                      <input 
                        type="number" 
                        value={settings.peerWeight} 
                        onChange={(e) => setSettings({...settings, peerWeight: e.target.value})}
                        className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">老師綜合評分權重 (%)</label>
                      <input 
                        type="number" 
                        value={settings.teacherWeight} 
                        onChange={(e) => setSettings({...settings, teacherWeight: e.target.value})}
                        className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">獲得小組 MVP 加分數</label>
                      <input 
                        type="number" 
                        value={settings.mvpPoints} 
                        onChange={(e) => setSettings({...settings, mvpPoints: e.target.value})}
                        className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">每次他組星探推薦加分數</label>
                      <input 
                        type="number" 
                        value={settings.starPoints} 
                        onChange={(e) => setSettings({...settings, starPoints: e.target.value})}
                        className="w-24 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
                      />
                    </div>

                    <div className="pt-6 text-center">
                      <p className="text-lg font-bold text-slate-500 mb-6">目前總權重：<span className={parseInt(settings.selfWeight) + parseInt(settings.peerWeight) + parseInt(settings.teacherWeight) === 100 ? 'text-emerald-500' : 'text-rose-500'}>{parseInt(settings.selfWeight) + parseInt(settings.peerWeight) + parseInt(settings.teacherWeight)}%</span></p>
                      
                      <button onClick={saveSettings} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xl py-4 px-12 rounded-xl transition-colors w-full">
                        儲存設定
                      </button>
                    </div>

                    <div className="mt-12 text-center pt-8 border-t-4 border-dashed border-red-100">
                      <button onClick={handleClearAll} className="text-red-500 hover:text-red-700 font-bold underline transition-colors">
                        危險區域：清空所有學生的填寫資料
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
