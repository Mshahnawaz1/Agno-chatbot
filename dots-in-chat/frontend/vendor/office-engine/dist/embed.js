
import "./default-worker-tP_-u1gt.js";
import { t as e } from "./DocViewer-CoKYmKjl.js";
import { createElement as t } from "react";
import { createRoot as n } from "react-dom/client";
// src/embed.ts
var r = [
	"light",
	"dark",
	"auto"
];
function i(r, i) {
	let a = n(r), o = i, s = r.getRootNode() instanceof ShadowRoot ? r.getRootNode() : void 0, c = () => a?.render(t(e, {
		...o,
		styleTarget: s
	}));
	return c(), {
		update(e) {
			o = {
				...o,
				...e
			}, c();
		},
		destroy() {
			a?.unmount(), a = null;
		}
	};
}
var a = class extends HTMLElement {
	static observedAttributes = [
		"src",
		"name",
		"toolbar",
		"thumbnails",
		"editable",
		"save",
		"download",
		"file-menu",
		"open",
		"capture-select-all",
		"theme",
		"collab",
		"room",
		"user",
		"base",
		"comments"
	];
	viewer;
	_file;
	_icons;
	onLoad = (e) => this.dispatchEvent(new CustomEvent("load", { detail: {
		kind: e.kind,
		name: e.name
	} }));
	onError = (e) => this.dispatchEvent(new CustomEvent("error", { detail: e }));
	onComment = (e) => this.dispatchEvent(new CustomEvent("comment", { detail: e }));
	get file() {
		return this._file;
	}
	set file(e) {
		this._file = e, this.sync();
	}
	get icons() {
		return this._icons;
	}
	set icons(e) {
		this._icons = e, this.sync();
	}
	connectedCallback() {
		if (this.viewer) return;
		let e = this.shadowRoot ?? this.attachShadow({ mode: "open" }), t = document.createElement("div");
		t.style.cssText = "width:100%;height:100%", e.innerHTML = "<style>:host{display:block;height:480px;position:relative}</style>", e.appendChild(t), this.viewer = i(t, this.props());
	}
	disconnectedCallback() {
		this.viewer?.destroy(), this.viewer = void 0, this.shadowRoot && (this.shadowRoot.innerHTML = "");
	}
	attributeChangedCallback() {
		this.sync();
	}
	props() {
		return {
			src: this._file ?? this.getAttribute("src"),
			name: this.getAttribute("name") ?? void 0,
			toolbar: this.getAttribute("toolbar") !== "false",
			thumbnails: this.getAttribute("thumbnails") !== "false",
			editable: this.hasAttribute("editable") && this.getAttribute("editable") !== "false",
			allowSave: this.getAttribute("save") !== "false",
			allowDownload: this.getAttribute("download") !== "false",
			fileMenu: this.getAttribute("file-menu") !== "false",
			allowOpen: this.getAttribute("open") !== "false",
			captureSelectAll: this.getAttribute("capture-select-all") !== "false",
			theme: r.find((e) => e === this.getAttribute("theme")),
			icons: this._icons,
			collab: this.getAttribute("collab") && this.getAttribute("room") ? {
				transport: this.getAttribute("collab"),
				room: this.getAttribute("room"),
				base: Number(this.getAttribute("base")) || 0,
				user: { name: this.getAttribute("user") || "Guest" }
			} : void 0,
			comments: this.getAttribute("comments") !== "false" && {
				user: this.getAttribute("user") ? { name: this.getAttribute("user") } : void 0,
				onEvent: this.onComment
			},
			onLoad: this.onLoad,
			onError: this.onError
		};
	}
	sync() {
		this.viewer?.update(this.props());
	}
};
function o(e = "office-viewer") {
	typeof customElements < "u" && !customElements.get(e) && customElements.define(e, a);
}
o();
export { e as DocViewer, a as OfficeViewerElement, o as defineElement, i as mount };

//# sourceMappingURL=embed.js.map