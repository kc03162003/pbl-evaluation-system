const prevDraft = {
  "mvpThanks": "她是我們小組最負責任的人",
  "mvpId": "27",
  "peerEvals": [
    {
      "score1": "3",
      "moment": "看到這組沒人會幫忙",
      "badge1": "溫暖神補位 (團隊黏著劑，默默撿起沒人做的事)",
      "badge2": "進度鬧鐘 (小組時空旅人，提醒截止時間)",
      "score2": "4",
      "id": 16
    },
    {
      "badge1": "氣場麥克風 (上台發表清楚、不怯場)",
      "moment": "非常負責任",
      "score1": "5",
      "score2": "5",
      "id": 17,
      "badge2": "資料淘金客 (超會查資料、抓重點)"
    },
    {
      "badge1": "",
      "moment": "",
      "score1": "",
      "score2": "",
      "id": 22,
      "badge2": ""
    },
    {
      "score2": "4",
      "id": 25,
      "badge2": "溫暖神補位 (團隊黏著劑，默默撿起沒人做的事)",
      "moment": "會互相合作",
      "badge1": "進度鬧鐘 (小組時空旅人，提醒截止時間)",
      "score1": "4"
    },
    {
      "score1": "5",
      "badge1": "資料淘金客 (超會查資料、抓重點)",
      "moment": "在小組沒有人的時候，會馬上幫忙",
      "badge2": "視覺魔法師 (簡報美化與排版救星)",
      "score2": "5",
      "id": 27
    }
  ]
};

const id = 23;
const field = 'badge1';
const value = 'X';

let exists = false;
const currentEvals = Array.isArray(prevDraft?.peerEvals) ? prevDraft.peerEvals : [];

const mergedMap = new Map();
currentEvals.forEach(pe => {
  if (!pe) return;
  const strId = String(pe.id || 'unknown');
  if (mergedMap.has(strId)) {
    const existing = mergedMap.get(strId);
    mergedMap.set(strId, {
      ...existing,
      badge1: pe.badge1 || existing.badge1,
      score1: pe.score1 || existing.score1,
      badge2: pe.badge2 || existing.badge2,
      score2: pe.score2 || existing.score2,
      moment: pe.moment || existing.moment
    });
  } else {
    mergedMap.set(strId, { ...pe });
  }
});

const mergedEvals = Array.from(mergedMap.values());

const newEvals = mergedEvals.map(pe => {
  if (!pe) return pe;
  if (String(pe.id) === String(id)) {
    exists = true;
    return { ...pe, [field]: value };
  }
  return pe;
});

if (!exists) {
  newEvals.push({ id, badge1: "", score1: "", badge2: "", score2: "", moment: "", [field]: value });
}

const newState = { ...(prevDraft || {}), peerEvals: newEvals };

console.log(JSON.stringify(newState.peerEvals.find(p => p.id === 23), null, 2));

