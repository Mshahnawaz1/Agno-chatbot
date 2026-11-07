"use strict";

/* Server-Sent Events parsing. No UI code here. */

/** Parses one SSE frame into { event, data }. */
function parseSseFrame(frame) {
    let event = "message";
    const dataLines = [];

    for (const line of frame.split(/\r?\n/)) {
        if (!line || line.startsWith(":")) continue;

        if (line.startsWith("event:")) {
            event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).replace(/^ /, ""));
        }
    }

    if (dataLines.length === 0) return { event, data: null };

    const rawData = dataLines.join("\n");
    try {
        return { event, data: JSON.parse(rawData) };
    } catch (err) {
        console.error("SSE JSON parsing error:", rawData);
        throw err;
    }
}

/** Parses a frame and returns it only if it carries data. */
function parseIfData(frame) {
    const parsed = parseSseFrame(frame);
    return parsed.data !== null ? parsed : null;
}

/** Reads the response body and yields { event, data } as frames arrive. */
async function* readSseEvents(response) {
    if (!response.body) throw new Error("Response body is empty");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

            // Complete frames end with a blank line; keep the unfinished tail.
            const frames = buffer.split(/\r?\n\r?\n/);
            buffer = frames.pop() || "";

            for (const frame of frames) {
                if (!frame.trim()) continue;
                const parsed = parseIfData(frame);
                if (parsed) yield parsed;
            }

            if (done) {
                if (buffer.trim()) {
                    const parsed = parseIfData(buffer);
                    if (parsed) yield parsed;
                }
                break;
            }
        }
    } finally {
        reader.releaseLock();
    }
}
