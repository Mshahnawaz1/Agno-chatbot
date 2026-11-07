"use strict";

/* The message input box. */

function autosizeComposer() {
    const input = els.composerInput;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
}

function onComposerKeydown(event) {
    const isPlainEnter = event.key === "Enter" && !event.shiftKey && !event.isComposing;
    if (isPlainEnter) {
        event.preventDefault();
        sendMessage();
    }
}
