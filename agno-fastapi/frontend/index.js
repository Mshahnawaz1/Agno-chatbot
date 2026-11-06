
/* =====================================================
 * Chat UI
 * Talks to:  GET  /sessions
 *            GET  /sessions/{id}/messages
 *            POST /chat/stream (Server-Sent Events)
 * Auth (dev): X-User-Id header
 * ===================================================== */

"use strict";

/* ---------- Settings ---------- */

const DEFAULT_BASE_URL = "http://localhost:8000";
const MOBILE_BREAKPOINT = 700;

const settings = {
    get baseUrl() {
        return (
            localStorage.getItem("baseUrl") || DEFAULT_BASE_URL
        ).replace(/\/$/, "");
    },

    get userId() {
        return localStorage.getItem("userId") || "";
    },

    save(baseUrl, userId) {
        localStorage.setItem("baseUrl", baseUrl);
        localStorage.setItem("userId", userId);
    },
};

/* ---------- API layer ---------- */

const api = {
    headers({ json = false } = {}) {
        const headers = {
            "X-User-Id": settings.userId,
        };

        if (json) {
            headers["Content-Type"] = "application/json";
        }

        return headers;
    },

    async getJson(path) {
        const res = await fetch(settings.baseUrl + path, {
            headers: api.headers(),
        });

        if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
        }

        return res.json();
    },

    listSessions() {
        return api.getJson("/sessions");
    },

    listMessages(sessionId) {
        return api.getJson(
            `/sessions/${encodeURIComponent(sessionId)}/messages`
        );
    },

    async openChatStream(message, sessionId, signal) {
        const res = await fetch(
            settings.baseUrl + "/chat/stream",
            {
                method: "POST",
                headers: api.headers({ json: true }),
                body: JSON.stringify({
                    message,
                    session_id: sessionId,
                }),
                signal,
            }
        );

        if (!res.ok) {
            let detail = `Request failed (${res.status})`;

            try {
                detail = (await res.json()).detail || detail;
            } catch {
                // Response body wasn't JSON.
            }

            throw new Error(detail);
        }

        return res;
    },
};

/* ---------- App state ---------- */

const state = {
    sessions: [],
    activeSessionId: null,
    isStreaming: false,
    abortController: null,
};

/* ---------- DOM references ---------- */

const $ = (id) => document.getElementById(id);

const els = {
    sidebar: $("sidebar"),
    sessionList: $("session-list"),
    messages: $("messages"),
    chatTitle: $("chat-title"),
    composerInput: $("composer-input"),
    sendBtn: $("send-btn"),
    settingsDialog: $("settings-dialog"),
    baseUrlInput: $("base-url-input"),
    userIdInput: $("user-id-input"),
};

/* ---------- Rendering helpers ---------- */

function renderMarkdown(text) {
    const html = marked.parse(text, { breaks: true });
    return DOMPurify.sanitize(html);
}

function showError(container, message) {
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = message;
    container.appendChild(p);
}

function scrollToBottom({ force = false } = {}) {
    const el = els.messages;

    const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;

    if (force || distanceFromBottom < 120) {
        el.scrollTop = el.scrollHeight;
    }
}

/* ---------- Messages view ---------- */

function showWelcome() {
    els.messages.innerHTML =
        '<div class="welcome">What can I help with?</div>';
}

function clearMessages() {
    els.messages.innerHTML = "";
}

/**
 * Appends a message row and returns its content element.
 */
function addMessage(role, content = "") {
    const wrap = document.createElement("div");
    wrap.className = "message-wrap";

    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    const body = document.createElement("div");

    if (role === "user") {
        body.className = "user-bubble";
        body.textContent = content;
    } else {
        body.className = "assistant-body";
        body.innerHTML = renderMarkdown(content);
    }

    row.appendChild(body);
    wrap.appendChild(row);

    els.messages.appendChild(wrap);

    return body;
}

/* =====================================================
 * METRICS
 * ===================================================== */

const fmtSeconds = (n) => `${Number(n).toFixed(2)} s`;

const METRIC_FIELDS = [
    ["input_tokens", "Input tokens"],
    ["output_tokens", "Output tokens"],
    ["total_tokens", "Total tokens"],
    ["time_to_first_token", "Time to first token", fmtSeconds],
    ["duration", "Duration", fmtSeconds],
    ["num_tools", "Tool calls"],
];

function stringify(value) {
    if (typeof value === "string") return value;

    return JSON.stringify(value, null, 2) ?? "";
}

function truncate(text, max = 1000) {
    return text.length > max
        ? text.slice(0, max) + "…"
        : text;
}

function makeDetails(title, bodyText) {
    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.textContent = title;

    const pre = document.createElement("pre");
    pre.textContent = bodyText;

    details.append(summary, pre);

    return details;
}

/**
 * Builds the metrics panel.
 */
function buildMetricsPanel(metrics) {
    const panel = document.createElement("div");

    panel.className = "metrics-panel";
    panel.hidden = true;

    /* Basic metrics */

    const grid = document.createElement("dl");
    grid.className = "metrics-grid";

    for (const [key, label, format] of METRIC_FIELDS) {
        const value = metrics[key];

        if (value === undefined || value === null) continue;

        const dt = document.createElement("dt");
        dt.textContent = label;

        const dd = document.createElement("dd");

        dd.textContent = format
            ? format(value)
            : String(value);

        grid.append(dt, dd);
    }

    panel.appendChild(grid);

    /* Tool metrics */

    const tools = Array.isArray(metrics.tools_metrics)
        ? metrics.tools_metrics
        : [];

    if (tools.length) {
        const title = document.createElement("div");

        title.className = "metrics-subtitle";
        title.textContent = "Tools";

        panel.appendChild(title);

        for (const tool of tools) {
            const [name, result, args] = tool;

            const body =
                `args:\n${stringify(args)}\n\n` +
                `result:\n${truncate(stringify(result))}`;

            panel.appendChild(
                makeDetails(name || "tool", body)
            );
        }
    }

    /* Raw metrics */

    const { tools_metrics, ...rest } = metrics;

    panel.appendChild(
        makeDetails(
            "All metrics (raw)",
            JSON.stringify(rest, null, 2)
        )
    );

    return panel;
}

/**
 * Attaches the metrics button and panel below an assistant reply.
 */
function attachMetrics(replyEl, metrics) {
    const wrap = replyEl.closest(".message-wrap");

    if (!wrap) return;

    // Prevent duplicate buttons.
    if (wrap.querySelector(".metrics-toggle")) return;

    const panel = buildMetricsPanel(metrics);

    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "metrics-toggle";
    btn.textContent = "ⓘ Metrics";
    btn.title = "Show response metrics";

    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
        panel.hidden = !panel.hidden;

        btn.setAttribute(
            "aria-expanded",
            String(!panel.hidden)
        );

        btn.title = panel.hidden
            ? "Show response metrics"
            : "Hide response metrics";

        if (!panel.hidden) {
            scrollToBottom();
        }
    });

    const actions = document.createElement("div");
    actions.className = "message-actions";

    actions.appendChild(btn);

    // Keep outside assistant-body because innerHTML is
    // rewritten during token streaming.
    wrap.append(actions, panel);

    console.log("Metrics button attached:", metrics);
}

/* ---------- Sessions sidebar ---------- */

function renderSessions() {
    const list = els.sessionList;

    list.innerHTML = "";

    if (state.sessions.length === 0) {
        list.innerHTML =
            '<div class="session-note">No chats yet</div>';
        return;
    }

    for (const session of state.sessions) {
        const item = document.createElement("div");

        item.className = "session-item";

        item.classList.toggle(
            "is-active",
            session.id === state.activeSessionId
        );

        item.textContent = session.title || "Untitled";
        item.title = session.title || "";

        item.addEventListener("click", () => {
            openSession(session.id);
        });

        list.appendChild(item);
    }
}

async function loadSessions() {
    try {
        state.sessions = await api.listSessions();
        renderSessions();
    } catch (err) {
        state.sessions = [];

        els.sessionList.innerHTML =
            '<div class="session-note error">' +
            'Could not load chats. Check Settings.' +
            '</div>';

        console.error("Failed to load sessions:", err);
    }
}

function setActiveTitle(title) {
    els.chatTitle.textContent = title || "New chat";
}

function findSession(id) {
    return state.sessions.find((s) => s.id === id);
}

function collapseSidebarOnMobile() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        els.sidebar.classList.add("is-hidden");
    }
}

async function openSession(sessionId) {
    stopStreaming();

    state.activeSessionId = sessionId;

    setActiveTitle(findSession(sessionId)?.title);
    renderSessions();
    clearMessages();

    try {
        const messages = await api.listMessages(sessionId);

        if (messages.length === 0) {
            showWelcome();
        }

        for (const m of messages) {
            addMessage(m.role, m.content);
        }

        scrollToBottom({ force: true });

    } catch (err) {
        showError(
            addMessage("assistant"),
            `Could not load messages: ${err.message}`
        );
    }

    collapseSidebarOnMobile();
}

function startNewChat() {
    stopStreaming();

    state.activeSessionId = null;

    setActiveTitle("New chat");
    showWelcome();
    renderSessions();

    els.composerInput.focus();
}

/* =====================================================
 * STREAMING (SSE)
 * ===================================================== */

function setStreaming(isStreaming) {
    state.isStreaming = isStreaming;

    els.sendBtn.textContent = isStreaming ? "■" : "↑";
    els.sendBtn.title = isStreaming ? "Stop" : "Send";
}

function stopStreaming() {
    state.abortController?.abort();
}

/**
 * Parses an SSE frame into { event, data }.
 */
function parseSseFrame(frame) {
    let event = "message";
    const dataLines = [];

    for (const line of frame.split(/\r?\n/)) {
        if (!line || line.startsWith(":")) continue;

        if (line.startsWith("event:")) {
            event = line.slice(6).trim();

        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).replace(/^ /, ""));
        }
    }

    if (dataLines.length === 0) {
        return { event, data: null };
    }

    const rawData = dataLines.join("\n");

    try {
        return {
            event,
            data: JSON.parse(rawData),
        };
    } catch (err) {
        console.error("SSE JSON parsing error:", rawData);
        throw err;
    }
}

/**
 * Reads the SSE response and yields events as they arrive.
 * Handles incomplete frames and the final buffered event.
 */
async function* readSseEvents(response) {
    if (!response.body) {
        throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();

            buffer += decoder.decode(
                value || new Uint8Array(),
                { stream: !done }
            );

            // Extract complete SSE frames.
            const frames = buffer.split(/\r?\n\r?\n/);

            // Keep the incomplete frame.
            buffer = frames.pop() || "";

            for (const frame of frames) {
                if (!frame.trim()) continue;

                const parsed = parseSseFrame(frame);

                if (parsed.data !== null) {
                    yield parsed;
                }
            }

            if (done) {
                // Process the final frame if no delimiter exists.
                if (buffer.trim()) {
                    const parsed = parseSseFrame(buffer);

                    if (parsed.data !== null) {
                        yield parsed;
                    }
                }

                break;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Sends a message and processes the streamed response.
 */
async function sendMessage() {
    // Clicking send while streaming stops generation.
    if (state.isStreaming) {
        return stopStreaming();
    }

    const text = els.composerInput.value.trim();

    if (!text) return;

    els.composerInput.value = "";
    autosizeComposer();

    // Remove welcome screen.
    if (els.messages.querySelector(".welcome")) {
        clearMessages();
    }

    // Add user message.
    addMessage("user", text);

    // Add assistant placeholder.
    const replyEl = addMessage("assistant");

    replyEl.classList.add("is-streaming");

    scrollToBottom({ force: true });

    state.abortController = new AbortController();

    setStreaming(true);

    const wasNewChat = state.activeSessionId === null;

    let reply = "";
    let receivedMetrics = null;

    try {
        const response = await api.openChatStream(
            text,
            state.activeSessionId,
            state.abortController.signal
        );

        for await (const { event, data } of readSseEvents(response)) {

            console.log("SSE Event:", event, data);

            if (event === "session") {
                state.activeSessionId = data.session_id;

            } else if (event === "token") {
                reply += data.content || "";

                replyEl.innerHTML = renderMarkdown(reply);

                scrollToBottom();

            } else if (event === "metrics") {
                // Store metrics until streaming finishes.
                receivedMetrics = data;

                console.log(
                    "Metrics received:",
                    receivedMetrics
                );

            } else if (event === "done") {
                console.log("Stream completed:", data);

            } else if (event === "error") {
                showError(
                    replyEl,
                    data.message || "Generation failed"
                );
            }
        }

    } catch (err) {
        if (err.name !== "AbortError") {
            showError(replyEl, err.message);

            console.error("Chat streaming error:", err);
        }

    } finally {
        // Remove streaming cursor.
        replyEl.classList.remove("is-streaming");

        // Attach metrics after the stream ends.
        if (receivedMetrics) {
            attachMetrics(replyEl, receivedMetrics);

            scrollToBottom();
        }

        state.abortController = null;

        setStreaming(false);

        // Refresh sidebar.
        await loadSessions();

        if (wasNewChat) {
            setActiveTitle(
                findSession(state.activeSessionId)?.title
            );
        }
    }
}

/* ---------- Composer ---------- */

function autosizeComposer() {
    const input = els.composerInput;

    input.style.height = "auto";

    input.style.height =
        `${Math.min(input.scrollHeight, 200)}px`;
}

function onComposerKeydown(event) {
    const isPlainEnter =
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing;

    if (isPlainEnter) {
        event.preventDefault();
        sendMessage();
    }
}

/* ---------- Settings dialog ---------- */

function openSettings() {
    els.baseUrlInput.value = settings.baseUrl;
    els.userIdInput.value = settings.userId;

    els.settingsDialog.showModal();
}

function saveSettings() {
    settings.save(
        els.baseUrlInput.value.trim(),
        els.userIdInput.value.trim()
    );

    els.settingsDialog.close();

    startNewChat();
    loadSessions();
}

/* ---------- Wiring ---------- */

function bindEvents() {
    $("new-chat-btn").addEventListener(
        "click",
        startNewChat
    );

    $("toggle-sidebar-btn").addEventListener(
        "click",
        () => els.sidebar.classList.toggle("is-hidden")
    );

    els.sendBtn.addEventListener(
        "click",
        sendMessage
    );

    els.composerInput.addEventListener(
        "input",
        autosizeComposer
    );

    els.composerInput.addEventListener(
        "keydown",
        onComposerKeydown
    );

    $("settings-btn").addEventListener(
        "click",
        openSettings
    );

    $("settings-save-btn").addEventListener(
        "click",
        saveSettings
    );

    $("settings-cancel-btn").addEventListener(
        "click",
        () => els.settingsDialog.close()
    );
}

/* ---------- Initialization ---------- */

function init() {
    bindEvents();

    showWelcome();

    if (!settings.userId) {
        openSettings();
        return;
    }

    loadSessions();
}

init();
