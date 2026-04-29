let wllamaInstance = null;
let wllamaLoading = false;
let Wllama = null;
let lastModelFile = null;

import('./esm/index.js').then(function(m) {
    Wllama = m.Wllama;
    console.log('Wllama loaded:', !!Wllama);
});

window.WTAI = (function() {
    let elapsed = 0;
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
            elapsed = 0;
            timerInterval = setInterval(() => {
                elapsed++;
                this.updateTimerDisplay();
            }, 1000);
        },
        _reset: function() { currentExerciseIndex = 0; completedSets = 0; renderExerciseList(); },
        completeSet: function() {
            completedSets++;
            if (completedSets >= 3) { completedSets = 0; currentExerciseIndex++; }
            renderExerciseList();
        },
        updateTimerDisplay: function() {
            const display = document.getElementById("ai-timer-display");
            const ring = document.getElementById("ai-timer-ring");
            if (!display) return;
            const REST = 300;
            const CIRC = 565;
            if (elapsed <= REST) {
                const remaining = REST - elapsed;
                const m = Math.floor(remaining / 60);
                const s = remaining % 60;
                display.style.color = "#1c1c1e";
                display.innerText = m + ":" + String(s).padStart(2, "0");
                if (ring) {
                    const offset = CIRC * (1 - remaining / REST);
                    ring.style.stroke = "#007aff";
                    ring.setAttribute("stroke-dashoffset", offset);
                }
            } else {
                const over = elapsed - REST;
                const m = Math.floor(over / 60);
                const s = over % 60;
                display.style.color = "#ff3b30";
                display.innerText = m + ":" + String(s).padStart(2, "0");
                if (ring) {
                    ring.style.stroke = "#ff3b30";
                    ring.setAttribute("stroke-dashoffset", CIRC);
                }
            }
        },
        stopAI: function() {
            this._aiStopped = true;
            if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
        },
        resumeAI: function() {
            this._aiStopped = false;
            if (wllamaInstance) this.callAI();
        },
        callAI: async function() {
            if (this._aiStopped) return;
            if (!wllamaInstance) return;
            const comment = document.getElementById("ai-comment");
            const topics = ["筋トレ","プロテイン","腹筋","スクワット","ランニング","ダイエット","糖質","脂肪燃焼","筋肉","体重","食事制限","有酸素運動","無酸素運動","基礎代謝","体脂肪"];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            const prompt = "<|im_start|>user\n「" + topic + "」について、20文字以50文字以内で面白いウソ情報を作って。最後に「知ってた？」をつけて<|im_end|>\n<|im_start|>assistant\n";
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
                    nPredict: 40,
                    useCache: false,
                    sampling: { temp: 1.5, top_k: 40, top_p: 0.95, min_p: 0.05, penalty_repeat: 1.1 }
                });
                console.log("RAW OUTPUT:", text);
                let output = text.replace(prompt, "").trim();
                output = output.replace(/```[\s\S]*?```/g,"").replace(/[#*`_~>]/g,"").trim();
                output = output || text.trim();
                // 最初の文だけ抽出して語尾を付ける
                output = output.split(/[\u3002\uff01\uff1f]/)[0].trim();
                if (output) output = output + "\u306a\u3093\u3060\u3063\u3066\u3001\u77e5\u3063\u3066\u305f\uff1f";
                comment.innerText = "";
                let i = 0;
                const tw = setInterval(() => {
                    if (this._aiStopped) { clearInterval(tw); return; }
                    if (i < output.length) { comment.innerText += output[i]; i++; }
                    else { clearInterval(tw); this._aiTimer = setTimeout(() => window.WTAI.callAI(), 20000); }
                }, 80);
            } catch(e) {
                comment.innerText = "エラー: " + e.message;
                console.error("callAI ERROR:", e);
                this._aiTimer = setTimeout(() => window.WTAI.callAI(), 20000);
            }
        }
    };
})();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { if (window.WTAI) window.WTAI.init(); });
} else {
    if (window.WTAI) window.WTAI.init();
}
