const AI = (() => {
  const API_URL = 'http://127.0.0.1:8082/v1/chat/completions';
  const SYSTEM_PROMPT = 'あなたはウエイトトレーニングのコーチです。短く一言で日本語で励ますコメントをしてください。';
  const TIMER_SECONDS = 300;
  let timerInterval = null;
  let lastExercise = null;
  let lastCompletion = false;
  let timerRestarted = false;

  function getState() {
    return WTCore.safeGetState();
  }

  function getExerciseName() {
    const state = getState();
    if (!state) return null;
    const currentSet = state.currentSet || {};
    return currentSet.exercise || null;
  }

  function isTrigger(state) {
    const currentExercise = getExerciseName();
    const completed = state.currentSet && state.currentSet.completed;
    const wasCompleted = lastCompletion;
    const wasExercise = lastExercise;

    if (completed !== wasCompleted) return true;
    if (currentExercise !== wasExercise) return true;
    return false;
  }

  function callAI() {
    const state = getState();
    if (!state) return;

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    const currentSet = state.currentSet || {};
    const message = `現在の運動：${currentSet.exercise || ''}`;
    messages.push({ role: 'user', content: message });

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'LFM2.5-350M-Q4_K_M.gguf', messages, max_tokens: 20 })
    }).then(res => res.json()).then(data => {
      if (data.choices && data.choices.length > 0) {
        const response = data.choices[0].message.content;
        displayAIResponse(response);
      }
    }).catch(() => {
      // silent fail
    });
  }

  function displayAIResponse(text) {
    const tab = document.getElementById('ai-tab');
    if (tab) {
      tab.textContent = text;
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerRestarted = false;
    lastExercise = getExerciseName();
    lastCompletion = !!getState().currentSet?.completed;

    timerInterval = setInterval(() => {
      if (!timerRestarted && isTrigger(getState())) {
        callAI();
        timerRestarted = true;
      }
    }, 30000);
  }

  function onCompletion() {
    if (isTrigger(getState())) {
      callAI();
    }
    startTimer();
  }

  function onExerciseChange() {
    if (isTrigger(getState())) {
      callAI();
    }
    startTimer();
  }

  function init() {
    const app = document.getElementById('wt-app');
    if (app) {
      app.addEventListener('completion', onCompletion);
      app.addEventListener('exercise-change', onExerciseChange);
    }
    startTimer();
  }

  return { init };
})();
window.WTAI = WTAI;
