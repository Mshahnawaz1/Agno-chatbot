"use strict";

/* Rendering of the message list. */

function renderMarkdown(text) {
    return DOMPurify.sanitize(marked.parse(text, { breaks: true }));
}

/** Appends a red error line. `className` lets callers add a style, e.g. "guardrail". */
function showError(container, message, className = "") {
    const p = document.createElement("p");
    p.className = `error ${className}`.trim();
    p.textContent = message;
    container.appendChild(p);
}

function scrollToBottom({ force = false } = {}) {
    const el = els.messages;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (force || distanceFromBottom < 120) {
        el.scrollTop = el.scrollHeight;
    }
}

function showWelcome() {
    els.messages.innerHTML = '<div class="welcome">What can I help with?</div>';
}

function clearMessages() {
    els.messages.innerHTML = "";
}

/** Appends a message row and returns its content element. */
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
