const WTHistory = {
  init() {},
  _render() {
    const container = document.getElementById("history-container");
    const records = WTCore.safeGetState().records || [];
    const categories = WTCore.safeGetState().categories || [];
    const grouped = {};
    records.forEach(r => {
      if (!grouped[r.exerciseId]) grouped[r.exerciseId] = { exerciseName: r.exerciseName, categoryName: r.categoryName, records: [] };
      grouped[r.exerciseId].records.push(r);
    });
    Object.values(grouped).forEach(g => g.records.sort((a,b) => new Date(b.date)-new Date(a.date)));
    const today = new Date().toISOString().slice(0,10);
    const lines = [];
    categories.forEach(cat => {
      const exs = Object.values(grouped).filter(g => g.categoryName === cat.name);
      lines.push({text: "## " + cat.name, cat: true});
      exs.forEach(g => {
        const r = g.records[0];
        const days = Math.ceil((new Date(today)-new Date(r.date))/86400000);
        const emoji = days <= 4 ? "🍀" : days <= 7 ? "❗️" : "🔥";
        const sets = r.sets.map(s => s.weight+"kg×"+s.reps).join(" ");
        lines.push({text: emoji+" "+g.exerciseName+" | "+r.date+" | "+sets, cat: false});
      });
    });
    container.innerHTML = "<div id='ht-wrap' style='font-family:monospace;padding:12px'></div>";
    const wrap = document.getElementById("ht-wrap");
    let i = 0;
    function next() {
      if (i >= lines.length) return;
      const l = lines[i++];
      const d = document.createElement("div");
      d.style.color = l.cat ? "#007aff" : "";
      d.style.marginTop = l.cat ? "8px" : "0";
      d.textContent = l.text;
      d.style.opacity = "0";
      wrap.appendChild(d);
      requestAnimationFrame(() => {
        d.style.transition = "opacity 0.3s";
        d.style.opacity = "1";
      });
      setTimeout(next, 120);
    }
    next();
    // AIコメント
    const commentEl = document.getElementById('history-ai-comment');
    if (commentEl) {
      const state = WTCore.safeGetState();
      const records = state.records || [];
      const exercises = state.exercises || [];
      const today = new Date().toISOString().slice(0,10);
      const summary = exercises.map(function(ex) {
        const last = records.filter(function(r){ return r.exerciseId === ex.id; }).sort(function(a,b){ return new Date(b.date)-new Date(a.date); })[0];
        const days = last ? Math.ceil((new Date(today)-new Date(last.date))/86400000) : 999;
        return ex.name + ': ' + (last ? days + '日前' : '記録なし');
      }).join(', ');
      const prompt = '筋トレ管理AIです。以下の種目の最終実施日を見て、長期間実施していない種目があれば具体的に指摘してください。なければ短い励ましを。50文字以内。種目:' + summary;
      commentEl.textContent = 'AI分析中...';
      fetch('/llama/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({model:'local',messages:[{role:'user',content:prompt}],max_tokens:100})
      }).then(function(r){ return r.json(); }).then(function(d){
        commentEl.textContent = d.choices[0].message.content;
      }).catch(function(){ commentEl.textContent = ''; });
    }
  }
};
window.WTHistory = WTHistory;
