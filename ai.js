window.WTAI = (function() {
    let remaining = 300;
    let startTime = null;
    let timerInterval = null;
    let currentExerciseIndex = 0;
    let completedSets = 0;
    const now = () => new Date().getTime();
    function getExercises() {
        const catId = WTRecord._selectedCategoryId;
        if (!catId) return [];
        return (WTCore.safeGetState().exercises || []).filter(ex => ex.categoryId === catId);
    }
    function renderExerciseList() {
        const container = document.getElementById("ai-exercise-list");
        if (!container) return;
        const exercises = getExercises();
        if (!exercises.length) { container.innerHTML = "<p>今日の記録タブでカテゴリを選択してください</p>"; return; }
        const ex = exercises[currentExerciseIndex];
        if (!ex) { container.innerHTML = "<p>全種目完了！</p>"; return; }
        container.innerHTML = "<div style='padding:16px;border-radius:8px;background:#007aff;color:#fff;font-weight:bold;font-size:24px;text-align:center'>" + ex.name + "<br><span style='font-size:16px'>" + completedSets + "/3セット</span></div>";
    }
    return {
        init: function() { this.updateTimerDisplay(); this.callAI(); },
        startTimer: function() {
            renderExerciseList();
            if (timerInterval) clearInterval(timerInterval);
            startTime = now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((now() - startTime) / 1000);
                remaining = Math.max(0, 300 - elapsed);
                this.updateTimerDisplay();
                if (remaining === 0) { startTime = now(); remaining = 300; }
            }, 500);
        },
        _reset: function() { currentExerciseIndex = 0; completedSets = 0; renderExerciseList(); },
        completeSet: function() {
            completedSets++;
            if (completedSets >= 3) { completedSets = 0; currentExerciseIndex++; }
            renderExerciseList();
        },
        updateTimerDisplay: function() {
            const display = document.getElementById("ai-timer-display");
            if (!display) return;
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            display.style.transition = "all 0.5s";
            if (remaining % 60 === 0 || remaining === 300) {
                display.style.fontSize = "160px"; display.style.fontWeight = "bold"; display.style.color = "#ff4444";
            } else {
                display.style.fontSize = "72px"; display.style.fontWeight = "normal"; display.style.color = "#00aa00";
            }
            display.innerText = m + ":" + String(s).padStart(2, "0");
        },
        callAI: function() {
            const prompt = "世界の著名人、歴史上の人物や映画、小説の有名なセリフや名言と出典を一つだけ出力して。前置き・説明・リスト不要。セリフ本文と出典のみ。日本語で。";
            fetch("/llama/v1/chat/completions", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({model:"local",messages:[{role:"user",content:prompt}],max_tokens:100})
            }).then(r=>r.json()).then(d=>{
                const comment = document.getElementById("ai-comment");
                const text = d.choices[0].message.content; comment.innerText = ""; let i = 0; const t = setInterval(() => { if(i < text.length){ comment.innerText += text[i++]; } else { clearInterval(t); } }, 50);
                setTimeout(() => window.WTAI.callAI(), 30000);
            }).catch(() => { setTimeout(() => window.WTAI.callAI(), 30000); });
        }
    };
})();
