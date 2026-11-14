"use strict";

/* All HTTP calls to the backend live here. */

const api = {
    headers({ json = false } = {}) {
        const headers = {};
        if (settings.token) headers["Authorization"] = `Bearer ${settings.token}`;
        if (json) headers["Content-Type"] = "application/json";
        return headers;
    },

    /** FastAPI errors are {detail: string} or, for 422, {detail: [{msg}, ...]}. */
    async errorMessage(res) {
        let detail = `Request failed (${res.status})`;
        try {
            const body = await res.json();
            if (typeof body.detail === "string") detail = body.detail;
            else if (Array.isArray(body.detail)) detail = body.detail.map((d) => d.msg).join("; ");
        } catch {
            // Response body wasn't JSON.
        }
        return detail;
    },

    /** Throw for non-2xx. A 401 on a logged-in call means the token is bad or expired. */
    async check(res) {
        if (res.ok) return res;
        if (res.status === 401) {
            settings.clearToken();
            openAuth("Your session expired. Please log in again.");
        }
        throw new Error(await api.errorMessage(res));
    },

    async getJson(path) {
        const res = await fetch(path, { headers: api.headers() });
        return (await api.check(res)).json();
    },

    // ---- auth (no token needed, so no api.check: a 401 here is just "wrong password") ----

    async login(email, password) {
        const res = await fetch("/auth/token", {
            method: "POST",
            // OAuth2 password flow expects form fields named username/password
            body: new URLSearchParams({ username: email, password }),
        });
        if (!res.ok) throw new Error(await api.errorMessage(res));
        return (await res.json()).access_token;
    },

    async signup(email, password, name) {
        const res = await fetch("/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name: name || null }),
        });
        if (!res.ok) throw new Error(await api.errorMessage(res));
        return res.json();
    },

    // ---- app ----

    listSessions() {
        return api.getJson("/sessions");
    },

    listMessages(sessionId) {
        return api.getJson(`/sessions/${encodeURIComponent(sessionId)}/messages`);
    },

    // ---- connectors ----

    listConnectors() {
        return api.getJson("/connectors");
    },

    /** Returns {url} for OAuth connectors, or {needsApiKey: true} when the server has no OAuth. */
    async authorizeConnector(id) {
        const res = await fetch(`/connectors/${encodeURIComponent(id)}/authorize`, {
            method: "POST",
            headers: api.headers(),
        });
        if (res.status === 409) return { needsApiKey: true };
        return (await api.check(res)).json();
    },

    async setConnectorKey(id, apiKey) {
        const res = await fetch(`/connectors/${encodeURIComponent(id)}/api-key`, {
            method: "PUT",
            headers: api.headers({ json: true }),
            body: JSON.stringify({ api_key: apiKey }),
        });
        await api.check(res);
    },

    async setConnectorEnabled(id, enabled) {
        const res = await fetch(`/connectors/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: api.headers({ json: true }),
            body: JSON.stringify({ enabled }),
        });
        await api.check(res);
    },

    async disconnectConnector(id) {
        const res = await fetch(`/connectors/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: api.headers(),
        });
        await api.check(res);
    },

    async openChatStream(message, sessionId, signal) {
        const res = await fetch("/chat/stream", {
            method: "POST",
            headers: api.headers({ json: true }),
            body: JSON.stringify({ message, session_id: sessionId }),
            signal,
        });
        return api.check(res);
    },
};
