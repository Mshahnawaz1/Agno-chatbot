
// src/core/dict.ts
function e(e) {
	return Object.assign(Object.create(null), e);
}
function t(e, t) {
	return e !== void 0 && t !== void 0 && Object.hasOwn(e, t) ? e[t] : void 0;
}
// src/core/xml.ts
var n = /* @__PURE__ */ new Set(["http://schemas.openxmlformats.org/officeDocument/2006/relationships", "http://purl.oclc.org/ooxml/officeDocument/relationships"]), r = e({
	lt: "<",
	gt: ">",
	amp: "&",
	quot: "\"",
	apos: "'"
});
function i(e) {
	return e.indexOf("&") < 0 ? e : e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (e, t) => {
		if (t[0] === "#") {
			let n = t[1] === "x" || t[1] === "X" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
			return Number.isFinite(n) && n <= 1114111 ? String.fromCodePoint(n) : e;
		}
		return r[t] ?? e;
	});
}
var a = (e) => e === 32 || e === 9 || e === 10 || e === 13, o = 1024, s = () => /* @__PURE__ */ Error(`XML nested deeper than ${o} elements`), c = 16777216, l = class {
	h;
	raw;
	buf = "";
	depth = 0;
	skipDepth = -1;
	relPrefixes = /* @__PURE__ */ new Set(["r"]);
	until = "";
	cdata = !1;
	tag = null;
	tagLen = 0;
	tagQuote = 0;
	tagQuoted = !1;
	constructor(e, t) {
		this.h = e, this.raw = t;
	}
	write(e) {
		if (e) {
			if (this.tag) {
				if (this.tagEnd(e) < 0) {
					if (this.tag.push(e), this.tagLen += e.length, this.tagLen > c) throw Error("XML tag longer than 16 MB");
					return;
				}
				e = this.tag.join("") + e, this.tag = null;
			} else this.buf && (e = this.buf + e);
			this.buf = "", this.run(e, !1);
		}
	}
	end() {
		let e = this.buf;
		this.buf = "", this.run(e, !0), this.buf = "", this.until = "", this.cdata = !1, this.tag = null;
	}
	tagEnd(e) {
		if (!this.tagQuoted) return e.indexOf(">");
		let t = this.tagQuote;
		for (let n = 0; n < e.length; n++) {
			let r = e.charCodeAt(n);
			if (t !== 0) r === t && (t = 0);
			else if (r === 34 || r === 39) t = r;
			else if (r === 62) return n;
		}
		return this.tagQuote = t, -1;
	}
	holdTag(e, t, n, r) {
		if (this.tag = [e.substring(t)], this.tagLen = e.length - t, this.tagQuote = n, this.tagQuoted = r, this.tagLen > c) throw Error("XML tag longer than 16 MB");
	}
	enter(e, t, n, r, i) {
		let a = e.length, o = Math.min(a - t - n, r.length - 1);
		this.raw?.(e.substring(t, a - o)), i && this.skipDepth < 0 && a - o > t + n && this.h.text(e.substring(t + n, a - o)), this.buf = e.substring(a - o), this.until = r, this.cdata = i;
	}
	run(e, t) {
		let n = e.length, r = 0;
		if (this.until) {
			let i = this.until, a = e.indexOf(i), o = this.cdata;
			if (a < 0) {
				let r = t ? 0 : Math.min(n, i.length - 1);
				if (n > r) {
					let t = e.substring(0, n - r);
					this.raw?.(t), o && this.skipDepth < 0 && this.h.text(t);
				}
				this.buf = e.substring(n - r);
				return;
			}
			this.raw?.(e.substring(0, a + i.length)), o && this.skipDepth < 0 && a > 0 && this.h.text(e.substring(0, a)), this.until = "", this.cdata = !1, r = a + i.length;
		}
		for (; r < n;) {
			let i = e.indexOf("<", r);
			if (i < 0) {
				let i = n;
				if (!t) {
					let t = e.lastIndexOf("&");
					t >= r && t >= n - 16 && e.indexOf(";", t) < 0 && (i = t);
				}
				if (i > r) {
					let t = e.substring(r, i);
					this.raw?.(t), this.onText(t);
				}
				r = i;
				break;
			}
			if (i > r) {
				let t = e.substring(r, i);
				this.raw?.(t), this.onText(t);
			}
			if (r = i, i + 1 >= n) break;
			let a = e.charCodeAt(i + 1);
			if (a === 47) {
				let a = e.indexOf(">", i + 2);
				if (a < 0) {
					t || this.holdTag(e, i, 0, !1), r = n;
					break;
				}
				this.raw?.(e.substring(i, a + 1)), this.onClose(e.substring(i + 2, a)), r = a + 1;
				continue;
			}
			if (a === 63) {
				let n = e.indexOf("?>", i + 2);
				if (n < 0) {
					t || this.enter(e, i, 2, "?>", !1);
					return;
				}
				this.raw?.(e.substring(i, n + 2)), r = n + 2;
				continue;
			}
			if (a === 33) {
				if (n - i < 9 && !t) break;
				if (e.startsWith("<!--", i)) {
					let n = e.indexOf("-->", i + 4);
					if (n < 0) {
						t || this.enter(e, i, 4, "-->", !1);
						return;
					}
					this.raw?.(e.substring(i, n + 3)), r = n + 3;
					continue;
				}
				if (e.startsWith("<![CDATA[", i)) {
					let n = e.indexOf("]]>", i + 9);
					if (n < 0) {
						t || this.enter(e, i, 9, "]]>", !0);
						return;
					}
					this.raw?.(e.substring(i, n + 3)), this.skipDepth < 0 && this.h.text(e.substring(i + 9, n)), r = n + 3;
					continue;
				}
				let a = e.indexOf(">", i + 2);
				if (a < 0) {
					t || this.enter(e, i, 2, ">", !1);
					return;
				}
				this.raw?.(e.substring(i, a + 1)), r = a + 1;
				continue;
			}
			let o = -1, s = 0;
			for (let t = i + 1; t < n; t++) {
				let n = e.charCodeAt(t);
				if (s !== 0) n === s && (s = 0);
				else if (n === 34 || n === 39) s = n;
				else if (n === 62) {
					o = t;
					break;
				}
			}
			if (o < 0) {
				t || this.holdTag(e, i, s, !0), r = n;
				break;
			}
			this.raw?.(e.substring(i, o + 1)), this.onOpen(e, i + 1, o), r = o + 1;
		}
		this.buf = r >= n ? "" : e.substring(r);
	}
	onText(e) {
		this.skipDepth >= 0 || this.depth === 0 || this.h.text(e.indexOf("&") >= 0 ? i(e) : e);
	}
	onOpen(e, t, r) {
		let o = r, c = !1;
		if (e.charCodeAt(r - 1) === 47 && (c = !0, o = r - 1), this.skipDepth >= 0) {
			if (!c && ++this.depth > 1024) throw s();
			return;
		}
		let l = t;
		for (; l < o && !a(e.charCodeAt(l));) l++;
		let u = e.substring(t, l), d = u.indexOf(":"), f = d < 0 ? u : u.substring(d + 1), p = {};
		for (; l < o;) {
			if (a(e.charCodeAt(l))) {
				l++;
				continue;
			}
			let t = e.indexOf("=", l);
			if (t < 0 || t >= o) break;
			let r = e.substring(l, t).trim(), s = t + 1;
			for (; s < o && e.charCodeAt(s) !== 34 && e.charCodeAt(s) !== 39;) s++;
			if (s >= o) break;
			let c = e.indexOf(e[s], s + 1);
			if (c < 0) break;
			let u = e.substring(s + 1, c);
			l = c + 1;
			let d = r.indexOf(":");
			if (d >= 0) {
				let e = r.substring(0, d), t = r.substring(d + 1);
				if (e === "xmlns") {
					n.has(u) && this.relPrefixes.add(t);
					continue;
				}
				r = this.relPrefixes.has(e) ? "r:" + t : t;
			} else if (r === "xmlns") continue;
			p[r] = u.indexOf("&") >= 0 ? i(u) : u;
		}
		let m = this.h.open(f, p, c);
		if (c) m || this.h.close(f);
		else {
			if (++this.depth > 1024) throw s();
			m && (this.skipDepth = this.depth);
		}
	}
	onClose(e) {
		if (this.skipDepth >= 0) {
			this.depth === this.skipDepth && (this.skipDepth = -1), this.depth--;
			return;
		}
		this.depth--;
		let t = e.trim(), n = t.indexOf(":");
		this.h.close(n < 0 ? t : t.substring(n + 1));
	}
}, u = class extends Error {
	constructor() {
		super("aborted"), this.name = "AbortError";
	}
};
function d(e) {
	let t = e[0], n = e[1];
	if (t === 255 && n === 254) return "utf-16le";
	if (t === 254 && n === 255) return "utf-16be";
	if (t === 60 && n === 0) return "utf-16le";
	if (t === 0 && n === 60) return "utf-16be";
	if (t !== 60 || n !== 63) return "utf-8";
	let r = "";
	for (let t = 0; t < e.length && t < 200 && e[t] !== 62; t++) r += String.fromCharCode(e[t]);
	let i = /encoding\s*=\s*["']([A-Za-z][\w.:-]*)["']/.exec(r)?.[1].toLowerCase();
	if (!i || i === "utf-8" || i === "utf8" || i.startsWith("utf-1") || i.startsWith("utf-3")) return "utf-8";
	try {
		return new TextDecoder(i), i;
	} catch {
		return "utf-8";
	}
}
function f(e) {
	return new TextDecoder(d(e)).decode(e);
}
function p(e) {
	return e.charCodeAt(0) !== 60 || e.charCodeAt(1) !== 63 ? e : e.replace(/^(<\?xml[^>]*?\bencoding\s*=\s*)(["'])(?!utf-8\2)[^"']*\2/i, "$1$2UTF-8$2");
}
async function m(e, t, n = {}) {
	let r = e.getReader(), i, a, o = new l(t, n.raw);
	try {
		for (;;) {
			if (n.signal?.aborted) throw new u();
			let { done: e, value: t } = await r.read();
			if (e) break;
			let s = t;
			if (!i) {
				if (a) {
					let e = new Uint8Array(a.length + t.length);
					e.set(a), e.set(t, a.length), s = e;
				}
				if (s.length < 200) {
					a = s, n.onChunk && await n.onChunk(t.length);
					continue;
				}
				a = void 0, i = new TextDecoder(d(s));
			}
			o.write(i.decode(s, { stream: !0 })), n.onChunk && await n.onChunk(t.length);
		}
		i ||= new TextDecoder(d(a ?? /* @__PURE__ */ new Uint8Array())), a && o.write(i.decode(a, { stream: !0 })), o.write(i.decode()), o.end();
	} catch (e) {
		throw r.cancel().catch(() => {}), e;
	}
}
var h = 0, ee = 1, te = /* @__PURE__ */ new Set([
	"wps",
	"wpg",
	"wpc",
	"wpi",
	"wp14",
	"w14",
	"w15",
	"a14",
	"a16"
]);
function ne(e, t) {
	let n = (e ?? "").split(/\s+/).filter(Boolean);
	return n.length > 0 && n.every((e) => t.has(e));
}
var re = class {
	o;
	root = null;
	stack = [];
	parents = [];
	depth = 0;
	alt = [];
	constructor(e = {}) {
		this.o = e;
	}
	open(e, t) {
		if (this.o.skip?.has(e)) return !0;
		if (e === "Fallback") {
			if (this.o.understood && this.alt.length && !this.alt[this.alt.length - 1]) {
				this.alt[this.alt.length - 1] = !0, this.stack.push(h);
				return;
			}
			return !0;
		}
		if (e === "AlternateContent") {
			let e = this.parents[this.parents.length - 1];
			e && this.o.understood && (e.a["#mc"] = "1"), this.alt.push(!1), this.stack.push(h);
			return;
		}
		if (e === "Choice" && this.alt.length) {
			let e = this.alt.length - 1;
			if (this.alt[e] || this.o.understood && !ne(t.Requires, this.o.understood)) return !0;
			this.alt[e] = !0, this.stack.push(h);
			return;
		}
		let n = this.depth++;
		if (this.o.emitDepth !== void 0 && n < this.o.emitDepth) {
			this.o.onShallowOpen?.(e, t, n), this.stack.push(ee);
			return;
		}
		let r = {
			n: e,
			a: t,
			c: [],
			t: ""
		}, i = this.parents[this.parents.length - 1];
		i && i.c.push(r), this.parents.push(r), this.stack.push(r);
	}
	close(e) {
		let t = this.stack.pop();
		t === h ? e === "AlternateContent" && this.alt.pop() : (this.depth--, t !== ee && t !== void 0 && (this.parents.pop(), this.parents.length === 0 && (this.o.emitDepth === void 0 ? this.root = t : this.o.onElement?.(t))));
	}
	text(e) {
		let t = this.parents[this.parents.length - 1];
		t && (t.t += e);
	}
};
function ie(e, t, n) {
	let r = new re({
		skip: t,
		understood: n
	}), i = new l(r);
	if (i.write(e), i.end(), !r.root) throw Error("Empty XML document");
	return r.root;
}
function g(e, t) {
	if (e) {
		for (let n of e.c) if (n.n === t) return n;
	}
}
function ae(e, t) {
	return e ? e.c.filter((e) => e.n === t) : [];
}
function oe(e, ...t) {
	let n = e;
	for (let e of t) if (n = g(n, e), !n) return;
	return n;
}
function se(e, t) {
	if (e) for (let n of e.c) {
		if (n.n === t) return n;
		let e = se(n, t);
		if (e) return e;
	}
}
function ce(e, t, n = []) {
	if (!e) return n;
	for (let r of e.c) r.n === t ? n.push(r) : ce(r, t, n);
	return n;
}
function _(e, t) {
	if (e === void 0 || e === "") return t;
	let n = Number(e);
	return Number.isFinite(n) ? n : t;
}
function le(e, t = "val") {
	if (!e) return;
	let n = e.a[t];
	return n === void 0 || n !== "0" && n !== "false" && n !== "off" && n !== "none";
}
function ue(e) {
	if (!e) return "";
	if (!e.c.length) return e.t;
	let t = "";
	for (let n of e.c) t += n.n === "t" ? n.t : ue(n);
	return t;
}
// src/core/color.ts
var de = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, fe = /^(?:rgb|hsl)a?\([-+.,%/\s0-9]{1,80}\)$/i, pe = /^[a-z]{3,30}$/i;
function v(e) {
	if (typeof e != "string" || e.length > 100) return;
	let t = e.trim();
	return de.test(t) || fe.test(t) || pe.test(t) ? t : void 0;
}
var me = "-?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?", he = RegExp(`^(?:linear-gradient\\(${me}deg|radial-gradient\\(circle)(?:,\\s*(?:#[0-9a-f]{3,8}|rgba?\\([-.,\\s0-9]{1,60}\\))(?:\\s+${me}%)?){1,400}\\)$`, "i");
function ge(e) {
	let t = v(e);
	if (t !== void 0 || typeof e != "string" || e.length > 2e4) return t;
	let n = e.trim();
	return he.test(n) ? n : void 0;
}
function y(e) {
	if (typeof e == "string") {
		if (/^[0-9a-f]{6}$/i.test(e)) return "#" + e.toLowerCase();
		if (/^[0-9a-f]{8}$/i.test(e)) return "#" + e.slice(2).toLowerCase();
		if (/^[0-9a-f]{3}$/i.test(e)) return "#" + e.toLowerCase().replace(/./g, "$&$&");
	}
}
function _e(e) {
	let t = typeof e == "string" ? e.replace(/^#/, "") : "";
	return (t.length === 8 ? void 0 : y(t))?.slice(1).toUpperCase();
}
function b(e) {
	let t = e.replace("#", ""), n = t.length === 8 ? t.slice(2) : t.padStart(6, "0").slice(0, 6);
	return [
		parseInt(n.slice(0, 2), 16) || 0,
		parseInt(n.slice(2, 4), 16) || 0,
		parseInt(n.slice(4, 6), 16) || 0
	];
}
function x([e, t, n]) {
	let r = (e) => Math.max(0, Math.min(255, Math.round(e))).toString(16).padStart(2, "0");
	return "#" + r(e) + r(t) + r(n);
}
function S([e, t, n]) {
	e /= 255, t /= 255, n /= 255;
	let r = Math.max(e, t, n), i = Math.min(e, t, n), a = (r + i) / 2;
	if (r === i) return [
		0,
		0,
		a
	];
	let o = r - i, s = a > .5 ? o / (2 - r - i) : o / (r + i), c = 0;
	return c = r === e ? (t - n) / o + (t < n ? 6 : 0) : r === t ? (n - e) / o + 2 : (e - t) / o + 4, [
		c / 6,
		s,
		a
	];
}
function C([e, t, n]) {
	if (t === 0) return [
		n * 255,
		n * 255,
		n * 255
	];
	let r = n < .5 ? n * (1 + t) : n + t - n * t, i = 2 * n - r, a = (e) => (e < 0 && (e += 1), e > 1 && --e, e < 1 / 6 ? i + (r - i) * 6 * e : e < 1 / 2 ? r : e < 2 / 3 ? i + (r - i) * (2 / 3 - e) * 6 : i);
	return [
		a(e + 1 / 3) * 255,
		a(e) * 255,
		a(e - 1 / 3) * 255
	];
}
var w = (e) => Math.max(0, Math.min(1, e));
function ve(e, t) {
	if (!t) return e;
	let n = S(b(e));
	return n[2] = t < 0 ? n[2] * (1 + t) : n[2] * (1 - t) + t, x(C(n));
}
var ye = e({
	black: "#000000",
	white: "#ffffff",
	red: "#ff0000",
	green: "#008000",
	blue: "#0000ff",
	yellow: "#ffff00",
	cyan: "#00ffff",
	magenta: "#ff00ff",
	gray: "#808080",
	grey: "#808080",
	ltGray: "#d3d3d3",
	dkGray: "#a9a9a9",
	orange: "#ffa500",
	purple: "#800080",
	navy: "#000080",
	maroon: "#800000",
	olive: "#808000",
	teal: "#008080",
	silver: "#c0c0c0",
	lime: "#00ff00",
	pink: "#ffc0cb",
	brown: "#a52a2a",
	gold: "#ffd700"
}), be = e({
	bg1: "lt1",
	tx1: "dk1",
	bg2: "lt2",
	tx2: "dk2"
}), xe = /* @__PURE__ */ new Set([
	"srgbClr",
	"schemeClr",
	"sysClr",
	"prstClr",
	"scrgbClr",
	"hslClr"
]);
function Se(e, n) {
	let r;
	switch (e.n) {
		case "srgbClr":
			r = e.a.val === void 0 ? "#000000" : y(e.a.val);
			break;
		case "sysClr":
			r = y(e.a.lastClr) ?? (e.a.val === "window" ? "#ffffff" : "#000000");
			break;
		case "prstClr":
			r = ye[e.a.val] ?? "#000000";
			break;
		case "scrgbClr":
			r = x([
				(_(e.a.r) ?? 0) / 1e5 * 255,
				(_(e.a.g) ?? 0) / 1e5 * 255,
				(_(e.a.b) ?? 0) / 1e5 * 255
			]);
			break;
		case "hslClr":
			r = x(C([
				(_(e.a.hue) ?? 0) / 216e5,
				(_(e.a.sat) ?? 0) / 1e5,
				(_(e.a.lum) ?? 0) / 1e5
			]));
			break;
		case "schemeClr": {
			let i = e.a.val;
			if (i === "phClr") r = n.phClr;
			else {
				let e = t(n.clrMap, i) ?? be[i] ?? i;
				r = t(n.theme?.colors, e) ?? t(n.theme?.colors, i);
			}
			break;
		}
	}
	if (r && v(r) !== void 0) return Ce(r, e);
}
function Ce(e, t) {
	if (!t.c.length) return e;
	let n = b(e), r = 1;
	for (let e of t.c) {
		let t = (_(e.a.val) ?? 0) / 1e5;
		switch (e.n) {
			case "alpha":
				r = t;
				break;
			case "lumMod": {
				let e = S(n);
				e[2] = w(e[2] * t), n = C(e);
				break;
			}
			case "lumOff": {
				let e = S(n);
				e[2] = w(e[2] + t), n = C(e);
				break;
			}
			case "satMod": {
				let e = S(n);
				e[1] = w(e[1] * t), n = C(e);
				break;
			}
			case "tint":
				n = n.map((e) => e + (255 - e) * (1 - t));
				break;
			case "shade":
				n = n.map((e) => e * t);
				break;
			case "inv":
				n = n.map((e) => 255 - e);
				break;
			case "gray": {
				let e = n[0] * .3 + n[1] * .59 + n[2] * .11;
				n = [
					e,
					e,
					e
				];
				break;
			}
		}
	}
	let i = x(n);
	if (r >= 1) return i;
	let [a, o, s] = b(i);
	return `rgba(${a},${o},${s},${+r.toFixed(3)})`;
}
function we(e, t) {
	if (e) {
		for (let n of e.c) if (xe.has(n.n)) return Se(n, t);
	}
}
var T = "000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 000000 FFFFFF FF0000 00FF00 0000FF FFFF00 FF00FF 00FFFF 800000 008000 000080 808000 800080 008080 C0C0C0 808080 9999FF 993366 FFFFCC CCFFFF 660066 FF8080 0066CC CCCCFF 000080 FF00FF FFFF00 00FFFF 800080 800000 008080 0000FF 00CCFF CCFFFF CCFFCC FFFF99 99CCFF FF99CC CC99FF FFCC99 3366FF 33CCCC 99CC00 FFCC00 FF9900 FF6600 666699 969696 003366 339966 003300 333300 993300 993366 333399 333333".split(" ").map((e) => "#" + e), Te = [
	"lt1",
	"dk1",
	"lt2",
	"dk2",
	"accent1",
	"accent2",
	"accent3",
	"accent4",
	"accent5",
	"accent6",
	"hlink",
	"folHlink"
];
function Ee(e, n, r = T) {
	if (!e || e.a.auto === "1" || e.a.auto === "true") return;
	let i;
	if (e.a.rgb) i = y(e.a.rgb);
	else if (e.a.theme !== void 0) i = t(n?.colors, Te[Number(e.a.theme)]);
	else if (e.a.indexed !== void 0) {
		let t = Number(e.a.indexed);
		if (t === 64 || t === 65) return;
		i = r[t];
	}
	if (!i || v(i) === void 0) return;
	let a = _(e.a.tint) ?? 0;
	return a ? ve(i, a) : i.toLowerCase();
}
function De(e) {
	let t = ae(g(g(e, "colors"), "indexedColors"), "rgbColor");
	return t.length ? t.map((e, t) => y(e.a.rgb) ?? T[t] ?? "#000000") : T;
}
// src/core/xlsx/formula/types.ts
var Oe = [
	"#NULL!",
	"#DIV/0!",
	"#VALUE!",
	"#REF!",
	"#NAME?",
	"#NUM!",
	"#N/A"
], ke = {
	"#SPILL!": 9,
	"#CALC!": 14
}, E = class {
	code;
	constructor(e) {
		this.code = e;
	}
	toString() {
		return this.code;
	}
}, Ae = class extends Error {}, je = class extends Ae {}, D = 1048575, Me = 268435455, O = 16383, Ne = {
	DIV0: new E("#DIV/0!"),
	VALUE: new E("#VALUE!"),
	REF: new E("#REF!"),
	NAME: new E("#NAME?"),
	NA: new E("#N/A"),
	NUM: new E("#NUM!"),
	NULL: new E("#NULL!")
};
// src/core/xlsx/formula/refs.ts
function k(e) {
	let t = "", n = e + 1;
	for (; n > 0;) {
		let e = (n - 1) % 26;
		t = String.fromCharCode(65 + e) + t, n = Math.floor((n - 1) / 26);
	}
	return t;
}
function Pe(e) {
	let t = 0, n = e.toUpperCase();
	for (let e = 0; e < n.length; e++) t = t * 26 + (n.charCodeAt(e) - 64);
	return t - 1;
}
function A(e, t) {
	return e === void 0 || t === void 0 ? e === t : e.toLowerCase() === t.toLowerCase();
}
function j(e) {
	return /^[A-Za-z_\u00A1-\uFFFF][\w.\u00A1-\uFFFF]*$/.test(e) && !/^[A-Za-z]{1,3}\d+$/.test(e) && !/^(R\d*C?\d*|C\d*)$/i.test(e) && !/^(TRUE|FALSE)$/i.test(e) ? e : `'${e.replace(/'/g, "''")}'`;
}
var M = (e, t, n, r) => `${r ? "$" : ""}${k(t)}${n ? "$" : ""}${e + 1}`;
function N(e, t) {
	let n = e.sheet === void 0 ? "" : `${t ?? j(e.sheet)}!`;
	switch (e.kind) {
		case "cell": return n + M(e.r0, e.c0, e.ar0, e.ac0);
		case "area": return `${n}${M(e.r0, e.c0, e.ar0, e.ac0)}:${M(e.r1, e.c1, e.ar1, e.ac1)}`;
		case "cols": return `${n}${e.ac0 ? "$" : ""}${k(e.c0)}:${e.ac1 ? "$" : ""}${k(e.c1)}`;
		case "rows": return `${n}${e.ar0 ? "$" : ""}${e.r0 + 1}:${e.ar1 ? "$" : ""}${e.r1 + 1}`;
	}
}
function P(e) {
	return e.r0 > e.r1 && ([e.r0, e.r1] = [e.r1, e.r0], [e.ar0, e.ar1] = [e.ar1, e.ar0]), e.c0 > e.c1 && ([e.c0, e.c1] = [e.c1, e.c0], [e.ac0, e.ac1] = [e.ac1, e.ac0]), e;
}
function Fe(e, t = D) {
	return e.r0 >= 0 && e.c0 >= 0 && e.r1 <= t && e.c1 <= 16383 && e.r1 >= 0 && e.c1 >= 0;
}
// src/core/xlsx/formula/lexer.ts
var F = class extends Error {
	pos;
	constructor(e, t) {
		super(e), this.pos = t, this.name = "FormulaSyntaxError";
	}
}, Ie = [
	["#DIV/0!", "#DIV/0!"],
	["#VALUE!", "#VALUE!"],
	["#REF!", "#REF!"],
	["#NAME?", "#NAME?"],
	["#N/A", "#N/A"],
	["#NUM!", "#NUM!"],
	["#NULL!", "#NULL!"],
	["#SPILL!", "#SPILL!"],
	["#CALC!", "#CALC!"]
], Le = /[\w.$\\\u00A1-\uFFFF]/, Re = /(\$?)([A-Za-z]{1,3})(\$?)(\d+):(\$?)([A-Za-z]{1,3})(\$?)(\d+)/y, ze = /(\$?)([A-Za-z]{1,3})(\$?)(\d+)/y, Be = /(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})/y, Ve = /(\$?)(\d+):(\$?)(\d+)/y, He = /(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/y, Ue = [
	"_XLFN.",
	"_XLWS.",
	"_XLUDF."
];
function I(e, t, n) {
	return e.lastIndex = n, e.exec(t);
}
var L = (e) => e !== void 0 && Le.test(e);
function R(e) {
	let t = Number(e) - 1;
	return t >= 0 && t <= 268435455 ? t : -1;
}
function z(e) {
	let t = Pe(e);
	return t <= 16383 ? t : -1;
}
function B(e, t) {
	let n, r = null;
	if (n = I(Re, e, t)) {
		let [e, t, i, a] = [
			R(n[4]),
			z(n[2]),
			R(n[8]),
			z(n[6])
		];
		e >= 0 && t >= 0 && i >= 0 && a >= 0 && (r = {
			kind: "area",
			r0: e,
			c0: t,
			r1: i,
			c1: a,
			ac0: !!n[1],
			ar0: !!n[3],
			ac1: !!n[5],
			ar1: !!n[7]
		});
	}
	if (!r && (n = I(ze, e, t))) {
		let [e, t] = [R(n[4]), z(n[2])];
		e >= 0 && t >= 0 && (r = {
			kind: "cell",
			r0: e,
			c0: t,
			r1: e,
			c1: t,
			ac0: !!n[1],
			ar0: !!n[3],
			ac1: !!n[1],
			ar1: !!n[3]
		});
	}
	if (!r && (n = I(Be, e, t))) {
		let [e, t] = [z(n[2]), z(n[4])];
		e >= 0 && t >= 0 && (r = {
			kind: "cols",
			r0: 0,
			c0: e,
			r1: D,
			c1: t,
			ac0: !!n[1],
			ar0: !1,
			ac1: !!n[3],
			ar1: !1
		});
	}
	if (!r && (n = I(Ve, e, t))) {
		let [e, t] = [R(n[2]), R(n[4])];
		e >= 0 && t >= 0 && (r = {
			kind: "rows",
			r0: e,
			c0: 0,
			r1: t,
			c1: O,
			ac0: !1,
			ar0: !!n[1],
			ac1: !1,
			ar1: !!n[3]
		});
	}
	if (!r || !n) return null;
	let i = t + n[0].length, a = e[i];
	return L(a) || a === "(" || a === "!" ? null : {
		ref: P(r),
		end: i
	};
}
function We(e, t) {
	let n = e.slice(t, t + 7).toUpperCase();
	for (let [e, r] of Ie) if (n.startsWith(e)) return [r, t + e.length];
	return null;
}
function Ge(e) {
	let t = e.toUpperCase();
	for (let e = !0; e;) {
		e = !1;
		for (let n of Ue) t.startsWith(n) && (t = t.slice(n.length), e = !0);
	}
	return t;
}
function V(e) {
	let t = [], n = e.length, r = 0, i = (r, i, a, o) => {
		if (e[i] === "#") {
			let n = We(e, i);
			if (!n) throw new F("bad error literal", i);
			return t.push({
				t: "err",
				v: n[0],
				sheet: a,
				s: r,
				e: n[1]
			}), n[1];
		}
		let s = B(e, i);
		if (s) return s.ref.sheet = a, t.push({
			t: "ref",
			ref: s.ref,
			sheetText: o,
			s: r,
			e: s.end
		}), s.end;
		let c = i;
		for (; c < n && L(e[c]);) c++;
		if (c === i) throw new F("expected reference after !", i);
		return t.push({
			t: "name",
			v: e.slice(i, c),
			sheet: a,
			s: r,
			e: c
		}), c;
	};
	for (; r < n;) {
		let a = e[r], o = r;
		if (a === " " || a === "\n" || a === "\r" || a === "	" || a === "\xA0") {
			for (; r < n && /[\s\u00A0]/.test(e[r]);) r++;
			t.push({
				t: "ws",
				s: o,
				e: r
			});
			continue;
		}
		if (a === "\"") {
			let i = "";
			for (r++;;) {
				if (r >= n) throw new F("unterminated string", o);
				if (e[r] === "\"") {
					if (e[r + 1] === "\"") {
						i += "\"", r += 2;
						continue;
					}
					r++;
					break;
				}
				i += e[r++];
			}
			t.push({
				t: "str",
				v: i,
				s: o,
				e: r
			});
			continue;
		}
		if (a === "#") {
			let n = We(e, r);
			if (!n) throw new F("bad error literal", r);
			t.push({
				t: "err",
				v: n[0],
				s: o,
				e: n[1]
			}), r = n[1];
			continue;
		}
		if (a === "'") {
			let t = "", a = r + 1;
			for (;;) {
				if (a >= n) throw new F("unterminated sheet name", o);
				if (e[a] === "'") {
					if (e[a + 1] === "'") {
						t += "'", a += 2;
						continue;
					}
					break;
				}
				t += e[a++];
			}
			if (e[a + 1] !== "!") throw new F("expected '!' after sheet name", a + 1);
			r = i(o, a + 2, t, e.slice(r, a + 1));
			continue;
		}
		if (a === "[") {
			let t = /\[\d+\][\w.\u00A1-\uFFFF]+!/y;
			if (t.lastIndex = r, !t.exec(e)) throw new F("unexpected '['", r);
			let n = t.lastIndex - 1, a = e.slice(r, n);
			r = i(o, n + 1, a, a);
			continue;
		}
		if ("(){},;".includes(a)) {
			t.push({
				t: "punc",
				v: a,
				s: o,
				e: ++r
			});
			continue;
		}
		let s = e.slice(r, r + 2);
		if (s === "<=" || s === ">=" || s === "<>") t.push({
			t: "op",
			v: s,
			s: o,
			e: r += 2
		});
		else if ("+-*/^&=<>%:".includes(a)) t.push({
			t: "op",
			v: a,
			s: o,
			e: ++r
		});
		else if (a >= "0" && a <= "9" || a === "." && /\d/.test(e[r + 1] ?? "") || a === "$" && /\d/.test(e[r + 1] ?? "")) {
			let n = B(e, r);
			if (n && n.ref.kind === "rows") {
				t.push({
					t: "ref",
					ref: n.ref,
					s: o,
					e: n.end
				}), r = n.end;
				continue;
			}
			let i = I(He, e, r);
			if (!i || a === "$") throw new F("bad number", r);
			r += i[0].length, t.push({
				t: "num",
				v: Number(i[0]),
				s: o,
				e: r
			});
		} else if (L(a)) {
			let a = r;
			for (; a < n && L(e[a]);) a++;
			let s = e.slice(r, a);
			if (e[a] === "!") {
				r = i(o, a + 1, s, s);
				continue;
			}
			if (e[a] === "(") {
				t.push({
					t: "func",
					v: Ge(s),
					s: o,
					e: a
				}), r = a;
				continue;
			}
			let c = B(e, r);
			if (c) {
				t.push({
					t: "ref",
					ref: c.ref,
					s: o,
					e: c.end
				}), r = c.end;
				continue;
			}
			let l = s.toUpperCase();
			if (l === "TRUE" || l === "FALSE") {
				t.push({
					t: "bool",
					v: l === "TRUE",
					s: o,
					e: a
				}), r = a;
				continue;
			}
			if (e[a] === "[") {
				let t = 0;
				do
					e[a] === "[" ? t++ : e[a] === "]" && t--, a++;
				while (a < n && t > 0);
				if (t > 0) throw new F("unterminated [", r);
			}
			t.push({
				t: "name",
				v: e.slice(r, a),
				s: o,
				e: a
			}), r = a;
		} else throw new F(`unexpected character '${a}'`, r);
	}
	return t;
}
function Ke(e) {
	let t;
	try {
		t = V(e.trim()).filter((e) => e.t !== "ws");
	} catch {
		return null;
	}
	let n = t[0];
	if (!n || n.t !== "ref") return null;
	if (t.length === 1) return n.ref;
	let r = t[1], i = t[2];
	return t.length !== 3 || r.t !== "op" || r.v !== ":" || i.t !== "ref" || i.ref.sheet !== void 0 && (n.ref.sheet ?? "").toLowerCase() !== i.ref.sheet.toLowerCase() ? null : P({
		...n.ref,
		kind: "area",
		r0: Math.min(n.ref.r0, i.ref.r0),
		c0: Math.min(n.ref.c0, i.ref.c0),
		r1: Math.max(n.ref.r1, i.ref.r1),
		c1: Math.max(n.ref.c1, i.ref.c1)
	});
}
// src/core/xlsx/formula/transform.ts
function H(e, t) {
	let n = e.startsWith("=") ? "=" : "", r = e.slice(n.length), i;
	try {
		i = V(r);
	} catch {
		return e;
	}
	let a = n, o = 0;
	for (let e of i) {
		let n = t(e);
		n !== void 0 && (a += r.slice(o, e.s) + n, o = e.e);
	}
	return a + r.slice(o);
}
var U = (e) => (e.ref.sheet === void 0 ? "" : `${e.sheetText ?? j(e.ref.sheet)}!`) + "#REF!";
function qe(e, t, n) {
	let r = { ...e.ref };
	return r.kind !== "cols" && (r.ar0 || (r.r0 += t), r.ar1 || (r.r1 += t)), r.kind !== "rows" && (r.ac0 || (r.c0 += n), r.ac1 || (r.c1 += n)), Fe(r, e.ref.r1 > 1048575 ? 268435455 : 1048575) ? N(P(r), e.sheetText) : U(e);
}
function Je(e, t, n) {
	return !t && !n ? e : H(e, (e) => e.t === "ref" ? qe(e, t, n) : void 0);
}
function Ye(e) {
	let t = e.startsWith("=") ? "=" : "", n = e.slice(t.length), r;
	try {
		r = V(n).filter((e) => e.t === "ref");
	} catch {
		return () => e;
	}
	let i = [], a = 0;
	for (let e of r) i.push(n.slice(a, e.s)), a = e.e;
	let o = n.slice(a);
	return (n, a) => {
		if (!n && !a) return e;
		let s = t;
		for (let e = 0; e < r.length; e++) s += i[e] + qe(r[e], n, a);
		return s + o;
	};
}
function Xe(e, t, n, r, i) {
	if (r > 0) return e >= n && (e += r), t >= n && (t += r), e > i ? null : [e, Math.min(t, i)];
	let a = -r, o = n + a;
	return t < n ? [e, t] : e >= o ? [e - a, t - a] : e >= n && t < o ? null : [e < n ? e : n, t >= o ? t - a : n - 1];
}
function W(e, t) {
	if (!t.delta) return e;
	let n = (e) => {
		if (t.sheet === void 0) return e === void 0 || t.formulaSheet !== void 0 && A(e, t.formulaSheet);
		let n = e ?? t.formulaSheet;
		return n === void 0 || A(n, t.sheet);
	};
	return H(e, (e) => {
		if (e.t !== "ref" || !n(e.ref.sheet)) return;
		let r = { ...e.ref };
		if (t.axis === "row") {
			if (r.kind === "cols") return;
			let n = Xe(r.r0, r.r1, t.at, t.delta, r.r1 > 1048575 ? Me : D);
			if (!n) return U(e);
			[r.r0, r.r1] = n;
		} else {
			if (r.kind === "rows") return;
			let n = Xe(r.c0, r.c1, t.at, t.delta, O);
			if (!n) return U(e);
			[r.c0, r.c1] = n;
		}
		if (r.r0 !== e.ref.r0 || r.r1 !== e.ref.r1 || r.c0 !== e.ref.c0 || r.c1 !== e.ref.c1) return N(r, e.sheetText);
	});
}
function Ze(e, t, n, r = n) {
	return H(e, (e) => {
		if (e.t !== "ref") return;
		let i = e.ref, a = i.sheet ?? r, o = A(a, t.from) && (i.kind === "cell" || i.kind === "area") && i.r0 >= t.r0 && i.r1 <= t.r1 && i.c0 >= t.c0 && i.c1 <= t.c1, s = o ? t.to : a, c = A(s, n);
		return !o && i.sheet === void 0 === c ? void 0 : N({
			...o ? {
				...i,
				r0: i.r0 + t.dr,
				r1: i.r1 + t.dr,
				c0: i.c0 + t.dc,
				c1: i.c1 + t.dc
			} : { ...i },
			sheet: c ? void 0 : s
		}, !c && i.sheet !== void 0 && A(i.sheet, s) ? e.sheetText : void 0);
	});
}
function Qe(e, t) {
	return H(e, (e) => {
		if (e.t === "ref" && e.ref.sheet !== void 0 && A(e.ref.sheet, t) || (e.t === "err" || e.t === "name") && e.sheet !== void 0 && A(e.sheet, t)) return "#REF!";
	});
}
function $e(e, t, n) {
	let r = `${j(n)}!`;
	return H(e, (e) => {
		if (e.t === "ref" && e.ref.sheet !== void 0 && A(e.ref.sheet, t)) return N({
			...e.ref,
			sheet: n
		});
		if ((e.t === "err" || e.t === "name") && e.sheet !== void 0 && A(e.sheet, t)) return r + e.v;
	});
}
var et = new Set("ACOT ACOTH AGGREGATE ARABIC ARRAYTOTEXT BASE BETA.DIST BETA.INV BINOM.DIST BINOM.DIST.RANGE BINOM.INV BITAND BITLSHIFT BITOR BITRSHIFT BITXOR BYCOL BYROW CEILING.MATH CEILING.PRECISE CHISQ.DIST CHISQ.DIST.RT CHISQ.INV CHISQ.INV.RT CHISQ.TEST CHOOSECOLS CHOOSEROWS COMBINA CONCAT CONFIDENCE.NORM CONFIDENCE.T COT COTH COVARIANCE.P COVARIANCE.S CSC CSCH DAYS DECIMAL DROP ERF.PRECISE ERFC.PRECISE EXPAND EXPON.DIST F.DIST F.DIST.RT F.INV F.INV.RT F.TEST FILTERXML FLOOR.MATH FLOOR.PRECISE FORECAST.ETS FORECAST.ETS.CONFINT FORECAST.ETS.SEASONALITY FORECAST.ETS.STAT FORECAST.LINEAR FORMULATEXT GAMMA GAMMA.DIST GAMMA.INV GAMMALN.PRECISE GAUSS HSTACK HYPGEOM.DIST IFNA IFS IMAGE IMCOSH IMCOT IMCSC IMCSCH IMSEC IMSECH IMSINH IMTAN ISFORMULA ISOMITTED ISOWEEKNUM LAMBDA LET LOGNORM.DIST LOGNORM.INV MAKEARRAY MAP MAXIFS MINIFS MODE.MULT MODE.SNGL MUNIT NEGBINOM.DIST NORM.DIST NORM.INV NORM.S.DIST NORM.S.INV NUMBERVALUE PDURATION PERCENTILE.EXC PERCENTILE.INC PERCENTRANK.EXC PERCENTRANK.INC PERMUTATIONA PHI POISSON.DIST QUARTILE.EXC QUARTILE.INC QUERYSTRING RANDARRAY RANK.AVG RANK.EQ REDUCE RRI SCAN SEC SECH SEQUENCE SHEET SHEETS SINGLE SKEW.P SORTBY STDEV.P STDEV.S SWITCH T.DIST T.DIST.2T T.DIST.RT T.INV T.INV.2T T.TEST TAKE TEXTAFTER TEXTBEFORE TEXTJOIN TEXTSPLIT TOCOL TOROW UNICHAR UNICODE UNIQUE VALUETOTEXT VAR.P VAR.S VSTACK WEBSERVICE WEIBULL.DIST WRAPCOLS WRAPROWS XLOOKUP XMATCH XOR Z.TEST".split(" ")), tt = /* @__PURE__ */ new Set(["FILTER", "SORT"]);
function nt(e) {
	return /[A-Za-z]\(/.test(e) ? H(e, (t) => {
		if (t.t !== "func") return;
		let n = e.slice(e.startsWith("=") ? t.s + 1 : t.s, e.startsWith("=") ? t.e + 1 : t.e);
		if (!n.startsWith("_")) {
			if (et.has(t.v)) return `_xlfn.${n}`;
			if (tt.has(t.v)) return `_xlfn._xlws.${n}`;
		}
	}) : e;
}
function rt(e) {
	return !e.includes("_xl") && !e.includes("_XL") ? e : H(e, (t) => {
		if (t.t !== "func") return;
		let n = e.slice(e.startsWith("=") ? t.s + 1 : t.s, e.startsWith("=") ? t.e + 1 : t.e), r = n.replace(/^(?:_xlfn\.|_xlws\.|_xludf\.)+/i, "");
		return r === n ? void 0 : r;
	});
}
var it = /* @__PURE__ */ new Set([
	"INDIRECT",
	"OFFSET",
	"NOW",
	"TODAY",
	"RAND",
	"RANDBETWEEN"
]);
function G(e) {
	switch (e.type) {
		case "call": return it.has(e.name) || e.args.some(G);
		case "unary":
		case "percent": return G(e.arg);
		case "binary":
		case "range": return G(e.left) || G(e.right);
		case "union": return e.items.some(G);
		default: return !1;
	}
}
function K(e) {
	let t = e.sheet === void 0 ? {} : { sheet: e.sheet };
	return e.kind === "cell" ? {
		...t,
		r: e.r0,
		c: e.c0,
		absR: e.ar0,
		absC: e.ac0
	} : {
		...t,
		r0: e.r0,
		c0: e.c0,
		r1: e.r1,
		c1: e.c1
	};
}
function at(e) {
	let t = [], n = (e) => {
		switch (e.type) {
			case "ref":
				t.push(K(e.ref));
				break;
			case "range":
				if (e.left.type === "ref" && e.right.type === "ref" && A(e.left.ref.sheet, e.right.ref.sheet)) {
					let n = e.left.ref, r = e.right.ref;
					t.push(K({
						...n,
						kind: "area",
						r0: Math.min(n.r0, r.r0),
						c0: Math.min(n.c0, r.c0),
						r1: Math.max(n.r1, r.r1),
						c1: Math.max(n.c1, r.c1)
					}));
				} else n(e.left), n(e.right);
				break;
			case "unary":
			case "percent":
				n(e.arg);
				break;
			case "binary":
				n(e.left), n(e.right);
				break;
			case "union":
				e.items.forEach(n);
				break;
			case "call": e.args.forEach(n);
		}
	};
	return n(e), t;
}
// src/collab/xlsx-ops.ts
var q = /* @__PURE__ */ new Set([
	"insertRows",
	"deleteRows",
	"insertCols",
	"deleteCols"
]), J = (e) => e.t === "book" || e.t === "sheet" && q.has(e.op.op);
function Y(e, t, n) {
	if (n >= 0) return e >= t ? e + n : e;
	let r = -n;
	return e < t ? e : e < t + r ? null : e - r;
}
function X(e, t, n, r) {
	if (r >= 0) return [e >= n ? e + r : e, t >= n ? t + r : t];
	let i = -r;
	if (t < n) return [e, t];
	if (e >= n + i) return [e - i, t - i];
	let a = e < n ? e : n, o = t < n + i ? n - 1 : t - i;
	return o < a ? null : [a, o];
}
function Z(e, t, n, r) {
	let i = t === "row" ? X(e.r0, e.r1, n, r) : X(e.c0, e.c1, n, r);
	return i ? t === "row" ? {
		...e,
		r0: i[0],
		r1: i[1]
	} : {
		...e,
		c0: i[0],
		c1: i[1]
	} : null;
}
function ot(e, t, n, r) {
	let i = (e, i, a) => a === t ? X(e, i, n, r) : [e, i];
	switch (e.op) {
		case "insertRows":
		case "insertCols": {
			if (e.op === "insertRows" != (t === "row")) return e;
			let i = r >= 0 ? e.at >= n ? e.at + r : e.at : e.at < n ? e.at : e.at < n - r ? n : e.at + r;
			return i === e.at ? e : {
				...e,
				at: i
			};
		}
		case "deleteRows":
		case "deleteCols": {
			if (e.op === "deleteRows" != (t === "row")) return e;
			let i = X(e.at, e.at + e.n - 1, n, r);
			return i ? {
				...e,
				at: i[0],
				n: i[1] - i[0] + 1
			} : null;
		}
		case "merge":
		case "unmerge":
		case "clear":
		case "fill": {
			let i = Z(e.range, t, n, r);
			return i ? {
				...e,
				range: i
			} : null;
		}
		case "paste": {
			let i = t === "row" ? Y(e.range.r0, n, r) : e.range.r0, a = t === "col" ? Y(e.range.c0, n, r) : e.range.c0;
			return i === null || a === null ? null : i === e.range.r0 && a === e.range.c0 ? e : {
				...e,
				range: {
					r0: i,
					c0: a,
					r1: i + (e.range.r1 - e.range.r0),
					c1: a + (e.range.c1 - e.range.c0)
				}
			};
		}
		case "sort": {
			let i = Z(e.range, t, n, r);
			if (!i) return null;
			let a = t === "col" ? Y(e.col, n, r) : e.col;
			return a === null ? null : {
				...e,
				range: i,
				col: a
			};
		}
		case "hideRows":
		case "hideCols": {
			let t = i(e.a, e.b, e.op === "hideRows" ? "row" : "col");
			return t ? {
				...e,
				a: t[0],
				b: t[1]
			} : null;
		}
		case "colWidth": {
			let t = i(e.c0, e.c1, "col");
			return t ? {
				...e,
				c0: t[0],
				c1: t[1]
			} : null;
		}
		case "rowHeight": {
			let t = i(e.r0, e.r1, "row");
			return t ? {
				...e,
				r0: t[0],
				r1: t[1]
			} : null;
		}
		default: return e;
	}
}
function Q(e, t) {
	if (e.t === "set") {
		let n = !1, r = e.cells.map((e) => {
			if (e.input.length < 2 || e.input[0] !== "=") return e;
			let r = t(e.input.slice(1));
			return "=" + r === e.input ? e : (n = !0, {
				...e,
				input: "=" + r
			});
		});
		return n ? {
			...e,
			cells: r
		} : e;
	}
	if (e.t === "sheet" && e.op.op === "paste") {
		let n = !1, r = e.op.cells.map((e) => e.map((e) => {
			if (!e || e[3] === void 0) return e;
			let r = t(e[3]);
			return r === e[3] ? e : (n = !0, [
				e[0],
				e[1],
				e[2],
				r
			]);
		}));
		return n ? {
			...e,
			op: {
				...e.op,
				cells: r
			}
		} : e;
	}
	return e;
}
function st(e, t) {
	if (e.t === "comment") return ct(e, t);
	if (t.t === "book") {
		if (t.op.op === "delete" && "sheet" in e && e.sheet === t.op.path) return null;
		if (t.op.op === "rename" && t.op.was !== void 0) {
			let { was: n, name: r } = t.op;
			return Q(e, (e) => $e(e, n, r));
		}
		return e;
	}
	if (t.t !== "sheet" || !q.has(t.op.op) || !("sheet" in e)) return e;
	let n = t.op, r = n.op.endsWith("Rows") ? "row" : "col", i = n.op.startsWith("insert") ? n.n : -n.n;
	if (e.sheet !== t.sheet) {
		let a = t.name;
		return a === void 0 ? e : Q(e, (e) => W(e, {
			sheet: a,
			formulaSheet: "\0",
			axis: r,
			at: n.at,
			delta: i
		}));
	}
	switch (e = Q(e, (e) => W(e, t.name === void 0 ? {
		axis: r,
		at: n.at,
		delta: i
	} : {
		sheet: t.name,
		formulaSheet: t.name,
		axis: r,
		at: n.at,
		delta: i
	})), e.t) {
		case "set": {
			let t = [];
			for (let a of e.cells) {
				let e = Y(r === "row" ? a.r : a.c, n.at, i);
				e !== null && t.push(r === "row" ? {
					...a,
					r: e
				} : {
					...a,
					c: e
				});
			}
			return t.length ? {
				...e,
				cells: t
			} : null;
		}
		case "fmt": {
			let t = Z(e.range, r, n.at, i);
			return t ? {
				...e,
				range: t
			} : null;
		}
		case "sheet": {
			let t = ot(e.op, r, n.at, i);
			return t === e.op ? e : t ? {
				...e,
				op: t
			} : null;
		}
		case "replace": {
			if (!e.at) return e;
			let t = Y(r === "row" ? e.at.r : e.at.c, n.at, i);
			return t === null ? null : {
				...e,
				at: r === "row" ? {
					...e.at,
					r: t
				} : {
					...e.at,
					c: t
				}
			};
		}
	}
	return e;
}
function ct(e, t) {
	let n = e.c?.at;
	if (!n || !("sheet" in n)) return e;
	if (t.t === "book") return t.op.op === "delete" && t.op.path === n.sheet ? null : e;
	if (t.t !== "sheet" || !q.has(t.op.op) || t.sheet !== n.sheet) return e;
	let r = t.op, i = r.op.endsWith("Rows"), a = Y(i ? n.r : n.c, r.at, r.op.startsWith("insert") ? r.n : -r.n);
	return a === null ? null : a === (i ? n.r : n.c) ? e : {
		...e,
		c: {
			...e.c,
			at: i ? {
				...n,
				r: a
			} : {
				...n,
				c: a
			}
		}
	};
}
var $ = {
	r0: 0,
	c0: 0,
	r1: 2 ** 53 - 1,
	c1: 2 ** 53 - 1
}, lt = (e) => e.t === "set" && e.cells.some((e) => e.input.includes("\n")), ut = (e) => e.t === "set" && e.cells.some((e) => /^\s*[=+@-]|[$€£¥₫₩₹₽₱฿%]|^\s*\d{1,3}(,\d{3})+|^\s*\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(e.input));
function dt(e) {
	switch (e.t) {
		case "set": {
			let t = Infinity, n = Infinity, r = -1, i = -1;
			for (let a of e.cells) t = Math.min(t, a.r), n = Math.min(n, a.c), r = Math.max(r, a.r), i = Math.max(i, a.c);
			return {
				sheet: e.sheet,
				range: lt(e) ? {
					...$,
					r0: t,
					r1: r
				} : {
					r0: t,
					c0: n,
					r1: r,
					c1: i
				}
			};
		}
		case "fmt": return {
			sheet: e.sheet,
			range: e.range
		};
		case "replace": return {
			sheet: e.sheet,
			range: e.at ? {
				r0: e.at.r,
				c0: e.at.c,
				r1: e.at.r,
				c1: e.at.c
			} : $
		};
		case "sheet": {
			let t = e.op;
			return "range" in t ? {
				sheet: e.sheet,
				range: t.range
			} : t.op === "hideRows" ? {
				sheet: e.sheet,
				range: {
					...$,
					r0: t.a,
					r1: t.b
				}
			} : t.op === "hideCols" ? {
				sheet: e.sheet,
				range: {
					...$,
					c0: t.a,
					c1: t.b
				}
			} : t.op === "colWidth" ? {
				sheet: e.sheet,
				range: {
					...$,
					c0: t.c0,
					c1: t.c1
				}
			} : t.op === "rowHeight" ? {
				sheet: e.sheet,
				range: {
					...$,
					r0: t.r0,
					r1: t.r1
				}
			} : {
				sheet: e.sheet,
				range: $
			};
		}
		default: return null;
	}
}
var ft = (e, t) => e.r0 <= t.r1 && t.r0 <= e.r1 && e.c0 <= t.c1 && t.c0 <= e.c1;
function pt(e, t) {
	if (t.some((e) => J(e) || e.t === "revert")) return !0;
	let n = new Set(e.flatMap((e) => e.t === "comment" ? [e.cid] : []));
	if (t.some((e) => e.t === "comment" && n.has(e.cid)) || e.some((e) => e.t === "revert" || J(e))) return !0;
	let r = (e) => e.t === "fmt" && e.patch.xf === void 0 && !e.patch.clear || lt(e) || ut(e);
	if (e.some(r) && t.some(r)) return !0;
	let i = t.map(dt);
	return e.some((e) => {
		let t = dt(e);
		return !!t && i.some((e) => !!e && e.sheet === t.sheet && ft(t.range, e.range));
	});
}
export { _ as $, ve as A, S as B, ke as C, D, O as E, y as F, re as G, te as H, b as I, f as J, ne as K, C as L, v as M, ge as N, je as O, De as P, ae as Q, _e as R, Oe as S, E as T, o as U, Ee as V, l as W, ce as X, se as Y, g as Z, V as _, Qe as a, s as at, A as b, at as c, t as ct, rt as d, le as et, Je as f, Ke as g, F as h, st as i, ue as it, we as j, T as k, $e as l, nt as m, pt as n, m as nt, G as o, p as ot, Ye as p, i as q, J as r, oe as rt, Ze as s, e as st, q as t, ie as tt, W as u, k as v, Ae as w, Ne as x, j as y, x as z };

//# sourceMappingURL=xlsx-ops-D_58Pncw.js.map