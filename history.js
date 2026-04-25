// History module - 履歴タブロジック
// DOM-only re-render, business logic inside history feature only

const WTHistory = {
  init() {
    this._initTabSwitch();
    this._render();
  },

  _initTabSwitch() {
    const tabBtn = document.getElementById('history-tab-btn');
    if (!tabBtn) return;

    tabBtn.addEventListener('click', () => {
      this._render();
    });
  },

  _render() {
    const container = document.getElementById('history-container');
    if (!container) return;

    const records = (WTCore.safeGetState().records || []);
    const categories = (WTCore.safeGetState().categories || []);

    if (records.length === 0) {
      container.innerHTML = '<p class="empty-message">履歴がありません</p>';
      return;
    }

    const grouped = this._groupRecordsByExercise(records, categories);
    container.innerHTML = this._generateHTML(grouped);
  },

  _groupRecordsByExercise(records, categories) {
    const exerciseMap = {};

    records.forEach(record => {
      if (!exerciseMap[record.exerciseId]) {
        exerciseMap[record.exerciseId] = {
          exerciseId: record.exerciseId,
          exerciseName: record.exerciseName,
          categoryName: record.categoryName,
          records: []
        };
      }
      exerciseMap[record.exerciseId].records.push(record);
    });

    Object.values(exerciseMap).forEach(group => {
      group.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.values(exerciseMap);
  },

  _calculateIntervalDays(lastRecordDateStr, todayStr) {
    const lastDate = new Date(lastRecordDateStr);
    const today = new Date(todayStr);

    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  },

  _getIntervalEmoji(intervalDays) {
    if (intervalDays <= 4) return '🍀';
    if (intervalDays <= 7) return '❗️';
    return '🔥';
  },

  _formatSets(sets) {
    return sets.map(set => `${set.weight}kg × ${set.reps}`).join(', ');
  },

  _generateHTML(exercises) {
    let html = '<ul class="history-list">';

    exercises.forEach(group => {
      const lastRecord = group.records[0];
      const today = new Date().toISOString().slice(0, 10);
      const intervalDays = this._calculateIntervalDays(lastRecord.date, today);
      const emoji = this._getIntervalEmoji(intervalDays);

      html += `<li class="history-item">
        <div class="history-header">
          <span class="exercise-name">${group.exerciseName}</span>
          <span class="category-name">${group.categoryName}</span>
          <span class="interval-emoji">${emoji}</span>
        </div>
        <ul class="history-sets">
      `;

      group.records.forEach(record => {
        html += `<li class="history-set">
          <span class="set-date">${record.date}</span>
          <span class="set-data">${this._formatSets(record.sets)}</span>
        </li>`;
      });

      html += `</ul>
      </li>`;
    });

    html += '</ul>';
    return html;
  }
};
window.WTHistory = WTHistory;
