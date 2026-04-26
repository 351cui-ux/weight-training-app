const WTAnalysis = (() => {
  let charts = [];
  function init() { if(window.Chart) { const dark = window.matchMedia("(prefers-color-scheme: dark)").matches; Chart.defaults.color = dark ? "#ffffff" : "#333333"; } _renderCategorySelector(); _render(); }
  function _renderCategorySelector() {
    const container = document.getElementById("analysis-exercise-select");
    container.innerHTML = "";
    const categories = WTCore.safeGetState().categories || [];
    const sel = document.createElement("select");
    sel.id = "analysis-category-dropdown";
    sel.innerHTML = "<option value=''>カテゴリを選択<\/option>" + categories.map(c => "<option value='" + c.id + "'>" + c.name + "<\/option>").join("");
    sel.addEventListener("change", _render);
    container.appendChild(sel);
    const chartArea = document.createElement("div");
    chartArea.id = "analysis-charts";
    container.appendChild(chartArea);
  }
  function _render() {
    const catId = document.getElementById("analysis-category-dropdown") ? document.getElementById("analysis-category-dropdown").value : "";
    charts.forEach(c => c.destroy()); charts = [];
    const chartArea = document.getElementById("analysis-charts");
    chartArea.innerHTML = "";
    const state = WTCore.safeGetState();
    const exercises = (state.exercises || []).filter(ex => ex.categoryId === catId);
    const records = state.records || [];
    exercises.forEach(ex => {
      const exRecords = records.filter(r => r.exerciseId === ex.id).sort((a,b) => new Date(a.date)-new Date(b.date));
      const labels = exRecords.map(r => r.date);
      const weights = exRecords.map(r => Math.max(...r.sets.map(s => s.weight)));
      const reps = exRecords.map(r => r.sets.reduce((sum,s) => sum+s.reps, 0));
      const wrapper = document.createElement("div");
      wrapper.style = "margin-bottom:24px";
      const title = document.createElement("h3");
      title.textContent = ex.name;
      wrapper.appendChild(title);
      const canvas = document.createElement("canvas");
      wrapper.appendChild(canvas);
      chartArea.appendChild(wrapper);
      charts.push(new Chart(canvas, {
        type: "line",
        data: { labels, datasets: [
          { label: "重量(kg)", data: weights, borderColor: "#007aff", yAxisID: "y", tension: 0.3 },
          { label: "回数", data: reps, borderColor: "#ff9500", yAxisID: "y2", tension: 0.3 }
        ]},
        options: { responsive: true, color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#333333', scales: {
          y: { position: "left", title: { display: true, text: "kg" }, ticks: { stepSize: 1.25 } },
          y2: { position: "right", title: { display: true, text: "回" }, ticks: { stepSize: 1 }, grid: { drawOnChartArea: false } }
        }}
      }));
    });
  }
  return { init, _render };
})();
window.WTAnalysis = WTAnalysis;
