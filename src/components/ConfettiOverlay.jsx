import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // Need to install react-use or just use window.innerWidth. I'll just use simple window.inner.

export default function ConfettiOverlay({ onBack }) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-500">
      <ReactConfetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={800}
        gravity={0.15}
      />
      <div className="bg-white rounded-3xl p-12 text-center max-w-lg shadow-2xl border-8 border-orange-400 animate-in zoom-in-50 duration-700 delay-300">
        <h1 className="text-5xl font-black text-orange-600 mb-6 drop-shadow-sm">🎉 恭喜破關！ 🎉</h1>
        <p className="text-2xl font-bold text-slate-700 mb-8">
          太棒了！你已經完成了所有的期末評量任務。感謝你的用心填寫！
        </p>
        <button
          onClick={onBack}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_0_#c2410c] active:shadow-none active:translate-y-[6px] transition-all"
        >
          返回總部
        </button>
      </div>
    </div>
  );
}
