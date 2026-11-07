"use strict";

/* All HTTP calls to the backend live here. */

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

    async openChatStream(message, sessionId, signal) {
        const res = await fetch(settings.baseUrl + "/chat/stream", {
            method: "POST",
            headers: api.headers({ json: true }),
            body: JSON.stringify({ message, session_id: sessionId }),
            signal,
        });

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
