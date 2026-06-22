// ==UserScript==
// @name         CourseChooseBoom
// @namespace    course-choose-boom
// @version      1.0
// @description  西电选课系统抢课脚本 — 打开页面即用，课程配置自动保存
// @author       CourseChooseBoom
// @match        https://xk.xidian.edu.cn/xsxk/elective/grablessons*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    // ===================== 常量 =====================
    const LS_KEY = "ccb_courses";
    const PANEL_ID = "ccb-panel";
    const LOG_MAX = 200; // 日志最多保留条数

    // ===================== 样式注入 =====================
    function injectStyles() {
        const css = `
#${PANEL_ID} {
    position: fixed; right: 20px; top: 100px; z-index: 99999;
    width: 340px; max-height: 85vh;
    background: #fff; border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.1);
    font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex; flex-direction: column; overflow: hidden;
    user-select: none;
}
.ccp-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px; background: linear-gradient(135deg, #2655c8, #1a3f9e);
    color: #fff; cursor: move; font-weight: 600; font-size: 14px;
}
.ccp-hdr-btn {
    background: none; border: none; color: #fff; cursor: pointer;
    font-size: 16px; width: 24px; height: 24px; line-height: 24px;
    text-align: center; border-radius: 4px; margin-left: 2px;
}
.ccp-hdr-btn:hover { background: rgba(255,255,255,.2); }
.ccp-body { padding: 12px 14px; overflow-y: auto; flex: 1; }
.ccp-row { display: flex; gap: 6px; margin-bottom: 8px; align-items: center; }
.ccp-row-sm { margin-bottom: 6px; }
.ccp-input {
    flex: 1; padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 6px;
    font-size: 12px; outline: none; box-sizing: border-box;
}
.ccp-input:focus { border-color: #2655c8; }
.ccp-select {
    padding: 4px 8px; border: 1px solid #dcdfe6; border-radius: 6px;
    font-size: 12px; outline: none; background: #fff;
}
.ccp-btn {
    padding: 7px 14px; border: none; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600; white-space: nowrap;
    transition: all .15s;
}
.ccp-btn:hover { transform: translateY(-1px); }
.ccp-btn:active { transform: translateY(0); }
.ccp-btn-sm { padding: 6px 10px; font-size: 11px; }
.ccp-btn-go { background: #2655c8; color: #fff; }
.ccp-btn-go:hover { background: #1a3f9e; }
.ccp-btn-stop { background: #f56c6c; color: #fff; }
.ccp-btn-stop:hover { background: #e04545; }
.ccp-btn-warn { background: #e6a23c; color: #fff; }
.ccp-btn-warn:hover { background: #cf9236; }

.ccb-course-list {
    border: 1px solid #ebeef5; border-radius: 6px; margin-bottom: 8px;
    max-height: 200px; overflow-y: auto; background: #fafbfc;
}
.ccb-course-item {
    display: flex; align-items: center; padding: 7px 10px;
    border-bottom: 1px solid #ebeef5; cursor: grab; gap: 8px;
    transition: background .15s;
}
.ccb-course-item:last-child { border-bottom: none; }
.ccb-course-item:hover { background: #ecf5ff; }
.ccb-course-item.ccb-dragging { opacity: .4; background: #f0f2f5; }
.ccb-course-item.ccb-grabbed { background: #f0f9eb; color: #67c23a; }
.ccb-course-item.ccb-skipped { background: #fef7e8; color: #e6a23c; }
.ccb-course-item.ccb-active { background: #ecf5ff; border-left: 3px solid #2655c8; }
.ccb-course-code { font-weight: 700; font-family: monospace; font-size: 13px; min-width: 80px; }
.ccb-course-name { flex: 1; color: #606266; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ccb-badge {
    display: inline-block; width: 18px; height: 18px; line-height: 18px;
    text-align: center; border-radius: 50%; color: #fff; font-size: 11px;
}
.ccb-badge-ok { background: #67c23a; }
.ccb-badge-skip { background: #e6a23c; }
.ccb-course-del {
    background: none; border: none; color: #c0c4cc; cursor: pointer;
    font-size: 16px; width: 22px; height: 22px; line-height: 22px; text-align: center;
    border-radius: 4px; flex-shrink: 0;
}
.ccb-course-del:hover { color: #f56c6c; background: #fef0f0; }

.ccp-progress-bar {
    width: 100%; height: 6px; background: #ebeef5; border-radius: 3px;
    margin-bottom: 4px; overflow: hidden;
}
.ccp-progress-fill {
    height: 100%; background: linear-gradient(90deg, #67c23a, #409eff);
    border-radius: 3px; transition: width .3s; width: 0%;
}
.ccp-progress-text { font-size: 11px; color: #909399; margin-bottom: 6px; }

.ccb-log {
    background: #1e1e1e; color: #d4d4d4; border-radius: 6px;
    padding: 8px 10px; font-size: 11px; font-family: monospace;
    max-height: 180px; overflow-y: auto; line-height: 1.5;
}
.ccb-log-item { padding: 1px 0; }
.ccb-log-info  { color: #d4d4d4; }
.ccb-log-found { color: #569cd6; }
.ccb-log-success { color: #4ec9b0; }
.ccb-log-warn  { color: #ce9178; }
.ccb-log-error { color: #f44747; }

#ccb-reopen {
    position: fixed; right: 20px; bottom: 20px; z-index: 99998;
    width: 42px; height: 42px; border-radius: 50%; border: none;
    background: #2655c8; color: #fff; font-size: 18px;
    cursor: pointer; box-shadow: 0 4px 16px rgba(38,85,200,.4);
    transition: transform .15s;
}
#ccb-reopen:hover { transform: scale(1.1); }
`;
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ===================== 状态 =====================
    let courses = []; // { code, name, note }
    let interval = 800;
    let running = false;
    let stopped = false;
    let attempts = 0;
    let grabbed = []; // [code, ...] 真正抢到的
    let skipped = []; // [code, ...] 被跳过的
    let currentIdx = 0; // 当前正在抢的课程索引
    let consecutiveFails = 0; // 连续失败计数 → 智能退避
    const MAX_BACKOFF = 5000; // 退避间隔上限
    let audioCtx = null;

    // ===================== 初始化音频 =====================
    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (_) {
            /* no audio */
        }
    }

    function beep(happy) {
        if (!audioCtx) return;
        try {
            const notes = happy ? [800, 1000, 1200, 1600] : [500, 400, 300];
            notes.forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.value = f;
                o.type = "square";
                g.gain.value = 0.1;
                o.start(audioCtx.currentTime + i * 0.12);
                o.stop(audioCtx.currentTime + i * 0.12 + 0.09);
            });
        } catch (_) {
            /* */
        }
    }

    // ===================== localStorage =====================
    function loadConfig() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                courses = data.courses || [];
                interval = data.interval || 800;
                return;
            }
        } catch (_) {
            /* */
        }
        // 默认课程（首次使用）
        courses = [
            { code: "24IC7242", name: "", note: "电子数据取证基础" },
            { code: "24TS2005", name: "", note: "平面设计艺术与实践" },
            { code: "24TS1218", name: "", note: "道家哲学与文化" },
            { code: "24TS1248", name: "", note: "神话故事与中国传统文化" },
            { code: "24TS4206", name: "", note: "知识产权入门指南" },
        ];
    }

    function saveConfig() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ courses, interval }));
        } catch (_) {
            /* */
        }
    }

    // ===================== 日志 =====================
    function log(msg, type) {
        const el = document.getElementById("ccb-log");
        if (!el) return;
        const now = new Date();
        const ts =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0") +
            ":" +
            String(now.getSeconds()).padStart(2, "0");
        const div = document.createElement("div");
        div.className = "ccb-log-item ccb-log-" + (type || "info");
        div.textContent = ts + " " + msg;
        el.appendChild(div);
        // 限制日志条数
        while (el.children.length > LOG_MAX) el.firstChild.remove();
        el.scrollTop = el.scrollHeight;
    }

    // ===================== UI 更新 =====================
    function renderCourseList() {
        const el = document.getElementById("ccb-course-list");
        if (!el) return;
        el.innerHTML = courses
            .map((c, i) => {
                const displayName = c.name || c.note || "";
                const isGrabbed = grabbed.includes(c.code);
                const isSkipped = skipped.includes(c.code);
                const doneClass = isGrabbed ? " ccb-grabbed" : isSkipped ? " ccb-skipped" : "";
                const activeClass =
                    running && i === currentIdx && !isGrabbed && !isSkipped ? " ccb-active" : "";
                let badge = "";
                if (isGrabbed) badge = '<span class="ccb-badge ccb-badge-ok">✓</span>';
                else if (isSkipped) badge = '<span class="ccb-badge ccb-badge-skip">⏭</span>';
                return `
                <div class="ccb-course-item${doneClass}${activeClass}" draggable="true" data-idx="${i}">
                    <span class="ccb-course-code">${c.code}</span>
                    <span class="ccb-course-name">${displayName}</span>
                    ${badge}
                    <button class="ccb-course-del" data-idx="${i}" title="删除">×</button>
                </div>`;
            })
            .join("");

        // 删除按钮事件
        el.querySelectorAll(".ccb-course-del").forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.idx);
                const c = courses[idx];
                courses.splice(idx, 1);
                saveConfig();
                renderCourseList();
                updateProgress();
                log("已移除: " + c.code);
            });
        });

        // 拖拽排序
        let dragIdx = -1;
        el.querySelectorAll(".ccb-course-item").forEach((item) => {
            item.addEventListener("dragstart", function () {
                dragIdx = parseInt(this.dataset.idx);
                this.classList.add("ccb-dragging");
            });
            item.addEventListener("dragend", function () {
                this.classList.remove("ccb-dragging");
            });
            item.addEventListener("dragover", function (e) {
                e.preventDefault();
            });
            item.addEventListener("drop", function () {
                const toIdx = parseInt(this.dataset.idx);
                if (dragIdx >= 0 && dragIdx !== toIdx) {
                    const [moved] = courses.splice(dragIdx, 1);
                    courses.splice(toIdx, 0, moved);
                    saveConfig();
                    renderCourseList();
                    updateProgress();
                }
                dragIdx = -1;
            });
        });
    }

    function updateProgress() {
        const el = document.getElementById("ccb-progress");
        const remainEl = document.getElementById("ccb-remaining");
        if (!el || !remainEl) return;
        const total = courses.length;
        const done = grabbed.length;
        el.style.width = total ? (done / total) * 100 + "%" : "0%";
        const remain = courses.filter(
            (c) => !grabbed.includes(c.code) && !skipped.includes(c.code),
        );
        const skippedCount = skipped.length;
        let extra = "";
        if (skippedCount) extra += " | 跳过: " + skippedCount;
        remainEl.textContent =
            done +
            "/" +
            total +
            (remain.length ? " 剩余: " + remain.map((c) => c.code).join(", ") : " 🎉 全部完成！") +
            extra;
    }

    function updateBtnState() {
        const startBtn = document.getElementById("ccb-btn-start");
        const stopBtn = document.getElementById("ccb-btn-stop");
        const skipBtn = document.getElementById("ccb-btn-skip");
        if (startBtn) startBtn.style.display = running ? "none" : "";
        if (stopBtn) stopBtn.style.display = running ? "" : "none";
        if (skipBtn) skipBtn.style.display = running ? "" : "none";
    }

    // ===================== 抢课核心 =====================
    function wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    function getCampus() {
        try {
            if (window.grablessonsVue && window.grablessonsVue.currentCampus) {
                return window.grablessonsVue.currentCampus.code;
            }
        } catch (_) {
            /* */
        }
        return "S";
    }

    async function searchCourse(code) {
        let res;
        try {
            res = await axios.post("/elective/clazz/list", {
                teachingClassType: "XGKC",
                campus: getCampus(),
                pageNumber: 1,
                pageSize: 10,
                KEY: code,
                orderBy: "",
            });
        } catch (_) {
            return null; // 网络级别的失败
        }
        // 响应校验：服务端可能崩了返回非 JSON
        if (!res || typeof res.data !== "object" || !res.data || !res.data.code) {
            return null;
        }
        if (res.data.code !== 200) return null;
        const rows = res.data.data && res.data.data.rows;
        if (!rows || !rows.length) return null;
        return rows.find((r) => r.KCH === code) || null;
    }

    async function addCourse(courseObj) {
        let res;
        try {
            res = await axios.post(
                "/elective/clazz/add",
                {
                    clazzType: "XGKC",
                    clazzId: courseObj.JXBID,
                    secretVal: courseObj.secretVal,
                },
                { timeout: 10000 },
            );
        } catch (_) {
            return { code: -1, msg: "网络异常" };
        }
        // 响应校验
        if (!res || typeof res.data !== "object" || !res.data) {
            return { code: -1, msg: "服务端异常响应" };
        }
        return res.data;
    }

    // 验证课程是否真正选上（查已选列表）
    async function verifyCourseGrab(code, maxRetries) {
        maxRetries = maxRetries || 4;
        for (let i = 0; i < maxRetries; i++) {
            if (i > 0) await wait(1000); // 首次等 0ms（已在外层等过），后续等 1s
            let res;
            try {
                res = await axios.post("/elective/clazz/list", {
                    teachingClassType: "YXKC",
                    campus: getCampus(),
                    pageNumber: 1,
                    pageSize: 50,
                    orderBy: "",
                });
            } catch (_) {
                continue;
            }
            if (!res || typeof res.data !== "object" || !res.data || res.data.code !== 200)
                continue;

            const rows = res.data.data && res.data.data.rows;
            if (!rows || !rows.length) continue;

            const found = rows.find((r) => r.KCH === code || (r.KCH && r.KCH.indexOf(code) !== -1));
            if (found) {
                log(
                    "✔ 已验证: " + code + " 出现在已选列表（第 " + (i + 1) + " 次查询）",
                    "success",
                );
                return true;
            }

            if (i < maxRetries - 1) {
                log(
                    "⏳ " +
                        code +
                        " 未在已选列表，等待队列处理... (" +
                        (i + 1) +
                        "/" +
                        maxRetries +
                        ")",
                );
            }
        }
        return false;
    }

    function currentBackoff() {
        // 退避公式：用户配置间隔 * 2^连续失败次数，上限 MAX_BACKOFF
        const b = interval * Math.pow(2, consecutiveFails);
        return Math.min(b, MAX_BACKOFF);
    }

    async function grabLoop() {
        stopped = false;
        running = true;
        grabbed = [];
        skipped = [];
        attempts = 0;
        consecutiveFails = 0;
        currentIdx = 0;
        updateBtnState();
        updateProgress();
        renderCourseList();
        log("🚀 开始抢课，共 " + courses.length + " 门");
        beep(true);

        while (!stopped && grabbed.length + skipped.length < courses.length) {
            // 找下一门未处理的课
            const idx = courses.findIndex(
                (c) => !grabbed.includes(c.code) && !skipped.includes(c.code),
            );
            if (idx === -1) break;
            currentIdx = idx;
            const target = courses[idx];
            attempts++;

            try {
                const found = await searchCourse(target.code);

                if (found) {
                    consecutiveFails = 0; // 能搜到课 → 服务端正常，重置退避

                    // 回填课程名
                    if (!target.name && found.KCM) {
                        target.name = found.KCM;
                        saveConfig();
                        renderCourseList();
                    }
                    log(
                        "🎯 " +
                            target.code +
                            " " +
                            (found.KCM || "") +
                            " | " +
                            found.SKJS +
                            " | " +
                            (found.YXRS || "?") +
                            "/" +
                            (found.KRL || "?"),
                        "found",
                    );

                    const result = await addCourse(found);

                    if (result.code === 200) {
                        log("📨 " + target.code + " 已提交选课请求，等待队列处理...");

                        // 等 1 秒让队列处理
                        await wait(1000);

                        const verified = await verifyCourseGrab(target.code);

                        if (verified) {
                            log(
                                "✅ " +
                                    target.code +
                                    " " +
                                    target.name +
                                    " 抢课成功！（已通过已选列表验证）",
                                "success",
                            );
                            grabbed.push(target.code);
                            consecutiveFails = 0;
                            saveConfig();
                            renderCourseList();
                            updateProgress();
                            beep(true);

                            if (window.grablessonsVue) {
                                window.grablessonsVue.$message({
                                    type: "success",
                                    message:
                                        "🎉 " +
                                        target.code +
                                        " " +
                                        (target.name || "") +
                                        " 抢课成功！",
                                    duration: 8000,
                                    showClose: true,
                                });
                            }

                            if (grabbed.length < courses.length) {
                                await wait(1000);
                            }
                            continue;
                        } else {
                            log(
                                "❌ " +
                                    target.code +
                                    " 验证失败：未在已选列表中出现（可能队列未处理或被驳回），重试中...",
                                "warn",
                            );
                            consecutiveFails++;
                            // 不标记为 grabbed，下一轮循环会重试
                        }
                    } else if (result.code === 401 || result.code === 402 || result.code === 403) {
                        log("❌ 登录已过期，请重新登录！", "error");
                        stopped = true;
                        break;
                    } else {
                        log(
                            "⚠️ " +
                                target.code +
                                " [" +
                                result.code +
                                "] " +
                                (result.msg || "未知错误"),
                            "warn",
                        );
                        consecutiveFails++;
                    }
                } else {
                    // 搜不到课 → 可能服务端崩了或批次未开
                    log("🔍 " + target.code + " 未搜到，可能暂未开放或课程号错误");
                    consecutiveFails++;
                }
            } catch (err) {
                log("💥 网络异常: " + (err && err.message ? err.message : String(err)), "error");
                consecutiveFails++;
            }

            const delay = currentBackoff();
            if (consecutiveFails > 2 && attempts % 10 === 1) {
                log("⏸ 连续失败 " + consecutiveFails + " 次，退避至 " + delay + "ms", "warn");
            }
            await wait(delay);
        }

        running = false;
        updateBtnState();
        if (!stopped) {
            log("🎉 全部目标课程已抢完！", "success");
            beep(true);
        } else if (stopped && grabbed.length + skipped.length < courses.length) {
            log(
                "⏹ 已停止 | 抢到: " +
                    (grabbed.join(", ") || "无") +
                    (skipped.length ? " | 跳过: " + skipped.join(", ") : "") +
                    " | 共尝试 " +
                    attempts +
                    " 次",
            );
        }
    }

    function startGrab() {
        if (running) return;
        if (!courses.length) {
            log("⚠️ 请先添加课程", "warn");
            return;
        }
        initAudio();
        grabLoop();
    }

    function stopGrab() {
        if (!running) return;
        stopped = true;
        log("⏹ 正在停止...");
    }

    function skipCourse() {
        if (!running) return;
        const idx = courses.findIndex(
            (c) => !grabbed.includes(c.code) && !skipped.includes(c.code),
        );
        if (idx >= 0) {
            const c = courses[idx];
            skipped.push(c.code);
            log("⏭ 跳过: " + c.code + " " + (c.name || c.note || ""));
            saveConfig();
            renderCourseList();
            updateProgress();
        }
    }

    // ===================== 构建面板 =====================
    function buildPanel() {
        const panel = document.createElement("div");
        panel.id = PANEL_ID;
        panel.innerHTML = `
<div class="ccp-header" id="ccb-header">
    <span>🔫 CourseChooseBoom <span style="font-weight:400;font-size:11px;opacity:.7">v1.0</span></span>
    <span>
        <button class="ccp-hdr-btn" id="ccb-btn-min" title="最小化">−</button>
        <button class="ccp-hdr-btn" id="ccb-btn-close" title="关闭">×</button>
    </span>
</div>
<div class="ccp-body" id="ccb-body">
    <div class="ccp-row">
        <input id="ccb-input-code"  class="ccp-input" style="flex:2" placeholder="课程号，如 24TS2244" maxlength="20">
        <input id="ccb-input-note"  class="ccp-input" style="flex:1" placeholder="备注(可选)" maxlength="50">
        <button id="ccb-btn-add" class="ccp-btn ccp-btn-sm">+添加</button>
    </div>
    <div class="ccb-course-list" id="ccb-course-list"></div>
    <div class="ccp-row ccp-row-sm">
        <label>间隔</label>
        <select id="ccb-interval" class="ccp-select">
            <option value="400">400ms</option>
            <option value="600">600ms</option>
            <option value="800" selected>800ms</option>
            <option value="1000">1000ms</option>
            <option value="1500">1500ms</option>
            <option value="2000">2000ms</option>
        </select>
    </div>
    <div class="ccp-row ccp-row-sm">
        <button id="ccb-btn-start" class="ccp-btn ccp-btn-go">▶ 开始抢课</button>
        <button id="ccb-btn-stop"  class="ccp-btn ccp-btn-stop" style="display:none">⏹ 停止</button>
        <button id="ccb-btn-skip"  class="ccp-btn ccp-btn-warn" style="display:none">⏭ 跳过当前</button>
    </div>
    <div class="ccp-progress-bar"><div class="ccp-progress-fill" id="ccb-progress"></div></div>
    <div class="ccp-progress-text" id="ccb-remaining">0/0</div>
    <div class="ccb-log" id="ccb-log"></div>
</div>`;
        document.body.appendChild(panel);
    }

    // ===================== 拖拽面板 =====================
    function makeDraggable() {
        const panel = document.getElementById(PANEL_ID);
        const header = document.getElementById("ccb-header");
        if (!panel || !header) return;
        let offX = 0,
            offY = 0,
            down = false;

        header.addEventListener("mousedown", function (e) {
            if (e.target.tagName === "BUTTON") return; // 不拦截按钮
            down = true;
            offX = e.clientX - panel.offsetLeft;
            offY = e.clientY - panel.offsetTop;
            panel.style.transition = "none";
        });

        document.addEventListener("mousemove", function (e) {
            if (!down) return;
            const x = Math.max(
                0,
                Math.min(e.clientX - offX, window.innerWidth - panel.offsetWidth),
            );
            const y = Math.max(0, Math.min(e.clientY - offY, window.innerHeight - 50));
            panel.style.left = x + "px";
            panel.style.top = y + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });

        document.addEventListener("mouseup", function () {
            if (down) {
                down = false;
                panel.style.transition = "";
            }
        });
    }

    // ===================== 事件绑定 =====================
    function bindEvents() {
        document.getElementById("ccb-btn-add").addEventListener("click", function () {
            const codeEl = document.getElementById("ccb-input-code");
            const noteEl = document.getElementById("ccb-input-note");
            const code = codeEl.value.trim().toUpperCase();
            if (!code) return;
            if (courses.find((c) => c.code === code)) {
                log("⚠️ 课程 " + code + " 已存在");
                return;
            }
            const noteVal = noteEl.value.trim();
            courses.push({ code, name: "", note: noteVal });
            saveConfig();
            renderCourseList();
            updateProgress();
            codeEl.value = "";
            noteEl.value = "";
            log("+ " + code + (noteVal ? " (" + noteVal + ")" : ""));
        });

        // 回车添加
        document.getElementById("ccb-input-code").addEventListener("keydown", function (e) {
            if (e.key === "Enter") document.getElementById("ccb-btn-add").click();
        });

        document.getElementById("ccb-btn-start").addEventListener("click", startGrab);
        document.getElementById("ccb-btn-stop").addEventListener("click", stopGrab);
        document.getElementById("ccb-btn-skip").addEventListener("click", skipCourse);

        document.getElementById("ccb-interval").addEventListener("change", function () {
            interval = parseInt(this.value);
            saveConfig();
        });

        // 最小化 / 关闭
        document.getElementById("ccb-btn-min").addEventListener("click", function () {
            const body = document.getElementById("ccb-body");
            const btn = document.getElementById("ccb-btn-min");
            if (body.style.display === "none") {
                body.style.display = "";
                btn.textContent = "−";
            } else {
                body.style.display = "none";
                btn.textContent = "+";
            }
        });

        document.getElementById("ccb-btn-close").addEventListener("click", function () {
            if (running) {
                if (!confirm("正在抢课中，确定关闭面板吗？")) return;
                stopGrab();
            }
            document.getElementById(PANEL_ID).style.display = "none";
            // 添加一个小按钮恢复面板
            showReopenBtn();
        });
    }

    function showReopenBtn() {
        if (document.getElementById("ccb-reopen")) return;
        const btn = document.createElement("button");
        btn.id = "ccb-reopen";
        btn.textContent = "🔫";
        btn.title = "打开抢课助手";
        btn.addEventListener("click", function () {
            document.getElementById(PANEL_ID).style.display = "";
            this.remove();
        });
        document.body.appendChild(btn);
    }

    // ===================== 启动 =====================
    function init() {
        injectStyles();
        loadConfig();
        buildPanel();
        makeDraggable();
        bindEvents();
        renderCourseList();
        updateProgress();
        updateBtnState();

        // 恢复 interval 下拉默认值
        const sel = document.getElementById("ccb-interval");
        if (sel) sel.value = String(interval);

        log("✅ 抢课助手已就绪 | 共 " + courses.length + " 门课程");

        // 页面隐藏监听：浏览器会降频 setTimeout，影响抢课速度
        document.addEventListener("visibilitychange", function () {
            if (document.hidden && running) {
                log("⚠️ 页面已隐藏！浏览器可能降频定时器影响抢课速度，请保持此标签页可见", "warn");
            }
        });
    }

    // 等待页面就绪：axios 和 grablessonsVue 都需要
    function waitForReady(retries) {
        retries = retries || 0;
        if (retries > 100) {
            console.warn("[CCB] 等待页面超时，强制初始化");
            init();
            return;
        }
        if (window.axios && window.grablessonsVue) {
            init();
        } else {
            setTimeout(function () {
                waitForReady(retries + 1);
            }, 200);
        }
    }

    // 页面加载完成后启动
    if (document.readyState === "complete") {
        waitForReady();
    } else {
        window.addEventListener("load", function () {
            waitForReady();
        });
    }
})();
