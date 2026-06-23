import { User, Users, Star, CheckCircle } from 'lucide-react';

export default function Dashboard({ completedLevels, onSelectLevel }) {
  const levels = [
    {
      id: 1,
      title: "關卡一：學生自評表",
      subtitle: "個人反思",
      icon: <User size={48} className="text-sky-500" />,
      color: "border-sky-300 bg-sky-50 hover:bg-sky-100",
      btnColor: "bg-sky-500 hover:bg-sky-600 shadow-[0_6px_0_0_#0284c7]",
    },
    {
      id: 2,
      title: "關卡二：組內互評表",
      subtitle: "尋找團隊超能力",
      icon: <Users size={48} className="text-emerald-500" />,
      color: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100",
      btnColor: "bg-emerald-500 hover:bg-emerald-600 shadow-[0_6px_0_0_#059669]",
    },
    {
      id: 3,
      title: "關卡三：他組星探推薦",
      subtitle: "跨組表揚",
      icon: <Star size={48} className="text-amber-500" />,
      color: "border-amber-300 bg-amber-50 hover:bg-amber-100",
      btnColor: "bg-amber-500 hover:bg-amber-600 shadow-[0_6px_0_0_#d97706]",
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-800 mb-12 whitespace-nowrap overflow-hidden text-ellipsis">任務導航首頁</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {levels.map(level => {
          const isCompleted = completedLevels.includes(level.id);
          
          return (
            <div 
              key={level.id}
              className={`relative border-4 rounded-3xl p-8 flex flex-col items-center text-center transition-transform transform ${level.color} ${!isCompleted && 'hover:-translate-y-2'}`}
            >
              {isCompleted && (
                <div className="absolute -top-6 -right-6 bg-red-500 text-white font-bold px-4 py-2 rounded-lg rotate-12 shadow-lg border-4 border-white z-10 flex items-center gap-1 text-xl">
                  <CheckCircle size={24} /> 已完成
                </div>
              )}
              
              <div className="bg-white p-6 rounded-full shadow-md mb-6">
                {level.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2 whitespace-nowrap tracking-tight">{level.title}</h2>
              <p className="text-slate-500 font-semibold mb-8 flex-1">{level.subtitle}</p>
              
              <button
                onClick={() => onSelectLevel(level.id)}
                className={`w-full text-white font-bold text-xl py-4 rounded-2xl transition-all ${isCompleted ? 'bg-slate-400 cursor-default shadow-none' : level.btnColor + ' active:shadow-none active:translate-y-[6px]'}`}
              >
                {isCompleted ? '查看或修改' : '進入關卡'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
