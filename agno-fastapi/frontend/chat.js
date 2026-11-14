"use strict";

/* Sending a message and handling the streamed response. */

function setStreaming(isStreaming) {
    state.isStreaming = isStreaming;
    els.sendBtn.textContent = isStreaming ? "■" : "↑";
    els.sendBtn.title = isStreaming ? "Stop" : "Send";
}

function stopStreaming() {
    state.abortController?.abort();
}

/**
 * One handler per SSE event name. Each gets (data, ctx) where ctx holds
 * the reply element and the values collected during this stream.
 * To support a new event, add an entry here.
 */
const sseHandlers = {
    session(data) {
        state.activeSessionId = data.session_id;
    },

    token(data, ctx) {
        ctx.reply += data.content || "";
        ctx.replyEl.innerHTML = renderMarkdown(ctx.reply);
        scrollToBottom();
    },

    metrics(data, ctx) {
        // Kept until the stream ends, then attached under the reply.
        ctx.metrics = data;
    },

    // Input/output guardrail rejected the request: the user can fix and resend.
    guardrail_error(data, ctx) {
        showError(ctx.replyEl, data.message || "Request blocked by guardrail", "guardrail");
    },

    // Unexpected server failure.
    error(data, ctx) {
        showError(ctx.replyEl, data.message || "Generation failed");
    },

    done() {},
};

function prepareSend(text) {
    els.composerInput.value = "";
    autosizeComposer();

    if (els.messages.querySelector(".welcome")) clearMessages();

    addMessage("user", text);
    const replyEl = addMessage("assistant");
    replyEl.classList.add("is-streaming");
    scrollToBottom({ force: true });
    return replyEl;
}

async function finishSend(ctx, wasNewChat) {
    ctx.replyEl.classList.remove("is-streaming");

    attachMetrics(ctx.replyEl, ctx.metrics);
    scrollToBottom();

    state.abortController = null;
    setStreaming(false);

    await loadSessions();
    if (wasNewChat) setActiveTitle(findSession(state.activeSessionId)?.title);
}

async function sendMessage() {
    // Clicking send while streaming stops generation.
    if (state.isStreaming) return stopStreaming();

    const text = els.composerInput.value.trim();
    if (!text) return;

    const ctx = { replyEl: prepareSend(text), reply: "", metrics: null };
    const wasNewChat = state.activeSessionId === null;

    state.abortController = new AbortController();
    setStreaming(true);

    try {
        const response = await api.openChatStream(
            text,
            state.activeSessionId,
            state.abortController.signal
        );

        for await (const { event, data } of readSseEvents(response)) {
            sseHandlers[event]?.(data, ctx);
        }
    } catch (err) {
        if (err.name !== "AbortError") {
            showError(ctx.replyEl, err.message);
            console.error("Chat streaming error:", err);
        }
    } finally {
        await finishSend(ctx, wasNewChat);
    }
}
