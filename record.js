// Record module - "今日の記録" tab logic
// DOM-only re-render, business logic inside record feature only

const WTRecord = {
  _maxSets: 4,

  init() {
    this._initDateSelector();
    this._initCategoryButtons();
    this._initExerciseDropdown();
    this._initSetsInputs();
    this._initSaveButton();
  },

  _initDateSelector() {
    const dateInput = document.getElementById('record-date');
    if (!dateInput) return;

    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = dateInput.value || today;

    dateInput.addEventListener('change', () => {
      this._renderCategoryButtons();
      this._renderExerciseDropdown();
    });
  },

  _initCategoryButtons() {
    const container = document.getElementById('record-category-buttons');
    if (!container) return;

    container.innerHTML = '';

    const categories = (WTCore.safeGetState().categories || []);
    if (categories.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'カテゴリがありません';
      container.appendChild(emptyMsg);
      return;
    }

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.categoryId = cat.id;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => this._selectCategory(cat.id));
      container.appendChild(btn);
    });
  },

  _initExerciseDropdown() {
    const dropdown = document.getElementById('record-exercise-dropdown');
    if (!dropdown) return;

    this._renderExerciseDropdown();
  },

  _renderExerciseDropdown() {
    const dropdown = document.getElementById('record-exercise-dropdown');
    if (!dropdown) return;

    const selectedCatId = document.getElementById('record-selected-category')?.value || '';
    const date = document.getElementById('record-date')?.value || new Date().toISOString().slice(0, 10);
    const exercises = (WTCore.safeGetState().exercises || []);

    const filteredExercises = exercises
      .filter(ex => ex.categoryId === selectedCatId)
      .map(ex => ({ value: ex.id, label: `${ex.name} (${ex.weight}kg × ${ex.reps})` }));

    let options = '<option value="">種目を選択</option>';
    filteredExercises.forEach(ex => {
      options += `<option value="${ex.value}">${ex.label}</option>`;
    });

    dropdown.innerHTML = options;
  },

  _initSetsInputs() {
    const container = document.getElementById('record-sets-container');
    if (!container) return;

    for (let i = 1; i <= this._maxSets; i++) {
      const weightInput = document.getElementById(`record-set-${i}-weight`);
      const repsInput = document.getElementById(`record-set-${i}-reps`);
      if (weightInput && repsInput) {
        weightInput.value = '';
        repsInput.value = '';
      }
    }
  },

  _initSaveButton() {
    const btn = document.getElementById('record-save-btn');
    if (!btn) return;

    btn.addEventListener('click', () => this._saveRecord());
  },

  _selectCategory(categoryId) {
    const selectedEl = document.getElementById('record-selected-category');
    if (selectedEl) {
      selectedEl.value = categoryId;
    }
    this._renderExerciseDropdown();
    this._initSetsInputs();
  },

  _saveRecord() {
    const date = document.getElementById('record-date')?.value;
    const selectedCategoryId = document.getElementById('record-selected-category')?.value;

    if (!date) {
      alert('日付を選択してください');
      return;
    }

    if (!selectedCategoryId) {
      alert('カテゴリを選択してください');
      return;
    }

    const exercises = (WTCore.safeGetState().exercises || []);
    const selectedExercise = exercises.find(ex => ex.id === selectedCategoryId);
    if (!selectedExercise) {
      alert('種目を選択してください');
      return;
    }

    const sets = [];
    let hasValidSets = false;

    for (let i = 1; i <= this._maxSets; i++) {
      const weightInput = document.getElementById(`record-set-${i}-weight`);
      const repsInput = document.getElementById(`record-set-${i}-reps`);
      const weight = parseFloat(weightInput?.value);
      const reps = parseInt(repsInput?.value, 10);

      if (weight > 0 && reps > 0) {
        sets.push({
          id: `set-${i}`,
          weight: weight,
          reps: reps,
          notes: document.getElementById(`record-set-${i}-notes`)?.value || ''
        });
        hasValidSets = true;
      }
    }

    if (!hasValidSets) {
      alert('少なくとも 1 セットを入力してください');
      return;
    }

    const records = (WTCore.safeGetState().records || []);
    const newRecord = {
      id: `rec-${Date.now()}`,
      categoryId: selectedCategoryId,
      categoryName: selectedExercise.categoryName,
      exerciseName: selectedExercise.exerciseName,
      date: date,
      sets: sets,
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    WTCore.safeSetState({...WTCore.safeGetState(), records: records});

    this._clearInputs();
  },

  _clearInputs() {
    const dateInput = document.getElementById('record-date');
    const selectedEl = document.getElementById('record-selected-category');
    const dropdown = document.getElementById('record-exercise-dropdown');

    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    if (selectedEl) selectedEl.value = '';
    if (dropdown) dropdown.innerHTML = '<option value="">種目を選択</option>';

    for (let i = 1; i <= this._maxSets; i++) {
      const weightInput = document.getElementById(`record-set-${i}-weight`);
      const repsInput = document.getElementById(`record-set-${i}-reps`);
      const notesInput = document.getElementById(`record-set-${i}-notes`);

      if (weightInput) weightInput.value = '';
      if (repsInput) repsInput.value = '';
      if (notesInput) notesInput.value = '';
    }
  },

  _renderCategoryButtons() {
    const container = document.getElementById('record-category-buttons');
    if (!container) return;

    container.innerHTML = '';

    const categories = (WTCore.safeGetState().categories || []);
    if (categories.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'カテゴリがありません';
      container.appendChild(emptyMsg);
      return;
    }

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.categoryId = cat.id;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => this._selectCategory(cat.id));
      container.appendChild(btn);
    });
  }
};
window.WTRecord = WTRecord;
