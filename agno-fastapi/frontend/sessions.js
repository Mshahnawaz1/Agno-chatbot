"use strict";

/* Sidebar session list and switching between chats. */

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
            '<div class="session-note error">Could not load chats.</div>';
        console.error("Failed to load sessions:", err);
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
        if (messages.length === 0) showWelcome();
        for (const m of messages) {
            const el = addMessage(m.role, m.content);
            if (m.role === "assistant") attachMetrics(el, m.metrics);
        }
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
