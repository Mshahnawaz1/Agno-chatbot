"use strict";

/* Sidebar list of MCP connectors. Click to connect (OAuth redirect, or an API
   key prompt for servers without OAuth); click a connected one to disconnect. */

async function loadConnectors() {
    const list = $("connector-list");
    try {
        const connectors = await api.listConnectors();
        list.innerHTML = "";
        for (const c of connectors) {
            const btn = document.createElement("button");
            btn.className = "sidebar-btn";
            btn.textContent = `${c.connected ? "●" : "○"} ${c.name}`;
            btn.title = c.connected ? "Connected · click to disconnect" : c.notes || "Click to connect";
            btn.addEventListener("click", () => toggleConnector(c));
            list.appendChild(btn);
        }
    } catch (err) {
        list.innerHTML = '<div class="session-note error">Could not load connectors.</div>';
        console.error("Failed to load connectors:", err);
    }
}

async function toggleConnector(c) {
    try {
        if (c.connected) {
            if (!confirm(`Disconnect ${c.name}?`)) return;
            await api.disconnectConnector(c.id);
            return loadConnectors();
        }
        const { url, needsApiKey } = await api.authorizeConnector(c.id);
        if (url) {
            window.location.href = url; // provider redirects back to /?connected=<id>
            return;
        }
        if (needsApiKey) {
            const key = prompt(`${c.name} API key:`);
            if (!key) return;
            await api.setConnectorKey(c.id, key);
            loadConnectors();
        }
    } catch (err) {
        alert(err.message);
    }
}

/** After the OAuth redirect back: report the result once, then tidy the URL. */
function handleConnectorRedirect() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("connector_error")) alert(`Could not connect ${params.get("connector_error")}.`);
    if (params.has("connected") || params.has("connector_error")) {
        history.replaceState(null, "", "/");
    }
}
