/* =====================================================
 * Chat UI
 * Talks to:  GET  /sessions
 *            GET  /sessions/{id}/messages
 *            POST /chat/stream   (Server-Sent Events)
 * Auth (dev): X-User-Id header
 * ===================================================== */

"use strict";

/* ---------- Settings (persisted in localStorage) ---------- */

const DEFAULT_BASE_URL = "http://localhost:8000";
const MOBILE_BREAKPOINT = 700;

const settings = {
  get baseUrl() {
    return (localStorage.getItem("baseUrl") || DEFAULT_BASE_URL).replace(/\/$/, "");
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
    const headers = { "X-User-Id": settings.userId };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  },

  async getJson(path) {
    const res = await fetch(settings.baseUrl + path, { headers: api.headers() });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  },

  listSessions() {
    return api.getJson("/sessions");
  },

  listMessages(sessionId) {
    return api.getJson(`/sessions/${encodeURIComponent(sessionId)}/messages`);
  },

  /** Opens the SSE stream. Returns the raw fetch Response; caller reads the body. */
  async openChatStream(message, sessionId, signal) {
    const res = await fetch(settings.baseUrl + "/chat/stream", {
      method: "POST",
      headers: api.headers({ json: true }),
      body: JSON.stringify({ message, session_id: sessionId }),
      signal,
    });

    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try { detail = (await res.json()).detail || detail; } catch { /* body wasn't JSON */ }
      throw new Error(detail);
    }
    return res;
  },
};

/* ---------- App state ---------- */

const state = {
  sessions: [],
  activeSessionId: null, // null means "new chat"
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
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (force || distanceFromBottom < 120) el.scrollTop = el.scrollHeight;
}

/* ---------- Messages view ---------- */

function showWelcome() {
  els.messages.innerHTML = '<div class="welcome">What can I help with?</div>';
}

function clearMessages() {
  els.messages.innerHTML = "";
}

/** Appends a message row and returns the element holding its content. */
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

/* ---------- Sessions sidebar ---------- */

function renderSessions() {
  const list = els.sessionList;
  list.innerHTML = "";

  if (state.sessions.length === 0) {
    list.innerHTML = '<div class="session-note">No chats yet</div>';
    return;
  }

  for (const session of state.sessions) {
    const item = document.createElement("div");
    item.className = "session-item";
    item.classList.toggle("is-active", session.id === state.activeSessionId);
    item.textContent = session.title || "Untitled";
    item.title = session.title || "";
    item.addEventListener("click", () => openSession(session.id));
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
      '<div class="session-note error">Could not load chats. Check Settings.</div>';
  }
}

function setActiveTitle(title) {
  els.chatTitle.textContent = title || "New chat";
}

function findSession(id) {
  return state.sessions.find((s) => s.id === id);
}

function collapseSidebarOnMobile() {
  if (window.innerWidth <= MOBILE_BREAKPOINT) els.sidebar.classList.add("is-hidden");
}

async function openSession(sessionId) {
  stopStreaming();
  state.activeSessionId = sessionId;
  setActiveTitle(findSession(sessionId)?.title);
  renderSessions();
  clearMessages();

  try {
    const messages = await api.listMessages(sessionId);
    if (messages.length === 0) showWelcome();
    for (const m of messages) addMessage(m.role, m.content);
    scrollToBottom({ force: true });
  } catch (err) {
    showError(addMessage("assistant"), `Could not load messages: ${err.message}`);
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

/* ---------- Streaming (SSE) ---------- */

function setStreaming(isStreaming) {
  state.isStreaming = isStreaming;
  els.sendBtn.textContent = isStreaming ? "■" : "↑";
  els.sendBtn.title = isStreaming ? "Stop" : "Send";
}

function stopStreaming() {
  state.abortController?.abort();
}

/** Splits an SSE frame ("event: x\ndata: {...}") into { event, data }. */
function parseSseFrame(frame) {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  return { event, data: data ? JSON.parse(data) : null };
}

/** Reads the response body and yields parsed SSE events as they arrive. */
async function* readSseEvents(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSseFrame(frame);
      if (parsed.data) yield parsed;
    }
  }
}

async function sendMessage() {
  if (state.isStreaming) return stopStreaming();

  const text = els.composerInput.value.trim();
  if (!text) return;

  els.composerInput.value = "";
  autosizeComposer();

  // Replace the welcome screen on the first message of a new chat.
  if (els.messages.querySelector(".welcome")) clearMessages();

  addMessage("user", text);
  const replyEl = addMessage("assistant");
  replyEl.classList.add("is-streaming");
  scrollToBottom({ force: true });

  state.abortController = new AbortController();
  setStreaming(true);

  const wasNewChat = state.activeSessionId === null;
  let reply = "";

  try {
    const response = await api.openChatStream(
      text,
      state.activeSessionId,
      state.abortController.signal
    );

    for await (const { event, data } of readSseEvents(response)) {
      if (event === "session") {
        state.activeSessionId = data.session_id;
      } else if (event === "token") {
        reply += data.content;
        replyEl.innerHTML = renderMarkdown(reply);
        scrollToBottom();
      } else if (event === "error") {
        showError(replyEl, data.message || "Generation failed");
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") showError(replyEl, err.message);
  } finally {
    replyEl.classList.remove("is-streaming");
    state.abortController = null;
    setStreaming(false);

    await loadSessions(); // picks up the new session and any updated ordering
    if (wasNewChat) setActiveTitle(findSession(state.activeSessionId)?.title);
  }
}

/* ---------- Composer ---------- */

function autosizeComposer() {
  const input = els.composerInput;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
}

function onComposerKeydown(event) {
  const isPlainEnter = event.key === "Enter" && !event.shiftKey && !event.isComposing;
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
  settings.save(els.baseUrlInput.value.trim(), els.userIdInput.value.trim());
  els.settingsDialog.close();
  startNewChat();
  loadSessions();
}

/* ---------- Wiring ---------- */

function bindEvents() {
  $("new-chat-btn").addEventListener("click", startNewChat);
  $("toggle-sidebar-btn").addEventListener("click", () =>
    els.sidebar.classList.toggle("is-hidden")
  );

  els.sendBtn.addEventListener("click", sendMessage);
  els.composerInput.addEventListener("input", autosizeComposer);
  els.composerInput.addEventListener("keydown", onComposerKeydown);

  $("settings-btn").addEventListener("click", openSettings);
  $("settings-save-btn").addEventListener("click", saveSettings);
  $("settings-cancel-btn").addEventListener("click", () => els.settingsDialog.close());
}

function init() {
  bindEvents();
  showWelcome();

  if (!settings.userId) {
    openSettings(); // can't call the API without a user id
    return;
  }
  loadSessions();
}

init();
