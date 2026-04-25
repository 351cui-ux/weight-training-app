// Settings Module - Category & Exercise Management
(function() {
  'use strict';

  // DOM Elements cache
  let categoryForm = null;
  let exerciseForm = null;
  let exerciseSelect = null;
  let reorderButtons = null;
  let analysisMonthsInput = null;

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render category list with CRUD controls
   */
  function renderCategories() {
    const container = document.getElementById('categoriesList');
    const categories = WTCore.safeGetState().categories || [];

    if (!container) return;

    container.innerHTML = categories.map((cat, index) => `
      <div class="category-item" data-index="${index}">
        <span class="category-name">${escapeHtml(cat.name)}</span>
        <button class="btn-icon btn-edit" data-action="edit-category" data-index="${index}">✏️</button>
        <button class="btn-icon btn-delete" data-action="delete-category" data-index="${index}">🗑️</button>
      </div>
    `).join('') + `
      <div class="category-item category-new">
        <input type="text" id="newCategoryName" placeholder="New category name" class="category-input">
        <button class="btn-primary btn-add" data-action="add-category">Add</button>
      </div>
    `;
  }

  /**
   * Render exercise list with CRUD and reorder controls
   */
  function renderExercises() {
    const container = document.getElementById('exercisesList');
    const exercises = WTCore.safeGetState().exercises || [];
    const categories = WTCore.safeGetState().categories || [];

    if (!container) return;

    const categoriesOptions = categories.map(cat => `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join('');

    container.innerHTML = exercises.map((ex, index) => `
      <div class="exercise-item" data-index="${index}">
        <div class="exercise-reorder">
          <button class="btn-icon btn-up" data-action="move-up" data-index="${index}">↑</button>
          <button class="btn-icon btn-down" data-action="move-down" data-index="${index}">↓</button>
        </div>
        <div class="exercise-content">
          <input type="text" class="exercise-name-input" data-index="${index}" value="${escapeHtml(ex.name)}">
          <select class="exercise-category-select" data-index="${index}">
            ${categoriesOptions}
          </select>
        </div>
        <div class="exercise-actions">
          <button class="btn-icon btn-edit" data-action="edit-exercise" data-index="${index}">✏️</button>
          <button class="btn-icon btn-delete" data-action="delete-exercise" data-index="${index}">🗑️</button>
        </div>
      </div>
    `).join('') + `
      <div class="exercise-item exercise-new">
        <div class="exercise-reorder">
          <button class="btn-icon btn-up" disabled>↑</button>
          <button class="btn-icon btn-down" disabled>↓</button>
        </div>
        <div class="exercise-content">
          <input type="text" id="newExerciseName" placeholder="New exercise name" class="exercise-name-input">
          <select id="newExerciseCategory" class="exercise-category-select">
            ${categoriesOptions}
          </select>
        </div>
        <div class="exercise-actions">
          <button class="btn-primary btn-add" data-action="add-exercise">Add</button>
        </div>
      </div>
    `;
  }

  /**
   * Add a new category
   */
  function addCategory() {
    const input = document.getElementById('newCategoryName');
    if (input && input.value.trim()) {
      const state = WTCore.safeGetState();
      const categories = state.categories || [];
      categories.push({ id: 'cat-' + Date.now(), name: input.value.trim() });
      WTCore.safeSetState({ categories, exercises: state.exercises, records: state.records, settings: state.settings });
      input.value = '';
      renderCategories();
      renderExercises();
      if (window.WTRecord) WTRecord.init();
    }
  }

  /**
   * Edit a category name
   */
  function editCategory(index, name) {
    if (index >= 0 && index < (WTCore.safeGetState().categories || []).length) {
      const state = WTCore.safeGetState();
      const categories = state.categories || [];
      categories[index].name = name;
      WTCore.safeSetState({ categories, exercises: state.exercises, records: state.records, settings: state.settings });
      renderCategories();
      renderExercises();
      if (window.WTRecord) WTRecord.init();
    }
  }

  /**
   * Delete a category
   */
  function deleteCategory(index) {
    if (index >= 0 && index < (WTCore.safeGetState().categories || []).length) {
      const state = WTCore.safeGetState();
      const categories = state.categories || [];
      categories.splice(index, 1);
      WTCore.safeSetState({ categories, exercises: state.exercises, records: state.records, settings: state.settings });
      renderCategories();
      renderExercises();
      if (window.WTRecord) WTRecord.init();
    }
  }

  /**
   * Add a new exercise
   */
  function addExercise() {
    const nameInput = document.getElementById('newExerciseName');
    const categorySelect = document.getElementById('newExerciseCategory');
    const name = nameInput ? nameInput.value.trim() : '';
    const category = categorySelect ? categorySelect.value : '';

    if (name) {
      const state = WTCore.safeGetState();
      const exercises = state.exercises || [];
      const cats = WTCore.safeGetState().categories || []; const catObj = cats.find(c => c.name === category); exercises.push({ id: 'ex-' + Date.now(), name: name, categoryId: catObj ? catObj.id : category, category: category });
      WTCore.safeSetState({ categories: state.categories, exercises, records: state.records, settings: state.settings });
      if (nameInput) nameInput.value = '';
      if (categorySelect) categorySelect.value = '';
      renderExercises();
    }
  }

  /**
   * Edit an exercise
   */
  function editExercise(index, name, category) {
    if (index >= 0 && index < (WTCore.safeGetState().exercises || []).length) {
      const state = WTCore.safeGetState();
      const exercises = state.exercises || [];
      exercises[index] = { name, category };
      WTCore.safeSetState({ categories: state.categories, exercises, records: state.records, settings: state.settings });
      renderExercises();
    }
  }

  /**
   * Delete an exercise
   */
  function deleteExercise(index) {
    if (index >= 0 && index < (WTCore.safeGetState().exercises || []).length) {
      const state = WTCore.safeGetState();
      const exercises = state.exercises || [];
      exercises.splice(index, 1);
      WTCore.safeSetState({ categories: state.categories, exercises, records: state.records, settings: state.settings });
      renderExercises();
    }
  }

  /**
   * Move an exercise up or down
   */
  function moveExercise(index, direction) {
    const exercises = WTCore.safeGetState().exercises || [];
    const newIndex = index + direction;

    if (newIndex >= 0 && newIndex < exercises.length) {
      const temp = exercises[index];
      exercises[index] = exercises[newIndex];
      exercises[newIndex] = temp;
      WTCore.safeSetState({ categories: WTCore.safeGetState().categories, exercises, records: WTCore.safeGetState().records, settings: WTCore.safeGetState().settings });
      renderExercises();
    }
  }

  /**
   * Update analysis months setting
   */
  function updateAnalysisMonths(months) {
    const monthsNum = parseInt(months);
    if (!isNaN(monthsNum) && monthsNum > 0 && monthsNum <= 12) {
      const state = WTCore.safeGetState();
      WTCore.safeSetState({ categories: state.categories, exercises: state.exercises, records: state.records, settings: { ...state.settings, analysisMonths: monthsNum } });
    }
  }

  /**
   * Attach category event listeners
   */
  function attachCategoryListeners() {
    document.addEventListener('click', (e) => {
      // Add category
      if (e.target.closest('[data-action="add-category"]')) {
        e.preventDefault();
        addCategory();
      }

      // Edit category
      if (e.target.closest('[data-action="edit-category"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="edit-category"]');
        const index = parseInt(btn.dataset.index);
        const name = document.querySelector(`[data-index="${index}"] .category-name`).textContent;
        editCategory(index, name);
      }

      // Delete category
      if (e.target.closest('[data-action="delete-category"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="delete-category"]');
        const index = parseInt(btn.dataset.index);
        deleteCategory(index);
      }

      // Add exercise
      if (e.target.closest('[data-action="add-exercise"]')) {
        e.preventDefault();
        addExercise();
      }

      // Edit exercise
      if (e.target.closest('[data-action="edit-exercise"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="edit-exercise"]');
        const index = parseInt(btn.dataset.index);
        const exerciseItem = document.querySelector(`[data-index="${index}"]`);
        const name = exerciseItem.querySelector('.exercise-name-input').value;
        const category = exerciseItem.querySelector('.exercise-category-select').value;
        editExercise(index, name, category);
      }

      // Delete exercise
      if (e.target.closest('[data-action="delete-exercise"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="delete-exercise"]');
        const index = parseInt(btn.dataset.index);
        deleteExercise(index);
      }

      // Move exercise up
      if (e.target.closest('[data-action="move-up"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="move-up"]');
        const index = parseInt(btn.dataset.index);
        moveExercise(index, -1);
      }

      // Move exercise down
      if (e.target.closest('[data-action="move-down"]')) {
        e.preventDefault();
        const btn = e.target.closest('[data-action="move-down"]');
        const index = parseInt(btn.dataset.index);
        moveExercise(index, 1);
      }

      // Enter key on name inputs
      if (e.target.tagName === 'INPUT' && (e.target.id === 'newCategoryName' || e.target.classList.contains('category-input'))) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCategory();
        }
      }

      if (e.target.tagName === 'INPUT' && (e.target.id === 'newExerciseName' || e.target.classList.contains('exercise-name-input'))) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addExercise();
        }
      }
    });

    // Analysis months change handler
    const analysisMonthsInput = document.getElementById('analysisMonths');
    if (analysisMonthsInput) {
      analysisMonthsInput.addEventListener('change', () => {
        updateAnalysisMonths(analysisMonthsInput.value);
      });
    }

    // Live update for category name input
    const newCategoryInput = document.getElementById('newCategoryName');
    if (newCategoryInput) {
      newCategoryInput.addEventListener('blur', () => {
        if (newCategoryInput.value.trim()) {
          addCategory();
        }
      });
    }
  }

  /**
   * Initialize settings tab
   */
  function init() {
    renderCategories();
    renderExercises();
    attachCategoryListeners();

    // Set up analysis months input
    const analysisInput = document.getElementById('analysisMonths');
    const currentSettings = WTCore.safeGetState().settings || {};
    if (analysisInput) {
      analysisInput.value = currentSettings.analysisMonths || 6;
    }

    // Enable live update on name field changes
    const categoryInputs = document.querySelectorAll('.category-input, .exercise-name-input');
    categoryInputs.forEach(input => {
      input.addEventListener('blur', function() {
        const index = this.dataset ? this.dataset.index : -1;
        if (this.id === 'newCategoryName') {
          addCategory();
        } else if (this.classList.contains('exercise-name-input') && index >= 0) {
          const exerciseItem = document.querySelector(`[data-index="${index}"]`);
          if (exerciseItem) {
            const category = exerciseItem.querySelector('.exercise-category-select').value;
            editExercise(index, this.value, category);
          }
        }
      });
    });
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.WTSettings = { init: init };
})();