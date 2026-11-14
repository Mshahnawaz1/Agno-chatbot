"use strict";

/* Connectors page (/#connectors): one card per MCP connector with its details,
   an on/off switch, and connect / disconnect.

   Switch on  -> not connected yet: start OAuth (or ask for an API key);
                 connected but off: turn it back on.
   Switch off -> keep the login, but the agent stops getting its tools.
   Disconnect -> forget the login entirely. */

const CONNECTORS_HASH = "#connectors";

function isConnectorsPage() {
    return window.location.hash === CONNECTORS_HASH;
}

/** Show the chat or the connectors page, based on the URL hash. */
function route() {
    const onPage = isConnectorsPage();
    $("connectors-page").hidden = !onPage;
    els.messages.hidden = onPage;
    $("composer").hidden = onPage;
    $("connectors-btn").classList.toggle("is-active", onPage);
    if (onPage) {
        els.chatTitle.textContent = "Connectors";
        if (settings.token) loadConnectors();
    } else {
        setActiveTitle(findSession(state.activeSessionId)?.title);
    }
}

function openConnectorsPage() {
    if (!isConnectorsPage()) window.location.hash = CONNECTORS_HASH; // fires hashchange -> route()
    collapseSidebarOnMobile();
}

/** Back to the chat view; called when a chat is started or opened. */
function closeConnectorsPage() {
    if (!isConnectorsPage()) return;
    history.replaceState(null, "", window.location.pathname + window.location.search);
    route();
}

async function loadConnectors() {
    const list = $("connector-cards");
    try {
        const connectors = await api.listConnectors();
        list.innerHTML = "";
        for (const c of connectors) list.appendChild(connectorCard(c));
    } catch (err) {
        list.innerHTML = '<div class="session-note error">Could not load connectors.</div>';
        console.error("Failed to load connectors:", err);
    }
}

function connectorStatus(c) {
    if (!c.connected) return { label: "Not connected", cls: "" };
    return c.enabled ? { label: "On", cls: "is-on" } : { label: "Off", cls: "is-off" };
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function connectorCard(c) {
    const card = el("article", "connector-card");

    // Header: name + status, and the switch
    const head = el("div", "connector-head");
    const title = el("div", "connector-title");
    title.appendChild(el("h3", "", c.name));
    const status = connectorStatus(c);
    title.appendChild(el("span", `connector-status ${status.cls}`, status.label));
    head.appendChild(title);

    const toggle = el("label", "switch");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = c.enabled;
    input.setAttribute("aria-label", `${c.name} on or off`);
    input.addEventListener("change", () => onSwitch(c, input));
    toggle.append(input, el("span", "switch-track"));
    head.appendChild(toggle);
    card.appendChild(head);

    if (c.notes) card.appendChild(el("p", "connector-notes", c.notes));

    // Details
    const details = el("dl", "connector-details");
    const add = (term, value) => {
        details.appendChild(el("dt", "", term));
        const dd = el("dd");
        if (value instanceof Node) dd.appendChild(value);
        else dd.textContent = value;
        details.appendChild(dd);
    };
    add("Server", el("code", "", c.url));
    add("Permissions", c.scopes.length ? chips(c.scopes) : "Server default");
    add(
        c.tools ? `Tools (${c.tools.length})` : "Tools",
        c.tools ? chips(c.tools) : "Every tool the server offers",
    );
    card.appendChild(details);

    if (c.connected) {
        const actions = el("div", "connector-actions");
        const btn = el("button", "link-btn danger", "Disconnect");
        btn.addEventListener("click", () => disconnectConnector(c));
        actions.appendChild(btn);
        card.appendChild(actions);
    }
    return card;
}

function chips(items) {
    const wrap = el("div", "chips");
    for (const item of items) wrap.appendChild(el("code", "chip", item));
    return wrap;
}

async function onSwitch(c, input) {
    const on = input.checked;
    input.disabled = true;
    try {
        if (on && !c.connected) {
            const done = await connectConnector(c);
            if (!done) input.checked = false; // cancelled, or we're off to the provider
            return;
        }
        await api.setConnectorEnabled(c.id, on);
        await loadConnectors();
    } catch (err) {
        input.checked = !on;
        alert(err.message);
    } finally {
        input.disabled = false;
    }
}

/** Returns true once connected here; false if cancelled or redirected to OAuth. */
async function connectConnector(c) {
    const { url, needsApiKey } = await api.authorizeConnector(c.id);
    if (url) {
        window.location.href = url; // provider redirects back to /?connected=<id>#connectors
        return false;
    }
    if (needsApiKey) {
        const key = prompt(`${c.name} API key:`);
        if (!key) return false;
        await api.setConnectorKey(c.id, key);
        await loadConnectors();
        return true;
    }
    return false;
}

async function disconnectConnector(c) {
    if (!confirm(`Disconnect ${c.name}? You'll need to log in again to use it.`)) return;
    try {
        await api.disconnectConnector(c.id);
        await loadConnectors();
    } catch (err) {
        alert(err.message);
    }
}

/** After the OAuth redirect back: report the result once, then tidy the URL. */
function handleConnectorRedirect() {
    const params = new URLSearchParams(window.location.search);
    const note = $("connectors-note");
    if (params.has("connected")) {
        note.textContent = `Connected ${params.get("connected")}.`;
        note.className = "session-note";
    } else if (params.has("connector_error")) {
        note.textContent = `Could not connect ${params.get("connector_error")}.`;
        note.className = "session-note error";
    }
    if (params.has("connected") || params.has("connector_error")) {
        history.replaceState(null, "", "/" + window.location.hash);
    }
}
