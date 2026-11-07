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

function stringify(value) {
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2) ?? "";
}

function truncate(text, max = 1000) {
    return text.length > max ? text.slice(0, max) + "…" : text;
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

function buildMetricsGrid(metrics) {
    const grid = document.createElement("dl");
    grid.className = "metrics-grid";

    for (const [key, label, format] of METRIC_FIELDS) {
        const value = metrics[key];
        if (value === undefined || value === null) continue;

        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = format ? format(value) : String(value);
        grid.append(dt, dd);
    }
    return grid;
}

function buildToolsSection(tools) {
    const section = document.createDocumentFragment();

    const title = document.createElement("div");
    title.className = "metrics-subtitle";
    title.textContent = "Tools";
    section.appendChild(title);

    for (const [name, result, args] of tools) {
        const body = `args:\n${stringify(args)}\n\nresult:\n${truncate(stringify(result))}`;
        section.appendChild(makeDetails(name || "tool", body));
    }
    return section;
}

function buildMetricsPanel(metrics) {
    const panel = document.createElement("div");
    panel.className = "metrics-panel";
    panel.hidden = true;

    panel.appendChild(buildMetricsGrid(metrics));

    const tools = Array.isArray(metrics.tools_metrics) ? metrics.tools_metrics : [];
    if (tools.length) panel.appendChild(buildToolsSection(tools));

    const { tools_metrics, ...rest } = metrics;
    panel.appendChild(makeDetails("All metrics (raw)", JSON.stringify(rest, null, 2)));

    return panel;
}

function buildMetricsToggle(panel) {
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
        if (!panel.hidden) scrollToBottom();
    });
    return btn;
}

/** Attaches the metrics button and panel below an assistant reply. */
function attachMetrics(replyEl, metrics) {
    const wrap = replyEl.closest(".message-wrap");
    if (!wrap || wrap.querySelector(".metrics-toggle")) return;

    const panel = buildMetricsPanel(metrics);
    const actions = document.createElement("div");
    actions.className = "message-actions";
    actions.appendChild(buildMetricsToggle(panel));

    // Outside assistant-body because its innerHTML is rewritten while streaming.
    wrap.append(actions, panel);
}
