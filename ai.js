let wllamaInstance = null;
let wllamaLoading = false;
let Wllama = null;
let lastModelFile = null;

import('./esm/index.js').then(function(m) {
    Wllama = m.Wllama;
    console.log('Wllama loaded:', !!Wllama);
});

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

    async function initWllama(file) {
        lastModelFile = file;
        if (wllamaInstance) return true;
        if (wllamaLoading) return false;
        if (!Wllama) { console.error("Wllama not loaded yet"); return false; }
        wllamaLoading = true;
        const comment = document.getElementById("ai-comment");
        comment.innerText = "モデル読み込み中...";
        try {
            wllamaInstance = new Wllama({
                "single-thread/wllama.js": "./esm/single-thread/wllama.js",
                "single-thread/wllama.wasm": "./esm/single-thread/wllama.wasm"
            });
            await wllamaInstance.loadModel([file], { n_ctx: 512 });
            comment.innerText = "モデル読み込み完了";
            wllamaLoading = false;
            return true;
        } catch(e) {
            comment.innerText = "エラー: " + e.message;
            console.error("WLLAMA ERROR:", e);
            wllamaInstance = null;
            wllamaLoading = false;
            return false;
        }
    }

    return {
        init: function() {
            this.updateTimerDisplay();
            const aiSection = document.getElementById("tab-content-ai");
            if (aiSection && !document.getElementById("wllama-file-input")) {
                const div = document.createElement("div");
                div.className = "ai-model-loader";
                div.innerHTML = '<input type="file" id="wllama-file-input" accept=".gguf"><button type="button" id="wllama-load-btn" style="background:none;border:none;color:#007aff;font-size:16px;padding:8px 4px;cursor:pointer">読み込む</button>';
                aiSection.appendChild(div);
                document.getElementById("wllama-load-btn").onclick = async () => {
                    const f = document.getElementById("wllama-file-input").files[0];
                    if (!f) return;
                    wllamaInstance = null;
                    const ok = await initWllama(f);
                    console.log("initWllama result:", ok);
                    if (ok) window.WTAI.callAI();
                };
            }
        },
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
        callAI: async function() {
            if (!wllamaInstance) return;
            const comment = document.getElementById("ai-comment");
            const topics = ["筋トレ","サボり","二度寝","食欲","怠惰","言い訳","腹筋","締め切り","二日酔い","ダイエット","月曜日","残業","風呂","財布","昼寝"];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            const prompt = "<|im_start|>user\n「" + topic + "」について世界の著名人、歴史上の人物や映画、小説の有名なセリフや名言と迷言を一つ日本語で。前置き不要。セリフと出典のみ。<|im_end|>\n<|im_start|>assistant\n";
            try {
                comment.innerText = "生成中...";
                await wllamaInstance.kvClear();
                if (wllamaInstance) { try { await wllamaInstance.exit(); } catch(e) {} }
                wllamaInstance = new Wllama({
                    "single-thread/wllama.js": "./esm/single-thread/wllama.js",
                    "single-thread/wllama.wasm": "./esm/single-thread/wllama.wasm"
                });
                await wllamaInstance.loadModel([lastModelFile], { n_ctx: 512, seed: Math.floor(Math.random() * 999999) });
                console.log("CALLING createCompletion");
                const text = await wllamaInstance.createCompletion(prompt, {
                    nPredict: 80,
                    useCache: false,
                    sampling: { temp: 1.0, top_k: 40, top_p: 0.95, min_p: 0.05, penalty_repeat: 1.1 }
                });
                console.log("RAW OUTPUT:", text);
                let output = text.replace(prompt, "").trim();
                output = output.replace(/```[\s\S]*?```/g,"").replace(/[#*`_~>]/g,"").trim();
                comment.innerText = output || text.trim();
                setTimeout(() => window.WTAI.callAI(), 20000);
            } catch(e) {
                comment.innerText = "エラー: " + e.message;
                console.error("callAI ERROR:", e);
                setTimeout(() => window.WTAI.callAI(), 20000);
            }
        }
    };
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { if (window.WTAI) window.WTAI.init(); });
} else {
    if (window.WTAI) window.WTAI.init();
}
