const WTRecord = {
  _maxSets: 4,
  _selectedCategoryId: null,

  init() {
    const dateInput = document.getElementById('record-date');
    if (dateInput) { dateInput.value = new Date(Date.now()+9*3600000).toISOString().slice(0,10); dateInput.onchange = () => { this._loadExistingRecord(); this._resetSetButtons(); }; }
    this._renderCategoryButtons();
    [1,2,3,4].forEach(i=>{
      const w=document.getElementById('record-set-'+i+'-weight');
      const r=document.getElementById('record-set-'+i+'-reps');
      if(w) w.addEventListener('blur',()=>{ if(w.value) w.value=w.value; });
      if(r) { r.oninput=()=>{ if(r.value>0&&window.WTAI) WTAI.completeSet(); }; r.addEventListener('blur',()=>{ if(r.value) r.value=r.value; }); }
    });
    const btn = document.getElementById('record-save-btn');
    if (btn) { btn.replaceWith(btn.cloneNode(true)); const newBtn = document.getElementById('record-save-btn'); newBtn.addEventListener('click', () => this._saveRecord()); }
  },

  _renderCategoryButtons() {
    const container = document.getElementById('record-category-buttons');
    if (!container) return;
    container.innerHTML = '';
    const categories = WTCore.safeGetState().categories || [];
    if (categories.length === 0) {
      container.innerHTML = '<p>設定でカテゴリを追加してください</p>';
      return;
    }
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = cat.name;
      btn.dataset.id = cat.id;
      btn.onclick = () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedCategoryId = cat.id; if(window.WTAI){ WTAI._reset(); }
        this._renderExerciseDropdown(cat.id);
        this._clearSets();
      };
      container.appendChild(btn);
    });
  },

  _renderExerciseDropdown(categoryId) {
    const dropdown = document.getElementById('record-exercise-dropdown');
    if (!dropdown) return;
    const exercises = (WTCore.safeGetState().exercises || []).filter(ex => ex.categoryId === categoryId);
    dropdown.innerHTML = '<option value="">種目を選択</option>'; dropdown.onchange = () => this._loadExistingRecord();
    exercises.forEach(ex => {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = ex.name;
      dropdown.appendChild(opt);
    });
  },

  _saveRecord() {
    const date = document.getElementById('record-date')?.value;
    if (!date) { return; }

    const dropdown = document.getElementById('record-exercise-dropdown');
    const exerciseId = dropdown?.value;
    if (!exerciseId) { return; }

    const state = WTCore.safeGetState();
    const ex = (state.exercises || []).find(e => e.id === exerciseId);
    if (!ex) { return; }

    const sets = [];
    for (let i = 1; i <= this._maxSets; i++) {
      const weight = parseFloat(document.getElementById(`record-set-${i}-weight`)?.value);
      const reps = parseInt(document.getElementById(`record-set-${i}-reps`)?.value, 10);
      if (weight > 0 && reps > 0) sets.push({ id: `set-${i}`, weight, reps });
    }
    if (sets.length === 0) { return; }

    const records = state.records || [];
    const existingIdx = records.findIndex(r => r.date === date && r.exerciseId === ex.id); const newRec = {
      id: `rec-${Date.now()}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      categoryId: ex.categoryId,
      categoryName: (state.categories || []).find(c => c.id === ex.categoryId)?.name || '',
      date,
      sets,
      createdAt: new Date().toISOString()
    };
    if(existingIdx >= 0) { records[existingIdx] = newRec; } else { records.push(newRec); }
    WTCore.safeSetState({...state, records});
    
    this._clearAll();

    if (window.WTAnalysis) WTAnalysis._render();
    if (window.WTAI) WTAI.callAI();
  },

  _resetSetButtons() {
    [1,2,3,4].forEach(i => {
      const btn = document.querySelector('[onclick="WTRecord._saveSet(' + i + ')"]');
      if (btn) { btn.style.fontWeight = ''; btn.style.textDecoration = ''; btn.dataset.done = '0'; }
    });
  },
  _clearSets() {
    for (let i = 1; i <= this._maxSets; i++) {
      const w = document.getElementById(`record-set-${i}-weight`);
      const r = document.getElementById(`record-set-${i}-reps`);
      if (w) w.value = '';
      if (r) { r.value = ''; r.oninput = () => { if(r.value > 0 && window.WTAI) WTAI.completeSet(); }; }
    }
  },

  _clearAll() {
    document.getElementById('record-date').value = new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    const dropdown = document.getElementById('record-exercise-dropdown');
    if (dropdown) { dropdown.innerHTML = '<option value="">種目を選択</option>'; dropdown.onchange = () => this._loadExistingRecord(); }
    this._clearSets();
  }
};
window.WTRecord = WTRecord;

WTRecord._loadExistingRecord = function() {
  const date = document.getElementById('record-date')?.value;
  const exerciseId = document.getElementById('record-exercise-dropdown')?.value;
  if (!date || !exerciseId) return;
  const records = WTCore.safeGetState().records || [];
  const existing = records.find(r => r.date === date && r.exerciseId === exerciseId);
  if (!existing) { this._clearSets(); return; }
  this._clearSets();
  existing.sets.forEach((s, i) => {
    const w = document.getElementById(`record-set-${i+1}-weight`);
    const r = document.getElementById(`record-set-${i+1}-reps`);
    if (w) w.value = s.weight;
    if (r) r.value = s.reps;
  });
};

WTRecord._saveSet = function(setNum) {
    const btn = document.querySelector('[onclick="WTRecord._saveSet(' + setNum + ')"]');
    if (btn) {
        if (btn.dataset.done === '1') {
            btn.style.fontWeight = '';
            btn.style.textDecoration = '';
            btn.dataset.done = '0';
        } else {
            btn.style.fontWeight = 'bold';
            btn.style.textDecoration = 'underline';
            btn.dataset.done = '1';
        }
    }
    const date = document.getElementById('record-date')?.value;
    if (!date) { return; }
    const dropdown = document.getElementById('record-exercise-dropdown');
    const exerciseId = dropdown?.value;
    if (!exerciseId) { return; }
    const weight = parseFloat(document.getElementById('record-set-'+setNum+'-weight')?.value);
    const reps = parseInt(document.getElementById('record-set-'+setNum+'-reps')?.value, 10);
    if (!(weight > 0 && reps > 0)) {  }

    const state = WTCore.safeGetState();
    const ex = (state.exercises || []).find(e => e.id === exerciseId);
    if (!ex) return;
    const records = state.records || [];
    const idx = records.findIndex(r => r.date === date && r.exerciseId === exerciseId);
    const newSet = { id: 'set-'+setNum, weight, reps };
    if (idx >= 0) {
        const sets = records[idx].sets.filter(s => s.id !== 'set-'+setNum);
        sets.push(newSet);
        sets.sort((a,b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
        records[idx].sets = sets;
    } else {
        records.push({ id:'rec-'+Date.now(), exerciseId:ex.id, exerciseName:ex.name, categoryId:ex.categoryId, categoryName:(state.categories||[]).find(c=>c.id===ex.categoryId)?.name||'', date, sets:[newSet], createdAt:new Date().toISOString() });
    }
    WTCore.safeSetState({...state, records});
    if (window.WTAI) WTAI.completeSet();

    if (window.WTAnalysis) WTAnalysis._render();
};
