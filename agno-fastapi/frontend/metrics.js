"use strict";

/* The "ⓘ Metrics" button and panel under an assistant reply. */

const fmtSeconds = (n) => `${Number(n).toFixed(2)} s`;

// [key in metrics, label, optional formatter]
const METRIC_FIELDS = [
    ["input_tokens", "Input tokens"],
    ["output_tokens", "Output tokens"],
    ["total_tokens", "Total tokens"],
    ["time_to_first_token", "Time to first token", fmtSeconds],
    ["duration", "Duration", fmtSeconds],
    ["num_tools", "Tool calls"],
];

function toText(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "";
}

function buildGrid(metrics) {
    const grid = document.createElement("dl");
    grid.className = "metrics-grid";
    for (const [key, label, format] of METRIC_FIELDS) {
        if (metrics[key] == null) continue;
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = format ? format(metrics[key]) : String(metrics[key]);
        grid.append(dt, dd);
    }
    return grid;
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

function buildTool({ name, args, result }) {
    const resultText = toText(result);
    const shortResult = resultText.length > 1000 ? resultText.slice(0, 1000) + "…" : resultText;
    return makeDetails(name || "tool", `args:\n${toText(args)}\n\nresult:\n${shortResult}`);
}

function buildPanel(metrics) {
    const panel = document.createElement("div");
    panel.className = "metrics-panel";
    panel.hidden = true;
    panel.appendChild(buildGrid(metrics));

    const tools = metrics.tools || [];
    if (tools.length) {
        const title = document.createElement("div");
        title.className = "metrics-subtitle";
        title.textContent = "Tools";
        panel.append(title, ...tools.map(buildTool));
    }

    const { tools: _, ...rest } = metrics;
    panel.appendChild(makeDetails("All metrics (raw)", JSON.stringify(rest, null, 2)));
    return panel;
}

function buildToggle(panel) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "metrics-toggle";
    btn.textContent = "ⓘ Metrics";
    btn.title = "Show response metrics";
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        btn.setAttribute("aria-expanded", String(!panel.hidden));
        btn.title = panel.hidden ? "Show response metrics" : "Hide response metrics";
        if (!panel.hidden) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return btn;
}

/**
 * Adds the metrics button and panel below an assistant reply.
 * Used both for live replies (chat.js) and for history (sessions.js).
 * Replies with no metrics (stopped or failed) get no button.
 */
function attachMetrics(replyEl, metrics) {
    if (!metrics) return;
    const wrap = replyEl.closest(".message-wrap");
    if (!wrap || wrap.querySelector(".metrics-toggle")) return;

    const panel = buildPanel(metrics);
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.appendChild(buildToggle(panel));

    // Outside assistant-body because its innerHTML is rewritten while streaming.
    wrap.append(actions, panel);
}
