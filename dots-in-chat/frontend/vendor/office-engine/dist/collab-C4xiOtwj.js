
import { M as e, i as t, n, r, st as i, t as a } from "./xlsx-ops-D_58Pncw.js";
// src/collab/hosts.ts
var o = /* @__PURE__ */ new WeakMap(), s = /* @__PURE__ */ new WeakMap();
function c(e, t, n) {
	let r = o.get(e);
	r || o.set(e, r = /* @__PURE__ */ new Map()), r.set(t, n);
	for (let r of s.get(e)?.get(t) ?? []) r(n);
	return () => {
		r.get(t) === n && r.delete(t);
	};
}
function l(e, t) {
	return o.get(e)?.get(t);
}
function u(e, t, n) {
	let r = s.get(e);
	r || s.set(e, r = /* @__PURE__ */ new Map());
	let i = r.get(t);
	i || r.set(t, i = /* @__PURE__ */ new Set()), i.add(n);
	let a = l(e, t);
	return a && n(a), () => i.delete(n);
}
var d = /* @__PURE__ */ new WeakMap();
function f(e) {
	let t = d.get(e);
	return t || d.set(e, t = {
		peers: m,
		peerFns: /* @__PURE__ */ new Set(),
		localFns: /* @__PURE__ */ new Set()
	}), t;
}
function p(e, t) {
	let n = f(e);
	n.peers = t;
	for (let e of n.peerFns) e();
}
var m = [];
function h(e) {
	return d.get(e)?.peers ?? m;
}
function ee(e, t) {
	let n = f(e);
	return n.peerFns.add(t), () => n.peerFns.delete(t);
}
function te(e, t) {
	for (let n of d.get(e)?.localFns ?? []) n(t);
}
function ne(e, t) {
	let n = f(e);
	return n.localFns.add(t), () => n.localFns.delete(t);
}
// src/react/edit/rich.ts
var g = (e) => e.t === "text" ? e.text.length : 1, _ = (e) => e.reduce((e, t) => e + g(t), 0), v = (e) => e.a.pa === e.f.pa && e.a.o === e.f.o, y = (e, t) => e.replace(/(\d+)$/, (e) => String(Number(e) + t));
function b(e) {
	return e.map((e) => e.t === "text" ? e.text : "￼").join("");
}
function x(e, t) {
	if (e === t) return !0;
	if (!e || !t) return !e && !t;
	let n = Object.keys(e);
	if (n.length !== Object.keys(t).length) return !1;
	for (let r of n) if (e[r] !== t[r]) return !1;
	return !0;
}
var re = (e, t) => (e?.length ?? 0) === (t?.length ?? 0) && (!e || e.every((e, n) => t[n] === e)), ie = (e, t) => e.t === "text" && t.t === "text" && e.href === t.href && e.lk === t.lk && x(e.s, t.s) && x(e.d, t.d) && re(e.cm, t.cm) && x(e.tc, t.tc) && e.rp === t.rp;
function ae(e, t) {
	let n, r, i = 0;
	for (let a of e) {
		let e = g(a);
		if (i < t && t <= i + e && (n = a.cm), i <= t && t < i + e) {
			r = a.cm;
			break;
		}
		i += e;
	}
	let a = n?.filter((e) => r?.includes(e));
	return a?.length ? a : void 0;
}
function S(e, t) {
	if (re(e.cm, t)) return e;
	let n = { ...e };
	return t?.length ? n.cm = t : delete n.cm, n;
}
function C(e) {
	let t = [];
	for (let n of e) {
		if (n.t === "text" && !n.text) continue;
		let e = t[t.length - 1];
		e && ie(e, n) ? t[t.length - 1] = {
			...e,
			text: e.text + n.text
		} : t.push(n);
	}
	return t;
}
function w(e, t) {
	let n = [], r = [], i = 0;
	for (let a of e) {
		let e = g(a);
		if (i + e <= t) n.push(a);
		else if (i >= t) r.push(a);
		else {
			let e = t - i;
			n.push({
				...a,
				text: a.text.slice(0, e)
			}), r.push({
				...a,
				text: a.text.slice(e)
			});
		}
		i += e;
	}
	return [n, r];
}
function T(e, t) {
	let [n, r] = w(e, t);
	for (let e = n.length - 1; e >= 0; e--) if (n[e].t === "text") return n[e];
	return r.find((e) => e.t === "text");
}
function oe(e, t) {
	let n = 0, r = [];
	for (let t of e) {
		let e = g(t);
		r.push({
			a: n,
			b: n + e,
			href: t.t === "text" ? t.href : void 0
		}), n += e;
	}
	let i = e.findIndex((e, n) => e.t === "text" && r[n].a < t && t <= r[n].b);
	i < 0 && (i = e.findIndex((e) => e.t === "text"));
	let a = i >= 0 ? r[i].href : void 0;
	if (!a || t < r[i].a || t > r[i].b) return null;
	let o = i, s = i;
	for (; o > 0 && r[o - 1].href === a;) o--;
	for (; s < r.length - 1 && r[s + 1].href === a;) s++;
	return [r[o].a, r[s].b];
}
function se(e, t, n, r, i) {
	if (!n) return e;
	let [a, o] = w(e, t), s = T(e, t), c = {
		t: "text",
		...s ?? i ?? {},
		...r ?? {},
		text: n
	};
	return r?.tc || delete c.tc, r?.s && s?.s && (c.s = {
		...s.s,
		...r.s
	}), (r?.d || s?.d) && (c.d = {
		...s?.d ?? {},
		...r?.d ?? {}
	}), c.d && !Object.keys(c.d).length && delete c.d, c = S(c, ae(e, t)), C([
		...a,
		c,
		...o
	]);
}
function E(e, t, n) {
	return n <= t ? e : C([...w(e, t)[0], ...w(e, n)[1]]);
}
function ce(e, t, n, r, i) {
	let [a, o] = w(e, t), [s, c] = w(o, n - t), l = s.map((e) => e.t !== "text" && e.t !== "img" || !!e.cm?.includes(r) === i ? e : S(e, i ? [...e.cm ?? [], r] : e.cm.filter((e) => e !== r)));
	return C([
		...a,
		...l,
		...c
	]);
}
function le(e, t, n, r, i) {
	let [a, o] = w(e, t), [s, c] = w(o, n - t), l = s.map((e) => e.t === "text" ? {
		...e,
		s: {
			...e.s ?? {},
			...r
		},
		d: {
			...e.d ?? {},
			...i
		}
	} : e);
	return C([
		...a,
		...l,
		...c
	]);
}
function ue(e, t) {
	if (t <= 0) return 0;
	let n = Intl.Segmenter;
	if (n) {
		let r = 0;
		for (let i of new n(void 0, { granularity: "grapheme" }).segment(e.slice(0, t))) r = i.index;
		return r;
	}
	let r = e.charCodeAt(t - 1);
	return r >= 56320 && r <= 57343 && t >= 2 ? t - 2 : t - 1;
}
function de(e, t) {
	if (t >= e.length) return e.length;
	let n = Intl.Segmenter;
	if (n) for (let r of new n(void 0, { granularity: "grapheme" }).segment(e.slice(t))) return t + r.segment.length;
	let r = e.charCodeAt(t);
	return r >= 55296 && r <= 56319 ? t + 2 : t + 1;
}
// src/react/edit/input.ts
var fe = /* @__PURE__ */ new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End",
	"PageUp",
	"PageDown"
]);
function D(e, t) {
	let n = e.cmp(t.a.pa, t.f.pa);
	return n < 0 || n === 0 && t.a.o <= t.f.o ? [t.a, t.f] : [t.f, t.a];
}
var O = (e) => ({
	a: e,
	f: e
}), k = (e, t) => e.a.pa === t.a.pa && e.a.o === t.a.o && e.f.pa === t.f.pa && e.f.o === t.f.o;
function A(e, t) {
	let [n, r] = D(e, t);
	if (n.pa === r.pa) {
		let t = e.para(n.pa);
		return t ? {
			pas: [n.pa],
			paras: [e.withRuns(t, E(t.runs, n.o, r.o))],
			at: n
		} : null;
	}
	let i = e.span(n.pa, r.pa);
	if (!i) {
		let t = e.deleteAcross?.(n, r), i = t && e.para(t.pa);
		return t && i ? {
			pas: [t.pa],
			paras: [i],
			at: t,
			applied: !0
		} : null;
	}
	let a = e.para(i[0]), o = e.para(i[i.length - 1]), s = C([...w(a.runs, n.o)[0], ...w(o.runs, r.o)[1]]);
	return {
		pas: i,
		paras: [e.join(a, o, s)],
		at: n
	};
}
function j(e, t, n) {
	let r = A(e, t);
	r && !r.applied && e.replace(r.pas, r.paras, O(r.at), n);
}
function M(e, t) {
	if (!v(t)) return A(e, t);
	let n = e.para(t.a.pa);
	return n ? {
		pas: [t.a.pa],
		paras: [n],
		at: t.a
	} : null;
}
function pe(e, t, n, r = {}, i) {
	let a = M(e, t);
	if (!a) return;
	let o = a.paras[0], s = a.at.o, [c, l] = w(o.runs, s), u = T(o.runs, s) ?? e.defaultRun?.(o), d = u?.tc ? (({ tc: e, ...t }) => t)(u) : u, f = ae(o.runs, s), p = (e) => e.map((e) => S(e.t === "text" && !e.s && d ? {
		...d,
		...e,
		s: d.s,
		src: d.src
	} : e, f));
	if (n.length === 1) {
		let t = p(n[0]), i = C([
			...c,
			...t,
			...l
		]);
		e.replace(a.pas, [e.withRuns(o, i)], O({
			pa: a.at.pa,
			o: s + _(t)
		}), {
			label: "paste",
			...r
		});
		return;
	}
	let m = [], h = e.withRuns(o, C([...c, ...p(n[0])]));
	i?.[0] && (h = i[0](h));
	for (let t = 1; t < n.length; t++) {
		let r = t === n.length - 1, a = p(n[t]), [o, s] = e.split(h, h.runs, C([...a, ...r ? l : []]), !r);
		m.push(o), h = i?.[t] ? i[t](s) : s;
	}
	m.push(h), e.replace(a.pas, m, O({
		pa: y(a.at.pa, m.length - 1),
		o: _(p(n[n.length - 1]))
	}), {
		label: "paste",
		...r
	});
}
function N(e, t, n, r) {
	let i = M(e, t);
	if (!i) return;
	let a = e.pendingStyle?.();
	e.clearPending?.();
	let o = i.paras[0], s = i.at.o, c = n.replace(/\r\n?/g, "\n").split("\n");
	if (c.length === 1 || r?.label === "linebreak") {
		let t = se(o.runs, s, n, a, e.defaultRun?.(o));
		e.replace(i.pas, [e.withRuns(o, t)], O({
			pa: i.at.pa,
			o: s + n.length
		}), {
			label: "type",
			...r
		});
		return;
	}
	let l = a ? {
		...T(o.runs, s) ?? e.defaultRun?.(o) ?? {},
		...a
	} : void 0;
	pe(e, t, c.map((e) => e ? [{
		...l ?? {},
		t: "text",
		text: e
	}] : []), r);
}
function me(e, t) {
	let n = v(t) ? (() => {
		let n = e.para(t.a.pa);
		return n ? {
			pas: [t.a.pa],
			paras: [n],
			at: t.a
		} : null;
	})() : A(e, t);
	if (!n) return;
	let r = n.paras[0];
	if (v(t) && !_(r.runs) && e.enterAtEmpty?.(t.a.pa, r)) return;
	let [i, a] = w(r.runs, n.at.o), [o, s] = e.split(r, i, a, n.at.o >= _(r.runs));
	e.replace(n.pas, [o, s], O({
		pa: y(n.at.pa, 1),
		o: 0
	}), { label: "enter" });
}
function he(e, t, n = !1) {
	if (!v(t)) return j(e, t);
	let { pa: r, o: i } = t.a, a = e.para(r);
	if (!a) return;
	if (i > 0) {
		let t = b(a.runs), o = ue(t, i);
		if (n) {
			let e = /(\S+\s*|\s+)$/.exec(t.slice(0, i));
			e && (o = i - e[0].length);
		}
		e.replace([r], [e.withRuns(a, E(a.runs, o, i))], O({
			pa: r,
			o
		}), { label: "delete" });
		return;
	}
	if (e.backspaceAtStart?.(r, a)) return;
	let o = e.prev(r), s = o ? e.para(o) : void 0;
	if (!o || !s) return;
	let c = e.join(s, a, C([...s.runs, ...a.runs]));
	e.replace([o, r], [c], O({
		pa: o,
		o: _(s.runs)
	}), { label: "merge" });
}
function ge(e, t, n = !1) {
	if (!v(t)) return j(e, t);
	let { pa: r, o: i } = t.a, a = e.para(r);
	if (!a) return;
	if (i < _(a.runs)) {
		let t = b(a.runs), o = de(t, i);
		if (n) {
			let e = /^(\s*\S+|\s+)/.exec(t.slice(i));
			e && (o = i + e[0].length);
		}
		e.replace([r], [e.withRuns(a, E(a.runs, i, o))], O({
			pa: r,
			o: i
		}), { label: "delete" });
		return;
	}
	let o = e.next(r), s = o ? e.para(o) : void 0;
	if (!o || !s) return;
	let c = e.join(a, s, C([...a.runs, ...s.runs]));
	e.replace([r, o], [c], O({
		pa: r,
		o: i
	}), { label: "merge" });
}
function _e(e, t) {
	let n = (e && (e.nodeType === 1 ? e : e.parentElement))?.closest("[data-o]");
	return n && t.contains(n) ? n : null;
}
function ve(e) {
	let t = Number(e.dataset.o);
	return e.hasAttribute("data-obj") ? t + 1 : e.hasAttribute("data-empty") ? t : t + (e.textContent?.length ?? 0);
}
function P(e, t, n) {
	let r = (t.nodeType === 1 ? t : t.parentElement)?.closest("[data-pa]");
	if (!r || !e.contains(r)) return null;
	let i = r.dataset.pa;
	if (!_e(t, r)) {
		let e = document.createRange();
		e.setStart(t, n), e.collapse(!0);
		let a = 0;
		for (let t of Array.from(r.querySelectorAll("[data-o]"))) if (e.comparePoint(t, t.childNodes.length) < 0) a = ve(t);
		else break;
		return {
			pa: i,
			o: a
		};
	}
	let a = _e(t, r), o = Number(a.dataset.o);
	if (a.hasAttribute("data-empty")) return {
		pa: i,
		o
	};
	if (a.hasAttribute("data-obj")) return {
		pa: i,
		o: n > 0 || t !== a ? o + 1 : o
	};
	if (t.nodeType === 3) {
		let e = 0, r = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
		for (let a = r.nextNode(); a; a = r.nextNode()) {
			if (a === t) return {
				pa: i,
				o: o + e + Math.min(n, (a.textContent ?? "").length)
			};
			e += a.textContent?.length ?? 0;
		}
		return {
			pa: i,
			o: o + e
		};
	}
	let s = 0;
	for (let e = 0; e < Math.min(n, a.childNodes.length); e++) s += a.childNodes[e].textContent?.length ?? 0;
	return {
		pa: i,
		o: o + s
	};
}
function F(e, t) {
	let n = e.querySelector(`[data-pa="${t.pa}"]`);
	if (!n) return null;
	let r = Array.from(n.querySelectorAll("[data-o]"));
	if (!r.length) return [n, n.childNodes.length];
	let i;
	for (let e of r) {
		let n = Number(e.dataset.o), r = ve(e);
		if (t.o >= n && t.o <= r && (i = e, t.o < r || !e.hasAttribute("data-obj"))) break;
	}
	i ??= r[r.length - 1];
	let a = Number(i.dataset.o);
	if (i.hasAttribute("data-obj") || i.hasAttribute("data-empty")) {
		let e = i.parentNode, n = Array.prototype.indexOf.call(e.childNodes, i);
		if (i.hasAttribute("data-empty")) {
			let t = i.firstChild;
			return t ? [t, 0] : [e, n];
		}
		return [e, t.o > a ? n + 1 : n];
	}
	let o = Math.max(0, t.o - a), s = document.createTreeWalker(i, NodeFilter.SHOW_TEXT), c = null;
	for (let e = s.nextNode(); e; e = s.nextNode()) {
		let t = e.textContent?.length ?? 0;
		if (o <= t) return [e, o];
		o -= t, c = e;
	}
	return c ? [c, c.textContent?.length ?? 0] : [i, 0];
}
function I(e) {
	let t = e.getRootNode();
	return typeof ShadowRoot < "u" && t instanceof ShadowRoot && typeof t.getSelection == "function" ? t.getSelection() : (e.ownerDocument ?? document).getSelection();
}
function L(e) {
	let t = e.getRootNode(), n = I(e);
	if (!n) return null;
	if (typeof ShadowRoot < "u" && t instanceof ShadowRoot && n.anchorNode && !e.contains(n.anchorNode)) {
		let e = n.getComposedRanges?.call(n, { shadowRoots: [t] })[0];
		if (e) return {
			anchorNode: e.startContainer,
			anchorOffset: e.startOffset,
			focusNode: e.endContainer,
			focusOffset: e.endOffset
		};
	}
	return n;
}
var ye = class {
	host;
	root = null;
	composing = null;
	justComposed = "";
	raf = 0;
	last = null;
	get lastSel() {
		return this.last;
	}
	set lastSel(e) {
		this.last = e, this.expected = null;
	}
	override = null;
	expected = null;
	seen = null;
	constructor(e) {
		this.host = e;
	}
	attach(e) {
		this.root !== e && (this.detach(), this.root = e, e.addEventListener("beforeinput", this.onBeforeInput), e.addEventListener("compositionstart", this.onCompStart), e.addEventListener("compositionend", this.onCompEnd), e.addEventListener("keydown", this.onKeyDown), e.addEventListener("mousedown", this.onMouseDown), e.addEventListener("copy", this.onCopy), e.addEventListener("cut", this.onCopy), document.addEventListener("selectionchange", this.onSelChange));
	}
	detach() {
		let e = this.root;
		e && (e.removeEventListener("beforeinput", this.onBeforeInput), e.removeEventListener("compositionstart", this.onCompStart), e.removeEventListener("compositionend", this.onCompEnd), e.removeEventListener("keydown", this.onKeyDown), e.removeEventListener("mousedown", this.onMouseDown), e.removeEventListener("copy", this.onCopy), e.removeEventListener("cut", this.onCopy), document.removeEventListener("selectionchange", this.onSelChange), cancelAnimationFrame(this.raf), this.raf = 0, this.root = null, this.override = null, this.expected = null, this.seen = null);
	}
	get isComposing() {
		return !!this.composing;
	}
	readSel() {
		let e = this.root, t = e ? L(e) : null;
		if (!e || !t || !t.anchorNode || !t.focusNode || !e.contains(t.anchorNode) || !e.contains(t.focusNode)) return null;
		let n = P(e, t.anchorNode, t.anchorOffset), r = P(e, t.focusNode, t.focusOffset);
		return n && r && (this.seen = t.anchorNode), n && r ? {
			a: n,
			f: r
		} : null;
	}
	expect(e) {
		this.expected = e;
	}
	get caret() {
		return this.expected ?? this.last;
	}
	live() {
		return this.override?.model ?? this.expected ?? this.sel();
	}
	repair() {
		let e = this.root, t = this.seen;
		if (!e || this.composing || this.override || !t || t.isConnected || !this.lastSel) return !1;
		let n = L(e);
		return !n?.anchorNode || !e.contains(n.anchorNode) || this.readSel() ? !1 : (this.seen = null, this.restore(this.lastSel, !1));
	}
	sel() {
		return this.override?.model ?? this.readSel() ?? this.lastSel;
	}
	selectAll() {
		let e = this.root, t = this.host.all?.();
		if (!e || !t) return !1;
		let n = Array.from(e.querySelectorAll("[data-pa]")).filter((t) => {
			let n = t.closest("[contenteditable=\"false\"]");
			return this.host.para(t.dataset.pa) && !(n && e.contains(n));
		}), r = n[0], i = n[n.length - 1], a = r && i ? {
			a: {
				pa: r.dataset.pa,
				o: 0
			},
			f: {
				pa: i.dataset.pa,
				o: _(this.host.para(i.dataset.pa).runs)
			}
		} : t;
		return this.restore(a), this.override = {
			model: t,
			dom: this.readSel() ?? a
		}, this.host.onSelection?.(t), !0;
	}
	restore(e, t = !0) {
		let n = this.root;
		if (!n || !e) return !1;
		this.override = null;
		let r = F(n, e.a), i = F(n, e.f);
		if (!r || !i) return this.last = e, this.expected = e, !1;
		let a = n.getRootNode().activeElement;
		t && a !== n && !n.contains(a) && n.focus({ preventScroll: !0 });
		let o = I(n);
		try {
			o?.setBaseAndExtent(r[0], r[1], i[0], i[1]);
		} catch {}
		return this.lastSel = e, this.expected = null, !0;
	}
	rangeSel(e) {
		if (!e || !this.root) return null;
		let t = P(this.root, e.startContainer, e.startOffset), n = P(this.root, e.endContainer, e.endOffset);
		return t && n ? {
			a: t,
			f: n
		} : null;
	}
	onBeforeInput = (e) => {
		let t = e.inputType;
		if (this.composing || t === "insertCompositionText") return;
		if (t === "deleteCompositionText" || t === "insertFromComposition") {
			if (e.cancelable && e.preventDefault(), t === "insertFromComposition" && e.data && e.data !== this.justComposed) {
				let t = this.live();
				t && N(this.host, t, e.data, { remount: !0 });
			}
			this.justComposed = "";
			return;
		}
		e.preventDefault();
		let n = this.rangeSel(e.getTargetRanges?.()[0]), r = this.live();
		if (!r) return;
		let i = this.host;
		switch (t) {
			case "insertText":
			case "insertReplacementText": {
				let a = e.data ?? e.dataTransfer?.getData("text/plain") ?? "";
				N(i, t === "insertReplacementText" && n ? n : r, a);
				break;
			}
			case "insertParagraph":
				me(i, r);
				break;
			case "insertLineBreak":
				N(i, r, "\n", { label: "linebreak" });
				break;
			case "insertFromPaste":
			case "insertFromDrop":
			case "insertFromYank": {
				if (e.dataTransfer && i.pasteRich?.(t === "insertFromDrop" && n ? n : r, e.dataTransfer)) break;
				let a = e.dataTransfer?.getData("text/plain") ?? e.data ?? "";
				a && N(i, r, a);
				break;
			}
			case "deleteContentBackward":
				he(i, r);
				break;
			case "deleteWordBackward":
				he(i, r, !0);
				break;
			case "deleteContentForward":
				ge(i, r);
				break;
			case "deleteWordForward":
				ge(i, r, !0);
				break;
			case "deleteSoftLineBackward":
			case "deleteHardLineBackward":
			case "deleteSoftLineForward":
			case "deleteHardLineForward":
			case "deleteByCut":
			case "deleteByDrag":
			case "deleteContent":
			case "deleteEntireSoftLine":
				v(r) ? n && !v(n) && j(i, n) : j(i, r);
				break;
			case "historyUndo":
				i.undo();
				break;
			case "historyRedo":
				i.redo();
				break;
			case "formatBold":
				i.toggle?.("b");
				break;
			case "formatItalic":
				i.toggle?.("i");
				break;
			case "formatUnderline": i.toggle?.("u");
		}
	};
	onCompStart = () => {
		this.composing = this.live();
	};
	onCompEnd = (e) => {
		let t = this.composing;
		this.composing = null, t && (this.justComposed = e.data ?? "", e.data ? N(this.host, t, e.data, { remount: !0 }) : N(this.host, t, "", { remount: !0 }), setTimeout(() => this.justComposed = "", 0));
	};
	onKeyDown = (e) => {
		if (e.isComposing || this.composing) return;
		let t = e.metaKey || e.ctrlKey, n = e.key.toLowerCase();
		if (this.host.shortcut?.(e)) e.preventDefault();
		else {
			if (t && !e.altKey) {
				if (n === "z") {
					e.preventDefault(), e.shiftKey ? this.host.redo() : this.host.undo();
					return;
				}
				if (n === "y") {
					e.preventDefault(), this.host.redo();
					return;
				}
				if (n === "a" && !e.shiftKey) {
					this.selectAll() && e.preventDefault();
					return;
				}
				if (n === "b" || n === "i" || n === "u") {
					e.preventDefault(), this.host.toggle?.(n);
					return;
				}
			}
			if (fe.has(e.key) && (this.expected = null), (e.key === "ArrowRight" || e.key === "ArrowLeft") && !t && !e.shiftKey && !e.altKey) {
				let t = this.live();
				t && v(t) && this.host.arrow?.(t, e.key === "ArrowRight" ? 1 : -1) && e.preventDefault();
			} else if (e.key === "Tab" && !t) {
				e.preventDefault();
				let t = this.live();
				if (!t) return;
				!this.host.tab?.(t, e.shiftKey) && !e.shiftKey && N(this.host, t, "	");
			}
		}
	};
	onMouseDown = () => {
		this.expected = null;
	};
	onCopy = (e) => {
		let t = this.live();
		e.clipboardData && t && !v(t) && this.host.copy?.(t, e.clipboardData, e.type === "cut") && e.preventDefault();
	};
	onSelChange = () => {
		this.raf ||= requestAnimationFrame(() => {
			this.raf = 0;
			let e = this.readSel(), t = this.override;
			if (t && e && !k(e, t.dom)) this.override = null;
			else if (t) {
				this.host.onSelection?.(t.model);
				return;
			}
			e && this.expected && k(e, this.expected) && (this.expected = null), e && !this.expected && (this.lastSel = e), this.host.onSelection?.(this.expected ?? e);
		});
	};
}, R = [
	"#1a73e8",
	"#e8710a",
	"#188038",
	"#d93025",
	"#9334e6",
	"#c5221f",
	"#007b83",
	"#b06000",
	"#3f51b5",
	"#e52592"
], be = (e) => !!e && typeof e == "object" && "cid" in e && "prev" in e;
async function z(e, t) {
	let n = await e.direct("comments.set", t.cid, t.c);
	return {
		undo: {
			cid: t.cid,
			prev: n
		},
		result: n
	};
}
function B(e, t) {
	return be(t) ? e.direct("comments.set", t.cid, t.prev).then(() => void 0) : !1;
}
// src/collab/docx.ts
var xe = /* @__PURE__ */ new Set([
	"open",
	"part",
	"docx.start",
	"docx.convert",
	"save",
	"dirty"
]), Se = (e) => typeof e == "object" && !!e && !Array.isArray(e), V = (e, t) => Se(e) && Object.keys(e).every((e) => t.includes(e)), H = (e, t) => typeof e == "string" && e.length <= t, Ce = (e) => e === null || typeof e == "boolean" || typeof e == "number" && Number.isFinite(e) || H(e, 255), we = [
	"normal",
	"title",
	"subtitle",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6"
], Te = [
	"b",
	"i",
	"u",
	"strike",
	"color",
	"sz",
	"font",
	"align",
	"line",
	"lineRule",
	"before",
	"after"
], Ee = [
	"w",
	"h",
	"mt",
	"mr",
	"mb",
	"ml",
	"cols",
	"colGap"
], De = [
	"header",
	"footer",
	"firstHeader",
	"firstFooter"
], Oe = 4194304, ke = (e) => V(e, [
	"text",
	"align",
	"b",
	"sz"
]) && H(e.text, 2e3) && (e.align === void 0 || H(e.align, 10)) && (e.b === void 0 || typeof e.b == "boolean") && (e.sz === void 0 || typeof e.sz == "number");
function Ae(e) {
	return !V(e, [
		"parts",
		"raw",
		"titlePg"
	]) || e.titlePg !== void 0 && typeof e.titlePg != "boolean" || e.parts !== void 0 && !(V(e.parts, De) && Object.values(e.parts).every((e) => Array.isArray(e) && e.length <= 20 && e.every(ke))) ? !1 : e.raw === void 0 || V(e.raw, De) && Object.values(e.raw).every((e) => H(e, Oe));
}
var je = i({
	"docx.style": (e) => e.length === 1 && we.includes(e[0]),
	"docx.styleSet": (e) => e.length === 2 && H(e[0], 255) && V(e[1], Te) && Object.values(e[1]).every(Ce),
	"docx.page": (e) => e.length === 1 && V(e[0], Ee) && Object.values(e[0]).every((e) => typeof e == "number" && Number.isFinite(e)),
	"docx.hf": (e) => e.length === 1 && Ae(e[0])
});
function Me(e, t) {
	let n = typeof e == "string" ? je[e] : void 0;
	return !!n && Array.isArray(t) && n(t);
}
var Ne = /^[a-z0-9]{1,8}$/i;
function Pe(e) {
	let t = () => /* @__PURE__ */ Error(`Collaboration: operation refused (${String(e.method ?? e.t).slice(0, 40)})`);
	if (e.t === "call") {
		if (!Me(e.method, e.args)) throw t();
	} else if (e.t === "image") {
		if (!H(e.key, 200) || !(e.bytes instanceof Uint8Array) || typeof e.ext != "string" || !Ne.test(e.ext)) throw t();
	} else if (e.t === "link" && (!H(e.key, 200) || !H(e.url, 8192))) throw t();
}
var U = (e) => e.t === "p" ? e.pid === void 0 ? null : { p: e.pid } : e.t === "tbl" ? {
	tid: e.tid,
	item: e.item
} : null;
function Fe(e, t) {
	return e ? "p" in t ? e.t === "p" && e.pid === t.p : e.t === "tbl" && (t.tid !== void 0 && e.tid === t.tid || t.item !== void 0 && e.item === t.item) : !1;
}
var Ie = (e) => [...new Set(e)];
function W(e, t = []) {
	for (let n of e) if (n.t === "p" && n.pid !== void 0) t.push(n.pid);
	else if (n.t === "tbl") for (let e of n.rows) for (let n of e.cells) W(n.blocks, t);
	return t;
}
function Le(e) {
	if (e.t !== "text") return JSON.stringify(e);
	let { text: t, ...n } = e;
	return JSON.stringify(n);
}
function Re(e, t) {
	let n = (e) => {
		let t = [];
		for (let n of e) {
			let e = Le(n);
			if (n.t === "text") for (let r = 0; r < n.text.length; r++) t.push(e + "\0" + n.text[r]);
			else t.push(e);
		}
		return t;
	}, r = n(e), i = n(t), a = 0;
	for (; a < r.length && a < i.length && r[a] === i[a];) a++;
	let o = 0;
	for (; o < r.length - a && o < i.length - a && r[r.length - 1 - o] === i[i.length - 1 - o];) o++;
	if (a === r.length && a === i.length) return null;
	let [, s] = w(t, a), [c] = w(s, i.length - a - o);
	return {
		at: a,
		del: r.length - a - o,
		ins: c
	};
}
function ze(e, t, n, r) {
	let i = _(e), a = Math.max(0, Math.min(t, i)), o = Math.max(0, Math.min(n, i - a)), [s, c] = w(e, a), [, l] = w(c, o);
	return C([
		...s,
		...r,
		...l
	]);
}
function Be(e, t, n, r, i) {
	return e < t || e === t && (n > 0 || i) ? e : e >= t + n ? e - n + r : t + r;
}
function Ve(e, t, n) {
	if (t === n) return e;
	let r = 0;
	for (; r < t.length && r < n.length && t[r] === n[r];) r++;
	let i = 0;
	for (; i < t.length - r && i < n.length - r && t[t.length - 1 - i] === n[n.length - 1 - i];) i++;
	return e <= r ? e : e >= t.length - i ? n.length - (t.length - e) : n.length - i;
}
var He = (e, t) => e.pid === t.pid && e.from === t.from && e.sid === t.sid && !!e.pb == !!t.pb && e.keepSect === t.keepSect && JSON.stringify(e.pd ?? null) === JSON.stringify(t.pd ?? null) && JSON.stringify(e.ps) === JSON.stringify(t.ps) && JSON.stringify(e.orig ?? null) === JSON.stringify(t.orig ?? null), Ue = class {
	client;
	host;
	suppress = 0;
	res = /* @__PURE__ */ new Map();
	resKey = /* @__PURE__ */ new Map();
	results = /* @__PURE__ */ new WeakMap();
	snap = null;
	touchedModel = !1;
	site = 0;
	counter = 0;
	offHost;
	onPresence;
	lastPresence = "";
	raf = 0;
	push;
	submit;
	constructor(e) {
		this.client = e;
	}
	ready() {
		return new Promise((e) => {
			this.offHost = u(this.client, "docx", (t) => {
				this.host?.editor !== t.editor && (this.host && (this.host.editor.onCommit = void 0), this.host = t, t.editor.onCommit = (e) => this.onCommit(e), this.allocPids(), e());
			}), typeof document < "u" && document.addEventListener("selectionchange", this.onSel);
		});
	}
	setSite(e) {
		this.site = e, this.allocPids();
	}
	allocPids() {
		let e = this.host?.editor;
		if (!e || !this.site) return;
		let t = 2e9 + this.site * 1e7;
		(e.nextPid < t || e.nextPid >= t + 1e7) && (e.nextPid = t);
	}
	dispose() {
		this.offHost?.(), this.host && (this.host.editor.onCommit = void 0), typeof document < "u" && document.removeEventListener("selectionchange", this.onSel), this.raf && cancelAnimationFrame(this.raf);
	}
	captures(e) {
		return e === "comments.set" || !this.suppress && !xe.has(e) && e !== "docx.edit" && e !== "docx.table" && e.startsWith("docx.");
	}
	intercept(e, t) {
		if (this.submit && this.captures(e)) {
			switch (e) {
				case "comments.set": return this.submit({
					t: "comment",
					cid: t[0],
					c: t[1]
				});
				case "docx.image": {
					let e = new Uint8Array(t[0].slice(0));
					return this.submit({
						t: "image",
						key: this.key(),
						bytes: e,
						ext: t[1]
					});
				}
				case "docx.link": return this.submit({
					t: "link",
					key: this.key(),
					url: t[0]
				});
			}
			return this.submit({
				t: "call",
				method: e,
				args: t
			});
		}
	}
	key() {
		return `${this.site}:${++this.counter}:${Math.random().toString(36).slice(2, 7)}`;
	}
	get st() {
		return this.host.st;
	}
	get ed() {
		return this.host.editor;
	}
	locate(e) {
		let t = [];
		return this.st.blocks.forEach((n, r) => {
			n.t === "p" ? n.pid === e && t.push({
				list: this.st.blocks,
				index: r,
				pa: String(r),
				p: n
			}) : n.t === "tbl" && n.rows.forEach((n, i) => n.cells.forEach((n, a) => n.blocks.forEach((o, s) => {
				o.t === "p" && o.pid === e && t.push({
					list: n.blocks,
					index: s,
					pa: `${r}.${i}.${a}.${s}`,
					p: o
				});
			})));
		}), t;
	}
	topIndex(e) {
		return this.st.blocks.findIndex((t) => Fe(t, e));
	}
	region(e) {
		let t = new Set(e);
		for (let n of e) {
			let e = this.locate(n)[0];
			if (!e) continue;
			let r = [];
			for (let n = e.index; n < e.list.length; n++) {
				let i = e.list[n];
				if (i.t !== "p" || i.pid === void 0 || !t.has(i.pid)) break;
				r.push(e.pa.replace(/\d+$/, String(n)));
			}
			return r;
		}
		return null;
	}
	remap(e) {
		if (e.t === "img") {
			let t = e.ck, n = t ? this.res.get(t) : void 0;
			return n && typeof n == "object" ? {
				...e,
				rid: n.rid,
				target: n.path
			} : e;
		}
		if (e.t === "text") {
			let t = e.lck, n = t ? this.res.get(t) : void 0;
			return typeof n == "string" ? {
				...e,
				lk: n
			} : e;
		}
		return e.t === "p" ? {
			...e,
			runs: e.runs.map((e) => this.remap(e))
		} : e.t === "tbl" ? {
			...e,
			rows: e.rows.map((e) => ({
				...e,
				cells: e.cells.map((e) => ({
					...e,
					blocks: e.blocks.map((e) => this.remap(e))
				}))
			}))
		} : e;
	}
	tag(e) {
		return e.t === "img" && e.rid && this.resKey.has(e.rid) && !e.ck ? {
			...e,
			ck: this.resKey.get(e.rid)
		} : e.t === "text" && e.lk && this.resKey.has(e.lk) && !e.lck ? {
			...e,
			lck: this.resKey.get(e.lk)
		} : e.t === "p" ? {
			...e,
			runs: e.runs.map((e) => this.tag(e)),
			caret: void 0
		} : e.t === "tbl" ? {
			...e,
			rows: e.rows.map((e) => ({
				...e,
				cells: e.cells.map((e) => ({
					...e,
					blocks: e.blocks.map((e) => this.tag(e))
				}))
			}))
		} : e;
	}
	async fetchRes(e) {
		if (Pe(e), e.t === "image" && !this.res.has(e.key)) {
			let t = await this.client.direct("docx.image", e.bytes.slice().buffer, e.ext);
			this.res.set(e.key, t), this.resKey.set(t.rid, e.key);
		} else if (e.t === "link" && !this.res.has(e.key)) {
			let t = await this.client.direct("docx.link", e.url);
			this.res.set(e.key, t), this.resKey.set(t, e.key);
		} else if (e.t === "call" && !this.results.has(e)) {
			let t = this.client.direct.bind(this.client);
			this.results.set(e, await t(e.method, ...e.args));
		}
	}
	onCommit(e) {
		if (this.suppress || !this.push) return;
		if (e.kind === "paras") {
			let t = e.before, n = e.next;
			if (t.length === 1 && n.length === 1 && t[0].pid !== void 0 && He(t[0], n[0]) && this.locate(t[0].pid).length === 1) {
				let e = Re(t[0].runs, n[0].runs);
				if (!e) return;
				this.push({
					t: "text",
					pid: t[0].pid,
					at: e.at,
					del: e.del,
					ins: e.ins.map((e) => this.tag(e))
				}, [{
					t: "paras",
					before: t,
					next: n
				}]);
				return;
			}
			this.push({
				t: "paras",
				before: t.map((e) => e.pid),
				next: n.map((e) => this.tag(e))
			}, [{
				t: "paras",
				before: t,
				next: n
			}]);
			return;
		}
		let t = e.bi > 0 ? U(this.st.blocks[e.bi - 1]) : null;
		this.push({
			t: "blocks",
			before: e.before.map(U).filter((e) => !!e),
			prev: t,
			next: e.next.map((e) => this.tag(e))
		}, [{
			t: "blocks",
			before: e.before,
			next: e.next,
			prev: t
		}]);
	}
	transform(e, t) {
		if (e.t !== "text") return e;
		if (t.t === "text" && t.pid === e.pid) {
			let n = _(t.ins), r = Be(e.at, t.at, t.del, n, !1), i = e.del ? Math.max(r, Be(e.at + e.del, t.at, t.del, n, !0)) : r;
			return r === e.at && i - r === e.del ? e : {
				...e,
				at: r,
				del: i - r
			};
		}
		return t.t === "paras" && (t.before.includes(e.pid) || t.next.some((t) => t.pid === e.pid)) ? t.next.some((t) => t.pid === e.pid) ? e : null : t.t === "blocks" && t.before.some((t) => "p" in t && t.p === e.pid) && !W(t.next).includes(e.pid) ? null : e;
	}
	touched(e) {
		switch (e.t) {
			case "text": return ["p" + e.pid];
			case "paras": return [...e.before, ...e.next.map((e) => e.pid)].map((e) => "p" + e);
			case "comment": return ["c" + e.cid];
			case "blocks": {
				let t = [
					...e.before,
					...e.prev ? [e.prev] : [],
					...e.next.map(U).filter((e) => !!e)
				].map((e) => "p" in e ? "p" + e.p : "t" + (e.item ?? "n" + e.tid));
				for (let n of W(e.next)) t.push("p" + n);
				return t;
			}
			default: return [];
		}
	}
	conflicts(e, t) {
		let n = new Set(e.flatMap((e) => this.touched(e)));
		return t.some((e) => this.touched(e).some((e) => n.has(e)));
	}
	pessimistic(e) {
		return e.t === "call";
	}
	async prepare(e) {
		for (; this.host?.editor.input.isComposing;) await new Promise((e) => setTimeout(e, 50));
		for (let t of e) await this.fetchRes(t);
		this.capture();
	}
	async apply(e, t) {
		switch (e.t) {
			case "comment": return z(this.client, e);
			case "image":
			case "link": return await this.fetchRes(e), { result: this.res.get(e.key) };
			case "call": {
				await this.fetchRes(e);
				let t = this.results.get(e);
				return (e.method === "docx.style" || e.method === "docx.styleSet") && t && typeof t == "object" && this.host && this.ed.styled(t), e.method === "docx.page" && t && typeof t == "object" && this.host && this.ed.paged(t), e.method === "docx.hf" && t && typeof t == "object" && this.host && this.ed.hfed(t), { result: t };
			}
		}
		if (!this.host) throw Error("Document editor not ready");
		(t === "remote" || t === "replay") && this.capture(), this.touchedModel = !0, this.suppress++;
		try {
			return { undo: this.run(e) };
		} finally {
			this.suppress--;
		}
	}
	home(e) {
		let t = (t) => {
			let n = e.list[t];
			return n?.t === "tbl" ? U(n) ?? void 0 : void 0;
		};
		if (e.list === this.st.blocks) return {
			index: e.index,
			prevT: t(e.index - 1),
			nextT: t(e.index + 1)
		};
		let [n, r, i] = e.pa.split(".").map(Number), a = U(this.st.blocks[n]);
		return a ? {
			index: e.index,
			cell: {
				tbl: a,
				ri: r,
				ci: i
			}
		} : { index: e.index };
	}
	homePa(e) {
		if (e.cell) {
			let t = this.topIndex(e.cell.tbl), n = this.st.blocks[t], r = n?.t === "tbl" ? n.rows[e.cell.ri]?.cells[e.cell.ci] : void 0;
			return r ? `${t}.${e.cell.ri}.${e.cell.ci}.${Math.min(e.index, r.blocks.length)}` : void 0;
		}
		let t = e.prevT ? this.topIndex(e.prevT) : -1;
		if (t >= 0) return String(t + 1);
		let n = e.nextT ? this.topIndex(e.nextT) : -1;
		return String(n >= 0 ? n : Math.min(e.index, this.st.blocks.length));
	}
	run(e) {
		let t = this.ed;
		if (e.t === "text") {
			let n = this.locate(e.pid);
			if (n.length !== 1 || !t.para(n[0].pa)) return null;
			let r = n[0].p, i = {
				...r,
				runs: ze(r.runs, e.at, e.del, e.ins.map((e) => this.remap(e))),
				edited: !0
			};
			return t.replace([n[0].pa], [i], this.sel(), {
				history: !1,
				label: "collab"
			}), [{
				t: "paras",
				before: [r],
				next: [i]
			}];
		}
		if (e.t === "paras") {
			let n = e.next.map((e) => this.remap(e)), r = new Set(n.map((e) => e.pid)), i = this.region(e.before);
			if (!i || !i.length) return null;
			let a = [], o = new Set(i.map((e) => t.para(e)?.pid ?? -1));
			for (let n of Ie([...e.before, ...r])) if (!o.has(n)) for (let e of this.locate(n).reverse()) {
				if (!t.para(e.pa)) continue;
				let n = (t) => {
					let n = e.list[t];
					return n?.t === "p" && n.pid !== void 0 ? {
						pid: n.pid,
						k: this.locate(n.pid).findIndex((n) => n.list === e.list && n.index === t)
					} : void 0;
				}, r = {
					t: "paras",
					before: [e.p],
					next: [],
					prev: n(e.index - 1),
					after: n(e.index + 1),
					home: this.home(e)
				};
				t.replace([e.pa], [], this.sel(), {
					history: !1,
					label: "collab"
				}), a.push(r);
			}
			let s = this.region(e.before);
			if (!s?.length) return a;
			let c = s.map((e) => t.para(e)).filter(Boolean);
			return c.length === s.length && (t.replace(s, n, this.sel(), {
				history: !1,
				label: "collab"
			}), a.push({
				t: "paras",
				before: c,
				next: n
			})), a;
		}
		if (e.t === "blocks") {
			let n = e.next.map((e) => this.remap(e)), r, i = 0;
			if (e.before.length) {
				if (r = this.topIndex(e.before[0]), r < 0) {
					let t = e.before.find((e) => this.topIndex(e) >= 0);
					if (!t) return null;
					r = this.topIndex(t);
				}
				for (; r + i < this.st.blocks.length && e.before.some((e) => Fe(this.st.blocks[r + i], e));) i++;
			} else if (r = e.prev ? this.topIndex(e.prev) + 1 : 0, e.prev && r === 0) return null;
			let a = this.st.blocks.slice(r, r + i), o = new Map(a.flatMap((e) => e.t === "p" && e.pid !== void 0 ? [[e.pid, e]] : [])), s = new Set(e.before.flatMap((e) => "p" in e ? [e.p] : []));
			return n = n.flatMap((e) => e.t === "p" && e.pid !== void 0 && s.has(e.pid) ? o.has(e.pid) ? [o.get(e.pid)] : [] : [e]), t.replaceBlocks(r, i, n, null, !1), [{
				t: "blocks",
				before: a,
				next: n,
				prev: r > 0 ? U(this.st.blocks[r - 1]) : null
			}];
		}
		return null;
	}
	revert(e) {
		let t = B(this.client, e);
		if (t) return t;
		let n = e;
		if (n && this.host) {
			this.capture(), this.touchedModel = !0, this.suppress++;
			try {
				for (let e = n.length - 1; e >= 0; e--) this.undoStep(n[e]);
			} finally {
				this.suppress--;
			}
		}
	}
	undoStep(e) {
		let t = this.ed;
		if (e.t === "paras") {
			if (!e.next.length) {
				let n = (e) => e ? this.locate(e.pid)[e.k] : void 0, r = n(e.prev);
				if (r && t.para(r.pa)) return t.replace([r.pa], [r.p, ...e.before], this.sel(), {
					history: !1,
					label: "collab"
				});
				let i = n(e.after);
				if (i && t.para(i.pa)) return t.replace([i.pa], [...e.before, i.p], this.sel(), {
					history: !1,
					label: "collab"
				});
				let a = e.home && this.homePa(e.home);
				if (a !== void 0) for (let n of [...e.before].reverse()) t.restore(a, n);
				return;
			}
			let n = this.locate(e.next[0].pid)[0];
			if (!n) return;
			let r = e.next.map((e, t) => n.pa.replace(/\d+$/, String(n.index + t)));
			if (r.some((n, r) => t.para(n)?.pid !== e.next[r].pid)) return;
			t.replace(r, e.before, this.sel(), {
				history: !1,
				label: "collab"
			});
			return;
		}
		let n = e.next.length ? U(e.next[0]) : null, r = n ? this.topIndex(n) : e.prev ? this.topIndex(e.prev) + 1 : 0;
		if (r < 0) return;
		let i = new Map(this.st.blocks.slice(r, r + e.next.length).flatMap((e) => e.t === "p" && e.pid !== void 0 ? [[e.pid, e]] : []));
		t.replaceBlocks(r, e.next.length, e.before.map((e) => e.t === "p" && e.pid !== void 0 && i.has(e.pid) ? i.get(e.pid) : e), null, !1);
	}
	toD(e) {
		let t = this.ed.para(e.pa);
		if (!t || t.pid === void 0) return null;
		let n = this.locate(t.pid);
		return {
			pid: t.pid,
			k: Math.max(0, n.findIndex((t) => t.pa === e.pa)),
			o: e.o
		};
	}
	fromD(e) {
		let t = this.locate(e.pid), n = t[Math.min(e.k, t.length - 1)];
		return n ? {
			pa: n.pa,
			o: Math.min(e.o, _(n.p.runs))
		} : null;
	}
	capture() {
		if (this.snap || !this.host) return;
		let e = !!this.ed.input.readSel(), t = this.ed.input.sel(), n = t && this.toD(t.a), r = t && this.toD(t.f);
		if (!n || !r) return;
		let i = /* @__PURE__ */ new Map();
		for (let e of [n, r]) {
			let t = this.locate(e.pid)[e.k];
			t && i.set(`${e.pid}:${e.k}`, b(t.p.runs));
		}
		this.snap = {
			a: n,
			f: r,
			text: i,
			focused: e
		};
	}
	sel() {
		let e = this.snap, t = {
			pa: "0",
			o: 0
		};
		if (!e) return this.ed.input.lastSel ?? {
			a: t,
			f: t
		};
		let n = (n) => {
			let r = this.locate(n.pid)[n.k] ?? this.locate(n.pid)[0];
			if (!r) return this.ed.input.lastSel?.f ?? t;
			let i = e.text.get(`${n.pid}:${n.k}`), a = b(r.p.runs);
			return {
				pa: r.pa,
				o: i === void 0 ? Math.min(n.o, a.length) : Ve(n.o, i, a)
			};
		};
		return {
			a: n(e.a),
			f: n(e.f)
		};
	}
	settled() {
		let e = this.snap, t = this.touchedModel;
		if (this.touchedModel = !1, !this.host) return;
		if (!e) {
			t && (this.ed.pendingSel = null);
			return;
		}
		let n = this.sel();
		this.snap = null, this.ed.pendingSel = e.focused ? n : null, e.focused || (this.ed.input.lastSel = n);
	}
	onSel = () => {
		!this.raf && this.host && (this.raf = requestAnimationFrame(() => {
			this.raf = 0;
			let e = this.host && this.ed.input.readSel();
			if (!e) return;
			let t = this.toD(e.a), n = this.toD(e.f);
			if (!t || !n) return;
			let r = {
				k: "docx",
				a: t,
				f: n
			}, i = JSON.stringify(r);
			i !== this.lastPresence && (this.lastPresence = i, this.onPresence?.(r));
		}));
	};
	rects(e, t) {
		if (!this.host) return {
			caret: null,
			sel: []
		};
		let n = e.querySelector(".de-pages"), r = this.fromD(t.a), i = this.fromD(t.f);
		if (!n || !r || !i) return {
			caret: null,
			sel: []
		};
		let a = F(n, i), o = null;
		if (a) {
			let e = document.createRange();
			try {
				e.setStart(a[0], a[1]), e.collapse(!0), o = e.getClientRects()[0] ?? (a[0].nodeType === 1 ? a[0].getBoundingClientRect() : e.getBoundingClientRect());
			} catch {
				o = null;
			}
		}
		let s = [], c = F(n, r);
		if (c && a && (r.pa !== i.pa || r.o !== i.o)) {
			let e = document.createRange();
			try {
				this.ed.cmp(r.pa, i.pa) < 0 || r.pa === i.pa && r.o < i.o ? (e.setStart(c[0], c[1]), e.setEnd(a[0], a[1])) : (e.setStart(a[0], a[1]), e.setEnd(c[0], c[1]));
				for (let t of Array.from(e.getClientRects())) t.width > .5 && s.push(t);
			} catch {}
		}
		return {
			caret: o,
			sel: s
		};
	}
}, G = (e) => e !== null;
function We(t) {
	let n = Number.isFinite(t.site) ? t.site : 0;
	return {
		...t,
		name: typeof t.name == "string" ? t.name.slice(0, 200) : "",
		color: e(t.color) ?? R[Math.abs(Math.trunc(n)) % R.length]
	};
}
var Ge = class {
	transport;
	adapter;
	opts;
	site = 0;
	rev = 0;
	status = "connecting";
	error;
	peers = /* @__PURE__ */ new Map();
	log = [];
	inflight = null;
	buffer = [];
	queue;
	joined = !1;
	online = !1;
	counter = 0;
	listeners = /* @__PURE__ */ new Map();
	presence;
	presenceTimer;
	presenceAt = 0;
	closed = !1;
	constructor(e, t, n) {
		this.transport = e, this.adapter = t, this.opts = n, this.rev = n.base ?? 0, this.queue = Promise.resolve(t.ready?.()).catch((e) => this.fail(e.message)), e.onMessage = (e) => this.enqueue(() => this.onMessage(e)), e.onStatus = (t) => {
			t === "open" ? (this.online = !0, e.send(this.joined ? {
				t: "hello",
				room: n.room,
				user: n.user,
				have: this.rev,
				site: this.site
			} : {
				t: "hello",
				room: n.room,
				user: n.user,
				base: n.base || void 0
			})) : t === "closed" && (this.online = !1, this.peers.clear(), this.emit("peers", []), this.status !== "error" && this.setStatus(this.joined ? "offline" : "connecting"));
		}, e.connect();
	}
	get pending() {
		return (this.inflight?.items.length ?? 0) + this.buffer.length;
	}
	nextId() {
		return `${this.site}.${++this.counter}.${Math.random().toString(36).slice(2, 6)}`;
	}
	submit(e) {
		return new Promise((t, n) => this.enqueue(async () => {
			if (this.status === "error") return n(Error(this.error ?? "Collaboration stopped"));
			if (this.adapter.pessimistic?.(e)) this.buffer.push({
				op: e,
				applied: !1,
				done: t
			});
			else {
				let r;
				try {
					r = await this.adapter.apply(e, "local");
				} catch (e) {
					return n(e);
				}
				this.buffer.push({
					op: e,
					applied: !0,
					undo: r.undo
				}), t(r.result);
			}
			this.flush();
		}));
	}
	push(e, t) {
		this.buffer.push({
			op: e,
			applied: !0,
			undo: t
		}), this.enqueue(async () => this.flush());
	}
	setPresence(e) {
		if (this.presence = e, this.presenceTimer) return;
		let t = Math.max(0, 80 - (Date.now() - this.presenceAt));
		this.presenceTimer = setTimeout(() => {
			this.presenceTimer = void 0, this.presenceAt = Date.now(), this.online && this.joined && this.transport.send({
				t: "presence",
				data: this.presence
			});
		}, t);
	}
	on(e, t) {
		let n = this.listeners.get(e);
		return n || this.listeners.set(e, n = /* @__PURE__ */ new Set()), n.add(t), () => n.delete(t);
	}
	context(e = this.opts.logWindow ?? 5e3) {
		return e > 0 ? this.log.slice(-e) : [];
	}
	idle() {
		return this.queue;
	}
	close() {
		this.closed = !0, clearTimeout(this.presenceTimer), this.transport.close(), this.listeners.clear();
	}
	emit(e, t) {
		for (let n of this.listeners.get(e) ?? []) n(t);
	}
	setStatus(e) {
		this.status !== e && (this.status = e, this.emit("status", e));
	}
	fail(e) {
		this.error = e, this.setStatus("error"), this.emit("error", Error(e));
	}
	enqueue(e) {
		this.queue = this.queue.then(e).catch((e) => {
			console.error("[office-engine collab]", e), this.emit("error", e);
		});
	}
	async onMessage(e) {
		if (!(this.closed || this.status === "error")) switch (e.t) {
			case "welcome": {
				if (e.reset) return this.fail("The shared document history was reset; reopen the document");
				let t = !this.joined;
				this.site = e.site, this.joined = !0, t && (this.log = e.ctx ?? [], this.setStatus("syncing")), this.peers.clear();
				for (let t of e.peers) this.peers.set(t.site, We(t));
				this.emit("peers", [...this.peers.values()]);
				for (let t of e.log) await this.onBatch(t);
				this.inflight && (this.inflight.base = this.rev, this.transport.send({
					t: "ops",
					id: this.inflight.id,
					base: this.rev,
					ops: this.inflight.items.map((e) => e.op).filter(G)
				})), this.flush(), this.presence !== void 0 && this.transport.send({
					t: "presence",
					data: this.presence
				}), this.setStatus("live");
				return;
			}
			case "batch": return this.onBatch(e.b);
			case "presence": {
				let t = this.peers.get(e.site);
				t && (this.peers.set(e.site, {
					...t,
					presence: e.data
				}), this.emit("peers", [...this.peers.values()]));
				return;
			}
			case "join":
				this.peers.set(e.peer.site, We(e.peer)), this.emit("peers", [...this.peers.values()]);
				return;
			case "leave":
				this.peers.delete(e.site), this.emit("peers", [...this.peers.values()]);
				return;
			case "error": return this.fail(e.message);
		}
	}
	async onBatch(e) {
		if (e.seq <= this.rev) return;
		if (e.seq !== this.rev + 1) return this.fail(`Missed operations (${this.rev + 1}…${e.seq - 1})`);
		if (this.inflight && e.id === this.inflight.id) await this.ack(e);
		else {
			let t = this.canonical(e);
			if (t === null) return;
			await this.remote(t), this.log.push({
				seq: e.seq,
				site: e.site,
				ops: t
			});
		}
		this.rev = e.seq;
		let t = this.opts.logWindow ?? 5e3;
		this.log.length > t && this.log.splice(0, this.log.length - t), this.flush(), this.adapter.settled?.(), this.emit("change", void 0);
	}
	canonical(e) {
		let t = e.ops.map((e) => e);
		if (e.base < e.seq - 1 && (this.log[0]?.seq ?? Infinity) > e.base + 1 && this.rev > e.base) return this.fail("Operation is too old to merge; reopen the document"), null;
		for (let n of this.log) if (!(n.seq <= e.base || n.site === e.site)) for (let e of n.ops) t = t.map((t) => t === null ? null : this.adapter.transform(t, e));
		return t.filter(G);
	}
	async revertAll(e) {
		for (let t = e.length - 1; t >= 0; t--) {
			let n = e[t];
			if (n.applied) {
				try {
					await this.adapter.revert(n.undo);
				} catch (e) {
					console.error("[office-engine collab] revert failed", e);
				}
				n.applied = !1, n.undo = void 0;
			}
		}
	}
	async replay(e, t, n) {
		if (e.op) try {
			let r = await this.adapter.apply(e.op, t);
			if (e.undo = r.undo, e.applied = !0, e.done) {
				let t = e.done;
				e.done = void 0, n ? n.push(() => t(r.result)) : t(r.result);
			}
		} catch (e) {
			console.error("[office-engine collab] replay failed", e);
		}
	}
	async prepare(e) {
		try {
			await this.adapter.prepare?.(e);
		} catch (e) {
			console.error("[office-engine collab] prepare failed", e);
		}
	}
	async remote(e) {
		await this.prepare(e);
		let t = [...this.inflight?.items ?? [], ...this.buffer];
		if (!t.length) {
			for (let t of e) await this.applyRemote(t);
			return;
		}
		let n = t.map((t) => {
			let n = t.op;
			for (let t of e) n !== null && (n = this.adapter.transform(n, t));
			return n;
		}), r = t.filter((e) => e.applied && e.op).map((e) => e.op), i = n.some((e, n) => e !== t[n].op) || r.length > 0 && (this.adapter.conflicts?.(r, e) ?? !0);
		i && await this.revertAll(t);
		for (let t of e) await this.applyRemote(t);
		if (t.forEach((e, t) => e.op = n[t]), i) for (let e of t) !e.op || this.adapter.pessimistic?.(e.op) && !e.applied && e.done || await this.replay(e, "replay");
	}
	async applyRemote(e) {
		try {
			await this.adapter.apply(e, "remote");
		} catch (t) {
			console.error("[office-engine collab] remote op failed", t, e), this.emit("error", t);
		}
	}
	async ack(e) {
		let t = this.inflight.items;
		this.inflight = null;
		let n = t.findIndex((e) => e.op && !e.applied), r = [];
		if (n >= 0) {
			await this.prepare(t.slice(n).filter((e) => e.op && !e.applied).map((e) => e.op));
			let e = [...t.slice(n), ...this.buffer];
			await this.revertAll(e);
			for (let n of e) !t.includes(n) && n.op && this.adapter.pessimistic?.(n.op) && n.done || await this.replay(n, n.done ? "local" : "replay", r);
		}
		for (let e of r) e();
		for (let e of t) e.done && e.done(null);
		this.log.push({
			seq: e.seq,
			site: e.site,
			ops: t.map((e) => e.op).filter(G)
		});
	}
	flush() {
		if (this.inflight || !this.buffer.length || !this.online || !this.joined || this.status === "error") return;
		let e = this.buffer;
		this.buffer = [];
		let t = `${this.site}-${Date.now().toString(36)}-${++this.counter}`;
		this.inflight = {
			id: t,
			base: this.rev,
			items: e
		}, this.transport.send({
			t: "ops",
			id: t,
			base: this.rev,
			ops: e.map((e) => e.op).filter(G)
		});
	}
}, K = "$b64";
function Ke(e) {
	let t = "";
	for (let n = 0; n < e.length; n += 32768) t += String.fromCharCode(...e.subarray(n, n + 32768));
	return btoa(t);
}
function qe(e) {
	let t = atob(e), n = new Uint8Array(t.length);
	for (let e = 0; e < t.length; e++) n[e] = t.charCodeAt(e);
	return n;
}
function q(e) {
	return JSON.stringify(e, (e, t) => t instanceof Uint8Array ? { [K]: Ke(t) } : t instanceof ArrayBuffer ? { [K]: Ke(new Uint8Array(t)) } : t);
}
function J(e) {
	return JSON.parse(e, (e, t) => t && typeof t == "object" && typeof t[K] == "string" && Object.keys(t).length === 1 ? qe(t[K]) : t);
}
// src/collab/transport.ts
var Je = class {
	url;
	protocols;
	onMessage;
	onStatus;
	ws;
	closed = !1;
	retry = 0;
	timer;
	constructor(e, t) {
		this.url = e, this.protocols = t;
	}
	connect() {
		this.closed = !1, this.open();
	}
	open() {
		if (this.closed) return;
		this.onStatus?.("connecting");
		let e = this.ws = new WebSocket(this.url, this.protocols);
		e.onopen = () => {
			this.retry = 0, this.onStatus?.("open");
		}, e.onmessage = (e) => {
			typeof e.data == "string" && this.onMessage?.(J(e.data));
		}, e.onclose = () => {
			if (this.ws !== e || (this.ws = void 0, this.onStatus?.("closed"), this.closed)) return;
			let t = Math.min(1e4, 300 * 2 ** this.retry++) * (.75 + Math.random() * .5);
			this.timer = setTimeout(() => this.open(), t);
		}, e.onerror = () => e.close();
	}
	send(e) {
		this.ws?.readyState === WebSocket.OPEN && this.ws.send(q(e));
	}
	close() {
		this.closed = !0, clearTimeout(this.timer);
		let e = this.ws;
		this.ws = void 0, e?.close(), this.onStatus?.("closed");
	}
}, Ye = class {
	hub;
	latency;
	onMessage;
	onStatus;
	conn;
	up = Promise.resolve();
	down = Promise.resolve();
	constructor(e, t = 0) {
		this.hub = e, this.latency = t;
	}
	delay() {
		let e = typeof this.latency == "function" ? this.latency() : this.latency;
		return new Promise((t) => e > 0 ? setTimeout(t, e) : queueMicrotask(t));
	}
	connect() {
		if (this.conn) return;
		this.onStatus?.("connecting");
		let e = this.conn = this.hub.connect((t) => {
			let n = q(t);
			this.down = this.down.then(() => this.delay()).then(() => {
				this.conn === e && this.onMessage?.(J(n));
			});
		});
		queueMicrotask(() => this.onStatus?.("open"));
	}
	send(e) {
		let t = this.conn;
		if (!t) return;
		let n = q(e);
		this.up = this.up.then(() => this.delay()).then(() => {
			this.conn === t && t.receive(J(n));
		});
	}
	drop() {
		let e = this.conn;
		this.conn = void 0, e?.close(), this.onStatus?.("closed");
	}
	close() {
		this.drop();
	}
}, Xe = /* @__PURE__ */ new Set([
	"comments.set",
	"xlsx.set",
	"xlsx.format",
	"xlsx.sheetOp",
	"xlsx.replace",
	"xlsx.bookOp",
	"xlsx.undo",
	"xlsx.redo"
]), Ze = class {
	client;
	submit;
	nextId;
	onPresence;
	undoStack = [];
	redoStack = [];
	offLocal;
	constructor(e) {
		this.client = e, this.offLocal = ne(e, (e) => {
			let t = e, n = this.path(t.sheet);
			n && this.onPresence?.({
				k: "xlsx",
				sheet: n,
				range: t.range,
				ar: t.ar,
				ac: t.ac
			});
		});
	}
	dispose() {
		this.offLocal();
	}
	get meta() {
		return this.client.info.xlsx;
	}
	path(e) {
		return this.meta.sheets[e]?.path ?? "";
	}
	id() {
		return this.nextId();
	}
	captures(e) {
		return Xe.has(e);
	}
	intercept(e, t) {
		if (!this.submit) return;
		let n = t;
		switch (e) {
			case "comments.set": return this.submit({
				t: "comment",
				id: this.id(),
				cid: n[0],
				c: n[1]
			});
			case "xlsx.set": return this.local({
				t: "set",
				id: this.id(),
				sheet: this.path(n[0]),
				cells: n[1]
			});
			case "xlsx.format": return this.local({
				t: "fmt",
				id: this.id(),
				sheet: this.path(n[0]),
				range: n[1],
				patch: n[2]
			});
			case "xlsx.sheetOp": {
				let e = n[1], t = a.has(e.op) ? this.meta.sheets[n[0]]?.name : void 0;
				return this.local({
					t: "sheet",
					id: this.id(),
					sheet: this.path(n[0]),
					op: e,
					...t === void 0 ? {} : { name: t }
				});
			}
			case "xlsx.replace": return this.local({
				t: "replace",
				id: this.id(),
				sheet: this.path(n[0]),
				query: n[1],
				by: n[2],
				opts: n[3],
				at: n[4]
			});
			case "xlsx.bookOp": return this.local({
				t: "book",
				id: this.id(),
				op: this.pbook(n[0])
			});
			case "xlsx.undo": return this.history(this.undoStack, this.redoStack, "prev");
			case "xlsx.redo": return this.history(this.redoStack, this.undoStack, "next");
		}
	}
	pbook(e) {
		switch (e.op) {
			case "add": return {
				op: "add",
				name: e.name,
				after: e.after === void 0 ? void 0 : this.path(e.after)
			};
			case "rename": return {
				op: "rename",
				path: this.path(e.index),
				name: e.name,
				was: this.meta.sheets[e.index]?.name
			};
			case "delete": return {
				op: "delete",
				path: this.path(e.index)
			};
			case "move": return {
				op: "move",
				path: this.path(e.from),
				to: e.to
			};
			case "duplicate": return {
				op: "duplicate",
				path: this.path(e.index)
			};
		}
	}
	local(e) {
		if (e.t === "sheet" && (e.op.op === "insertRows" || e.op.op === "insertCols")) {
			let t = {
				op: e.op.op === "insertRows" ? "deleteRows" : "deleteCols",
				at: e.op.at,
				n: e.op.n
			};
			this.undoStack.push({
				kind: "inverse",
				sheet: e.sheet,
				undo: t,
				redo: e.op
			});
		} else r(e) || this.undoStack.push({
			kind: "op",
			id: e.id
		});
		return this.undoStack.length > 200 && this.undoStack.shift(), this.redoStack = [], this.submit(e);
	}
	history(e, t, n) {
		let r = e.pop();
		return r ? (t.push(r), r.kind === "op" ? this.submit({
			t: "revert",
			id: this.id(),
			target: r.id,
			which: n
		}) : this.submit({
			t: "sheet",
			id: this.id(),
			sheet: r.sheet,
			op: n === "prev" ? r.undo : r.redo
		})) : Promise.resolve(null);
	}
	transform(e, n) {
		return t(e, n);
	}
	conflicts(e, t) {
		return n(e, t);
	}
	pessimistic(e) {
		return r(e);
	}
	async apply(e, t) {
		if (e.t === "comment") return z(this.client, e);
		let { res: n, rec: i } = await this.client.direct("collab.xlsx.apply", e);
		if (r(e)) {
			let e = (e) => e.kind === "inverse" && t === "local";
			this.undoStack = this.undoStack.filter(e), this.redoStack = this.redoStack.filter(e);
		}
		return t !== "local" && n && this.client.notify("collab:xlsx", n), {
			result: n,
			undo: i
		};
	}
	async revert(e) {
		let t = B(this.client, e);
		if (t) return t;
		if (typeof e != "number") return;
		let n = await this.client.direct("collab.xlsx.revert", e);
		n && this.client.notify("collab:xlsx", n);
	}
};
// src/collab/pptx-ops.ts
function Qe(e, t) {
	return t.t === "slides" && t.op.op === "delete" && "slide" in e && e.slide === t.op.path ? null : e;
}
function $e(e, t) {
	if (t.some((e) => e.t === "slides" || e.t === "revert") || e.some((e) => e.t === "revert")) return !0;
	let n = new Set(e.flatMap((e) => e.t === "comment" ? [e.cid] : []));
	if (t.some((e) => e.t === "comment" && n.has(e.cid))) return !0;
	let r = new Set(e.flatMap((e) => "slide" in e && e.t !== "image" ? [e.slide] : []));
	return t.some((e) => "slide" in e && e.t !== "image" && r.has(e.slide));
}
// src/collab/pptx.ts
var et = /* @__PURE__ */ new Set([
	"pptx.setText",
	"pptx.shapes",
	"pptx.slides",
	"pptx.image",
	"pptx.undo"
]), tt = class {
	client;
	submit;
	nextId;
	onPresence;
	undoStack = [];
	redoStack = [];
	ridKey = /* @__PURE__ */ new Map();
	offLocal;
	constructor(e) {
		this.client = e, this.offLocal = ne(e, (e) => {
			let t = e, n = this.path(t.slide);
			n && this.onPresence?.({
				k: "pptx",
				slide: n,
				top: t.top
			});
		});
	}
	dispose() {
		this.offLocal();
	}
	get meta() {
		return this.client.info.pptx;
	}
	path(e) {
		return this.meta.slides[e]?.path ?? "";
	}
	id() {
		return this.nextId();
	}
	captures(e) {
		return e === "comments.set" || et.has(e);
	}
	intercept(e, t) {
		if (!this.submit) return;
		let n = t;
		switch (e) {
			case "comments.set": return this.submit({
				t: "comment",
				id: this.id(),
				cid: n[0],
				c: n[1]
			});
			case "pptx.setText": return this.local({
				t: "text",
				id: this.id(),
				slide: this.path(n[0]),
				sid: n[1],
				paras: n[2],
				cell: n[3]
			}).then((e) => e.model);
			case "pptx.shapes": {
				let e = n[1].map((e) => e.op === "insert" && e.rid && this.ridKey.has(e.rid) ? {
					...e,
					rid: void 0,
					key: this.ridKey.get(e.rid)
				} : e);
				return this.local({
					t: "shapes",
					id: this.id(),
					slide: this.path(n[0]),
					ops: e
				}).then((e) => e.model);
			}
			case "pptx.image": {
				let e = `${this.id()}`, t = new Uint8Array(n[1].slice(0));
				return this.submit({
					t: "image",
					id: e,
					key: e,
					slide: this.path(n[0]),
					bytes: t,
					ext: n[2]
				}).then((t) => {
					let n = t.rid;
					return n && this.ridKey.set(n, e), n;
				});
			}
			case "pptx.slides": return this.submit({
				t: "slides",
				id: this.id(),
				op: this.pslide(n[0])
			}).then((e) => e?.meta ?? this.meta);
			case "pptx.undo": return this.history(n[0] ? this.redoStack : this.undoStack, n[0] ? this.undoStack : this.redoStack, n[0] ? "next" : "prev");
		}
	}
	pslide(e) {
		switch (e.op) {
			case "add": return {
				op: "add",
				after: e.after >= 0 && this.path(e.after) || null,
				layout: e.layout
			};
			case "duplicate": return {
				op: "duplicate",
				path: this.path(e.index)
			};
			case "delete": return {
				op: "delete",
				path: this.path(e.index)
			};
			case "move": return {
				op: "move",
				path: this.path(e.from),
				to: e.to
			};
			case "hide": return {
				op: "hide",
				path: this.path(e.index),
				hidden: e.hidden
			};
		}
	}
	local(e) {
		return this.undoStack.push(e.id), this.undoStack.length > 200 && this.undoStack.shift(), this.redoStack = [], this.submit(e);
	}
	async history(e, t, n) {
		let r = e.pop();
		if (!r) return null;
		t.push(r);
		let i = await this.submit({
			t: "revert",
			id: this.id(),
			target: r,
			which: n
		});
		return i.model && i.slide !== void 0 ? {
			index: i.slide,
			model: i.model
		} : null;
	}
	transform(e, t) {
		return Qe(e, t);
	}
	conflicts(e, t) {
		return $e(e, t);
	}
	pessimistic(e) {
		return e.t === "slides";
	}
	prepare(e) {
		e.some((e) => e.t === "slides") && l(this.client, "pptx")?.endEditing();
	}
	async apply(e, t) {
		if (e.t === "comment") return z(this.client, e);
		let { res: n, rec: r } = await this.client.direct("collab.pptx.apply", e);
		return e.t === "slides" && (this.undoStack = [], this.redoStack = [], n.meta && Object.assign(this.meta, n.meta)), t !== "local" && this.client.notify("collab:pptx", n), {
			result: n,
			undo: r
		};
	}
	async revert(e) {
		let t = B(this.client, e);
		if (t) return t;
		typeof e == "number" && this.client.notify("collab:pptx", await this.client.direct("collab.pptx.revert", e));
	}
}, nt = class {
	opts;
	rooms = /* @__PURE__ */ new Map();
	loading = /* @__PURE__ */ new Map();
	constructor(e = {}) {
		this.opts = e;
	}
	room(e) {
		let t = this.rooms.get(e);
		if (t) return Promise.resolve(t);
		let n = this.loading.get(e);
		return n || (n = Promise.resolve(this.opts.loadLog?.(e)).then((t) => {
			if (this.loading.get(e) !== n) return this.room(e);
			let r = this.rooms.get(e) ?? rt(e, t);
			return this.rooms.set(e, r), r;
		}), n.finally(() => this.loading.get(e) === n && this.loading.delete(e)).catch(() => {}), this.loading.set(e, n)), n;
	}
	reset(e) {
		let t = this.rooms.get(e);
		if (t) for (let e of t.peers.values()) e.send({
			t: "error",
			message: "Room was reset"
		});
		this.rooms.delete(e), this.loading.delete(e);
	}
	unload(e) {
		return !this.rooms.get(e)?.peers.size && (this.rooms.delete(e), !0);
	}
	snapshot(e, t) {
		let n = this.rooms.get(e);
		if (!n || t.seq > n.seq || t.seq < n.start) return !1;
		n.snaps.set(t.seq, t.ctx);
		let r = [...n.snaps.keys()].sort((e, t) => e - t);
		for (let e of r.splice(0, Math.max(0, r.length - (this.opts.keep ?? 3)))) n.snaps.delete(e);
		let i = Math.min(r[0], r[r.length - 1] - (this.opts.retain ?? 1e3));
		if (i > n.start) {
			let e = 0;
			for (; e < n.log.length && n.log[e].seq <= i;) n.ids.delete(n.log[e++].id);
			n.log.splice(0, e), n.start = i;
		}
		return !0;
	}
	connect(t) {
		let n, r = 0, i = !1, a = null, o = (e, t) => {
			if (n) for (let [r, i] of n.peers) r !== t && i.send(e);
		}, s = (i, a) => {
			n = i, r = a.site && a.site < i.nextSite && !i.peers.has(a.site) ? a.site : i.nextSite++;
			let s = new Set([...i.peers.values()].map((e) => e.info.color)), c = e(a.user.color) || R.find((e) => !s.has(e)) || R[r % R.length], l = {
				...a.user,
				site: r,
				color: c
			}, u, d, f;
			a.have === void 0 ? (u = a.base ?? 0, d = u === 0 ? void 0 : i.snaps.get(u), f = u > i.seq || u < i.start || u > 0 && !d) : (u = a.have, f = u > i.seq || u < i.start), t({
				t: "welcome",
				site: r,
				seq: i.seq,
				from: u,
				reset: f,
				log: f ? [] : i.log.filter((e) => e.seq > u),
				peers: [...i.peers.values()].map((e) => e.info),
				...d && !f ? { ctx: d } : {}
			}), i.peers.set(r, {
				info: l,
				send: t
			}), o({
				t: "join",
				peer: l
			}, r);
		}, c = (e) => {
			if (!i) {
				if (a) return void a.push(e);
				if (e.t === "hello") {
					if (n) return;
					a = [], this.room(e.room).then((t) => {
						let n = a;
						a = null, i || (s(t, e), n.forEach(c));
					}, (e) => {
						a = null, t({
							t: "error",
							message: `Room failed to load: ${e.message}`
						});
					});
				} else {
					if (!n) return t({
						t: "error",
						message: "Not joined"
					});
					if (e.t === "ops") {
						if (n.ids.has(e.id)) return;
						let t = n.peers.get(r), i = {
							seq: ++n.seq,
							site: r,
							base: Math.min(e.base, n.seq - 1),
							id: e.id,
							ops: e.ops,
							time: Date.now(),
							user: t?.info.id ?? t?.info.name
						};
						n.log.push(i), n.ids.add(i.id), this.opts.onBatch?.(n.id, i), o({
							t: "batch",
							b: i
						});
					} else if (e.t === "presence") {
						let t = n.peers.get(r);
						t && (t.info.presence = e.data), o({
							t: "presence",
							site: r,
							data: e.data
						}, r);
					}
				}
			}
		};
		return {
			receive: c,
			close: () => {
				i = !0, n && n.peers.has(r) && (n.peers.delete(r), o({
					t: "leave",
					site: r
				}), n.peers.size || this.opts.onIdle?.(n.id));
			}
		};
	}
};
function rt(e, t) {
	let n = Array.isArray(t) ? { log: t } : t ?? { log: [] }, r = n.snapshot, i = [...n.log].sort((e, t) => e.seq - t.seq);
	for (let e = i.length - 1; e > 0; e--) if (i[e - 1].seq !== i[e].seq - 1) {
		i = i.slice(e);
		break;
	}
	let a = i.length ? i[i.length - 1].seq : 0, o = i.length ? i[0].seq - 1 : 0;
	r && (r.seq > a || r.seq < o) && (a = o = r.seq, i = []);
	let s = Math.max(1, r?.sites ?? 1);
	for (let e of i) s = Math.max(s, e.site + 1);
	for (let e of r?.ctx ?? []) s = Math.max(s, e.site + 1);
	return {
		id: e,
		seq: a,
		log: i,
		start: o,
		nextSite: s,
		ids: new Set(i.map((e) => e.id)),
		peers: /* @__PURE__ */ new Map(),
		snaps: new Map(r ? [[r.seq, r.ctx]] : [])
	};
}
// src/collab/compact.ts
var it = class {
	welcome;
	onMessage;
	onStatus;
	constructor(e) {
		this.welcome = e;
	}
	connect() {
		queueMicrotask(() => this.onStatus?.("open"));
	}
	send(e) {
		e.t === "hello" && queueMicrotask(() => this.onMessage?.(this.welcome));
	}
	close() {}
};
async function at(e, t) {
	if (e.kind === "docx" && !l(e, "docx")) throw Error("compact: DOCX needs its editor host registered (registerHost)");
	let n = t.from ?? {
		seq: 0,
		ctx: []
	}, r = t.batches.filter((e) => e.seq > n.seq).sort((e, t) => e.seq - t.seq);
	r.forEach((e, t) => {
		if (e.seq !== n.seq + t + 1) throw Error(`compact: batch ${n.seq + t + 1} is missing`);
	});
	let i = n.seq + r.length, a = ct(e, {
		transport: new it({
			t: "welcome",
			site: 0,
			seq: i,
			from: n.seq,
			log: r,
			peers: [],
			ctx: n.ctx
		}),
		room: "",
		user: { name: "compact" },
		base: n.seq
	});
	try {
		if (await new Promise((e, t) => {
			let n = () => {
				a.status === "live" ? e() : a.status === "error" && t(Error(a.session.error ?? "compact failed"));
			};
			a.on("status", n), n();
		}), await a.session.idle(), a.session.rev !== i) throw Error(`compact: stopped at ${a.session.rev} of ${i}`);
		return {
			seq: i,
			ctx: a.session.context(t.window ?? 1e3)
		};
	} finally {
		a.close();
	}
}
// src/collab/store.ts
var ot = class {
	data = /* @__PURE__ */ new Map();
	async get(e) {
		return this.data.get(e) ?? null;
	}
	async put(e, t) {
		this.data.set(e, t.slice());
	}
	async list(e) {
		return [...this.data.keys()].filter((t) => t.startsWith(e));
	}
	async delete(e) {
		this.data.delete(e);
	}
}, Y = (e) => String(e).padStart(12, "0"), X = new TextEncoder(), Z = new TextDecoder(), Q = (e) => X.encode(JSON.stringify(e)), $ = (e) => e ? JSON.parse(Z.decode(e)) : null, st = class {
	blobs;
	opts;
	heads = /* @__PURE__ */ new Map();
	buffers = /* @__PURE__ */ new Map();
	queues = /* @__PURE__ */ new Map();
	constructor(e, t = {}) {
		this.blobs = e, this.opts = t;
	}
	dir(e) {
		return `${this.opts.prefix ?? ""}${encodeURIComponent(e).replace(/\./g, "%2E")}/`;
	}
	epochDir(e, t) {
		return `${this.dir(e)}${t}/`;
	}
	run(e, t) {
		let n = (this.queues.get(e) ?? Promise.resolve()).then(t, t), r = n.catch(() => {});
		return this.queues.set(e, r), r.then(() => this.queues.get(e) === r && this.queues.delete(e)), n;
	}
	async readHead(e) {
		if (this.heads.has(e)) return this.heads.get(e);
		let t = $(await this.blobs.get(this.dir(e) + "head.json"));
		return this.heads.set(e, t), t;
	}
	create(e, t, n) {
		let r = this.buffers.get(e);
		return r && (clearTimeout(r.timer), this.buffers.delete(e)), this.run(e, async () => {
			let r = await this.readHead(e), i = {
				epoch: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
				seq: 0,
				size: t.length,
				time: Date.now(),
				...n
			}, a = this.epochDir(e, i.epoch);
			if (await this.blobs.put(`${a}snap/${Y(0)}.bin`, t), await this.blobs.put(`${a}snap/${Y(0)}.json`, Q({
				seq: 0,
				size: t.length,
				time: i.time
			})), await this.blobs.put(this.dir(e) + "head.json", Q(i)), this.heads.set(e, i), r) for (let t of await this.blobs.list(this.epochDir(e, r.epoch))) await this.blobs.delete(t);
			return i;
		});
	}
	head(e) {
		return this.run(e, () => this.readHead(e));
	}
	async file(e, t, n) {
		return n ??= (await this.head(e))?.epoch, n ? this.blobs.get(`${this.epochDir(e, n)}snap/${Y(t)}.bin`) : null;
	}
	async snapshot(e, t, n) {
		if (n ??= (await this.head(e))?.epoch, !n) return null;
		let r = `${this.epochDir(e, n)}snap/${Y(t)}`, i = $(await this.blobs.get(r + ".json"));
		if (!i) return null;
		let a = await this.blobs.get(r + ".ctx");
		return {
			...i,
			ctx: a ? J(Z.decode(a)) : []
		};
	}
	async versions(e, t) {
		if (t ??= (await this.head(e))?.epoch, !t) return [];
		let n = `${this.epochDir(e, t)}snap/`, r = (await this.blobs.list(n)).filter((e) => e.endsWith(".json")).sort(), i = [];
		for (let e of r) {
			let t = $(await this.blobs.get(e));
			t && i.push({
				seq: t.seq,
				size: t.size,
				time: t.time
			});
		}
		return i;
	}
	async batches(e, t, n = Infinity, r) {
		if (r ??= (await this.head(e))?.epoch, !r) return [];
		let i = (await this.blobs.list(`${this.epochDir(e, r)}ops/`)).map((e) => {
			let t = /(\d+)-(\d+)\.jsonl$/.exec(e);
			return t ? {
				k: e,
				first: Number(t[1]),
				last: Number(t[2])
			} : null;
		}).filter((e) => e !== null && e.last > t && e.first <= n).sort((e, t) => e.first - t.first), a = /* @__PURE__ */ new Set(), o = [];
		for (let e of i) {
			let r = Z.decode(await this.blobs.get(e.k) ?? /* @__PURE__ */ new Uint8Array());
			for (let e of r.split("\n")) {
				if (!e) continue;
				let r = J(e);
				r.seq > t && r.seq <= n && !a.has(r.seq) && (a.add(r.seq), o.push(r));
			}
		}
		return o.sort((e, t) => e.seq - t.seq);
	}
	append(e, t) {
		let n = this.buffers.get(e);
		n || this.buffers.set(e, n = {
			batches: [],
			retry: 0
		}), n.batches.push(t), n.timer || (n.timer = setTimeout(() => void this.flushRoom(e), this.opts.flushMs ?? 250));
	}
	async flush(e) {
		let t = e === void 0 ? [...this.buffers.keys()] : [e];
		await Promise.all(t.map((e) => this.flushRoom(e)));
	}
	flushRoom(e) {
		let t = this.buffers.get(e);
		return t && (clearTimeout(t.timer), t.timer = void 0), this.run(e, async () => {
			let t = this.buffers.get(e);
			if (!t?.batches.length) return;
			let n = t.batches;
			t.batches = [];
			let r = await this.readHead(e);
			if (!r) return;
			let i = `${this.epochDir(e, r.epoch)}ops/${Y(n[0].seq)}-${Y(n[n.length - 1].seq)}.jsonl`;
			try {
				await this.blobs.put(i, X.encode(n.map((e) => q(e)).join("\n") + "\n")), t.retry = 0;
			} catch (r) {
				if (this.opts.onError?.(r, e), this.buffers.get(e) !== t) return;
				t.batches.unshift(...n), t.timer ||= setTimeout(() => void this.flushRoom(e), Math.min(3e4, 500 * 2 ** t.retry++));
			}
		});
	}
	load(e) {
		return this.flushRoom(e).then(() => this.run(e, async () => {
			this.heads.delete(e);
			let t = await this.readHead(e);
			if (!t) return;
			let n = await this.snapshot(e, t.seq, t.epoch);
			return {
				log: await this.batches(e, Math.max(0, t.seq - (this.opts.retain ?? 1e3)), Infinity, t.epoch),
				snapshot: n ?? {
					seq: t.seq,
					ctx: []
				}
			};
		}));
	}
	save(e, t, n, r) {
		return this.run(e, async () => {
			let i = await this.readHead(e);
			if (!i || i.epoch !== t.epoch || n.seq <= i.seq) return null;
			let a = this.epochDir(e, i.epoch), o = Date.now();
			await Promise.all([
				this.blobs.put(`${a}snap/${Y(n.seq)}.bin`, r),
				this.blobs.put(`${a}snap/${Y(n.seq)}.ctx`, X.encode(q(n.ctx))),
				this.blobs.put(`${a}snap/${Y(n.seq)}.json`, Q({
					seq: n.seq,
					size: r.length,
					time: o,
					sites: n.sites
				}))
			]);
			let s = {
				...i,
				seq: n.seq,
				size: r.length,
				time: o
			};
			return await this.blobs.put(this.dir(e) + "head.json", Q(s)), this.heads.set(e, s), this.opts.keep && await this.prune(e, s), s;
		});
	}
	async prune(e, t) {
		let n = `${this.epochDir(e, t.epoch)}snap/`, r = [...new Set((await this.blobs.list(n)).map((e) => Number(/(\d+)\.\w+$/.exec(e)?.[1])).filter((e) => !Number.isNaN(e)))].sort((e, t) => e - t), i = r.slice(0, Math.max(0, r.length - this.opts.keep));
		for (let e of i) for (let t of [
			"bin",
			"json",
			"ctx"
		]) await this.blobs.delete(`${n}${Y(e)}.${t}`);
		let a = r[i.length], o = Math.min(a, t.seq - (this.opts.retain ?? 1e3));
		for (let n of await this.blobs.list(`${this.epochDir(e, t.epoch)}ops/`)) Number(/-(\d+)\.jsonl$/.exec(n)?.[1]) <= o && await this.blobs.delete(n);
	}
};
// src/collab/index.ts
function ct(e, t) {
	let n = typeof t.transport == "string" ? new Je(t.transport) : t.transport, r = e.kind === "docx" ? new Ue(e) : void 0, i = r ?? (e.kind === "xlsx" ? new Ze(e) : new tt(e)), a = new Ge(n, i, {
		room: t.room,
		user: t.user,
		base: t.base
	});
	i.submit = (e) => a.submit(e), i.push = (e, t) => a.push(e, t), i.nextId = () => a.nextId(), i.onPresence = (e) => a.setPresence(e), e.interceptor = (e, t) => {
		if (i.captures(e)) return a.status === "connecting" || a.status === "syncing" || a.status === "error" ? Promise.reject(Error(a.status === "error" ? a.error ?? "Collaboration stopped" : "Document is still syncing")) : i.intercept(e, t);
	};
	let o = [a.on("peers", (t) => p(e, t)), a.on("status", (e) => {
		e === "live" && i.setSite?.(a.site);
	})];
	return {
		session: a,
		get status() {
			return a.status;
		},
		get peers() {
			return [...a.peers.values()];
		},
		get pending() {
			return a.pending;
		},
		on: (e, t) => a.on(e, t),
		rects: (e, t) => {
			let n = t.presence;
			return r && n?.k === "docx" ? r.rects(e, n) : null;
		},
		close() {
			o.forEach((e) => e()), a.close(), e.interceptor &&= void 0, i.dispose?.(), p(e, []);
		}
	};
}
export { y as A, oe as C, g as D, _ as E, ee as F, h as M, te as N, T as O, c as P, le as S, C as T, pe as _, nt as a, L as b, J as c, R as d, ye as f, N as g, j as h, at as i, w as j, b as k, q as l, I as m, ot as n, Ye as o, F as p, st as r, Je as s, ct as t, Ge as u, D as v, ce as w, v as x, P as y };

//# sourceMappingURL=collab-C4xiOtwj.js.map