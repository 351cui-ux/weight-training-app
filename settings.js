// Settings Module
(function() {
  function escapeHtml(t) {
    const d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML;
  }

  function renderCategories() {
    const container = document.getElementById("categoriesList");
    const state = WTCore.safeGetState();
    const cats = state.categories || [];
    container.innerHTML =
      "<details><summary style=cursor:pointer;padding:8px>カテゴリ一覧 (" + cats.length + ")</summary>" +
      cats.map((cat, i) =>
        "<div style=padding:8px;display:flex;gap:8px;align-items:center>" +
        "<span style=flex:1>" + escapeHtml(cat.name) + "</span>" +
        "<button onclick=WTSettings.deleteCategory(" + i + ")>削除</button></div>"
      ).join("") +
      "</details>" +
      "<div style=margin-top:8px;display:flex;gap:8px>" +
      "<input id=newCategoryName placeholder=カテゴリ名 style='flex:1;min-width:120px'>" +
      "<button onclick=WTSettings.addCategory()>+</button></div>";
  }

  function renderExercises() {
    const container = document.getElementById("exercisesList");
    const state = WTCore.safeGetState();
    const exercises = state.exercises || [];
    const categories = state.categories || [];
    const catOpts = (selId) => categories.map(c =>
      "<option value=" + c.id + (c.id === selId ? " selected" : "") + ">" + escapeHtml(c.name) + "</option>"
    ).join("");
    const byCategory = categories.map(cat => {
      const exs = exercises.filter(ex => ex.categoryId === cat.id);
      const items = exs.map(ex => {
        const i = exercises.indexOf(ex);
        return "<div style=padding:8px;display:flex;gap:4px;align-items:center>" +
          "<span style=flex:1>" + escapeHtml(ex.name) + "</span>" +
          "<button onclick=WTSettings.moveExercise(" + i + ",-1)>↑</button>" +
          "<button onclick=WTSettings.moveExercise(" + i + ",1)>↓</button>" +
          "<button onclick=WTSettings.editExercise(" + i + ")>編集</button>" +
          "<button onclick=WTSettings.deleteExercise(" + i + ")>削除</button></div>";
      }).join("");
      return "<details><summary style=cursor:pointer;padding:8px>" + escapeHtml(cat.name) + " (" + exs.length + ")</summary>" + items + "</details>";
    }).join("");
    const catSelect = "<select id=newExCatSelect>" + catOpts("") + "</select>";
    container.innerHTML = byCategory +
      "<div style=margin-top:8px;display:flex;gap:8px;align-items:center>" +
      "<input id=newExerciseName placeholder=種目名 style='flex:3;min-width:200px'>" +
      catSelect +
      "<button onclick=WTSettings.addExercise()>+</button></div>";
  }

  function init() {
    renderCategories();
    renderExercises();
    const analysisInput = document.getElementById("analysisMonths");
    const settings = WTCore.safeGetState().settings || {};
    if (analysisInput) {
      analysisInput.value = settings.analysisMonths || 6;
      analysisInput.onchange = () => {
        const state = WTCore.safeGetState();
        WTCore.safeSetState({...state, settings: {...state.settings, analysisMonths: parseInt(analysisInput.value)}});
      };
    }
  }

  window.WTSettings = {
    init,
    addCategory() {
      const input = document.getElementById("newCategoryName");
      const state = WTCore.safeGetState();
      const categories = [...(state.categories || []), {id: "cat-" + Date.now(), name: input.value.trim()}];
      WTCore.safeSetState({...state, categories});
      input.value = "";
      renderCategories(); renderExercises();
      if (window.WTRecord) WTRecord._renderCategoryButtons();
    },
    deleteCategory(i) {
      const state = WTCore.safeGetState();
      const categories = state.categories || [];
      categories.splice(i, 1);
      WTCore.safeSetState({...state, categories});
      renderCategories(); renderExercises();
      if (window.WTRecord) WTRecord._renderCategoryButtons();
    },
    addExercise() {
      const nameInput = document.getElementById("newExerciseName");
      const catSel = document.getElementById("newExCatSelect");
      const state = WTCore.safeGetState();
      const catId = catSel ? catSel.value : (state.categories[0] ? state.categories[0].id : "");
      const cat = (state.categories || []).find(c => c.id === catId);
      const exercises = [...(state.exercises || []), {id: "ex-" + Date.now(), name: nameInput.value.trim(), categoryId: catId, category: cat ? cat.name : ""}];
      WTCore.safeSetState({...state, exercises});
      nameInput.value = "";
      renderExercises();
    },
    editExercise(i) {
      const state = WTCore.safeGetState();
      const ex = state.exercises[i];
      const name = prompt("種目名", ex.name);
      state.exercises[i].name = name.trim();
      WTCore.safeSetState(state);
      renderExercises();
    },
    deleteExercise(i) {
      const state = WTCore.safeGetState();
      state.exercises.splice(i, 1);
      WTCore.safeSetState(state);
      renderExercises();
    },
    moveExercise(i, dir) {
      const state = WTCore.safeGetState();
      const exercises = state.exercises || [];
      const j = i + dir;
      if (j < 0 || j >= exercises.length) return;
      [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
      WTCore.safeSetState({...state, exercises});
      renderExercises();
    }
  };
})();
