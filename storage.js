(function() {
  'use strict';

  const STORAGE_KEY = 'wt_app';
  const STORAGE_VERSION = 1;

  function getStorageData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  }

  function setStorageData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function initStorage() {
    let data = getStorageData();
    if (!data) {
      data = {
        version: STORAGE_VERSION,
        categories: [],
        exercises: [],
        records: [],
        settings: {
          analysisMonths: 6
        }
      };
    }
    return data;
  }

  // カテゴリ管理
  WTStorage = {
    saveCategory: function(name) {
      const data = initStorage();
      const newCategory = {
        id: generateId(),
        name: name
      };
      data.categories.push(newCategory);
      return setStorageData(data) ? newCategory.id : null;
    },

    getCategory: function(id) {
      const data = initStorage();
      return data.categories.find(cat => cat.id === id) || null;
    },

    getCategories: function() {
      const data = initStorage();
      return data.categories || [];
    },

    findCategoryByName: function(name) {
      const data = initStorage();
      return data.categories.find(cat => cat.name === name) || null;
    },

    deleteCategory: function(id) {
      const data = initStorage();
      const categoryIndex = data.categories.findIndex(cat => cat.id === id);
      if (categoryIndex === -1) {
        return false;
      }
      data.exercises = data.exercises.filter(ex => ex.categoryId !== id);
      data.categories.splice(categoryIndex, 1);
      return setStorageData(data);
    },

    updateCategory: function(id, name) {
      const data = initStorage();
      const category = data.categories.find(cat => cat.id === id);
      if (!category) {
        return false;
      }
      category.name = name;
      return setStorageData(data);
    }
  };

  // 種目管理
  WTStorage.exercise = {
    save: function(name, categoryId, order) {
      const data = initStorage();
      const newExercise = {
        id: generateId(),
        name: name,
        categoryId: categoryId,
        order: order || data.exercises.length
      };
      data.exercises.push(newExercise);
      return setStorageData(data) ? newExercise.id : null;
    },

    get: function(id) {
      const data = initStorage();
      return data.exercises.find(ex => ex.id === id) || null;
    },

    getAll: function(categoryId) {
      const data = initStorage();
      if (categoryId) {
        return data.exercises.filter(ex => ex.categoryId === categoryId).sort((a, b) => a.order - b.order);
      }
      return data.exercises.sort((a, b) => a.order - b.order);
    },

    findByName: function(name) {
      const data = initStorage();
      return data.exercises.find(ex => ex.name === name) || null;
    },

    delete: function(id) {
      const data = initStorage();
      const exerciseIndex = data.exercises.findIndex(ex => ex.id === id);
      if (exerciseIndex === -1) {
        return false;
      }
      const exerciseId = data.exercises[exerciseIndex].id;
      data.records = data.records.filter(rec => rec.exerciseId !== exerciseId);
      data.exercises.splice(exerciseIndex, 1);
      return setStorageData(data);
    },

    update: function(id, name) {
      const data = initStorage();
      const exercise = data.exercises.find(ex => ex.id === id);
      if (!exercise) {
        return false;
      }
      exercise.name = name;
      return setStorageData(data);
    },

    updateOrder: function(id, order) {
      const data = initStorage();
      const exercise = data.exercises.find(ex => ex.id === id);
      if (!exercise) {
        return false;
      }
      exercise.order = order;
      return setStorageData(data);
    }
  };

  // 記録管理
  WTStorage.record = {
    save: function(date, exerciseId, sets) {
      const data = initStorage();
      const existingRecordIndex = data.records.findIndex(
        rec => rec.date === date && rec.exerciseId === exerciseId
      );

      if (existingRecordIndex !== -1) {
        data.records[existingRecordIndex] = {
          id: data.records[existingRecordIndex].id,
          date: date,
          exerciseId: exerciseId,
          sets: sets
        };
      } else {
        const newRecord = {
          id: generateId(),
          date: date,
          exerciseId: exerciseId,
          sets: sets
        };
        data.records.push(newRecord);
      }
      return setStorageData(data) ? (existingRecordIndex !== -1 ? data.records[existingRecordIndex].id : newRecord.id) : null;
    },

    get: function(date, exerciseId) {
      const data = initStorage();
      return data.records.find(rec => rec.date === date && rec.exerciseId === exerciseId) || null;
    },

    getAllRecords: function(exerciseId) {
      const data = initStorage();
      if (exerciseId) {
        return data.records.filter(rec => rec.exerciseId === exerciseId).sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      return data.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    delete: function(date, exerciseId) {
      const data = initStorage();
      const recordIndex = data.records.findIndex(rec => rec.date === date && rec.exerciseId === exerciseId);
      if (recordIndex === -1) {
        return false;
      }
      data.records.splice(recordIndex, 1);
      return setStorageData(data);
    },

    clearDate: function(date, exerciseId) {
      const data = initStorage();
      const records = data.records.filter(rec => !(rec.date === date && rec.exerciseId === exerciseId));
      if (records.length === data.records.length) {
        return false;
      }
      data.records = records;
      return setStorageData(data);
    }
  };

  // 設定管理
  WTStorage.settings = {
    get: function(key) {
      const data = initStorage();
      return data.settings[key] !== undefined ? data.settings[key] : null;
    },

    set: function(key, value) {
      const data = initStorage();
      data.settings[key] = value;
      return setStorageData(data);
    },

    getAnalysisMonths: function() {
      return this.get('analysisMonths');
    },

    setAnalysisMonths: function(months) {
      return this.set('analysisMonths', months);
    }
  };

  // データの初期化
  initStorage();

})();