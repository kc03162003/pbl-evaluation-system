import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getAdminData, saveAdminData, getAllEvaluations, getAllUserStatuses } from '../data/firestoreService';
import { Download, Lock, X, Settings, Users, Table, Save, Plus, Trash2, FileSpreadsheet, FileText, Search, Award, MessageSquare, CheckCircle2, Clock, Filter } from 'lucide-react';

export default function TeacherAdmin({ onClose, globalStudentsList, setGlobalStudentsList }) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [settings, setSettings] = useState({ selfWeight: 30, peerWeight: 20, teacherWeight: 50, mvpPoints: 1, starPoints: 2, studentPassword: 'c1723' });
  const [teacherScores, setTeacherScores] = useState({});
  const [studentsList, setStudentsList] = useState(globalStudentsList || []);
  const [rawData, setRawData] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters for detail tabs
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [searchId, setSearchId] = useState('');

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
    
    const newRawData = currentStudents.map(student => {
      const l1Cloud = evals[`level1_${student.id}`];
      const l2Cloud = evals[`level2_${student.id}`];
      const l3Cloud = evals[`level3_${student.id}`];
      const l1Local = JSON.parse(localStorage.getItem(`level1_${student.id}`) || 'null');
      const l2Local = JSON.parse(localStorage.getItem(`level2_${student.id}`) || 'null');
      const l3Local = JSON.parse(localStorage.getItem(`level3_${student.id}`) || 'null');

      return {
        student,
        l1: l1Cloud || l1Local || null,
        l2: l2Cloud || l2Local || null,
        l3: l3Cloud || l3Local || null,
      };
    });
    setRawData(newRawData);
    
    const statuses = await getAllUserStatuses();
    setUserStatuses(statuses);
    
    setIsLoading(false);
  };

  const getCalculatedScores = (studentId) => {
    const student = studentsList.find(s => parseInt(s.id) === parseInt(studentId));
    if (!student) return null;
    const data = rawData.find(d => parseInt(d.student.id) === parseInt(studentId)) || { student, l1: null, l2: null, l3: null };
    
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
    const groupMembers = rawData.filter(d => parseInt(d.student.group) === parseInt(student.group) && parseInt(d.student.id) !== parseInt(studentId));
    groupMembers.forEach(m => {
      if (m.l2 && m.l2.peerEvals) {
        const evalForMe = m.l2.peerEvals.find(pe => parseInt(pe.id) === parseInt(studentId));
        if (evalForMe) {
          if (evalForMe.score1) {
            peerBonus += parseInt(evalForMe.score1);
            peerFeedback.push(`[來自${m.student.id}號]: ${evalForMe.badge1}(${evalForMe.score1}分)`);
          }
          if (evalForMe.score2) {
            peerBonus += parseInt(evalForMe.score2);
            peerFeedback.push(`[來自${m.student.id}號]: ${evalForMe.badge2}(${evalForMe.score2}分)`);
          }
        }
      }
      if (m.l2 && parseInt(m.l2.mvpId) === parseInt(studentId)) {
        peerBonus += parseInt(settings.mvpPoints);
        peerFeedback.push(`[來自${m.student.id}號投了MVP]`);
        mvpCount++;
      }
    });

    const otherGroups = rawData.filter(d => parseInt(d.student.group) !== parseInt(student.group));
    otherGroups.forEach(m => {
      if (m.l3) {
        if (parseInt(m.l3.award1?.studentId) === parseInt(studentId)) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
        if (parseInt(m.l3.award2?.studentId) === parseInt(studentId)) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
        if (parseInt(m.l3.award3?.studentId) === parseInt(studentId)) { peerBonus += parseInt(settings.starPoints); peerFeedback.push(`[他組星探推薦]`); }
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

  // 產生完整 CSV / Excel 資料結構（包含所有自評、他評、推薦的分數、徽章與文字）
  const getComprehensiveStudentRows = () => {
    return [...studentsList]
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .map(student => {
        const scores = getCalculatedScores(student.id) || {};
        const data = rawData.find(d => parseInt(d.student.id) === parseInt(student.id)) || { student, l1: null, l2: null, l3: null };

        // 整理給他人的互評明細 (輸入)
        const peerGivenList = (data.l2?.peerEvals || [])
          .filter(pe => pe && pe.id)
          .map(pe => {
            const badges = [
              pe.badge1 ? `${pe.badge1}(${pe.score1}分)` : '',
              pe.badge2 ? `${pe.badge2}(${pe.score2}分)` : ''
            ].filter(Boolean).join('、');
            const momentText = pe.moment ? ` | 閃光時刻: ${pe.moment}` : '';
            return `[給 ${pe.id}號] 徽章: ${badges || '無'}${momentText}`;
          }).join(' ｜ ');

        // 整理收到的他評明細 (收到)
        const receivedPeers = rawData.filter(d => parseInt(d.student.group) === parseInt(student.group) && parseInt(d.student.id) !== parseInt(student.id));
        const receivedBadgesList = [];
        const receivedMomentsList = [];
        const receivedMvpList = [];

        receivedPeers.forEach(m => {
          if (m.l2?.peerEvals) {
            const evalForMe = m.l2.peerEvals.find(pe => parseInt(pe.id) === parseInt(student.id));
            if (evalForMe) {
              const bList = [
                evalForMe.badge1 ? `${evalForMe.badge1}(${evalForMe.score1}分)` : '',
                evalForMe.badge2 ? `${evalForMe.badge2}(${evalForMe.score2}分)` : ''
              ].filter(Boolean).join('、');
              if (bList) receivedBadgesList.push(`[來自 ${m.student.id}號] ${bList}`);
              if (evalForMe.moment) receivedMomentsList.push(`[來自 ${m.student.id}號] "${evalForMe.moment}"`);
            }
          }
          if (m.l2 && parseInt(m.l2.mvpId) === parseInt(student.id)) {
            receivedMvpList.push(`[來自 ${m.student.id}號投MVP] ${m.l2.mvpThanks ? `"${m.l2.mvpThanks}"` : ''}`);
          }
        });

        // 收到的星探推薦
        const otherGroupMembers = rawData.filter(d => parseInt(d.student.group) !== parseInt(student.group));
        const receivedStarList = [];
        otherGroupMembers.forEach(m => {
          if (m.l3) {
            if (parseInt(m.l3.award1?.studentId) === parseInt(student.id)) {
              receivedStarList.push(`[第${m.student.group}組 ${m.student.id}號-簡報吸睛王] "${m.l3.award1.reason || ''}"`);
            }
            if (parseInt(m.l3.award2?.studentId) === parseInt(student.id)) {
              receivedStarList.push(`[第${m.student.group}組 ${m.student.id}號-金頭腦出題王] "${m.l3.award2.reason || ''}"`);
            }
            if (parseInt(m.l3.award3?.studentId) === parseInt(student.id)) {
              receivedStarList.push(`[第${m.student.group}組 ${m.student.id}號-熱情神關主] "${m.l3.award3.reason || ''}"`);
            }
          }
        });

        return {
          "座號": student.id,
          "組別": `第 ${student.group} 組`,
          "最終綜合分數": scores.finalScore,
          "老師綜合評分": scores.teacherScore,
          "自評百分制": scores.selfPercent,
          "他評加分總和": scores.peerBonus,
          "MVP得票數": scores.mvpCount,
          "自給勳章": scores.selfBadge,
          "自評原始總分(滿分35)": scores.selfRaw,
          "自評-1.資料蒐集(1~5分)": data.l1?.scores?.[0] ?? '',
          "自評-2.資料整理(1~5分)": data.l1?.scores?.[1] ?? '',
          "自評-3.小組討論(1~5分)": data.l1?.scores?.[2] ?? '',
          "自評-4.簡報討論(1~5分)": data.l1?.scores?.[3] ?? '',
          "自評-5.簡報製作(1~5分)": data.l1?.scores?.[4] ?? '',
          "自評-6.口頭報告(1~5分)": data.l1?.scores?.[5] ?? '',
          "自評-7.解謎活動(1~5分)": data.l1?.scores?.[6] ?? '',
          "自評文字-最喜歡的部分": data.l1?.reflection1 || '',
          "自評文字-學到的能力": data.l1?.reflection2 || '',
          "他評(輸入)-組內互評紀錄(給予組員之徽章/分數/閃光時刻)": peerGivenList || '無',
          "他評(輸入)-推舉MVP座號": data.l2?.mvpId ? `${data.l2.mvpId}號` : '',
          "他評(輸入)-對MVP感謝文字": data.l2?.mvpThanks || '',
          "星探推薦(輸入)-簡報吸睛王推薦": data.l3?.award1?.studentId ? `推薦 ${data.l3.award1.studentId}號｜理由：${data.l3.award1.reason}` : '',
          "星探推薦(輸入)-金頭腦出題王推薦": data.l3?.award2?.studentId ? `推薦 ${data.l3.award2.studentId}號｜理由：${data.l3.award2.reason}` : '',
          "星探推薦(輸入)-熱情神關主推薦": data.l3?.award3?.studentId ? `推薦 ${data.l3.award3.studentId}號｜理由：${data.l3.award3.reason}` : '',
          "他評(收到)-組內他評評分與徽章紀錄": receivedBadgesList.join(' ｜ ') || '無',
          "他評(收到)-閃光時刻留言明細": receivedMomentsList.join(' ｜ ') || '無',
          "他評(收到)-MVP投票與感謝留言": receivedMvpList.join(' ｜ ') || '無',
          "星探推薦(收到)-他組推薦與理由": receivedStarList.join(' ｜ ') || '無',
        };
      });
  };

  // 匯出完整 CSV 總表 (含 UTF-8 BOM 以防中文亂碼)
  const handleExportCSV = () => {
    const rows = getComprehensiveStudentRows();
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        headers.map(header => {
          const val = row[header] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `學生評量綜合與詳細紀錄總表.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 匯出 Excel (同時包含完整明細表與成績結算總表)
  const handleExportExcel = () => {
    const fullRows = getComprehensiveStudentRows();
    const overviewRows = studentsList.map(student => {
      const scores = getCalculatedScores(student.id) || {};
      return {
        "座號": student.id,
        "組別": student.group,
        "自評原始總分": scores.selfRaw,
        "自評百分制": scores.selfPercent,
        "他評加分總和": scores.peerBonus,
        "老師評分": scores.teacherScore,
        "最終綜合分數": scores.finalScore,
        "MVP得票數": scores.mvpCount,
        "自給勳章": scores.selfBadge,
        "自評權重(%)": settings.selfWeight,
        "他評權重(%)": settings.peerWeight,
        "老師權重(%)": settings.teacherWeight,
        "互評明細": scores.peerFeedback
      };
    });

    const wb = XLSX.utils.book_new();
    const wsFull = XLSX.utils.json_to_sheet(fullRows);
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    
    XLSX.utils.book_append_sheet(wb, wsFull, "評量完整明細表");
    XLSX.utils.book_append_sheet(wb, wsOverview, "成績結算簡表");
    XLSX.writeFile(wb, "學生評量綜合與詳細紀錄總表.xlsx");
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

  const filteredStudents = [...studentsList]
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
    .filter(student => {
      if (filterGroup !== 'all' && String(student.group) !== String(filterGroup)) return false;
      if (searchId && !String(student.id).includes(searchId)) return false;
      if (filterLevel !== 'all') {
        const status = userStatuses[student.id] || { completedLevels: [] };
        if (filterLevel === 'l1_incomplete' && status.completedLevels?.includes(1)) return false;
        if (filterLevel === 'l2_incomplete' && status.completedLevels?.includes(2)) return false;
        if (filterLevel === 'l3_incomplete' && status.completedLevels?.includes(3)) return false;
      }
      return true;
    });

  const uniqueGroups = [...new Set(studentsList.map(s => s.group))].sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl shadow-2xl relative flex flex-col max-h-[92vh]">
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
            <div className="flex border-b-4 border-slate-100 p-6 pb-0 gap-3 shrink-0 overflow-x-auto">
              <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-5 py-3.5 font-bold text-lg rounded-t-2xl transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Table size={20} /> 成績結算與打分
              </button>
              <button onClick={() => setActiveTab('details_input')} className={`flex items-center gap-2 px-5 py-3.5 font-bold text-lg rounded-t-2xl transition-colors whitespace-nowrap ${activeTab === 'details_input' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <FileText size={20} /> 學生填寫紀錄 (自評/他評/文字)
              </button>
              <button onClick={() => setActiveTab('details_received')} className={`flex items-center gap-2 px-5 py-3.5 font-bold text-lg rounded-t-2xl transition-colors whitespace-nowrap ${activeTab === 'details_received' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Award size={20} /> 學生收到評價 (徽章/分數/留言)
              </button>
              <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-5 py-3.5 font-bold text-lg rounded-t-2xl transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Users size={20} /> 名單管理
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-3.5 font-bold text-lg rounded-t-2xl transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Settings size={20} /> 計分權重設定
              </button>
            </div>

            {/* Global Export Buttons Header */}
            <div className="bg-slate-800 text-white px-8 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-slate-700">
              <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span>💡 可隨時匯出包含「所有自評/他評分數、徽章與文字紀錄」的總表</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2 px-4 rounded-xl shadow transition-transform active:scale-95"
                >
                  <FileSpreadsheet size={18} /> 匯出完整 CSV 總表
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm py-2 px-4 rounded-xl shadow transition-transform active:scale-95"
                >
                  <Download size={18} /> 匯出 Excel 總表
                </button>
              </div>
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
                            {[...studentsList].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map(student => {
                              const scores = getCalculatedScores(student.id) || {};
                              return (
                                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-4 font-bold text-slate-700">{student.id}</td>
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

              {/* Tab 2: Details Input (學生填寫的自評、他評與文字) */}
              {activeTab === 'details_input' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-800">學生填寫紀錄 (自評 / 組內互評 / 他組推薦)</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">檢視每位學生自行輸入的所有評分、徽章選擇與文字留言</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="搜尋座號..."
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-sky-500 bg-white"
                        />
                      </div>
                      <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="text-sm p-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-sky-500 bg-white"
                      >
                        <option value="all">顯示所有小組</option>
                        {uniqueGroups.map(g => <option key={g} value={g}>第 {g} 組</option>)}
                      </select>
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="text-sm p-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-sky-500 bg-white"
                      >
                        <option value="all">全部狀態</option>
                        <option value="l1_incomplete">只顯示：關卡一 未完成</option>
                        <option value="l2_incomplete">只顯示：關卡二 未完成</option>
                        <option value="l3_incomplete">只顯示：關卡三 未完成</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {filteredStudents.map(student => {
                      const status = userStatuses[student.id] || { completedLevels: [] };
                      const l1Completed = status.completedLevels?.includes(1);
                      const l2Completed = status.completedLevels?.includes(2);
                      const l3Completed = status.completedLevels?.includes(3);
                      
                      const l1Data = rawData.find(d => parseInt(d.student.id) === parseInt(student.id))?.l1 || {};
                      const l2Data = rawData.find(d => parseInt(d.student.id) === parseInt(student.id))?.l2 || {};
                      const l3Data = rawData.find(d => parseInt(d.student.id) === parseInt(student.id))?.l3 || {};
                      const scores = getCalculatedScores(student.id) || {};

                      const qTitles = [
                        "1. 資料蒐集", "2. 資料整理", "3. 小組討論",
                        "4. 簡報討論", "5. 簡報製作", "6. 口頭報告", "7. 解謎活動"
                      ];

                      return (
                        <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="bg-sky-500 text-white px-3 py-1 rounded-lg font-extrabold text-sm">座號 {student.id}</span>
                              <span className="font-bold text-slate-300">第 {student.group} 組</span>
                            </div>
                            <div className="text-sm font-bold text-slate-300">
                              綜合分數：<span className="text-emerald-400 text-base">{scores.finalScore || 0}</span> 分
                            </div>
                          </div>

                          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                            {/* Level 1: Self Eval */}
                            <div className="space-y-3 pr-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                  <span>1️⃣ 關卡一：學生自評</span>
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${l1Completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {l1Completed ? '✅ 已完成' : '⏳ 未完成'}
                                </span>
                              </div>

                              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-sm">
                                <span className="font-bold text-amber-800 block">🏅 自給勳章：</span>
                                <span className="text-amber-900 font-bold">{l1Data.selfBadge || '無'}</span>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                <div className="font-bold text-slate-700 flex justify-between border-b pb-1">
                                  <span>自評題目與得分</span>
                                  <span>小計：{scores.selfRaw || 0}/35分</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 pt-1">
                                  {qTitles.map((title, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-600">
                                      <span className="truncate">{title}</span>
                                      <span className="font-bold text-slate-800 ml-1">{l1Data.scores?.[idx] ?? '-'}分</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2 text-sm pt-1">
                                <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                                  <span className="font-bold text-sky-800 block mb-1">💬 最喜歡的部分：</span>
                                  <p className="text-slate-700 whitespace-pre-wrap">{l1Data.reflection1 || '無'}</p>
                                </div>
                                <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                                  <span className="font-bold text-sky-800 block mb-1">💬 學到的能力：</span>
                                  <p className="text-slate-700 whitespace-pre-wrap">{l1Data.reflection2 || '無'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Level 2: Peer Eval Given */}
                            <div className="space-y-3 lg:pl-6 pt-4 lg:pt-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                  <span>2️⃣ 關卡二：組內互評 (填寫給組員)</span>
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${l2Completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {l2Completed ? '✅ 已完成' : '⏳ 未完成'}
                                </span>
                              </div>

                              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm">
                                <span className="font-bold text-emerald-800 block">🏆 推薦本組 MVP：</span>
                                <span className="text-emerald-900 font-bold">{l2Data.mvpId ? `${l2Data.mvpId}號` : '未選擇'}</span>
                                {l2Data.mvpThanks && (
                                  <p className="text-emerald-800 mt-1 italic text-xs">💬 &ldquo;{l2Data.mvpThanks}&rdquo;</p>
                                )}
                              </div>

                              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {l2Data.peerEvals && l2Data.peerEvals.length > 0 ? (
                                  l2Data.peerEvals.map(pe => pe && pe.id ? (
                                    <div key={pe.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                                      <div className="font-bold text-slate-800 flex justify-between">
                                        <span>對象：{pe.id} 號</span>
                                        <span className="text-emerald-600">{(parseInt(pe.score1 || 0) + parseInt(pe.score2 || 0))} 分</span>
                                      </div>
                                      {pe.badge1 && (
                                        <div className="text-slate-600">🏅 勳章1：<span className="font-semibold text-slate-800">{pe.badge1}</span> ({pe.score1}分)</div>
                                      )}
                                      {pe.badge2 && (
                                        <div className="text-slate-600">🏅 勳章2：<span className="font-semibold text-slate-800">{pe.badge2}</span> ({pe.score2}分)</div>
                                      )}
                                      {pe.moment && (
                                        <div className="text-slate-600 pt-1 border-t border-slate-200">
                                          💬 閃光時刻：<span className="italic text-slate-800">{pe.moment}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : null)
                                ) : (
                                  <div className="text-slate-400 text-sm italic">尚無互評紀錄</div>
                                )}
                              </div>
                            </div>

                            {/* Level 3: Star Recommendations Given */}
                            <div className="space-y-3 lg:pl-6 pt-4 lg:pt-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                  <span>3️⃣ 關卡三：他組星探推薦</span>
                                </h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${l3Completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {l3Completed ? '✅ 已完成' : '⏳ 未完成'}
                                </span>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                                  <span className="font-bold text-amber-900 block">🌟 簡報吸睛王：</span>
                                  <div className="font-semibold text-amber-800">
                                    {l3Data.award1?.studentId ? `推薦 ${l3Data.award1.studentId} 號` : '未推薦'}
                                  </div>
                                  {l3Data.award1?.reason && (
                                    <p className="text-xs text-slate-700 mt-1">💬 &ldquo;{l3Data.award1.reason}&rdquo;</p>
                                  )}
                                </div>

                                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                                  <span className="font-bold text-amber-900 block">💡 金頭腦出題王：</span>
                                  <div className="font-semibold text-amber-800">
                                    {l3Data.award2?.studentId ? `推薦 ${l3Data.award2.studentId} 號` : '未推薦'}
                                  </div>
                                  {l3Data.award2?.reason && (
                                    <p className="text-xs text-slate-700 mt-1">💬 &ldquo;{l3Data.award2.reason}&rdquo;</p>
                                  )}
                                </div>

                                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                                  <span className="font-bold text-amber-900 block">🔥 熱情神關主：</span>
                                  <div className="font-semibold text-amber-800">
                                    {l3Data.award3?.studentId ? `推薦 ${l3Data.award3.studentId} 號` : '未推薦'}
                                  </div>
                                  {l3Data.award3?.reason && (
                                    <p className="text-xs text-slate-700 mt-1">💬 &ldquo;{l3Data.award3.reason}&rdquo;</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Details Received (學生收到的評價與回饋) */}
              {activeTab === 'details_received' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-800">學生收到評價 (收到的徽章 / 分數 / 閃光時刻與推薦)</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">檢視其他同學給予該位學生的所有讚美、勳章與回饋文字</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="搜尋座號..."
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-sky-500 bg-white"
                        />
                      </div>
                      <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="text-sm p-2 rounded-xl border border-slate-300 font-bold outline-none focus:border-sky-500 bg-white"
                      >
                        <option value="all">顯示所有小組</option>
                        {uniqueGroups.map(g => <option key={g} value={g}>第 {g} 組</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {filteredStudents.map(student => {
                      const scores = getCalculatedScores(student.id) || {};

                      // 查詢收到的組內他評
                      const receivedPeers = rawData.filter(d => parseInt(d.student.group) === parseInt(student.group) && parseInt(d.student.id) !== parseInt(student.id));
                      const receivedPeerEvals = [];
                      const receivedMvpVotes = [];

                      receivedPeers.forEach(m => {
                        if (m.l2?.peerEvals) {
                          const evalForMe = m.l2.peerEvals.find(pe => parseInt(pe.id) === parseInt(student.id));
                          if (evalForMe && (evalForMe.badge1 || evalForMe.moment)) {
                            receivedPeerEvals.push({
                              fromId: m.student.id,
                              badge1: evalForMe.badge1,
                              score1: evalForMe.score1,
                              badge2: evalForMe.badge2,
                              score2: evalForMe.score2,
                              moment: evalForMe.moment
                            });
                          }
                        }
                        if (m.l2 && parseInt(m.l2.mvpId) === parseInt(student.id)) {
                          receivedMvpVotes.push({
                            fromId: m.student.id,
                            thanks: m.l2.mvpThanks
                          });
                        }
                      });

                      // 查詢收到的他組星探推薦
                      const otherGroupMembers = rawData.filter(d => parseInt(d.student.group) !== parseInt(student.group));
                      const receivedStars = [];
                      otherGroupMembers.forEach(m => {
                        if (m.l3) {
                          if (parseInt(m.l3.award1?.studentId) === parseInt(student.id)) {
                            receivedStars.push({ fromGroup: m.student.group, fromId: m.student.id, awardName: '簡報吸睛王', reason: m.l3.award1.reason });
                          }
                          if (parseInt(m.l3.award2?.studentId) === parseInt(student.id)) {
                            receivedStars.push({ fromGroup: m.student.group, fromId: m.student.id, awardName: '金頭腦出題王', reason: m.l3.award2.reason });
                          }
                          if (parseInt(m.l3.award3?.studentId) === parseInt(student.id)) {
                            receivedStars.push({ fromGroup: m.student.group, fromId: m.student.id, awardName: '熱情神關主', reason: m.l3.award3.reason });
                          }
                        }
                      });

                      return (
                        <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg font-extrabold text-sm">座號 {student.id}</span>
                              <span className="font-bold text-slate-300">第 {student.group} 組</span>
                              <span className="text-xs bg-slate-700 px-2 py-1 rounded text-amber-300 font-semibold">自給勳章：{scores.selfBadge || '無'}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-300 flex items-center gap-4">
                              <span>他評加分合計：<span className="text-emerald-400 font-extrabold text-base">{scores.peerBonus || 0}</span> 分</span>
                              <span>MVP 得票：<span className="text-amber-400 font-extrabold text-base">{scores.mvpCount || 0}</span> 票</span>
                            </div>
                          </div>

                          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                            {/* Column 1: Received Peer Evals */}
                            <div className="space-y-3 pr-2">
                              <h4 className="font-extrabold text-emerald-800 text-lg">
                                🎁 收到組內他評 (勳章與閃光時刻)
                              </h4>
                              <div className="space-y-2.5">
                                {receivedPeerEvals.length > 0 ? (
                                  receivedPeerEvals.map((item, idx) => (
                                    <div key={idx} className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                                      <div className="font-bold text-emerald-900 flex justify-between">
                                        <span>來自 {item.fromId} 號同學</span>
                                        <span className="text-emerald-700 font-extrabold">+{(parseInt(item.score1 || 0) + parseInt(item.score2 || 0))} 分</span>
                                      </div>
                                      {item.badge1 && (
                                        <div className="text-slate-700">🏅 <span className="font-bold">{item.badge1}</span> ({item.score1}分)</div>
                                      )}
                                      {item.badge2 && (
                                        <div className="text-slate-700">🏅 <span className="font-bold">{item.badge2}</span> ({item.score2}分)</div>
                                      )}
                                      {item.moment && (
                                        <div className="text-slate-700 pt-1 border-t border-emerald-100 italic">
                                          💬 &ldquo;{item.moment}&rdquo;
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 text-sm italic">尚無同組同學填寫他評</div>
                                )}
                              </div>
                            </div>

                            {/* Column 2: Received MVP Votes */}
                            <div className="space-y-3 lg:pl-6 pt-4 lg:pt-0">
                              <h4 className="font-extrabold text-amber-800 text-lg">
                                🏆 收到 MVP 提名與感謝話語
                              </h4>
                              <div className="space-y-2.5">
                                {receivedMvpVotes.length > 0 ? (
                                  receivedMvpVotes.map((mvp, idx) => (
                                    <div key={idx} className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                                      <div className="font-bold text-amber-900">
                                        來自 {mvp.fromId} 號同學投下 MVP 👑
                                      </div>
                                      {mvp.thanks ? (
                                        <p className="text-slate-700 italic pt-1 border-t border-amber-100">💬 &ldquo;{mvp.thanks}&rdquo;</p>
                                      ) : (
                                        <p className="text-slate-400 italic">無感謝留言</p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 text-sm italic">尚無 MVP 提名</div>
                                )}
                              </div>
                            </div>

                            {/* Column 3: Received Star Recommendations */}
                            <div className="space-y-3 lg:pl-6 pt-4 lg:pt-0">
                              <h4 className="font-extrabold text-sky-800 text-lg">
                                ✨ 收到他組星探推薦與理由
                              </h4>
                              <div className="space-y-2.5">
                                {receivedStars.length > 0 ? (
                                  receivedStars.map((star, idx) => (
                                    <div key={idx} className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs space-y-1">
                                      <div className="font-bold text-sky-900 flex justify-between">
                                        <span>【{star.awardName}】</span>
                                        <span className="text-slate-500">來自第{star.fromGroup}組 {star.fromId}號</span>
                                      </div>
                                      {star.reason && (
                                        <p className="text-slate-700 italic pt-1 border-t border-sky-100">💬 &ldquo;{star.reason}&rdquo;</p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-slate-400 text-sm italic">尚無他組星探推薦</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Students List */}
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

              {/* Tab 5: Settings */}
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

                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4">
                      <label className="text-xl font-bold text-slate-700">學生首頁登入密碼</label>
                      <input 
                        type="text" 
                        value={settings.studentPassword || 'c1723'} 
                        onChange={(e) => setSettings({...settings, studentPassword: e.target.value})}
                        className="w-32 text-center text-xl font-bold p-3 rounded-xl border-2 border-slate-300 focus:border-sky-500 outline-none"
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
