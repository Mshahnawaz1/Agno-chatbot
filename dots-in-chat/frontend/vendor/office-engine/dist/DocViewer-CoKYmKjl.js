
import { B as e, C as t, D as n, E as r, G as i, H as a, I as o, L as s, O as c, R as l, S as u, T as d, U as f, V as p, W as m, Y as h, _ as g, a as _, b as v, c as y, d as b, f as x, i as S, k as C, m as w, o as ee, p as T, q as te, s as E, t as D, v as ne, w as re, x as ie, y as ae, z as oe } from "./default-worker-tP_-u1gt.js";
import { A as se, C as ce, D as le, E as O, F as ue, M as de, N as fe, O as pe, P as me, S as he, T as ge, _ as _e, b as k, d as ve, f as A, g as ye, h as j, j as be, k as xe, m as Se, p as Ce, t as we, v as M, w as N, x as P, y as Te } from "./collab-C4xiOtwj.js";
import { D as Ee, E as De, M as F, N as Oe, _ as I, f as ke, h as Ae, st as je, v as L, y as R } from "./xlsx-ops-D_58Pncw.js";
import { Children as Me, Fragment as Ne, createContext as Pe, isValidElement as Fe, memo as z, useCallback as Ie, useContext as Le, useEffect as B, useId as Re, useInsertionEffect as ze, useLayoutEffect as Be, useMemo as Ve, useReducer as He, useRef as V, useState as H, useSyncExternalStore as U } from "react";
import { createPortal as Ue } from "react-dom";
import { Fragment as We, jsx as W, jsxs as G } from "react/jsx-runtime";
import { createRoot as Ge } from "react-dom/client";
// src/core/xlsx/formula/assist.ts
function Ke(e) {
	try {
		return {
			toks: I(e),
			tail: e.length,
			openString: !1
		};
	} catch (t) {
		if (!(t instanceof Ae)) return {
			toks: [],
			tail: 0,
			openString: !1
		};
		let n = Math.max(0, Math.min(t.pos, e.length)), r = n > 0 ? Ke(e.slice(0, n)) : {
			toks: [],
			tail: 0,
			openString: !1
		};
		return r.tail < n ? r : {
			toks: r.toks,
			tail: n,
			openString: t.message === "unterminated string"
		};
	}
}
var qe = (e) => e.startsWith("=") && e.length > 0, Je = /* @__PURE__ */ new Set([
	"(",
	",",
	";",
	"{"
]), Ye = /* @__PURE__ */ new Set([
	")",
	",",
	";",
	"}"
]);
function Xe(e, t) {
	let n = {
		pointable: !1,
		refs: []
	};
	if (!qe(e)) return n;
	let r = e.slice(1), i = t - 1, { toks: a, tail: o } = Ke(r);
	for (let e of a) e.t === "ref" && n.refs.push({
		s: e.s + 1,
		e: e.e + 1,
		text: r.slice(e.s, e.e),
		ref: e.ref
	});
	if (i < 0) return n;
	let s = i > o, c = [], l, u, d;
	for (let e = 0; e < a.length; e++) {
		let t = a[e];
		t.e <= i ? (t.t === "punc" && (t.v === "(" ? c.push({
			name: a[e - 1]?.t === "func" && a[e - 1].e === t.s ? a[e - 1].v : "",
			arg: 0
		}) : t.v === "{" ? c.push({
			name: "",
			arg: 0
		}) : t.v === ")" || t.v === "}" ? c.pop() : (t.v === "," || t.v === ";") && c.length && c[c.length - 1].arg++), t.t !== "ws" && (l = t)) : t.s < i ? u = t : !d && t.t !== "ws" && (d = t);
	}
	for (let e = c.length - 1; e >= 0; e--) if (c[e].name) {
		n.call = c[e];
		break;
	}
	if (s) return n;
	let f = u ?? (l && l.e === i ? l : void 0);
	if (f && (f.t === "name" || f.t === "func" || f.t === "ref" || f.t === "bool")) {
		let e = r.slice(f.s, i);
		if (!(f.t === "ref" && f.ref.sheet !== void 0 || f.t === "name" && f.sheet !== void 0) && /^[A-Za-z_][A-Za-z0-9_.]*$/.test(e)) {
			let t = f.t === "func" || r[f.e] === "(";
			n.word = {
				s: f.s + 1,
				e: f.e + 1,
				text: e,
				call: t
			};
		}
	}
	if (!u) {
		let e = !l || l.t === "punc" && Je.has(l.v) || l.t === "op" && l.v !== "%", t = !d || d.t === "punc" && Ye.has(d.v) || d.t === "op" && d.v !== ":";
		n.pointable = e && t;
	}
	return n;
}
function Ze(e, t, n, r, i) {
	let a = i === void 0 ? "" : R(i) + "!";
	if (e > n && ([e, n] = [n, e]), t > r && ([t, r] = [r, t]), e === 0 && n >= 1048575) return `${a}${L(t)}:${L(r)}`;
	if (t === 0 && r >= 16383) return `${a}${e + 1}:${n + 1}`;
	let o = `${L(t)}${e + 1}`;
	return e === n && t === r ? a + o : `${a}${o}:${L(r)}${n + 1}`;
}
function Qe(e) {
	if (!qe(e)) return e;
	let t = e.slice(1), { toks: n, tail: r, openString: i } = Ke(t);
	if (r < t.length && !i) return e;
	let a = 0, o = "", s = 0;
	for (let e of n) {
		if (e.t === "func" || e.t === "bool" || e.t === "ref" && e.ref.sheet === void 0) o += t.slice(s, e.s) + t.slice(e.s, e.e).toUpperCase(), s = e.e;
		else if (e.t === "ref") {
			let n = t.lastIndexOf("!", e.e);
			o += t.slice(s, n + 1) + t.slice(n + 1, e.e).toUpperCase(), s = e.e;
		}
		e.t === "punc" && (e.v === "(" ? a++ : e.v === ")" && (a = Math.max(0, a - 1)));
	}
	return o += t.slice(s), "=" + o + (i ? "\"" : "") + ")".repeat(a);
}
// src/core/xlsx/formula/catalog.ts
var $e = {
	ABS: "number|Absolute value of a number.",
	AND: "logical1, [logical2], ...|TRUE if all arguments are TRUE.",
	AVERAGE: "number1, [number2], ...|Arithmetic mean of the arguments.",
	AVERAGEIF: "range, criteria, [average_range]|Average of cells that meet a condition.",
	AVERAGEIFS: "average_range, criteria_range1, criteria1, ...|Average of cells that meet multiple conditions.",
	CEILING: "number, significance|Rounds a number up to the nearest multiple of significance.",
	"CEILING.MATH": "number, [significance], [mode]|Rounds a number up to the nearest integer or multiple.",
	CHAR: "number|Character for a character code.",
	CHOOSE: "index_num, value1, [value2], ...|Picks a value from the list by position.",
	CODE: "text|Numeric code of the first character.",
	COLUMN: "[reference]|Column number of a reference.",
	COLUMNS: "array|Number of columns in a reference.",
	CONCAT: "text1, [text2], ...|Joins several text items into one.",
	CONCATENATE: "text1, [text2], ...|Joins several text items into one.",
	COUNT: "value1, [value2], ...|Counts cells that contain numbers.",
	COUNTA: "value1, [value2], ...|Counts cells that are not empty.",
	COUNTBLANK: "range|Counts empty cells in a range.",
	COUNTIF: "range, criteria|Counts cells that meet a condition.",
	COUNTIFS: "criteria_range1, criteria1, ...|Counts cells that meet multiple conditions.",
	DATE: "year, month, day|Date serial number from year, month and day.",
	DATEDIF: "start_date, end_date, unit|Difference between two dates in days, months or years.",
	DAY: "serial_number|Day of the month (1-31).",
	DAYS: "end_date, start_date|Number of days between two dates.",
	EDATE: "start_date, months|Date that is a number of months before or after a date.",
	EOMONTH: "start_date, months|Last day of the month, months before or after a date.",
	"ERROR.TYPE": "error_val|Number that corresponds to an error type.",
	EVEN: "number|Rounds up to the nearest even integer.",
	EXACT: "text1, text2|TRUE if two texts are exactly the same.",
	EXP: "number|e raised to the power of a number.",
	FACT: "number|Factorial of a number.",
	FALSE: "|The logical value FALSE.",
	FIND: "find_text, within_text, [start_num]|Position of a text inside another (case-sensitive).",
	FLOOR: "number, significance|Rounds a number down to the nearest multiple of significance.",
	"FLOOR.MATH": "number, [significance], [mode]|Rounds a number down to the nearest integer or multiple.",
	GCD: "number1, [number2], ...|Greatest common divisor.",
	HLOOKUP: "lookup_value, table_array, row_index_num, [range_lookup]|Looks up a value in the top row and returns a value from the same column.",
	HOUR: "serial_number|Hour of a time value (0-23).",
	HYPERLINK: "link_location, [friendly_name]|A link: the cell shows the friendly name, or else the address.",
	IF: "logical_test, [value_if_true], [value_if_false]|Returns one value if a condition is TRUE and another if FALSE.",
	IFERROR: "value, value_if_error|Returns value_if_error if the expression is an error.",
	IFNA: "value, value_if_na|Returns value_if_na if the expression is #N/A.",
	IFS: "logical_test1, value_if_true1, ...|Returns the value of the first TRUE condition.",
	INDEX: "array, row_num, [column_num]|Value at a given row and column of a range.",
	INDIRECT: "ref_text, [a1]|Reference given by a text string.",
	INT: "number|Rounds down to the nearest integer.",
	ISBLANK: "value|TRUE if the value is empty.",
	ISERR: "value|TRUE if the value is an error other than #N/A.",
	ISERROR: "value|TRUE if the value is any error.",
	ISEVEN: "number|TRUE if the number is even.",
	ISLOGICAL: "value|TRUE if the value is a logical value.",
	ISNA: "value|TRUE if the value is #N/A.",
	ISNONTEXT: "value|TRUE if the value is not text.",
	ISNUMBER: "value|TRUE if the value is a number.",
	ISODD: "number|TRUE if the number is odd.",
	ISTEXT: "value|TRUE if the value is text.",
	LARGE: "array, k|k-th largest value in a data set.",
	LCM: "number1, [number2], ...|Least common multiple.",
	LEFT: "text, [num_chars]|First characters of a text.",
	LEN: "text|Number of characters in a text.",
	LN: "number|Natural logarithm.",
	LOG: "number, [base]|Logarithm to a given base (default 10).",
	LOG10: "number|Base-10 logarithm.",
	LOOKUP: "lookup_value, lookup_vector, [result_vector]|Looks up a value in a one-row or one-column range.",
	LOWER: "text|Converts text to lowercase.",
	MATCH: "lookup_value, lookup_array, [match_type]|Relative position of a value in a range.",
	MAX: "number1, [number2], ...|Largest value.",
	MAXIFS: "max_range, criteria_range1, criteria1, ...|Largest value among cells that meet conditions.",
	MEDIAN: "number1, [number2], ...|Median of the numbers.",
	MID: "text, start_num, num_chars|Characters from the middle of a text.",
	MIN: "number1, [number2], ...|Smallest value.",
	MINIFS: "min_range, criteria_range1, criteria1, ...|Smallest value among cells that meet conditions.",
	MINUTE: "serial_number|Minute of a time value (0-59).",
	MOD: "number, divisor|Remainder after division.",
	MODE: "number1, [number2], ...|Most frequent value.",
	"MODE.SNGL": "number1, [number2], ...|Most frequent value.",
	MONTH: "serial_number|Month of a date (1-12).",
	N: "value|Value converted to a number.",
	NA: "|The error value #N/A.",
	NETWORKDAYS: "start_date, end_date, [holidays]|Number of working days between two dates.",
	NOT: "logical|Reverses a logical value.",
	NOW: "|Current date and time.",
	ODD: "number|Rounds up to the nearest odd integer.",
	OFFSET: "reference, rows, cols, [height], [width]|Reference offset from a starting reference.",
	OR: "logical1, [logical2], ...|TRUE if any argument is TRUE.",
	PI: "|The value of pi.",
	POWER: "number, power|A number raised to a power.",
	PRODUCT: "number1, [number2], ...|Multiplies all the arguments.",
	PROPER: "text|Capitalizes the first letter of each word.",
	RAND: "|Random number between 0 and 1.",
	RANDBETWEEN: "bottom, top|Random integer between two numbers.",
	RANK: "number, ref, [order]|Rank of a number in a list.",
	"RANK.EQ": "number, ref, [order]|Rank of a number in a list.",
	REPLACE: "old_text, start_num, num_chars, new_text|Replaces part of a text by position.",
	REPT: "text, number_times|Repeats a text a number of times.",
	RIGHT: "text, [num_chars]|Last characters of a text.",
	ROUND: "number, num_digits|Rounds a number to a number of digits.",
	ROUNDDOWN: "number, num_digits|Rounds a number down, toward zero.",
	ROUNDUP: "number, num_digits|Rounds a number up, away from zero.",
	ROW: "[reference]|Row number of a reference.",
	ROWS: "array|Number of rows in a reference.",
	SEARCH: "find_text, within_text, [start_num]|Position of a text inside another (not case-sensitive).",
	SECOND: "serial_number|Second of a time value (0-59).",
	SIGN: "number|Sign of a number: 1, 0 or -1.",
	SMALL: "array, k|k-th smallest value in a data set.",
	SQRT: "number|Square root.",
	STDEV: "number1, [number2], ...|Standard deviation of a sample.",
	"STDEV.P": "number1, [number2], ...|Standard deviation of a population.",
	"STDEV.S": "number1, [number2], ...|Standard deviation of a sample.",
	STDEVP: "number1, [number2], ...|Standard deviation of a population.",
	SUBSTITUTE: "text, old_text, new_text, [instance_num]|Replaces existing text with new text.",
	SUM: "number1, [number2], ...|Adds all the numbers.",
	SUMIF: "range, criteria, [sum_range]|Adds the cells that meet a condition.",
	SUMIFS: "sum_range, criteria_range1, criteria1, ...|Adds the cells that meet multiple conditions.",
	SUMPRODUCT: "array1, [array2], ...|Sum of the products of corresponding items.",
	SWITCH: "expression, value1, result1, [default_or_value2], ...|Matches an expression against a list of values.",
	T: "value|Text of a value, or empty text.",
	TEXT: "value, format_text|Formats a number as text.",
	TEXTJOIN: "delimiter, ignore_empty, text1, ...|Joins texts with a delimiter.",
	TIME: "hour, minute, second|Time value from hour, minute and second.",
	TODAY: "|Current date.",
	TRIM: "text|Removes extra spaces from text.",
	TRUE: "|The logical value TRUE.",
	TRUNC: "number, [num_digits]|Truncates a number to an integer or number of digits.",
	UPPER: "text|Converts text to uppercase.",
	VALUE: "text|Converts text to a number.",
	VAR: "number1, [number2], ...|Variance of a sample.",
	"VAR.P": "number1, [number2], ...|Variance of a population.",
	"VAR.S": "number1, [number2], ...|Variance of a sample.",
	VARP: "number1, [number2], ...|Variance of a population.",
	VLOOKUP: "lookup_value, table_array, col_index_num, [range_lookup]|Looks up a value in the first column and returns a value from the same row.",
	WEEKDAY: "serial_number, [return_type]|Day of the week of a date.",
	XLOOKUP: "lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode]|Searches a range and returns the matching item from another range.",
	XOR: "logical1, [logical2], ...|TRUE if an odd number of arguments are TRUE.",
	YEAR: "serial_number|Year of a date."
}, et = null;
function tt() {
	return et ||= Object.keys($e).sort().map((e) => {
		let [t, n] = $e[e].split("|"), r = t ? t.split(", ") : [], i = r[r.length - 1] === "...";
		return {
			name: e,
			args: i ? r.slice(0, -1) : r,
			variadic: i,
			desc: n
		};
	}), et;
}
function nt(e) {
	let t = e.toUpperCase();
	return tt().find((e) => e.name === t);
}
function rt(e, t = 10) {
	let n = e.toUpperCase();
	return n ? tt().filter((e) => e.name.startsWith(n)).slice(0, t) : [];
}
function it(e, t) {
	if (t < e.args.length) return t;
	if (!e.variadic) return -1;
	let n = e.args.length, r = /1$/.test(e.args[n - 1] ?? "") && /1$/.test(e.args[n - 2] ?? "") ? 2 : 1, i = n - r;
	return i + (t - i) % r;
}
// src/react/common/hooks.ts
var at = typeof window > "u" ? B : Be, ot = "(prefers-color-scheme: dark)", st = () => typeof matchMedia == "function" && matchMedia(ot).matches;
function K(e = "light") {
	let [t, n] = H(() => e === "auto" && st());
	return B(() => {
		if (e !== "auto" || typeof matchMedia != "function") return;
		let t = matchMedia(ot), r = () => n(t.matches);
		return r(), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, [e]), e === "dark" || e === "auto" && t;
}
function ct() {
	let [e, t] = He((e) => e + 1, 0);
	return [e, t];
}
function lt() {
	let e = V(null), [t, n] = H({
		w: 0,
		h: 0
	});
	return at(() => {
		let t = e.current;
		if (!t) return;
		let r = () => {
			let e = t.clientWidth, r = t.clientHeight;
			n((t) => t.w === e && t.h === r ? t : {
				w: e,
				h: r
			});
		};
		r();
		let i = new ResizeObserver(r);
		return i.observe(t), () => i.disconnect();
	}, []), [e, t];
}
function ut(e) {
	let [t, n] = H({
		x: 0,
		y: 0
	}), [r, i] = H(null);
	return at(() => {
		e.current !== r && i(e.current);
	}), B(() => {
		if (!r) return;
		let e = 0, t = () => n((e) => e.x === r.scrollLeft && e.y === r.scrollTop ? e : {
			x: r.scrollLeft,
			y: r.scrollTop
		}), i = () => {
			e ||= requestAnimationFrame(() => {
				e = 0, t();
			});
		};
		return t(), r.addEventListener("scroll", i, { passive: !0 }), () => {
			r.removeEventListener("scroll", i), cancelAnimationFrame(e);
		};
	}, [r]), t;
}
function dt(e, t, n = !0) {
	let [r, i] = H(null);
	return B(() => {
		if (!t || !n) return;
		if (!te(t)) {
			i("unsupported");
			return;
		}
		let r = !0;
		return e.mediaUrl(t).then((e) => r && i(e), () => r && i("unsupported")), () => {
			r = !1;
		};
	}, [
		e,
		t,
		n
	]), r;
}
function ft(e, t) {
	let n = 0, r = e.length - 1, i = 0;
	for (; n <= r;) {
		let a = n + r >> 1;
		e[a] <= t ? (i = a, n = a + 1) : r = a - 1;
	}
	return i;
}
function pt(e) {
	let t = e;
	if (!t || t.nodeType !== 1) return !1;
	let n = t.tagName;
	return n === "TEXTAREA" || n === "SELECT" ? !0 : n === "INPUT" ? !/^(button|checkbox|radio|submit|reset|range|color|file|image)$/i.test(t.type) : !!t.isContentEditable;
}
function mt(e) {
	if (!e) return !1;
	let t = e.ownerDocument, n = t.activeElement, r = e.getRootNode(), i = typeof ShadowRoot < "u" && r instanceof ShadowRoot ? r.host : null, a = e.closest(".de-root") ?? e;
	return n && n !== t.body && n !== i && !a.contains(n) ? !1 : (e.focus({ preventScroll: !0 }), !0);
}
// src/react/edit/Toolbar.tsx
var ht = /* @__PURE__ */ W("path", {
	d: "M4 4h16v16H4zM12 4v16M4 12h16",
	strokeDasharray: "1.2 2.6",
	opacity: .5,
	strokeWidth: 1.4
}), gt = {
	undo: /* @__PURE__ */ W("path", { d: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" }),
	redo: /* @__PURE__ */ W("path", { d: "m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" }),
	bold: /* @__PURE__ */ W("path", {
		d: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
		strokeWidth: 2.4
	}),
	italic: /* @__PURE__ */ W("path", {
		d: "M14 5h-4m4 14h-4m3-14-2 14",
		strokeWidth: 2.2
	}),
	underline: /* @__PURE__ */ W("path", { d: "M7 4v7a5 5 0 0 0 10 0V4M5 20h14" }),
	strike: /* @__PURE__ */ W("path", { d: "M16 6.5C15.3 5 13.8 4 12 4c-2.5 0-4 1.3-4 3 0 4 8 2.5 8 7 0 2-1.8 3.5-4.2 3.5-2 0-3.6-1-4.3-2.5M4 12h16" }),
	color: /* @__PURE__ */ W("path", { d: "m6 16 6-12 6 12M8.3 11.5h7.4" }),
	highlight: /* @__PURE__ */ W("path", { d: "m9 11-5 5v3h3l5-5M14.5 5.5l4 4L12 16l-4-4zM15 4l5 5" }),
	fill: /* @__PURE__ */ W("path", { d: "m19 11-8-8-8.5 8.5a2 2 0 0 0 0 2.8l5.7 5.7a2 2 0 0 0 2.8 0zM5 2l5 5M21 15s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4" }),
	alignLeft: /* @__PURE__ */ W("path", { d: "M4 6h16M4 10h10M4 14h16M4 18h10" }),
	alignCenter: /* @__PURE__ */ W("path", { d: "M4 6h16M7 10h10M4 14h16M7 18h10" }),
	alignRight: /* @__PURE__ */ W("path", { d: "M4 6h16M10 10h10M4 14h16M10 18h10" }),
	justify: /* @__PURE__ */ W("path", { d: "M4 6h16M4 10h16M4 14h16M4 18h16" }),
	bullets: /* @__PURE__ */ W("path", {
		d: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
		strokeWidth: 2.2
	}),
	numbers: /* @__PURE__ */ W("path", { d: "M10 6h10M10 12h10M10 18h10M4 4.5h1.5v4M4 8.5h3M4 14.5c0-1 2.5-1.2 2.5.3 0 1.2-2.5 1.8-2.5 3.2h2.8" }),
	indent: /* @__PURE__ */ W("path", { d: "M4 5h16M11 10h9M11 14h9M4 19h16M4 9l3 3-3 3" }),
	outdent: /* @__PURE__ */ W("path", { d: "M4 5h16M11 10h9M11 14h9M4 19h16M7 9l-3 3 3 3" }),
	clear: /* @__PURE__ */ W("path", { d: "M5 5h10M10 5l-3 14M14 14l5 5m0-5-5 5" }),
	search: /* @__PURE__ */ W("path", { d: "m20 20-4.2-4.2M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" }),
	save: /* @__PURE__ */ W("path", { d: "M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19h14" }),
	wrap: /* @__PURE__ */ W("path", { d: "M4 6h16M4 12h13a3 3 0 0 1 0 6h-4m2-2-2 2 2 2M4 18h5" }),
	edit: /* @__PURE__ */ W("path", { d: "m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" }),
	view: /* @__PURE__ */ W("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12m10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6" }),
	close: /* @__PURE__ */ W("path", { d: "M6 6l12 12M18 6 6 18" }),
	image: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01" }),
	chart: /* @__PURE__ */ W("path", { d: "M4 20h16M7 20v-8M12 20V5M17 20v-5" }),
	table: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14" }),
	link: /* @__PURE__ */ W("path", { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" }),
	headerFooter: /* @__PURE__ */ W("path", {
		d: "M6 3h12v18H6zM8 6h8M8 18h8M12 16.5v3",
		strokeDasharray: "0"
	}),
	track: /* @__PURE__ */ W("path", { d: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4M14 20h6" }),
	review: /* @__PURE__ */ W("path", { d: "M4 5h16v11H9l-5 4zM8 10l2 2 4-4" }),
	pageSetup: /* @__PURE__ */ W("path", { d: "M6 3h12v18H6zM6 7h12M10 3v18M13 11h3M13 14h3M13 17h2" }),
	pagebreak: /* @__PURE__ */ W("path", { d: "M5 4v5h14V4M5 20v-5h14v5M3 12h2m3 0h2m3 0h2m3 0h3" }),
	sup: /* @__PURE__ */ W("path", { d: "m4 8 8 10m0-10L4 18M16 4h4l-4 5h4" }),
	sub: /* @__PURE__ */ W("path", { d: "m4 6 8 10m0-10L4 16M16 15h4l-4 5h4" }),
	lineSpacing: /* @__PURE__ */ W("path", { d: "M10 6h10M10 12h10M10 18h10M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2" }),
	plus: /* @__PURE__ */ W("path", { d: "M12 5v14M5 12h14" }),
	minus: /* @__PURE__ */ W("path", { d: "M5 12h14" }),
	fit: /* @__PURE__ */ W("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" }),
	shape: /* @__PURE__ */ W("path", { d: "M4 4h9v9H4zM17 11a4 4 0 1 1 0 8 4 4 0 0 1 0-8" }),
	textbox: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM8 9h8M12 9v7" }),
	slideAdd: /* @__PURE__ */ W("path", { d: "M3 6h14v12H3zM20 8v6M17 11h6" }),
	copy: /* @__PURE__ */ W("path", { d: "M8 8h12v12H8zM4 16V4h12" }),
	trash: /* @__PURE__ */ W("path", { d: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" }),
	play: /* @__PURE__ */ W("path", { d: "M7 4l13 8-13 8z" }),
	front: /* @__PURE__ */ W("path", { d: "M8 8h12v12H8zM4 4h10v3M4 4v10h3" }),
	back: /* @__PURE__ */ W("path", { d: "M4 4h12v12H4zM20 8v12H8v-3" }),
	merge: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM9 12H4m16 0h-5m-6-3 3 3-3 3m6-6-3 3 3 3" }),
	borders: /* @__PURE__ */ W("path", {
		d: "M4 4h16v16H4zM12 4v16M4 12h16",
		strokeDasharray: "2 2"
	}),
	freeze: /* @__PURE__ */ W("path", { d: "M4 4h16v16H4zM4 9h16M9 4v16" }),
	sum: /* @__PURE__ */ W("path", { d: "M17 5H7l6 7-6 7h10" }),
	rowAdd: /* @__PURE__ */ W("path", { d: "M4 4h16v6H4zM12 14v6M9 17h6" }),
	colAdd: /* @__PURE__ */ W("path", { d: "M4 4h6v16H4zM14 12h6M17 9v6" }),
	sort: /* @__PURE__ */ W("path", { d: "M7 4v16M4 17l3 3 3-3M14 6h6M14 12h4M14 18h2" }),
	up: /* @__PURE__ */ W("path", { d: "m6 15 6-6 6 6" }),
	down: /* @__PURE__ */ W("path", { d: "m6 9 6 6 6-6" }),
	chevron: /* @__PURE__ */ W("path", { d: "m7 10 5 5 5-5" }),
	lineWeight: /* @__PURE__ */ G(We, { children: [
		/* @__PURE__ */ W("path", {
			d: "M4 6h16",
			strokeWidth: 1
		}),
		/* @__PURE__ */ W("path", {
			d: "M4 11h16",
			strokeWidth: 2.2
		}),
		/* @__PURE__ */ W("path", {
			d: "M4 17.5h16",
			strokeWidth: 3.6
		})
	] }),
	rotate: /* @__PURE__ */ W("path", { d: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" }),
	rotateCcw: /* @__PURE__ */ W("path", { d: "M4 11a8 8 0 1 1 2.3 5.7M4 4v7h7" }),
	flipH: /* @__PURE__ */ W("path", { d: "M12 3v18M9 7 4 17h5zM15 7l5 10h-5z" }),
	flipV: /* @__PURE__ */ W("path", { d: "M3 12h18M7 9 17 4v5zM7 15l10 5v-5z" }),
	alignObj: /* @__PURE__ */ W("path", { d: "M4 3v18M8 7h12v4H8zM8 14h7v4H8z" }),
	currency: /* @__PURE__ */ W("path", { d: "M12 3v18M16.5 7.5C16 5.9 14.3 5 12 5c-2.6 0-4.5 1.3-4.5 3.3 0 4.7 9 2.6 9 7.4 0 2-1.9 3.3-4.5 3.3-2.4 0-4.2-1-4.7-2.8" }),
	vTop: /* @__PURE__ */ W("path", { d: "M5 4h14M12 20V8M8.5 11.5 12 8l3.5 3.5" }),
	vMiddle: /* @__PURE__ */ W("path", { d: "M5 12h14M12 3v6M9.5 6.5 12 9l2.5-2.5M12 21v-6M9.5 17.5 12 15l2.5 2.5" }),
	vBottom: /* @__PURE__ */ W("path", { d: "M5 20h14M12 4v12M8.5 12.5 12 16l3.5-3.5" }),
	rotNone: /* @__PURE__ */ W("path", { d: "M5 17h14M7 14l3-8 3 8M8 11.5h4" }),
	rotUp: /* @__PURE__ */ W("path", { d: "M5 19h14M6 15l9.5-9.5M9 6.5l4.5 7.5M8 10l4-.5" }),
	rotDown: /* @__PURE__ */ W("path", { d: "M5 5h14M6 9l9.5 9.5M9 17.5l4.5-7.5M8 14l4 .5" }),
	rotStack: /* @__PURE__ */ W("path", {
		d: "M9 4l2 5 2-5M9.6 6.5h2.8M9 11h4M11 11v4M9 15h4M9 17h3a1.5 1.5 0 0 1 0 3H9z",
		strokeWidth: 1.5
	}),
	rotUp90: /* @__PURE__ */ W("path", { d: "M19 5v14M15 18l-8-3 8-3M12.5 13v4M7 7l2-2 2 2M9 5v6" }),
	rotDown90: /* @__PURE__ */ W("path", { d: "M19 5v14M7 6l8 3-8 3M9.5 11V7M13 17l-2 2-2-2M11 19v-6" }),
	sortAZ: /* @__PURE__ */ W("path", { d: "M7 4v16M4 17l3 3 3-3M13 11l2.5-7 2.5 7M13.7 9h3.6M13 14h5l-5 6h5" }),
	sortZA: /* @__PURE__ */ W("path", { d: "M7 4v16M4 17l3 3 3-3M13 4h5l-5 6h5M13 20l2.5-7 2.5 7M13.7 18h3.6" }),
	gridlines: /* @__PURE__ */ W("path", { d: "M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16" }),
	lineStyle: /* @__PURE__ */ W("path", {
		d: "M4 6h16M4 12h16M4 18h3M10 18h4M17 18h3",
		strokeWidth: 2
	}),
	paint: /* @__PURE__ */ W("path", { d: "M5 4h11v5H5zM16 6.5h3v5l-7 1.5v3M11 16h2v5h-2z" }),
	styleMatch: /* @__PURE__ */ W("path", { d: "m3 18 4.5-12L12 18M4.7 14h5.6M21 9.5a4 4 0 0 0-7-1.8M14 5v3h3M14 14.5a4 4 0 0 0 7 1.8M21 19v-3h-3" }),
	omega: /* @__PURE__ */ W("path", { d: "M5 19h4v-2.5A6.5 6.5 0 1 1 15 16.5V19h4" }),
	outline: /* @__PURE__ */ W("path", {
		d: "M4 6h.01M4 12h.01M4 18h.01M8 6h12M11 12h9M11 18h9",
		strokeWidth: 2
	}),
	imgOrig: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM8 15V9l-1.5 1.5M12 10h.01M12 14h.01M16.5 15V9L15 10.5" }),
	imgReplace: /* @__PURE__ */ W("path", { d: "M4 5h10v8H4zM4 11l3-3 3 3 2-2 2 2M14 19h6v-6M20 19l-5-5M7 16v3h4" }),
	alt: /* @__PURE__ */ W("path", { d: "M4 5h16v14H4zM7.5 15l2.5-6 2.5 6M8.3 13h3.4M15 9v6h2.5" }),
	cut: /* @__PURE__ */ W("path", { d: "M6 6a2.5 2.5 0 1 0 0 .01M6 18a2.5 2.5 0 1 0 0 .01M8 7.5 19 18M8 16.5 19 6" }),
	paste: /* @__PURE__ */ W("path", { d: "M9 4h6v3H9zM15 5h3v15H6V5h3" }),
	pastePlain: /* @__PURE__ */ W("path", { d: "M9 4h6v3H9zM15 5h3v15H6V5h3M9 11h6M12 11v6" }),
	external: /* @__PURE__ */ W("path", { d: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" }),
	unlink: /* @__PURE__ */ W("path", { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M3 3l18 18" }),
	selectAll: /* @__PURE__ */ W("path", { d: "M4 4h3M10 4h4M17 4h3v3M20 10v4M20 17v3h-3M14 20h-4M7 20H4v-3M4 14v-4M4 7V4M8 8h8v8H8z" }),
	hideShow: /* @__PURE__ */ W("path", { d: "M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.8M6.6 7.6C3.8 9.3 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1" }),
	percent: /* @__PURE__ */ W("path", { d: "M19 5 5 19M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M16.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4" }),
	decLess: /* @__PURE__ */ W("path", {
		d: "M3.5 16h.01M8 9.5a2.5 3.5 0 1 1 0 7 2.5 3.5 0 0 1 0-7M21 19h-7m0 0 2-2m-2 2 2 2",
		strokeWidth: 1.7
	}),
	decMore: /* @__PURE__ */ W("path", {
		d: "M3.5 16h.01M8 9.5a2.5 3.5 0 1 1 0 7 2.5 3.5 0 0 1 0-7M14.5 9.5a2 3 0 1 1 0 6 2 3 0 0 1 0-6M13 19h8m0 0-2-2m2 2-2 2",
		strokeWidth: 1.7
	}),
	check: /* @__PURE__ */ W("path", {
		d: "m5 12.5 4.5 4.5L19 7.5",
		strokeWidth: 2.2
	}),
	more: /* @__PURE__ */ W("path", {
		d: "M12 5.5h.01M12 12h.01M12 18.5h.01",
		strokeWidth: 3.2
	}),
	bAll: /* @__PURE__ */ W("path", { d: "M4 4h16v16H4zM12 4v16M4 12h16" }),
	bOuter: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", { d: "M4 4h16v16H4z" })] }),
	bInner: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", { d: "M12 4v16M4 12h16" })] }),
	bTop: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", {
		d: "M4 4h16",
		strokeWidth: 2.2
	})] }),
	bBottom: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", {
		d: "M4 20h16",
		strokeWidth: 2.2
	})] }),
	bLeft: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", {
		d: "M4 4v16",
		strokeWidth: 2.2
	})] }),
	bRight: /* @__PURE__ */ G(We, { children: [ht, /* @__PURE__ */ W("path", {
		d: "M20 4v16",
		strokeWidth: 2.2
	})] }),
	bNone: ht,
	rect: /* @__PURE__ */ W("path", { d: "M4 6h16v12H4z" }),
	roundRect: /* @__PURE__ */ W("path", { d: "M8 6h8a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4" }),
	ellipse: /* @__PURE__ */ W("path", { d: "M12 6c4.4 0 8 2.7 8 6s-3.6 6-8 6-8-2.7-8-6 3.6-6 8-6" }),
	triangle: /* @__PURE__ */ W("path", { d: "M12 5l8 14H4z" }),
	arrow: /* @__PURE__ */ W("path", { d: "M4 10h9V6l7 6-7 6v-4H4z" }),
	star: /* @__PURE__ */ W("path", { d: "m12 4 2.4 5 5.6.7-4.1 3.8 1.1 5.5-5-2.8-5 2.8 1.1-5.5L4 9.7 9.6 9z" }),
	line: /* @__PURE__ */ W("path", { d: "M5 19 19 5" }),
	rowAbove: /* @__PURE__ */ W("path", { d: "M4 12h16v8H4zM12 3v6M9 6h6" }),
	rowBelow: /* @__PURE__ */ W("path", { d: "M4 4h16v8H4zM12 15v6M9 18h6" }),
	colLeft: /* @__PURE__ */ W("path", { d: "M12 4h8v16h-8zM3 12h6M6 9v6" }),
	colRight: /* @__PURE__ */ W("path", { d: "M4 4h8v16H4zM15 12h6M18 9v6" }),
	delRow: /* @__PURE__ */ W("path", { d: "M4 8h16v8H4zM9 10.5l6 3m0-3-6 3" }),
	delCol: /* @__PURE__ */ W("path", { d: "M8 4h8v16H8zM10.5 9l3 6m0-6-3 6" }),
	hide: /* @__PURE__ */ W("path", { d: "M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.8M6.6 7.6C3.8 9.3 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2" }),
	file: /* @__PURE__ */ W("path", { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" }),
	open: /* @__PURE__ */ W("path", { d: "M4 19V6a1 1 0 0 1 1-1h4l2 2h7a1 1 0 0 1 1 1v2M4 19l2.6-7.2a1 1 0 0 1 .9-.8H20a1 1 0 0 1 1 1.3L18.6 19z" }),
	print: /* @__PURE__ */ W("path", { d: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" }),
	pdf: /* @__PURE__ */ W("path", {
		d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M8.5 16.5v-4h1.2a1.2 1.2 0 0 1 0 2.4H8.5M13 12.5v4h.8a1.6 1.6 0 0 0 1.6-1.6v-.8a1.6 1.6 0 0 0-1.6-1.6z",
		strokeWidth: 1.5
	}),
	html: /* @__PURE__ */ W("path", { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M10 12l-2 2.5 2 2.5M14 12l2 2.5-2 2.5" }),
	code: /* @__PURE__ */ W("path", { d: "m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" }),
	doc: /* @__PURE__ */ W("path", { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" }),
	slides: /* @__PURE__ */ W("path", { d: "M4 5h16v11H4zM12 16v4M8 20h8" }),
	info: /* @__PURE__ */ W("path", { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01" }),
	comment: /* @__PURE__ */ W("path", { d: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" }),
	commentAdd: /* @__PURE__ */ W("path", { d: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 8v5M9.5 10.5h5" }),
	zoomIn: /* @__PURE__ */ W("path", { d: "M12 5v14M5 12h14" }),
	zoomOut: /* @__PURE__ */ W("path", { d: "M5 12h14" }),
	present: /* @__PURE__ */ W("path", { d: "M7 4l13 8-13 8z" }),
	sheetAdd: /* @__PURE__ */ W("path", { d: "M12 5v14M5 12h14" }),
	replace: /* @__PURE__ */ W("path", { d: "M4 8h15l-3.5-3.5M20 16H5l3.5 3.5" })
}, _t = Object.keys(gt), q = Pe(null);
function vt(e, t, n) {
	if (!e) return;
	let r = typeof e == "function" ? e(t, { size: n }) : e[t];
	return r === null || r === !1 ? void 0 : r;
}
function yt({ icons: e, children: t }) {
	let n = Le(q), r = Ve(() => e ? (t, r) => vt(e, t, r) ?? n?.(t, r) : n, [e, n]);
	return /* @__PURE__ */ W(q.Provider, {
		value: r,
		children: t
	});
}
function J({ name: e, size: t = 18 }) {
	let n = Le(q)?.(e, t);
	return n === void 0 ? /* @__PURE__ */ W("svg", {
		width: t,
		height: t,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.8,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": !0,
		children: gt[e]
	}) : /* @__PURE__ */ W("span", {
		className: "de-icon",
		style: {
			fontSize: t,
			width: t,
			height: t
		},
		"aria-hidden": !0,
		children: n
	});
}
var bt = (e) => e.preventDefault();
function xt(e) {
	let t = V(null), [n, r] = H(0);
	return Be(() => {
		let e = t.current;
		if (!e) return;
		let n = e.getBoundingClientRect(), i = document.documentElement.clientWidth;
		n.right > i - 8 ? r(-Math.min(n.left - 8, n.right - i + 8)) : n.left < 8 && r(8 - n.left);
	}, []), /* @__PURE__ */ W("div", {
		ref: t,
		className: e.className ?? "de-tb-pop",
		style: n ? { transform: `translateX(${n}px)` } : void 0,
		onMouseDown: e.onMouseDown,
		children: e.children
	});
}
function St(e, t, n) {
	let r = V(n);
	r.current = n, B(() => {
		if (!t) return;
		let n = (t) => {
			let n = e.current;
			n && !t.composedPath().includes(n) && r.current();
		};
		return window.addEventListener("mousedown", n, !0), () => window.removeEventListener("mousedown", n, !0);
	}, [t, e]);
}
function Y(e) {
	return /* @__PURE__ */ W("button", {
		type: "button",
		className: e.active ? "de-tb de-tb-on" : "de-tb",
		title: e.title,
		"aria-label": e.title,
		"aria-pressed": e.active,
		disabled: e.disabled,
		onMouseDown: bt,
		onClick: e.onClick,
		style: e.wide ? {
			width: "auto",
			padding: "0 8px"
		} : void 0,
		children: e.icon ? /* @__PURE__ */ W(J, { name: e.icon }) : e.label
	});
}
var X = () => /* @__PURE__ */ W("span", { className: "de-tb-sep" });
function Z(e) {
	let { options: t } = e, [n, r] = H(!1), [i, a] = H(-1), [o, s] = H(0), c = V(null), l = V(null), u = V({
		text: "",
		at: 0
	}), d = e.value !== void 0, f = d ? t.findIndex((t) => t.value === e.value) : -1, p = f >= 0 ? t[f] : void 0;
	St(c, n, () => r(!1));
	let m = (t) => {
		t && !t.disabled && (r(!1), e.onChange(t.value));
	}, h = () => {
		a(f >= 0 ? f : t.findIndex((e) => !e.disabled)), s(0), r(!0);
	};
	B(() => {
		if (!n) return;
		let e = (e) => {
			let n = t.length, o = (e, r) => {
				let i = e;
				for (let e = 0; e < n; e++) if (i = (i + r + n) % n, !t[i].disabled) return i;
				return e;
			};
			if (e.key === "ArrowDown") a((e) => o(e, 1));
			else if (e.key === "ArrowUp") a((e) => o(e < 0 ? 0 : e, -1));
			else if (e.key === "Home") a(o(-1, 1));
			else if (e.key === "End") a(o(0, -1));
			else if (e.key === "Enter" || e.key === " " && !u.current.text) m(t[i]);
			else if (e.key === "Escape") r(!1);
			else if (e.key === "Tab") return r(!1);
			else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
				let n = u.current;
				n.text = (Date.now() - n.at < 700 ? n.text : "") + e.key.toLowerCase(), n.at = Date.now();
				let r = t.findIndex((e) => !e.disabled && e.label.toLowerCase().startsWith(n.text));
				r >= 0 && a(r);
			} else return;
			e.preventDefault(), e.stopPropagation();
		};
		return window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0);
	}, [
		n,
		i,
		t
	]), Be(() => {
		let e = l.current;
		if (!n || !e) return;
		let t = e.getBoundingClientRect(), r = document.documentElement.clientWidth;
		t.right > r - 8 ? s((e) => e - (t.right - r + 8)) : t.left < 8 && s((e) => e + (8 - t.left));
		let i = e.closest(".de-root"), a = Math.min(document.documentElement.clientHeight, i ? i.getBoundingClientRect().bottom : Infinity), o = parseFloat(getComputedStyle(e).maxHeight), c = a - t.top - 8;
		c > 0 && (e.style.maxHeight = `${Math.max(120, Math.min(Number.isFinite(o) ? o : c, c))}px`);
	}, [n]), Be(() => {
		n && l.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
	}, [n, i]);
	let g = e.label === void 0 ? p?.label ?? e.placeholder ?? "" : e.label;
	return /* @__PURE__ */ G("span", {
		ref: c,
		className: "de-dd-wrap",
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			className: (n ? "de-dd de-dd-open" : "de-dd") + (e.className ? " " + e.className : ""),
			style: { width: e.width },
			title: e.title,
			"aria-label": e.title,
			"aria-haspopup": "listbox",
			"aria-expanded": n,
			disabled: e.disabled,
			onMouseDown: bt,
			onClick: () => n ? r(!1) : h(),
			onKeyDown: (e) => {
				n || e.key !== "ArrowDown" && e.key !== "Enter" && e.key !== " " || (e.preventDefault(), h());
			},
			children: [
				e.icon && /* @__PURE__ */ W(J, { name: e.icon }),
				g !== null && /* @__PURE__ */ W("span", {
					className: p || e.label !== void 0 ? "de-dd-label" : "de-dd-label de-dd-ph",
					children: g
				}),
				/* @__PURE__ */ W(J, {
					name: "chevron",
					size: 14
				})
			]
		}), n && /* @__PURE__ */ W("div", {
			ref: l,
			className: "de-dd-pop",
			role: "listbox",
			"aria-label": e.title,
			style: {
				minWidth: e.menuWidth,
				...e.alignRight ? { right: -o } : { left: o }
			},
			onMouseDown: bt,
			children: t.map((e, t) => /* @__PURE__ */ G(Ne, { children: [
				e.sep && t > 0 && /* @__PURE__ */ W("div", {
					className: "de-dd-sep",
					role: "separator"
				}),
				e.head && /* @__PURE__ */ W("div", {
					className: "de-dd-head",
					role: "presentation",
					children: e.head
				}),
				/* @__PURE__ */ G("div", {
					"data-i": t,
					role: "option",
					"aria-selected": t === f,
					"aria-disabled": e.disabled || void 0,
					className: "de-dd-opt" + (t === i ? " de-dd-hi" : "") + (e.disabled ? " de-dd-dis" : ""),
					onMouseMove: () => t !== i && !e.disabled && a(t),
					onClick: () => m(e),
					children: [
						d && /* @__PURE__ */ W("span", {
							className: "de-dd-check",
							children: t === f && /* @__PURE__ */ W(J, {
								name: "check",
								size: 16
							})
						}),
						e.icon && /* @__PURE__ */ W(J, { name: e.icon }),
						/* @__PURE__ */ W("span", {
							className: "de-dd-text",
							style: e.style,
							children: e.label
						}),
						e.hint && /* @__PURE__ */ W("span", {
							className: "de-dd-hint",
							children: e.hint
						})
					]
				})
			] }, String(e.value)))
		})]
	});
}
function Ct(e) {
	return /* @__PURE__ */ W(Z, { ...e });
}
function wt(e) {
	let t = e.sizes ?? zt, [n, r] = H(null), [i, a] = H(!1), o = V(null), s = V(null);
	St(o, i, () => a(!1));
	let c = e.value ?? e.placeholder ?? 11, l = (t) => {
		r(null), a(!1), Number.isFinite(t) && t >= 1 && t <= 400 && e.onChange(Math.round(t * 2) / 2);
	}, u = () => {
		n !== null && l(parseFloat(n)), s.current?.blur();
	}, d = e.title ?? "Font size";
	return /* @__PURE__ */ G("span", {
		ref: o,
		className: "de-size",
		children: [
			/* @__PURE__ */ W("button", {
				type: "button",
				className: "de-tb de-size-step",
				title: "Decrease font size",
				"aria-label": "Decrease font size",
				disabled: e.disabled,
				onMouseDown: bt,
				onClick: () => l(Math.max(1, Math.ceil(c) - 1)),
				children: /* @__PURE__ */ W(J, {
					name: "minus",
					size: 16
				})
			}),
			/* @__PURE__ */ W("input", {
				ref: s,
				className: "de-size-input",
				title: d,
				"aria-label": d,
				inputMode: "decimal",
				disabled: e.disabled,
				value: n ?? (e.value === void 0 ? "" : String(e.value)),
				placeholder: e.placeholder === void 0 ? "" : String(e.placeholder),
				onFocus: (e) => {
					e.currentTarget.select(), a(!0);
				},
				onChange: (e) => r(e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "").replace(/^(\d*\.\d*)\..*$/, "$1")),
				onKeyDown: (e) => {
					if (e.key === "Enter") e.preventDefault(), u();
					else if (e.key === "Escape") e.preventDefault(), r(null), a(!1), s.current?.blur();
					else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
						e.preventDefault();
						let i = parseFloat(n ?? String(c)), a = e.key === "ArrowUp" ? t.find((e) => e > i) : [...t].reverse().find((e) => e < i);
						a !== void 0 && r(String(a));
					}
				},
				onBlur: () => {
					n !== null && l(parseFloat(n)), a(!1);
				}
			}),
			/* @__PURE__ */ W("button", {
				type: "button",
				className: "de-tb de-size-step",
				title: "Increase font size",
				"aria-label": "Increase font size",
				disabled: e.disabled,
				onMouseDown: bt,
				onClick: () => l(Math.floor(c) + 1),
				children: /* @__PURE__ */ W(J, {
					name: "plus",
					size: 16
				})
			}),
			i && /* @__PURE__ */ W("div", {
				className: "de-dd-pop de-size-pop",
				role: "listbox",
				"aria-label": d,
				onMouseDown: bt,
				children: t.map((t) => /* @__PURE__ */ W("div", {
					role: "option",
					"aria-selected": t === e.value,
					className: "de-dd-opt" + (String(t) === (n ?? String(e.value)) ? " de-dd-hi" : ""),
					onClick: () => l(t),
					children: t
				}, t))
			})
		]
	});
}
function Tt(e) {
	let t = [];
	return Me.forEach(e, (e) => {
		Fe(e) && (e.type === Ne ? t.push(...Tt(e.props.children)) : t.push(e));
	}), t;
}
var Et = (e) => {
	let t = e.props;
	return `${typeof e.type == "string" ? e.type : e.type.name}:${t.title ?? t.icon ?? (typeof t.label == "string" ? t.label : "")}`;
};
function Dt({ children: e }) {
	let t = Tt(e), n = t.map(Et).join("|"), r = V(null), i = V([]), [a, o] = H({
		sig: "",
		cut: t.length,
		w: 0
	}), [s, c] = H(!1), l = V(null);
	St(l, s, () => c(!1));
	let u = a.sig === n, d = u ? a.cut : t.length, f = (e) => {
		let r = i.current, a = r.reduce((e, t) => e + t + 2, 0), s = t.length;
		if (a > e) {
			let n = e - 34, i = 0;
			for (s = 0; s < t.length && i + r[s] + 2 <= n;) i += r[s++] + 2;
		}
		o((t) => t.sig === n && t.cut === s && t.w === e ? t : {
			sig: n,
			cut: s,
			w: e
		});
	}, p = () => {
		let e = r.current;
		if (!e) return 0;
		let t = getComputedStyle(e);
		return e.clientWidth - parseFloat(t.paddingLeft) - parseFloat(t.paddingRight);
	};
	Be(() => {
		let e = r.current;
		e && !u && (i.current = [...e.querySelectorAll(":scope > [data-i]")].map((e) => e.getBoundingClientRect().width), f(p()));
	});
	let m = V(() => {});
	m.current = () => {
		i.current.length === t.length && f(p());
	}, B(() => {
		let e = r.current;
		if (!e) return;
		let t = new ResizeObserver(() => m.current());
		return t.observe(e), () => t.disconnect();
	}, []);
	let h = (e) => !!e && e.type === X, g = d;
	for (; g > 0 && h(t[g - 1]) && g < t.length;) g--;
	let _ = t.slice(d).filter((e, t, n) => !h(e) || t !== 0 && t !== n.length - 1);
	return /* @__PURE__ */ G("div", {
		ref: r,
		className: "de-ebar",
		role: "toolbar",
		children: [t.slice(0, g).map((e, t) => /* @__PURE__ */ W("span", {
			"data-i": t,
			className: "de-ebar-it",
			children: e
		}, t)), _.length > 0 && /* @__PURE__ */ G("span", {
			ref: l,
			className: "de-tb-color de-ebar-morewrap",
			children: [/* @__PURE__ */ W("button", {
				type: "button",
				className: s ? "de-tb de-tb-on" : "de-tb",
				title: "More",
				"aria-label": "More tools",
				"aria-expanded": s,
				onMouseDown: bt,
				onClick: () => c((e) => !e),
				children: /* @__PURE__ */ W(J, { name: "more" })
			}), s && /* @__PURE__ */ W(xt, {
				className: "de-tb-pop de-ebar-more",
				children: _.map((e, t) => /* @__PURE__ */ W("span", {
					className: "de-ebar-it",
					children: e
				}, t))
			})]
		})]
	});
}
var Ot = /* @__PURE__ */ "#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#1155cc.#38761d".split("."), kt = "office-engine:custom-colors", At = 7, jt = /^#[0-9a-f]{6}$/, Mt = null, Nt = /* @__PURE__ */ new Set();
function Pt() {
	if (Mt) return Mt;
	Mt = [];
	try {
		let e = JSON.parse(localStorage.getItem(kt) ?? "[]");
		Array.isArray(e) && (Mt = e.filter((e) => typeof e == "string" && jt.test(e)).slice(0, At));
	} catch {}
	return Mt;
}
function Ft(e) {
	Mt = [e, ...Pt().filter((t) => t !== e)].slice(0, At);
	try {
		localStorage.setItem(kt, JSON.stringify(Mt));
	} catch {}
	Nt.forEach((e) => e());
}
var It = (e) => (Nt.add(e), () => {
	Nt.delete(e);
});
function Lt(e) {
	let [t, n] = H(!1), r = V(null), i = V(null), a = U(It, Pt, Pt);
	St(r, t, () => n(!1));
	let o = V(e.onPick);
	o.current = e.onPick;
	let s = e.value?.toLowerCase();
	B(() => {
		let e = i.current;
		if (!e) return;
		let t = () => {
			let t = e.value.toLowerCase();
			jt.test(t) && (Ft(t), o.current(t));
		};
		return e.addEventListener("change", t), () => e.removeEventListener("change", t);
	}, []);
	let c = () => {
		let e = i.current;
		if (e) {
			e.value = s && jt.test(s) ? s : a[0] ?? "#000000", n(!1);
			try {
				e.showPicker();
			} catch {
				e.click();
			}
		}
	}, l = (t) => /* @__PURE__ */ W("button", {
		type: "button",
		title: t,
		className: s === t ? "on" : void 0,
		style: { background: t },
		onClick: () => (e.onPick(t), n(!1))
	}, t);
	return /* @__PURE__ */ G("span", {
		ref: r,
		className: "de-tb-color",
		children: [
			/* @__PURE__ */ G("button", {
				type: "button",
				className: t ? "de-tb de-tb-on" : "de-tb",
				title: e.title,
				"aria-label": e.title,
				"aria-expanded": t,
				onMouseDown: bt,
				onClick: () => n((e) => !e),
				children: [/* @__PURE__ */ W(J, { name: e.icon }), /* @__PURE__ */ W("span", {
					className: "de-tb-swatch",
					style: { background: F(e.value) ?? "transparent" }
				})]
			}),
			/* @__PURE__ */ W("input", {
				ref: i,
				type: "color",
				className: "de-tb-native",
				tabIndex: -1,
				"aria-hidden": !0
			}),
			t && /* @__PURE__ */ G(xt, {
				onMouseDown: bt,
				children: [
					/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb-none",
						onClick: () => (e.onPick(null), n(!1)),
						children: e.noneLabel ?? "None"
					}),
					/* @__PURE__ */ W("div", {
						className: "de-tb-grid",
						children: (e.palette ?? Ot).map(l)
					}),
					/* @__PURE__ */ W("div", {
						className: "de-tb-custom",
						children: "Custom"
					}),
					/* @__PURE__ */ G("div", {
						className: "de-tb-grid",
						children: [a.map(l), /* @__PURE__ */ W("button", {
							type: "button",
							className: "de-tb-add",
							title: "Custom color…",
							"aria-label": "Custom color",
							onClick: c,
							children: /* @__PURE__ */ W(J, {
								name: "plus",
								size: 14
							})
						})]
					})
				]
			})
		]
	});
}
var Rt = [
	"Arial",
	"Calibri",
	"Cambria",
	"Courier New",
	"Georgia",
	"Helvetica",
	"Segoe UI",
	"Tahoma",
	"Times New Roman",
	"Verdana"
], zt = [
	8,
	9,
	10,
	10.5,
	11,
	12,
	14,
	16,
	18,
	20,
	24,
	28,
	32,
	36,
	40,
	48,
	60,
	72
];
function Bt(e) {
	let t = e && !Rt.includes(e) ? [e, ...Rt] : Rt;
	return t.map((e, n) => ({
		value: e,
		label: e,
		style: { fontFamily: `"${e}", system-ui, sans-serif` },
		sep: n === 1 && t !== Rt
	}));
}
function Vt(e) {
	if (!e) return "";
	let t = /^\s*"?([^",]+)"?/.exec(e);
	return t ? t[1] : "";
}
function Ht(e, t) {
	let n = URL.createObjectURL(e), r = document.createElement("a");
	r.href = n, r.download = t, document.body.appendChild(r), r.click(), r.remove(), setTimeout(() => URL.revokeObjectURL(n), 3e4);
}
function Ut(e) {
	return /* @__PURE__ */ W(Z, {
		title: e.title,
		label: e.label.replace(/\s*▾$/, ""),
		icon: e.icon,
		options: e.items,
		onChange: e.onPick
	});
}
function Wt(e) {
	let [t, n] = H(!1), r = V(null);
	return St(r, t, () => n(!1)), /* @__PURE__ */ G("span", {
		ref: r,
		className: "de-tb-color",
		children: [/* @__PURE__ */ G("button", {
			type: "button",
			className: (e.active || t ? "de-tb de-tb-on" : "de-tb") + (e.chevron ? " de-tb-chev" : ""),
			title: e.title,
			"aria-label": e.title,
			"aria-expanded": t,
			disabled: e.disabled,
			onMouseDown: bt,
			onClick: () => n((e) => !e),
			children: [/* @__PURE__ */ W(J, { name: e.icon }), e.chevron && /* @__PURE__ */ W(J, {
				name: "chevron",
				size: 14
			})]
		}), t && /* @__PURE__ */ W(xt, {
			onMouseDown: (e) => e.target.closest("input, textarea") || e.preventDefault(),
			children: e.children(() => n(!1))
		})]
	});
}
function Gt({ onPick: e }) {
	let [t, n] = H([0, 0]);
	return /* @__PURE__ */ G("div", { children: [/* @__PURE__ */ W("div", {
		className: "de-gridpick",
		onMouseLeave: () => n([0, 0]),
		children: Array.from({ length: 64 }, (r, i) => {
			let a = Math.floor(i / 8) + 1, o = i % 8 + 1;
			return /* @__PURE__ */ W("button", {
				type: "button",
				className: a <= t[0] && o <= t[1] ? "on" : "",
				onMouseEnter: () => n([a, o]),
				onMouseDown: bt,
				onClick: () => e(a, o)
			}, i);
		})
	}), /* @__PURE__ */ W("div", {
		className: "de-gridpick-label",
		children: t[0] ? `${t[0]} × ${t[1]}` : "Table size"
	})] });
}
function Kt(e) {
	let [t, n] = H(e.initial ?? "");
	return /* @__PURE__ */ G("form", {
		className: "de-prompt",
		onSubmit: (n) => {
			n.preventDefault(), e.onOk(t);
		},
		children: [
			/* @__PURE__ */ W("input", {
				autoFocus: !0,
				value: t,
				placeholder: e.placeholder,
				onChange: (e) => n(e.target.value)
			}),
			/* @__PURE__ */ W("button", {
				type: "submit",
				className: "de-btn",
				children: e.ok
			}),
			e.extra
		]
	});
}
function qt(e = "image/*", t = !0) {
	return new Promise((n) => {
		let r = document.createElement("input");
		r.type = "file", r.accept = e, r.multiple = t, r.onchange = () => n(Array.from(r.files ?? [])), r.click();
	});
}
// src/react/common/Slots.tsx
var Jt = Pe({
	bar: null,
	editable: !1,
	setDirty: () => {},
	save: async () => {},
	canDownload: !0,
	client: null,
	fileOps: { current: null },
	selectAll: { current: null }
}), Yt = () => Le(Jt);
function Xt(e) {
	let t = Yt().fileOps;
	B(() => {
		t.current = e;
	}), B(() => () => {
		t.current = null;
	}, [t]);
}
function Zt(e) {
	let t = Yt().selectAll;
	B(() => {
		t.current = e;
	}), B(() => () => {
		t.current = null;
	}, [t]);
}
function Qt({ children: e }) {
	let { bar: t } = Yt();
	return t ? Ue(/* @__PURE__ */ W(Dt, { children: e }), t) : null;
}
// src/react/common/Status.tsx
var $t = Pe(null);
function en({ text: e, onStatus: t }) {
	let n = Le($t);
	return B(() => {
		t?.(e);
	}, [e, t]), n ? Ue(e, n) : null;
}
// src/react/common/ZoomControl.tsx
var tn = [
	.25,
	.33,
	.5,
	.67,
	.75,
	.9,
	1,
	1.1,
	1.25,
	1.5,
	1.75,
	2,
	2.5,
	3
];
function nn({ zoom: e, effective: t, onChange: n }) {
	let r = (e) => {
		let r = t, i = e > 0 ? tn.find((e) => e > r + .001) : [...tn].reverse().find((e) => e < r - .001);
		i && n(i);
	};
	return /* @__PURE__ */ G("div", {
		className: "de-zoom",
		role: "group",
		"aria-label": "Zoom",
		children: [
			/* @__PURE__ */ W("button", {
				type: "button",
				"aria-label": "Zoom out",
				onClick: () => r(-1),
				children: /* @__PURE__ */ W(J, {
					name: "zoomOut",
					size: 16
				})
			}),
			/* @__PURE__ */ W("span", {
				title: e === "fit" ? "Fit width (click for 100%)" : "Click to fit width",
				onClick: () => n(e === "fit" ? 1 : "fit"),
				children: e === "fit" ? "Fit" : `${Math.round(t * 100)}%`
			}),
			/* @__PURE__ */ W("button", {
				type: "button",
				"aria-label": "Zoom in",
				onClick: () => r(1),
				children: /* @__PURE__ */ W(J, {
					name: "zoomIn",
					size: 16
				})
			})
		]
	});
}
// src/react/common/ContextMenu.tsx
function rn(e, t, n) {
	let r = e.length, i = t;
	for (let t = 0; t < r; t++) if (i = (i + n + r) % r, !e[i].disabled) return i;
	return t;
}
function an(e) {
	let { items: t, hi: n, open: r } = e;
	return /* @__PURE__ */ W(We, { children: t.map((t, i) => /* @__PURE__ */ G("div", {
		className: "de-ctx-row",
		children: [
			t.sep && i > 0 && /* @__PURE__ */ W("div", {
				className: "de-ctx-sep",
				role: "separator"
			}),
			t.head && /* @__PURE__ */ W("div", {
				className: "de-ctx-head",
				children: t.head
			}),
			/* @__PURE__ */ G("button", {
				ref: e.rowRef && ((t) => e.rowRef(i, t)),
				type: "button",
				role: "menuitem",
				"aria-haspopup": t.items ? "menu" : void 0,
				"aria-expanded": t.items ? r === i : void 0,
				className: i === n || i === r ? "de-ctx-hi" : void 0,
				disabled: t.disabled,
				onMouseEnter: () => e.onHover(i),
				onClick: () => e.onPick(i),
				children: [
					/* @__PURE__ */ W("span", {
						className: "de-ctx-icon",
						children: t.icon && /* @__PURE__ */ W(J, {
							name: t.icon,
							size: 16
						})
					}),
					/* @__PURE__ */ W("span", {
						className: "de-ctx-label",
						children: t.label
					}),
					t.hint && /* @__PURE__ */ W("span", {
						className: "de-ctx-hint",
						children: t.hint
					}),
					t.items && /* @__PURE__ */ W("span", {
						className: "de-ctx-more",
						children: /* @__PURE__ */ W(J, {
							name: "chevron",
							size: 14
						})
					})
				]
			})
		]
	}, i)) });
}
function on(e) {
	let t = V(null), [n, r] = H(null);
	return Be(() => {
		let n = t.current;
		if (!n) return;
		let i = e.anchor.getBoundingClientRect(), a = n.getBoundingClientRect(), o = document.documentElement.clientWidth, s = document.documentElement.clientHeight;
		r({
			left: i.right + a.width > o - 4 ? Math.max(4, i.left - a.width) : i.right,
			top: Math.max(4, Math.min(i.top - 6, s - a.height - 4))
		});
	}, [e.anchor, e.items.length]), /* @__PURE__ */ W("div", {
		ref: t,
		className: "de-ctx de-ctx-sub",
		style: n ?? {
			left: 0,
			top: 0,
			visibility: "hidden"
		},
		role: "menu",
		onMouseEnter: e.onEnter,
		children: /* @__PURE__ */ W(an, {
			items: e.items,
			hi: e.hi,
			onHover: e.onHover,
			onPick: e.onPick
		})
	});
}
function sn({ x: e, y: t, items: n, onClose: r }) {
	let i = V(null), a = V([]), [o, s] = H({
		left: e,
		top: t
	}), [c, l] = H(-1), [u, d] = H(null), f = V(r);
	f.current = r;
	let p = V(void 0), m = () => clearTimeout(p.current);
	B(() => m, []), Be(() => {
		let n = i.current;
		if (!n) return;
		let r = n.getBoundingClientRect(), a = document.documentElement.clientWidth, o = document.documentElement.clientHeight;
		s({
			left: e + r.width > a - 4 ? Math.max(4, e - r.width) : e,
			top: t + r.height > o - 4 ? Math.max(4, Math.min(t - r.height, o - r.height - 4)) : t
		});
	}, [e, t]);
	let h = u ? n[u.at]?.items : void 0, g = (e, t = -1) => {
		m(), d((n) => n?.at === e && t < 0 ? n : {
			at: e,
			hi: t
		});
	}, _ = (e, t, n) => {
		let r = e[t];
		if (r && !r.disabled) {
			if (r.items && n === void 0) return g(t);
			f.current(), r.run?.();
		}
	};
	B(() => {
		let e = (e) => {
			i.current && !e.composedPath().includes(i.current) && f.current();
		}, t = (e) => {
			if (e.key === "Escape") h ? d(null) : f.current();
			else if (h && u) {
				if (e.key === "ArrowDown") d({
					at: u.at,
					hi: rn(h, u.hi, 1)
				});
				else if (e.key === "ArrowUp") d({
					at: u.at,
					hi: rn(h, u.hi < 0 ? 0 : u.hi, -1)
				});
				else if (e.key === "ArrowLeft") d(null);
				else if (e.key === "Enter") _(h, u.hi, u.at);
				else return;
			} else if (e.key === "ArrowDown") l((e) => rn(n, e, 1));
			else if (e.key === "ArrowUp") l((e) => rn(n, e < 0 ? 0 : e, -1));
			else if ((e.key === "ArrowRight" || e.key === "Enter") && n[c]?.items && !n[c].disabled) g(c, rn(n[c].items, -1, 1));
			else if (e.key === "Enter") _(n, c);
			else return;
			e.preventDefault(), e.stopPropagation();
		}, r = () => f.current();
		return window.addEventListener("mousedown", e, !0), window.addEventListener("keydown", t, !0), window.addEventListener("blur", r), window.addEventListener("resize", r), () => {
			window.removeEventListener("mousedown", e, !0), window.removeEventListener("keydown", t, !0), window.removeEventListener("blur", r), window.removeEventListener("resize", r);
		};
	});
	let v = u ? a.current[u.at] : null;
	return /* @__PURE__ */ G("div", {
		ref: i,
		className: "de-ctx",
		style: o,
		role: "menu",
		onMouseDown: (e) => e.preventDefault(),
		onContextMenu: (e) => e.preventDefault(),
		children: [/* @__PURE__ */ W(an, {
			items: n,
			hi: c,
			open: u?.at,
			rowRef: (e, t) => a.current[e] = t,
			onHover: (e) => {
				l(e);
				let t = n[e];
				t.items && !t.disabled ? g(e) : u && (m(), p.current = setTimeout(() => d(null), 250));
			},
			onPick: (e) => _(n, e)
		}), u && h && v && /* @__PURE__ */ W(on, {
			anchor: v,
			items: h,
			hi: u.hi,
			onEnter: m,
			onHover: (e) => d({
				at: u.at,
				hi: e
			}),
			onPick: (e) => _(h, e, u.at)
		})]
	});
}
var Q = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";
// src/react/common/Dialog.tsx
function cn({ spec: e, onClose: t }) {
	let [n, r] = H(e.initial ?? ""), i = V(null);
	B(() => {
		let e = i.current;
		e?.focus(), e?.select();
	}, []);
	let a = () => {
		t(), e.onOk(n);
	};
	return /* @__PURE__ */ W("div", {
		className: "de-dialog-back",
		onMouseDown: (e) => e.target === e.currentTarget && t(),
		onKeyDown: (e) => {
			e.key === "Escape" && (e.stopPropagation(), t());
		},
		children: /* @__PURE__ */ G("form", {
			className: "de-dialog",
			role: "dialog",
			"aria-label": e.title,
			onSubmit: (e) => {
				e.preventDefault(), a();
			},
			children: [
				/* @__PURE__ */ W("div", {
					className: "de-dialog-title",
					children: e.title
				}),
				e.label && /* @__PURE__ */ W("label", {
					className: "de-dialog-label",
					children: e.label
				}),
				e.area ? /* @__PURE__ */ W("textarea", {
					ref: i,
					rows: 3,
					value: n,
					placeholder: e.placeholder,
					onChange: (e) => r(e.target.value)
				}) : /* @__PURE__ */ W("input", {
					ref: i,
					value: n,
					placeholder: e.placeholder,
					onChange: (e) => r(e.target.value)
				}),
				e.note && /* @__PURE__ */ W("div", {
					className: "de-dialog-note",
					children: e.note
				}),
				/* @__PURE__ */ G("div", {
					className: "de-dialog-btns",
					children: [
						e.extra && /* @__PURE__ */ W("button", {
							type: "button",
							className: "de-btn de-dialog-extra",
							onClick: () => {
								t(), e.extra.run();
							},
							children: e.extra.label
						}),
						/* @__PURE__ */ W("button", {
							type: "button",
							className: "de-btn",
							onClick: t,
							children: "Cancel"
						}),
						/* @__PURE__ */ W("button", {
							type: "submit",
							className: "de-btn de-btn-primary",
							children: e.ok ?? "OK"
						})
					]
				})
			]
		})
	});
}
function ln(e) {
	let t = V(null);
	return B(() => t.current?.focus(), []), /* @__PURE__ */ W("div", {
		className: "de-dialog-back",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		onKeyDown: (t) => {
			t.key === "Escape" && (t.stopPropagation(), e.onClose());
		},
		children: /* @__PURE__ */ G("div", {
			className: "de-dialog",
			role: "alertdialog",
			"aria-label": e.title,
			children: [
				/* @__PURE__ */ W("div", {
					className: "de-dialog-title",
					children: e.title
				}),
				/* @__PURE__ */ W("div", {
					className: "de-dialog-note",
					children: e.message
				}),
				/* @__PURE__ */ G("div", {
					className: "de-dialog-btns",
					children: [/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						onClick: e.onClose,
						children: "Cancel"
					}), /* @__PURE__ */ W("button", {
						ref: t,
						type: "button",
						className: "de-btn de-btn-primary",
						onClick: () => {
							e.onClose(), e.onOk();
						},
						children: e.ok
					})]
				})
			]
		})
	});
}
function un({ text: e, onDone: t }) {
	return B(() => {
		let e = setTimeout(t, 3500);
		return () => clearTimeout(e);
	}, [e, t]), /* @__PURE__ */ W("div", {
		className: "de-toast",
		role: "status",
		children: e
	});
}
// src/core/docx/spec.ts
function dn(e) {
	switch (e.t) {
		case "text": return {
			text: e.text,
			src: e.src,
			set: e.d && Object.keys(e.d).length ? e.d : void 0,
			lk: e.lk,
			cm: e.cm?.length ? e.cm : void 0,
			...e.tc ? { tc: e.tc } : {}
		};
		case "field": return {
			obj: "field",
			kind: e.kind
		};
		case "img": return e.src ? {
			obj: "copy",
			src: e.src,
			size: e.resized ? [e.w, e.h] : void 0,
			alt: e.altSet ? e.alt ?? "" : void 0,
			rid: e.repl ? e.rid : void 0,
			cm: e.cm?.length ? e.cm : void 0,
			...e.tc ? { tc: e.tc } : {}
		} : e.rid ? {
			obj: "image",
			rid: e.rid,
			w: e.w,
			h: e.h,
			alt: e.alt,
			cm: e.cm?.length ? e.cm : void 0
		} : { text: "" };
		default: return e.src ? {
			obj: "copy",
			src: e.src,
			...e.tc ? { tc: e.tc } : {}
		} : { text: "" };
	}
}
function fn(e) {
	let t = e[0];
	return {
		pid: t.pid,
		from: t.from ?? t.pid,
		orig: t.orig,
		pd: t.pd,
		keepSect: t.keepSect,
		pristine: !e.some((e) => e.edited) && (t.from === void 0 || t.from === t.pid),
		parts: e.map((e) => e.runs.map(dn))
	};
}
function pn(e) {
	return {
		tid: e.tid,
		item: e.item,
		cols: e.cols,
		rows: e.rows.map((e) => ({
			src: e.src,
			cells: e.cells.map((e) => ({
				src: e.src,
				colSpan: e.colSpan,
				rowSpan: e.rowSpan,
				shd: e.set?.shd ? e.shd ?? "none" : void 0,
				borders: e.set?.borders ? e.borders : void 0,
				vAlign: e.set?.vAlign ? e.vAlign ?? "top" : void 0,
				paras: e.blocks.filter((e) => e.t === "p" && e.pid !== void 0).map((e) => fn([e]))
			}))
		}))
	};
}
// src/react/file/text.ts
var mn = (e) => e.map((e) => e.t === "text" || e.t === "ref" ? e.s.vanish || e.tc?.k === "del" ? "" : e.text : "").join(""), hn = (e) => e.filter((e) => e.t === "p").map((e) => mn(e.runs)).join(" ").replace(/\s+/g, " ").trim();
function gn(e) {
	let t = [];
	for (let n of e) if (n.t === "p") t.push((n.marker ? n.marker.text + (n.marker.tab ? "	" : " ") : "") + mn(n.runs));
	else if (n.t === "tbl") for (let e of n.rows) t.push(e.cells.map((e) => hn(e.blocks)).join("	"));
	return t.join("\n") + "\n";
}
var _n = (e) => e.replace(/([\\`*_[\]<>~])/g, "\\$1"), vn = (e) => e.replace(/^(\s*)(#{1,6}(?=\s)|>|[-+*](?=\s)|\d+(?=[.)]\s)|(?:[-*_]\s*){3,}$)/, (e, t, n) => /^\d/.test(n) ? `${t}${n}\\` : `${t}\\${n}`), yn = /courier|mono|consolas|menlo|fira code|source code/i;
function bn(e, t = !1, n) {
	let r = "", i = 0;
	for (; i < e.length;) {
		let a = e[i];
		if (a.t === "img" && a.tc?.k !== "del" && n?.has(a.target)) {
			i++, r += `![${_n(a.alt ?? "")}](${n.get(a.target)})`;
			continue;
		}
		if (a.t !== "text" && a.t !== "ref" || a.tc?.k === "del") {
			i++;
			continue;
		}
		if (a.t === "text" && m(a.href)) {
			let t = "", n = a.href;
			for (; i < e.length && e[i].t === "text" && e[i].href === n;) {
				let n = e[i++];
				n.tc?.k !== "del" && (t += n.text);
			}
			r += `[${_n(t)}](${n.replace(/[()\s]/g, encodeURIComponent)})`;
			continue;
		}
		if (i++, a.s.vanish) continue;
		let o = a.text.replace(/\t/g, " ").replace(/\n/g, "  \n"), s = o.trim();
		if (!s) {
			r += o;
			continue;
		}
		let c = (a.s.b && !t ? "**" : "") + (a.s.i && !t ? "*" : ""), l = a.s.strike ? "~~" : "", u = o.slice(0, o.indexOf(s[0])), d = o.slice(o.lastIndexOf(s[s.length - 1]) + 1), f = a.s.font && yn.test(a.s.font) ? `\`${s.replace(/`/g, "``")}\`` : _n(s);
		r += `${u}${l}${c}${f}${[...c].reverse().join("")}${l}${d}`;
	}
	return r.replace(/\*\*\*\*/g, "");
}
function xn(e) {
	let t = e.rows.map((e) => e.cells.map((e) => hn(e.blocks).replace(/\|/g, "\\|") || " "));
	if (!t.length) return "";
	let n = Math.max(...t.map((e) => e.length)), r = (e) => `| ${Array.from({ length: n }, (t, n) => e[n] ?? " ").join(" | ")} |`;
	return [
		r(t[0]),
		`|${" --- |".repeat(n)}`,
		...t.slice(1).map(r)
	].join("\n");
}
function Sn(e, t) {
	let n = [], r = !1;
	for (let i of e) {
		if (i.t === "tbl") {
			n.push(xn(i), ""), r = !1;
			continue;
		}
		if (i.t !== "p") continue;
		let e = i.ps.outline, a = e !== void 0 && e < 6, o = bn(i.runs, a, t).trim();
		if (i.marker) {
			let e = /^[\da-zA-Z]{1,4}[.)]$/.test(i.marker.text.trim()), t = Math.max(0, Math.round(((i.ps.indL ?? 36) - 36) / 36));
			!r && n.length && n[n.length - 1] !== "" && n.push(""), n.push(`${"   ".repeat(t)}${e ? "1." : "-"} ${o}`), r = !0;
		} else r && n.push(""), r = !1, o && n.push(a ? `${"#".repeat(e + 1)} ${o}` : vn(o), "");
	}
	return n.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
var Cn = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function wn(e, t, n, r = !1) {
	let i = Cn(e).replace(/\n/g, "<br>");
	if (!i.trim()) return i;
	t.font && yn.test(t.font) && (i = `<code>${i}</code>`), t.b && !n && (i = `<strong>${i}</strong>`), t.i && (i = `<em>${i}</em>`), t.u && t.u !== "none" && !r && (i = `<u>${i}</u>`), (t.strike || t.dstrike) && (i = `<s>${i}</s>`), t.va === "sup" ? i = `<sup>${i}</sup>` : t.va === "sub" && (i = `<sub>${i}</sub>`);
	let a = F(t.color), o = F(t.hl), s = [a && a !== "auto" && !n && !r ? `color:${a}` : "", o && o !== "none" ? `background:${o}` : ""].filter(Boolean).join(";");
	return s ? `<span style="${s}">${i}</span>` : i;
}
function Tn(e) {
	let t = [];
	for (let n of e) {
		let e = t[t.length - 1];
		n.t === "text" && e?.t === "text" && e.href === n.href && e.tc?.k === n.tc?.k && JSON.stringify(e.s) === JSON.stringify(n.s) ? t[t.length - 1] = {
			...e,
			text: e.text + n.text
		} : t.push(n);
	}
	return t;
}
function En(e, t = !1, n) {
	let r = "", i = 0;
	for (e = Tn(e); i < e.length;) {
		let a = e[i++];
		if (a.tc?.k !== "del") {
			if (a.t === "img") {
				let e = n?.get(a.target);
				if (!e) continue;
				let t = `<img src="${e}" alt="${Cn(a.alt ?? "")}" width="${Math.round(a.w * 96 / 72)}" height="${Math.round(a.h * 96 / 72)}">`;
				r += m(a.href) ? `<a href="${Cn(a.href)}">${t}</a>` : t;
			} else if ((a.t === "text" || a.t === "ref") && !a.s.vanish) {
				if (a.t === "text" && m(a.href)) {
					let n = a.href, o = wn(a.text, a.s, t, !0);
					for (; i < e.length && e[i].t === "text" && e[i].href === n;) {
						let n = e[i++];
						n.tc?.k !== "del" && !n.s.vanish && (o += wn(n.text, n.s, t, !0));
					}
					r += `<a href="${Cn(n)}">${o}</a>`;
				} else r += wn(a.text, a.s, t);
			}
		}
	}
	return r;
}
var Dn = (e, t) => e.filter((e) => e.t === "p").map((e) => En(e.runs, !1, t).trim()).filter(Boolean).join("<br>"), On = "body{max-width:48em;margin:2em auto;padding:0 1em;font:16px/1.5 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:#222}table{border-collapse:collapse}td{border:1px solid #ccc;padding:4px 8px;vertical-align:top}img{max-width:100%;height:auto}code{font-family:ui-monospace,Menlo,Consolas,monospace;background:#f3f3f3;padding:0 .2em}";
function kn(e, t = {}) {
	return `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${Cn(t.title ?? "")}</title>\n<style>${On}</style></head>\n<body>\n${An(e, t.images)}\n</body></html>\n`;
}
function An(e, t) {
	let n = [], r = [], i = (e) => {
		for (; r.length > e;) n[n.length - 1] += `</li></${r.pop()}>`;
	};
	for (let a of e) {
		if (a.t === "tbl") {
			i(0), n.push(`<table>\n${a.rows.map((e) => `<tr>${e.cells.map((e) => `<td>${Dn(e.blocks, t)}</td>`).join("")}</tr>`).join("\n")}\n</table>`);
			continue;
		}
		if (a.t !== "p") continue;
		let e = a.ps.outline, o = e !== void 0 && e < 6, s = En(a.runs, o, t).trim();
		if (a.marker) {
			let e = /^[\da-zA-Z]{1,4}[.)]$/.test(a.marker.text.trim()) ? "ol" : "ul", t = Math.max(0, Math.round(((a.ps.indL ?? 36) - 36) / 36)) + 1;
			if (i(r[t - 1] === e ? t : t - 1), t > r.length) for (; r.length < t;) r.push(e), n.push(`<${e}>`);
			else n[n.length - 1] += "</li>";
			n.push(`<li>${s}`);
			continue;
		}
		if (i(0), !s) continue;
		let c = a.ps.align === "center" || a.ps.align === "right" ? ` style="text-align:${a.ps.align}"` : "";
		n.push(o ? `<h${e + 1}${c}>${s}</h${e + 1}>` : `<p${c}>${s}</p>`);
	}
	return i(0), n.join("\n");
}
async function jn(e, t) {
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		for (let t of e) {
			if (t.t === "p") for (let e of t.runs) e.t === "img" && n.add(e.target);
			if (t.t === "tbl") for (let e of t.rows) for (let t of e.cells) r(t.blocks);
		}
	};
	r(e);
	let i = /* @__PURE__ */ new Map();
	for (let e of n) try {
		let n = await t(e), r = new Uint8Array(await n.arrayBuffer()), a = "";
		for (let e = 0; e < r.length; e += 32768) a += String.fromCharCode(...r.subarray(e, e + 32768));
		i.set(e, `data:${n.type || "application/octet-stream"};base64,${btoa(a)}`);
	} catch {}
	return i;
}
var Mn = (e) => e ? e.paras.map((e) => (e.bullet ? e.bullet.text + " " : "") + e.runs.map((e) => e.br ? "\n" : e.text).join("")).filter((e) => e.trim()).join("\n") : "";
function Nn(e) {
	let t = [];
	for (let n of e) {
		t.push(`Slide ${n.index + 1}`, "");
		for (let e of n.els) if (e.t === "shape") {
			let n = Mn(e.text);
			n && t.push(n, "");
		} else if (e.t === "table") {
			for (let n of e.rows) t.push(n.cells.filter((e) => !e.hidden).map((e) => Mn(e.text).replace(/\s+/g, " ")).join("	"));
			t.push("");
		}
		n.notes?.trim() && t.push("Notes:", n.notes.trim(), ""), t.push("");
	}
	return t.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
// src/react/docx/tables.ts
function Pn(e) {
	let t = [], n = [];
	return e.rows.forEach((e, r) => {
		let i = 0;
		e.cells.forEach((e, a) => {
			for (; t[r]?.[i];) i++;
			for (let n = r; n < r + Math.max(1, e.rowSpan); n++) for (let r = i; r < i + Math.max(1, e.colSpan); r++) (t[n] ??= [])[r] = !0;
			n.push({
				ri: r,
				ci: a,
				g: i,
				cell: e
			}), i += Math.max(1, e.colSpan);
		});
	}), {
		cells: n,
		nCols: Math.max(e.cols.length, ...n.map((e) => e.g + e.cell.colSpan)),
		at: (e, t) => n.find((n) => e >= n.ri && e < n.ri + n.cell.rowSpan && t >= n.g && t < n.g + n.cell.colSpan)
	};
}
function Fn(e, t, n = 1) {
	return {
		...e,
		blocks: [t(e)],
		colSpan: n,
		rowSpan: 1
	};
}
function In(e, t) {
	let n = e.reduce((e, t) => e + t, 0) || 1;
	return e.map((e) => +(e * t / n).toFixed(2));
}
function Ln(e, t, n, r) {
	let { cells: i, nCols: a, at: o } = Pn(e), s = n ? t + 1 : t, c = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	})), l = [];
	for (let e = 0; e < a;) {
		let n = o(t, e);
		if (!n) e++;
		else {
			if (n.ri < s && n.ri + n.cell.rowSpan > s) {
				let e = c[n.ri];
				e.cells[n.ci] = {
					...e.cells[n.ci],
					rowSpan: e.cells[n.ci].rowSpan + 1
				};
			} else l.push(Fn(n.cell, r, n.cell.colSpan));
			e += n.cell.colSpan;
		}
	}
	let u = {
		...e.rows[t],
		cells: l
	};
	return c.splice(s, 0, u), {
		...e,
		rows: c
	};
}
function Rn(e, t) {
	if (e.rows.length <= 1) return null;
	let { cells: n } = Pn(e), r = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	}));
	for (let e of n) e.ri < t && e.ri + e.cell.rowSpan > t && (r[e.ri].cells[e.ci] = {
		...r[e.ri].cells[e.ci],
		rowSpan: e.cell.rowSpan - 1
	});
	let i = t + 1, a = n.filter((e) => e.ri === t && e.cell.rowSpan > 1).sort((e, t) => t.g - e.g);
	for (let e of a) {
		let t = n.filter((t) => t.ri === i && t.g < e.g).length;
		r[i].cells.splice(t, 0, {
			...e.cell,
			rowSpan: e.cell.rowSpan - 1
		});
	}
	return r.splice(t, 1), {
		...e,
		rows: r
	};
}
function zn(e, t, n, r) {
	let { cells: i, nCols: a } = Pn(e), o = n ? t + 1 : t, s = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	})), c = e.cols.reduce((e, t) => e + t, 0);
	e.rows.forEach((e, t) => {
		let n = i.filter((e) => e.ri === t), a = i.find((e) => e.ri <= t && t < e.ri + e.cell.rowSpan && e.g < o && e.g + e.cell.colSpan > o);
		if (a) {
			a.ri === t && (s[t].cells[a.ci] = {
				...s[t].cells[a.ci],
				colSpan: a.cell.colSpan + 1
			});
			return;
		}
		if (i.find((e) => e.ri < t && t < e.ri + e.cell.rowSpan && e.g + e.cell.colSpan === o) && !n.length) return;
		let c = n.filter((e) => e.g < o).length, l = n[Math.max(0, c - 1)]?.cell ?? n[0]?.cell;
		l && s[t].cells.splice(c, 0, Fn(l, r));
	});
	let l = [...e.cols.length ? e.cols : Array(a).fill(c / Math.max(1, a))];
	return l.splice(o, 0, l[Math.min(t, l.length - 1)] ?? 72), {
		...e,
		rows: s,
		cols: c ? In(l, c) : l
	};
}
function Bn(e, t) {
	let { cells: n, nCols: r } = Pn(e);
	if (r <= 1) return null;
	let i = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	})), a = /* @__PURE__ */ new Set();
	for (let e of n) t < e.g || t >= e.g + e.cell.colSpan || (e.cell.colSpan > 1 ? i[e.ri].cells[e.ci] = {
		...i[e.ri].cells[e.ci],
		colSpan: e.cell.colSpan - 1
	} : a.add(`${e.ri}:${e.ci}`));
	i.forEach((e, t) => e.cells = e.cells.filter((e, n) => !a.has(`${t}:${n}`)));
	let o = e.cols.reduce((e, t) => e + t, 0), s = [...e.cols];
	return s.splice(t, 1), {
		...e,
		rows: i.filter((e) => e.cells.length),
		cols: o && s.length ? In(s, o) : s
	};
}
function Vn(e, t, n, r) {
	let i = "0.5pt solid #000000", a = +(n / t).toFixed(2);
	return {
		t: "tbl",
		cols: Array(t).fill(a),
		rows: Array.from({ length: e }, () => ({ cells: Array.from({ length: t }, () => ({
			blocks: [r()],
			colSpan: 1,
			rowSpan: 1,
			borders: {
				t: i,
				r: i,
				b: i,
				l: i
			},
			pad: [
				0,
				5.4,
				0,
				5.4
			]
		})) }))
	};
}
function Hn(e, t, n) {
	let r = "0.5pt solid #000000", i = [], a = [], o = 1;
	for (let t of e) o = Math.max(o, t.reduce((e, t) => e + t.colSpan, 0));
	let s = (e) => ({
		blocks: e.blocks.length ? e.blocks : [n()],
		colSpan: e.colSpan,
		rowSpan: e.rowSpan,
		borders: {
			t: r,
			r,
			b: r,
			l: r
		},
		pad: [
			0,
			5.4,
			0,
			5.4
		]
	});
	e.forEach((t, n) => {
		let r = [], c = 0, l = (t) => {
			for (; i[n]?.[c];) c++;
			let a = Math.max(1, Math.min(t.colSpan, o - c)), l = Math.max(1, Math.min(t.rowSpan, e.length - n));
			for (let e = n; e < n + l; e++) for (let t = c; t < c + a; t++) (i[e] ??= [])[t] = !0;
			r.push(s({
				...t,
				colSpan: a,
				rowSpan: l
			})), c += a;
		};
		for (let e of t) l(e);
		for (;;) {
			for (; i[n]?.[c];) c++;
			if (c >= o) break;
			l({
				blocks: [],
				colSpan: 1,
				rowSpan: 1
			});
		}
		a.push({ cells: r });
	});
	let c = +(t / o).toFixed(2);
	return {
		t: "tbl",
		cols: Array(o).fill(c),
		rows: a
	};
}
function Un(e, t, n) {
	let { cells: r } = Pn(e), i = r.find((e) => e.ri === t[0] && e.ci === t[1]), a = r.find((e) => e.ri === n[0] && e.ci === n[1]);
	if (!i || !a) return null;
	let o = {
		r0: Math.min(i.ri, a.ri),
		g0: Math.min(i.g, a.g),
		r1: Math.max(i.ri + i.cell.rowSpan, a.ri + a.cell.rowSpan) - 1,
		g1: Math.max(i.g + i.cell.colSpan, a.g + a.cell.colSpan) - 1
	};
	for (let e = !0; e;) {
		e = !1;
		for (let t of r) {
			let n = t.ri + t.cell.rowSpan - 1, r = t.g + t.cell.colSpan - 1;
			t.ri > o.r1 || n < o.r0 || t.g > o.g1 || r < o.g0 || (t.ri < o.r0 || n > o.r1 || t.g < o.g0 || r > o.g1) && (o.r0 = Math.min(o.r0, t.ri), o.r1 = Math.max(o.r1, n), o.g0 = Math.min(o.g0, t.g), o.g1 = Math.max(o.g1, r), e = !0);
		}
	}
	return o;
}
function Wn(e, t) {
	return Pn(e).cells.filter((e) => e.ri >= t.r0 && e.ri <= t.r1 && e.g >= t.g0 && e.g <= t.g1);
}
var Gn = (e) => e.t === "p" && !e.runs.some((e) => e.t !== "text" || e.text.length > 0);
function Kn(e, t) {
	let n = Wn(e, t);
	if (n.length < 2) return null;
	let r = n[0];
	if (r.ri !== t.r0 || r.g !== t.g0) return null;
	let i = n.filter((e) => !e.cell.blocks.every(Gn)), a = i.length ? i.flatMap((e) => e.cell.blocks) : r.cell.blocks, o = new Set(n.slice(1).map((e) => `${e.ri}:${e.ci}`)), s = e.rows.map((e, i) => ({
		...e,
		cells: e.cells.flatMap((e, s) => {
			if (o.has(`${i}:${s}`)) return [];
			if (i === r.ri && s === r.ci) {
				let r = n.find((e) => e.ri === t.r0 && e.g + e.cell.colSpan - 1 === t.g1)?.cell ?? e, i = n.find((e) => e.ri + e.cell.rowSpan - 1 === t.r1)?.cell ?? e;
				return [{
					...e,
					blocks: a,
					colSpan: t.g1 - t.g0 + 1,
					rowSpan: t.r1 - t.r0 + 1,
					borders: {
						...e.borders,
						r: r.borders.r,
						b: i.borders.b
					}
				}];
			}
			return [e];
		})
	}));
	return {
		...e,
		rows: s
	};
}
function qn(e, t, n, r) {
	let { cells: i } = Pn(e), a = i.find((e) => e.ri === t && e.ci === n);
	if (!a || a.cell.colSpan <= 1 && a.cell.rowSpan <= 1) return null;
	let { colSpan: o, rowSpan: s } = a.cell, c = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	})), l = () => ({
		...a.cell,
		blocks: [r(a.cell)],
		colSpan: 1,
		rowSpan: 1
	});
	c[t].cells.splice(n, 1, {
		...a.cell,
		colSpan: 1,
		rowSpan: 1
	}, ...Array.from({ length: o - 1 }, l));
	for (let e = t + 1; e < t + s && e < c.length; e++) {
		let t = i.filter((t) => t.ri === e && t.g < a.g).length;
		c[e].cells.splice(t, 0, ...Array.from({ length: o }, l));
	}
	return {
		...e,
		rows: c
	};
}
var Jn = [
	"t",
	"r",
	"b",
	"l"
], Yn = {
	t: "b",
	b: "t",
	l: "r",
	r: "l"
};
function Xn(e, t, n, r) {
	let { cells: i } = Pn(e), a = e.rows.map((e) => ({
		...e,
		cells: [...e.cells]
	})), o = (e, t, n) => {
		let r = a[e.ri].cells[e.ci];
		a[e.ri].cells[e.ci] = {
			...r,
			borders: {
				...r.borders,
				[t]: n
			},
			set: {
				...r.set,
				borders: !0
			}
		};
	};
	for (let a of Wn(e, t)) {
		let e = {
			t: a.ri === t.r0,
			b: a.ri + a.cell.rowSpan - 1 === t.r1,
			l: a.g === t.g0,
			r: a.g + a.cell.colSpan - 1 === t.g1
		};
		for (let t of Jn) {
			let s;
			if (s = n === "all" ? r : n === "none" ? "none" : n === "outer" ? e[t] ? r : void 0 : n === "inner" ? e[t] ? void 0 : r : t === n[0] && e[t] ? r : void 0, s !== void 0 && (o(a, t, s), e[t])) for (let e of i) {
				let n = e.ri + e.cell.rowSpan - 1, r = e.g + e.cell.colSpan - 1, i = e.ri <= a.ri + a.cell.rowSpan - 1 && n >= a.ri, c = e.g <= a.g + a.cell.colSpan - 1 && r >= a.g;
				(t === "t" && n === a.ri - 1 && c || t === "b" && e.ri === a.ri + a.cell.rowSpan && c || t === "l" && r === a.g - 1 && i || t === "r" && e.g === a.g + a.cell.colSpan && i) && o(e, Yn[t], s);
			}
		}
	}
	return {
		...e,
		rows: a
	};
}
function Zn(e, t, n) {
	let r = new Set(Wn(e, t).map((e) => `${e.ri}:${e.ci}`));
	return {
		...e,
		rows: e.rows.map((e, t) => ({
			...e,
			cells: e.cells.map((e, i) => r.has(`${t}:${i}`) ? n(e) : e)
		}))
	};
}
function Qn(e, t) {
	let { nCols: n } = Pn(e), r = e.cols.length === n ? [...e.cols] : Array(n).fill(e.cols.reduce((e, t) => e + t, 0) / Math.max(1, n)), i = t && t.g1 > t.g0 ? t.g0 : 0, a = t && t.g1 > t.g0 ? t.g1 : n - 1, o = r.slice(i, a + 1).reduce((e, t) => e + t, 0);
	for (let e = i; e <= a; e++) r[e] = +(o / (a - i + 1)).toFixed(2);
	return {
		...e,
		cols: r
	};
}
// src/react/docx/track.ts
var $n = (e) => !e.b;
function er(e) {
	let t = [];
	return e.forEach((e, n) => {
		n > 0 && t.push({ b: !0 });
		for (let n of e.runs) if (n.t === "text") for (let e of n.text.split("")) t.push({
			ch: e,
			run: n,
			tc: n.tc
		});
		else t.push({
			ch: "￼",
			run: n,
			obj: !0,
			tc: n.tc
		});
	}), t;
}
var tr = (e, t) => e.b || t.b ? !!e.b && !!t.b : e.ch === t.ch && (!e.obj || e.run === t.run), nr = (e) => !!e && $n(e) && /[\uD800-\uDBFF]/.test(e.ch);
function rr(e, t, n, r) {
	let i = 0;
	for (let a = 0; a < e.length; a++) {
		if (se(t, a) === n) return i + r;
		i += O(e[a].runs) + 1;
	}
}
function ir(e, t, n) {
	for (let r = 0; r < e.length; r++) {
		if (n <= e[r] || r === e.length - 1) return {
			pa: se(t, r),
			o: Math.min(n, e[r])
		};
		n -= e[r] + 1;
	}
	return {
		pa: t,
		o: 0
	};
}
function ar(e) {
	let t = [], n = null, r = () => {
		if (!n) return;
		let { tc: e, ...r } = n.run;
		t.push({
			...r,
			text: n.text,
			...n.tc ? { tc: n.tc } : {}
		}), n = null;
	};
	for (let i of e) i.obj ? (r(), t.push(i.tc === i.run.tc ? i.run : {
		...i.run,
		tc: i.tc
	})) : n && n.run === i.run && n.tc === i.tc ? n.text += i.ch : (r(), n = {
		run: i.run,
		tc: i.tc,
		text: i.ch
	});
	return r(), ge(t);
}
function or(e, t, n, r, i, a) {
	let o = er(e), s = er(t), c = i ? rr(e, n, i.a.pa, i.a.o) : void 0, l = i ? rr(e, n, i.f.pa, i.f.o) : void 0, u = c !== void 0 && l !== void 0 ? Math.min(c, l) : o.length, d = c !== void 0 && l !== void 0 ? o.length - Math.max(c, l) : o.length, f = 0;
	for (; f < u && f < o.length && f < s.length && tr(o[f], s[f]);) f++;
	nr(o[f - 1]) && f--;
	let p = 0;
	for (; p < d && p < o.length - f && p < s.length - f && tr(o[o.length - 1 - p], s[s.length - 1 - p]);) p++;
	p > 0 && /[\uDC00-\uDFFF]/.test(o[o.length - p].ch ?? "") && p--;
	let m = o.slice(f, o.length - p), h = s.slice(f, s.length - p);
	if (!m.some($n) && !h.some($n)) return {
		next: t,
		sel: r
	};
	let g = [];
	for (let e of m) if ($n(e)) {
		if (e.tc?.k === "del") g.push(e);
		else if (e.obj) continue;
		else if (e.tc?.k === "ins" && e.tc.author === a.author) continue;
		else g.push({
			...e,
			tc: {
				...a,
				k: "del",
				...e.tc?.k === "ins" ? { ins: e.tc } : {}
			}
		});
	}
	let _ = {
		...a,
		k: "ins"
	}, v = [[]];
	s.forEach((e, t) => {
		t === f && v[v.length - 1].push(...g), $n(e) ? v[v.length - 1].push(t >= f && t < s.length - p && !e.obj ? {
			...e,
			tc: _
		} : e) : v.push([]);
	}), f >= s.length && v[v.length - 1].push(...g);
	let y = t.map((e, t) => ({
		...e,
		runs: ar(v[t] ?? []),
		edited: !0
	})), b = !!i && i.a.pa === i.f.pa && i.a.o === i.f.o && rr(e, n, i.a.pa, i.a.o) === f, x = y.map((e) => O(e.runs)), S = (e) => {
		let r = rr(t, n, e.pa, e.o);
		return r === void 0 ? e : ir(x, n, r > f || r === f && b ? r + g.length : r);
	};
	return {
		next: y,
		sel: {
			a: S(r.a),
			f: S(r.f)
		}
	};
}
function sr(e, t, n, r) {
	let [i, a] = be(e, t), [o, s] = be(a, n - t), c = o.flatMap((e) => {
		if (!e.tc) return [e];
		if (r ? e.tc.k === "del" : e.tc.k === "ins" || e.tc.ins) return [];
		let { tc: t, ...n } = e;
		return [n];
	});
	return ge([
		...i,
		...c,
		...s
	]);
}
var cr = (e) => e.runs.some((e) => !!e.tc);
function lr(e) {
	let t = [], n = 0;
	for (let r of e.runs) {
		let e = r.t === "text" ? r.text.length : 1;
		if (r.tc) {
			let i = t[t.length - 1];
			i && i.b === n && i.tc.k === r.tc.k && i.tc.author === r.tc.author ? i.b = n + e : t.push({
				a: n,
				b: n + e,
				tc: r.tc
			});
		}
		n += e;
	}
	return t;
}
// src/react/docx/DocxEditor.ts
var ur = 200, dr = /[\p{L}\p{N}_'’-]/u, fr = (e) => {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) for (let e of n.runs) if (e.t === "text" || e.t === "img") for (let n of e.cm ?? []) t.add(n);
	return t;
}, pr = (e) => e.split(".").map(Number), mr = /* @__PURE__ */ new Set([
	"undo",
	"redo",
	"collab",
	"accept",
	"reject",
	"restore"
]), hr = (e, t, n) => be(be(e.runs, n)[0], t)[1], gr = [
	"b",
	"i",
	"u",
	"strike",
	"color",
	"sz",
	"font"
], _r = [
	"align",
	"line",
	"before",
	"after"
], vr = (e) => ({
	b: !!e?.b,
	i: !!e?.i,
	u: e?.u && e.u !== "none" ? e.u : "none",
	strike: !!e?.strike,
	color: e?.color ?? "auto",
	sz: e?.sz,
	font: e?.font
}), yr = (e) => ({
	align: e.align ?? "left",
	line: !e.lineRule || e.lineRule === "auto" ? e.line ?? 1 : void 0,
	before: e.before ?? 0,
	after: e.after ?? 0
}), br = (e) => e.runs.flatMap((e) => e.t === "text" ? Array(e.text.length).fill(JSON.stringify(vr(e.s))) : [""]), xr = (e) => e ? /^\s*"?([^",]+)/.exec(e)?.[1] ?? e : void 0;
function Sr(e, t) {
	if (xe(e.runs) !== xe(t.runs)) return null;
	let n = [], r = 0, i = 0, a = () => {
		for (let e = t.runs[r]; e && e.t === "text" && i >= e.text.length; e = t.runs[r]) r++, i = 0;
		return t.runs[r];
	};
	for (let t of e.runs) if (t.t !== "text") {
		let e = a();
		if (!e || e.t !== t.t) return null;
		n.push(t.t === "box" && e.t === "box" ? {
			...t,
			blocks: e.blocks
		} : (t.t === "field" || t.t === "ref") && "s" in e ? {
			...t,
			s: e.s
		} : t), r++, i = 0;
	} else for (let e = t.text; e;) {
		let r = a();
		if (!r || r.t !== "text") return null;
		let o = Math.min(e.length, r.text.length - i);
		n.push({
			...t,
			text: e.slice(0, o),
			s: r.s
		}), e = e.slice(o), i += o;
	}
	let o = e.marker && t.marker ? {
		...e.marker,
		s: t.marker.s
	} : e.marker;
	return {
		...e,
		ps: t.ps,
		runs: ge(n),
		markSz: t.markSz,
		markFont: t.markFont,
		marker: o
	};
}
function Cr(e, t, n) {
	if (t === n) return e;
	let r = (e) => e.replace(/\.?\d+$/, ""), i = Number(n.split(".").pop()) - Number(t.split(".").pop()), a = (e) => r(e.pa) === r(t) ? {
		...e,
		pa: r(n) ? `${r(n)}.${Number(e.pa.split(".").pop()) + i}` : String(Number(e.pa.split(".").pop()) + i)
	} : e;
	return {
		a: a(e.a),
		f: a(e.f)
	};
}
var wr = (e) => e ? e.pd?.list === void 0 ? e.lst : e.pd.list === "none" ? void 0 : e.pd.list : void 0, Tr = (e) => e.pd?.ilvl ?? e.ilvl ?? 0, Er = class {
	client;
	st;
	changed;
	input;
	pendSel = null;
	get pendingSel() {
		return this.pendSel;
	}
	set pendingSel(e) {
		this.pendSel = e, e && this.input.expect(e);
	}
	styles = [];
	history = [];
	future = [];
	pend = null;
	nextPid = 1e9;
	inflight = 0;
	stale = /* @__PURE__ */ new Set();
	onState;
	onImage;
	onStyles;
	onHeaders;
	shortcut;
	onDirty;
	painter = null;
	onPainter;
	onCommit;
	constructor(e, t, n) {
		this.client = e, this.st = t, this.changed = n, this.input = new A(this);
	}
	container(e) {
		let t = pr(e);
		if (t.length === 1) return {
			list: this.st.blocks,
			at: t[0]
		};
		let n = this.st.blocks[t[0]];
		if (n?.t !== "tbl") return;
		let r = n.rows[t[1]]?.cells[t[2]];
		return r ? {
			list: r.blocks,
			at: t[3],
			cell: [
				t[0],
				t[1],
				t[2]
			]
		} : void 0;
	}
	para(e) {
		let t = this.container(e), n = t?.list[t.at];
		return n && n.t === "p" && n.pid !== void 0 && !n.ro ? n : void 0;
	}
	span(e, t) {
		let n = pr(e), r = pr(t);
		if (n.length !== r.length || n.slice(0, -1).join(".") !== r.slice(0, -1).join(".")) return null;
		let i = [];
		for (let t = n[n.length - 1]; t <= r[r.length - 1]; t++) {
			let r = se(e, t - n[n.length - 1]);
			if (!this.para(r)) return null;
			i.push(r);
		}
		return i;
	}
	prev(e) {
		let t = pr(e).pop(), n = se(e, -1);
		return t > 0 && this.para(n) ? n : void 0;
	}
	next(e) {
		let t = se(e, 1);
		return this.para(t) ? t : void 0;
	}
	cmp(e, t) {
		let n = pr(e), r = pr(t);
		for (let e = 0; e < Math.min(n.length, r.length); e++) if (n[e] !== r[e]) return n[e] - r[e];
		return n.length - r.length;
	}
	all() {
		let e = -1, t = -1;
		return this.st.blocks.forEach((n, r) => {
			this.para(String(r)) && (e < 0 && (e = r), t = r);
		}), e < 0 ? null : {
			a: {
				pa: String(e),
				o: 0
			},
			f: {
				pa: String(t),
				o: O(this.para(String(t)).runs)
			}
		};
	}
	selectAll() {
		this.input.selectAll();
	}
	deleteAcross(e, t) {
		let n = pr(e.pa), r = pr(t.pa);
		if (n.length !== 1 || r.length !== 1 || n[0] >= r[0]) return null;
		let i = this.para(e.pa), a = this.para(t.pa);
		if (!i || !a) return null;
		let o = (e, t) => this.st.blocks[e]?.t === "p" && this.st.blocks[e].pid === t.pid;
		if (o(n[0] - 1, i) || o(r[0] + 1, a)) return null;
		let s = ge([...be(i.runs, e.o)[0], ...be(a.runs, t.o)[1]]), c = this.st.blocks.slice(n[0] + 1, r[0]).filter((e) => e.t === "sect");
		return this.replaceBlocks(n[0], r[0] - n[0] + 1, [this.join(i, a, s), ...c], {
			a: e,
			f: e
		}), e;
	}
	withRuns(e, t) {
		return {
			...e,
			runs: t,
			edited: !0
		};
	}
	origOf(e) {
		return e.orig ?? (e.pid === (e.from ?? e.pid) ? [e.pid] : []);
	}
	defaultRun(e) {
		if (e.caret) return {
			...e.caret,
			text: ""
		};
		let t = [...e.runs].reverse().find((e) => e.t === "text");
		return t ? {
			...t,
			text: ""
		} : {
			t: "text",
			s: {
				sz: e.markSz,
				font: e.markFont
			}
		};
	}
	split(e, t, n, r) {
		let i = e.keepSect ?? e.pid === (e.from ?? e.pid), a = {
			...e,
			runs: t,
			edited: !0,
			keepSect: !1
		}, o = {
			...e,
			runs: n,
			pid: this.nextPid++,
			from: e.from ?? e.pid,
			orig: [],
			edited: !0,
			keepSect: i,
			pb: !1,
			ver: 0,
			caret: n.length ? void 0 : pe(t, O(t)) ?? e.caret
		};
		if (r) {
			let t = this.styles.find((t) => t.id === e.sid)?.next;
			t && t !== e.sid && (o.pd = {
				...o.pd ?? {},
				style: t
			}, o.sid = t);
		}
		return [a, o];
	}
	join(e, t, n) {
		return {
			...e,
			runs: n,
			edited: !0,
			orig: [...this.origOf(e), ...this.origOf(t)],
			keepSect: (e.keepSect ?? e.pid === (e.from ?? e.pid)) || (t.keepSect ?? t.pid === (t.from ?? t.pid))
		};
	}
	splice(e, t, n) {
		let r = this.container(e);
		if (!r.cell) return this.st.blocks.splice(r.at, t, ...n), this.st.blocks;
		let [i, a, o] = r.cell, s = this.st.blocks[i], c = [...r.list];
		c.splice(r.at, t, ...n);
		let l = {
			...s,
			rows: s.rows.map((e, t) => t === a ? {
				...e,
				cells: e.cells.map((e, t) => t === o ? {
					...e,
					blocks: c
				} : e)
			} : e)
		};
		return this.st.heights.set(l, this.st.heights.get(s) ?? 0), this.st.dirty.add(l), this.st.blocks[i] = l, c;
	}
	replace(e, t, n, r = {}) {
		let i = e.map((e) => this.para(e));
		if (i.some((e) => !e)) return;
		if (this.tracking && r.history !== !1 && !mr.has(r.label ?? "")) {
			let a = or(i, t, e[0], n, this.input.caret, {
				k: "ins",
				author: this.author(),
				date: (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z")
			});
			t = a.next, n = a.sel, t.length === 1 && i.length === 1 && r.label === "type" && (r = {
				...r,
				remount: !0
			});
		}
		r.remount && (t = t.map((e) => ({
			...e,
			ver: (e.ver ?? 0) + 1
		})));
		let a = this.container(e[0]), o = a.at, s = this.splice(e[0], e.length, t), c = i[i.length - 1], l = t[t.length - 1];
		if (l && c.pid !== l.pid) for (let e = o + t.length; e < s.length; e++) {
			let t = s[e];
			if (t.t !== "p" || t.pid !== c.pid || !t.pb) break;
			s[e] = {
				...t,
				pid: l.pid,
				from: l.from ?? l.pid,
				edited: !0
			};
		}
		if (!a.cell) {
			t.forEach((e, t) => {
				this.st.heights.set(e, this.st.heights.get(i[t] ?? i[0]) ?? 0), this.st.dirty.add(e);
			});
			for (let e of [o - 1, o + t.length]) s[e] && this.st.dirty.add(s[e]);
			o < this.st.frontier && (this.st.frontier = Math.max(0, this.st.frontier + t.length - e.length));
		}
		if (r.history !== !1) {
			let a = Date.now(), o = this.history[this.history.length - 1], s = r.label ?? "edit", c = this.input.caret ?? n;
			s === "type" && o?.label === "type" && e.length === 1 && t.length === 1 && o.after.length === 1 && o.pas[0] === e[0] && o.after[0].pid === i[0].pid && a - o.t < 1500 ? (o.after = t, o.selAfter = n, o.t = a) : (this.history.push({
				pas: e,
				before: i,
				after: t,
				selBefore: c,
				selAfter: n,
				label: s,
				t: a
			}), this.history.length > 500 && this.history.shift()), this.future = [];
		}
		this.commit(e[0], i, t, r.want), this.onCommit?.({
			kind: "paras",
			before: i,
			next: t
		}), r.label === "collab" && this.catchUp(), this.pendingSel = n, this.onDirty?.(), this.changed(), this.emitState(n);
	}
	restore(e, t) {
		let n = this.container(e);
		if (!n || t.pid === void 0 || n.at > n.list.length) return;
		let r = this.splice(e, 0, [t]);
		if (!n.cell) {
			this.st.heights.has(t) || this.st.heights.set(t, 0), this.st.dirty.add(t);
			for (let e of [n.at - 1, n.at + 1]) r[e] && this.st.dirty.add(r[e]);
			n.at < this.st.frontier && this.st.frontier++;
		}
		n.cell && this.st.blocks[n.cell[0]].tid !== void 0 ? this.commitTable(n.cell[0]) : this.send("docx.edit", {
			anchor: t.pid,
			list: [fn(this.partsOf(r, t.pid, n.at))]
		}), this.onDirty?.(), this.changed();
	}
	partsOf(e, t, n) {
		let r = n;
		for (; r > 0 && e[r - 1].pid === t && e[r - 1].t === "p";) r--;
		let i = [];
		for (; r < e.length && e[r].t === "p" && e[r].pid === t; r++) i.push(e[r]);
		return i;
	}
	commit(e, t, n, r) {
		let i = this.container(e);
		if (i.cell && this.st.blocks[i.cell[0]].tid !== void 0) {
			this.commitTable(i.cell[0]);
			return;
		}
		let a = i.list, o = [];
		n.forEach((e) => e.pid !== void 0 && !o.includes(e.pid) && o.push(e.pid));
		let s = o.map((e) => {
			let t = i.at + n.findIndex((t) => t.pid === e);
			return fn(this.partsOf(a, e, t));
		}), c = [];
		for (let e of t) {
			if (e.pid === void 0 || o.includes(e.pid) || c.includes(e.pid)) continue;
			let t = a.findIndex((t) => t.t === "p" && t.pid === e.pid);
			t >= 0 ? s.push(fn(this.partsOf(a, e.pid, t))) : c.push(e.pid);
		}
		let l = t[0].pid, u = fr(t);
		if (u.size) {
			let e = fr(n), r = [...u].filter((t) => !e.has(t));
			r.length && this.remark(new Set(r), /* @__PURE__ */ new Set([
				...o,
				...c,
				...t.map((e) => e.pid)
			]));
		}
		let d = r || n.some((e) => e.pd !== t.find((t) => t.pid === e.pid)?.pd) || s.some((e) => this.stale.has(e.pid));
		if (d) for (let e of s) this.stale.add(e.pid);
		let f = new Set(n), p = {
			anchor: l,
			list: s,
			remove: c,
			want: d
		};
		this.inflight++;
		let m = !1;
		this.client.call("docx.edit", p).then((e) => {
			m = this.applyResult(e, f);
		}).catch((e) => console.error("[office-engine] edit failed", e)).finally(() => {
			this.inflight--, m && this.emitState(this.input.sel());
		});
	}
	get busy() {
		return this.inflight > 0;
	}
	remark(e, t) {
		let n = /* @__PURE__ */ new Set(), r = (i, a) => {
			i.forEach((o, s) => {
				if (o.t === "tbl") return o.rows.forEach((e) => e.cells.forEach((e) => r(e.blocks, s)));
				if (o.t !== "p" || o.pid === void 0 || o.edited || o.ro || t.has(o.pid) || !o.runs.some((t) => (t.t === "text" || t.t === "img") && t.cm?.some((t) => e.has(t)))) return;
				t.add(o.pid);
				let c = this.partsOf(i, o.pid, s);
				for (let e of c) e.edited = !0;
				a !== void 0 && this.st.blocks[a].tid !== void 0 ? n.add(a) : this.send("docx.edit", {
					anchor: o.pid,
					list: [fn(c)]
				});
			});
		};
		r(this.st.blocks, void 0);
		for (let e of n) this.commitTable(e);
	}
	paraPos(e) {
		let t = this.para(e.pa);
		if (!t || t.pid === void 0) return null;
		let n = this.locate(t.pid).findIndex((t) => t.pa === e.pa);
		return n < 0 ? null : {
			pid: t.pid,
			k: n,
			o: e.o
		};
	}
	posOf(e) {
		let t = this.locate(e.pid), n = t[Math.min(e.k, t.length - 1)], r = n && this.para(n.pa);
		return r ? {
			pa: n.pa,
			o: Math.min(e.o, O(r.runs))
		} : null;
	}
	commentRange(e = this.input.sel() ?? this.input.lastSel) {
		if (!e) return null;
		let t = this.selectedParas(e);
		if (!t) return null;
		let { s: n, e: r } = t;
		if (P(e)) {
			let e = xe(this.para(n.pa).runs), t = n.o, i = n.o;
			for (; t > 0 && dr.test(e[t - 1]);) t--;
			for (; i < e.length && dr.test(e[i]);) i++;
			if (t === i) return null;
			n = {
				pa: n.pa,
				o: t
			}, r = {
				pa: n.pa,
				o: i
			};
		}
		let i = "";
		t.pas.forEach((e, t) => {
			let a = xe(this.para(e).runs);
			i += (t ? " " : "") + a.slice(e === n.pa ? n.o : 0, e === r.pa ? r.o : a.length);
		}), i = i.replace(/\uFFFC/g, "").replace(/\s+/g, " ").trim();
		let a = this.paraPos(n), o = this.paraPos(r);
		return !a || !o || !i ? null : {
			a,
			f: o,
			quote: i.length > ur ? i.slice(0, 199) + "…" : i
		};
	}
	markComment(e, t) {
		let n = this.posOf(t.a), r = this.posOf(t.f);
		if (!n || !r) return !1;
		let i = {
			a: n,
			f: r
		}, a = this.selectedParas(i);
		if (!a) return !1;
		let o = !1, s = a.pas.map((t) => {
			let n = this.para(t), r = t === a.s.pa ? a.s.o : 0, i = t === a.e.pa ? a.e.o : O(n.runs);
			return i > r && (o = !0), this.withRuns(n, N(n.runs, r, i, e, !0));
		});
		return o ? (this.replace(a.pas, s, {
			a: a.e,
			f: a.e
		}, { label: "comment" }), !0) : !1;
	}
	commentPlaces() {
		let e = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map(), n = (e, n) => {
			let r = t.get(e);
			r !== void 0 && r.length >= ur || t.set(e, r === void 0 ? n : r + n);
		}, r = (i, a) => {
			let o = 0, s = /* @__PURE__ */ new Set();
			for (let c of i.runs) {
				if (c.t === "box") for (let e of c.blocks) e.t === "p" && r(e, a);
				if ((c.t === "text" || c.t === "img") && c.cm) for (let r of c.cm) e.has(r) || e.set(r, {
					pa: a,
					o,
					quote: ""
				}), !s.has(r) && t.has(r) && n(r, " "), s.add(r), c.t === "text" && n(r, c.text);
				o += c.t === "text" ? c.text.length : 1;
			}
		};
		this.st.blocks.forEach((e, t) => {
			e.t === "p" ? r(e, String(t)) : e.t === "tbl" && e.rows.forEach((e, n) => e.cells.forEach((e, i) => e.blocks.forEach((e, a) => e.t === "p" && r(e, `${t}.${n}.${i}.${a}`))));
		});
		for (let [n, r] of e) {
			let e = (t.get(n) ?? "").replace(/\s+/g, " ").trim();
			r.quote = e.length > ur ? e.slice(0, 199) + "…" : e;
		}
		return e;
	}
	locate(e) {
		let t = [];
		return this.st.blocks.forEach((n, r) => {
			n.t === "p" && n.pid === e ? t.push({
				list: this.st.blocks,
				index: r,
				pa: String(r)
			}) : n.t === "tbl" && n.rows.forEach((n, i) => n.cells.forEach((n, a) => n.blocks.forEach((o, s) => {
				o.t === "p" && o.pid === e && t.push({
					list: n.blocks,
					index: s,
					pa: `${r}.${i}.${a}.${s}`
				});
			})));
		}), t;
	}
	put(e, t) {
		let n = this.container(e);
		if (!n) return;
		let r = n.list[n.at];
		this.splice(e, 1, [t]), n.cell || (this.st.heights.set(t, this.st.heights.get(r) ?? 0), this.st.dirty.add(t));
	}
	applyResult(e, t) {
		if (this.input.isComposing) return !1;
		let n = !1, r = this.input.readSel(), i = /* @__PURE__ */ new Set();
		for (let [r, a] of Object.entries(e.blocks)) {
			let e = Number(r), o = this.locate(e), s = o.map((e) => e.list[e.index]), c = a.filter((e) => e.t === "p"), l = !1;
			for (let n of t) l ||= n.pid === e && s.length > 0 && !s.includes(n);
			l || (this.stale.delete(e), o.length && c.length === o.length && s.every((e) => t.has(e)) && (o.forEach((e, t) => {
				let n = s[t], r = {
					...c[t],
					from: n.from,
					orig: n.orig,
					pd: n.pd,
					edited: n.edited,
					keepSect: n.keepSect,
					ver: n.ver,
					pb: n.pb
				};
				this.put(e.pa, r), this.lookAt.set(r, this.styleGen), this.heir.set(n, r), i.add(e.pa);
			}), n = !0));
		}
		for (let [t, r] of Object.entries(e.markers)) for (let e of this.locate(Number(t))) {
			let t = e.list[e.index];
			e.list[e.index - 1]?.pid !== t.pid && (this.put(e.pa, {
				...t,
				marker: r ? {
					text: r.text,
					s: r.s,
					tab: r.tab
				} : void 0,
				lst: r?.lst
			}), n = !0);
		}
		return n ? (r && !this.pendingSel && (i.has(r.a.pa) || i.has(r.f.pa)) && (this.pendingSel = r), this.changed(), !0) : !1;
	}
	whereNow(e, t) {
		let n = e[0];
		if (!n) return t;
		if (n.t === "p") return n.pid === void 0 ? void 0 : this.locate(n.pid)[0]?.pa;
		if (n.t === "tbl") {
			let e = this.st.blocks.findIndex((e) => e.t === "tbl" && (n.tid !== void 0 && e.tid === n.tid || n.item !== void 0 && e.item === n.item));
			return e >= 0 ? String(e) : void 0;
		}
		return t;
	}
	keepCurrent(e, t, n) {
		let r = new Map(this.st.blocks.slice(t, t + n).flatMap((e) => e.t === "p" && e.pid !== void 0 ? [[e.pid, e]] : []));
		return e.map((e) => e.t === "p" && e.pid !== void 0 && r.has(e.pid) ? r.get(e.pid) : e);
	}
	undo() {
		let e = this.history.pop();
		if (!e) return;
		if (e.group) {
			for (let t of [...e.group].reverse()) {
				this.history.push(t);
				let e = this.future.length;
				this.undo(), this.future.length > e && this.future.pop();
			}
			this.future.push(e);
			return;
		}
		if (e.style && this.restyle(e.style.id, e.style.undo), e.page && this.repage(e.page.undo), e.hf && this.rehf(e.hf.undo), e.blocks) {
			let t = this.whereNow(e.blocks.after, String(e.blocks.bi));
			if (t === void 0) return;
			this.replaceBlocks(Number(t), e.blocks.after.length, this.keepCurrent(e.blocks.before, Number(t), e.blocks.after.length), e.selBefore, !1), this.future.push(e);
			return;
		}
		if (!e.pas.length) return this.styleOnly(e, this.future, e.selBefore);
		let t = this.whereNow(e.after, e.pas[0]);
		if (t === void 0) return;
		let n = e.after.map((e, n) => se(t, n));
		n.some((t, n) => this.para(t)?.pid !== e.after[n].pid) || (this.replace(n.length ? n : [t], e.before, Cr(e.selBefore, e.pas[0], t), {
			history: !1,
			label: "undo",
			want: !0
		}), this.future.push(e));
	}
	redo() {
		let e = this.future.pop();
		if (!e) return;
		if (e.group) {
			for (let t of e.group) {
				this.future.push(t);
				let e = this.history.length;
				this.redo(), this.history.length > e && this.history.pop();
			}
			this.history.push(e);
			return;
		}
		if (e.style && this.restyle(e.style.id, e.style.redo), e.page && this.repage(e.page.redo), e.hf && this.rehf(e.hf.redo), e.blocks) {
			let t = this.whereNow(e.blocks.before, String(e.blocks.bi));
			if (t === void 0) return;
			this.replaceBlocks(Number(t), e.blocks.before.length, this.keepCurrent(e.blocks.after, Number(t), e.blocks.before.length), e.selAfter, !1), this.history.push(e);
			return;
		}
		if (!e.pas.length) return this.styleOnly(e, this.history, e.selAfter);
		let t = this.whereNow(e.before, e.pas[0]);
		if (t === void 0) return;
		let n = e.before.map((e, n) => se(t, n));
		n.some((t, n) => this.para(t)?.pid !== e.before[n].pid) || (this.replace(n, e.after, Cr(e.selAfter, e.pas[0], t), {
			history: !1,
			label: "redo",
			want: !0
		}), this.history.push(e));
	}
	styleOnly(e, t, n) {
		t.push(e), this.emitState(this.input.sel() ?? n);
	}
	get canUndo() {
		return this.history.length > 0;
	}
	get canRedo() {
		return this.future.length > 0;
	}
	pendingStyle() {
		return this.pend ? {
			s: this.pend.s,
			d: this.pend.d
		} : void 0;
	}
	clearPending() {
		this.pend = null;
	}
	selectedParas(e) {
		let [t, n] = M(this, e), r = t.pa === n.pa ? this.para(t.pa) ? [t.pa] : null : this.span(t.pa, n.pa);
		return r ? {
			pas: r,
			s: t,
			e: n
		} : null;
	}
	format(e, t, n = {}) {
		let r = this.input.sel();
		if (!r) return;
		if (P(r)) {
			this.pend = {
				s: {
					...this.pend?.s ?? {},
					...e
				},
				d: {
					...this.pend?.d ?? {},
					...t
				},
				at: r.a
			}, this.input.restore(r), this.emitState(r);
			return;
		}
		let i = this.selectedParas(r);
		if (!i) return;
		let a = i.pas.map((n, r) => {
			let a = this.para(n), o = r === 0 ? i.s.o : 0, s = r === i.pas.length - 1 ? i.e.o : O(a.runs);
			return this.withRuns(a, he(a.runs, o, s, e, t));
		});
		this.replace(i.pas, a, r, {
			label: "format",
			want: n.want
		});
	}
	toggle(e) {
		let t = this.state(), n = !(t && t[e]);
		e === "u" ? this.format({ u: n ? "single" : "none" }, { u: n ? "single" : "none" }) : this.format({ [e]: n }, { [e]: n });
	}
	setFont(e) {
		this.format({ font: i(e) }, { font: e });
	}
	setSize(e) {
		this.format({ sz: e }, { sz: e });
	}
	setColor(e) {
		this.format({ color: e ?? void 0 }, { color: e });
	}
	setHighlight(e) {
		this.format({
			hl: e ?? void 0,
			shd: void 0
		}, { hl: e });
	}
	clearFormat() {
		this.format({
			b: !1,
			i: !1,
			u: "none",
			strike: !1,
			hl: void 0
		}, {
			b: !1,
			i: !1,
			u: "none",
			strike: !1,
			color: null,
			hl: null,
			va: null
		}, { want: !0 });
	}
	setPara(e, t = {}, n = this.input.sel()) {
		if (!n) return;
		let r = this.selectedParas(n);
		if (!r) return;
		let i = r.pas.map((n) => {
			let r = this.para(n), i = {
				...r.pd ?? {},
				...e
			};
			return {
				...r,
				pd: i,
				ps: {
					...r.ps,
					...t
				},
				edited: !0,
				sid: e.style ?? r.sid
			};
		});
		this.replace(r.pas, i, n, {
			label: "para",
			want: !0
		});
	}
	toggleList(e) {
		let t = this.input.sel();
		if (!t) return;
		let n = this.selectedParas(t);
		if (!n) return;
		let r = n.pas.every((t) => wr(this.para(t)) === e);
		this.setPara({
			list: r ? "none" : e,
			ilvl: r ? void 0 : 0
		}, {}, t);
	}
	indent(e, t = this.input.sel()) {
		if (!t) return;
		let n = this.selectedParas(t);
		if (!n) return;
		let r = n.pas.map((t) => {
			let n = this.para(t), r = { ...n.pd ?? {} };
			return wr(n) ? r.ilvl = Math.max(0, Math.min(8, Tr(n) + e)) : r.indL = Math.max(0, (n.ps.indL ?? 0) + e * 36), {
				...n,
				pd: r,
				ps: wr(n) ? n.ps : {
					...n.ps,
					indL: r.indL
				},
				edited: !0
			};
		});
		this.replace(n.pas, r, t, {
			label: "para",
			want: !0
		});
	}
	tab(e, t) {
		if (e.f.pa.includes(".")) {
			let [n, r, i] = e.f.pa.split(".").map(Number), a = this.st.blocks[n].rows.flatMap((e, t) => e.cells.map((e, n) => [t, n])), o = a.findIndex(([e, t]) => e === r && t === i) + (t ? -1 : 1);
			if (o >= a.length && !t) return this.tableOp("rowBelow"), !0;
			let [s, c] = a[Math.max(0, o)], l = `${n}.${s}.${c}.0`, u = this.para(l);
			return this.input.restore({
				a: {
					pa: l,
					o: 0
				},
				f: {
					pa: l,
					o: u ? O(u.runs) : 0
				}
			}), !0;
		}
		return wr(this.para(e.a.pa)) ? (this.indent(t ? -1 : 1, e), !0) : !1;
	}
	backspaceAtStart(e, t) {
		return wr(t) ? (this.setPara({ list: "none" }, {}, {
			a: {
				pa: e,
				o: 0
			},
			f: {
				pa: e,
				o: 0
			}
		}), !0) : !1;
	}
	enterAtEmpty(e, t) {
		if (!wr(t)) return !1;
		let n = {
			a: {
				pa: e,
				o: 0
			},
			f: {
				pa: e,
				o: 0
			}
		};
		return Tr(t) > 0 ? this.indent(-1, n) : this.setPara({ list: "none" }, {}, n), !0;
	}
	arrow(e, t) {
		if (t !== 1 || !e.a.pa.includes(".")) return !1;
		let [n, r, i, a] = pr(e.a.pa), o = this.st.blocks[n], s = this.para(e.a.pa);
		if (o?.t !== "tbl" || !s || e.a.o < O(s.runs) || r !== o.rows.length - 1) return !1;
		let c = o.rows[r];
		if (i !== c.cells.length - 1 || a !== c.cells[i].blocks.length - 1) return !1;
		let l = String(n + 1);
		if (!this.para(l)) return !1;
		let u = {
			a: {
				pa: l,
				o: 0
			},
			f: {
				pa: l,
				o: 0
			}
		};
		return this.input.restore(u) || (this.pendingSel = u), !0;
	}
	copy(e, t, n) {
		let [r, i] = M(this, e), a = r.pa === i.pa ? this.para(r.pa) ? [r.pa] : null : this.span(r.pa, i.pa);
		if (!a) return !1;
		let o = a.map((e, t) => {
			let n = this.para(e);
			return {
				...n,
				runs: hr(n, t === 0 ? r.o : 0, t === a.length - 1 ? i.o : O(n.runs))
			};
		});
		return !o.some((e) => e.runs.some((e) => e.t !== "text")) && (t.setData("text/html", An(o)), t.setData("text/plain", gn(o).replace(/\n$/, "")), n && j(this, e), !0);
	}
	contentW = 468;
	defaultFont;
	defaultSz;
	prevParaPid(e) {
		for (let t = e - 1; t >= 0; t--) {
			let e = this.st.blocks[t];
			if (e.t === "p" && e.pid !== void 0) return e.pid;
		}
	}
	commitTable(e) {
		let t = this.st.blocks[e];
		t?.t === "tbl" && t.tid !== void 0 && this.send("docx.table", {
			tid: t.tid,
			item: t.item,
			anchor: t.item === void 0 ? this.prevParaPid(e) : void 0,
			spec: pn(t)
		});
	}
	send(e, t) {
		this.inflight++, this.client.call(e, t).then((t) => e === "docx.edit" && this.applyResult(t, /* @__PURE__ */ new Set())).catch((e) => console.error("[office-engine] edit failed", e)).finally(() => this.inflight--);
	}
	replaceBlocks(e, t, n, r, i = !0) {
		let a = this.st.blocks.slice(e, e + t);
		this.st.blocks.splice(e, t, ...n), n.forEach((e, t) => {
			this.st.heights.set(e, this.st.heights.get(a[t] ?? a[0]) ?? 0), this.st.dirty.add(e);
		}), e < this.st.frontier && (this.st.frontier = Math.max(0, this.st.frontier + n.length - t));
		let o = (e) => e.t === "tbl" ? `t${e.tid ?? "i" + e.item}` : e.t === "p" ? `p${e.pid}` : "", s = new Set(n.map(o)), c = new Set(a.map(o)), l = [...a, ...n].find((e) => e.t === "p" && e.pid !== void 0 && c.has(o(e)) && s.has(o(e))), u = n.filter((e) => e.t === "p" && e.pid !== void 0 && !c.has(o(e))), d = a.filter((e) => e.t === "p" && e.pid !== void 0 && !s.has(o(e))), f = new Map(a.map((e) => [o(e), e])), p = n.some((e) => e.t === "p" && e.pid !== void 0 && f.has(o(e)) && f.get(o(e)) !== e);
		if (l && (u.length || d.length || p)) {
			let e = n.filter((e) => e.t === "p" && e.pid !== void 0);
			this.send("docx.edit", {
				anchor: l.pid,
				list: e.map((e) => fn([e])),
				remove: d.map((e) => e.pid)
			});
		}
		for (let e of a) e.t !== "tbl" || s.has(o(e)) || e.tid === void 0 && e.item === void 0 || this.send("docx.table", {
			tid: e.tid ?? -1,
			item: e.item,
			spec: null
		});
		if (n.forEach((t, n) => {
			t.t === "tbl" && (t.tid === void 0 && !c.has(o(t)) && (this.st.blocks[e + n] = {
				...t,
				tid: this.nextPid++
			}), this.commitTable(e + n));
		}), this.onCommit?.({
			kind: "blocks",
			bi: e,
			before: a,
			next: n
		}), i || this.catchUp(), i) {
			let t = r ?? this.input.lastSel ?? {
				a: {
					pa: String(e),
					o: 0
				},
				f: {
					pa: String(e),
					o: 0
				}
			};
			this.history.push({
				pas: [],
				before: [],
				after: [],
				blocks: {
					bi: e,
					before: a,
					after: n
				},
				selBefore: this.input.lastSel ?? t,
				selAfter: t,
				label: "table",
				t: Date.now()
			}), this.future = [];
		}
		r && (this.pendingSel = r), this.onDirty?.(), this.changed();
	}
	emptyPara(e) {
		return {
			t: "p",
			ps: {
				...e.ps,
				indFirst: void 0,
				indL: void 0
			},
			runs: [],
			markSz: e.markSz,
			markFont: e.markFont,
			pid: this.nextPid++,
			from: e.from ?? e.pid,
			orig: [],
			edited: !0,
			keepSect: !1,
			pd: {
				style: "",
				list: "none"
			},
			sid: void 0
		};
	}
	insertTable(e, t) {
		let n = this.input.sel(), r = n ? Number(n.f.pa.split(".")[0]) : -1, i = this.st.blocks[r];
		if (!n || n.f.pa.includes(".") || i?.t !== "p" || i.pid === void 0) return;
		let a = [i, {
			...Vn(e, t, this.contentW, () => this.emptyPara(i)),
			tid: this.nextPid++
		}], o = this.st.blocks[r + 1];
		o && o.t === "p" || a.push(this.emptyPara(i)), this.replaceBlocks(r, 1, a, {
			a: {
				pa: `${r + 1}.0.0.0`,
				o: 0
			},
			f: {
				pa: `${r + 1}.0.0.0`,
				o: 0
			}
		});
	}
	tableOp(e) {
		let t = this.input.sel();
		if (!t || !t.f.pa.includes(".")) return;
		let [n, r, i] = t.f.pa.split(".").map(Number), a = this.st.blocks[n];
		if (a?.t !== "tbl") return;
		let o = Pn(a).cells.find((e) => e.ri === r && e.ci === i)?.g ?? 0, s = (e) => {
			let t = e.blocks.find((e) => e.t === "p") ?? this.st.blocks.find((e) => e.t === "p" && e.pid !== void 0);
			return {
				...this.emptyPara(t),
				pd: {},
				ps: t.ps,
				sid: t.sid
			};
		}, c = a, l = `${n}.${r}.${i}.0`;
		switch (e) {
			case "rowAbove":
				c = Ln(a, r, !1, s), l = `${n}.${r}.0.0`;
				break;
			case "rowBelow":
				c = Ln(a, r, !0, s), l = `${n}.${r + 1}.0.0`;
				break;
			case "colLeft":
				c = zn(a, o, !1, s);
				break;
			case "colRight":
				c = zn(a, o, !0, s), l = `${n}.${r}.${i + 1}.0`;
				break;
			case "delRow":
				c = Rn(a, r), l = `${n}.${Math.max(0, Math.min(r, (c?.rows.length ?? 1) - 1))}.0.0`;
				break;
			case "delCol":
				c = Bn(a, o), l = `${n}.${r}.${Math.max(0, i - 1)}.0`;
				break;
			case "delTable": c = null;
		}
		if (c) c = {
			...c,
			tid: a.tid ?? this.nextPid++
		}, this.replaceBlocks(n, 1, [c], {
			a: {
				pa: l,
				o: 0
			},
			f: {
				pa: l,
				o: 0
			}
		});
		else {
			let e = this.st.blocks[n + 1];
			this.replaceBlocks(n, 1, [], e?.t === "p" ? {
				a: {
					pa: String(n),
					o: 0
				},
				f: {
					pa: String(n),
					o: 0
				}
			} : null);
		}
	}
	cellRange(e = this.input.sel()) {
		if (!e) return null;
		let t = pr(e.a.pa), n = pr(e.f.pa);
		if (t.length < 4 || n.length < 4 || t[0] !== n[0]) return null;
		let r = this.st.blocks[t[0]];
		if (r?.t !== "tbl") return null;
		let i = Un(r, [t[1], t[2]], [n[1], n[2]]);
		return i ? {
			bi: t[0],
			t: r,
			rect: i,
			cells: Wn(r, i).length
		} : null;
	}
	putTable(e, t, n, r, i) {
		let a = Pn(n).at(r, i), o = `${e}.${a?.ri ?? r}.${a?.ci ?? 0}.0`;
		this.replaceBlocks(e, 1, [{
			...n,
			tid: t.tid ?? this.nextPid++
		}], {
			a: {
				pa: o,
				o: 0
			},
			f: {
				pa: o,
				o: 0
			}
		});
	}
	mergeCells() {
		let e = this.cellRange();
		if (!e) return !1;
		let t = Kn(e.t, e.rect);
		return t ? (this.putTable(e.bi, e.t, t, e.rect.r0, e.rect.g0), !0) : !1;
	}
	unmergeCell() {
		let e = this.input.sel();
		if (!e || !e.f.pa.includes(".")) return !1;
		let [t, n, r] = pr(e.f.pa), i = this.st.blocks[t];
		if (i?.t !== "tbl") return !1;
		let a = Pn(i).cells.find((e) => e.ri === n && e.ci === r)?.g ?? 0, o = qn(i, n, r, (e) => {
			let t = e.blocks.find((e) => e.t === "p") ?? this.st.blocks.find((e) => e.t === "p" && e.pid !== void 0);
			return {
				...this.emptyPara(t),
				pd: {},
				ps: t.ps,
				sid: t.sid
			};
		});
		return o ? (this.putTable(t, i, o, n, a), !0) : !1;
	}
	setCellBorders(e, t = "0.5pt solid #000000") {
		let n = this.cellRange();
		n && this.putTable(n.bi, n.t, Xn(n.t, n.rect, e, t), n.rect.r0, n.rect.g0);
	}
	setCellShade(e) {
		let t = this.cellRange();
		t && this.putTable(t.bi, t.t, Zn(t.t, t.rect, (t) => ({
			...t,
			shd: e ?? void 0,
			set: {
				...t.set,
				shd: !0
			}
		})), t.rect.r0, t.rect.g0);
	}
	setCellVAlign(e) {
		let t = this.cellRange();
		t && this.putTable(t.bi, t.t, Zn(t.t, t.rect, (t) => ({
			...t,
			vAlign: e === "top" ? void 0 : e,
			set: {
				...t.set,
				vAlign: !0
			}
		})), t.rect.r0, t.rect.g0);
	}
	distributeColumns() {
		let e = this.cellRange();
		e && this.putTable(e.bi, e.t, Qn(e.t, e.cells > 1 ? e.rect : void 0), e.rect.r0, e.rect.g0);
	}
	setColumnWidths(e, t) {
		let n = this.st.blocks[e];
		n?.t !== "tbl" || t.length !== n.cols.length || t.some((e) => !(e > 0)) || this.replaceBlocks(e, 1, [{
			...n,
			cols: t.map((e) => +e.toFixed(2)),
			tid: n.tid ?? this.nextPid++
		}], this.input.lastSel);
	}
	async insertImages(e, t) {
		let n = t ?? this.input.sel();
		if (!n) return;
		let r = [];
		for (let t of e) {
			let e = (t.type.split("/")[1] ?? "png").replace("svg+xml", "svg").replace("jpeg", "jpg"), { rid: n, path: i } = await this.client.call("docx.image", await t.arrayBuffer(), e), a = await Or(t), o = Math.min(1, this.contentW / Math.max(1, a.w * .75));
			r.push({
				t: "img",
				target: i,
				w: +(a.w * .75 * o).toFixed(1),
				h: +(a.h * .75 * o).toFixed(1),
				rid: n
			});
		}
		_e(this, n, [r], { label: "image" });
	}
	async setLink(e, t = this.input.sel()) {
		let n = t;
		if (!n) return;
		let r = n, i = P(n) ? ce(this.para(n.a.pa)?.runs ?? [], n.a.o) : null;
		if (i && (n = {
			a: {
				pa: n.a.pa,
				o: i[0]
			},
			f: {
				pa: n.a.pa,
				o: i[1]
			}
		}), !e) {
			this.patchRuns(n, (e) => ({
				...e,
				href: void 0,
				lk: void 0
			}), r);
			return;
		}
		let a = /^[a-z][\w+.-]*:/i.test(e.trim()) || e.startsWith("#") ? e.trim() : "https://" + e.trim(), o = await this.client.call("docx.link", a), s = {
			color: "#0563c1",
			u: "single"
		};
		P(n) && !i ? _e(this, n, [[{
			t: "text",
			text: e,
			href: a,
			lk: o,
			s: {
				...pe(this.para(n.a.pa)?.runs ?? [], n.a.o)?.s ?? {},
				...s
			},
			d: s
		}]], { label: "link" }) : this.patchRuns(n, (e) => ({
			...e,
			href: a,
			lk: o,
			s: {
				...e.s ?? {},
				...s
			},
			d: {
				...e.d ?? {},
				...s
			}
		}), r);
	}
	patchRuns(e, t, n = e) {
		let r = this.selectedParas(e);
		if (!r) return;
		let i = r.pas.map((e, n) => {
			let i = this.para(e), a = n === 0 ? r.s.o : 0, o = n === r.pas.length - 1 ? r.e.o : O(i.runs), [s, c] = be(i.runs, a), [l, u] = be(c, o - a);
			return this.withRuns(i, [
				...s,
				...l.map((e) => e.t === "text" ? t(e) : e),
				...u
			]);
		});
		this.replace(r.pas, i, n, { label: "format" });
	}
	insertPageBreak() {
		let e = this.input.sel();
		if (!e) return;
		let t = this.para(e.f.pa);
		if (!t || e.f.pa.includes(".")) return;
		let [n, r] = be(t.runs, e.f.o), [i, a] = this.split(t, n, r, !1), o = {
			...a,
			pb: !0,
			pd: {
				...a.pd ?? {},
				pageBreak: !0
			}
		};
		this.replace([e.f.pa], [i, o], {
			a: {
				pa: se(e.f.pa, 1),
				o: 0
			},
			f: {
				pa: se(e.f.pa, 1),
				o: 0
			}
		}, {
			label: "pagebreak",
			want: !0
		});
	}
	resizeImage(e) {
		let t = this.input.sel();
		if (!t) return;
		let [n] = M(this, t);
		this.patchObjects(t, (t) => {
			if (t.t !== "img") return t;
			let n = e === "fit" ? this.contentW / t.w : e;
			return {
				...t,
				w: +(t.w * n).toFixed(1),
				h: +(t.h * n).toFixed(1),
				resized: !0
			};
		}), this.pendingSel = {
			a: n,
			f: {
				...n,
				o: n.o + 1
			}
		};
	}
	patchObjects(e, t) {
		let [n, r] = M(this, e), i = this.para(n.pa);
		if (!i || n.pa !== r.pa) return;
		let [a, o] = be(i.runs, n.o), [s, c] = be(o, r.o - n.o);
		this.replace([n.pa], [this.withRuns(i, [
			...a,
			...s.map(t),
			...c
		])], e, { label: "image" });
	}
	pasteRich(e, t) {
		let n = Array.from(t.files ?? []).filter((e) => e.type.startsWith("image/"));
		if (n.length) return this.insertImages(n, e), !0;
		let r = t.getData("text/html");
		if (!r) return !1;
		let i = e.a.pa.includes(".") || e.f.pa.includes("."), a = f(r, !0, { tables: !i });
		return a.length ? (this.pasteItems(e, a).catch((e) => console.error("[office-engine] paste failed", e)), !0) : !1;
	}
	async resolvePasted(e) {
		let t = /* @__PURE__ */ new Map(), n = [], r = (e) => e.forEach((e) => {
			n.push(e), e.table?.forEach((e) => e.forEach((e) => r(e.paras)));
		});
		r(e);
		for (let e of n) {
			let n = [];
			for (let r of e.runs) if (r.t === "text" && r.href) {
				t.has(r.href) || t.set(r.href, await this.client.call("docx.link", r.href).catch(() => void 0));
				let e = t.get(r.href);
				n.push(e ? {
					...r,
					lk: e
				} : {
					...r,
					href: void 0
				});
			} else if (r.t === "img") {
				let e = Dr(r.target);
				if (!e) continue;
				let t = (e.type.split("/")[1] ?? "png").replace("svg+xml", "svg").replace("jpeg", "jpg"), { rid: i, path: a } = await this.client.call("docx.image", await e.arrayBuffer(), t), o = r.w && r.h ? {
					w: r.w / .75,
					h: r.h / .75
				} : await Or(e), s = Math.min(1, this.contentW / Math.max(1, o.w * .75));
				n.push({
					...r,
					target: a,
					rid: i,
					w: +(o.w * .75 * s).toFixed(1),
					h: +(o.h * .75 * s).toFixed(1)
				});
			} else n.push(r);
			e.runs = n;
		}
	}
	async pasteItems(e, t) {
		if (await this.resolvePasted(t), t.some((e) => e.table) && !P(e)) {
			let [t] = M(this, e);
			j(this, e), e = {
				a: t,
				f: t
			};
		}
		let n = e;
		for (let e = 0; e < t.length;) {
			if (t[e].table) {
				let r = this.pasteTable(n, t[e].table);
				r && (n = r), e++;
				continue;
			}
			let r = e;
			for (; r < t.length && !t[r].table;) r++;
			this.pasteParas(n, t.slice(e, r)), n = this.pendingSel ?? n, e = r;
		}
	}
	pasteParas(e, t) {
		let n = t.map((e) => e.runs), r = (e) => this.styles.find((t) => t.name.toLowerCase() === `heading ${e}`)?.id, i = t.map((e, n) => {
			let i = !e.list && n > 0 && !!t[n - 1].list;
			if (e.heading || e.list || i) return (t) => {
				let n = { ...t.pd ?? {} }, a = e.heading ? r(e.heading) : void 0;
				return a && (n.style = a), e.list ? (n.list = e.list, e.level ? n.ilvl = e.level : delete n.ilvl) : i && (n.list = "none"), {
					...t,
					pd: n,
					sid: a ?? t.sid,
					edited: !0
				};
			};
		});
		_e(this, e, n, { label: "paste" }, i);
	}
	pasteTable(e, t) {
		let [n] = M(this, e), r = Number(n.pa), i = this.para(n.pa);
		if (!t.length || n.pa.includes(".") || !i || i.pid === void 0) return null;
		let a = () => this.emptyPara(i), o = (e) => e.filter((e) => !e.table).map((e) => ({
			...a(),
			runs: e.runs,
			edited: !0
		})), s = {
			...Hn(t.map((e) => e.map((e) => ({
				blocks: o(e.paras),
				colSpan: e.colSpan,
				rowSpan: e.rowSpan
			}))), this.contentW, a),
			tid: this.nextPid++
		}, [c, l] = be(i.runs, n.o), u, d;
		if (!O(c) && this.prevParaPid(r) !== void 0) u = [s, i], d = String(r + 1);
		else {
			let [e, t] = this.split(i, c, l, !1);
			u = [
				e,
				s,
				t
			], d = String(r + 2);
		}
		let f = {
			a: {
				pa: d,
				o: 0
			},
			f: {
				pa: d,
				o: 0
			}
		};
		return this.replaceBlocks(r, 1, u, f), f;
	}
	async applyCanon(e) {
		let t = this.input.sel();
		if (!t) return;
		let n = this.styles.find((t) => t.canon === e)?.id, r = null;
		n || (n = await this.canonId(e), r = this.input.readSel()), n && (this.setPara({ style: n }, {}, t), r && (this.pendingSel = r));
	}
	async canonId(e) {
		let t = this.styles.find((t) => t.canon === e)?.id;
		if (t) return t;
		let n = await this.client.call("docx.style", e);
		if (n) return this.styled(n), n.id || void 0;
	}
	taken = /* @__PURE__ */ new WeakSet();
	styleGen = 0;
	changedAt = /* @__PURE__ */ new Map();
	lookAt = /* @__PURE__ */ new WeakMap();
	passing = !1;
	heir = /* @__PURE__ */ new WeakMap();
	latest(e) {
		for (let t = this.heir.get(e); t; t = this.heir.get(e)) e = t;
		return e;
	}
	styled(e) {
		if (!this.taken.has(e) && (this.taken.add(e), this.styles = e.styles, this.onStyles?.(e.styles), e.changed?.length)) {
			e.headers && this.onHeaders?.(e.headers), this.styleGen++;
			for (let t of e.changed) this.changedAt.set(t, this.styleGen);
			this.onDirty?.(), this.catchUp();
		}
	}
	onPage;
	pageNow;
	paged(e) {
		this.taken.has(e) || (this.taken.add(e), this.pageNow = e.page, this.onPage?.(e.page), this.onDirty?.());
	}
	async setPage(e) {
		if (!Object.keys(e).length) return;
		let t = await this.client.call("docx.page", e);
		if (!t) return;
		this.paged(t);
		let n = this.input.lastSel ?? {
			a: {
				pa: "0",
				o: 0
			},
			f: {
				pa: "0",
				o: 0
			}
		};
		return this.history.push({
			pas: [],
			before: [],
			after: [],
			selBefore: n,
			selAfter: n,
			label: "page",
			t: Date.now(),
			page: {
				undo: t.undo,
				redo: e
			}
		}), this.future = [], this.emitState(this.input.sel() ?? n), t;
	}
	tracking = !1;
	author = () => "Me";
	onTracking;
	setTracking(e) {
		this.tracking = e, this.onTracking?.(e), this.emitState(this.input.sel());
	}
	allParas() {
		let e = [];
		return this.st.blocks.forEach((t, n) => {
			t.t === "p" ? t.pid !== void 0 && !t.ro && e.push({
				pa: String(n),
				p: t
			}) : t.t === "tbl" && t.rows.forEach((t, r) => t.cells.forEach((t, i) => t.blocks.forEach((t, a) => t.t === "p" && t.pid !== void 0 && !t.ro && e.push({
				pa: `${n}.${r}.${i}.${a}`,
				p: t
			}))));
		}), e;
	}
	changeCount() {
		return this.allParas().reduce((e, t) => e + lr(t.p).length, 0);
	}
	review(e, t = !1) {
		let n = e ? "accept" : "reject", r = 0;
		if (t) {
			let t = this.allParas().filter((e) => cr(e.p)), i = [];
			for (let e of t) {
				let t = i[i.length - 1], n = t?.[t.length - 1];
				n && !n.pa.includes(".") && !e.pa.includes(".") && Number(e.pa) === Number(n.pa) + 1 ? t.push(e) : i.push([e]);
			}
			let a = this.history.length;
			for (let t of i) {
				let i = t.map(({ p: t }) => ({
					...t,
					runs: sr(t.runs, 0, O(t.runs), e),
					edited: !0
				}));
				r += t.reduce((e, t) => e + lr(t.p).length, 0), this.replace(t.map((e) => e.pa), i, {
					a: {
						pa: t[0].pa,
						o: 0
					},
					f: {
						pa: t[0].pa,
						o: 0
					}
				}, {
					label: n,
					want: !0,
					remount: !0
				});
			}
			let o = this.history.splice(Math.min(a, this.history.length));
			return o.length && this.history.push(o.length > 1 ? {
				...o[o.length - 1],
				group: o
			} : o[0]), r;
		}
		let i = this.input.sel();
		if (!i) return 0;
		let [a, o] = M(this, i), s = this.span(a.pa, o.pa);
		if (!s) return 0;
		let c = s.map((t, n) => {
			let i = this.para(t), c = n === 0 ? a.o : 0, l = n === s.length - 1 ? o.o : O(i.runs);
			if (s.length === 1 && c === l) {
				let e = lr(i).find((e) => e.a <= c && c <= e.b && (e.a < c || c < e.b || e.b > e.a));
				if (!e) return i;
				c = e.a, l = e.b;
			}
			return r += lr({
				...i,
				runs: hr(i, c, l)
			}).length, {
				...i,
				runs: sr(i.runs, c, l, e),
				edited: !0
			};
		});
		return r ? (this.replace(s, c, {
			a,
			f: a
		}, {
			label: n,
			want: !0,
			remount: !0
		}), r) : 0;
	}
	gotoChange(e) {
		let t = this.allParas(), n = this.input.sel(), [r, i] = n ? M(this, n) : [null, null], a = (e > 0 ? i : r) ?? {
			pa: e > 0 ? "0" : String(this.st.blocks.length),
			o: 0
		}, o = t.flatMap((e) => lr(e.p).map((t) => ({
			pa: e.pa,
			...t
		}))), s = (t) => {
			let n = this.cmp(t.pa, a.pa);
			return e > 0 ? n > 0 || n === 0 && t.a >= a.o && !(r && t.pa === r.pa && t.a === r.o && i && t.b === i.o) : n < 0 || n === 0 && t.b <= a.o && !(r && t.pa === r.pa && t.a === r.o);
		}, c = e > 0 ? o.find(s) : [...o].reverse().find(s);
		if (!c) return !1;
		let l = {
			a: {
				pa: c.pa,
				o: c.a
			},
			f: {
				pa: c.pa,
				o: c.b
			}
		};
		return this.pendingSel = l, this.input.lastSel = l, this.changed(), this.emitState(l), !0;
	}
	onHF;
	hfNow;
	hfed(e) {
		this.taken.has(e) || (this.taken.add(e), this.hfNow = {
			headers: e.headers,
			titlePg: e.titlePg
		}, this.onHF?.(this.hfNow), this.onDirty?.());
	}
	async setHeaderFooter(e) {
		if (!e.parts && !e.raw && e.titlePg === void 0) return;
		let t = await this.client.call("docx.hf", e);
		if (!t) return;
		this.hfed(t);
		let n = this.input.lastSel ?? {
			a: {
				pa: "0",
				o: 0
			},
			f: {
				pa: "0",
				o: 0
			}
		};
		return this.history.push({
			pas: [],
			before: [],
			after: [],
			selBefore: n,
			selAfter: n,
			label: "header",
			t: Date.now(),
			hf: {
				undo: t.undo,
				redo: e
			}
		}), this.future = [], this.emitState(this.input.sel() ?? n), t;
	}
	rehf(e) {
		this.client.call("docx.hf", e).then((e) => e && this.hfed(e)).catch((e) => console.error("[office-engine] header / footer change failed", e));
	}
	repage(e) {
		this.client.call("docx.page", e).then((e) => e && this.paged(e)).catch((e) => console.error("[office-engine] page setup failed", e));
	}
	async setStyle(e, t) {
		let n = await this.client.call("docx.styleSet", e, t);
		return n && this.styled(n), n;
	}
	restyle(e, t) {
		this.setStyle(e, t).catch((e) => console.error("[office-engine] style change failed", e));
	}
	async updateStyle(e) {
		let t = this.input.sel(), n = t && this.selectedParas(t), r = n && this.container(n.s.pa), i = n && this.para(n.s.pa);
		if (!t || !n || !r || !i) return;
		let a = n.pas.map((e) => this.para(e)), o = e.startsWith("@") ? await this.canonId(e.slice(1)) : e;
		if (!o) return;
		let s = this.partsOf(r.list, i.pid, r.at), c = ((await this.client.call("docx.convert", [fn(s)], !0))?.[0] ?? []).filter((e) => e.t === "p")[s.indexOf(i)];
		if (!c || O(c.runs) !== O(i.runs)) return;
		let l = P(t) ? n.s.o : n.s.o + +(O(i.runs) > n.s.o), u = pe(c.runs, l), d = {
			...yr(c.ps),
			...u ? {
				...vr(u.s),
				font: xr(u.s.font)
			} : {
				sz: c.markSz,
				font: xr(c.markFont)
			}
		}, f = await this.setStyle(o, d);
		if (!f || f.missing) return;
		let p = f.changed.length ? {
			id: o,
			undo: f.undo,
			redo: d
		} : void 0, m = () => {
			let e = this.latest(i), t = this.locate(i.pid).find((t) => t.list[t.index] === e)?.pa, n = t === void 0 ? [] : a.map((e, n) => se(t, n));
			return n.length > 0 && n.every((e, t) => this.para(e) === this.latest(a[t])) ? n : null;
		}, h = () => p ? (this.history.push({
			pas: [],
			before: [],
			after: [],
			selBefore: t,
			selAfter: t,
			label: "style",
			t: Date.now(),
			style: p
		}), this.future = [], this.emitState(this.input.sel()), !0) : !1;
		if (!m()) return h();
		if (!p && a.every((e) => e.sid === o)) return !1;
		let g = a.map((e) => this.latest(e)), _ = vr(pe(i.runs, l)?.s), v = yr(i.ps), y = g.map((e) => ({
			...e,
			pd: {
				...e.pd ?? {},
				style: o
			},
			sid: o,
			edited: !0
		})), b = y.map((e) => {
			let t = { ...e.pd }, n = yr(e.ps);
			for (let e of _r) d[e] !== void 0 && n[e] === v[e] && (t[e] = null);
			let r = e.runs.map((e) => {
				if (e.t !== "text" || !u) return e;
				let t = vr(e.s), n = { ...e.d ?? {} };
				for (let e of gr) t[e] === _[e] && (n[e] = null);
				return {
					...e,
					d: n
				};
			});
			return {
				...e,
				pd: t,
				runs: r
			};
		}), x = await this.client.call("docx.convert", [...y, ...b].map((e) => fn([e]))), S = m();
		if (!S) return h();
		let C = (e) => (x?.[e] ?? []).find((e) => e.t === "p"), w = y.map((e, t) => {
			let n = C(t), r = C(t + y.length);
			if (!n || !r) return e;
			let i = br(n), a = br(r), o = 0, s = e.runs.map((e, n) => {
				let r = o;
				o += le(e);
				for (let t = r; t < o; t++) if (i[t] !== a[t]) return e;
				return b[t].runs[n];
			}), c = JSON.stringify(yr(n.ps)) === JSON.stringify(yr(r.ps)) ? b[t].pd : e.pd;
			return {
				...e,
				pd: c,
				runs: ge(s)
			};
		});
		return this.replace(S, w, this.input.sel() ?? t, {
			label: "style",
			want: !0
		}), p && (this.history[this.history.length - 1].style = p), !!p;
	}
	behind(e, t) {
		let n = this.changedAt.get(e.sid || t);
		return n !== void 0 && (this.lookAt.get(e) ?? 0) < n;
	}
	groups() {
		let e = [], t = (t, n) => {
			let r;
			t.forEach((t, i) => {
				if (t.t !== "p" || t.pid === void 0) return void (r = void 0);
				r && r.pid === t.pid ? e[e.length - 1].parts.push(t) : e.push({
					pa: n(i),
					parts: [t]
				}), r = t;
			});
		};
		return t(this.st.blocks, String), this.st.blocks.forEach((e, n) => {
			e.t === "tbl" && e.rows.forEach((e, r) => e.cells.forEach((e, i) => t(e.blocks, (e) => `${n}.${r}.${i}.${e}`)));
		}), e;
	}
	catchUp() {
		this.changedAt.size && !this.passing && (this.passing = !0, this.pass().catch((e) => console.error("[office-engine] restyle failed", e)));
	}
	async pass() {
		try {
			let e = /* @__PURE__ */ new Map(), t = performance.now();
			for (;;) {
				performance.now() - t > 40 && (await new Promise((e) => setTimeout(e, 0)), t = performance.now());
				let n = this.styleGen, r = this.styles.find((e) => e.canon === "normal")?.id ?? "", i = this.groups().filter((t) => t.parts.some((e) => this.behind(e, r)) && (e.get(t.parts[0].pid) ?? 0) < 3).slice(0, 200);
				if (!i.length) return;
				let a = await this.client.call("docx.convert", i.map((e) => fn(e.parts)));
				for (; this.input.isComposing;) await new Promise((e) => setTimeout(e, 50));
				if (n !== this.styleGen) {
					e.clear();
					continue;
				}
				let o = new Map(this.groups().map((e) => [e.parts[0], e])), s = this.input.readSel(), c = !1, l = !1;
				for (let [t, r] of i.entries()) {
					let i = r.parts[0].pid, u = o.get(r.parts[0]);
					if (!u || u.parts.length !== r.parts.length || u.parts.some((e, t) => e !== r.parts[t])) {
						let t = (e.get(i) ?? 0) + 1;
						e.set(i, t), t >= 3 && this.stale.add(i);
						continue;
					}
					let d = (a?.[t] ?? []).filter((e) => e.t === "p"), f = d.length === r.parts.length ? r.parts.map((e, t) => Sr(e, d[t])) : [];
					if (!f.length || f.some((e) => !e)) {
						for (let e of r.parts) this.lookAt.set(e, n);
						this.stale.add(i);
					} else f.forEach((e, t) => {
						let i = se(u.pa, t);
						this.put(i, e), this.lookAt.set(e, n), this.heir.set(r.parts[t], e), l ||= s?.a.pa === i || s?.f.pa === i;
					}), r.parts.some((e) => e.caret) && this.stale.add(i), c = !0;
				}
				c && (l && s && !this.pendingSel && (this.pendingSel = s), this.changed(), this.emitState(this.input.sel()));
			}
		} finally {
			this.passing = !1;
		}
	}
	selectObject(e, t) {
		let n = {
			a: {
				pa: e,
				o: t
			},
			f: {
				pa: e,
				o: t + 1
			}
		};
		this.input.restore(n), this.onSelection(n);
	}
	imageSel() {
		let e = this.input.sel(), t = e && this.state(e)?.img;
		return t ? {
			a: {
				pa: t.pa,
				o: t.o
			},
			f: {
				pa: t.pa,
				o: t.o + 1
			}
		} : null;
	}
	patchImage(e) {
		let t = this.imageSel();
		t && (this.patchObjects(t, (t) => t.t === "img" ? e(t) : t), this.pendingSel = t);
	}
	setImageSize(e, t) {
		this.patchImage((n) => ({
			...n,
			w: +Math.max(4, e).toFixed(1),
			h: +Math.max(4, t).toFixed(1),
			resized: !0
		}));
	}
	imageOriginal(e, t) {
		let n = Math.min(1, this.contentW / Math.max(1, e * .75));
		this.setImageSize(e * .75 * n, t * .75 * n);
	}
	setAltText(e) {
		this.patchImage((t) => ({
			...t,
			alt: e || void 0,
			altSet: !0
		}));
	}
	async replaceImage(e) {
		let t = this.imageSel();
		if (!t) return;
		let n = (e.type.split("/")[1] ?? "png").replace("svg+xml", "svg").replace("jpeg", "jpg"), { rid: r, path: i } = await this.client.call("docx.image", await e.arrayBuffer(), n), a = await Or(e);
		this.input.restore(t), this.patchImage((e) => {
			let t = +(e.w * (a.h / Math.max(1, a.w))).toFixed(1);
			return {
				...e,
				target: i,
				rid: r,
				repl: !!e.src,
				h: t,
				resized: !0
			};
		});
	}
	deleteSelection() {
		let e = this.input.sel();
		e && !P(e) && ye(this, e, "");
	}
	insertText(e) {
		let t = this.input.sel();
		t && ye(this, t, e);
	}
	copyFormat() {
		if (this.painter) {
			this.painter = null, this.onPainter?.(!1);
			return;
		}
		let e = this.state();
		e && (this.painter = {
			b: e.b,
			i: e.i,
			u: e.u ? "single" : "none",
			strike: e.strike,
			color: e.color ?? null,
			hl: e.hl ?? null,
			va: e.va ?? null,
			sz: e.sz,
			font: e.font ? /^\s*"?([^",]+)/.exec(e.font)?.[1] ?? e.font : void 0
		}, this.onPainter?.(!0));
	}
	applyPainter() {
		let e = this.painter, t = this.input.readSel();
		if (!e || !t || P(t)) return !1;
		this.painter = null, this.onPainter?.(!1);
		let n = {};
		for (let [t, r] of Object.entries(e)) t === "font" ? n.font = r ? i(r) : void 0 : t === "u" ? n.u = r : n[t] = r === null ? void 0 : r;
		return this.format(n, e), !0;
	}
	state(e = this.input.sel()) {
		if (!e) return null;
		let [t] = M(this, e), n = this.para(t.pa);
		if (!n) return null;
		let r = pe(n.runs, P(e) ? t.o : t.o + +(O(n.runs) > t.o)), i = {
			...r?.s ?? {},
			...P(e) ? this.pend?.s ?? {} : {}
		}, [, a] = M(this, e), o;
		if (t.pa === a.pa && a.o === t.o + 1) {
			let [, e] = be(n.runs, t.o), r = e[0];
			r?.t === "img" && (o = {
				w: r.w,
				h: r.h,
				alt: r.alt,
				target: r.target,
				pa: t.pa,
				o: t.o
			});
		}
		return {
			line: n.pd?.line ?? (n.ps.lineRule === "auto" || !n.ps.lineRule ? n.ps.line : void 0),
			va: i.va,
			link: r?.href,
			inTable: t.pa.includes("."),
			cells: this.cellState(e),
			tracking: this.tracking,
			inChange: (() => {
				let [, r] = M(this, e);
				return lr(n).some((e) => t.pa !== r.pa || e.a <= r.o && t.o <= e.b);
			})(),
			img: o,
			b: !!i.b,
			i: !!i.i,
			u: !!i.u && i.u !== "none",
			strike: !!i.strike,
			color: i.color,
			hl: i.hl,
			sz: i.sz ?? n.markSz ?? this.defaultSz,
			font: i.font ?? n.markFont ?? this.defaultFont,
			align: n.ps.align ?? "left",
			style: n.sid,
			lst: n.lst,
			canUndo: this.canUndo,
			canRedo: this.canRedo
		};
	}
	cellState(e) {
		let t = this.cellRange(e);
		if (!t) return;
		let [n, r, i] = pr(e.f.pa), a = this.st.blocks[n].rows[r]?.cells[i];
		return {
			n: t.cells,
			merged: !!a && (a.colSpan > 1 || a.rowSpan > 1),
			shd: a?.shd,
			vAlign: a?.vAlign ?? "top"
		};
	}
	emitState(e) {
		let t = e ? this.state(e) : null;
		this.onState?.(t), this.onImage?.(t?.img ?? null);
	}
	onSelection(e) {
		e && this.pend && (e.a.pa !== this.pend.at.pa || e.a.o !== this.pend.at.o) && (this.pend = null), this.markCells(e), this.emitState(e);
	}
	markCells(e) {
		let t = this.input.root;
		if (!t) return;
		t.querySelectorAll(".de-cell-sel").forEach((e) => e.classList.remove("de-cell-sel"));
		let n = e ? this.cellRange(e) : null;
		if (!(!n || n.cells < 2)) for (let e of Wn(n.t, n.rect)) t.querySelector(`[data-pa^="${n.bi}.${e.ri}.${e.ci}."]`)?.closest("td")?.classList.add("de-cell-sel");
	}
};
function Dr(e) {
	let t = /^data:(image\/[\w+.-]+)((?:;[\w=.-]+)*),([\s\S]*)$/i.exec(e);
	if (!t) return null;
	try {
		let e = /;base64/i.test(t[2]) ? Uint8Array.from(atob(t[3].replace(/\s/g, "")), (e) => e.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(t[3]));
		return new Blob([e], { type: t[1].toLowerCase() });
	} catch {
		return null;
	}
}
function Or(e) {
	return new Promise((t) => {
		let n = URL.createObjectURL(e), r = new Image();
		r.onload = () => {
			t({
				w: r.naturalWidth || 300,
				h: r.naturalHeight || 200
			}), URL.revokeObjectURL(n);
		}, r.onerror = () => {
			t({
				w: 300,
				h: 200
			}), URL.revokeObjectURL(n);
		}, r.src = n;
	});
}
// src/react/comments/Comments.ts
var kr = class {
	client;
	list = /* @__PURE__ */ new Map();
	state = {
		rev: 0,
		open: !1,
		active: null,
		draft: null,
		showResolved: !1,
		notice: null
	};
	host = null;
	opts = {};
	me = { name: "Me" };
	canComment = !1;
	loaded = !1;
	subs = /* @__PURE__ */ new Set();
	offs = [];
	touchTimer;
	placedCache = null;
	constructor(e) {
		this.client = e, this.offs.push(e.on("comment", ({ id: e, c: t }) => {
			t ? this.list.set(e, t) : this.list.delete(e), !t && this.state.active === e ? this.set({ active: null }) : this.set({});
		})), e.call("comments.list").then((e) => {
			for (let t of e) this.list.has(t.id) || this.list.set(t.id, t);
			this.loaded = !0, this.set({});
		}).catch((e) => console.warn("[office-engine] comments not loaded:", e.message));
	}
	dispose() {
		this.offs.forEach((e) => e()), clearTimeout(this.touchTimer), this.subs.clear();
	}
	subscribe = (e) => (this.subs.add(e), () => {
		this.subs.delete(e);
	});
	snapshot = () => this.state;
	set(e) {
		this.state = {
			...this.state,
			...e,
			rev: this.state.rev + 1
		};
		for (let e of this.subs) e();
	}
	touch() {
		this.touchTimer ||= setTimeout(() => {
			this.touchTimer = void 0, this.set({});
		}, 250);
	}
	setHost(e) {
		this.host = e, this.set({});
	}
	threads() {
		let t = this.placedCache;
		if (t && t.rev === this.state.rev && t.host === this.host) return t.out;
		let n = this.host ? this.host.placed(e(this.list.values())) : [];
		return this.placedCache = {
			rev: this.state.rev,
			host: this.host,
			out: n
		}, n;
	}
	visible() {
		return this.threads().filter((e) => !e.root.done);
	}
	isMine(e) {
		return this.me.id ? e.author.id === this.me.id : !e.author.id && e.author.name === this.me.name;
	}
	toggle(e = !this.state.open) {
		this.set(e ? { open: e } : {
			open: e,
			draft: null,
			notice: null
		});
	}
	select(e, t = !0) {
		e && !this.state.open ? this.set({
			open: !0,
			active: e,
			notice: null
		}) : e !== this.state.active && this.set({
			active: e,
			notice: null
		}), e && t && this.host?.reveal(e);
	}
	start(e) {
		if (!this.canComment || !this.host) return !1;
		let t = e ?? this.host.pending();
		return t ? t.existing ? (this.select(t.existing), !0) : (this.set({
			open: !0,
			draft: t,
			active: null,
			notice: null
		}), !0) : (this.set({
			open: !0,
			draft: null,
			notice: this.host.hint
		}), !1);
	}
	cancelDraft() {
		this.state.draft && this.set({ draft: null });
	}
	dismiss() {
		this.state.notice && this.set({ notice: null });
	}
	setShowResolved(e) {
		this.set({ showResolved: e });
	}
	author() {
		let e = this.me;
		return {
			name: e.name,
			...e.id ? { id: e.id } : {},
			initials: e.initials ?? s(e.name)
		};
	}
	async write(e, t) {
		try {
			return await this.client.call("comments.set", e, t), !0;
		} catch (e) {
			return this.set({ notice: `Couldn't save the comment: ${e.message}` }), !1;
		}
	}
	quoteOf(e) {
		return this.threads().find((t) => t.root.id === e)?.quote ?? "";
	}
	participants(e, t) {
		let n = /* @__PURE__ */ new Map();
		for (let r of this.list.values()) {
			if (r.id === t || r.id !== e && r.parent !== e || this.isMine(r)) continue;
			let i = r.author.id ?? r.author.name;
			n.has(i) || n.set(i, r.author);
		}
		return [...n.values()];
	}
	emit(e, t, n = []) {
		let r = t.parent ? this.list.get(t.parent) ?? t : t;
		try {
			this.opts.onEvent?.({
				type: e,
				comment: t,
				thread: r,
				mentioned: n,
				participants: this.participants(r.id, t.id),
				quote: this.quoteOf(r.id)
			});
		} catch (e) {
			console.error("[office-engine] comment event handler failed", e);
		}
	}
	async post(e, t) {
		let n = this.state.draft, r = this.host;
		if (!n || !r || !e.trim()) return !1;
		let i = l(r.kind), a = {
			id: i,
			author: this.author(),
			time: oe(),
			text: e.trim(),
			...t.length ? { mentions: t } : {},
			...n.at ? { at: n.at } : {}
		};
		return await this.write(i, a) ? r.attach && !await r.attach(i, n) ? (await this.write(i, null), this.set({
			...this.state.draft === n ? { draft: null } : {},
			notice: "The commented text is no longer there"
		}), !1) : (this.set(this.state.draft === n ? {
			draft: null,
			active: i
		} : {}), this.emit("add", a, t), !0) : !1;
	}
	async reply(e, t, n) {
		let r = this.list.get(e);
		if (!r || !t.trim()) return !1;
		let i = l(this.host?.kind ?? "docx"), a = {
			id: i,
			parent: e,
			author: this.author(),
			time: oe(),
			text: t.trim(),
			...n.length ? { mentions: n } : {}
		};
		return r.done && !await this.write(e, {
			...r,
			done: void 0
		}) || !await this.write(i, a) ? !1 : (this.emit("reply", a, n), !0);
	}
	async edit(e, t, n) {
		let r = this.list.get(e);
		if (!r || !t.trim()) return !1;
		let i = {
			...r,
			text: t.trim()
		};
		if (n.length ? i.mentions = n : delete i.mentions, !await this.write(e, i)) return !1;
		let a = new Set((r.mentions ?? []).map((e) => e.id ?? e.name));
		return this.emit("edit", i, n.filter((e) => !a.has(e.id ?? e.name))), !0;
	}
	async remove(e) {
		let t = this.list.get(e);
		if (!t) return !1;
		let n = this.quoteOf(t.parent ?? e);
		if (!await this.write(e, null)) return !1;
		try {
			this.opts.onEvent?.({
				type: "delete",
				comment: t,
				thread: t.parent ? this.list.get(t.parent) ?? t : t,
				mentioned: [],
				participants: this.participants(t.parent ?? e, e),
				quote: n
			});
		} catch (e) {
			console.error("[office-engine] comment event handler failed", e);
		}
		return !0;
	}
	async resolve(e, t) {
		let n = this.list.get(e);
		if (!n || n.parent || !!n.done === t) return !1;
		let r = { ...n };
		return t ? r.done = !0 : delete r.done, await this.write(e, r) ? (t && this.state.active === e && !this.state.showResolved && this.set({ active: null }), this.emit(t ? "resolve" : "reopen", r), !0) : !1;
	}
	async people(e) {
		let t = this.opts.mentions;
		if (!t) return [];
		let n = e.trim().toLowerCase();
		return (typeof t == "function" ? await t(e) : t.filter((e) => !n || e.name.toLowerCase().includes(n) || (e.id ?? "").toLowerCase().includes(n))).slice(0, 8);
	}
}, Ar = Pe(null), jr = () => Le(Ar), Mr = {
	rev: 0,
	open: !1,
	active: null,
	draft: null,
	showResolved: !1,
	notice: null
}, Nr = () => () => {};
function Pr(e) {
	return U(e?.subscribe ?? Nr, e ? e.snapshot : () => Mr, e ? e.snapshot : () => Mr);
}
function Fr(e, t, n) {
	let r = (t) => `${e} [data-cm~="${t.replace(/["\\]/g, "")}"]`, i = "";
	return t.length && (i += `${t.map(r).join(",")}{background-image:linear-gradient(var(--de-cm-bg),var(--de-cm-bg))!important;cursor:pointer}`), n && t.includes(n) && (i += `${r(n)}{background-image:linear-gradient(var(--de-cm-on),var(--de-cm-on))!important;box-shadow:0 2px 0 var(--de-cm-line)}`), i;
}
var Ir = `${Q}${Q === "⌘" ? "⌥" : "Alt+"}M`;
function Lr(e) {
	let t = e.id ?? e.name, n = 0;
	for (let e = 0; e < t.length; e++) n = n * 31 + t.charCodeAt(e) >>> 0;
	return ve[n % ve.length];
}
function Rr(e, t) {
	let n = Date.parse(e);
	if (!Number.isFinite(n)) return "";
	let r = Math.max(0, (t - n) / 1e3);
	if (r < 45) return "just now";
	if (r < 3600) return `${Math.round(r / 60)} min ago`;
	if (r < 86400) return `${Math.round(r / 3600)} h ago`;
	if (r < 604800) return `${Math.round(r / 86400)} d ago`;
	let i = new Date(n);
	return i.toLocaleDateString(void 0, {
		month: "short",
		day: "numeric",
		...i.getFullYear() === new Date(t).getFullYear() ? {} : { year: "numeric" }
	});
}
function zr({ c: e }) {
	let t = (e.mentions ?? []).map((e) => "@" + e.name).sort((e, t) => t.length - e.length);
	if (!t.length) return /* @__PURE__ */ W("div", {
		className: "de-cm-text",
		children: e.text
	});
	let n = [], r = e.text;
	for (let e = 0; r; e++) {
		let i = -1, a = "";
		for (let e of t) {
			let t = r.indexOf(e);
			t >= 0 && (i < 0 || t < i) && (i = t, a = e);
		}
		if (i < 0) {
			n.push(r);
			break;
		}
		i > 0 && n.push(r.slice(0, i)), n.push(/* @__PURE__ */ W("span", {
			className: "de-cm-at",
			children: a
		}, e)), r = r.slice(i + a.length);
	}
	return /* @__PURE__ */ W("div", {
		className: "de-cm-text",
		children: n
	});
}
function Br({ u: e }) {
	return /* @__PURE__ */ W("span", {
		className: "de-cm-ava",
		style: { background: Lr(e) },
		"aria-hidden": !0,
		children: (e.initials || s(e.name)).slice(0, 2)
	});
}
function Vr(e) {
	let { ctl: t } = e, [n, r] = H(e.initial ?? ""), [i, a] = H(e.mentions ?? []), [o, s] = H(null), [c, l] = H(!1), u = V(null), d = V(0), f = V(null), p = !!t.opts.mentions;
	Be(() => {
		let e = u.current;
		e && (e.style.height = "auto", e.style.height = `${Math.min(e.scrollHeight, 200)}px`, f.current !== null && (e.focus(), e.setSelectionRange(f.current, f.current), f.current = null));
	}, [n]), B(() => {
		if (!e.autoFocus) return;
		let t = u.current;
		t?.focus({ preventScroll: !0 }), t?.setSelectionRange(t.value.length, t.value.length);
	}, [e.autoFocus]);
	let m = (e, n) => {
		if (!p) return;
		let r = /(^|[\s(])@([^\s@]{0,30}(?: [^\s@]{0,30})?)$/.exec(e.slice(0, n));
		if (!r) return s(null);
		let i = n - r[2].length - 1, a = ++d.current;
		t.people(r[2]).then((e) => {
			if (a === d.current) {
				if (!e.length && r[2].includes(" ")) return s(null);
				s({
					at: i,
					end: n,
					list: e,
					hi: 0
				});
			}
		});
	}, h = (e) => {
		if (!o) return;
		let t = `@${e.name} `, i = n.slice(0, o.at) + t + n.slice(o.end);
		r(i), a((t) => t.some((t) => (t.id ?? t.name) === (e.id ?? e.name)) ? t : [...t, e]), s(null), d.current++, f.current = o.at + t.length;
	}, g = async () => {
		if (c || !n.trim()) return;
		l(!0);
		let t = i.filter((e) => n.includes("@" + e.name)), o = await e.onSubmit(n, t);
		l(!1), o && (r(""), a([]));
	};
	return /* @__PURE__ */ G("div", {
		className: "de-cm-compose",
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ W("textarea", {
				ref: u,
				rows: 1,
				value: n,
				placeholder: e.placeholder,
				"aria-label": e.placeholder,
				disabled: c,
				onChange: (e) => {
					r(e.target.value), m(e.target.value, e.target.selectionStart);
				},
				onKeyDown: (t) => {
					if (t.stopPropagation(), !t.nativeEvent.isComposing) {
						if (o?.list.length) {
							if (t.key === "ArrowDown" || t.key === "ArrowUp") {
								t.preventDefault();
								let e = t.key === "ArrowDown" ? 1 : -1;
								s({
									...o,
									hi: (o.hi + e + o.list.length) % o.list.length
								});
								return;
							}
							if (t.key === "Enter" || t.key === "Tab") {
								t.preventDefault(), h(o.list[o.hi]);
								return;
							}
						}
						t.key === "Escape" ? (t.preventDefault(), o ? s(null) : e.onCancel?.()) : t.key === "Enter" && !t.shiftKey && (t.preventDefault(), g());
					}
				},
				onBlur: () => setTimeout(() => s(null), 150)
			}),
			o && o.list.length > 0 && /* @__PURE__ */ W("div", {
				className: "de-cm-pop",
				role: "listbox",
				children: o.list.map((e, t) => /* @__PURE__ */ G("button", {
					type: "button",
					role: "option",
					"aria-selected": t === o.hi,
					className: t === o.hi ? "on" : void 0,
					onMouseDown: (t) => {
						t.preventDefault(), h(e);
					},
					children: [/* @__PURE__ */ W(Br, { u: e }), /* @__PURE__ */ W("span", { children: e.name })]
				}, e.id ?? e.name))
			}),
			/* @__PURE__ */ G("div", {
				className: "de-cm-actions",
				children: [
					p && /* @__PURE__ */ W("span", {
						className: "de-cm-tip",
						children: "@ to mention"
					}),
					e.onCancel && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						onClick: e.onCancel,
						children: "Cancel"
					}),
					/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn de-btn-primary",
						disabled: c || !n.trim(),
						onClick: () => void g(),
						children: e.submit
					})
				]
			})
		]
	});
}
function Hr({ ctl: e, c: t, root: n, now: r, onMenu: i }) {
	let [a, o] = H(!1), s = e.isMine(t), c = e.canComment;
	return /* @__PURE__ */ G("div", {
		className: "de-cm-item",
		"data-comment": t.id,
		children: [
			/* @__PURE__ */ G("div", {
				className: "de-cm-head",
				children: [
					/* @__PURE__ */ W(Br, { u: t.author }),
					/* @__PURE__ */ G("div", {
						className: "de-cm-who",
						children: [/* @__PURE__ */ W("span", {
							className: "de-cm-name",
							children: t.author.name
						}), /* @__PURE__ */ W("time", {
							className: "de-cm-time",
							dateTime: t.time,
							title: t.time ? new Date(t.time).toLocaleString() : void 0,
							children: Rr(t.time, r)
						})]
					}),
					n && c && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb de-cm-icon",
						title: t.done ? "Reopen" : "Resolve",
						"aria-label": t.done ? "Reopen thread" : "Resolve thread",
						onClick: (n) => {
							n.stopPropagation(), e.resolve(t.id, !t.done);
						},
						children: /* @__PURE__ */ W(J, {
							name: t.done ? "rotateCcw" : "check",
							size: 16
						})
					}),
					c && s && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb de-cm-icon",
						title: "More",
						"aria-label": "More actions",
						"aria-haspopup": "menu",
						onClick: (e) => {
							e.stopPropagation(), i(t, e.currentTarget);
						},
						children: /* @__PURE__ */ W(J, {
							name: "more",
							size: 16
						})
					})
				]
			}),
			a ? /* @__PURE__ */ W(Vr, {
				ctl: e,
				placeholder: "Edit comment",
				submit: "Save",
				initial: t.text,
				mentions: t.mentions,
				autoFocus: !0,
				onSubmit: async (n, r) => {
					let i = await e.edit(t.id, n, r);
					return i && o(!1), i;
				},
				onCancel: () => o(!1)
			}) : /* @__PURE__ */ W(zr, { c: t }),
			/* @__PURE__ */ W(Wr, {
				id: t.id,
				start: () => o(!0)
			})
		]
	});
}
var Ur = /* @__PURE__ */ new Map();
function Wr({ id: e, start: t }) {
	return B(() => (Ur.set(e, t), () => {
		Ur.get(e) === t && Ur.delete(e);
	}), [e, t]), null;
}
function Gr({ ctl: e, t, active: n, now: r, onMenu: i }) {
	let { root: a, replies: o } = t, s = o.length > 2 ? o.length - 1 : 0;
	return /* @__PURE__ */ G("div", {
		className: "de-cm-card" + (n ? " on" : "") + (a.done ? " done" : ""),
		"data-thread": a.id,
		role: "button",
		tabIndex: 0,
		"aria-pressed": n,
		onClick: () => e.select(a.id),
		onKeyDown: (t) => {
			t.target === t.currentTarget && (t.key === "Enter" || t.key === " ") && (t.preventDefault(), e.select(a.id));
		},
		children: [
			t.quote && /* @__PURE__ */ W("div", {
				className: "de-cm-quote",
				children: t.quote
			}),
			a.done && /* @__PURE__ */ W("div", {
				className: "de-cm-resolved",
				children: "Resolved"
			}),
			/* @__PURE__ */ W(Hr, {
				ctl: e,
				c: a,
				root: !0,
				now: r,
				onMenu: i
			}),
			!n && s > 0 && /* @__PURE__ */ W("div", {
				className: "de-cm-count",
				children: s === 1 ? "1 more reply" : `${s} more replies`
			}),
			o.slice(n ? 0 : s).map((t) => /* @__PURE__ */ W(Hr, {
				ctl: e,
				c: t,
				now: r,
				onMenu: i
			}, t.id)),
			n && e.canComment && /* @__PURE__ */ W(Vr, {
				ctl: e,
				placeholder: a.done ? "Reply and reopen…" : "Reply…",
				submit: "Reply",
				onSubmit: (t, n) => e.reply(a.id, t, n)
			})
		]
	});
}
function Kr({ ctl: e }) {
	let t = Pr(e), [n, r] = H(null), [i, a] = H(null), [o, s] = H(() => Date.now()), c = V(null);
	B(() => {
		let e = setInterval(() => s(Date.now()), 6e4);
		return () => clearInterval(e);
	}, []);
	let l = e.threads(), u = t.showResolved ? l : l.filter((e) => !e.root.done), d = l.filter((e) => !e.root.done).length, f = l.length - d;
	B(() => {
		t.active && c.current?.querySelector(`[data-thread="${CSS.escape(t.active)}"]`)?.scrollIntoView({ block: "nearest" });
	}, [t.active]);
	let p = (e, t) => {
		let n = t.getBoundingClientRect();
		r({
			c: e,
			x: n.left,
			y: n.bottom + 4
		});
	};
	return /* @__PURE__ */ G("aside", {
		className: "de-cm-panel",
		"aria-label": "Comments",
		onKeyDown: (n) => n.key === "Escape" && t.draft && e.cancelDraft(),
		children: [
			/* @__PURE__ */ G("div", {
				className: "de-cm-bar",
				children: [
					/* @__PURE__ */ G("span", {
						className: "de-cm-title",
						children: ["Comments", d > 0 && /* @__PURE__ */ W("span", {
							className: "de-cm-badge",
							children: d
						})]
					}),
					f > 0 && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn de-cm-filter" + (t.showResolved ? " on" : ""),
						"aria-pressed": t.showResolved,
						onClick: () => e.setShowResolved(!t.showResolved),
						children: t.showResolved ? "Hide resolved" : `Resolved (${f})`
					}),
					/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb",
						title: "Close comments",
						"aria-label": "Close comments",
						onClick: () => e.toggle(!1),
						children: /* @__PURE__ */ W(J, {
							name: "close",
							size: 16
						})
					})
				]
			}),
			/* @__PURE__ */ G("div", {
				className: "de-cm-list",
				ref: c,
				children: [
					e.canComment && !t.draft && /* @__PURE__ */ G("button", {
						type: "button",
						className: "de-cm-new",
						onClick: () => e.start(),
						title: `Comment on the selection (${Ir})`,
						children: [
							/* @__PURE__ */ W(J, {
								name: "commentAdd",
								size: 16
							}),
							"New comment",
							/* @__PURE__ */ W("span", {
								className: "de-cm-keys",
								children: Ir
							})
						]
					}),
					t.notice && /* @__PURE__ */ G("div", {
						className: "de-cm-notice",
						role: "status",
						children: [/* @__PURE__ */ W("span", { children: t.notice }), /* @__PURE__ */ W("button", {
							type: "button",
							className: "de-tb",
							"aria-label": "Dismiss",
							onClick: () => e.dismiss(),
							children: /* @__PURE__ */ W(J, {
								name: "close",
								size: 14
							})
						})]
					}),
					t.draft && /* @__PURE__ */ G("div", {
						className: "de-cm-card on de-cm-draft",
						children: [
							t.draft.quote && /* @__PURE__ */ W("div", {
								className: "de-cm-quote",
								children: t.draft.quote
							}),
							/* @__PURE__ */ G("div", {
								className: "de-cm-head",
								children: [/* @__PURE__ */ W(Br, { u: e.me }), /* @__PURE__ */ W("div", {
									className: "de-cm-who",
									children: /* @__PURE__ */ W("span", {
										className: "de-cm-name",
										children: e.me.name
									})
								})]
							}),
							/* @__PURE__ */ W(Vr, {
								ctl: e,
								placeholder: "Comment or add others with @",
								submit: "Comment",
								autoFocus: !0,
								onSubmit: (t, n) => e.post(t, n),
								onCancel: () => e.cancelDraft()
							})
						]
					}),
					u.map((n) => /* @__PURE__ */ W(Gr, {
						ctl: e,
						t: n,
						active: t.active === n.root.id,
						now: o,
						onMenu: p
					}, n.root.id)),
					!u.length && !t.draft && /* @__PURE__ */ W("div", {
						className: "de-cm-empty",
						children: l.length ? "Every comment is resolved." : e.canComment ? `No comments yet. ${e.host?.hint ?? ""}` : "No comments."
					})
				]
			}),
			n && /* @__PURE__ */ W(sn, {
				x: n.x,
				y: n.y,
				items: ((e) => [{
					label: "Edit",
					icon: "edit",
					run: () => Ur.get(e.id)?.()
				}, {
					label: e.parent ? "Delete" : "Delete thread",
					icon: "trash",
					run: () => a(e)
				}])(n.c),
				onClose: () => r(null)
			}),
			i && /* @__PURE__ */ W(ln, {
				title: i.parent ? "Delete this comment?" : "Delete this thread?",
				message: i.parent ? "The reply is removed for everyone." : "The comment and its replies are removed for everyone.",
				ok: "Delete",
				onOk: () => void e.remove(i.id),
				onClose: () => a(null)
			})
		]
	});
}
// src/react/docx/DocxToolbar.tsx
var qr = [
	"#ffff00",
	"#00ff00",
	"#00ffff",
	"#ff00ff",
	"#0000ff",
	"#ff0000",
	"#000080",
	"#008080",
	"#008000",
	"#800080",
	"#800000",
	"#808000",
	"#808080",
	"#c0c0c0",
	"#000000"
], Jr = [
	{
		k: "all",
		icon: "bAll",
		title: "All borders"
	},
	{
		k: "inner",
		icon: "bInner",
		title: "Inner borders"
	},
	{
		k: "outer",
		icon: "bOuter",
		title: "Outer borders"
	},
	{
		k: "none",
		icon: "bNone",
		title: "No borders"
	},
	{
		k: "top",
		icon: "bTop",
		title: "Top border"
	},
	{
		k: "bottom",
		icon: "bBottom",
		title: "Bottom border"
	},
	{
		k: "left",
		icon: "bLeft",
		title: "Left border"
	},
	{
		k: "right",
		icon: "bRight",
		title: "Right border"
	}
], Yr = [
	{
		value: "0.5pt solid",
		label: "Thin",
		hint: "───"
	},
	{
		value: "1.5pt solid",
		label: "Medium",
		hint: "━━━"
	},
	{
		value: "3pt solid",
		label: "Thick",
		hint: "▬▬▬"
	},
	{
		value: "0.5pt dashed",
		label: "Dashed",
		hint: "- - -"
	},
	{
		value: "0.5pt dotted",
		label: "Dotted",
		hint: "·····"
	},
	{
		value: "2.25pt double",
		label: "Double",
		hint: "═══"
	}
], Xr = [
	{
		value: "top",
		label: "Top",
		icon: "vTop"
	},
	{
		value: "middle",
		label: "Middle",
		icon: "vMiddle"
	},
	{
		value: "bottom",
		label: "Bottom",
		icon: "vBottom"
	}
], Zr = [
	{
		value: 1,
		label: "Single"
	},
	{
		value: 1.15,
		label: "1.15"
	},
	{
		value: 1.5,
		label: "1.5"
	},
	{
		value: 2,
		label: "Double"
	},
	{
		value: 2.5,
		label: "2.5"
	},
	{
		value: 3,
		label: "Triple"
	}
], Qr = [
	{
		k: "normal",
		label: "Normal text",
		look: {}
	},
	{
		k: "title",
		label: "Title",
		look: { fontSize: 22 }
	},
	{
		k: "subtitle",
		label: "Subtitle",
		look: {
			fontSize: 15,
			color: "#5a5a5a"
		}
	},
	{
		k: "h1",
		label: "Heading 1",
		look: {
			fontSize: 18,
			color: "#2f5496"
		}
	},
	{
		k: "h2",
		label: "Heading 2",
		look: {
			fontSize: 16,
			color: "#2f5496"
		}
	},
	{
		k: "h3",
		label: "Heading 3",
		look: {
			fontSize: 14,
			color: "#1f3763"
		}
	},
	{
		k: "h4",
		label: "Heading 4",
		look: {
			fontSize: 13,
			color: "#2f5496",
			fontStyle: "italic"
		}
	},
	{
		k: "h5",
		label: "Heading 5",
		look: {
			fontSize: 13,
			color: "#2f5496"
		}
	},
	{
		k: "h6",
		label: "Heading 6",
		look: {
			fontSize: 13,
			color: "#1f3763",
			fontStyle: "italic"
		}
	}
], $r = /* @__PURE__ */ "©.®.™.§.¶.†.‡.•.….–.—.‰.€.£.¥.¢.₫.$.°.±.×.÷.≈.≠.≤.≥.∞.√.∑.∏.∫.π.µ.Ω.α.β.←.→.↑.↓.↔.⇒.✓.✗.★.☆.♥.♦.«.».“.”.‘.’.¼.½.¾.¹.².³".split(".");
function ei(e) {
	let t = Qr.map(({ k: t, label: n, look: r }, i) => {
		let a = e.find((e) => e.canon === t);
		return {
			value: a?.id ?? `@${t}`,
			label: n,
			k: t,
			s: a,
			look: r,
			sep: i === 1
		};
	});
	return e.filter((e) => !e.canon).forEach((e, n) => t.push({
		value: e.id,
		label: e.name,
		s: e,
		sep: n === 0
	})), t;
}
function ti(e) {
	let t = e?.preview;
	if (t) return {
		fontSize: t.sz ? Math.max(12, Math.min(22, t.sz)) : void 0,
		fontWeight: t.b ? 700 : void 0,
		fontStyle: t.i ? "italic" : void 0,
		color: t.color && !/^#?f{6}$/i.test(t.color.replace("#", "")) ? t.color : void 0,
		fontFamily: t.font,
		lineHeight: 1.25
	};
}
function ni(e) {
	let { editor: t, styles: n, image: r } = e, [i, a] = H(null), [o, s] = H("#000000"), [c, l] = H("0.5pt solid");
	B(() => (t.onState = a, () => {
		t.onState = void 0;
	}), [t]);
	let u = Vt(i?.font), d = !i, f = i?.sz ? Math.round(i.sz * 2) / 2 : void 0, p = i?.line ? Math.round(i.line * 100) / 100 : "", m = /Mac|iPhone|iPad/.test(typeof navigator < "u" ? navigator.platform : "") ? "⌥" : "Alt+", h = ei(n).map(({ value: e, label: t, k: n, s: r, look: i, sep: a }) => ({
		value: e,
		label: t,
		hint: n === "normal" ? `${Q}${m}0` : n?.startsWith("h") ? `${Q}${m}${n.slice(1)}` : void 0,
		style: n ? {
			lineHeight: 1.25,
			...n === "normal" ? {} : ti(r) ?? i
		} : ti(r),
		sep: a
	})), g = i?.style && h.some((e) => e.value === i.style) ? i.style : i && !i.style ? n.find((e) => e.canon === "normal")?.id ?? "" : "";
	return /* @__PURE__ */ G(Qt, { children: [
		/* @__PURE__ */ W(Y, {
			icon: "undo",
			title: `Undo (${Q}Z)`,
			disabled: !t.canUndo,
			onClick: () => t.undo()
		}),
		/* @__PURE__ */ W(Y, {
			icon: "redo",
			title: `Redo (${Q}Y)`,
			disabled: !t.canRedo,
			onClick: () => t.redo()
		}),
		/* @__PURE__ */ W(Y, {
			icon: "paint",
			title: "Paint format (click, then select text)",
			active: e.painter,
			disabled: d,
			onClick: () => t.copyFormat()
		}),
		i?.inTable && /* @__PURE__ */ G(We, { children: [
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Ut, {
				title: "Table",
				label: "Table",
				icon: "table",
				items: [
					{
						value: "rowAbove",
						label: "Insert row above",
						icon: "rowAbove"
					},
					{
						value: "rowBelow",
						label: "Insert row below",
						icon: "rowBelow"
					},
					{
						value: "colLeft",
						label: "Insert column left",
						icon: "colLeft"
					},
					{
						value: "colRight",
						label: "Insert column right",
						icon: "colRight"
					},
					{
						value: "delRow",
						label: "Delete row",
						icon: "delRow",
						sep: !0
					},
					{
						value: "delCol",
						label: "Delete column",
						icon: "delCol"
					},
					{
						value: "delTable",
						label: "Delete table",
						icon: "trash"
					},
					{
						value: "distribute",
						label: "Distribute columns evenly",
						icon: "colAdd",
						sep: !0
					}
				],
				onPick: (e) => e === "distribute" ? t.distributeColumns() : t.tableOp(e)
			}),
			/* @__PURE__ */ W(Y, {
				icon: "merge",
				title: i.cells?.merged && (i.cells?.n ?? 0) < 2 ? "Unmerge cells" : "Merge cells",
				active: i.cells?.merged && (i.cells?.n ?? 0) < 2,
				disabled: !i.cells || i.cells.n < 2 && !i.cells.merged,
				onClick: () => (i.cells?.n ?? 0) > 1 ? t.mergeCells() : t.unmergeCell()
			}),
			/* @__PURE__ */ W(Lt, {
				icon: "fill",
				title: "Cell color",
				value: i.cells?.shd,
				onPick: (e) => t.setCellShade(e),
				noneLabel: "No fill"
			}),
			/* @__PURE__ */ W(Wt, {
				icon: "borders",
				title: "Cell borders",
				chevron: !0,
				children: (e) => /* @__PURE__ */ G("div", {
					className: "de-borders-pop",
					children: [/* @__PURE__ */ W("div", {
						className: "de-borders",
						role: "group",
						"aria-label": "Cell borders",
						children: Jr.map((n) => /* @__PURE__ */ W("button", {
							type: "button",
							className: "de-tb",
							title: n.title,
							"aria-label": n.title,
							onClick: () => (e(), t.setCellBorders(n.k, `${c} ${o}`)),
							children: /* @__PURE__ */ W(J, { name: n.icon })
						}, n.k))
					}), /* @__PURE__ */ G("div", {
						className: "de-borders-side",
						children: [/* @__PURE__ */ W(Lt, {
							icon: "color",
							title: "Border color",
							value: o,
							onPick: (e) => s(e ?? "#000000"),
							noneLabel: "Black"
						}), /* @__PURE__ */ W(Z, {
							title: "Border style",
							icon: "lineStyle",
							label: null,
							menuWidth: 150,
							value: c,
							options: Yr,
							onChange: (e) => l(e)
						})]
					})]
				})
			}),
			/* @__PURE__ */ W(Z, {
				title: "Vertical align",
				icon: Xr.find((e) => e.value === i.cells?.vAlign)?.icon ?? "vTop",
				label: null,
				menuWidth: 130,
				value: i.cells?.vAlign ?? "top",
				options: Xr,
				onChange: (e) => t.setCellVAlign(e)
			})
		] }),
		i?.img && /* @__PURE__ */ G(We, { children: [
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Y, {
				icon: "minus",
				title: "Smaller",
				onClick: () => t.resizeImage(.8)
			}),
			/* @__PURE__ */ G("span", {
				className: "de-tb-hint",
				style: { margin: 0 },
				children: [
					Math.round(i.img.w),
					"×",
					Math.round(i.img.h),
					"pt"
				]
			}),
			/* @__PURE__ */ W(Y, {
				icon: "plus",
				title: "Larger",
				onClick: () => t.resizeImage(1.25)
			}),
			/* @__PURE__ */ W(Y, {
				icon: "fit",
				title: "Fit page width",
				onClick: () => t.resizeImage("fit")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "imgOrig",
				title: "Original size",
				onClick: r.original
			}),
			/* @__PURE__ */ W(Y, {
				icon: "imgReplace",
				title: "Replace image",
				onClick: r.replace
			}),
			/* @__PURE__ */ W(Y, {
				icon: "alt",
				title: "Alt text",
				active: !!i.img.alt,
				onClick: r.alt
			}),
			r.download && /* @__PURE__ */ W(Y, {
				icon: "save",
				title: "Download image",
				onClick: r.download
			}),
			/* @__PURE__ */ W(Y, {
				icon: "trash",
				title: "Delete image",
				onClick: () => t.deleteSelection()
			})
		] }),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Ct, {
			title: "Paragraph style",
			width: 118,
			menuWidth: 250,
			disabled: d,
			value: g,
			placeholder: "Style",
			options: h,
			onChange: (e) => e.startsWith("@") ? void t.applyCanon(e.slice(1)) : t.setPara({ style: e })
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Ct, {
			title: "Font",
			width: 118,
			menuWidth: 200,
			disabled: d,
			value: u,
			placeholder: "Font",
			options: Bt(u),
			onChange: (e) => t.setFont(e)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(wt, {
			value: f,
			disabled: d,
			onChange: (e) => t.setSize(e)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "bold",
			title: `Bold (${Q}B)`,
			active: i?.b,
			disabled: d,
			onClick: () => t.toggle("b")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "italic",
			title: `Italic (${Q}I)`,
			active: i?.i,
			disabled: d,
			onClick: () => t.toggle("i")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "underline",
			title: `Underline (${Q}U)`,
			active: i?.u,
			disabled: d,
			onClick: () => t.toggle("u")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "strike",
			title: "Strikethrough",
			active: i?.strike,
			disabled: d,
			onClick: () => t.toggle("strike")
		}),
		/* @__PURE__ */ W(Lt, {
			icon: "color",
			title: "Text color",
			value: i?.color,
			onPick: (e) => t.setColor(e),
			noneLabel: "Automatic"
		}),
		/* @__PURE__ */ W(Lt, {
			icon: "highlight",
			title: "Highlight color",
			value: i?.hl,
			palette: qr,
			onPick: (e) => t.setHighlight(e)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "link",
			title: `Insert link (${Q}K)`,
			active: !!i?.link,
			disabled: d,
			onClick: e.onLink
		}),
		/* @__PURE__ */ W(Y, {
			icon: "image",
			title: "Insert image",
			disabled: d,
			onClick: () => void qt().then((e) => void (e.length && t.insertImages(e)))
		}),
		/* @__PURE__ */ W(Wt, {
			icon: "table",
			title: "Insert table",
			disabled: d || i?.inTable,
			children: (e) => /* @__PURE__ */ W(Gt, { onPick: (n, r) => (e(), t.insertTable(n, r)) })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "pageSetup",
			title: "Page setup (size, orientation, margins, columns)",
			disabled: !e.onPageSetup,
			onClick: () => e.onPageSetup?.()
		}),
		/* @__PURE__ */ W(Y, {
			icon: "track",
			title: "Track changes (suggest edits)",
			active: !!i?.tracking,
			disabled: d,
			onClick: () => t.setTracking(!t.tracking)
		}),
		/* @__PURE__ */ W(Ut, {
			title: "Review changes",
			label: "Review",
			icon: "review",
			items: [
				{
					value: "next",
					label: "Next change",
					icon: "down"
				},
				{
					value: "prev",
					label: "Previous change",
					icon: "up"
				},
				{
					value: "accept",
					label: "Accept change",
					icon: "check",
					sep: !0,
					disabled: !i?.inChange
				},
				{
					value: "reject",
					label: "Reject change",
					icon: "close",
					disabled: !i?.inChange
				},
				{
					value: "acceptAll",
					label: "Accept all changes",
					icon: "check",
					sep: !0
				},
				{
					value: "rejectAll",
					label: "Reject all changes",
					icon: "close"
				}
			],
			onPick: (n) => {
				if (n === "next" || n === "prev") {
					t.gotoChange(n === "next" ? 1 : -1) || e.onNotice?.(n === "next" ? "No more changes after this point" : "No changes before this point");
					return;
				}
				let r = t.review(n.startsWith("accept"), n.endsWith("All"));
				e.onNotice?.(r ? `${r} change${r > 1 ? "s" : ""} ${n.startsWith("accept") ? "accepted" : "rejected"}` : "No tracked changes here");
			}
		}),
		/* @__PURE__ */ W(Y, {
			icon: "headerFooter",
			title: "Header & footer, page numbers",
			disabled: !e.onHeaderFooter,
			onClick: () => e.onHeaderFooter?.()
		}),
		/* @__PURE__ */ W(Wt, {
			icon: "omega",
			title: "Special characters",
			disabled: d,
			children: (e) => /* @__PURE__ */ W("div", {
				className: "de-symbols",
				children: $r.map((n) => /* @__PURE__ */ W("button", {
					type: "button",
					title: `U+${n.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
					onClick: () => (e(), t.insertText(n)),
					children: n
				}, n))
			})
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "alignLeft",
			title: "Align left",
			active: i?.align === "left",
			disabled: d,
			onClick: () => t.setPara({ align: "left" }, { align: "left" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "alignCenter",
			title: "Center",
			active: i?.align === "center",
			disabled: d,
			onClick: () => t.setPara({ align: "center" }, { align: "center" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "alignRight",
			title: "Align right",
			active: i?.align === "right",
			disabled: d,
			onClick: () => t.setPara({ align: "right" }, { align: "right" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "justify",
			title: "Justify",
			active: i?.align === "justify",
			disabled: d,
			onClick: () => t.setPara({ align: "justify" }, { align: "justify" })
		}),
		/* @__PURE__ */ W(Z, {
			title: "Line & paragraph spacing",
			icon: "lineSpacing",
			label: null,
			menuWidth: 150,
			disabled: d,
			value: p,
			options: Zr,
			onChange: (e) => t.setPara({ line: e }, {
				line: e,
				lineRule: "auto"
			})
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "bullets",
			title: "Bulleted list",
			active: i?.lst === "bullet",
			disabled: d,
			onClick: () => t.toggleList("bullet")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "numbers",
			title: "Numbered list",
			active: i?.lst === "number",
			disabled: d,
			onClick: () => t.toggleList("number")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "outdent",
			title: "Decrease indent (Shift+Tab)",
			disabled: d,
			onClick: () => t.indent(-1)
		}),
		/* @__PURE__ */ W(Y, {
			icon: "indent",
			title: "Increase indent (Tab)",
			disabled: d,
			onClick: () => t.indent(1)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "sup",
			title: "Superscript",
			active: i?.va === "sup",
			disabled: d,
			onClick: () => t.format({ va: i?.va === "sup" ? void 0 : "sup" }, { va: i?.va === "sup" ? null : "sup" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "sub",
			title: "Subscript",
			active: i?.va === "sub",
			disabled: d,
			onClick: () => t.format({ va: i?.va === "sub" ? void 0 : "sub" }, { va: i?.va === "sub" ? null : "sub" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "pagebreak",
			title: `Page break (${Q}Enter)`,
			disabled: d || i?.inTable,
			onClick: () => t.insertPageBreak()
		}),
		/* @__PURE__ */ W(Y, {
			icon: "clear",
			title: `Clear formatting (${Q}\\)`,
			disabled: d,
			onClick: () => t.clearFormat()
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "outline",
			title: "Document outline",
			active: e.outline,
			onClick: e.onOutline
		}),
		/* @__PURE__ */ W(Y, {
			icon: "search",
			title: `Find & replace (${Q}F)`,
			onClick: e.onFind
		})
	] });
}
// src/react/docx/FindBar.tsx
function ri(e) {
	let t = V(null), [n, r] = H(""), [i, a] = H(!!e.replace);
	return B(() => {
		t.current?.focus(), t.current?.select();
	}, []), /* @__PURE__ */ G("div", {
		className: "de-find",
		role: "search",
		onKeyDown: (t) => t.key === "Escape" && e.onClose(),
		children: [
			/* @__PURE__ */ G("div", {
				className: "de-find-row",
				children: [
					/* @__PURE__ */ W("input", {
						ref: t,
						value: e.query,
						placeholder: e.placeholder ?? "Find in document",
						"aria-label": "Find",
						onChange: (t) => e.onQuery(t.target.value),
						onKeyDown: (t) => {
							t.key === "Enter" && (t.preventDefault(), e.onNav(t.shiftKey ? -1 : 1));
						}
					}),
					/* @__PURE__ */ W("span", {
						className: "de-find-count",
						children: e.query ? e.count ? `${Math.min(e.index + 1, e.count)} / ${e.count}` : "0 / 0" : ""
					}),
					/* @__PURE__ */ W(Y, {
						icon: "up",
						title: "Previous (Shift+Enter)",
						onClick: () => e.onNav(-1),
						disabled: !e.count
					}),
					/* @__PURE__ */ W(Y, {
						icon: "down",
						title: "Next (Enter)",
						onClick: () => e.onNav(1),
						disabled: !e.count
					}),
					e.editable && /* @__PURE__ */ W(Y, {
						icon: "replace",
						title: "Replace",
						active: i,
						onClick: () => a((e) => !e)
					}),
					/* @__PURE__ */ W(Y, {
						icon: "close",
						title: "Close (Esc)",
						onClick: e.onClose
					})
				]
			}),
			e.options && /* @__PURE__ */ W("div", {
				className: "de-find-row de-find-opts",
				children: e.options
			}),
			e.editable && i && /* @__PURE__ */ G("div", {
				className: "de-find-row",
				children: [
					/* @__PURE__ */ W("input", {
						value: n,
						placeholder: "Replace with",
						"aria-label": "Replace with",
						onChange: (e) => r(e.target.value)
					}),
					/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						disabled: !e.count,
						onClick: () => e.onReplace(n, !1),
						children: "Replace"
					}),
					/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						disabled: !e.count,
						onClick: () => e.onReplace(n, !0),
						children: "All"
					})
				]
			})
		]
	});
}
// src/react/docx/find.ts
var ii = /[^\p{M}\u1160-\u11ff\ud7b0-\ud7ff][\p{M}\u1160-\u11ff\ud7b0-\ud7ff]*|[\p{M}\u1160-\u11ff\ud7b0-\ud7ff]+/gu;
function ai(e) {
	let t = "", n = [], r = [];
	for (let i of e.matchAll(ii)) {
		let e = i[0].normalize("NFC").toLowerCase();
		for (let t = 0; t < e.length; t++) n.push(i.index), r.push(i.index + i[0].length);
		t += e;
	}
	return {
		s: t,
		at: n,
		end: r
	};
}
function oi(e, t, n = 5e3) {
	let r = ai(t).s;
	if (!r) return [];
	let i = ai(e), a = [];
	for (let e = i.s.indexOf(r); e >= 0 && a.length < n; e = i.s.indexOf(r, e + r.length)) a.push([i.at[e], i.end[e + r.length - 1]]);
	return a;
}
// src/react/docx/HeaderFooterDialog.tsx
var si = [
	{
		k: "header",
		label: "Header"
	},
	{
		k: "footer",
		label: "Footer"
	},
	{
		k: "firstHeader",
		label: "First page header"
	},
	{
		k: "firstFooter",
		label: "First page footer"
	}
], ci = [
	{
		label: "Bottom center: 1",
		k: "footer",
		line: {
			text: "{PAGE}",
			align: "center"
		}
	},
	{
		label: "Bottom right: 1",
		k: "footer",
		line: {
			text: "{PAGE}",
			align: "right"
		}
	},
	{
		label: "Bottom center: Page 1 of 5",
		k: "footer",
		line: {
			text: "Page {PAGE} of {NUMPAGES}",
			align: "center"
		}
	},
	{
		label: "Bottom center: Trang 1/5 (Vietnamese)",
		k: "footer",
		line: {
			text: "Trang {PAGE}/{NUMPAGES}",
			align: "center"
		}
	},
	{
		label: "Top right: 1",
		k: "header",
		line: {
			text: "{PAGE}",
			align: "right"
		}
	}
];
function li(e) {
	let t = (e ?? []).filter((e) => e.t === "p"), n = (e ?? []).some((e) => e.t !== "p" || e.runs.some((e) => e.t !== "text" && e.t !== "field")), r = t.map((e) => e.t === "p" ? e.runs.map((e) => e.t === "text" ? e.text.replace(/\n/g, " ") : e.t === "field" ? `{${e.kind}}` : "").join("") : ""), i = t.find((e) => e.t === "p" && e.runs.length) ?? t[0], a = i?.t === "p" ? i.runs.filter((e) => e.t === "text" || e.t === "field") : [], o = i?.t === "p" && (i.ps.align === "center" || i.ps.align === "right") ? i.ps.align : "left", s = a[0];
	for (; r.length && !r[r.length - 1].trim();) r.pop();
	return {
		text: r.join("\n"),
		align: o,
		b: a.length > 0 && a.every((e) => e.s?.b),
		sz: s?.s?.sz ? String(s.s.sz) : "",
		rich: n
	};
}
var ui = (e) => e.text.split("\n").length === 1 && !e.text.trim() ? [] : e.text.split("\n").map((t) => ({
	text: t,
	align: e.align,
	...e.b ? { b: !0 } : {},
	...Number(e.sz) >= 4 ? { sz: Number(e.sz) } : {}
}));
function di({ meta: e, focus: t, onOk: n, onClose: r }) {
	let i = V(Object.fromEntries(si.map(({ k: t }) => [t, li(e[t])]))), [a, o] = H(i.current), [s, c] = H(!!e.titlePg), [l, u] = H(t && (s || !t.startsWith("first")) ? t : "header"), d = V(null);
	B(() => d.current?.focus(), [l]);
	let f = a[l], p = (e, t = l) => o((n) => ({
		...n,
		[t]: {
			...n[t],
			...e
		}
	})), m = (e) => {
		let t = d.current, n = t ? t.selectionStart : f.text.length, r = t ? t.selectionEnd : n;
		p({ text: f.text.slice(0, n) + e + f.text.slice(r) }), requestAnimationFrame(() => {
			t?.focus(), t?.setSelectionRange(n + e.length, n + e.length);
		});
	}, h = () => {
		let t = {};
		for (let { k: e } of si) {
			let n = a[e], r = i.current[e];
			(n.text !== r.text || n.align !== r.align || n.b !== r.b || n.sz !== r.sz) && ((t.parts ??= {})[e] = ui(n));
		}
		s !== !!e.titlePg && (t.titlePg = s), r(), (t.parts || t.titlePg !== void 0) && n(t);
	}, g = si.filter(({ k: e }) => s || !e.startsWith("first"));
	return /* @__PURE__ */ W("div", {
		className: "de-dialog-back",
		onMouseDown: (e) => e.target === e.currentTarget && r(),
		onKeyDown: (e) => {
			e.key === "Escape" && (e.stopPropagation(), r());
		},
		children: /* @__PURE__ */ G("form", {
			className: "de-dialog de-hfd",
			role: "dialog",
			"aria-label": "Header and footer",
			noValidate: !0,
			onSubmit: (e) => {
				e.preventDefault(), h();
			},
			children: [
				/* @__PURE__ */ W("div", {
					className: "de-dialog-title",
					children: "Header & footer"
				}),
				/* @__PURE__ */ W("div", {
					className: "de-hfd-tabs",
					role: "tablist",
					children: g.map(({ k: e, label: t }) => /* @__PURE__ */ W("button", {
						type: "button",
						role: "tab",
						"aria-selected": l === e,
						className: l === e ? "on" : void 0,
						onClick: () => u(e),
						children: t
					}, e))
				}),
				/* @__PURE__ */ W("textarea", {
					ref: d,
					rows: 3,
					"aria-label": `${si.find((e) => e.k === l).label} text`,
					placeholder: "Type the text; one line per paragraph",
					value: f.text,
					style: {
						textAlign: f.align,
						fontWeight: f.b ? 700 : void 0
					},
					onChange: (e) => p({ text: e.target.value })
				}),
				f.rich && /* @__PURE__ */ W("div", {
					className: "de-dialog-note de-ps-bad",
					children: "This part also holds pictures, tables or shapes: changing it here removes them."
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-row",
					children: [
						[
							"left",
							"center",
							"right"
						].map((e) => /* @__PURE__ */ G("label", {
							className: "de-ps-radio",
							children: [
								/* @__PURE__ */ W("input", {
									type: "radio",
									name: "de-hfd-align",
									checked: f.align === e,
									onChange: () => p({ align: e })
								}),
								" ",
								e[0].toUpperCase() + e.slice(1)
							]
						}, e)),
						/* @__PURE__ */ G("label", {
							className: "de-ps-radio",
							children: [/* @__PURE__ */ W("input", {
								type: "checkbox",
								checked: f.b,
								onChange: (e) => p({ b: e.target.checked })
							}), " Bold"]
						}),
						/* @__PURE__ */ G("label", {
							className: "de-ps-field",
							children: [/* @__PURE__ */ W("span", { children: "Size" }), /* @__PURE__ */ W("input", {
								type: "number",
								step: "any",
								min: "4",
								"aria-label": "Font size (pt)",
								placeholder: "auto",
								value: f.sz,
								onChange: (e) => p({ sz: e.target.value })
							})]
						})
					]
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-row",
					children: [
						/* @__PURE__ */ W("button", {
							type: "button",
							className: "de-btn",
							onClick: () => m("{PAGE}"),
							children: "+ Page number"
						}),
						/* @__PURE__ */ W("button", {
							type: "button",
							className: "de-btn",
							onClick: () => m("{NUMPAGES}"),
							children: "+ Page count"
						}),
						/* @__PURE__ */ G("select", {
							className: "de-ps-preset",
							"aria-label": "Page number preset",
							value: "",
							onChange: (e) => {
								let t = ci[Number(e.target.value)];
								t && (p({
									text: t.line.text,
									align: t.line.align ?? "left"
								}, t.k), u(t.k));
							},
							children: [/* @__PURE__ */ W("option", {
								value: "",
								children: "Page numbers…"
							}), ci.map((e, t) => /* @__PURE__ */ W("option", {
								value: t,
								children: e.label
							}, e.label))]
						})
					]
				}),
				/* @__PURE__ */ G("label", {
					className: "de-ps-radio",
					children: [
						/* @__PURE__ */ W("input", {
							type: "checkbox",
							checked: s,
							onChange: (e) => {
								c(e.target.checked), !e.target.checked && l.startsWith("first") && u(l === "firstFooter" ? "footer" : "header");
							}
						}),
						" ",
						"Different first page"
					]
				}),
				/* @__PURE__ */ G("div", {
					className: "de-dialog-btns",
					children: [/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						onClick: r,
						children: "Cancel"
					}), /* @__PURE__ */ W("button", {
						type: "submit",
						className: "de-btn de-btn-primary",
						children: "Apply"
					})]
				})
			]
		})
	});
}
// src/react/docx/PageSetupDialog.tsx
var fi = [
	{
		k: "a4",
		label: "A4 (21 × 29.7 cm)",
		w: 595.3,
		h: 841.9
	},
	{
		k: "letter",
		label: "Letter (8.5 × 11 in)",
		w: 612,
		h: 792
	},
	{
		k: "legal",
		label: "Legal (8.5 × 14 in)",
		w: 612,
		h: 1008
	},
	{
		k: "a3",
		label: "A3 (29.7 × 42 cm)",
		w: 841.9,
		h: 1190.6
	},
	{
		k: "a5",
		label: "A5 (14.8 × 21 cm)",
		w: 419.5,
		h: 595.3
	},
	{
		k: "b5",
		label: "B5 (17.6 × 25 cm)",
		w: 498.9,
		h: 708.7
	}
], pi = 72 / 2.54, mi = (e) => +(e / pi).toFixed(2), hi = (e) => +(e * pi).toFixed(2), gi = (e, t) => Math.abs(e - t) < 2;
function _i(e) {
	let t = Math.min(e.w, e.h), n = Math.max(e.w, e.h);
	return fi.find((e) => gi(e.w, t) && gi(e.h, n))?.k ?? "custom";
}
var vi = [
	{
		label: "Normal",
		cm: [
			2.54,
			2.54,
			2.54,
			2.54
		]
	},
	{
		label: "Narrow",
		cm: [
			1.27,
			1.27,
			1.27,
			1.27
		]
	},
	{
		label: "Moderate",
		cm: [
			2.54,
			1.91,
			2.54,
			1.91
		]
	},
	{
		label: "Wide",
		cm: [
			2.54,
			5.08,
			2.54,
			5.08
		]
	},
	{
		label: "Vietnam (TT 01/2011)",
		cm: [
			2,
			1.5,
			2,
			3
		]
	}
];
function yi({ page: e, onOk: t, onClose: n }) {
	let [r, i] = H(_i(e)), [a, o] = H(e.w > e.h), [s, c] = H([
		e.mt,
		e.mr,
		e.mb,
		e.ml
	].map((e) => String(mi(e)))), [l, u] = H(e.cols ?? 1), [d, f] = H(String(mi(e.colGap ?? 36))), p = V(null);
	B(() => p.current?.focus(), []);
	let m = s.map(Number), h = Number(d), g = (() => {
		let t = fi.find((e) => e.k === r), n = t ? t.w : Math.min(e.w, e.h), i = t ? t.h : Math.max(e.w, e.h);
		return a ? {
			w: i,
			h: n
		} : {
			w: n,
			h: i
		};
	})(), _ = m.some((e) => !Number.isFinite(e) || e < 0 || e > 15) || hi(m[1] + m[3]) > g.w - 72 || hi(m[0] + m[2]) > g.h - 72 || !Number.isFinite(h) || h < 0 || h > 10, v = () => {
		if (_) return;
		let r = {};
		gi(g.w, e.w) && gi(g.h, e.h) || Object.assign(r, {
			w: g.w,
			h: g.h
		}), [
			"mt",
			"mr",
			"mb",
			"ml"
		].forEach((t, n) => {
			let i = hi(m[n]);
			Math.abs(i - e[t]) > .3 && (r[t] = i);
		}), l !== (e.cols ?? 1) && (r.cols = l), l > 1 && Math.abs(hi(h) - (e.colGap ?? 36)) > .3 && (r.colGap = hi(h)), n(), Object.keys(r).length && t(r);
	}, y = (e, t) => /* @__PURE__ */ G("label", {
		className: "de-ps-field",
		children: [
			/* @__PURE__ */ W("span", { children: t }),
			/* @__PURE__ */ W("input", {
				type: "number",
				step: "any",
				min: "0",
				"aria-label": `${t} margin (cm)`,
				value: s[e],
				onChange: (t) => c((n) => n.map((n, r) => r === e ? t.target.value : n))
			}),
			/* @__PURE__ */ W("em", { children: "cm" })
		]
	});
	return /* @__PURE__ */ W("div", {
		className: "de-dialog-back",
		onMouseDown: (e) => e.target === e.currentTarget && n(),
		onKeyDown: (e) => {
			e.key === "Escape" && (e.stopPropagation(), n());
		},
		children: /* @__PURE__ */ G("form", {
			className: "de-dialog de-ps",
			role: "dialog",
			noValidate: !0,
			"aria-label": "Page setup",
			onSubmit: (e) => {
				e.preventDefault(), v();
			},
			children: [
				/* @__PURE__ */ W("div", {
					className: "de-dialog-title",
					children: "Page setup"
				}),
				/* @__PURE__ */ W("div", {
					className: "de-ps-note",
					children: "Applies to the whole document."
				}),
				/* @__PURE__ */ W("div", {
					className: "de-ps-row",
					children: /* @__PURE__ */ G("label", {
						className: "de-ps-field de-ps-wide",
						children: [/* @__PURE__ */ W("span", { children: "Paper size" }), /* @__PURE__ */ G("select", {
							ref: p,
							"aria-label": "Paper size",
							value: r,
							onChange: (e) => i(e.target.value),
							children: [fi.map((e) => /* @__PURE__ */ W("option", {
								value: e.k,
								children: e.label
							}, e.k)), r === "custom" && /* @__PURE__ */ G("option", {
								value: "custom",
								children: [
									"Custom (",
									mi(e.w),
									" × ",
									mi(e.h),
									" cm)"
								]
							})]
						})]
					})
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-row",
					role: "radiogroup",
					"aria-label": "Orientation",
					children: [
						/* @__PURE__ */ W("span", {
							className: "de-ps-head",
							children: "Orientation"
						}),
						/* @__PURE__ */ G("label", {
							className: "de-ps-radio",
							children: [/* @__PURE__ */ W("input", {
								type: "radio",
								name: "de-ps-orient",
								checked: !a,
								onChange: () => o(!1)
							}), " Portrait"]
						}),
						/* @__PURE__ */ G("label", {
							className: "de-ps-radio",
							children: [/* @__PURE__ */ W("input", {
								type: "radio",
								name: "de-ps-orient",
								checked: a,
								onChange: () => o(!0)
							}), " Landscape"]
						})
					]
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-head",
					children: ["Margins", /* @__PURE__ */ G("select", {
						className: "de-ps-preset",
						"aria-label": "Margin preset",
						value: "",
						onChange: (e) => {
							let t = vi[Number(e.target.value)];
							t && c(t.cm.map(String));
						},
						children: [/* @__PURE__ */ W("option", {
							value: "",
							children: "Presets…"
						}), vi.map((e, t) => /* @__PURE__ */ W("option", {
							value: t,
							children: e.label
						}, e.label))]
					})]
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-grid",
					children: [
						y(0, "Top"),
						y(2, "Bottom"),
						y(3, "Left"),
						y(1, "Right")
					]
				}),
				/* @__PURE__ */ G("div", {
					className: "de-ps-row",
					children: [
						/* @__PURE__ */ W("span", {
							className: "de-ps-head",
							children: "Columns"
						}),
						[
							1,
							2,
							3
						].map((e) => /* @__PURE__ */ G("label", {
							className: "de-ps-radio",
							children: [
								/* @__PURE__ */ W("input", {
									type: "radio",
									name: "de-ps-cols",
									checked: l === e,
									onChange: () => u(e)
								}),
								" ",
								e
							]
						}, e)),
						l > 1 && /* @__PURE__ */ G("label", {
							className: "de-ps-field",
							children: [
								/* @__PURE__ */ W("span", { children: "Spacing" }),
								/* @__PURE__ */ W("input", {
									type: "number",
									step: "any",
									min: "0",
									"aria-label": "Column spacing (cm)",
									value: d,
									onChange: (e) => f(e.target.value)
								}),
								/* @__PURE__ */ W("em", { children: "cm" })
							]
						})
					]
				}),
				_ && /* @__PURE__ */ W("div", {
					className: "de-dialog-note de-ps-bad",
					children: "The margins leave no room for text."
				}),
				/* @__PURE__ */ G("div", {
					className: "de-dialog-btns",
					children: [/* @__PURE__ */ W("button", {
						type: "button",
						className: "de-btn",
						onClick: n,
						children: "Cancel"
					}), /* @__PURE__ */ W("button", {
						type: "submit",
						className: "de-btn de-btn-primary",
						disabled: _,
						children: "Apply"
					})]
				})
			]
		})
	});
}
// src/core/plainmerge.ts
var bi = /courier|mono|consolas|menlo|fira code|source code/i, xi = /^[\da-zA-Z]{1,4}[.)]$/;
function Si(e, t) {
	let n = [];
	for (let t of e) {
		if (!t.text) continue;
		let e = n[n.length - 1];
		e && (e.key === t.key || !t.text.trim()) ? e.text += t.text : e && !e.text.trim() ? (e.key = t.key, e.text += t.text) : n.push({
			key: t.key,
			text: t.text
		});
	}
	let r = n.map((e) => `${t ? "" : e.key}\u0001${e.text.replace(/\s+/g, " ")}`).join("");
	return r.replace(/\u0001|\u0002/g, "").trim() ? r : "";
}
var Ci = (e) => (e ?? "").replace("#", "").toLowerCase();
function wi(e) {
	if (e.image) return "IMG";
	let t = (e) => e.href ? "a" + e.href : "", n = Si(e.runs.map((e) => {
		let n = e.set ?? {}, r = t(e);
		return {
			key: [
				n.b ? "b" : "",
				n.i ? "i" : "",
				n.strike ? "s" : "",
				!r && n.u && n.u !== "none" ? "u" : "",
				n.font && bi.test(n.font) ? "c" : "",
				r,
				!r && n.color ? "k" + Ci(n.color) : "",
				n.hl ? "h" + Ci(n.hl) : ""
			].join(""),
			text: e.text
		};
	}), !!e.heading);
	return n ? `${e.heading ?? 0}|${e.list ?? ""}|${n}` : "";
}
function Ti(e) {
	if (e.t !== "p") return "TABLE" + Math.random();
	let t = e, n = t.ps.outline, r = n !== void 0 && n < 6, i = t.marker ? xi.test(t.marker.text.trim()) ? "number" : "bullet" : "", a = [], o = !1;
	for (let e of t.runs) {
		if (e.t === "img") {
			e.tc?.k !== "del" && (o = !0);
			continue;
		}
		if (e.t !== "text" && e.t !== "ref" || e.tc?.k === "del" || e.s.vanish) continue;
		let t = e.t === "text" && e.href ? "a" + e.href : "", n = e.s, r = [
			n.b ? "b" : "",
			n.i ? "i" : "",
			n.strike || n.dstrike ? "s" : "",
			!t && n.u && n.u !== "none" ? "u" : "",
			n.font && bi.test(n.font) ? "c" : "",
			t,
			!t && n.color && n.color !== "auto" ? "k" + Ci(n.color) : "",
			n.hl && n.hl !== "none" ? "h" + Ci(n.hl) : ""
		].join("");
		a.push({
			key: r,
			text: e.text
		});
	}
	if (o && !a.length) return "IMG";
	let s = Si(a, r);
	return s ? `${r ? n + 1 : 0}|${i}|${s}` : "";
}
var Ei = (e) => e.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/g) ?? [], Di = /^\s*(?:[-*+]|\d+[.)])\s/, Oi = /^\s*(```|~~~)/;
function ki(e, t) {
	let n = Ei(e), r = [], i = "", a = "", o = () => {
		i && r.push(i), i = "", a = "";
	}, s = !1;
	for (let e = 0; e < n.length; e++) {
		let r = n[e], c = !r.trim();
		!c && s && (Di.test(a) && (Di.test(r) || /^(?: {2,}|\t)/.test(r)) || /^\s*>/.test(a) && /^\s*>/.test(r) || o()), s = c && !!i;
		let l = Oi.exec(r);
		if (l) {
			t && o();
			let s = e + 1;
			for (; s < n.length && !n[s].trimStart().startsWith(l[1]);) s++;
			if (i || (a = r), i += n.slice(e, s + 1).join(""), e = s, t) {
				for (; e + 1 < n.length && !n[e + 1].trim();) i += n[++e];
				o();
			}
			continue;
		}
		let u = /^\s{0,3}#{1,6}\s/.test(r) || /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(r);
		if (t && u && o(), i || (a = r), i += r, t && u) {
			for (; e + 1 < n.length && !n[e + 1].trim();) i += n[++e];
			o();
		}
	}
	return o(), r;
}
function Ai(e) {
	if (!/^﻿?---[ \t]*(\r\n|\r|\n|$)/.test(e[0] ?? "")) return e;
	let t = "";
	for (let n = 0; n < e.length; n++) if (t += e[n], /(^|[\r\n])(---|\.\.\.)[ \t]*(\r\n|\r|\n|$)/.test(t.replace(/^﻿?---[ \t]*(\r\n|\r|\n)/, ""))) return [t, ...e.slice(n + 1)];
	return e;
}
var ji = /* @__PURE__ */ new Set(/* @__PURE__ */ "P.DIV.H1.H2.H3.H4.H5.H6.LI.TR.BLOCKQUOTE.PRE.SECTION.ARTICLE.HEADER.FOOTER.UL.OL.TABLE.TBODY.THEAD.DL.DT.DD.FIGURE.HR.HEAD.SCRIPT.STYLE.MAIN.NAV.ASIDE.FORM.FIELDSET.DETAILS.ADDRESS.CENTER.NOSCRIPT.TEMPLATE.BODY.HTML".split(".")), Mi = /* @__PURE__ */ new Set([
	"DIV",
	"SECTION",
	"ARTICLE",
	"MAIN",
	"HEADER",
	"FOOTER",
	"NAV",
	"ASIDE",
	"CENTER",
	"BODY",
	"HTML"
]), Ni = /* @__PURE__ */ new Set([
	"AREA",
	"BASE",
	"BR",
	"COL",
	"EMBED",
	"HR",
	"IMG",
	"INPUT",
	"LINK",
	"META",
	"PARAM",
	"SOURCE",
	"TRACK",
	"WBR"
]), Pi = /* @__PURE__ */ new Set([
	"SCRIPT",
	"STYLE",
	"TEXTAREA",
	"TITLE",
	"XMP",
	"IFRAME",
	"NOEMBED",
	"NOFRAMES",
	"NOSCRIPT"
]), Fi = /* @__PURE__ */ new Set([
	"ADDRESS",
	"ARTICLE",
	"ASIDE",
	"BLOCKQUOTE",
	"DIV",
	"DL",
	"FIGURE",
	"FOOTER",
	"FORM",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"HEADER",
	"HR",
	"MAIN",
	"NAV",
	"OL",
	"P",
	"PRE",
	"SECTION",
	"TABLE",
	"UL"
]);
function Ii(e, t) {
	let n = e.length, r = /* @__PURE__ */ new Set(), i = [], a = [], o = -1, s = 0, c = (e) => {
		o >= 0 && r.add(e), o = -1;
	};
	for (; s < n;) {
		let l = e.indexOf("<", s), u = l < 0 ? n : l;
		if (u > s && !i.length && o < 0 && /\S/.test(e.slice(s, u)) && (r.add(s + (e.slice(s, u).length - e.slice(s, u).trimStart().length)), o = s), l < 0) break;
		if (s = l, e.startsWith("<!--", s)) {
			let t = e.indexOf("-->", s + 4);
			s = t < 0 ? n : t + 3;
			continue;
		}
		let d = e[s + 1];
		if (d === "!" || d === "?") {
			let t = e.indexOf(">", s);
			s = t < 0 ? n : t + 1;
			continue;
		}
		let f = d === "/", p = /^[A-Za-z][^\s/>]*/.exec(e.slice(s + (f ? 2 : 1), s + 66));
		if (!p) {
			s++;
			continue;
		}
		let m = s + (f ? 2 : 1) + p[0].length;
		for (let t = ""; m < n; m++) {
			let n = e[m];
			if (t) n === t && (t = "");
			else if (n === "\"" || n === "'") t = n;
			else if (n === ">") break;
		}
		let h = Math.min(m + 1, n), g = p[0].toUpperCase();
		if (f) {
			let e = i.lastIndexOf(g);
			e >= 0 ? (i.length = e, i.length || r.add(h)) : !i.length && t && a[a.length - 1] === g ? (a.pop(), c(s), r.add(s), r.add(h)) : !i.length && ji.has(g) && (c(s), r.add(s), r.add(h)), s = h;
		} else {
			if (i.length && i[i.length - 1] === "P" && Fi.has(g) && (i.pop(), i.length || r.add(s)), !i.length) {
				if (ji.has(g)) {
					if (c(s), r.add(s), t && Mi.has(g)) {
						a.push(g), r.add(h), s = h;
						continue;
					}
				} else o < 0 && (r.add(s), o = s);
			}
			if (Pi.has(g)) {
				let t = RegExp(`</${g}[\\s/>]`, "ig");
				t.lastIndex = h;
				let a = t.exec(e);
				s = a && e.indexOf(">", a.index) + 1 || n, !i.length && ji.has(g) && r.add(s);
			} else Ni.has(g) ? !i.length && ji.has(g) && r.add(h) : i.push(g), s = h;
		}
	}
	let l = [...r].filter((e) => e > 0 && e < n).sort((e, t) => e - t), u = [], d = 0;
	for (let t of l) t > d && u.push(e.slice(d, t)), d = t;
	return d < n && u.push(e.slice(d)), u;
}
function Li(e, t) {
	let n = (e) => t === "markdown" ? u(e, !1) : ie(e, !1), r = (e) => n(e).map(wi).filter(Boolean), i = r(e).join(""), a = t === "markdown" ? [Ai(ki(e, !0)), Ai(ki(e, !1))] : [Ii(e, !0), Ii(e, !1)];
	for (let t of a) {
		if (t.join("") !== e) continue;
		let n = t.map((e) => ({
			text: e,
			sigs: r(e)
		}));
		if (n.flatMap((e) => e.sigs).join("") === i) return n;
	}
	return null;
}
function Ri(e, t) {
	let n = new Int32Array(t.length).fill(-1), r = 0;
	for (; r < e.length && r < t.length && e[r] === t[r];) n[r] = r, r++;
	let i = e.length, a = t.length;
	for (; i > r && a > r && e[i - 1] === t[a - 1];) i--, a--, n[a] = i;
	let o = i - r, s = a - r;
	if (o * s > 4e6) return null;
	let c = s + 1, l = new Int32Array((o + 1) * c);
	for (let n = o - 1; n >= 0; n--) for (let i = s - 1; i >= 0; i--) l[n * c + i] = e[r + n] === t[r + i] ? l[(n + 1) * c + i + 1] + 1 : Math.max(l[(n + 1) * c + i], l[n * c + i + 1]);
	for (let i = 0, a = 0; i < o && a < s;) e[r + i] === t[r + a] ? n[r + a++] = r + i++ : l[(i + 1) * c + a] >= l[i * c + a + 1] ? i++ : a++;
	return n;
}
function zi(e, t, n, r) {
	let i = Li(e, t);
	if (!i) return null;
	let a = [], o = [];
	i.forEach((e, t) => e.sigs.forEach((e) => {
		a.push(e), o.push(t);
	}));
	let s = n.map((e) => ({
		b: e,
		sig: Ti(e)
	})).filter((e) => e.sig), c = Ri(a, s.map((e) => e.sig));
	if (!c) return null;
	let l = new Uint8Array(a.length), u = new Int32Array(a.length).fill(-1);
	c.forEach((e, t) => {
		e >= 0 && (l[e] = 1, u[e] = t);
	});
	let d = i.map((e, t) => {
		let n = o.flatMap((e, n) => e === t ? [n] : []);
		return n.every((e, t) => l[e] && (t === 0 || u[e] === u[n[t - 1]] + 1));
	}), f = /* @__PURE__ */ new Map(), p = 0;
	i.forEach((e, t) => {
		e.sigs.length || f.set(p, [...f.get(p) ?? [], t]), p += e.sigs.length;
	});
	let m = [], h = /* @__PURE__ */ new Set(), g = (e) => {
		for (let t of f.get(e) ?? []) m.push({ v: i[t].text });
		f.delete(e);
	}, _ = (e) => {
		let t = m[m.length - 1];
		t && "b" in t ? t.b.push(e) : m.push({ b: [e] });
	}, v = 0, y = 0;
	for (g(0); v < a.length || y < s.length;) if (y < s.length && c[y] < 0) _(s[y++].b);
	else if (v < a.length && !l[v]) g(++v);
	else if (v < a.length && y < s.length) {
		let e = o[v];
		d[e] ? (h.has(e) || m.push({ v: i[e].text }), h.add(e)) : _(s[y].b), g(++v), y++;
	} else break;
	for (let e of [...f.keys()]) g(e);
	let b = /\r\n/.test(e) ? "\r\n" : /\r/.test(e) && !/\n/.test(e) ? "\r" : "\n", x = "";
	for (let e of m) {
		let n = "v" in e ? e.v : r(e.b).replace(/\r?\n/g, b);
		"b" in e ? (n = n.replace(/\s+$/, "") + b + (t === "markdown" ? b : ""), x && !/(\r\n|\r|\n)$/.test(x) && (x += b), x && t === "markdown" && !/(\r\n|\r|\n)(\r\n|\r|\n)$/.test(x) && (x += b)) : x && !/(\r\n|\r|\n)$/.test(x) && /^\S/.test(n) && t === "markdown" && (x += b + b), x += n;
	}
	let S = m[m.length - 1];
	return S && "b" in S && (x = x.replace(/(\r\n|\r|\n)+$/, /(\r\n|\r|\n)$/.test(e) ? b : "")), x;
}
// src/react/docx/render.tsx
var Bi = (e) => e ? `${+e.toFixed(2)}pt` : void 0, Vi = je({
	double: "double",
	dotted: "dotted",
	dottedHeavy: "dotted",
	dash: "dashed",
	dashedHeavy: "dashed",
	dashLong: "dashed",
	wave: "wavy",
	wavyHeavy: "wavy",
	wavyDouble: "wavy"
}), Hi = [
	"#c0392b",
	"#1a73e8",
	"#188038",
	"#a142f4",
	"#e37400",
	"#00838f",
	"#d01884",
	"#5f6368"
], Ui = /* @__PURE__ */ new Map();
function Wi(e) {
	let t = e ?? "", n = Ui.get(t);
	return n === void 0 && Ui.set(t, n = Ui.size), Hi[n % Hi.length];
}
function Gi(e) {
	let t = Wi(e.author);
	return e.k === "ins" ? {
		color: t,
		textDecoration: "underline",
		textDecorationColor: t
	} : {
		color: t,
		textDecoration: "line-through",
		textDecorationColor: t
	};
}
function Ki(e) {
	let t = {};
	if (!e) return t;
	e.b ? t.fontWeight = 700 : e.b === !1 && (t.fontWeight = 400), e.i ? t.fontStyle = "italic" : e.i === !1 && (t.fontStyle = "normal");
	let n = e.u && e.u !== "none", r = [n ? "underline" : "", e.strike || e.dstrike ? "line-through" : ""].filter(Boolean).join(" ");
	return r ? t.textDecoration = r : (e.u === "none" || e.strike === !1) && (t.textDecoration = "none"), n && Vi[e.u] && (t.textDecorationStyle = Vi[e.u]), e.dstrike && (t.textDecorationStyle = "double"), e.color && (t.color = F(e.color)), e.sz && (t.fontSize = `${e.va ? e.sz * .65 : e.sz}pt`), e.font && (t.fontFamily = e.font), (e.hl || e.shd) && (t.background = F(e.hl ?? e.shd)), e.va && (t.verticalAlign = e.va === "sup" ? "super" : "sub"), e.caps && (t.textTransform = "uppercase"), e.smallCaps && (t.fontVariant = "small-caps"), e.spacing && (t.letterSpacing = `${e.spacing}pt`), t;
}
function qi(e) {
	return e.line ? e.lineRule === "exact" ? `${e.line}pt` : e.lineRule === "atLeast" ? `max(${e.line}pt, 1.17em)` : +(e.line * 1.17).toFixed(3) : 1.17;
}
function Ji(e, t, n) {
	return !e || e.t !== "p" || !e.ps.contextual ? "" : (t?.t === "p" && t.sid === e.sid ? "b" : "") + (n?.t === "p" && n.sid === e.sid ? "a" : "");
}
function Yi(e, t) {
	let n = {
		paddingTop: t.includes("b") ? void 0 : Bi(e.before),
		paddingBottom: t.includes("a") ? void 0 : Bi(e.after),
		paddingLeft: Bi(e.indL),
		paddingRight: Bi(e.indR),
		textIndent: Bi(e.indFirst),
		textAlign: e.align,
		lineHeight: qi(e)
	};
	e.shd && (n.background = F(e.shd));
	let r = (e) => e ? `${e.w}pt ${e.style} ${F(e.color) ?? "currentColor"}` : void 0;
	return e.bTop && (n.borderTop = r(e.bTop)), e.bBottom && (n.borderBottom = r(e.bBottom)), e.bLeft && (n.borderLeft = r(e.bLeft)), e.bRight && (n.borderRight = r(e.bRight)), n;
}
function Xi({ ctx: e, target: t, w: n, h: r, alt: i }) {
	let a = dt(e.client, t, !e.measuring), o = {
		width: `${n}pt`,
		height: `${r}pt`
	};
	return e.measuring || !a ? /* @__PURE__ */ W("span", {
		className: "de-img-missing",
		style: {
			...o,
			borderStyle: "none"
		}
	}) : a === "unsupported" ? /* @__PURE__ */ G("span", {
		className: "de-img-missing",
		style: o,
		title: t,
		children: [t.split(".").pop()?.toUpperCase(), " image"]
	}) : /* @__PURE__ */ W("img", {
		src: a,
		alt: i ?? "",
		style: {
			...o,
			verticalAlign: "bottom",
			display: "inline-block"
		},
		draggable: !1
	});
}
function Zi({ x: e, ctx: t, o: n }) {
	let r = e.t === "text" ? void 0 : e.tc, i = {
		"data-o": n,
		"data-obj": "",
		contentEditable: !t.editable && void 0,
		...r ? {
			"data-tc": r.k,
			title: `${r.k === "ins" ? "Inserted" : "Deleted"}${r.author ? ` by ${r.author}` : ""}`
		} : {}
	};
	switch (e.t) {
		case "text": {
			let r = e.tc, i = /* @__PURE__ */ W("span", {
				"data-o": n,
				style: r ? {
					...Ki(e.s),
					...Gi(r)
				} : Ki(e.s),
				"data-cm": e.cm?.join(" "),
				"data-tc": r?.k,
				title: r ? `${r.k === "ins" ? "Inserted" : "Deleted"}${r.author ? ` by ${r.author}` : ""}${r.date ? ` · ${new Date(r.date).toLocaleString()}` : ""}` : void 0,
				children: e.text
			}), a = t.measuring || t.editable ? void 0 : m(e.href);
			return a ? /* @__PURE__ */ W("a", {
				href: a,
				target: a.startsWith("#") ? void 0 : "_blank",
				rel: "noreferrer noopener",
				children: i
			}) : i;
		}
		case "field": {
			let n = e.kind === "PAGE" ? t.page >= 0 ? t.page + 1 : 1 : t.pages || 1;
			return /* @__PURE__ */ W("span", {
				...i,
				style: Ki(e.s),
				children: n
			});
		}
		case "ref": return /* @__PURE__ */ W("span", {
			...i,
			style: Ki(e.s),
			children: e.text
		});
		case "img": {
			let n = /* @__PURE__ */ W(Xi, {
				ctx: t,
				target: e.target,
				w: e.w,
				h: e.h,
				alt: e.alt
			}), r = t.measuring || t.editable ? void 0 : m(e.href);
			return /* @__PURE__ */ W("span", {
				...i,
				"data-cm": e.cm?.join(" "),
				children: r ? /* @__PURE__ */ W("a", {
					href: r,
					target: "_blank",
					rel: "noreferrer noopener",
					children: n
				}) : n
			});
		}
		case "box": return /* @__PURE__ */ W("span", {
			...i,
			className: "de-tbox",
			style: {
				width: e.w ? `${e.w}pt` : void 0,
				minHeight: e.h ? `${e.h}pt` : void 0,
				background: F(e.fill),
				border: e.border
			},
			children: e.blocks.map((e, n) => /* @__PURE__ */ W(ea, {
				block: e,
				ctx: t
			}, n))
		});
		case "shape": return e.label ? /* @__PURE__ */ W("span", {
			...i,
			className: "de-ph",
			style: {
				width: `${e.w}pt`,
				height: `${e.h}pt`
			},
			children: e.label
		}) : /* @__PURE__ */ W("span", { ...i });
	}
}
function Qi({ p: e, ctx: t, pa: n, sp: r }) {
	let i = e.ps.indFirst && e.ps.indFirst < 0 ? -e.ps.indFirst : 0, a = e.runs.length > 0, o = Yi(e.ps, r);
	a || (o.fontSize = Bi(e.markSz), e.markFont && (o.fontFamily = e.markFont));
	let s = t.editable && n !== void 0, c = 0, l = e.runs.map((e, n) => {
		let r = /* @__PURE__ */ W(Zi, {
			x: e,
			ctx: t,
			o: c
		}, n);
		return c += e.t === "text" ? e.text.length : 1, r;
	});
	return /* @__PURE__ */ G("div", {
		className: "de-p",
		style: o,
		"data-pa": n,
		contentEditable: t.editable && !s ? !1 : void 0,
		children: [
			e.marker && /* @__PURE__ */ G("span", {
				className: "de-marker",
				contentEditable: !t.editable && void 0,
				style: {
					...Ki(e.marker.s),
					minWidth: e.marker.tab && i ? `${i}pt` : void 0
				},
				children: [e.marker.text, e.marker.tab && !i ? "	" : ""]
			}),
			l,
			!a && (s ? /* @__PURE__ */ W("span", {
				"data-o": 0,
				"data-empty": "",
				children: "​"
			}) : "​")
		]
	});
}
function $i({ t: e, ctx: t, pa: n }) {
	let r = e.cols.reduce((e, t) => e + t, 0), i = { width: r ? `${r}pt` : "100%" };
	e.align === "center" ? i.margin = "0 auto" : e.align === "right" ? i.marginLeft = "auto" : e.indL && (i.marginLeft = `${e.indL}pt`);
	let a = t.colResize && n !== void 0 && !n.includes(".") && r > 0 ? t.colResize : void 0, o = (t) => (i) => {
		let o = i.currentTarget.parentElement.querySelector("table");
		if (!o || !a) return;
		i.preventDefault(), i.stopPropagation();
		let s = r / o.getBoundingClientRect().width, c = i.clientX, l = i.currentTarget;
		l.setPointerCapture(i.pointerId);
		let u = (n) => {
			let r = [...e.cols], i = n * s;
			if (t < r.length - 1) {
				let e = Math.max(-(r[t] - 12), Math.min(i, r[t + 1] - 12));
				r[t] += e, r[t + 1] -= e;
			} else r[t] = Math.max(12, r[t] + i);
			return r;
		}, d = (e) => {
			let t = u(e.clientX - c);
			o.querySelectorAll("col").forEach((e, n) => e.style.width = `${t[n]}pt`), o.style.width = `${t.reduce((e, t) => e + t, 0)}pt`;
		}, f = (e) => {
			l.removeEventListener("pointermove", d), l.removeEventListener("pointerup", f), Math.abs(e.clientX - c) > 1 && a(Number(n), u(e.clientX - c));
		};
		l.addEventListener("pointermove", d), l.addEventListener("pointerup", f);
	}, s = 0, c = a ? e.cols.map((e, t) => (s += e, /* @__PURE__ */ W("div", {
		className: "de-col-resize",
		contentEditable: !1,
		style: { left: `calc(${s}pt - 3px)` },
		onPointerDown: o(t)
	}, t))) : null, l = /* @__PURE__ */ G("table", {
		className: "de-tbl",
		style: i,
		children: [r > 0 && /* @__PURE__ */ W("colgroup", { children: e.cols.map((e, t) => /* @__PURE__ */ W("col", { style: { width: `${e}pt` } }, t)) }), /* @__PURE__ */ W("tbody", { children: e.rows.map((e, r) => /* @__PURE__ */ W("tr", {
			style: { height: e.h ? `${e.h}pt` : void 0 },
			children: e.cells.map((e, i) => /* @__PURE__ */ W("td", {
				colSpan: e.colSpan > 1 ? e.colSpan : void 0,
				rowSpan: e.rowSpan > 1 ? e.rowSpan : void 0,
				style: {
					borderTop: e.borders.t,
					borderRight: e.borders.r,
					borderBottom: e.borders.b,
					borderLeft: e.borders.l,
					background: F(e.shd),
					verticalAlign: e.vAlign,
					padding: `${e.pad[0]}pt ${e.pad[1]}pt ${e.pad[2]}pt ${e.pad[3]}pt`
				},
				children: e.blocks.map((a, o) => /* @__PURE__ */ W(ea, {
					block: a,
					ctx: t,
					pa: n !== void 0 && a.t === "p" && a.pid !== void 0 && !a.ro ? `${n}.${r}.${i}.${o}` : void 0,
					sp: Ji(a, e.blocks[o - 1], e.blocks[o + 1]),
					nested: !0
				}, a.t === "p" ? `${o}:${a.ver ?? 0}` : o))
			}, i))
		}, r)) })]
	});
	if (!c) return l;
	let u = i.marginLeft && i.marginLeft !== "auto" ? i.marginLeft : void 0;
	return /* @__PURE__ */ G("div", {
		className: "de-tbl-wrap",
		style: {
			marginLeft: u,
			width: i.width,
			marginRight: e.align === "center" ? "auto" : void 0,
			...e.align === "center" || e.align === "right" ? { marginLeft: "auto" } : {}
		},
		children: [l, c]
	});
}
var ea = z(function({ block: e, ctx: t, pa: n, sp: r = "", nested: i }) {
	switch (e.t) {
		case "p": return /* @__PURE__ */ W(Qi, {
			p: e,
			ctx: t,
			pa: n,
			sp: r
		});
		case "tbl": return /* @__PURE__ */ W("div", {
			style: { overflow: "visible" },
			contentEditable: t.editable && (i || n === void 0) ? !1 : void 0,
			children: /* @__PURE__ */ W($i, {
				t: e,
				ctx: t,
				pa: i ? void 0 : n
			})
		});
		default: return /* @__PURE__ */ W("div", {});
	}
});
// src/react/docx/paginate.ts
function ta(e, t) {
	return t === 0 && e?.titlePg ? {
		header: e.firstHeader,
		footer: e.firstFooter,
		hk: "firstHeader",
		fk: "firstFooter"
	} : e?.evenOdd && t % 2 == 1 ? {
		header: e.evenHeader,
		footer: e.evenFooter,
		hk: "header",
		fk: "footer"
	} : {
		header: e?.header,
		footer: e?.footer,
		hk: "header",
		fk: "footer"
	};
}
function na(e, t, n, r, i = 1, a = "nextPage") {
	let o = /* @__PURE__ */ new Map(), s = a;
	for (let t = e.length - 1; t >= 0; t--) {
		let n = e[t];
		n.t === "sect" && (o.set(t, s), s = n.kind);
	}
	let c = [], l = {
		start: 0,
		end: 0,
		used: 0
	}, u = 0, d = 0, f = (e) => {
		c.push(l), l = {
			start: e,
			end: e,
			used: 0
		}, u = 0, d = 0;
	};
	for (let a = 0; a < n; a++) {
		let n = e[a], s = t.get(n) ?? 0;
		n.t === "sect" ? (l.end = a + 1, o.get(a) !== "continuous" && f(a + 1)) : (n.t === "p" && n.pb && l.end > l.start ? f(a) : d > 0 && d + s > r && (u + 1 < i ? (u++, d = 0) : f(a)), l.end = a + 1, d += s, l.used = Math.max(l.used, i > 1 ? Math.min(d, r) : d));
	}
	return (l.end > l.start || !c.length) && c.push(l), c;
}
// src/react/docx/DocxView.tsx
var ra = 4 / 3, ia = 16, aa = 24, oa = /* @__PURE__ */ new WeakSet();
function sa(e, t, n) {
	for (let r of e.querySelectorAll(`[data-pa="${t}"]`)) for (let e of r.querySelectorAll(`[data-obj][data-o="${n}"]`)) if (e.closest("[data-pa]") === r) return e.querySelector("img") ?? e;
	return null;
}
var ca = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
], la = (e) => xe(e.runs.filter((e) => e.t !== "text" || e.tc?.k !== "del"));
function ua(e, t) {
	let n = [];
	return e.forEach((e, r) => {
		if (e.t !== "p" || e.pid === void 0) return;
		let i = !!t && e.sid === t, a = i ? 0 : e.ps.outline;
		if (a === void 0 || a > 5) return;
		let o = la(e).trim();
		o && n.push({
			bi: r,
			lvl: i ? 0 : a + +!!t,
			text: o
		});
	}), n;
}
var da = (e) => !!e && e.t === "p" && e.pid !== void 0 && !e.ro;
function fa({ client: e, onStatus: t, initialZoom: n = "fit" }) {
	let r = Yt(), i = V({
		blocks: [],
		heights: /* @__PURE__ */ new WeakMap(),
		dirty: /* @__PURE__ */ new Set(),
		frontier: 0
	}).current, [a, s] = ct(), [c, l] = H(null), [u, d] = H(!1), [f, p] = H(null), h = Ie((e) => p(e), []), [g, _] = H(null), [v, y] = H(n), [b, x] = lt(), S = ut(b), C = V(null), [w, ee] = H([]), T = Ve(() => new Er(e, i, s), [
		e,
		i,
		s
	]), te = Ie((e, t) => T.setColumnWidths(e, t), [T]), E = r.editable && !!g && !g.error, [D, ne] = H({
		open: !1,
		q: "",
		idx: 0
	}), [re, ie] = H(null), [ae, oe] = H(null), [se, ce] = H(null), [le, O] = H(!1), [ue, de] = H(!1), [fe, pe] = H(null), [he, ge] = H(null), _e = V(!1), ve = V(null);
	B(() => (T.onImage = (e) => pe((t) => t?.pa === e?.pa && t?.o === e?.o && t?.w === e?.w && t?.h === e?.h && t?.target === e?.target && t?.alt === e?.alt ? t : e), T.onStyles = (e) => l((t) => t && {
		...t,
		styles: e
	}), T.onHeaders = (e) => l((t) => t && {
		...t,
		...e
	}), T.onPage = (e) => l((t) => t && {
		...t,
		page: e
	}), T.onHF = (e) => l((t) => t && {
		...t,
		header: void 0,
		footer: void 0,
		firstHeader: void 0,
		firstFooter: void 0,
		...e.headers,
		titlePg: e.titlePg
	}), T.onPainter = de, () => {
		T.onImage = T.onStyles = T.onHeaders = T.onPainter = T.onPage = T.onHF = void 0;
	}), [T]), B(() => g && !g.error ? me(e, "docx", {
		editor: T,
		st: i
	}) : void 0, [
		e,
		T,
		i,
		g
	]), B(() => {
		let t = [
			e.on("docx:blocks", (e) => {
				for (let t of e) i.blocks.push(t);
				s();
			}),
			e.on("docx:meta", (e) => {
				let t = T.pageNow ? {
					...e,
					page: T.pageNow
				} : e;
				T.hfNow && (t = {
					...t,
					header: void 0,
					footer: void 0,
					firstHeader: void 0,
					firstFooter: void 0,
					...T.hfNow.headers,
					titlePg: T.hfNow.titlePg
				}), l(t), e.styles && (T.styles = e.styles);
			}),
			e.on("docx:done", _)
		];
		return oa.has(e) || (oa.add(e), e.call("docx.start").catch(() => {})), () => t.forEach((e) => e());
	}, [
		e,
		s,
		i,
		T
	]);
	let A = c?.page ?? o, j = A.cols && A.cols > 1 ? A.cols : 1, be = j > 1 ? A.colGap ?? 36 : 0, we = (A.w - A.ml - A.mr - be * (j - 1)) / j, M = (A.h - A.mt - A.mb) * ra, [N, P] = H(40), Ee = V(null), De = `${we}|${c?.font}|${c?.sz}`, F = V(De);
	F.current !== De && (F.current = De, i.heights = /* @__PURE__ */ new WeakMap(), i.dirty.clear(), i.frontier = 0);
	let Oe = i.blocks.length, I = [];
	for (let e of i.dirty) {
		if (I.length >= 50) break;
		let t = i.blocks.indexOf(e);
		t < 0 ? i.dirty.delete(e) : I.push({
			b: e,
			i: t
		});
	}
	let ke = Math.min(Oe, i.frontier + N);
	for (let e = i.frontier; e < ke; e++) I.push({
		b: i.blocks[e],
		i: e
	});
	let Ae = performance.now(), je = Ve(() => ({
		client: e,
		page: -1,
		pages: 0,
		measuring: !0,
		editable: !1
	}), [e]);
	at(() => {
		let e = Ee.current;
		if (!e || !I.length || !c) return;
		let t = Array.from(e.children).map((e) => e.getBoundingClientRect().height), n = performance.now() - Ae, r = setTimeout(() => {
			I.forEach((e, n) => {
				i.heights.set(e.b, t[n] ?? 0), i.dirty.delete(e.b);
			}), ke > i.frontier && (i.frontier = ke), P((e) => n < 10 ? Math.min(e * 2, 1500) : n > 30 ? Math.max(10, e >> 1) : e), s();
		}, 0);
		return () => clearTimeout(r);
	});
	let L = Ve(() => na(i.blocks, i.heights, Math.min(i.frontier, Oe), M, j, c?.final && c.sectKind || "nextPage"), [
		a,
		M,
		Oe,
		j,
		c?.final,
		c?.sectKind
	]), R = A.w * ra, Me = A.h * ra, Ne = x.w ? Math.max(.2, Math.min(2, (x.w - 48) / R)) : 1, Pe = v === "fit" ? Math.min(Ne, 1.25) : v, Fe = !!g && i.frontier >= Oe, z = L.map((e) => Math.max(Me, (A.mt + A.mb) * ra + e.used) * Pe), Le = [], Re = aa;
	for (let e of z) Le.push(Re), Re += e + ia;
	let ze = +!Fe, Be = Re + ze * (Me * Pe + ia) + aa - ia, He = Math.max(x.w, R * Pe + 48), U = Math.max(aa, (He - R * Pe) / 2), Ue = Le.length ? ft(Le, S.y - Me * Pe) : 0, We = Le.length ? ft(Le, S.y + x.h + 200) : -1, Ge = Fe ? L.length : 0, Ke = new Set(w), qe = E ? T.input.lastSel : null, Je = qe ? Number(qe.f.pa.split(".")[0]) : -1;
	for (let e of qe ? [Number(qe.a.pa.split(".")[0]), Je] : []) Ke.add(L.findIndex((t) => e >= t.start && e < t.end));
	T.contentW = we, T.defaultFont = c?.font, T.defaultSz = c?.sz;
	let Ye = Le.length ? ft(Le, S.y + x.h / 3) + 1 : 0, [Xe, Ze] = H(0);
	B(() => {
		if (!g) return;
		let e = setTimeout(() => {
			let e = 0, t = (n) => {
				if (n.t === "p") e += la(n).split(/\s+/).filter((e) => /[\p{L}\p{N}]/u.test(e)).length;
				else if (n.t === "tbl") for (let e of n.rows) for (let n of e.cells) n.blocks.forEach(t);
			};
			i.blocks.forEach(t), Ze(e);
		}, 600);
		return () => clearTimeout(e);
	}, [
		a,
		g,
		i
	]);
	let Qe = g?.error ? `Error: ${g.error}` : Fe ? `Page ${Ye} of ${L.length} · ${Xe.toLocaleString()} words` : `Page ${Ye} of ${L.length}+ · loading…`;
	B(() => {
		let e = (e, t) => {
			let n = t && e.contains(t) ? (t instanceof Element ? t : t.parentElement)?.closest(".de-page") : null;
			return n ? Number(n.dataset.page) - 1 : -1;
		}, t = () => {
			let t = C.current, n = t && k(t), r = !!n && (n.anchorNode !== n.focusNode || n.anchorOffset !== n.focusOffset), i = t && r ? [e(t, n.anchorNode), e(t, n.focusNode)].filter((e) => e >= 0) : [];
			ee((e) => i.length === e.length && i.every((t, n) => t === e[n]) ? e : i);
		};
		return document.addEventListener("selectionchange", t), () => document.removeEventListener("selectionchange", t);
	}, []), B(() => {
		let e = C.current;
		if (E && e) return T.input.attach(e), T.onDirty = () => r.setDirty(!0), () => T.input.detach();
	}, [
		E,
		T,
		r
	]), Zt(() => {
		E ? T.selectAll() : C.current && Se(C.current)?.selectAllChildren(C.current);
	});
	let $e = L.some((e) => e.end > e.start);
	B(() => {
		if (!E) {
			mt(b.current);
			return;
		}
		if (!$e || !mt(C.current) || T.input.readSel()) return;
		let e = T.all();
		e && !T.input.restore({
			a: e.a,
			f: e.a
		}) && (T.pendingSel = {
			a: e.a,
			f: e.a
		});
	}, [E, $e]), B(() => {
		T.shortcut = (e) => {
			let t = e.metaKey || e.ctrlKey;
			if (t && e.key.toLowerCase() === "s") return r.save(), !0;
			if (t && e.key.toLowerCase() === "f") return ne((e) => ({
				...e,
				open: !0
			})), !0;
			if (t && e.key === "Enter") return T.insertPageBreak(), !0;
			if (t && e.key.toLowerCase() === "k") return it(), !0;
			if (t && e.altKey && /^Digit[0-6]$/.test(e.code)) {
				let t = Number(e.code.slice(5));
				return T.applyCanon(t ? `h${t}` : "normal"), !0;
			}
			return t && e.key === "\\" ? (T.clearFormat(), !0) : e.key === "Escape" && T.painter ? (T.copyFormat(), !0) : !1;
		};
	}, [T, r]), at(() => {
		let e = T.pendingSel;
		if (!e || !C.current) {
			E && T.input.repair();
			return;
		}
		if (!T.input.restore(e)) {
			let t = Number(e.f.pa.split(".")[0]), n = L.findIndex((e) => t >= e.start && t < e.end);
			n >= 0 && b.current && (b.current.scrollTop = Math.max(0, Le[n] - 16)), (n < 0 || n >= Ue && n <= We) && (T.pendingSel = null);
			return;
		}
		T.pendingSel = null;
		let t = Se(C.current), n = t?.rangeCount ? t.getRangeAt(0) : null, r = b.current;
		if (n && r) {
			let e = n.getBoundingClientRect(), t = r.getBoundingClientRect();
			e.height && e.bottom > t.bottom - 24 ? r.scrollTop += e.bottom - t.bottom + 48 : e.height && e.top < t.top + 8 && (r.scrollTop -= t.top - e.top + 48);
		}
	});
	let et = Ve(() => {
		let e = D.q;
		if (!D.open || !e) return [];
		let t = [], n = (n, r, i) => {
			for (let [a, o] of oi(xe(n.runs), e, 5e3 - t.length)) t.push({
				pa: r,
				a,
				b: o,
				bi: i
			});
		};
		return i.blocks.forEach((e, t) => {
			da(e) ? n(e, String(t), t) : e.t === "tbl" && e.rows.forEach((e, r) => e.cells.forEach((e, i) => e.blocks.forEach((e, a) => da(e) && n(e, `${t}.${r}.${i}.${a}`, t))));
		}), t;
	}, [
		D.q,
		D.open,
		a
	]), tt = (e) => {
		let t = et[e], n = b.current;
		if (!t || !n) return;
		let r = L.findIndex((e) => t.bi >= e.start && t.bi < e.end);
		r >= 0 && (n.scrollTop = Math.max(0, Le[r] - 16)), ne((t) => ({
			...t,
			idx: e
		})), requestAnimationFrame(() => requestAnimationFrame(() => {
			let e = C.current;
			if (!e) return;
			let r = Ce(e, {
				pa: t.pa,
				o: t.a
			}), i = Ce(e, {
				pa: t.pa,
				o: t.b
			});
			if (!r || !i) return;
			let a = document.createRange();
			a.setStart(r[0], r[1]), a.setEnd(i[0], i[1]);
			let o = a.getBoundingClientRect(), s = n.getBoundingClientRect();
			n.scrollTop += o.top - s.top - s.height / 3, E && T.input.restore({
				a: {
					pa: t.pa,
					o: t.a
				},
				f: {
					pa: t.pa,
					o: t.b
				}
			}, !1);
		}));
	};
	at(() => {
		let e = globalThis.Highlight, t = CSS.highlights;
		if (!e || !t) return;
		let n = C.current;
		if (!n || !et.length) {
			t.delete("de-find"), t.delete("de-find-cur");
			return;
		}
		let r = [], i;
		et.forEach((e, t) => {
			if (e.bi < (L[Ue]?.start ?? 0) || e.bi >= (L[We]?.end ?? 0)) return;
			let a = Ce(n, {
				pa: e.pa,
				o: e.a
			}), o = Ce(n, {
				pa: e.pa,
				o: e.b
			});
			if (!a || !o) return;
			let s = document.createRange();
			s.setStart(a[0], a[1]), s.setEnd(o[0], o[1]), t === D.idx ? i = s : r.push(s);
		}), t.set("de-find", new e(...r)), i ? t.set("de-find-cur", new e(i)) : t.delete("de-find-cur");
	});
	let nt = (e, t) => ye(T, {
		a: {
			pa: e.pa,
			o: e.a
		},
		f: {
			pa: e.pa,
			o: e.b
		}
	}, t), rt = {
		fontFamily: c?.font,
		fontSize: c ? `${c.sz}pt` : void 0
	};
	Xt({
		printable: async () => {
			if (!Fe) throw Error("The document is still loading — try again in a moment");
			return {
				size: `${A.w}pt ${A.h}pt`,
				margin: "0",
				node: L.map((t, n) => {
					let r = Math.max(Me, (A.mt + A.mb) * ra + t.used), a = r > Me;
					return /* @__PURE__ */ W("div", {
						className: a ? "de-print-page de-print-tall" : "de-print-page",
						style: {
							width: `${A.w}pt`,
							height: a ? `${r}px` : `${A.h}pt`
						},
						children: /* @__PURE__ */ W(pa, {
							index: n,
							count: L.length,
							slice: t,
							blocks: i.blocks,
							meta: c,
							page: A,
							top: 0,
							left: 0,
							height: r,
							zoom: 1,
							client: e,
							docStyle: rt,
							editing: !1
						})
					}, n);
				})
			};
		},
		text: async (t, n) => {
			if (!g) throw Error("The document is still loading — try again in a moment");
			if (t === "txt") return gn(i.blocks);
			let r = await jn(i.blocks, (t) => e.call("part", t)), a = n === void 0 || t !== "html" && t !== "md" ? null : zi(n, t === "html" ? "html" : "markdown", i.blocks, (e) => t === "html" ? An(e, r) : Sn(e, r));
			return a === null ? t === "html" ? kn(i.blocks, {
				title: (e.name ?? "").replace(/\.[^.]+$/, ""),
				images: r
			}) : Sn(i.blocks, r) : a;
		},
		stats: () => {
			let e = 0, t = 0, n = (r) => {
				if (r.t === "p") {
					let n = xe(r.runs);
					e += n.length, n.trim() && t++;
				} else if (r.t === "tbl") for (let e of r.rows) for (let t of e.cells) t.blocks.forEach(n);
			};
			i.blocks.forEach(n);
			let r = Fe ? "" : "+";
			return [
				["Pages", L.length.toLocaleString() + r],
				["Words", Xe.toLocaleString() + r],
				["Characters", e.toLocaleString() + r],
				["Paragraphs", t.toLocaleString() + r],
				["Page size", `${+(A.w / 72).toFixed(2)} × ${+(A.h / 72).toFixed(2)} in`]
			];
		}
	});
	let it = () => {
		let e = T.input.sel(), t = T.state(e)?.link;
		oe({
			title: t ? "Edit link" : "Insert link",
			placeholder: "https://…",
			initial: t,
			ok: "Apply",
			onOk: (t) => void T.setLink(t.trim() || null, e).catch((e) => ce(e.message)),
			extra: t ? {
				label: "Remove",
				run: () => void T.setLink(null, e)
			} : void 0
		});
	}, ot = () => {
		let e = T.state()?.img;
		e && oe({
			title: "Alt text",
			label: "Describe the picture for screen readers",
			initial: e.alt ?? "",
			area: !0,
			ok: "Save",
			onOk: (e) => T.setAltText(e.trim())
		});
	}, st = async (e) => {
		let t = T.input.sel();
		if (t) try {
			if (!e && navigator.clipboard?.read) for (let e of await navigator.clipboard.read()) {
				let n = e.types.find((e) => e.startsWith("image/"));
				if (n) return void T.insertImages([await e.getType(n)], t);
				if (e.types.includes("text/html")) {
					let n = await (await e.getType("text/html")).text();
					if (T.pasteRich(t, {
						files: [],
						getData: (e) => e === "text/html" ? n : ""
					})) return;
				}
			}
			let n = await navigator.clipboard.readText();
			n && ye(T, t, n);
		} catch {
			ce(`The browser blocked clipboard access — use ${Q}V to paste`);
		}
	}, K = (e) => {
		document.execCommand(e) || ce(`Use ${Q}${e === "copy" ? "C" : "X"}`);
	}, dt = () => void qt().then((e) => void (e.length && T.insertImages(e))), pt = () => fe && C.current ? sa(C.current, fe.pa, fe.o) : null, ht = {
		original: () => {
			let e = pt();
			e?.naturalWidth && T.imageOriginal(e.naturalWidth, e.naturalHeight);
		},
		replace: () => void qt("image/*", !1).then((e) => e[0] && T.replaceImage(e[0])),
		alt: ot,
		download: r.canDownload ? () => {
			fe && e.call("part", fe.target).then((e) => Ht(e, fe.target.split("/").pop() ?? "image"));
		} : void 0
	};
	at(() => {
		if (_e.current) return;
		let e = C.current, t = b.current, n = null;
		if (E && fe && e && t) {
			let r = sa(e, fe.pa, fe.o);
			if (r) {
				let e = r.getBoundingClientRect(), i = t.getBoundingClientRect();
				n = {
					x: e.left - i.left + t.scrollLeft,
					y: e.top - i.top + t.scrollTop,
					w: e.width,
					h: e.height
				};
			}
		}
		ge((e) => e === n || e && n && e.x === n.x && e.y === n.y && e.w === n.w && e.h === n.h ? e : n);
	});
	let gt = (e, t) => {
		t.preventDefault(), t.stopPropagation();
		let n = pt();
		if (!fe || !he || !n) return;
		let { w: r, h: i, x: a, y: o } = he, s = fe.w / Math.max(1, r), c = t.clientX, l = t.clientY, u = r, d = i;
		_e.current = !0, ve.current = s;
		let f = (t) => {
			let f = t.clientX - c, p = t.clientY - l, m = r + (e.includes("e") ? f : e.includes("w") ? -f : 0), h = i + (e.includes("s") ? p : e.includes("n") ? -p : 0);
			if (e.length === 2 && !t.shiftKey) {
				let e = Math.max(m / r, h / i);
				m = r * e, h = i * e;
			}
			let g = we / s * 1;
			u = Math.max(8, Math.min(m, g * 2)), d = Math.max(8, h), n.style.width = `${u * s}pt`, n.style.height = `${d * s}pt`, ge({
				x: a,
				y: o,
				w: u,
				h: d
			});
		}, p = () => {
			window.removeEventListener("mousemove", f), window.removeEventListener("mouseup", p), _e.current = !1, ve.current = null, u !== r || d !== i ? T.setImageSize(u * s, d * s) : ge(null);
		};
		window.addEventListener("mousemove", f), window.addEventListener("mouseup", p);
	}, _t = () => {
		let e = T.state(), t = T.input.sel(), n = !!t && (t.a.pa !== t.f.pa || t.a.o !== t.f.o), r = [];
		if (q?.canComment && r.push({
			label: "Comment",
			icon: "commentAdd",
			hint: Ir,
			run: () => q.start(),
			disabled: !e
		}), e?.img && r.push({
			head: "Image",
			label: "Original size",
			icon: "imgOrig",
			run: ht.original
		}, {
			label: "Fit to page width",
			icon: "fit",
			run: () => T.resizeImage("fit")
		}, {
			label: "Replace image…",
			icon: "imgReplace",
			run: ht.replace
		}, {
			label: "Alt text…",
			icon: "alt",
			run: ot
		}, ...ht.download ? [{
			label: "Download image",
			icon: "save",
			run: ht.download
		}] : [], {
			label: "Delete image",
			icon: "trash",
			run: () => T.deleteSelection()
		}), r.push({
			label: "Cut",
			icon: "cut",
			hint: `${Q}X`,
			disabled: !n,
			run: () => K("cut"),
			sep: r.length > 0
		}, {
			label: "Copy",
			icon: "copy",
			hint: `${Q}C`,
			disabled: !n,
			run: () => K("copy")
		}, {
			label: "Paste",
			icon: "paste",
			hint: `${Q}V`,
			run: () => void st(!1)
		}, {
			label: "Paste without formatting",
			icon: "pastePlain",
			hint: `${Q}⇧V`,
			run: () => void st(!0)
		}, {
			label: "Delete",
			icon: "trash",
			disabled: !n || !!e?.img,
			run: () => T.deleteSelection()
		}), e?.link) {
			let t = m(e.link);
			r.push({
				label: "Open link",
				icon: "external",
				sep: !0,
				disabled: !t,
				run: () => t && window.open(t, "_blank", "noopener,noreferrer")
			}, {
				label: "Edit link…",
				icon: "link",
				hint: `${Q}K`,
				run: it
			}, {
				label: "Remove link",
				icon: "unlink",
				run: () => void T.setLink(null)
			});
		} else r.push({
			label: "Insert link…",
			icon: "link",
			hint: `${Q}K`,
			sep: !0,
			run: it,
			disabled: !e
		});
		if (e?.inTable) {
			let t = (e) => () => T.tableOp(e);
			r.push({
				head: "Table",
				label: "Insert row above",
				icon: "rowAbove",
				sep: !0,
				run: t("rowAbove")
			}, {
				label: "Insert row below",
				icon: "rowBelow",
				run: t("rowBelow")
			}, {
				label: "Insert column left",
				icon: "colLeft",
				run: t("colLeft")
			}, {
				label: "Insert column right",
				icon: "colRight",
				run: t("colRight")
			}, {
				label: "Delete row",
				icon: "delRow",
				run: t("delRow")
			}, {
				label: "Delete column",
				icon: "delCol",
				run: t("delCol")
			}, {
				label: "Delete table",
				icon: "trash",
				run: t("delTable")
			}, ...e.cells && e.cells.n > 1 ? [{
				label: "Merge cells",
				icon: "merge",
				run: () => T.mergeCells()
			}] : [], ...e.cells?.merged && e.cells.n < 2 ? [{
				label: "Unmerge cells",
				icon: "merge",
				run: () => T.unmergeCell()
			}] : [], {
				label: "Distribute columns evenly",
				icon: "colAdd",
				run: () => T.distributeColumns()
			});
		} else r.push({
			label: "Insert image…",
			icon: "image",
			sep: !0,
			run: dt,
			disabled: !e
		}, {
			label: "Insert table",
			icon: "table",
			run: () => T.insertTable(3, 3),
			disabled: !e
		}, {
			label: "Page break",
			icon: "pagebreak",
			hint: `${Q}↵`,
			run: () => T.insertPageBreak(),
			disabled: !e
		});
		let i = (e, t) => () => void T.updateStyle(t).then((t) => t !== void 0 && ce(t ? `“${e}” updated to match the selection` : `“${e}” already matches the selection`)).catch((e) => console.error("[office-engine] style update failed", e));
		return r.push({
			label: "Update style to match",
			icon: "styleMatch",
			sep: !0,
			disabled: !e || !!e.img,
			items: ei(c?.styles ?? []).map((t) => ({
				label: t.label,
				hint: t.value === e?.style ? "current" : void 0,
				sep: t.sep,
				run: i(t.label, t.value)
			}))
		}, {
			label: "Clear formatting",
			icon: "clear",
			hint: `${Q}\\`,
			run: () => T.clearFormat(),
			disabled: !e
		}, {
			label: "Select all",
			icon: "selectAll",
			hint: `${Q}A`,
			run: () => T.selectAll()
		}), r;
	}, q = jr();
	T.author = () => q?.me.name ?? "Me";
	let vt = Pr(q), yt = V(() => {});
	yt.current = (e) => {
		let t = T.commentPlaces().get(e), n = b.current;
		if (!t || !n) return;
		let r = Number(t.pa.split(".")[0]), i = L.findIndex((e) => r >= e.start && r < e.end);
		if (i < 0) return;
		let a = () => {
			let t = C.current?.querySelector(`[data-cm~="${CSS.escape(e)}"]`);
			if (!t) return !1;
			let r = t.getBoundingClientRect(), i = n.getBoundingClientRect();
			return (r.top < i.top + 24 || r.bottom > i.bottom - 24) && (n.scrollTop += r.top - i.top - i.height / 3), !0;
		};
		a() || (n.scrollTop = Math.max(0, Le[i] - 16), requestAnimationFrame(() => requestAnimationFrame(() => void a())));
	}, B(() => {
		if (q) return q.setHost({
			kind: "docx",
			hint: "Select the text to comment on.",
			pending: () => {
				let e = T.commentRange();
				return e ? {
					quote: e.quote,
					range: e
				} : null;
			},
			attach: (e, t) => T.markComment(e, t.range),
			placed: (e) => {
				let t = T.commentPlaces(), n = new Map([...t.keys()].map((e, t) => [e, t]));
				return e.filter((e) => t.has(e.root.id)).map((e) => ({
					...e,
					quote: t.get(e.root.id).quote
				})).sort((e, t) => n.get(e.root.id) - n.get(t.root.id));
			},
			reveal: (e) => yt.current(e)
		}), () => q.setHost(null);
	}, [q, T]), B(() => q?.touch(), [q, a]);
	let bt = q ? q.threads().filter((e) => !e.root.done || e.root.id === vt.active).map((e) => e.root.id) : [];
	at(() => {
		let e = globalThis.Highlight, t = CSS.highlights;
		if (!e || !t) return;
		let n = vt.draft?.range, r = C.current, i = n && T.posOf(n.a), a = n && T.posOf(n.f), o = r && i && Ce(r, i), s = r && a && Ce(r, a);
		if (!o || !s) return void t.delete("de-cm-draft");
		let c = document.createRange();
		c.setStart(o[0], o[1]), c.setEnd(s[0], s[1]), t.set("de-cm-draft", new e(c));
	}), B(() => () => void CSS.highlights?.delete("de-cm-draft"), []);
	let xt = c?.styles?.find((e) => e.canon === "title")?.id, St = Ve(() => le ? ua(i.blocks, xt) : [], [
		le,
		a,
		xt
	]), Y = L[Math.max(0, Ye - 1)]?.start ?? 0, X = St.reduce((e, t, n) => t.bi <= Math.max(Y, Je) ? n : e, -1), Z = (e) => {
		let t = b.current, n = L.findIndex((t) => e >= t.start && e < t.end);
		!t || n < 0 || (t.scrollTop = Math.max(0, Le[n] - 16), requestAnimationFrame(() => requestAnimationFrame(() => {
			let n = C.current?.querySelector(`[data-pa="${e}"]`);
			n && (t.scrollTop += n.getBoundingClientRect().top - t.getBoundingClientRect().top - 24), E && T.input.restore({
				a: {
					pa: String(e),
					o: 0
				},
				f: {
					pa: String(e),
					o: 0
				}
			});
		})));
	};
	return /* @__PURE__ */ G("div", {
		style: {
			position: "relative",
			flex: 1,
			minWidth: 0,
			display: "flex"
		},
		children: [
			/* @__PURE__ */ G("div", {
				ref: b,
				className: "de-scroll",
				tabIndex: -1,
				onKeyDown: (e) => {
					(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && (e.preventDefault(), ne((e) => ({
						...e,
						open: !0
					})));
				},
				children: [
					c && I.length > 0 && /* @__PURE__ */ W("div", {
						ref: Ee,
						className: "de-measure de-doc",
						style: {
							...rt,
							width: `${we}pt`
						},
						children: I.map(({ b: e, i: t }) => /* @__PURE__ */ W(ea, {
							block: e,
							ctx: je,
							sp: Ji(e, i.blocks[t - 1], i.blocks[t + 1])
						}, t))
					}),
					/* @__PURE__ */ G("div", {
						ref: C,
						className: E ? "de-pages de-editing" : "de-pages",
						style: {
							height: Be,
							width: He
						},
						contentEditable: E || void 0,
						suppressContentEditableWarning: !0,
						spellCheck: !1,
						onMouseDown: (e) => {
							if (!E) return;
							let t = e.target, n = t.tagName === "IMG" ? t.closest("[data-obj]") : null, r = n && C.current ? Te(C.current, n, 0) : null;
							r && (e.preventDefault(), T.selectObject(r.pa, r.o));
						},
						onMouseUp: () => {
							T.painter && setTimeout(() => T.applyPainter(), 0);
						},
						onClick: (e) => {
							if (!q) return;
							let t = (e.target.closest?.("[data-cm]")?.dataset.cm?.split(" ") ?? []).find((e) => bt.includes(e));
							t ? q.select(t, !1) : vt.active && q.select(null);
						},
						onContextMenu: (e) => {
							E && (e.preventDefault(), ie({
								x: e.clientX,
								y: e.clientY
							}));
						},
						children: [L.map((t, n) => (n < Ue || n > We) && !Ke.has(n) ? null : /* @__PURE__ */ W(pa, {
							index: n,
							count: Ge,
							slice: t,
							blocks: i.blocks,
							meta: c,
							page: A,
							top: Le[n],
							left: U,
							height: z[n],
							zoom: Pe,
							client: e,
							docStyle: rt,
							editing: E,
							colResize: te,
							onHF: E && g ? h : void 0
						}, n)), ze > 0 && /* @__PURE__ */ W("div", {
							className: "de-page-skeleton",
							contentEditable: !1,
							style: {
								top: Re,
								left: U,
								width: R * Pe,
								height: Me * Pe
							}
						})]
					}),
					he && /* @__PURE__ */ G("div", {
						className: "de-img-sel",
						style: {
							left: he.x,
							top: he.y,
							width: he.w,
							height: he.h
						},
						children: [ca.map((e) => /* @__PURE__ */ W("span", {
							className: `de-img-h de-img-${e}`,
							onMouseDown: (t) => gt(e, t)
						}, e)), ve.current && /* @__PURE__ */ G("span", {
							className: "de-img-size",
							children: [
								Math.round(he.w * ve.current),
								" × ",
								Math.round(he.h * ve.current),
								" pt"
							]
						})]
					})
				]
			}),
			le && /* @__PURE__ */ G("nav", {
				className: "de-outline",
				"aria-label": "Document outline",
				children: [/* @__PURE__ */ G("div", {
					className: "de-outline-head",
					children: [/* @__PURE__ */ W("span", { children: "Outline" }), /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb",
						title: "Close outline",
						"aria-label": "Close outline",
						onClick: () => O(!1),
						children: /* @__PURE__ */ W(J, {
							name: "close",
							size: 16
						})
					})]
				}), St.length ? St.map((e, t) => /* @__PURE__ */ W("button", {
					type: "button",
					className: t === X ? "de-outline-item on" : "de-outline-item",
					style: { paddingLeft: 10 + e.lvl * 14 },
					onClick: () => Z(e.bi),
					children: e.text
				}, e.bi)) : /* @__PURE__ */ W("div", {
					className: "de-outline-empty",
					children: "Headings you add to the document will appear here."
				})]
			}),
			D.open && /* @__PURE__ */ W(ri, {
				query: D.q,
				index: D.idx,
				count: et.length,
				editable: E,
				onQuery: (e) => ne({
					open: !0,
					q: e,
					idx: 0
				}),
				onNav: (e) => et.length && tt((D.idx + e + et.length) % et.length),
				onClose: () => ne({
					open: !1,
					q: D.q,
					idx: 0
				}),
				onReplace: (e, t) => {
					et.length && (t ? [...et].reverse().forEach((t) => nt(t, e)) : nt(et[Math.min(D.idx, et.length - 1)], e));
				}
			}),
			E && /* @__PURE__ */ W(ni, {
				editor: T,
				styles: c?.styles ?? [],
				onFind: () => ne((e) => ({
					...e,
					open: !0
				})),
				outline: le,
				onOutline: () => O((e) => !e),
				painter: ue,
				onLink: it,
				image: ht,
				onPageSetup: g ? () => d(!0) : void 0,
				onHeaderFooter: g ? () => p("header") : void 0,
				onNotice: ce
			}),
			!E && g && /* @__PURE__ */ W("button", {
				type: "button",
				className: le ? "de-outline-toggle on" : "de-outline-toggle",
				title: "Document outline",
				onClick: () => O((e) => !e),
				children: /* @__PURE__ */ W(J, { name: "outline" })
			}),
			u && /* @__PURE__ */ W(yi, {
				page: A,
				onClose: () => d(!1),
				onOk: (e) => void T.setPage(e).catch((e) => console.error("[office-engine] page setup failed", e))
			}),
			f && c && /* @__PURE__ */ W(di, {
				meta: c,
				focus: f,
				onClose: () => p(null),
				onOk: (e) => void T.setHeaderFooter(e).catch((e) => console.error("[office-engine] header / footer change failed", e))
			}),
			re && /* @__PURE__ */ W(sn, {
				x: re.x,
				y: re.y,
				items: _t(),
				onClose: () => ie(null)
			}),
			ae && /* @__PURE__ */ W(cn, {
				spec: ae,
				onClose: () => oe(null)
			}),
			se && /* @__PURE__ */ W(un, {
				text: se,
				onDone: () => ce(null)
			}),
			bt.length > 0 && /* @__PURE__ */ W("style", { children: Fr(".de-pages", bt, vt.active) }),
			/* @__PURE__ */ W(nn, {
				zoom: v,
				effective: Pe,
				onChange: y
			}),
			/* @__PURE__ */ W(en, {
				text: Qe,
				onStatus: t
			})
		]
	});
}
function pa({ index: e, count: t, slice: n, blocks: r, meta: i, page: a, top: o, left: s, height: c, zoom: l, client: u, docStyle: d, editing: f, colResize: p, onHF: m }) {
	let h = Ve(() => ({
		client: u,
		page: e,
		pages: t,
		measuring: !1,
		editable: f,
		colResize: f ? p : void 0
	}), [
		u,
		e,
		t,
		f,
		p
	]), g = Ve(() => ({
		...h,
		editable: !1
	}), [h]), { header: _, footer: v, hk: y, fk: b } = ta(i ?? void 0, e), x = [];
	for (let e = n.start; e < n.end; e++) {
		let t = r[e];
		x.push(/* @__PURE__ */ W(ea, {
			block: t,
			ctx: h,
			pa: da(t) || t.t === "tbl" ? String(e) : void 0,
			sp: Ji(t, r[e - 1], r[e + 1])
		}, `${e}:${t.t === "p" ? t.ver ?? 0 : 0}`));
	}
	return /* @__PURE__ */ W("div", {
		className: "de-page",
		style: {
			top: o,
			left: s,
			width: a.w * ra * l,
			height: c
		},
		"data-page": e + 1,
		children: /* @__PURE__ */ G("div", {
			className: "de-page-inner de-doc",
			style: {
				...d,
				width: `${a.w}pt`,
				height: c / l,
				zoom: l
			},
			children: [
				m && /* @__PURE__ */ G(We, { children: [/* @__PURE__ */ W("div", {
					className: "de-hf-zone",
					contentEditable: !1,
					title: "Double-click to edit the header",
					style: {
						top: 0,
						height: `${a.mt}pt`
					},
					onDoubleClick: () => m(y)
				}), /* @__PURE__ */ W("div", {
					className: "de-hf-zone",
					contentEditable: !1,
					title: "Double-click to edit the footer",
					style: {
						bottom: 0,
						height: `${a.mb}pt`
					},
					onDoubleClick: () => m(b)
				})] }),
				_ && /* @__PURE__ */ W("div", {
					className: "de-hf",
					contentEditable: !f && void 0,
					style: {
						top: `${a.header}pt`,
						padding: `0 ${a.mr}pt 0 ${a.ml}pt`
					},
					onDoubleClick: m && (() => m(y)),
					children: _.map((e, t) => /* @__PURE__ */ W(ea, {
						block: e,
						ctx: g
					}, t))
				}),
				/* @__PURE__ */ W("div", {
					className: a.cols && a.cols > 1 ? "de-page-cols" : void 0,
					style: {
						position: "absolute",
						top: `${a.mt}pt`,
						left: `${a.ml}pt`,
						width: `${a.w - a.ml - a.mr}pt`,
						...a.cols && a.cols > 1 ? {
							columnCount: a.cols,
							columnGap: `${a.colGap ?? 36}pt`,
							columnFill: "auto",
							height: `${a.h - a.mt - a.mb}pt`
						} : {}
					},
					children: x
				}),
				v && /* @__PURE__ */ W("div", {
					className: "de-hf",
					contentEditable: !f && void 0,
					style: {
						bottom: `${a.footer}pt`,
						padding: `0 ${a.mr}pt 0 ${a.ml}pt`
					},
					onDoubleClick: m && (() => m(b)),
					children: v.map((e, t) => /* @__PURE__ */ W(ea, {
						block: e,
						ctx: g
					}, t))
				})
			]
		})
	});
}
// src/react/file/DetailsDialog.tsx
var ma = [
	["title", "Title"],
	["subject", "Subject"],
	["creator", "Author"],
	["keywords", "Keywords"],
	["description", "Comments"],
	["lastModifiedBy", "Last modified by"],
	["created", "Created"],
	["modified", "Modified"]
];
async function ha(e) {
	let t = await (await e.call("part", "docProps/core.xml")).text(), n = new DOMParser().parseFromString(t, "application/xml"), r = [];
	for (let [e, t] of ma) {
		let i = n.getElementsByTagNameNS("*", e)[0]?.textContent?.trim();
		if (!i) continue;
		let a = e === "created" || e === "modified" ? new Date(i) : null;
		r.push([t, a && !isNaN(a.getTime()) ? a.toLocaleString() : i]);
	}
	return r;
}
function ga(e) {
	let [t, n] = H([]), r = V(null);
	B(() => {
		r.current?.focus();
		let t = !0;
		return ha(e.client).then((e) => t && n(e), () => {}), () => {
			t = !1;
		};
	}, [e.client]);
	let i = [
		e.file,
		t,
		e.stats
	].filter((e) => e.length);
	return /* @__PURE__ */ W("div", {
		className: "de-dialog-back",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		onKeyDown: (t) => {
			t.key === "Escape" && (t.stopPropagation(), e.onClose());
		},
		children: /* @__PURE__ */ G("div", {
			className: "de-dialog",
			role: "dialog",
			"aria-label": "Document details",
			children: [
				/* @__PURE__ */ W("div", {
					className: "de-dialog-title",
					children: "Document details"
				}),
				/* @__PURE__ */ W("dl", {
					className: "de-details",
					children: i.map((e, t) => /* @__PURE__ */ G(Ne, { children: [t > 0 && /* @__PURE__ */ W("div", { className: "de-details-sep" }), e.map(([e, t]) => /* @__PURE__ */ G(Ne, { children: [/* @__PURE__ */ W("dt", { children: e }), /* @__PURE__ */ W("dd", { children: t })] }, e))] }, t))
				}),
				/* @__PURE__ */ W("div", {
					className: "de-dialog-btns",
					children: /* @__PURE__ */ W("button", {
						ref: r,
						type: "button",
						className: "de-btn de-btn-primary",
						onClick: e.onClose,
						children: "Close"
					})
				})
			]
		})
	});
}
// src/react/file/importFile.ts
var _a = /* @__PURE__ */ new Set([
	"docx",
	"dotx",
	"xlsx",
	"xltx",
	"pptx",
	"potx",
	"pages",
	"key",
	"numbers",
	...ee
]), va = [
	..._a,
	...Object.keys(S),
	...Object.keys(ne),
	"gz"
].map((e) => "." + e).join(",");
async function ya(e) {
	let n = v(e.name);
	if (_a.has(n)) return {
		src: e,
		name: e.name,
		converted: !1
	};
	let r = new Uint8Array(await e.slice(0, 4096).arrayBuffer());
	if (S[n] && n !== "dot" || _(r) || t(e.name, e.type, r, e.size <= 4096)) return {
		src: e,
		name: e.name,
		converted: !0
	};
	if (r[0] === 80 && r[1] === 75) return {
		src: e,
		name: e.name,
		converted: !1
	};
	let i = h(r);
	throw Error(`Cannot open “${e.name}”${i ? ` (it is ${i})` : ""}: supported files are Word, Excel, PowerPoint (also 97-2003), OpenDocument, RTF, Pages, Keynote, Numbers, Visio, CSV, text, Markdown, HTML, SVG, Mermaid, PlantUML and Graphviz (also gzip-compressed: .svgz, .csv.gz)`);
}
// src/react/styles.css?inline
var ba = ".de-root{--de-bg:#e9ebee;--de-chrome:#fff;--de-border:#dadde1;--de-text:#1d2127;--de-muted:#69707a;--de-accent:#1a73e8;--de-accent-hover:#1765cc;--de-accent-ink:#fff;--de-accent-soft:#1a73e81f;--de-grid:#e2e4e7;--de-head:#f6f7f8;--de-head-ink:#5f6368;--de-head-border:#d3d6da;--de-corner-border:#c4c7cc;--de-freeze:#b9bdc3;--de-on:#d3e3fd;--de-on-ink:#0b57d0;--de-on-ink-strong:#041e49;--de-ink:#444746;--de-ink-strong:#1f1f1f;--de-ink-soft:#3c4043;--de-hover:#44474614;--de-hover-solid:#f1f3f4;--de-hover-soft:#e8f0fe;--de-ebar:#eef2f9;--de-tb-sep:#c7c7c7;--de-pop:#fff;--de-pop-shadow:0 2px 6px 2px #3c404326, 0 1px 2px #3c40434d;--de-sep:#e3e3e3;--de-input-bg:#fff;--de-input-border:#747775;--de-swatch-border:#00000026;--de-disabled:#b0b4ba;--de-danger:#b42318;--de-danger-border:#f3c2bd;--de-ok:#137333;--de-tab-hover:#eceef1;--de-tab-on:#fff;--de-tab-ink:#188038;--de-toast-bg:#323232;--de-toast-ink:#fff;--de-backdrop:#20212452;--de-shadow:0 1px 2px #0f172a1a, 0 2px 8px #0f172a0f;--de-cm-bg:#fbbc0447;--de-cm-on:#fbbc0499;--de-cm-line:#f29900;--de-cm-card:#fff;--de-cm-quote:#f29900;--de-cm-line-on:#c26401;--de-font:system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;--de-font-mono:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;--de-font-size:13px;--de-radius-sm:4px;--de-radius:6px;--de-radius-lg:8px;--de-radius-xl:12px;--de-shadow-sm:0 2px 8px #00000026;--de-shadow-md:0 2px 8px #0000004d;--de-shadow-lg:0 8px 28px #00000047;--de-kind-docx:#2b579a;--de-kind-xlsx:#217346;--de-kind-pptx:#c43e1c;--de-kind-ink:#fff;--de-avatar-ink:#fff;--de-find:#fde293;--de-find-on:#ff9632;--de-find-cell:#fbbc0447;--de-find-cell-on:#ff963273;--de-find-cell-line:#e37400;--de-tip-bg:#202124d9;--de-tip-ink:#fff;--de-present-bg:#000;--de-present-ink:#ffffff80;--de-status-idle:#9aa0a6;--de-status-live:#1e8e3e;--de-status-busy:#f9ab00;--de-status-error:#d93025;--de-page:#fff;--de-page-ink:#000;--de-sheet-ink:#1d2127;--de-skeleton:#eef0f2;--de-ph-border:#b8bec6;--de-ph-a:#f6f7f9;--de-ph-b:#eff1f4;--de-ph-ink:#6a737d;--de-ph-outline:#3c404366;--de-ph-hint:#80868b;--de-src-bg:#fff;--de-src-gutter:#f6f7f8;--de-src-sel:var(--de-accent-soft);--de-src-font:ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace;--de-src-comment:#6a737d;--de-src-keyword:#8e3bc7;--de-src-string:#1a7f37;--de-src-operator:#c2410c;--de-src-number:#0b7a8a;--de-src-heading:#0b57d0;--de-src-attr:#0b57d0;--de-src-tag:#b42318;--de-src-meta:#8a5a00;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light;background:var(--de-bg);width:100%;height:100%;min-height:200px;color:var(--de-text);font:var(--de-font-size)/1.4 var(--de-font);text-align:left;isolation:isolate;flex-direction:column;display:flex;position:relative;overflow:hidden}.de-root *,.de-root :before,.de-root :after{box-sizing:border-box}.de-root img{max-width:none}.de-root.de-dark{--de-bg:#17191c;--de-chrome:#23262a;--de-border:#3b3f45;--de-text:#e3e5e8;--de-muted:#9aa0a6;--de-accent:#669df6;--de-accent-hover:#8ab4f8;--de-accent-ink:#062e6f;--de-accent-soft:#669df62e;--de-head:#2a2d32;--de-head-ink:#bdc1c6;--de-head-border:#3f434a;--de-corner-border:#4a4f57;--de-freeze:#5f6368;--de-on:#3a4a66;--de-on-ink:#aecbfa;--de-on-ink-strong:#d3e3fd;--de-ink:#c4c7c5;--de-ink-strong:#e3e3e3;--de-ink-soft:#c4c7c5;--de-hover:#e3e3e31a;--de-hover-solid:#3a3d43;--de-hover-soft:#33405a;--de-ebar:#2b3140;--de-tb-sep:#5a5e66;--de-pop:#2e3136;--de-pop-shadow:0 2px 6px 2px #0006, 0 1px 2px #0009;--de-sep:#45494f;--de-input-bg:#1f2124;--de-input-border:#8e918f;--de-swatch-border:#ffffff2e;--de-disabled:#6f7378;--de-danger:#f2b8b5;--de-danger-border:#6e2b27;--de-ok:#81c995;--de-tab-hover:#34383e;--de-tab-on:#363a41;--de-tab-ink:#81c995;--de-toast-bg:#e3e3e3;--de-toast-ink:#1f1f1f;--de-backdrop:#0000008c;--de-shadow:0 1px 2px #00000080, 0 2px 10px #00000073;--de-cm-card:#2b2e33;--de-cm-quote:#fdd663;--de-src-bg:#1b1d20;--de-src-gutter:#202327;--de-src-comment:#8b949e;--de-src-keyword:#d2a8ff;--de-src-string:#7ee787;--de-src-operator:#ffa657;--de-src-number:#79c0ff;--de-src-heading:#8ab4f8;--de-src-attr:#8ab4f8;--de-src-tag:#ff7b72;--de-src-meta:#e3b341;--lightningcss-light: ;--lightningcss-dark:initial;color-scheme:dark}@supports (background:color-mix(in srgb, red, transparent)){.de-root{--de-src-sel:color-mix(in srgb, var(--de-accent) 25%, transparent)}.de-root.de-dark{--de-src-sel:color-mix(in srgb, var(--de-accent) 35%, transparent)}}.de-bar{background:var(--de-chrome);border-bottom:1px solid var(--de-border);z-index:21;flex:none;align-items:center;gap:10px;min-height:40px;padding:6px 12px;display:flex;position:relative}.de-badge{font:600 10px/1 var(--de-font);letter-spacing:.06em;text-transform:uppercase;border-radius:var(--de-radius-sm);color:var(--de-kind-ink);flex:none;padding:4px 6px}.de-badge-docx{background:var(--de-kind-docx)}.de-badge-xlsx{background:var(--de-kind-xlsx)}.de-badge-pptx{background:var(--de-kind-pptx)}.de-title{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-weight:600;overflow:hidden}.de-status{color:var(--de-muted);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none}.de-progress{background:var(--de-accent);height:2px;transition:width .2s,opacity .4s;position:absolute;bottom:-1px;left:0}.de-body{flex:1;min-height:0;display:flex;position:relative}.de-scroll{overscroll-behavior:contain;flex:1;min-width:0;position:relative;overflow:auto}.de-center{color:var(--de-muted);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:24px;display:flex;position:absolute;inset:0}.de-spinner{border:3px solid var(--de-accent-soft);border-top-color:var(--de-accent);border-radius:50%;width:28px;height:28px;animation:.8s linear infinite de-spin}@keyframes de-spin{to{transform:rotate(360deg)}}.de-error{max-width:460px;color:var(--de-danger);background:var(--de-pop);border:1px solid var(--de-danger-border);border-radius:var(--de-radius-lg);box-shadow:var(--de-shadow);padding:14px 18px}.de-zoom{z-index:4;background:var(--de-chrome);border:1px solid var(--de-border);border-radius:var(--de-radius-lg);box-shadow:var(--de-shadow);align-items:center;display:flex;position:absolute;bottom:16px;right:16px;overflow:hidden}.de-zoom button,.de-tab,.de-btn{appearance:none;color:inherit;font:inherit;cursor:pointer;background:0 0;border:0}.de-zoom button{justify-content:center;align-items:center;width:32px;height:30px;font-size:16px;line-height:1;display:inline-flex}.de-zoom button:hover,.de-btn:hover{background:var(--de-accent-soft)}.de-zoom span{text-align:center;font-variant-numeric:tabular-nums;cursor:pointer;min-width:52px;font-size:12px}.de-btn{border-radius:var(--de-radius);padding:4px 8px}.de-pages{position:relative}.de-page{background:var(--de-page,#fff);box-shadow:var(--de-shadow);position:absolute;overflow:hidden}.de-page-inner{transform-origin:0 0;position:relative}.de-page-skeleton{background:var(--de-page);box-shadow:var(--de-shadow);opacity:.6;position:absolute}.de-page-skeleton:after{content:\"\";background:repeating-linear-gradient(var(--de-skeleton) 0 10px, transparent 10px 24px);animation:1.4s ease-in-out infinite de-pulse;position:absolute;inset:12%}@keyframes de-pulse{50%{opacity:.45}}.de-doc{color:var(--de-page-ink,#000);font-kerning:normal;text-rendering:optimizelegibility}.de-doc a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}.de-hf{position:absolute;left:0;right:0}.de-measure{visibility:hidden;pointer-events:none;contain:layout style;position:absolute;top:0;left:-100000px}.de-p{white-space:pre-wrap;overflow-wrap:break-word;tab-size:36pt;margin:0}.de-p>span{white-space:inherit}.de-marker{text-indent:0;white-space:pre;display:inline-block}.de-tbl{border-collapse:collapse;table-layout:fixed}[data-obj][data-tc]{outline-offset:1px;outline:2px solid}[data-obj][data-tc=del]{opacity:.45}.de-tbl-wrap{position:relative}.de-tbl-wrap>.de-tbl{margin:0!important}.de-col-resize{cursor:col-resize;z-index:2;touch-action:none;width:6px;position:absolute;top:0;bottom:0}.de-col-resize:hover{background:var(--de-accent-soft);background:color-mix(in srgb, var(--de-accent) 35%, transparent)}.de-tbl td.de-cell-sel{box-shadow:inset 0 0 0 9999px var(--de-accent-soft);box-shadow:inset 0 0 0 9999px color-mix(in srgb, var(--de-accent) 16%, transparent)}.de-tbl td{vertical-align:top;overflow-wrap:break-word;text-indent:0;padding:0}.de-img-missing,.de-ph{border:1px dashed var(--de-ph-border,#b8bec6);background:repeating-linear-gradient(45deg, var(--de-ph-a,#f6f7f9) 0 8px, var(--de-ph-b,#eff1f4) 8px 16px);color:var(--de-ph-ink,#6a737d);font:12px/1.2 var(--de-font,sans-serif);text-indent:0;vertical-align:bottom;justify-content:center;align-items:center;display:inline-flex;overflow:hidden}.de-tbox{vertical-align:top;text-indent:0;padding:3.6pt 7.2pt;display:inline-block;overflow:hidden}.de-xlsx{flex-direction:column;flex:1;min-width:0;display:flex}.de-fx{background:var(--de-chrome);border-bottom:1px solid var(--de-border);height:30px;font:12px/30px var(--de-font-mono);flex:none;align-items:stretch;display:flex}.de-fx-ref{border-right:1px solid var(--de-border);width:88px;color:var(--de-muted);flex:none;padding:0 10px}.de-fx-val{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;padding:0 10px;overflow:hidden}.de-grid{background:var(--de-page);min-height:0;color:var(--de-sheet-ink);outline:none;flex:1;position:relative;overflow:auto}.de-grid-view{z-index:1;position:sticky;top:0;left:0;overflow:hidden}.de-region{position:absolute;overflow:hidden}.de-xl-pic{z-index:2;object-fit:fill;pointer-events:none;-webkit-user-select:none;user-select:none;position:absolute}.de-xl-drawing{z-index:2;box-sizing:border-box;border:1px dashed var(--de-border);background:var(--de-chrome);background:color-mix(in srgb, var(--de-chrome) 94%, transparent);color:var(--de-muted);text-align:center;pointer-events:none;border-radius:4px;flex-direction:column;justify-content:center;align-items:center;gap:3px;padding:6px;font:12px/1.3 system-ui,sans-serif;display:flex;position:absolute;overflow:hidden}.de-xl-drawing svg{color:var(--de-accent)}.de-xl-drawing strong{color:var(--de-text);font-weight:600}.de-gl-h,.de-gl-v{background:var(--de-grid);position:absolute}.de-gl-h{height:1px;left:0;right:0}.de-gl-v{width:1px;top:0;bottom:0}.de-cell{white-space:pre;align-items:flex-end;padding:0 3px 1px;line-height:1.2;display:flex;position:absolute;overflow:hidden}.de-cell>span{min-width:0}.de-cell.de-ov{overflow:visible}.de-head-c,.de-head-r{background:var(--de-head);color:var(--de-head-ink);font:11px/1 var(--de-font);font-variant-numeric:tabular-nums;border-right:1px solid var(--de-head-border);border-bottom:1px solid var(--de-head-border);-webkit-user-select:none;user-select:none;justify-content:center;align-items:center;display:flex;position:absolute}.de-head-on{background:var(--de-on);color:var(--de-on-ink);font-weight:600}.de-corner{background:var(--de-head);border-right:1px solid var(--de-corner-border);border-bottom:1px solid var(--de-corner-border);z-index:2;position:absolute;top:0;left:0}.de-freeze-h,.de-freeze-v{background:var(--de-freeze);z-index:2;position:absolute}.de-sel{border:2px solid var(--de-accent);pointer-events:none;z-index:3;position:absolute}.de-tabs{background:var(--de-head);border-top:1px solid var(--de-border);scrollbar-width:thin;flex:none;align-items:stretch;gap:2px;height:34px;padding:0 8px;display:flex;overflow-x:auto}.de-tab{color:var(--de-muted);white-space:nowrap;border-radius:0 0 6px 6px;flex:none;padding:0 14px}.de-tab:hover{background:var(--de-tab-hover)}.de-tab[aria-selected=true]{background:var(--de-tab-on);color:var(--de-tab-ink);box-shadow:inset 0 2px 0 var(--de-tab-ink);font-weight:600}.de-thumbs{border-right:1px solid var(--de-border);background:var(--de-chrome);flex:none;width:188px;position:relative;overflow-y:auto}.de-thumb{cursor:pointer;gap:6px;padding:0 10px 0 6px;display:flex;position:absolute;left:0;right:0}.de-thumb-n{text-align:right;width:18px;color:var(--de-muted);font-variant-numeric:tabular-nums;flex:none;font-size:11px}.de-thumb .de-slide{outline:1px solid var(--de-border)}.de-thumb[aria-current=true] .de-slide{outline:2px solid var(--de-accent)}.de-slide{background:var(--de-page,#fff);position:relative;overflow:hidden}.de-slide-frame{box-shadow:var(--de-shadow);position:absolute}.de-slide-inner{transform-origin:0 0;color:var(--de-page-ink,#000);position:absolute;top:0;left:0;overflow:hidden}.de-el{position:absolute}.de-txt{flex-direction:column;display:flex;position:absolute;inset:0}.de-txt>div{white-space:pre-wrap;overflow-wrap:break-word}.de-txt.de-nowrap>div{white-space:pre}.de-slide-editable .de-el>.de-txt:empty{outline:1.5px dashed var(--de-ph-outline);outline-offset:-1px}.de-slide-editable .de-el>.de-txt:empty:after{content:\"Click to add text\";color:var(--de-ph-hint);font:28px/1.2 var(--de-font);text-align:center;pointer-events:none}.de-bul{text-indent:0;white-space:pre;display:inline-block}.de-stbl{border-collapse:collapse;table-layout:fixed;width:100%}.de-stbl td{vertical-align:top;padding:0;position:relative}.de-hidden-slide{opacity:.55}.de-mode{border:1px solid var(--de-border);border-radius:var(--de-radius);background:var(--de-chrome);height:28px;color:inherit;font:inherit;cursor:pointer;flex:none;align-items:center;gap:6px;padding:0 10px;font-weight:500;display:inline-flex}.de-mode:hover{background:var(--de-accent-soft)}.de-mode-on{border-color:var(--de-accent);color:var(--de-accent)}.de-save-dirty{background:var(--de-accent);border-color:var(--de-accent);color:var(--de-accent-ink)}.de-save-dirty:hover{background:var(--de-accent-hover)}.de-mode:disabled{opacity:.6;cursor:default}.de-ebar-host{background:var(--de-chrome);border-bottom:1px solid var(--de-border);z-index:20;flex:none;padding:6px 10px;position:relative}.de-ebar{background:var(--de-ebar);min-width:0;height:40px;color:var(--de-ink);border-radius:20px;flex-wrap:nowrap;align-items:center;gap:2px;padding:0 8px;display:flex}.de-ebar-it{flex:none;align-items:center;display:inline-flex}.de-ebar-morewrap{margin-left:auto}.de-tb-pop.de-ebar-more{background:var(--de-ebar);flex-wrap:wrap;align-items:center;gap:2px;width:max-content;max-width:min(360px,90vw);padding:6px;display:flex;left:auto;right:0}.de-icon{flex:none;justify-content:center;align-items:center;line-height:1;display:inline-flex}.de-icon>svg{width:1em;height:1em}.de-tb{appearance:none;border-radius:var(--de-radius-sm);width:28px;height:28px;color:var(--de-ink);font:600 14px/1 var(--de-font);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;transition:background-color .1s;display:inline-flex;position:relative}.de-tb:hover:not(:disabled){background:var(--de-hover)}.de-tb:focus-visible,.de-dd:focus-visible{outline:2px solid var(--de-accent);outline-offset:-2px}.de-tb-on{color:var(--de-on-ink-strong);background:var(--de-on)!important}.de-tb:disabled{opacity:.38;cursor:default}.de-tb-chev{gap:0;width:auto;padding:0 2px 0 4px}.de-tb-sep{background:var(--de-tb-sep);flex:none;width:1px;height:20px;margin:0 5px}.de-tb-color{display:inline-flex;position:relative}.de-tb-swatch{height:3px;box-shadow:inset 0 0 0 1px var(--de-swatch-border);border-radius:1px;position:absolute;bottom:3px;left:6px;right:6px}.de-tb-pop{z-index:30;background:var(--de-pop);border-radius:var(--de-radius-lg);box-shadow:var(--de-pop-shadow);padding:10px;position:absolute;top:calc(100% + 6px);left:0}.de-tb-none{border:1px solid var(--de-border);border-radius:var(--de-radius-sm);background:var(--de-pop);width:100%;color:inherit;font:inherit;cursor:pointer;margin-bottom:8px;padding:5px}.de-tb-none:hover{background:var(--de-hover-solid)}.de-dd-wrap{display:inline-flex;position:relative}.de-dd{appearance:none;border-radius:var(--de-radius-sm);height:28px;color:var(--de-ink-strong);font:13px/1 var(--de-font);cursor:pointer;background:0 0;border:0;align-items:center;gap:4px;padding:0 2px 0 6px;transition:background-color .1s;display:inline-flex}.de-dd:hover:not(:disabled),.de-dd-open{background:var(--de-hover)}.de-dd:disabled{opacity:.38;cursor:default}.de-dd>svg,.de-dd>.de-icon{color:var(--de-ink);flex:none}.de-dd-label{text-overflow:ellipsis;white-space:nowrap;text-align:left;flex:1;min-width:0;overflow:hidden}.de-dd-ph{color:var(--de-muted)}.de-dd-pop{z-index:40;background:var(--de-pop);border-radius:var(--de-radius-lg);min-width:100%;max-height:min(380px,60vh);box-shadow:var(--de-pop-shadow);color:var(--de-ink-strong);font:13px/1.3 var(--de-font);padding:6px 0;position:absolute;top:calc(100% + 4px);left:0;overflow-y:auto}.de-dd-opt{white-space:nowrap;cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;gap:8px;min-height:32px;padding:4px 16px 4px 10px;display:flex}.de-dd-opt>svg,.de-dd-opt>.de-icon{color:var(--de-ink);flex:none}.de-dd-hi{background:var(--de-hover-solid)}.de-dd-dis{opacity:.4;cursor:default}.de-dd-check{width:16px;color:var(--de-on-ink);flex:none;display:inline-flex}.de-dd-text{text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}.de-dd-hint{color:var(--de-muted);font-variant-numeric:tabular-nums;margin-left:auto;padding-left:28px;font-size:12px}.de-dd-sep{background:var(--de-sep);height:1px;margin:6px 0}.de-dd-head{color:var(--de-muted);letter-spacing:.04em;text-transform:uppercase;-webkit-user-select:none;user-select:none;padding:6px 16px 2px 10px;font-size:11px;font-weight:600}.de-dd.de-file{flex:none;padding:0 4px 0 8px;font-weight:500}.de-dd.de-file+.de-dd-pop{max-height:720px}.de-size{align-items:center;gap:1px;display:inline-flex;position:relative}.de-size-step{width:24px}.de-size-input{border:1px solid var(--de-input-border);border-radius:var(--de-radius-sm);width:38px;height:26px;color:var(--de-ink-strong);font:13px/1 var(--de-font);text-align:center;background:0 0;outline:none;padding:0}.de-size-input:focus{border-color:var(--de-accent);box-shadow:inset 0 0 0 1px var(--de-accent);background:var(--de-input-bg)}.de-size-input:disabled{opacity:.38}.de-size-pop{width:40px;min-width:40px;padding:4px 0;left:25px}.de-size-pop .de-dd-opt{justify-content:center;min-height:28px;padding:0}.de-borders{grid-template-columns:repeat(4,30px);gap:4px;display:grid}.de-borders .de-tb{width:30px;height:30px}.de-tb-grid{grid-template-columns:repeat(8,18px);gap:4px;display:grid}.de-tb-grid button{border:1px solid var(--de-swatch-border);cursor:pointer;border-radius:50%;width:18px;height:18px;padding:0}.de-tb-grid button:hover{transform:scale(1.15)}.de-tb-grid button.on{box-shadow:0 0 0 2px var(--de-pop), 0 0 0 3.5px var(--de-accent)}.de-tb-custom{color:var(--de-muted);letter-spacing:.04em;text-transform:uppercase;margin:10px 0 6px;font-size:11px;font-weight:600}.de-tb-grid button.de-tb-add{background:var(--de-pop);border:1px dashed var(--de-input-border);color:var(--de-ink);justify-content:center;align-items:center;display:inline-flex}.de-tb-native{opacity:0;pointer-events:none;border:0;width:1px;height:1px;padding:0;position:absolute;bottom:0;left:0}.de-editing{caret-color:var(--de-page-ink);outline:none}.de-editing .de-page-inner{cursor:text}.de-editing [contenteditable=false]{cursor:default}.de-find{z-index:6;background:var(--de-pop);border:1px solid var(--de-border);border-radius:var(--de-radius-lg);box-shadow:var(--de-shadow);flex-direction:column;gap:4px;padding:6px;display:flex;position:absolute;top:10px;right:18px}.de-find-row{align-items:center;gap:2px;display:flex}.de-find input{border:1px solid var(--de-border);border-radius:var(--de-radius);background:var(--de-input-bg);width:200px;height:28px;color:var(--de-text);font:inherit;outline:none;padding:0 8px}.de-find input:focus{border-color:var(--de-accent)}.de-find-count{text-align:center;min-width:56px;color:var(--de-muted);font-variant-numeric:tabular-nums;font-size:12px}::highlight(de-find){background-color:var(--de-find)}::highlight(de-find-cur){background-color:var(--de-find-on)}::highlight(de-cm-draft){background-color:var(--de-cm-on)}.de-range{background:var(--de-accent-soft);background:color-mix(in srgb, var(--de-accent) 10%, transparent);border:1px solid var(--de-accent);border:1px solid color-mix(in srgb, var(--de-accent) 60%, transparent);pointer-events:none;z-index:2;position:absolute}.de-cell-edit{color:inherit;z-index:5;border:2px solid var(--de-accent);resize:none;background:var(--de-page);box-shadow:var(--de-shadow-sm);white-space:pre-wrap;outline:none;padding:1px 3px;line-height:1.2;position:absolute;overflow:hidden}.de-fx-input{font:inherit;color:inherit;resize:none;white-space:pre;background:0 0;border:0;outline:none;margin:0}.de-fx-input:focus{background:var(--de-input-bg);box-shadow:inset 0 -2px 0 var(--de-accent)}.de-tb-hint{color:var(--de-muted);margin-left:8px;font-size:12px}.de-slide-editable [data-sid]:hover{outline:1px dashed var(--de-accent);outline:1px dashed color-mix(in srgb, var(--de-accent) 60%, transparent)}.de-txt-edit{outline:2px solid var(--de-accent);outline-offset:0;caret-color:var(--de-page-ink);cursor:text;z-index:2}.de-gridpick{grid-template-columns:repeat(8,16px);gap:3px;display:grid}.de-gridpick button{border:1px solid var(--de-border);background:var(--de-pop);cursor:pointer;border-radius:2px;width:16px;height:16px;padding:0}.de-gridpick button.on{background:var(--de-on);border-color:var(--de-accent)}.de-gridpick-label{text-align:center;color:var(--de-muted);margin-top:6px;font-size:12px}.de-prompt{align-items:center;gap:6px;display:flex}.de-prompt input{border:1px solid var(--de-border);border-radius:var(--de-radius);background:var(--de-input-bg);width:240px;height:28px;color:var(--de-text);font:inherit;outline:none;padding:0 8px}.de-prompt input:focus{border-color:var(--de-accent)}.de-prompt .de-btn{border:1px solid var(--de-border);background:var(--de-pop)}.de-shape-sel{border:1.5px solid var(--de-accent);pointer-events:none;z-index:5;transform-origin:50%;position:absolute}.de-handle{background:var(--de-page);border:1px solid var(--de-accent);pointer-events:auto;border-radius:2px;position:absolute}.de-h-nw,.de-h-se{cursor:nwse-resize}.de-h-ne,.de-h-sw{cursor:nesw-resize}.de-h-n,.de-h-s{cursor:ns-resize}.de-h-e,.de-h-w{cursor:ew-resize}.de-slide-editable [data-top]{cursor:move}.de-slide-editable [data-sid]{cursor:text}.de-present{z-index:2147483000;background:var(--de-present-bg);cursor:none;outline:none;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.de-present .de-slide{box-shadow:none}.de-present-n{color:var(--de-present-ink);font:12px var(--de-font);position:absolute;bottom:12px;right:16px}.de-present-btn{z-index:4;position:absolute;bottom:56px;right:16px}.de-grip-c{cursor:col-resize;z-index:3;width:6px;position:absolute;top:0}.de-grip-r{cursor:row-resize;z-index:3;height:6px;position:absolute;left:0}.de-grip-c:hover,.de-grip-r:hover{background:var(--de-accent-soft);background:color-mix(in srgb, var(--de-accent) 35%, transparent)}.de-ctx{z-index:50;background:var(--de-pop);border-radius:var(--de-radius-lg);min-width:240px;max-width:340px;box-shadow:var(--de-pop-shadow);font:13px/1.3 var(--de-font);color:var(--de-ink-strong);-webkit-user-select:none;user-select:none;padding:6px 0;position:fixed}.de-ctx-row{display:contents}.de-ctx button{width:100%;min-height:30px;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;align-items:center;gap:10px;padding:4px 16px 4px 12px;display:flex}.de-ctx button.de-ctx-hi:not(:disabled){background:var(--de-hover-solid)}.de-ctx button:disabled{color:var(--de-disabled);cursor:default}.de-ctx-icon{width:16px;color:var(--de-ink);flex:none;display:inline-flex}.de-ctx button:disabled .de-ctx-icon{opacity:.4}.de-ctx-label{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.de-ctx-hint{color:var(--de-muted);margin-left:16px;font-size:12px}.de-ctx-more{color:var(--de-muted);margin:0 -6px 0 8px;display:inline-flex;transform:rotate(-90deg)}.de-ctx-sub{min-width:200px;max-height:calc(100vh - 8px);overflow-y:auto}.de-ctx-sep{background:var(--de-sep);height:1px;margin:6px 0}.de-ctx-head{color:var(--de-muted);letter-spacing:.03em;text-transform:uppercase;padding:6px 16px 2px 38px;font-size:11px;font-weight:600}.de-tab-add{align-items:center;padding:0 10px;display:inline-flex}.de-tab-input{border:1px solid var(--de-accent);border-radius:var(--de-radius-sm);background:var(--de-input-bg);width:120px;color:var(--de-text);font:inherit;margin:4px 2px;padding:0 6px}.de-fx{position:relative}.de-fref{pointer-events:none;z-index:2;border:2px solid;position:absolute}.de-fref-pt{border-style:dashed}.de-cell-hl{z-index:4;pointer-events:none;color:var(--de-sheet-ink);overflow-wrap:break-word;overflow:hidden}.de-cell-edit{overflow-wrap:break-word}.de-cell-sink{z-index:0;resize:none;opacity:0;pointer-events:none;caret-color:#0000;background:0 0;border:0;outline:none;margin:0;padding:0;position:absolute;overflow:hidden}.de-fill-handle{z-index:4;box-sizing:border-box;border:1px solid var(--de-page);background:var(--de-accent);cursor:crosshair;width:8px;height:8px;position:absolute}.de-fill-preview{z-index:3;box-sizing:border-box;border:1px dashed var(--de-sheet-ink);pointer-events:none;position:absolute}.de-cell-edit-fx{color:#0000;caret-color:var(--de-sheet-ink);box-shadow:none;background:0 0}.de-cell-edit-fx::selection{color:#0000;background:var(--de-accent-soft);background:color-mix(in srgb, var(--de-accent) 25%, transparent)}.de-fassist-at{z-index:30;position:absolute}.de-fassist{background:var(--de-pop);border:1px solid var(--de-border);border-radius:var(--de-radius);min-width:240px;max-width:420px;box-shadow:var(--de-pop-shadow);font:12px/1.45 var(--de-font);color:var(--de-text);text-align:left;white-space:normal;padding:4px 0}.de-fsug{cursor:pointer;text-overflow:ellipsis;white-space:nowrap;padding:3px 10px;overflow:hidden}.de-fsug.on{background:var(--de-hover-soft)}.de-fsug-name{font-weight:600}.de-fsug-args{color:var(--de-muted);margin-left:2px}.de-fsug-desc{color:var(--de-muted);white-space:normal;margin-top:2px;font-size:11.5px}.de-fhint{font-family:var(--de-font-mono);padding:6px 10px}.de-fhint .de-fsug-desc{font-family:var(--de-font)}.de-fhint b{color:var(--de-accent)}.de-img-sel{z-index:4;border:1.5px solid var(--de-accent);pointer-events:none;position:absolute}.de-img-h{background:var(--de-page);border:1.5px solid var(--de-accent);pointer-events:auto;border-radius:2px;width:9px;height:9px;margin:-5px 0 0 -5px;position:absolute}.de-img-nw{cursor:nwse-resize;top:0;left:0}.de-img-n{cursor:ns-resize;top:0;left:50%}.de-img-ne{cursor:nesw-resize;top:0;left:100%}.de-img-e{cursor:ew-resize;top:50%;left:100%}.de-img-se{cursor:nwse-resize;top:100%;left:100%}.de-img-s{cursor:ns-resize;top:100%;left:50%}.de-img-sw{cursor:nesw-resize;top:100%;left:0}.de-img-w{cursor:ew-resize;top:50%;left:0}.de-img-size{border-radius:var(--de-radius-sm);background:var(--de-tip-bg);color:var(--de-tip-ink);font:11px/1.4 var(--de-font);white-space:nowrap;padding:2px 6px;position:absolute;bottom:-28px;left:50%;transform:translate(-50%)}.de-outline{z-index:6;background:var(--de-pop);width:240px;max-height:calc(100% - 24px);box-shadow:var(--de-pop-shadow);font:13px/1.35 var(--de-font);border-radius:10px;flex-direction:column;padding:6px 6px 10px;display:flex;position:absolute;top:12px;left:12px;overflow-y:auto}.de-outline-head{color:var(--de-ink-strong);flex-shrink:0;justify-content:space-between;align-items:center;padding:4px 4px 6px 10px;font-weight:600;display:flex}.de-outline-item{border-radius:var(--de-radius);width:100%;color:var(--de-ink-soft);font:inherit;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;background:0 0;border:0;flex-shrink:0;padding:5px 10px;display:block;overflow:hidden}.de-outline-item:hover{background:var(--de-hover-solid)}.de-outline-item.on{color:var(--de-on-ink);font-weight:600}.de-outline-empty{color:var(--de-muted);flex-shrink:0;padding:8px 10px}.de-outline-toggle{z-index:6;border:1px solid var(--de-border);border-radius:var(--de-radius-lg);background:var(--de-pop);width:34px;height:34px;color:inherit;box-shadow:var(--de-shadow);cursor:pointer;justify-content:center;align-items:center;font-size:16px;display:inline-flex;position:absolute;top:12px;left:12px}.de-outline-toggle.on{display:none}.de-symbols{grid-template-columns:repeat(12,26px);gap:2px;display:grid}.de-symbols button{border-radius:var(--de-radius-sm);width:26px;height:26px;font:15px/1 var(--de-font);color:var(--de-ink-strong);cursor:pointer;background:0 0;border:0;padding:0}.de-symbols button:hover{background:var(--de-hover-soft)}.de-dialog-back{z-index:60;background:var(--de-backdrop);justify-content:center;align-items:flex-start;padding-top:18vh;display:flex;position:fixed;inset:0}.de-dialog{background:var(--de-pop);border-radius:var(--de-radius-xl);width:min(420px,100vw - 32px);box-shadow:var(--de-shadow-lg);font:14px/1.4 var(--de-font);color:var(--de-ink-strong);flex-direction:column;gap:10px;padding:20px;display:flex}.de-dialog-title{font-size:16px;font-weight:600}.de-dialog-label,.de-dialog-note{color:var(--de-muted);font-size:12.5px}.de-dialog input,.de-dialog textarea{border:1px solid var(--de-input-border);border-radius:var(--de-radius);background:var(--de-input-bg);width:100%;color:var(--de-text);font:inherit;resize:vertical;outline:none;padding:8px 10px}.de-dialog input:focus,.de-dialog textarea:focus{border-color:var(--de-accent);box-shadow:inset 0 0 0 1px var(--de-accent)}.de-hf-zone{z-index:1;cursor:default;position:absolute;left:0;right:0}.de-hf-zone:hover{background:var(--de-accent-soft);background:color-mix(in srgb, var(--de-accent) 5%, transparent)}.de-hfd{width:460px}.de-hfd textarea{min-height:70px}.de-hfd-tabs{flex-wrap:wrap;gap:4px;display:flex}.de-hfd-tabs button{border:1px solid var(--de-border);background:var(--de-pop);color:var(--de-text);font:inherit;cursor:pointer;border-radius:14px;padding:5px 10px;font-size:12.5px}.de-hfd-tabs button.on{background:var(--de-accent);border-color:var(--de-accent);color:var(--de-accent-ink)}.de-ps{gap:10px;width:380px;max-width:calc(100vw - 32px)}.de-ps-note{color:var(--de-muted);margin-top:-4px;font-size:12px}.de-ps-row{flex-wrap:wrap;align-items:center;gap:12px;display:flex}.de-ps-head{align-items:center;gap:10px;min-width:72px;font-size:12px;font-weight:600;display:flex}.de-ps-grid{grid-template-columns:1fr 1fr;gap:8px 16px;display:grid}.de-ps-field{align-items:center;gap:6px;font-size:13px;display:flex}.de-ps-field>span{min-width:48px}.de-ps-field input{width:64px}.de-ps-field em{color:var(--de-muted);font-size:12px;font-style:normal}.de-ps-wide,.de-ps-wide select{flex:1}.de-ps-radio{cursor:pointer;align-items:center;gap:4px;font-size:13px;display:inline-flex}.de-ps-radio input{width:auto;margin:0;padding:0}.de-ps-preset{font-size:12px;font-weight:400}.de-ps select,.de-hfd select{border:1px solid var(--de-input-border);border-radius:var(--de-radius);background:var(--de-input-bg);color:var(--de-text);font:inherit;padding:6px 8px}.de-page-cols>*{break-inside:avoid}.de-ps-bad{color:var(--de-danger)}.de-dialog-btns .de-btn:disabled{opacity:.5;cursor:default}.de-dialog-btns{justify-content:flex-end;gap:8px;margin-top:4px;display:flex}.de-dialog-btns .de-btn{border:1px solid var(--de-border);background:var(--de-pop);border-radius:18px;padding:7px 14px}.de-dialog-btns .de-btn-primary{background:var(--de-accent);border-color:var(--de-accent);color:var(--de-accent-ink)}.de-dialog-btns .de-btn-primary:hover{background:var(--de-accent-hover)}.de-dialog-extra{margin-right:auto}.de-details{grid-template-columns:max-content 1fr;gap:7px 18px;margin:4px 0;font-size:13px;display:grid}.de-details dt{color:var(--de-muted)}.de-details dd{overflow-wrap:anywhere;min-width:0;margin:0}.de-details-sep{background:var(--de-sep);grid-column:1/-1;height:1px}.de-toast{z-index:60;border-radius:var(--de-radius);background:var(--de-toast-bg);color:var(--de-toast-ink);font:13px/1.4 var(--de-font);box-shadow:var(--de-shadow-md);padding:10px 16px;position:absolute;bottom:24px;left:50%;transform:translate(-50%)}.de-xlsx{position:relative}.de-xlsx .de-find{top:40px}.de-find-opts{color:var(--de-ink-soft);gap:10px;padding:2px 4px;font-size:12px}.de-find-opt{cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;gap:4px;display:inline-flex}.de-findcell{z-index:1;background:var(--de-find-cell);pointer-events:none;position:absolute}.de-findcell.on{background:var(--de-find-cell-on);box-shadow:inset 0 0 0 1.5px var(--de-find-cell-line)}.de-borders-pop{align-items:flex-start;gap:8px;display:flex}.de-borders-side{border-left:1px solid var(--de-sep);flex-direction:column;gap:4px;padding-left:8px;display:flex}.de-find .de-find-opt input{width:auto;height:auto;accent-color:var(--de-accent);margin:0;padding:0}.de-find-opts{justify-content:flex-start}.de-collab{flex:none;align-items:center;gap:8px;display:inline-flex}.de-collab-status{border-radius:var(--de-radius-xl);height:24px;color:var(--de-muted);background:var(--de-head);white-space:nowrap;align-items:center;gap:6px;padding:0 9px;font-size:12px;display:inline-flex}.de-collab-dot{background:var(--de-status-idle);border-radius:50%;flex:none;width:7px;height:7px}.de-collab-live .de-collab-dot{background:var(--de-status-live);box-shadow:0 0 0 3px var(--de-status-live);box-shadow:0 0 0 3px color-mix(in srgb, var(--de-status-live) 18%, transparent)}.de-collab-live{color:var(--de-ok)}.de-collab-connecting .de-collab-dot,.de-collab-syncing .de-collab-dot{background:var(--de-status-busy);animation:1s ease-in-out infinite alternate de-collab-pulse}.de-collab-offline .de-collab-dot{background:var(--de-status-idle)}.de-collab-error{color:var(--de-danger)}.de-collab-error .de-collab-dot{background:var(--de-status-error)}@keyframes de-collab-pulse{to{opacity:.35}}@media (max-width:640px){.de-collab-label{display:none}.de-bar{flex-wrap:wrap;row-gap:6px}.de-title{flex:60px}}.de-peers{align-items:center;display:inline-flex}.de-peer{border:2px solid var(--de-chrome);width:26px;height:26px;color:var(--de-avatar-ink);letter-spacing:.02em;cursor:default;-webkit-user-select:none;user-select:none;border-radius:50%;place-items:center;margin-left:-6px;font-size:11px;font-weight:600;display:inline-grid}.de-peer:first-child{margin-left:0}.de-peer-more{background:var(--de-muted)}.de-peer-layer{pointer-events:none;z-index:4;position:absolute;inset:0;overflow:hidden}.de-peer-caret{background:var(--peer);border-radius:1px;width:2px;margin-left:-1px;position:absolute}.de-peer-caret:before{content:\"\";background:var(--peer);border-radius:50%;width:6px;height:6px;position:absolute;top:-3px;left:-2px}.de-peer-flag{background:var(--peer);color:var(--de-avatar-ink);font:600 11px/16px var(--de-font);white-space:nowrap;border-radius:4px 4px 4px 0;margin-bottom:2px;padding:1px 6px;position:absolute;bottom:100%;left:-1px}.de-peer-sel{background:var(--peer);opacity:.18;border-radius:1px;position:absolute}.de-peer-outline{border:2px solid var(--peer);border-radius:3px;position:absolute}.de-peer-outline>.de-peer-flag{margin-bottom:1px;left:-2px}.de-peer-range{pointer-events:none;z-index:2;border:2px solid;position:absolute}.de-peer-tag{color:var(--de-avatar-ink);font:600 10px/15px var(--de-font);white-space:nowrap;border-radius:3px 3px 3px 0;padding:0 5px;position:absolute;top:-17px;left:-2px}.de-cm-panel{background:var(--de-chrome);border-left:1px solid var(--de-border);width:320px;max-width:100%;min-height:0;font:13px/1.4 var(--de-font);color:var(--de-text);z-index:7;flex-direction:column;flex:none;display:flex;position:relative}@media (max-width:640px){.de-cm-panel{width:min(100%,360px);box-shadow:var(--de-pop-shadow);position:absolute;inset:0 0 0 auto}}.de-cm-bar{border-bottom:1px solid var(--de-border);align-items:center;gap:6px;padding:8px 8px 8px 14px;display:flex}.de-cm-title{color:var(--de-ink-strong);flex:1;align-items:center;gap:6px;font-weight:600;display:flex}.de-cm-badge{background:var(--de-accent-soft);min-width:18px;color:var(--de-accent);font:600 11px/16px var(--de-font);text-align:center;border-radius:9px;padding:1px 6px}.de-cm-filter{color:var(--de-muted);font-size:12px}.de-cm-filter.on{color:var(--de-accent)}.de-cm-list{flex-direction:column;flex:1;gap:10px;min-height:0;padding:10px;display:flex;overflow-y:auto}.de-cm-new{border:1px dashed var(--de-border);border-radius:var(--de-radius-lg);width:100%;color:var(--de-ink);font:inherit;cursor:pointer;text-align:left;background:0 0;align-items:center;gap:8px;padding:8px 10px;display:flex}.de-cm-new:hover{background:var(--de-hover);border-color:var(--de-accent);color:var(--de-accent)}.de-cm-keys{color:var(--de-muted);margin-left:auto;font-size:11px}.de-cm-notice{border-radius:var(--de-radius-lg);background:var(--de-hover-soft);color:var(--de-ink-soft);align-items:center;gap:6px;padding:6px 6px 6px 10px;font-size:12px;display:flex}.de-cm-notice span{flex:1}.de-cm-card{border:1px solid var(--de-border);background:var(--de-cm-card);cursor:pointer;border-radius:10px;outline:none;flex:none;padding:10px 12px;transition:box-shadow .12s,border-color .12s}.de-cm-card:hover{border-color:var(--de-input-border)}.de-cm-card:focus-visible{box-shadow:0 0 0 2px var(--de-accent)}.de-cm-card.on{cursor:default;box-shadow:var(--de-pop-shadow);border-color:#0000}.de-cm-card.done{opacity:.75}.de-cm-card.on.done{opacity:1}.de-cm-quote{border-left:3px solid var(--de-cm-quote);color:var(--de-muted);-webkit-line-clamp:2;word-break:break-word;-webkit-box-orient:vertical;margin:0 0 8px;padding:0 0 0 8px;font-size:12px;display:-webkit-box;overflow:hidden}.de-cm-resolved{color:var(--de-ok);text-transform:uppercase;letter-spacing:.03em;margin:-2px 0 6px;font-size:11px;font-weight:600}.de-cm-item+.de-cm-item{border-top:1px solid var(--de-sep);margin-top:10px;padding-top:10px}.de-cm-head{align-items:center;gap:8px;display:flex}.de-cm-ava{width:28px;height:28px;color:var(--de-avatar-ink);font:600 11px/1 var(--de-font);text-transform:uppercase;border-radius:50%;flex:none;justify-content:center;align-items:center;display:inline-flex}.de-cm-who{flex-direction:column;flex:1;min-width:0;display:flex}.de-cm-name{color:var(--de-ink-strong);text-overflow:ellipsis;white-space:nowrap;font-weight:600;overflow:hidden}.de-cm-time{color:var(--de-muted);font-size:11px}.de-cm-icon{opacity:0;width:26px;height:26px}.de-cm-card:hover .de-cm-icon,.de-cm-card.on .de-cm-icon,.de-cm-icon:focus-visible{opacity:1}@media (hover:none){.de-cm-icon{opacity:1}}.de-cm-text{white-space:pre-wrap;word-break:break-word;color:var(--de-text);margin:6px 0 0 36px}.de-cm-at{color:var(--de-accent);font-weight:600}.de-cm-count{border-top:1px solid var(--de-sep);color:var(--de-accent);margin:8px 0 0 36px;padding-top:8px;font-size:12px}.de-cm-compose{cursor:auto;margin-top:10px;position:relative}.de-cm-item .de-cm-compose{margin-left:36px}.de-cm-compose textarea{resize:none;border:1px solid var(--de-border);border-radius:var(--de-radius-lg);background:var(--de-input-bg);width:100%;min-height:34px;max-height:200px;color:var(--de-text);font:inherit;outline:none;padding:7px 10px;line-height:1.4;display:block}.de-cm-compose textarea:focus{border-color:var(--de-accent);box-shadow:0 0 0 1px var(--de-accent)}.de-cm-actions{justify-content:flex-end;align-items:center;gap:6px;margin-top:6px;display:flex}.de-cm-tip{color:var(--de-muted);margin-right:auto;font-size:11px}.de-cm-actions .de-btn{border:1px solid var(--de-border);border-radius:16px;padding:5px 12px;font-size:12px}.de-cm-actions .de-btn-primary{background:var(--de-accent);border-color:var(--de-accent);color:var(--de-accent-ink)}.de-cm-actions .de-btn-primary:hover{background:var(--de-accent-hover)}.de-cm-actions .de-btn:disabled{opacity:.5;cursor:default}.de-cm-pop{z-index:30;background:var(--de-pop);border-radius:var(--de-radius-lg);max-height:220px;box-shadow:var(--de-pop-shadow);padding:4px;position:absolute;top:calc(100% - 32px);left:0;right:0;overflow-y:auto}.de-cm-pop button{border-radius:var(--de-radius);width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:5px 8px;display:flex}.de-cm-pop button.on,.de-cm-pop button:hover{background:var(--de-hover-soft)}.de-cm-pop .de-cm-ava{width:22px;height:22px;font-size:10px}.de-cm-empty{color:var(--de-muted);text-align:center;padding:24px 8px}.de-cm-toggle .de-cm-n{border-radius:var(--de-radius-lg);background:var(--de-accent);min-width:16px;color:var(--de-accent-ink);font:600 10px/16px var(--de-font);padding:0 5px}.de-cm-mark{z-index:4;border-style:solid;border-width:0 8px 8px 0;border-color:transparent var(--de-cm-line) transparent transparent;pointer-events:none;width:0;height:0;position:absolute}.de-cm-mark.on{border-right-color:var(--de-cm-line-on)}.de-cm-pin{z-index:4;border:2px solid var(--de-avatar-ink);background:var(--de-cm-line);width:26px;height:26px;color:var(--de-avatar-ink);font:600 11px/1 var(--de-font);cursor:pointer;box-shadow:var(--de-shadow-md);border-radius:13px 13px 13px 2px;justify-content:center;align-items:center;margin:-26px 0 0;padding:0;display:flex;position:absolute}.de-cm-pin.on{background:var(--de-accent);transform:scale(1.12)}.de-main{flex:1;min-width:0;min-height:0;display:flex;position:relative}.de-picture{box-sizing:border-box;justify-content:center;align-items:center;padding:24px;display:flex}.de-picture img{object-fit:contain;max-width:100%;max-height:100%;display:block}.de-body-stacked{flex-direction:column}.de-src-pane{background:var(--de-chrome);flex:none;min-width:0;min-height:0;display:flex;position:relative}.de-body-stacked .de-src-pane{width:auto!important}.de-split-handle{cursor:col-resize;background:var(--de-border);touch-action:none;flex:none;width:6px}.de-split-handle:hover,.de-split-handle:focus-visible{background:var(--de-accent);outline:none}.de-body-stacked .de-split-handle{cursor:row-resize;width:auto;height:6px}.de-src{min-width:0;min-height:0;color:var(--de-text);flex-direction:column;flex:1;display:flex}.de-src-head{border-bottom:1px solid var(--de-border);flex:none;align-items:center;gap:10px;height:36px;padding:0 6px 0 12px;font-size:12px;display:flex}.de-src-title{align-items:center;gap:6px;font-weight:600;display:inline-flex}.de-src-lines{color:var(--de-muted)}.de-src-btn{border-radius:var(--de-radius);width:28px;height:28px;color:var(--de-ink);cursor:pointer;background:0 0;border:0;place-items:center;display:inline-grid}.de-dark .de-src-btn{color:var(--de-text)}.de-src-btn:hover{background:var(--de-hover)}.de-src-notice{color:var(--de-muted);background:var(--de-head);border-bottom:1px solid var(--de-border);flex:none;padding:6px 12px;font-size:12px;line-height:1.4}.de-src-scroll{background:var(--de-src-bg);flex:1;align-items:stretch;min-height:0;display:flex;overflow:auto}.de-src-gutter,.de-src-hl,.de-src-input{font:13px/20px var(--de-src-font);letter-spacing:0;tab-size:4;white-space:pre;word-wrap:normal;overflow-wrap:normal;margin:0}.de-src-gutter{z-index:1;text-align:right;height:max-content;min-height:100%;color:var(--de-muted);background:var(--de-src-gutter);border-right:1px solid var(--de-border);-webkit-user-select:none;user-select:none;flex:none;padding:10px 10px 10px 12px;position:sticky;left:0}.de-src-code{flex:1 0 auto;height:max-content;min-height:100%;display:grid}.de-src-hl,.de-src-input{grid-area:1/1;padding:10px 24px 10px 12px}.de-src-hl{pointer-events:none;color:var(--de-text)}.de-src-input{resize:none;color:#0000;-webkit-text-fill-color:transparent;width:100%;height:100%;caret-color:var(--de-text);background:0 0;border:0;border-radius:0;outline:none;display:block;overflow:hidden}.de-src-input::selection{background:var(--de-src-sel)}.de-tk-c{color:var(--de-src-comment);font-style:italic}.de-tk-k{color:var(--de-src-keyword)}.de-tk-s{color:var(--de-src-string)}.de-tk-o{color:var(--de-src-operator)}.de-tk-n{color:var(--de-src-number)}.de-tk-h{color:var(--de-src-heading);font-weight:600}.de-tk-a{color:var(--de-src-attr)}.de-tk-t{color:var(--de-src-tag)}.de-tk-m{color:var(--de-src-meta)}.de-tk-b{font-weight:700}.de-tk-i{font-style:italic}", xa = "office-engine-styles";
function Sa(e = typeof document < "u" ? document : void 0) {
	if (!e) return;
	let t = e instanceof Document ? e.head : e;
	if (t.querySelector?.(`style#${xa}`)) return;
	let n = (e instanceof Document ? e : e.ownerDocument).createElement("style");
	n.id = xa, n.textContent = ba, t.appendChild(n);
}
// src/react/file/print.tsx
var Ca = "\nhtml, body { margin: 0; padding: 0; background: #fff; }\n.de-print {\n  color: #000;\n  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n  -webkit-print-color-adjust: exact;\n  print-color-adjust: exact;\n}\n.de-print *, .de-print *::before, .de-print *::after { box-sizing: border-box; }\n.de-print img { max-width: none; }\n.de-print-page { position: relative; overflow: hidden; background: #fff; break-after: page; }\n.de-print-page:last-child { break-after: auto; }\n/* a page of a document taller than the sheet runs over several: the box shows all of it */\n.de-print-tall { overflow: visible; }\n.de-print-page > .de-page { left: 0; top: 0; box-shadow: none; }\n/* position: own paint layer, so clipping cells after layout (fitText) stays cheap */\n.de-print-table { position: relative; border-collapse: collapse; table-layout: fixed; }\n.de-print-table td { padding: 0 3px 1px; vertical-align: bottom; white-space: pre; }\n.de-print-table.de-print-grid td { border: 1px solid #e2e4e7; }\n.de-print-grid + .de-print-grid { margin-top: -1px; }\n@media screen {\n  body { background: #e9ebee; }\n  .de-print { padding: 24px 16px; }\n  .de-print-page { margin: 0 auto 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18); }\n  .de-print-sheet { width: max-content; max-width: none; margin: 0 auto; padding: 16px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18); }\n}\n@media print {\n  .de-print-fit { zoom: var(--de-fit, 1); }\n}\n", wa = (e) => `${ba}\n${Ca}\n@page { size: ${e.size}; margin: ${e.margin}; }\n`, Ta = (e) => new Promise((t) => setTimeout(t, e));
async function Ea(e, t) {
	await Ta(0), await new Promise((e) => {
		let n, r = setTimeout(a, 8e3), i = new MutationObserver(() => {
			clearTimeout(n), n = setTimeout(a, 250);
		});
		function a() {
			i.disconnect(), clearTimeout(n), clearTimeout(r), e();
		}
		i.observe(t, {
			subtree: !0,
			childList: !0,
			attributes: !0
		}), n = setTimeout(a, 250);
	});
	let n = /* @__PURE__ */ new Set();
	for (let e of t.querySelectorAll("[style*=\"url(\"]")) for (let t of e.style.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) /^(?:blob|data):/i.test(t[1]) && n.add(t[1]);
	let r = [...t.querySelectorAll("img")].map((e) => e.complete ? null : new Promise((t) => (e.onload = t, e.onerror = t)));
	for (let e of n) r.push(new Promise((t) => {
		let n = new Image();
		n.onload = n.onerror = t, n.src = e;
	}));
	await Promise.race([Promise.all(r), Ta(1e4)]), await Promise.race([e.fonts?.ready, Ta(3e3)]);
}
var Da = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;
function Oa(e, t, n) {
	for (; e < t;) {
		let r = e + t >> 1;
		n(r) ? t = r : e = r + 1;
	}
	return e;
}
function ka(e) {
	let t = e.ownerDocument.defaultView, n = e.ownerDocument.createRange(), r = (e, t) => (n.setStart(e, t), n.setEnd(e, t + 1), n.getBoundingClientRect()), i = [], a = [];
	for (let o of e.querySelectorAll("[data-de-fit]")) {
		let e = o.firstChild;
		if (e?.nodeType !== Node.TEXT_NODE || e.nextSibling) continue;
		let s = e, c = s.data;
		n.selectNodeContents(s);
		let l = n.getBoundingClientRect(), u = o.getBoundingClientRect(), d = u.left + o.clientLeft - .5, f = u.left + o.clientLeft + o.clientWidth + .5;
		if (l.left >= d && l.right <= f) continue;
		let p = t.getComputedStyle(o);
		if (o.dataset.deFit === "#") {
			let e = o.clientWidth - parseFloat(p.paddingLeft) - parseFloat(p.paddingRight);
			i.push([s, "#".repeat(Math.max(1, Math.floor(e / (l.width / c.length))))]);
		} else if (Da.test(c) || p.whiteSpace !== "pre" && p.whiteSpace !== "nowrap") a.push(o);
		else {
			let e = [], t = 0;
			for (let n of c.split("\n")) {
				let i = t + n.length, a = Oa(t, i, (e) => r(s, e).left >= d), o = Oa(a, i, (e) => r(s, e).right > f);
				/[\udc00-\udfff]/.test(c[a] ?? "") && a++, /[\ud800-\udbff]/.test(c[o - 1] ?? "") && o--, e.push(c.slice(a, Math.max(a, o))), t = i + 1;
			}
			i.push([s, e.join("\n")]);
		}
	}
	for (let [e, t] of i) e.data = t;
	for (let e of a) e.style.overflow = "hidden";
}
async function Aa(e, t) {
	let n = document.createElement("iframe");
	n.setAttribute("aria-hidden", "true"), n.tabIndex = -1, n.style.cssText = "position:fixed;left:-20000px;top:0;width:1100px;height:800px;border:0;visibility:hidden", document.body.appendChild(n);
	let r = n.contentDocument;
	r.open(), r.write("<!doctype html><html><head><meta charset=\"utf-8\"></head><body></body></html>"), r.close(), r.title = t;
	let i = r.createElement("style");
	i.textContent = wa(e), r.head.appendChild(i);
	let a = r.createElement("div");
	a.className = "de-print", r.body.appendChild(a);
	let o = Ge(a);
	o.render(e.node);
	let s = !1, c = () => {
		s || (s = !0, o.unmount(), n.remove());
	};
	try {
		await Ea(r, a), ka(a);
	} catch (e) {
		throw c(), e;
	}
	return {
		frame: n,
		doc: r,
		host: a,
		dispose: c
	};
}
var ja = null;
async function Ma(e, t) {
	ja?.dispose();
	let n = await Aa(e, t);
	ja = n;
	let r = n.frame.contentWindow, i = () => {
		ja === n && (ja = null), setTimeout(() => n.dispose(), 1e3);
	};
	r.addEventListener("afterprint", i, { once: !0 }), setTimeout(i, 6e5);
	let a = document.title;
	document.title = t;
	try {
		r.focus();
		let e = !1;
		try {
			e = r.document.execCommand("print", !1);
		} catch {
			e = !1;
		}
		e || r.print();
	} finally {
		document.title = a;
	}
}
var Na = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function Pa(e) {
	return new Promise((t, n) => {
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error), r.readAsDataURL(e);
	});
}
async function Fa(e, t) {
	let n = await Aa(e, t);
	try {
		let r = n.host.outerHTML.replace(/ contenteditable="(?:true|false)"| data-de-fit="#?"/g, ""), i = new Set(r.match(/blob:[^"'()\s&]+/g) ?? []);
		for (let e of i) try {
			let t = await Pa(await (await fetch(e)).blob());
			r = r.split(e).join(t);
		} catch {}
		let a = `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${Na(t)}</title><style>${wa(e)}</style></head><body>${r}</body></html>\n`;
		return new Blob([a], { type: "text/html;charset=utf-8" });
	} finally {
		n.dispose();
	}
}
// src/react/file/FileMenu.tsx
var Ia = {
	docx: "Word document",
	xlsx: "Excel workbook",
	pptx: "PowerPoint presentation"
}, La = {
	docx: ".docx",
	xlsx: ".xlsx",
	pptx: ".pptx"
}, Ra = {
	docx: [{
		id: "txt",
		label: "Plain text",
		ext: ".txt",
		mime: "text/plain"
	}, {
		id: "md",
		label: "Markdown",
		ext: ".md",
		mime: "text/markdown"
	}],
	xlsx: [{
		id: "csv",
		label: "CSV (current sheet)",
		ext: ".csv",
		mime: "text/csv"
	}, {
		id: "tsv",
		label: "TSV (current sheet)",
		ext: ".tsv",
		mime: "text/tab-separated-values"
	}],
	pptx: [{
		id: "txt",
		label: "Plain text",
		ext: ".txt",
		mime: "text/plain"
	}]
}, za = /^(new:|open$|import$|rename$|details$|close$|extra:)/;
function Ba(e) {
	let [t, n] = H(!1), r = V(!1), i = V(e);
	i.current = e;
	let a = e.kind, o = [], s = (e) => {
		e.length && (e[0] = {
			...e[0],
			sep: o.length > 0
		}, o.push(...e));
	};
	s(e.canOpen ? [
		{
			value: "new:docx",
			label: "Document",
			icon: "doc",
			head: "New"
		},
		{
			value: "new:xlsx",
			label: "Spreadsheet",
			icon: "table"
		},
		{
			value: "new:pptx",
			label: "Presentation",
			icon: "slides"
		},
		{
			value: "open",
			label: "Open…",
			icon: "open",
			hint: `${Q}O`,
			sep: !0
		}
	] : []), e.canImport && a === "xlsx" && o.push({
		value: "import",
		label: "Import CSV into new sheet…",
		icon: "table",
		sep: !e.canOpen && o.length > 0
	});
	let c = [];
	a && e.canSave && c.push({
		value: "save",
		label: "Save",
		icon: "save",
		hint: `${Q}S`
	}), a && e.rename && c.push({
		value: "rename",
		label: "Rename…",
		icon: "edit"
	}), s(c), e.canDownload && a && s([
		{
			value: "original",
			label: Ia[a],
			icon: "save",
			hint: e.ext || La[a],
			head: "Download as"
		},
		{
			value: "pdf",
			label: "PDF document",
			icon: "pdf",
			hint: ".pdf"
		},
		...e.picture ? [{
			value: "picture",
			label: e.picture.label,
			icon: "image",
			hint: e.picture.ext
		}] : [{
			value: "html",
			label: "Web page",
			icon: "html",
			hint: ".html"
		}, ...Ra[a].map((e) => ({
			value: "text:" + e.id,
			label: e.label,
			icon: "doc",
			hint: e.ext
		}))]
	]);
	let l = [];
	a && e.details && l.push({
		value: "details",
		label: "Document details",
		icon: "info"
	}), a && e.canDownload && l.push({
		value: "print",
		label: "Print",
		icon: "print",
		hint: `${Q}P`
	}), s(l), s(e.extra.map((e, t) => ({
		value: `extra:${t}`,
		label: e.label,
		icon: e.icon,
		hint: e.hint,
		disabled: e.disabled
	}))), e.close && s([{
		value: "close",
		label: "Close",
		icon: "close"
	}]);
	let u = async (e) => {
		let t = i.current;
		if (e.startsWith("new:")) return t.create(e.slice(4));
		if (e.startsWith("extra:")) return t.extra[Number(e.slice(6))]?.onClick();
		switch (e) {
			case "open": {
				let [e] = await qt(va, !1);
				e && t.open(e);
				return;
			}
			case "rename": return t.rename?.();
			case "details": return t.details?.();
			case "close": return t.close?.();
			case "save": return t.save();
		}
		let n = t.ops.current;
		if (e === "import") {
			let [e] = await qt(".csv,.tsv,.tab,.txt", !1);
			if (!e) return;
			if (!n?.importText) throw Error("The document is still loading — try again in a moment");
			await n.importText(e, e.name.replace(/\.[^.]+$/, "").slice(0, 31) || "Imported");
		} else if (t.kind && t.canDownload) {
			if (e === "original") return t.downloadOriginal();
			if (e === "picture") return t.picture?.download();
			if (!n) throw Error("The document is still loading — try again in a moment");
			if (await n.flush?.(), e.startsWith("text:")) {
				let r = Ra[t.kind].find((t) => "text:" + t.id === e);
				if (!r) return;
				Ht(new Blob([await n.text(r.id)], { type: `${r.mime};charset=utf-8` }), t.base + r.ext);
			} else if (e === "pdf" || e === "print" || e === "html") {
				t.notify(e === "pdf" ? "Preparing PDF… choose “Save as PDF” in the print dialog" : "Preparing…");
				let r = await n.printable();
				r.notice && t.notify(r.notice), e === "html" ? Ht(await Fa(r, t.base), t.base + ".html") : await Ma(r, t.base);
			}
		}
	};
	return {
		options: o,
		busy: t,
		run: (e) => {
			let t = za.test(e);
			(!r.current || t) && (t || (r.current = !0, n(!0)), Promise.resolve().then(() => u(e)).catch((e) => i.current.notify(e.message || String(e))).finally(() => {
				t || (r.current = !1, n(!1));
			}));
		}
	};
}
function Va({ actions: e }) {
	return e.options.length ? /* @__PURE__ */ W(Z, {
		title: "File",
		label: "File",
		className: "de-file",
		options: e.options,
		onChange: e.run,
		menuWidth: 280,
		disabled: e.busy
	}) : null;
}
// src/react/theme.ts
var Ha = /* @__PURE__ */ "bg.chrome.border.text.muted.accent.accent-hover.accent-ink.accent-soft.on.on-ink.on-ink-strong.ink.ink-strong.ink-soft.hover.hover-solid.hover-soft.ebar.tb-sep.pop.pop-shadow.sep.input-bg.input-border.swatch-border.disabled.danger.danger-border.ok.tab-hover.tab-on.tab-ink.toast-bg.toast-ink.backdrop.shadow.grid.head.head-ink.head-border.corner-border.freeze.cm-bg.cm-on.cm-line.cm-line-on.cm-card.cm-quote.font.font-mono.font-size.radius-sm.radius.radius-lg.radius-xl.shadow-sm.shadow-md.shadow-lg.kind-docx.kind-xlsx.kind-pptx.kind-ink.avatar-ink.find.find-on.find-cell.find-cell-on.find-cell-line.tip-bg.tip-ink.present-bg.present-ink.status-idle.status-live.status-busy.status-error.page.page-ink.sheet-ink.skeleton.ph-border.ph-a.ph-b.ph-ink.ph-outline.ph-hint.src-bg.src-gutter.src-sel.src-font.src-comment.src-keyword.src-string.src-operator.src-number.src-heading.src-attr.src-tag.src-meta".split("."), Ua = (e) => e, Wa = (e) => e.replace(/[A-Z]/g, (e) => "-" + e.toLowerCase()), Ga = (e) => typeof e == "object" ? e.mode ?? "light" : e ?? "light";
function Ka(e, t) {
	if (!e || typeof e != "object") return {};
	let n = {};
	for (let r of [e.tokens, t ? e.dark : e.light]) if (r) for (let [e, t] of Object.entries(r)) t != null && t !== "" && (n["--de-" + Wa(e)] = t);
	return n;
}
function qa(e, t) {
	let n = K(Ga(e));
	return {
		className: n ? "de-root de-dark" : "de-root",
		style: {
			...Ka(e, n),
			...t
		},
		dark: n
	};
}
// src/react/source/highlight.ts
var Ja = (e) => e.map(([e, t]) => [new RegExp(typeof e == "string" ? e : e.source, "y" + (typeof e == "string" ? "" : e.flags.replace(/[gy]/g, ""))), t]), Ya = {
	mermaid: Ja([
		[/%%.*/, "c"],
		[/"[^"]*"/, "s"],
		[/\|[^|\n]*\|(?=\s*[\w"([{])/, "s"],
		["\\b(?:graph|flowchart|subgraph|end|direction|classDef|class|style|linkStyle|click|sequenceDiagram|participant|actor|loop|alt|else|opt|par|and|critical|option|break|rect|[Nn]ote|over|left of|right of|activate|deactivate|autonumber|title|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|state|erDiagram|pie|showData|gantt|dateFormat|axisFormat|excludes|section|mindmap|namespace|TB|TD|BT|RL|LR|as|box|create|destroy|done|active|crit|milestone|after)\\b", "k"],
		[/<<-->>|<<->>|-->>|->>|--[x)]|-[x)]|<?-\.+->?|<?={2,}>?|<?-{2,}[>ox]?|->|~~~|<\|--|--\|>|\*--|--\*|o--|--o|\.\.>|\.\.\|>|<\.\.|\.\.|[|}][|o]--[|o][|{]|[|}][|o]\.\.[|o][|{]|:::|&/, "o"],
		[/\b\d+(?:\.\d+)?\b/, "n"],
		[/#[0-9a-fA-F]{3,8}\b/, "n"]
	]),
	plantuml: Ja([
		[/@(?:start|end)\w*/, "k"],
		[/![a-z]+\b.*/, "k"],
		[/"[^"]*"/, "s"],
		[/^\s*:[^;\n]*[;|<>/\]}]?/, "s"],
		[/\b(?:participant|actor|boundary|control|entity|database|collections|queue|class|interface|abstract|enum|annotation|package|namespace|node|component|usecase|rectangle|cloud|folder|frame|artifact|storage|card|file|object|state|start|stop|end|if|then|else|elseif|endif|while|endwhile|repeat|fork|again|merge|note|of|left|right|top|bottom|over|alt|opt|loop|par|break|critical|group|return|activate|deactivate|destroy|create|autonumber|title|skinparam|as|is|not|detach|kill|partition|split|switch|case|endswitch|hide|show|footbox|direction|to)\b/, "k"],
		[/<<[^>\n]*>>/, "a"],
		[/[<*o#x}|^+]{0,2}(?:-+|\.{2,}|=+)(?:\[[^\]\n]*\])?(?:up|down|left|right)?(?:-+|\.+|=+)?(?:\|>|>>?|[*o#x{|^+\\/]{1,2})|<\|?(?:-+|\.+)|--+|\.\.+|\+\+|\*\*|!!/, "o"],
		[/#[0-9a-zA-Z]{3,8}\b/, "n"],
		[/\b\d+\b/, "n"]
	]),
	graphviz: Ja([
		[/\/\/.*/, "c"],
		[/"(?:\\.|[^"\\])*"/, "s"],
		[/<(?:[^<>]|<[^<>]*>)*>/, "s"],
		[/\b(?:strict|graph|digraph|subgraph|node|edge)\b/i, "k"],
		[/[\w.]+(?=\s*=)/, "a"],
		[/->|--/, "o"],
		[/-?\b\d+(?:\.\d+)?\b/, "n"]
	]),
	html: Ja([
		[/<!\[CDATA\[.*?\]\]>/, "c"],
		[/<!doctype[^>]*>/i, "k"],
		[/<\/?[A-Za-z][\w:-]*/, "t"],
		[/\/?>/, "t"],
		[/[\w:-]+(?==)/, "a"],
		[/"[^"\n]*"|'[^'\n]*'/, "s"],
		[/&(?:#\d+|#x[0-9a-fA-F]+|\w+);/, "n"]
	]),
	markdown: Ja([
		[/`[^`\n]+`/, "m"],
		[/!?\[[^\]\n]*\]\([^)\n]*\)/, "a"],
		[/<https?:\/\/[^>\s]+>/, "a"],
		[/(\*\*|__)(?=\S)[^\n]*?\S\1/, "b"],
		[/(?<![\w*])\*(?=\S)[^*\n]*?\S\*(?!\*)|(?<!\w)_(?=\S)[^_\n]*?\S_(?!\w)/, "i"],
		[/~~(?=\S)[^\n]*?\S~~/, "c"],
		[/<\/?[A-Za-z][^>\n]*>/, "t"]
	])
}, Xa = je({
	mermaid: "mermaid",
	mmd: "mermaid",
	plantuml: "plantuml",
	puml: "plantuml",
	uml: "plantuml",
	dot: "graphviz",
	graphviz: "graphviz",
	gv: "graphviz",
	html: "html"
});
function Za(e, t, n) {
	let r = "", i = 0;
	for (; i < e.length;) {
		let a = !1;
		for (let [o, s] of t) {
			o.lastIndex = i;
			let t = o.exec(e);
			if (t && t[0].length) {
				r && n.push(["", r]), r = "", n.push([s, t[0]]), i += t[0].length, a = !0;
				break;
			}
		}
		if (!a) {
			let t = /^[\p{L}\p{N}_]+/u.exec(e.slice(i, i + 64)), n = t ? t[0].length : 1;
			r += e.slice(i, i + n), i += n;
		}
	}
	r && n.push(["", r]);
}
function Qa(e, t, n, r, i, a = 0) {
	let o = e.indexOf(n, t + a);
	return o < 0 ? (i.push([r, e.slice(t)]), -1) : (i.push([r, e.slice(t, o + n.length)]), o + n.length);
}
function $a(e, t, n = 3e5) {
	let r = e === "svg" ? "html" : e;
	if (t.length > n || !(r in Ya)) return [["", t]];
	let i = [], a = null, o = null;
	return t.split("\n").forEach((e, t) => {
		if (t && i.push(["", "\n"]), r === "markdown") {
			let t = /^(\s*)(`{3,}|~{3,})\s*([\w-]*).*$/.exec(e);
			if (a) {
				t && t[2][0] === a.mark[0] && t[2].length >= a.mark.length && !t[3] ? (i.push(["k", e]), a = null) : a.lang ? s(a.lang, e) : i.push(["m", e]);
				return;
			}
			if (t) {
				a = {
					mark: t[2],
					lang: Xa[t[3].toLowerCase()]
				}, i.push(["k", e]);
				return;
			}
			if (/^\s{0,3}#{1,6}(\s|$)/.test(e)) return void i.push(["h", e]);
			if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(e)) return void i.push(["o", e]);
			let n = /^(\s*(?:>\s*)*)((?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)?/.exec(e);
			n[0] && (n[1].includes(">") ? i.push(["c", n[1]]) : n[1] && i.push(["", n[1]]), n[2] && i.push(["o", n[2]])), Za(e.slice(n[0].length), Ya.markdown, i);
		} else s(r, e);
	}), i;
	function s(e, t) {
		let n = 0;
		if (o) {
			let e = Qa(t, 0, o, "c", i);
			if (e < 0) return;
			o = null, n = e;
		}
		let r = e === "html" ? [[/<!--/, "-->"]] : e === "graphviz" ? [[/\/\*/, "*/"]] : e === "plantuml" ? [[/\/'/, "'/"]] : [];
		for (; n <= t.length;) {
			let a = -1, s = "";
			for (let [e, i] of r) {
				let r = e.exec(t.slice(n));
				r && (a < 0 || r.index + n < a) && (a = r.index + n, s = i);
			}
			let c = a < 0 ? t.slice(n) : t.slice(n, a);
			if (e === "plantuml" && /^\s*'/.test(c) && n === 0 || e === "graphviz" && n === 0 && /^\s*#/.test(c) ? i.push(["c", c]) : Za(c, Ya[e], i), a < 0) return;
			let l = Qa(t, a, s, "c", i, s === "-->" ? 4 : 2);
			if (l < 0) {
				o = s;
				return;
			}
			if (n = l, n === t.length) return;
		}
	}
}
// src/react/source/SourceEditor.tsx
var eo = {
	markdown: "Markdown",
	html: "HTML",
	svg: "SVG",
	mermaid: "Mermaid",
	plantuml: "PlantUML",
	graphviz: "Graphviz"
};
function to({ text: e, format: t, onChange: n, readOnly: r, notice: i, onCopy: a, onDownload: o }) {
	let s = Ve(() => $a(t, e), [t, e]), c = Ve(() => {
		let t = 1;
		for (let n = e.indexOf("\n"); n >= 0; n = e.indexOf("\n", n + 1)) t++;
		return t;
	}, [e]), l = Ve(() => Array.from({ length: c }, (e, t) => t + 1).join("\n"), [c]), u = V(!1), d = (e, t) => {
		e.ownerDocument.execCommand?.("insertText", !1, t) || (e.setRangeText(t, e.selectionStart, e.selectionEnd, "end"), n(e.value));
	};
	return /* @__PURE__ */ G("div", {
		className: "de-src",
		"data-testid": "de-source",
		children: [
			/* @__PURE__ */ G("div", {
				className: "de-src-head",
				children: [
					/* @__PURE__ */ G("span", {
						className: "de-src-title",
						children: [/* @__PURE__ */ W(J, {
							name: "code",
							size: 15
						}), eo[t] ?? "Source"]
					}),
					/* @__PURE__ */ G("span", {
						className: "de-src-lines",
						children: [
							c,
							" ",
							c === 1 ? "line" : "lines"
						]
					}),
					/* @__PURE__ */ W("span", { style: { flex: 1 } }),
					a && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-src-btn",
						onClick: a,
						title: "Copy the source",
						children: /* @__PURE__ */ W(J, {
							name: "copy",
							size: 15
						})
					}),
					o && /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-src-btn",
						onClick: o,
						title: "Download the source",
						children: /* @__PURE__ */ W(J, {
							name: "save",
							size: 15
						})
					})
				]
			}),
			i && /* @__PURE__ */ W("div", {
				className: "de-src-notice",
				children: i
			}),
			/* @__PURE__ */ G("div", {
				className: "de-src-scroll",
				children: [/* @__PURE__ */ W("pre", {
					className: "de-src-gutter",
					"aria-hidden": "true",
					children: l
				}), /* @__PURE__ */ G("div", {
					className: "de-src-code",
					children: [/* @__PURE__ */ G("pre", {
						className: "de-src-hl",
						"aria-hidden": "true",
						children: [s.map(([e, t], n) => e ? /* @__PURE__ */ W("span", {
							className: `de-tk-${e}`,
							children: t
						}, n) : t), "\n"]
					}), /* @__PURE__ */ W("textarea", {
						className: "de-src-input",
						value: e,
						readOnly: r,
						onChange: (e) => n(e.target.value),
						onKeyDown: (e) => {
							let t = e.currentTarget;
							if (e.key === "Escape") {
								u.current = !0;
								return;
							}
							let n = u.current;
							if (u.current = !1, !(r || e.altKey || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing)) {
								if (e.key === "Tab" && !e.shiftKey && !n) e.preventDefault(), d(t, "  ");
								else if (e.key === "Enter" && !e.shiftKey) {
									let n = t.value.lastIndexOf("\n", t.selectionStart - 1) + 1, r = /^[ \t]*/.exec(t.value.slice(n, t.selectionStart))[0];
									if (!r) return;
									e.preventDefault(), d(t, "\n" + r);
								}
							}
						},
						spellCheck: !1,
						autoCapitalize: "off",
						autoComplete: "off",
						autoCorrect: "off",
						wrap: "off",
						rows: 1,
						cols: 1,
						"aria-label": `${eo[t] ?? "Source"} source`,
						"data-testid": "de-source-input"
					})]
				})]
			})
		]
	});
}
// src/react/picture/PictureView.tsx
function no({ client: e }) {
	let [t, n] = H(null);
	B(() => {
		let t = !0, r = "";
		return e.call("docx.start").catch(() => {}), e.call("plain.source").then(async (e) => {
			if (t) try {
				let i = a(e ?? "");
				r = await p(new Blob([i.svg], { type: "image/svg+xml" })), t && n({
					url: r,
					w: i.w,
					h: i.h,
					alt: i.alt ?? ""
				});
			} catch (e) {
				t && n({ error: e.message });
			}
		}, (e) => t && n({ error: e.message })), () => {
			t = !1, r && URL.revokeObjectURL(r);
		};
	}, [e]);
	let r = t && "url" in t ? t : null;
	return Xt({
		printable: async () => {
			if (!r) throw Error("The picture is not shown");
			return {
				size: "auto",
				margin: "1cm",
				node: /* @__PURE__ */ W("img", {
					src: r.url,
					alt: r.alt,
					style: {
						width: `${r.w}px`,
						maxWidth: "100%"
					}
				})
			};
		},
		text: async () => await e.call("plain.source") ?? "",
		stats: () => r ? [["Picture size", `${Math.round(r.w)} × ${Math.round(r.h)} px`]] : []
	}), t ? "error" in t ? /* @__PURE__ */ W("div", {
		className: "de-center",
		children: /* @__PURE__ */ G("div", {
			className: "de-error",
			role: "alert",
			children: [/* @__PURE__ */ W("strong", { children: "SVG picture not drawn." }), /* @__PURE__ */ W("div", { children: t.error })]
		})
	}) : /* @__PURE__ */ W("div", {
		className: "de-scroll de-picture",
		"data-testid": "de-picture",
		children: /* @__PURE__ */ W("img", {
			src: t.url,
			alt: t.alt,
			draggable: !1,
			style: {
				width: `${t.w}px`,
				height: `${t.h}px`
			}
		})
	}) : /* @__PURE__ */ W("div", {
		className: "de-center",
		children: /* @__PURE__ */ W("div", { className: "de-spinner" })
	});
}
// src/react/pptx/PptxEditor.ts
var ro = (e) => ({
	sz: e.sz,
	b: e.b,
	i: e.i,
	u: e.u,
	strike: e.strike,
	color: e.color,
	font: e.font,
	baseline: e.baseline,
	caps: e.caps,
	hl: e.hl
});
function io(e) {
	let t = e.runs.map((e) => e.fld ? {
		t: "fld",
		text: e.text,
		s: ro(e),
		src: e.src
	} : {
		t: "text",
		text: e.br ? "\n" : e.text,
		s: ro(e),
		src: e.src
	});
	return {
		runs: ge(t),
		base: e,
		algn: e.algn,
		k: e.k
	};
}
var ao = (e) => e.pp?.bullet ?? e.base.buKind ?? "none", oo = (e) => e.pp?.lvl ?? e.base.lvl ?? 0;
function so(e, t = 0) {
	let n = ao(e), r = oo(e), i = e.runs.find((e) => e.t === "text")?.s?.sz ?? e.base.endSz, a = e.pp?.bullet ? n === "none" ? void 0 : {
		text: n === "bullet" ? "•" : `${t}.`,
		sz: i,
		color: e.base.bullet?.color
	} : e.base.bullet, o = (r - (e.base.lvl ?? 0)) * 48, s = e.pp?.bullet && n !== "none" && !e.base.bullet ? 27 : 0;
	return {
		...e.base,
		bullet: a,
		marL: Math.max(0, e.base.marL + o + s),
		indent: s ? -s : e.base.indent,
		lnPct: e.pp?.lnPct ?? e.base.lnPct,
		algn: e.algn,
		runs: e.runs.map((e) => e.t === "fld" ? {
			...e.s,
			text: e.text ?? "",
			fld: !0
		} : {
			...e.s,
			text: e.text ?? ""
		})
	};
}
var co = 3, lo = class {
	client;
	input;
	paras = [];
	body;
	slide = -1;
	sid = -1;
	cell;
	pendingSel = null;
	history = [];
	future = [];
	pend = null;
	timer;
	changedSinceCommit = !1;
	commits = [];
	committing;
	onChange;
	onCommitted;
	onDirty;
	onState;
	onCellMove;
	constructor(e) {
		this.client = e, this.input = new A(this);
	}
	get active() {
		return this.sid >= 0;
	}
	begin(e, t, n, r) {
		this.end(), this.slide = e, this.sid = t, this.cell = r, this.body = n, this.paras = (n.paras.length ? n.paras : [{
			algn: "left",
			marL: 0,
			indent: 0,
			spcBef: 0,
			spcAft: 0,
			runs: [],
			endSz: 18
		}]).map(io), this.history = [], this.future = [], this.pend = null;
	}
	end() {
		clearTimeout(this.timer), this.sid >= 0 && this.changedSinceCommit && this.commitInBackground(), this.input.detach(), this.sid = -1, this.slide = -1, this.cell = void 0, this.body = void 0, this.onState?.(null);
	}
	text() {
		if (!this.body) return;
		let e = [], t = this.paras.map((t) => {
			let n = oo(t);
			return ao(t) === "number" ? e[n] = (e[n] ?? 0) + 1 : e[n] = 0, e.length = n + 1, so(t, e[n]);
		});
		return {
			...this.body,
			empty: !1,
			paras: t
		};
	}
	para(e) {
		return this.paras[Number(e)];
	}
	span(e, t) {
		let n = [];
		for (let r = Number(e); r <= Number(t); r++) n.push(String(r));
		return n;
	}
	prev(e) {
		return Number(e) > 0 ? String(Number(e) - 1) : void 0;
	}
	next(e) {
		return Number(e) < this.paras.length - 1 ? String(Number(e) + 1) : void 0;
	}
	cmp(e, t) {
		return Number(e) - Number(t);
	}
	withRuns(e, t) {
		return {
			...e,
			runs: t
		};
	}
	split(e, t, n) {
		return [{
			...e,
			runs: t
		}, {
			...e,
			runs: n,
			caret: n.length ? void 0 : pe(t, O(t)) ?? e.caret
		}];
	}
	join(e, t, n) {
		return {
			...e,
			runs: n
		};
	}
	defaultRun(e) {
		if (e.caret) return {
			...e.caret,
			text: ""
		};
		let t = [...e.runs].reverse().find((e) => e.t === "text");
		return t ? {
			...t,
			text: ""
		} : {
			t: "text",
			s: { sz: e.base.endSz }
		};
	}
	pendingStyle() {
		return this.pend ? {
			s: this.pend.s,
			d: this.pend.d
		} : void 0;
	}
	clearPending() {
		this.pend = null;
	}
	replace(e, t, n, r = {}) {
		let i = this.paras, a = Number(e[0]);
		if (this.paras = [
			...i.slice(0, a),
			...t,
			...i.slice(a + e.length)
		], r.history !== !1) {
			let e = Date.now(), t = this.history[this.history.length - 1], a = r.label ?? "edit";
			a === "type" && t?.label === "type" && e - t.t < 1500 ? (t.after = this.paras, t.selAfter = n, t.t = e) : this.history.push({
				before: i,
				after: this.paras,
				selBefore: this.input.lastSel ?? n,
				selAfter: n,
				label: a,
				t: e
			}), this.future = [];
		}
		this.pendingSel = n, this.changedSinceCommit = !0, this.onDirty?.(), clearTimeout(this.timer), this.timer = setTimeout(() => this.commitInBackground(), 400), this.onChange?.(), this.onState?.(this.state(n));
	}
	undo() {
		let e = this.history.pop();
		e && (this.future.push(e), this.restore(e.before, e.selBefore));
	}
	redo() {
		let e = this.future.pop();
		e && (this.history.push(e), this.restore(e.after, e.selAfter));
	}
	restore(e, t) {
		this.paras = e, this.pendingSel = t, this.changedSinceCommit = !0, this.onDirty?.(), clearTimeout(this.timer), this.timer = setTimeout(() => this.commitInBackground(), 400), this.onChange?.(), this.onState?.(this.state(t));
	}
	commitInBackground() {
		this.commit().catch((e) => console.error("[office-engine] slide edit failed", e));
	}
	async flush() {
		do
			await this.commit();
		while (this.changedSinceCommit || this.commits.length);
	}
	commit() {
		if (clearTimeout(this.timer), this.sid >= 0 && this.changedSinceCommit) {
			this.changedSinceCommit = !1;
			let e = this.paras.map((e) => ({
				k: e.k,
				algn: e.algnSet ? e.algn : void 0,
				...e.pp,
				runs: e.runs.map((e) => e.t === "fld" ? {
					text: "",
					src: e.src,
					fld: !0
				} : {
					text: e.text ?? "",
					src: e.src,
					set: e.d
				})
			}));
			this.commits.push({
				slide: this.slide,
				sid: this.sid,
				cell: this.cell,
				specs: e
			});
		}
		return this.committing ||= this.drainCommits().finally(() => {
			this.committing = void 0;
		}), this.committing;
	}
	async drainCommits() {
		for (; this.commits.length;) {
			let e = this.commits[0], t;
			try {
				t = await this.client.call("pptx.setText", e.slide, e.sid, e.specs, e.cell);
			} catch (t) {
				throw e.failed = (e.failed ?? 0) + 1, e.failed >= co && this.commits.shift(), t;
			}
			this.commits.shift(), this.onCommitted?.(e.slide, t);
		}
	}
	format(e, t) {
		let n = this.input.sel();
		if (!n) return;
		if (P(n)) {
			this.pend = {
				s: {
					...this.pend?.s ?? {},
					...e
				},
				d: {
					...this.pend?.d ?? {},
					...t
				},
				at: n.a
			}, this.input.restore(n), this.onState?.(this.state(n));
			return;
		}
		let [r, i] = M(this, n), a = this.span(r.pa, i.pa), o = a.map((n, o) => {
			let s = this.para(n), c = o === 0 ? r.o : 0, l = o === a.length - 1 ? i.o : O(s.runs);
			return this.withRuns(s, he(s.runs, c, l, e, t));
		});
		this.replace(a, o, n, { label: "format" });
	}
	toggle(e) {
		let t = this.state(), n = !(t && t[e]);
		this.format({ [e]: n }, { [e]: n });
	}
	setSize(e) {
		this.format({ sz: e }, { sz: e });
	}
	setColor(e) {
		this.format({ color: e ?? void 0 }, { color: e });
	}
	setFont(e) {
		this.format({ font: i(e) }, { font: e });
	}
	setAlign(e) {
		let t = this.input.sel();
		if (!t) return;
		let [n, r] = M(this, t), i = this.span(n.pa, r.pa);
		this.replace(i, i.map((t) => ({
			...this.para(t),
			algn: e,
			algnSet: !0
		})), t, { label: "align" });
	}
	paraOp(e, t) {
		let n = this.input.sel();
		if (!n) return;
		let [r, i] = M(this, n), a = this.span(r.pa, i.pa);
		this.replace(a, a.map((t) => e(this.para(t))), n, { label: t });
	}
	toggleBullet(e) {
		let t = this.state()?.bullet === e ? "none" : e;
		this.paraOp((e) => ({
			...e,
			pp: {
				...e.pp,
				bullet: t
			}
		}), "bullet");
	}
	indentLevel(e) {
		this.paraOp((t) => ({
			...t,
			pp: {
				...t.pp,
				lvl: Math.max(0, Math.min(8, oo(t) + e))
			}
		}), "indent");
	}
	tab(e, t) {
		if (this.cell) return this.onCellMove?.(t ? -1 : 1), !0;
		let [n, r] = M(this, e);
		return this.span(n.pa, r.pa).filter((e) => ao(this.para(e)) !== "none").length ? (this.indentLevel(t ? -1 : 1), !0) : t;
	}
	setLineSpacing(e) {
		this.paraOp((t) => ({
			...t,
			pp: {
				...t.pp,
				lnPct: e
			}
		}), "spacing");
	}
	setHighlight(e) {
		this.format({ hl: e ?? void 0 }, { hl: e });
	}
	toggleBaseline(e) {
		let t = this.state()?.baseline ?? 0, n = e === "sup" ? t > 0 ? 0 : 30 : t < 0 ? 0 : -25;
		this.format({ baseline: n || void 0 }, { baseline: n || null });
	}
	clearFormat() {
		this.format({
			b: !1,
			i: !1,
			u: !1,
			strike: !1,
			hl: void 0,
			baseline: void 0
		}, {
			b: !1,
			i: !1,
			u: !1,
			strike: !1,
			hl: null,
			baseline: null
		});
	}
	state(e = this.input.sel()) {
		if (!e || this.sid < 0) return null;
		let [t] = M(this, e), n = this.para(t.pa);
		if (!n) return null;
		let r = {
			...pe(n.runs, P(e) ? t.o : t.o + 1)?.s ?? {},
			...P(e) ? this.pend?.s ?? {} : {}
		};
		return {
			b: !!r.b,
			i: !!r.i,
			u: !!r.u,
			strike: !!r.strike,
			sz: r.sz,
			color: r.color,
			font: r.font,
			algn: n.algn,
			hl: r.hl,
			baseline: r.baseline,
			bullet: ao(n),
			lvl: oo(n),
			lnPct: n.pp?.lnPct ?? n.base.lnPct
		};
	}
	onSelection(e) {
		e && this.pend && (e.a.pa !== this.pend.at.pa || e.a.o !== this.pend.at.o) && (this.pend = null), this.onState?.(e ? this.state(e) : null);
	}
	shortcut;
}, uo = [
	"#ffff00",
	"#00ff00",
	"#00ffff",
	"#ff00ff",
	"#ff0000",
	"#0000ff",
	"#ffc000",
	"#92d050",
	"#c0c0c0",
	"#000000"
], fo = [
	{
		value: "text",
		label: "Text box",
		icon: "textbox"
	},
	{
		value: "image",
		label: "Image…",
		icon: "image"
	},
	{
		value: "line",
		label: "Line",
		icon: "line"
	},
	{
		value: "rect",
		label: "Rectangle",
		icon: "rect",
		sep: !0
	},
	{
		value: "roundRect",
		label: "Rounded rectangle",
		icon: "roundRect"
	},
	{
		value: "ellipse",
		label: "Ellipse",
		icon: "ellipse"
	},
	{
		value: "triangle",
		label: "Triangle",
		icon: "triangle"
	},
	{
		value: "rtTriangle",
		label: "Right triangle"
	},
	{
		value: "diamond",
		label: "Diamond"
	},
	{
		value: "parallelogram",
		label: "Parallelogram"
	},
	{
		value: "trapezoid",
		label: "Trapezoid"
	},
	{
		value: "pentagon",
		label: "Pentagon"
	},
	{
		value: "hexagon",
		label: "Hexagon"
	},
	{
		value: "octagon",
		label: "Octagon"
	},
	{
		value: "donut",
		label: "Donut"
	},
	{
		value: "can",
		label: "Cylinder"
	},
	{
		value: "heart",
		label: "Heart"
	},
	{
		value: "plus",
		label: "Plus"
	},
	{
		value: "rightArrow",
		label: "Arrow right",
		icon: "arrow",
		sep: !0
	},
	{
		value: "leftArrow",
		label: "Arrow left"
	},
	{
		value: "upArrow",
		label: "Arrow up"
	},
	{
		value: "downArrow",
		label: "Arrow down"
	},
	{
		value: "leftRightArrow",
		label: "Double arrow"
	},
	{
		value: "chevron",
		label: "Chevron"
	},
	{
		value: "homePlate",
		label: "Pentagon arrow"
	},
	{
		value: "star4",
		label: "4-point star",
		sep: !0
	},
	{
		value: "star5",
		label: "5-point star",
		icon: "star"
	},
	{
		value: "star6",
		label: "6-point star"
	},
	{
		value: "wedgeRectCallout",
		label: "Callout",
		sep: !0
	},
	{
		value: "wedgeRoundRectCallout",
		label: "Rounded callout"
	}
], po = [
	.75,
	1,
	1.5,
	2.25,
	3,
	4.5,
	6
].map((e) => ({
	value: e,
	label: `${e} pt`
})), mo = [
	{
		value: "solid",
		label: "Solid",
		hint: "────"
	},
	{
		value: "sysDot",
		label: "Dotted",
		hint: "········"
	},
	{
		value: "dash",
		label: "Dashed",
		hint: "- - - -"
	},
	{
		value: "lgDash",
		label: "Long dash",
		hint: "— — —"
	},
	{
		value: "dashDot",
		label: "Dash dot",
		hint: "-·-·-·"
	}
], ho = [
	1,
	1.15,
	1.5,
	2
].map((e) => ({
	value: e,
	label: e === 1 ? "Single" : e === 2 ? "Double" : String(e)
})), go = [
	{
		value: "t",
		label: "Top",
		icon: "vTop"
	},
	{
		value: "ctr",
		label: "Middle",
		icon: "vMiddle"
	},
	{
		value: "b",
		label: "Bottom",
		icon: "vBottom"
	}
];
function _o(e) {
	let { editor: t } = e, [n, r] = H(null);
	B(() => (t.onState = r, () => {
		t.onState = void 0;
	}), [t]);
	let i = !!n && t.active, a = Vt(n?.font), o = n?.sz ? Math.round(n.sz * 2) / 2 : void 0, s = i ? e.textAnchor : e.shape?.anchor;
	return /* @__PURE__ */ G(Qt, { children: [
		/* @__PURE__ */ W(Y, {
			icon: "undo",
			title: `Undo (${Q}Z)`,
			disabled: !i && !e.canUndo,
			onClick: () => i ? t.undo() : e.onUndo(!1)
		}),
		/* @__PURE__ */ W(Y, {
			icon: "redo",
			title: `Redo (${Q}Y)`,
			onClick: () => i ? t.redo() : e.onUndo(!0)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Ut, {
			title: "Insert",
			label: "Insert",
			icon: "plus",
			items: fo,
			onPick: (t) => e.onInsert(t)
		}),
		/* @__PURE__ */ W(Ut, {
			title: "Slide",
			label: "Slide",
			icon: "slideAdd",
			items: [
				{
					value: "add",
					label: "New slide",
					icon: "slideAdd",
					hint: `${Q}M`
				},
				{
					value: "duplicate",
					label: "Duplicate slide",
					icon: "copy"
				},
				{
					value: "delete",
					label: "Delete slide",
					icon: "trash"
				},
				{
					value: "up",
					label: "Move slide up",
					icon: "up",
					sep: !0
				},
				{
					value: "down",
					label: "Move slide down",
					icon: "down"
				},
				{
					value: "hide",
					label: "Hide / show slide",
					icon: "hide",
					sep: !0
				}
			],
			onPick: (t) => e.onSlide(t)
		}),
		/* @__PURE__ */ W(X, {}),
		i ? /* @__PURE__ */ G(We, { children: [
			/* @__PURE__ */ W(Ct, {
				title: "Font",
				width: 112,
				menuWidth: 200,
				value: a,
				placeholder: "Font",
				options: Bt(a),
				onChange: (e) => t.setFont(e)
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(wt, {
				value: o,
				onChange: (e) => t.setSize(e)
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Y, {
				icon: "bold",
				title: `Bold (${Q}B)`,
				active: n?.b,
				onClick: () => t.toggle("b")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "italic",
				title: `Italic (${Q}I)`,
				active: n?.i,
				onClick: () => t.toggle("i")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "underline",
				title: `Underline (${Q}U)`,
				active: n?.u,
				onClick: () => t.toggle("u")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "strike",
				title: "Strikethrough",
				active: n?.strike,
				onClick: () => t.toggle("strike")
			}),
			/* @__PURE__ */ W(Lt, {
				icon: "color",
				title: "Text color",
				value: n?.color,
				onPick: (e) => t.setColor(e),
				noneLabel: "Automatic"
			}),
			/* @__PURE__ */ W(Lt, {
				icon: "highlight",
				title: "Highlight color",
				value: n?.hl,
				palette: uo,
				onPick: (e) => t.setHighlight(e)
			}),
			/* @__PURE__ */ W(Y, {
				icon: "sup",
				title: "Superscript",
				active: (n?.baseline ?? 0) > 0,
				onClick: () => t.toggleBaseline("sup")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "sub",
				title: "Subscript",
				active: (n?.baseline ?? 0) < 0,
				onClick: () => t.toggleBaseline("sub")
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Y, {
				icon: "alignLeft",
				title: "Align left",
				active: n?.algn === "left",
				onClick: () => t.setAlign("left")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "alignCenter",
				title: "Center",
				active: n?.algn === "center",
				onClick: () => t.setAlign("center")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "alignRight",
				title: "Align right",
				active: n?.algn === "right",
				onClick: () => t.setAlign("right")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "justify",
				title: "Justify",
				active: n?.algn === "justify",
				onClick: () => t.setAlign("justify")
			}),
			/* @__PURE__ */ W(Z, {
				title: "Vertical align",
				icon: go.find((e) => e.value === s)?.icon ?? "vTop",
				label: null,
				menuWidth: 140,
				value: s ?? "t",
				options: go.map((e) => ({ ...e })),
				onChange: e.onAnchor
			}),
			/* @__PURE__ */ W(Z, {
				title: "Line spacing",
				icon: "lineSpacing",
				label: null,
				menuWidth: 140,
				value: n?.lnPct ? Math.round(n.lnPct * 100) / 100 : "",
				options: ho,
				onChange: (e) => t.setLineSpacing(e)
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Y, {
				icon: "bullets",
				title: "Bulleted list",
				active: n?.bullet === "bullet",
				onClick: () => t.toggleBullet("bullet")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "numbers",
				title: "Numbered list",
				active: n?.bullet === "number",
				onClick: () => t.toggleBullet("number")
			}),
			/* @__PURE__ */ W(Y, {
				icon: "outdent",
				title: "Decrease indent (Shift+Tab)",
				disabled: !n?.lvl,
				onClick: () => t.indentLevel(-1)
			}),
			/* @__PURE__ */ W(Y, {
				icon: "indent",
				title: "Increase indent",
				onClick: () => t.indentLevel(1)
			}),
			/* @__PURE__ */ W(Y, {
				icon: "clear",
				title: "Clear formatting",
				onClick: () => t.clearFormat()
			})
		] }) : e.shape ? /* @__PURE__ */ G(We, { children: [
			/* @__PURE__ */ W(Lt, {
				icon: "fill",
				title: "Fill color",
				onPick: e.onFill,
				noneLabel: "Transparent"
			}),
			/* @__PURE__ */ W(Lt, {
				icon: "borders",
				title: "Border color",
				onPick: (t) => e.onLine({ color: t }),
				noneLabel: "Transparent"
			}),
			/* @__PURE__ */ W(Z, {
				title: "Border weight",
				icon: "lineWeight",
				label: null,
				menuWidth: 120,
				options: po,
				onChange: (t) => e.onLine({ w: t })
			}),
			/* @__PURE__ */ W(Z, {
				title: "Border dash",
				icon: "lineStyle",
				label: null,
				menuWidth: 170,
				options: mo,
				onChange: (t) => e.onLine({ dash: t })
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Ut, {
				title: "Arrange",
				label: "Arrange",
				icon: "front",
				items: [
					{
						value: "front",
						label: "Bring to front",
						icon: "front",
						hint: `${Q}⇧↑`
					},
					{
						value: "forward",
						label: "Bring forward",
						hint: `${Q}↑`
					},
					{
						value: "backward",
						label: "Send backward",
						hint: `${Q}↓`
					},
					{
						value: "back",
						label: "Send to back",
						icon: "back",
						hint: `${Q}⇧↓`
					}
				],
				onPick: (t) => e.onArrange(t)
			}),
			/* @__PURE__ */ W(Z, {
				title: "Rotate",
				icon: "rotate",
				label: null,
				menuWidth: 220,
				options: [
					{
						value: "cw",
						label: "Rotate 90° clockwise",
						icon: "rotate"
					},
					{
						value: "ccw",
						label: "Rotate 90° counter-clockwise",
						icon: "rotateCcw"
					},
					{
						value: "flipH",
						label: "Flip horizontally",
						icon: "flipH",
						sep: !0
					},
					{
						value: "flipV",
						label: "Flip vertically",
						icon: "flipV"
					}
				],
				onChange: (t) => e.onRotate(t)
			}),
			/* @__PURE__ */ W(Z, {
				title: "Align on slide",
				icon: "alignObj",
				label: null,
				menuWidth: 150,
				options: [
					{
						value: "left",
						label: "Left",
						icon: "alignLeft"
					},
					{
						value: "center",
						label: "Center",
						icon: "alignCenter"
					},
					{
						value: "right",
						label: "Right",
						icon: "alignRight"
					},
					{
						value: "top",
						label: "Top",
						icon: "vTop",
						sep: !0
					},
					{
						value: "middle",
						label: "Middle",
						icon: "vMiddle"
					},
					{
						value: "bottom",
						label: "Bottom",
						icon: "vBottom"
					}
				],
				onChange: (t) => e.onAlign(t)
			}),
			e.shape.canText && /* @__PURE__ */ W(Z, {
				title: "Vertical text align",
				icon: go.find((e) => e.value === s)?.icon ?? "vTop",
				label: null,
				menuWidth: 140,
				value: s ?? "t",
				options: go.map((e) => ({ ...e })),
				onChange: e.onAnchor
			}),
			/* @__PURE__ */ W(X, {}),
			/* @__PURE__ */ W(Y, {
				icon: "copy",
				title: `Duplicate (${Q}D)`,
				onClick: e.onDuplicate
			}),
			/* @__PURE__ */ W(Y, {
				icon: "trash",
				title: "Delete (Del)",
				onClick: e.onDelete
			})
		] }) : /* @__PURE__ */ G(We, { children: [/* @__PURE__ */ W(Lt, {
			icon: "fill",
			title: "Slide background",
			onPick: e.onBackground,
			noneLabel: "Layout default"
		}), /* @__PURE__ */ W("span", {
			className: "de-tb-hint",
			children: "Click a shape or text to edit it"
		})] }),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Z, {
			title: "Present",
			icon: "play",
			label: "Present",
			menuWidth: 200,
			options: [{
				value: "cur",
				label: "From current slide",
				hint: "F5"
			}, {
				value: "start",
				label: "From beginning",
				hint: "⇧F5"
			}],
			onChange: (t) => e.onPresent(t === "start")
		})
	] });
}
// src/react/pptx/Presenter.tsx
function vo({ client: e, meta: t, start: n, onClose: r }) {
	let i = V(null), a = t.slides.filter((e) => !e.hidden).map((e) => e.index), o = a.length ? a : t.slides.map((e) => e.index), [s, c] = H(Math.max(0, o.findIndex((e) => e >= n))), [l, u] = H({
		w: window.innerWidth,
		h: window.innerHeight
	}), d = V(r);
	d.current = r, B(() => {
		let e = i.current;
		e?.focus(), e && document.fullscreenElement !== e && e.requestFullscreen?.().catch(() => {});
		let t = () => u({
			w: window.innerWidth,
			h: window.innerHeight
		}), n = () => !document.fullscreenElement && d.current();
		return window.addEventListener("resize", t), document.addEventListener("fullscreenchange", n), () => {
			window.removeEventListener("resize", t), document.removeEventListener("fullscreenchange", n), document.fullscreenElement && document.exitFullscreen().catch(() => {});
		};
	}, []);
	let f = (e) => c((t) => Math.max(0, Math.min(o.length - 1, t + e))), p = Math.min(l.w / t.w, l.h / t.h);
	return /* @__PURE__ */ G("div", {
		ref: i,
		className: "de-present",
		tabIndex: -1,
		onClick: () => f(1),
		onContextMenu: (e) => {
			e.preventDefault(), f(-1);
		},
		onKeyDown: (e) => {
			if ([
				"ArrowRight",
				"ArrowDown",
				"PageDown",
				" ",
				"Enter",
				"n"
			].includes(e.key)) f(1);
			else if ([
				"ArrowLeft",
				"ArrowUp",
				"PageUp",
				"Backspace",
				"p"
			].includes(e.key)) f(-1);
			else if (e.key === "Home") c(0);
			else if (e.key === "End") c(o.length - 1);
			else if (e.key === "Escape") r();
			else return;
			e.preventDefault();
		},
		children: [/* @__PURE__ */ W("div", {
			style: {
				width: t.w * p,
				height: t.h * p
			},
			children: /* @__PURE__ */ W(Wo, {
				client: e,
				index: o[s],
				meta: t,
				scale: p,
				live: !0
			}, o[s])
		}), /* @__PURE__ */ G("div", {
			className: "de-present-n",
			children: [
				s + 1,
				" / ",
				o.length
			]
		})]
	});
}
// src/react/pptx/geometry.ts
var $ = (e) => +e.toFixed(2), yo = (e) => "M" + e.map(([e, t]) => `${$(e)} ${$(t)}`).join(" L") + " Z", bo = (e, t, n) => (e?.[t] ?? n) / 1e5;
function xo(e, t) {
	let n = e / 2, r = t / 2;
	return `M0 ${$(r)} A${$(n)} ${$(r)} 0 1 0 ${$(e)} ${$(r)} A${$(n)} ${$(r)} 0 1 0 0 ${$(r)} Z`;
}
function So(e, t, n) {
	return n = Math.min(n, e / 2, t / 2), `M${$(n)} 0 H${$(e - n)} A${$(n)} ${$(n)} 0 0 1 ${$(e)} ${$(n)} V${$(t - n)} A${$(n)} ${$(n)} 0 0 1 ${$(e - n)} ${$(t)} H${$(n)} A${$(n)} ${$(n)} 0 0 1 0 ${$(t - n)} V${$(n)} A${$(n)} ${$(n)} 0 0 1 ${$(n)} 0 Z`;
}
function Co(e, t, n, r = -Math.PI / 2) {
	let i = [];
	for (let a = 0; a < n; a++) {
		let o = r + a * 2 * Math.PI / n;
		i.push([e / 2 + e / 2 * Math.cos(o), t / 2 + t / 2 * Math.sin(o)]);
	}
	return yo(i);
}
function wo(e, t, n, r) {
	let i = [];
	for (let a = 0; a < n * 2; a++) {
		let o = -Math.PI / 2 + a * Math.PI / n, s = a % 2 ? r : 1;
		i.push([e / 2 + e / 2 * s * Math.cos(o), t / 2 + t / 2 * s * Math.sin(o)]);
	}
	return yo(i);
}
var To = /* @__PURE__ */ new Set([
	"line",
	"straightConnector1",
	"bentConnector2",
	"bentConnector3",
	"bentConnector4",
	"curvedConnector3",
	"curvedConnector2",
	"curvedConnector4"
]);
function Eo(e, t, n, r) {
	let i = Math.min(t, n);
	switch (e) {
		case "ellipse":
		case "flowChartConnector":
		case "cloud": return xo(t, n);
		case "roundRect":
		case "flowChartAlternateProcess": return So(t, n, i * bo(r, "adj", 16667));
		case "flowChartTerminator": return So(t, n, n / 2);
		case "triangle": return yo([
			[t * bo(r, "adj", 5e4), 0],
			[t, n],
			[0, n]
		]);
		case "rtTriangle": return yo([
			[0, 0],
			[t, n],
			[0, n]
		]);
		case "diamond":
		case "flowChartDecision": return yo([
			[t / 2, 0],
			[t, n / 2],
			[t / 2, n],
			[0, n / 2]
		]);
		case "parallelogram":
		case "flowChartInputOutput": {
			let e = i * bo(r, "adj", 25e3);
			return yo([
				[e, 0],
				[t, 0],
				[t - e, n],
				[0, n]
			]);
		}
		case "trapezoid": {
			let e = i * bo(r, "adj", 25e3);
			return yo([
				[e, 0],
				[t - e, 0],
				[t, n],
				[0, n]
			]);
		}
		case "pentagon": return Co(t, n, 5);
		case "hexagon": {
			let e = i * bo(r, "adj", 25e3);
			return yo([
				[e, 0],
				[t - e, 0],
				[t, n / 2],
				[t - e, n],
				[e, n],
				[0, n / 2]
			]);
		}
		case "heptagon": return Co(t, n, 7);
		case "octagon": {
			let e = i * bo(r, "adj", 29289);
			return yo([
				[e, 0],
				[t - e, 0],
				[t, e],
				[t, n - e],
				[t - e, n],
				[e, n],
				[0, n - e],
				[0, e]
			]);
		}
		case "decagon": return Co(t, n, 10);
		case "dodecagon": return Co(t, n, 12);
		case "star4": return wo(t, n, 4, .38);
		case "star5": return wo(t, n, 5, .38);
		case "star6": return wo(t, n, 6, .5);
		case "star8": return wo(t, n, 8, .6);
		case "star10":
		case "star12":
		case "star16":
		case "star24": return wo(t, n, Number(e.slice(4)), .7);
		case "homePlate": {
			let e = i * bo(r, "adj", 5e4);
			return yo([
				[0, 0],
				[t - e, 0],
				[t, n / 2],
				[t - e, n],
				[0, n]
			]);
		}
		case "chevron": {
			let e = i * bo(r, "adj", 5e4);
			return yo([
				[0, 0],
				[t - e, 0],
				[t, n / 2],
				[t - e, n],
				[0, n],
				[e, n / 2]
			]);
		}
		case "rightArrow":
		case "leftArrow": {
			let a = n * bo(r, "adj1", 5e4), o = i * bo(r, "adj2", 5e4), s = (n - a) / 2, c = [
				[0, s],
				[t - o, s],
				[t - o, 0],
				[t, n / 2],
				[t - o, n],
				[t - o, s + a],
				[0, s + a]
			];
			return yo(e === "leftArrow" ? c.map(([e, n]) => [t - e, n]) : c);
		}
		case "upArrow":
		case "downArrow": {
			let a = t * bo(r, "adj1", 5e4), o = i * bo(r, "adj2", 5e4), s = (t - a) / 2, c = [
				[s, n],
				[s, o],
				[0, o],
				[t / 2, 0],
				[t, o],
				[s + a, o],
				[s + a, n]
			];
			return yo(e === "downArrow" ? c.map(([e, t]) => [e, n - t]) : c);
		}
		case "leftRightArrow": {
			let e = n * bo(r, "adj1", 5e4), a = i * bo(r, "adj2", 5e4), o = (n - e) / 2;
			return yo([
				[0, n / 2],
				[a, 0],
				[a, o],
				[t - a, o],
				[t - a, 0],
				[t, n / 2],
				[t - a, n],
				[t - a, o + e],
				[a, o + e],
				[a, n]
			]);
		}
		case "plus":
		case "mathPlus": {
			let e = i * bo(r, "adj", 25e3);
			return yo([
				[e, 0],
				[t - e, 0],
				[t - e, e],
				[t, e],
				[t, n - e],
				[t - e, n - e],
				[t - e, n],
				[e, n],
				[e, n - e],
				[0, n - e],
				[0, e],
				[e, e]
			]);
		}
		case "snip1Rect": {
			let e = i * bo(r, "adj", 16667);
			return yo([
				[0, 0],
				[t - e, 0],
				[t, e],
				[t, n],
				[0, n]
			]);
		}
		case "snip2SameRect": {
			let e = i * bo(r, "adj1", 16667);
			return yo([
				[e, 0],
				[t - e, 0],
				[t, e],
				[t, n],
				[0, n],
				[0, e]
			]);
		}
		case "round1Rect":
		case "round2SameRect": {
			let e = i * bo(r, "adj1", 16667) || i * bo(r, "adj", 16667);
			return `M${$(e)} 0 H${$(t - e)} A${$(e)} ${$(e)} 0 0 1 ${$(t)} ${$(e)} V${$(n)} H0 V${$(e)} A${$(e)} ${$(e)} 0 0 1 ${$(e)} 0 Z`;
		}
		case "can":
		case "flowChartMagneticDisk": {
			let e = i * bo(r, "adj", 25e3) / 2;
			return `M0 ${$(e)} A${$(t / 2)} ${$(e)} 0 0 1 ${$(t)} ${$(e)} V${$(n - e)} A${$(t / 2)} ${$(e)} 0 0 1 0 ${$(n - e)} Z M0 ${$(e)} A${$(t / 2)} ${$(e)} 0 0 0 ${$(t)} ${$(e)}`;
		}
		case "donut": {
			let e = i * bo(r, "adj", 25e3);
			return xo(t, n) + ` M${$(e)} ${$(n / 2)} A${$(t / 2 - e)} ${$(n / 2 - e)} 0 1 1 ${$(t - e)} ${$(n / 2)} A${$(t / 2 - e)} ${$(n / 2 - e)} 0 1 1 ${$(e)} ${$(n / 2)} Z`;
		}
		case "heart": return `M${$(t / 2)} ${$(n * .25)} C${$(t / 2)} 0 0 0 0 ${$(n * .3)} C0 ${$(n * .6)} ${$(t / 2)} ${$(n * .8)} ${$(t / 2)} ${$(n)} C${$(t / 2)} ${$(n * .8)} ${$(t)} ${$(n * .6)} ${$(t)} ${$(n * .3)} C${$(t)} 0 ${$(t / 2)} 0 ${$(t / 2)} ${$(n * .25)} Z`;
		case "wedgeRectCallout":
		case "wedgeRoundRectCallout": {
			let e = t / 2 + t * bo(r, "adj1", -20833), i = n / 2 + n * bo(r, "adj2", 62500);
			return yo([
				[0, 0],
				[t, 0],
				[t, n],
				[t * .58, n],
				[e, i],
				[t * .42, n],
				[0, n]
			]);
		}
		case "line":
		case "straightConnector1": return `M0 0 L${$(t)} ${$(n)}`;
		case "bentConnector2": return `M0 0 H${$(t)} V${$(n)}`;
		case "bentConnector3": return `M0 0 H${$(t * bo(r, "adj1", 5e4))} V${$(n)} H${$(t)}`;
		case "bentConnector4": return `M0 0 H${$(t / 2)} V${$(n)} H${$(t)}`;
		case "curvedConnector2":
		case "curvedConnector3":
		case "curvedConnector4": return `M0 0 C${$(t / 2)} 0 ${$(t / 2)} ${$(n)} ${$(t)} ${$(n)}`;
		default: return `M0 0 H${$(t)} V${$(n)} H0 Z`;
	}
}
// src/react/pptx/Slide.tsx
function Do(e) {
	let t = [];
	return e.rot && t.push(`rotate(${e.rot}deg)`), {
		left: e.x,
		top: e.y,
		width: e.w,
		height: e.h,
		transform: t.length ? t.join(" ") : void 0
	};
}
function Oo(e, t, n) {
	let r = dt(e, t?.t === "img" ? t.target : void 0, n);
	if (t) switch (t.t) {
		case "solid": {
			let e = F(t.c);
			return e ? { background: e } : void 0;
		}
		case "grad": {
			let e = Oe(t.css);
			return e ? { background: e } : void 0;
		}
		case "img": return r && r !== "unsupported" ? {
			backgroundImage: `url("${r}")`,
			backgroundSize: t.tile ? "auto" : "100% 100%",
			backgroundRepeat: t.tile ? "repeat" : "no-repeat"
		} : void 0;
		default: return;
	}
}
function ko(e) {
	let t = { fontSize: `${e.baseline ? e.sz * .65 : e.sz}pt` };
	e.b && (t.fontWeight = 700), e.i && (t.fontStyle = "italic");
	let n = [e.u ? "underline" : "", e.strike ? "line-through" : ""].filter(Boolean).join(" ");
	return n && (t.textDecoration = n), e.color && (t.color = F(e.color)), e.font && (t.fontFamily = e.font), e.baseline && (t.verticalAlign = e.baseline > 0 ? "super" : "sub"), e.caps && (t.textTransform = "uppercase"), e.hl && (t.background = F(e.hl)), t;
}
function Ao({ text: e, flow: t, edit: n }) {
	let [r, i, a, o] = e.ins, s = {
		...t ? {
			position: "relative",
			inset: "auto",
			minHeight: "100%"
		} : {},
		padding: `${i}px ${a}px ${o}px ${r}px`,
		justifyContent: e.anchor === "ctr" ? "center" : e.anchor === "b" ? "flex-end" : "flex-start"
	};
	return e.vert && (s.writingMode = e.vert === "vert270" ? "sideways-lr" : "vertical-rl"), e.empty && !n ? /* @__PURE__ */ W("div", {
		className: "de-txt",
		style: s
	}) : /* @__PURE__ */ W("div", {
		ref: n?.root,
		className: (e.wrap ? "de-txt" : "de-txt de-nowrap") + (n ? " de-txt-edit" : ""),
		style: s,
		contentEditable: n ? !0 : void 0,
		suppressContentEditableWarning: !0,
		spellCheck: !n && void 0,
		children: e.paras.map((e, t) => {
			let r = {
				textAlign: e.algn,
				paddingLeft: e.marL || void 0,
				textIndent: e.indent || void 0,
				paddingTop: e.spcBef || void 0,
				paddingBottom: e.spcAft || void 0,
				lineHeight: e.lnPx ? `${e.lnPx}px` : e.lnPct ? +(e.lnPct * 1.2).toFixed(3) : 1.2
			};
			(!e.runs.length || e.runs.every((e) => !e.text && !e.br)) && (r.fontSize = `${e.endSz}pt`);
			let i = e.indent < 0 ? -e.indent : 0, a = 0, o = e.runs.map((e, t) => {
				let r = a;
				if (a += e.fld || e.br ? 1 : e.text.length, n) return e.fld ? /* @__PURE__ */ W("span", {
					"data-o": r,
					"data-obj": "",
					contentEditable: !1,
					style: ko(e),
					children: e.text
				}, t) : /* @__PURE__ */ W("span", {
					"data-o": r,
					style: ko(e),
					children: e.br ? "\n" : e.text
				}, t);
				let i = m(e.href);
				return e.br ? /* @__PURE__ */ W("br", {}, t) : i ? /* @__PURE__ */ W("a", {
					href: i,
					target: "_blank",
					rel: "noreferrer noopener",
					style: { color: "inherit" },
					children: /* @__PURE__ */ W("span", {
						style: ko(e),
						children: e.text
					})
				}, t) : /* @__PURE__ */ W("span", {
					style: ko(e),
					children: e.text
				}, t);
			}), s = a === 0;
			return /* @__PURE__ */ G("div", {
				style: r,
				"data-pa": n ? String(t) : void 0,
				children: [
					e.bullet && !s && /* @__PURE__ */ W("span", {
						className: "de-bul",
						contentEditable: !n && void 0,
						style: {
							minWidth: i || void 0,
							paddingRight: i ? void 0 : "0.4em",
							fontSize: `${e.bullet.sz}pt`,
							color: F(e.bullet.color),
							fontFamily: e.bullet.font
						},
						children: e.bullet.text
					}),
					o,
					s && (n ? /* @__PURE__ */ W("span", {
						"data-o": 0,
						"data-empty": "",
						children: "​"
					}) : "​")
				]
			}, t);
		})
	});
}
function jo({ id: e, s: t }) {
	return /* @__PURE__ */ W("marker", {
		id: e,
		viewBox: "0 0 10 10",
		refX: "5",
		refY: "5",
		markerWidth: "4",
		markerHeight: "4",
		orient: "auto-start-reverse",
		children: /* @__PURE__ */ W("path", {
			d: "M0 0 L10 5 L0 10 Z",
			fill: F(t.c)
		})
	});
}
function Mo({ el: e, client: t, live: n, editing: r }) {
	let i = Re().replace(/:/g, ""), { box: a } = e, o = To.has(e.geom), s = Oo(t, e.fill, n), c = e.path ?? Eo(e.geom, a.w, a.h, e.adj), l = a.flipH || a.flipV, u = l ? `translate(${a.flipH ? a.w : 0} ${a.flipV ? a.h : 0}) scale(${a.flipH ? -1 : 1} ${a.flipV ? -1 : 1})` : void 0, d = !o && !e.path && (e.geom === "rect" || e.geom === "flowChartProcess"), f = !o && e.fill?.t === "solid" ? F(e.fill.c) : void 0, p = !o && s && e.fill?.t !== "solid" ? s : void 0, m = e.stroke, h = Math.max(a.w, 1), g = Math.max(a.h, 1);
	return /* @__PURE__ */ G("div", {
		className: "de-el",
		style: Do(a),
		"data-sid": e.sid !== void 0 && e.text ? e.sid : void 0,
		"data-top": e.top,
		children: [d && !m && (f || p) ? /* @__PURE__ */ W("div", { style: {
			position: "absolute",
			inset: 0,
			...p ?? { background: f }
		} }) : /* @__PURE__ */ G(We, { children: [p && /* @__PURE__ */ W("div", { style: {
			position: "absolute",
			inset: 0,
			...p,
			clipPath: d || !/^[\sA-Za-z0-9.,+-]*$/.test(c) ? void 0 : `path("${c}")`,
			transform: l ? `scale(${a.flipH ? -1 : 1}, ${a.flipV ? -1 : 1})` : void 0
		} }), (f || m) && /* @__PURE__ */ G("svg", {
			width: h,
			height: g,
			viewBox: `0 0 ${h} ${g}`,
			style: {
				position: "absolute",
				left: 0,
				top: 0,
				overflow: "visible"
			},
			children: [m && (m.head || m.tail) && /* @__PURE__ */ G("defs", { children: [m.head && /* @__PURE__ */ W(jo, {
				id: `h${i}`,
				s: m
			}), m.tail && /* @__PURE__ */ W(jo, {
				id: `t${i}`,
				s: m
			})] }), /* @__PURE__ */ W("path", {
				d: c,
				transform: u,
				fill: f ?? "none",
				fillRule: "evenodd",
				stroke: F(m?.c) ?? "none",
				strokeWidth: m?.w,
				strokeDasharray: m?.dash,
				strokeLinejoin: "round",
				markerStart: m?.head ? `url(#h${i})` : void 0,
				markerEnd: m?.tail ? `url(#t${i})` : void 0
			})]
		})] }), r && !r.cell && r.sid === e.sid ? /* @__PURE__ */ W(Ao, {
			text: r.text,
			edit: r.edit
		}) : e.text && /* @__PURE__ */ W(Ao, { text: e.text })]
	});
}
function No({ el: e, client: t, live: n }) {
	let r = dt(t, e.target, n), { box: i } = e, a = {
		...Do(i),
		overflow: "hidden"
	}, o = e.top;
	e.geom === "ellipse" ? a.borderRadius = "50%" : e.geom === "roundRect" && (a.borderRadius = Math.min(i.w, i.h) * .1667), e.stroke && (a.outline = `${e.stroke.w}px solid ${F(e.stroke.c) ?? "transparent"}`);
	let s = {
		position: "absolute",
		left: 0,
		top: 0,
		width: "100%",
		height: "100%"
	};
	if (e.crop) {
		let [t, n, r, a] = e.crop, o = i.w / Math.max(.01, 1 - t - r), c = i.h / Math.max(.01, 1 - n - a);
		s = {
			position: "absolute",
			left: -t * o,
			top: -n * c,
			width: o,
			height: c
		};
	}
	let c = i.flipH || i.flipV ? `scale(${i.flipH ? -1 : 1}, ${i.flipV ? -1 : 1})` : void 0;
	return c && (s.transform = c), /* @__PURE__ */ G("div", {
		className: "de-el",
		style: a,
		"data-top": o,
		children: [r && r !== "unsupported" ? /* @__PURE__ */ W("img", {
			src: r,
			alt: "",
			style: s,
			draggable: !1
		}) : r === "unsupported" ? /* @__PURE__ */ G("div", {
			className: "de-ph",
			style: {
				width: "100%",
				height: "100%"
			},
			children: [e.target?.split(".").pop()?.toUpperCase(), " image"]
		}) : null, e.video && /* @__PURE__ */ W("div", {
			className: "de-ph",
			style: {
				position: "absolute",
				right: 8,
				bottom: 8,
				padding: "2px 6px",
				border: 0,
				background: "var(--de-tip-bg, rgba(0,0,0,.6))",
				color: "var(--de-tip-ink, #fff)"
			},
			children: "▶ media"
		})]
	});
}
var Po = (e) => e ? `${Math.max(1, e.w)}px solid ${F(e.c) ?? "transparent"}` : void 0;
function Fo({ cell: e, client: t, live: n, h: r, sid: i, at: a, editing: o }) {
	let s = Oo(t, e.fill, n), c = o && o.sid === i && o.cell?.[0] === a[0] && o.cell[1] === a[1];
	return /* @__PURE__ */ W("td", {
		"data-sid": i !== void 0 && e.text ? i : void 0,
		"data-cell": i !== void 0 && e.text ? `${a[0]},${a[1]}` : void 0,
		colSpan: e.colSpan > 1 ? e.colSpan : void 0,
		rowSpan: e.rowSpan > 1 ? e.rowSpan : void 0,
		style: {
			...s ?? {},
			borderLeft: Po(e.bl),
			borderRight: Po(e.br),
			borderTop: Po(e.bt),
			borderBottom: Po(e.bb),
			height: r
		},
		children: c ? /* @__PURE__ */ W(Ao, {
			text: o.text,
			flow: !0,
			edit: o.edit
		}) : e.text && !e.text.empty && /* @__PURE__ */ W(Ao, {
			text: e.text,
			flow: !0
		})
	});
}
function Io({ el: e, client: t, live: n, editing: r }) {
	return /* @__PURE__ */ W("div", {
		className: "de-el",
		style: {
			...Do(e.box),
			height: "auto"
		},
		"data-top": e.top,
		children: /* @__PURE__ */ G("table", {
			className: "de-stbl",
			children: [/* @__PURE__ */ W("colgroup", { children: e.cols.map((e, t) => /* @__PURE__ */ W("col", { style: { width: e } }, t)) }), /* @__PURE__ */ W("tbody", { children: e.rows.map((i, a) => /* @__PURE__ */ W("tr", { children: i.cells.map((o, s) => o.hidden ? null : /* @__PURE__ */ W(Fo, {
				cell: o,
				client: t,
				live: n,
				h: i.h,
				sid: e.sid,
				at: [a, s],
				editing: r
			}, s)) }, a)) })]
		})
	});
}
function Lo({ el: e, client: t, live: n, editing: r }) {
	switch (e.t) {
		case "shape": return /* @__PURE__ */ W(Mo, {
			el: e,
			client: t,
			live: n,
			editing: r
		});
		case "pic": return /* @__PURE__ */ W(No, {
			el: e,
			client: t,
			live: n
		});
		case "table": return /* @__PURE__ */ W(Io, {
			el: e,
			client: t,
			live: n,
			editing: r
		});
		case "placeholder": return /* @__PURE__ */ W("div", {
			className: "de-el de-ph",
			style: {
				...Do(e.box),
				display: "flex"
			},
			"data-top": e.top,
			children: e.label
		});
	}
}
var Ro = z(function({ model: e, client: t, scale: n, live: r = !0, editing: i, overlay: a }) {
	let o = Oo(t, e.bg, r);
	return /* @__PURE__ */ W("div", {
		className: e.hidden ? "de-slide de-hidden-slide" : "de-slide",
		style: {
			width: e.w * n,
			height: e.h * n
		},
		children: /* @__PURE__ */ G("div", {
			className: "de-slide-inner",
			style: {
				width: e.w,
				height: e.h,
				transform: `scale(${n})`,
				background: "var(--de-page, #fff)",
				...o ?? {}
			},
			children: [e.els.map((e, n) => /* @__PURE__ */ W(Lo, {
				el: e,
				client: t,
				live: r,
				editing: i
			}, n)), a]
		})
	});
}), zo = /* @__PURE__ */ new WeakMap();
function Bo(e) {
	let t = zo.get(e);
	return t || zo.set(e, t = {
		models: /* @__PURE__ */ new Map(),
		pending: /* @__PURE__ */ new Map(),
		listeners: /* @__PURE__ */ new Map()
	}), t;
}
function Vo(e, t, n) {
	let r = Bo(e);
	r.models.set(t, n);
	for (let e of r.listeners.get(t) ?? []) e(n);
}
function Ho(e) {
	let t = Bo(e);
	t.models.clear(), t.pending.clear();
}
function Uo(e, t) {
	let n = Bo(e), [r, i] = H(() => n.models.get(t));
	return B(() => {
		let e = n.listeners.get(t);
		e || n.listeners.set(t, e = /* @__PURE__ */ new Set());
		let r = (e) => i(e);
		return e.add(r), () => {
			e.delete(r);
		};
	}, [n, t]), B(() => {
		let r = n.models.get(t);
		if (r) return i(r);
		let a = !0, o = n.pending.get(t);
		return o || (o = e.call("pptx.slide", t), n.pending.set(t, o), o.then((e) => {
			n.models.set(t, e), n.pending.delete(t), n.models.size > 120 && n.models.delete(n.models.keys().next().value);
		}, () => n.pending.delete(t))), o.then((e) => a && i(e), (e) => a && i({ error: e.message })), () => {
			a = !1;
		};
	}, [
		e,
		n,
		t
	]), r;
}
function Wo(e) {
	let { client: t, index: n, meta: r, scale: i, live: a, editing: o, overlay: s } = e, c = Uo(t, n);
	return c ? "error" in c ? /* @__PURE__ */ W("div", {
		className: "de-slide de-ph",
		style: {
			width: r.w * i,
			height: r.h * i,
			display: "flex"
		},
		children: c.error
	}) : /* @__PURE__ */ W(Ro, {
		model: c,
		client: t,
		scale: i,
		live: a,
		editing: o,
		overlay: s
	}) : /* @__PURE__ */ W("div", {
		className: "de-slide",
		style: {
			width: r.w * i,
			height: r.h * i,
			background: "var(--de-page, #fff)"
		}
	});
}
var Go = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
];
function Ko(e, t) {
	let n = e?.els.filter((e) => e.top === t) ?? [];
	if (!n.length) return;
	let r = Math.min(...n.map((e) => e.box.x)), i = Math.min(...n.map((e) => e.box.y)), a = Math.max(...n.map((e) => e.box.x + e.box.w)), o = Math.max(...n.map((e) => e.box.y + e.box.h));
	return {
		x: r,
		y: i,
		w: a - r,
		h: o - i,
		rot: n.length === 1 ? n[0].box.rot : void 0
	};
}
function qo(e, t, n, r, i) {
	if (t === "move") return {
		...e,
		x: e.x + n,
		y: e.y + r
	};
	let { x: a, y: o, w: s, h: c } = e;
	if (t.includes("e") && (s += n), t.includes("s") && (c += r), t.includes("w") && (a += n, s -= n), t.includes("n") && (o += r, c -= r), i && t.length === 2 && e.w && e.h) {
		let n = Math.max(s / e.w, c / e.h), r = e.w * n, i = e.h * n;
		t.includes("w") && (a = e.x + e.w - r), t.includes("n") && (o = e.y + e.h - i), s = r, c = i;
	}
	return {
		...e,
		x: a,
		y: o,
		w: Math.max(4, s),
		h: Math.max(4, c)
	};
}
function Jo({ box: e, scale: t, onHandle: n }) {
	let r = 9 / t, i = {
		nw: [0, 0],
		n: [.5, 0],
		ne: [1, 0],
		e: [1, .5],
		se: [1, 1],
		s: [.5, 1],
		sw: [0, 1],
		w: [0, .5],
		move: [0, 0]
	};
	return /* @__PURE__ */ W("div", {
		className: "de-shape-sel",
		style: {
			left: e.x,
			top: e.y,
			width: e.w,
			height: e.h,
			borderWidth: 1.5 / t,
			transform: e.rot ? `rotate(${e.rot}deg)` : void 0
		},
		children: Go.map((a) => /* @__PURE__ */ W("div", {
			className: `de-handle de-h-${a}`,
			style: {
				width: r,
				height: r,
				left: i[a][0] * e.w - r / 2,
				top: i[a][1] * e.h - r / 2,
				borderWidth: 1 / t
			},
			onMouseDown: (e) => {
				e.stopPropagation(), e.preventDefault(), n(a, e);
			}
		}, a))
	});
}
var Yo = 24, Xo = 24;
function Zo({ client: e, onStatus: t, initialZoom: n = "fit", thumbnails: r = !0 }) {
	let i = Yt(), a = e.info.pptx, o = Ve(() => new lo(e), [e]);
	Xt({
		flush: () => o.flush(),
		printable: async () => {
			let t = e.info.pptx, n = await Promise.all(t.slides.map((t) => e.call("pptx.slide", t.index))), r = n.filter((e) => !e.hidden), i = r.length ? r : n;
			return {
				size: `${t.w}px ${t.h}px`,
				margin: "0",
				node: i.map((n) => /* @__PURE__ */ W("div", {
					className: "de-print-page",
					style: {
						width: t.w,
						height: t.h
					},
					children: /* @__PURE__ */ W(Ro, {
						model: {
							...n,
							hidden: !1
						},
						client: e,
						scale: 1
					})
				}, n.index))
			};
		},
		text: async () => {
			let t = e.info.pptx;
			return Nn(await Promise.all(t.slides.map((t) => e.call("pptx.slide", t.index))));
		},
		stats: () => {
			let t = e.info.pptx;
			return [["Slides", t.count.toLocaleString()], ["Slide size", `${+(t.w / 96).toFixed(2)} × ${+(t.h / 96).toFixed(2)} in`]];
		}
	});
	let [c, l] = lt(), [u, d] = lt(), f = ut(u), p = V(null), m = ut(p), [h, g] = H(n), _ = r && l.w >= 720 && a.count > 1, [, v] = ct(), y = V(null), b = V(null), x = V(null), [S, C] = H(null), [w, ee] = H(null), [T, te] = H(0), [E, D] = H(null), [ne, re] = H(null), [ie, ae] = H(0), oe = d.w ? (d.w - 48) / a.w : 1, se = d.h ? (d.h - 48) / a.h : 1, ce = Math.max(.1, Math.min(oe, Math.max(se, oe * .6), 2)), le = h === "fit" ? ce : h, ue = a.h * le, de = a.w * le, pe = ue + Xo, he = 48 + a.count * pe - Xo, ge = Math.max(d.w, de + 48), _e = Math.max(Yo, (ge - de) / 2), k = Math.max(0, Math.floor((f.y - Yo) / pe) - 1), ve = Math.min(a.count - 1, Math.floor((f.y + d.h) / pe) + 1), A = Math.min(a.count - 1, Math.max(0, Math.floor((f.y + d.h / 3 - Yo) / pe))), ye = 142 / a.w, j = a.h * ye, be = j + 14, xe = Math.max(0, Math.floor(m.y / be) - 1), Ce = Math.min(a.count - 1, Math.floor((m.y + d.h) / be) + 1);
	B(() => {
		let e = p.current;
		if (!e) return;
		let t = 10 + A * be;
		(t < e.scrollTop || t + j > e.scrollTop + e.clientHeight) && (e.scrollTop = t - e.clientHeight / 2 + j / 2);
	}, [
		A,
		be,
		j
	]), B(() => {
		o.onChange = v, o.onDirty = () => i.setDirty(!0), o.onCellMove = (e) => Ee(e), o.onCommitted = (t, n) => Vo(e, t, n), o.shortcut = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" ? (i.save(), !0) : e.key === "Escape" && (we(), !0);
	}), B(() => (i.editable || we(), () => o.end()), [o, i.editable]), B(() => void mt(u.current), []), Zt(() => {
		let e = o.active ? b.current : x.current;
		e && Se(e)?.selectAllChildren(e);
	});
	let we = () => {
		o.active && (o.end(), b.current && Se(b.current)?.removeAllRanges(), u.current?.focus({ preventScroll: !0 }), v());
	}, M = V(we);
	M.current = we, B(() => me(e, "pptx", { endEditing: () => M.current() }), [e]), B(() => e.on("collab:pptx", (t) => {
		t.meta ? (Ho(e), C(null), te((e) => e + 1)) : t.slide !== void 0 && t.model && Vo(e, t.slide, t.model);
	}), [e]), B(() => fe(e, {
		slide: S?.slide ?? A,
		top: S?.top
	}), [
		e,
		S?.slide,
		S?.top,
		A
	]);
	let N = o.active && o.text() ? {
		sid: o.sid,
		cell: o.cell,
		text: o.text(),
		edit: { root: (e) => {
			b.current = e, e && o.input.attach(e);
		} }
	} : void 0;
	at(() => {
		let e = b.current;
		if (!o.active || !e) return;
		if (y.current) {
			let { x: t, y: n } = y.current;
			y.current = null, e.focus({ preventScroll: !0 });
			let r = e.ownerDocument, i = r.caretPositionFromPoint?.(t, n), a = i ? null : r.caretRangeFromPoint?.(t, n), s = i?.offsetNode ?? a?.startContainer, c = i?.offset ?? a?.startOffset ?? 0, l = Se(e);
			s && e.contains(s) ? l?.collapse(s, c) : (l?.selectAllChildren(e), l?.collapseToEnd()), o.input.lastSel = o.input.readSel();
			return;
		}
		let t = o.pendingSel;
		t && (o.pendingSel = null, o.input.restore(t));
	});
	let P = (t) => Bo(e).models.get(t), Te = (e, t, n, r, i) => {
		let a = P(e)?.els.find((e) => (i ? e.t === "table" : e.t === "shape") && "sid" in e && e.sid === t), s = a?.t === "table" ? i ? a.rows[i[0]]?.cells[i[1]]?.text : void 0 : a?.t === "shape" ? a.text : void 0;
		a && s && (o.begin(e, t, s, i), y.current = {
			x: n,
			y: r
		}, v());
	}, Ee = (e) => {
		let { slide: t, sid: n, cell: r } = o, i = P(t)?.els.find((e) => e.t === "table" && e.sid === n);
		if (!r || i?.t !== "table") return;
		let a = [];
		i.rows.forEach((e, t) => e.cells.forEach((e, n) => e.text && !e.hidden && a.push([t, n])));
		let s = a[a.findIndex((e) => e[0] === r[0] && e[1] === r[1]) + e];
		if (!s) return;
		Te(t, n, 0, 0, s), y.current = null;
		let c = o.paras.length - 1, l = {
			pa: String(c),
			o: O(o.paras[c].runs)
		};
		o.pendingSel = {
			a: l,
			f: l
		};
	}, De = (e, t) => {
		if (!i.editable || t.button !== 0) return;
		let n = t.target;
		if (o.active && b.current?.contains(n)) return;
		let r = n.closest("[data-top]"), a = r ? Number(r.dataset.top) : NaN;
		if (we(), !r || Number.isNaN(a)) {
			C(null);
			return;
		}
		t.preventDefault(), u.current?.focus({ preventScroll: !0 });
		let s = Ko(P(e), a);
		if (C({
			slide: e,
			top: a
		}), !s) return;
		let c = n.closest("[data-sid]"), l = c?.dataset.cell?.split(",").map(Number);
		ee({
			slide: e,
			top: a,
			mode: "move",
			sx: t.clientX,
			sy: t.clientY,
			box: s,
			cur: s,
			moved: !1,
			sid: c ? Number(c.dataset.sid) : void 0,
			cell: l?.length === 2 ? [l[0], l[1]] : void 0,
			px: t.clientX,
			py: t.clientY
		});
	}, F = async (t, n, r = !1) => {
		try {
			let a = await e.call("pptx.shapes", t, n);
			if (Vo(e, t, a), i.setDirty(!0), ae((e) => e + 1), r) {
				let e = a.els.map((e) => e.top ?? -1);
				C({
					slide: t,
					top: Math.max(...e)
				});
			}
			return a;
		} catch (e) {
			console.error("[office-engine]", e);
		}
	};
	B(() => {
		if (!w) return;
		let e = (e) => {
			let t = (e.clientX - w.sx) / le, n = (e.clientY - w.sy) / le, r = w.moved || Math.abs(e.clientX - w.sx) + Math.abs(e.clientY - w.sy) > 3;
			ee({
				...w,
				moved: r,
				cur: r ? qo(w.box, w.mode, t, n, e.shiftKey) : w.box
			});
		}, t = () => {
			let e = w;
			ee(null), e.moved ? F(e.slide, [{
				op: "xfrm",
				top: e.top,
				box: e.cur
			}]) : e.mode === "move" && e.sid !== void 0 && Te(e.slide, e.sid, e.px, e.py, e.cell);
		};
		return window.addEventListener("mousemove", e), window.addEventListener("mouseup", t, { once: !0 }), () => {
			window.removeEventListener("mousemove", e), window.removeEventListener("mouseup", t);
		};
	});
	let Oe = async (t, n) => {
		let r = n ?? S?.slide ?? A, i = t === "text" ? a.w * .4 : t === "line" ? a.w * .25 : a.w * .2, s = t === "text" ? a.h * .1 : t === "line" ? 1 : a.w * .2, c = {
			x: (a.w - i) / 2,
			y: (a.h - s) / 2,
			w: i,
			h: s
		}, l;
		if (t === "image") {
			let [t] = await qt("image/*", !1);
			if (!t) return;
			l = await e.call("pptx.image", r, await t.arrayBuffer(), (t.type.split("/")[1] ?? "png").replace("svg+xml", "svg"));
			let n = await new Promise((e) => {
				let n = new Image();
				n.onload = () => e({
					w: n.naturalWidth,
					h: n.naturalHeight
				}), n.onerror = () => e({
					w: 400,
					h: 300
				}), n.src = URL.createObjectURL(t);
			}), i = Math.min(1, a.w * .6 / n.w, a.h * .6 / n.h);
			c = {
				x: (a.w - n.w * i) / 2,
				y: (a.h - n.h * i) / 2,
				w: n.w * i,
				h: n.h * i
			};
		}
		let d = await F(r, [{
			op: "insert",
			kind: t,
			box: c,
			rid: l,
			text: t === "text" ? "Text" : void 0
		}], !0);
		if (u.current?.focus({ preventScroll: !0 }), d && t === "text") {
			let e = d.els[d.els.length - 1];
			e?.t === "shape" && e.sid !== void 0 && e.text && (o.begin(r, e.sid, e.text), v());
		}
	}, I = async (t, n) => {
		we(), C(null);
		let r = await e.call("pptx.slides", t);
		Object.assign(a, r), Ho(e), i.setDirty(!0), ae((e) => e + 1), te((e) => e + 1), n !== void 0 && requestAnimationFrame(() => Fe(n));
	}, ke = async (t) => {
		await o.flush().catch(() => void 0);
		let n = await e.call("pptx.undo", t);
		n && (n.meta && (we(), Object.assign(a, n.meta), Ho(e), te((e) => e + 1)), Vo(e, n.index, n.model), i.setDirty(!0), ae((e) => Math.max(0, e + (t ? 1 : -1))), C(null), Fe(n.index));
	}, Ae = (e, t = A) => {
		e === "add" ? I({
			op: "add",
			after: t
		}, t + 1) : e === "duplicate" ? I({
			op: "duplicate",
			index: t
		}, t + 1) : e === "delete" ? I({
			op: "delete",
			index: t
		}, Math.max(0, t - 1)) : e === "up" ? t > 0 && I({
			op: "move",
			from: t,
			to: t - 1
		}, t - 1) : e === "down" ? t < a.count - 1 && I({
			op: "move",
			from: t,
			to: t + 1
		}, t + 1) : e === "hide" && I({
			op: "hide",
			index: t,
			hidden: !P(t)?.hidden
		}, t);
	}, je = (e) => e ? P(e.slide)?.els.find((t) => t.top === e.top) : void 0, L = V(S);
	L.current = S;
	let R = {
		arrange: (e) => {
			let t = L.current;
			t && F(t.slide, [{
				op: "order",
				top: t.top,
				to: e
			}]);
		},
		duplicate: () => {
			let e = L.current;
			e && F(e.slide, [{
				op: "duplicate",
				top: e.top
			}], !0);
		},
		remove: () => {
			let e = L.current;
			e && F(e.slide, [{
				op: "delete",
				top: e.top
			}]), C(null);
		},
		rotate: (e) => {
			let t = L.current, n = je(t), r = t && Ko(P(t.slide), t.top);
			if (!t || !r) return;
			let i = {
				...r,
				flipH: n?.box.flipH,
				flipV: n?.box.flipV
			};
			e === "cw" ? i.rot = (i.rot ?? 0) + 90 : e === "ccw" ? i.rot = (i.rot ?? 0) - 90 : e === "flipH" ? i.flipH = !i.flipH : i.flipV = !i.flipV, F(t.slide, [{
				op: "xfrm",
				top: t.top,
				box: i
			}]);
		},
		align: (e) => {
			let t = L.current, n = t && Ko(P(t.slide), t.top);
			if (!t || !n) return;
			let r = { ...n }, i = (n.rot ?? 0) * Math.PI / 180, o = Math.abs(n.w * Math.cos(i)) + Math.abs(n.h * Math.sin(i)), s = Math.abs(n.w * Math.sin(i)) + Math.abs(n.h * Math.cos(i)), c = (o - n.w) / 2, l = (s - n.h) / 2;
			e === "left" ? r.x = c : e === "center" || e === "both" ? r.x = (a.w - r.w) / 2 : e === "right" ? r.x = a.w - r.w - c : e === "top" ? r.y = l : e === "middle" ? r.y = (a.h - r.h) / 2 : e === "bottom" && (r.y = a.h - r.h - l), e === "both" && (r.y = (a.h - r.h) / 2), F(t.slide, [{
				op: "xfrm",
				top: t.top,
				box: r
			}]);
		},
		anchor: (e) => {
			if (o.active && o.body) {
				o.body = {
					...o.body,
					anchor: e
				}, F(o.slide, [{
					op: "anchor",
					sid: o.sid,
					anchor: e
				}]), v();
				return;
			}
			let t = L.current, n = je(t);
			t && n?.t === "shape" && n.sid !== void 0 && F(t.slide, [{
				op: "anchor",
				sid: n.sid,
				anchor: e
			}]);
		}
	}, Me = () => [
		...z?.canComment ? [{
			label: "Comment",
			icon: "commentAdd",
			hint: Ir,
			run: () => z.start()
		}] : [],
		{
			label: "Duplicate",
			icon: "copy",
			hint: `${Q}D`,
			run: R.duplicate,
			sep: !!z?.canComment
		},
		{
			label: "Delete",
			icon: "trash",
			hint: "Del",
			run: R.remove
		},
		{
			label: "Bring to front",
			icon: "front",
			hint: `${Q}⇧↑`,
			sep: !0,
			run: () => R.arrange("front")
		},
		{
			label: "Bring forward",
			hint: `${Q}↑`,
			run: () => R.arrange("forward")
		},
		{
			label: "Send backward",
			hint: `${Q}↓`,
			run: () => R.arrange("backward")
		},
		{
			label: "Send to back",
			icon: "back",
			hint: `${Q}⇧↓`,
			run: () => R.arrange("back")
		},
		{
			label: "Rotate 90° clockwise",
			icon: "rotate",
			sep: !0,
			run: () => R.rotate("cw")
		},
		{
			label: "Rotate 90° counter-clockwise",
			icon: "rotateCcw",
			run: () => R.rotate("ccw")
		},
		{
			label: "Flip horizontally",
			icon: "flipH",
			run: () => R.rotate("flipH")
		},
		{
			label: "Flip vertically",
			icon: "flipV",
			run: () => R.rotate("flipV")
		},
		{
			label: "Center on slide",
			icon: "alignObj",
			sep: !0,
			run: () => R.align("both")
		}
	], Ne = (e, t) => [
		...z?.canComment ? [{
			label: "Comment",
			icon: "commentAdd",
			hint: Ir,
			run: () => z.start(t && Le(e, t.x, t.y) || void 0)
		}] : [],
		{
			label: "New slide",
			icon: "slideAdd",
			hint: `${Q}M`,
			run: () => Ae("add", e),
			sep: !!z?.canComment
		},
		{
			label: "Duplicate slide",
			icon: "copy",
			run: () => Ae("duplicate", e)
		},
		{
			label: "Delete slide",
			icon: "trash",
			run: () => Ae("delete", e),
			disabled: a.count <= 1
		},
		{
			label: P(e)?.hidden ? "Show slide" : "Hide slide",
			icon: "hide",
			run: () => Ae("hide", e)
		},
		{
			label: "Move slide up",
			icon: "up",
			sep: !0,
			run: () => Ae("up", e),
			disabled: e === 0
		},
		{
			label: "Move slide down",
			icon: "down",
			run: () => Ae("down", e),
			disabled: e >= a.count - 1
		},
		{
			label: "Insert text box",
			icon: "textbox",
			sep: !0,
			run: () => void Oe("text", e)
		},
		{
			label: "Insert image…",
			icon: "image",
			run: () => void Oe("image", e)
		},
		{
			label: "Present from this slide",
			icon: "play",
			sep: !0,
			run: () => D(e)
		}
	], Pe = (e) => {
		if (!S || o.active || !i.editable) return !1;
		let t = Ko(P(S.slide), S.top), n = e.shiftKey ? 10 : 1, r = {
			ArrowUp: [0, -n],
			ArrowDown: [0, n],
			ArrowLeft: [-n, 0],
			ArrowRight: [n, 0]
		}, a = e.metaKey || e.ctrlKey;
		if (a && e.key.toLowerCase() === "d") R.duplicate();
		else if (a && (e.key === "ArrowUp" || e.key === "ArrowDown")) R.arrange(e.key === "ArrowUp" ? e.shiftKey ? "front" : "forward" : e.shiftKey ? "back" : "backward");
		else if (e.key === "Delete" || e.key === "Backspace") F(S.slide, [{
			op: "delete",
			top: S.top
		}]), C(null);
		else if (r[e.key] && t) F(S.slide, [{
			op: "xfrm",
			top: S.top,
			box: {
				...t,
				x: t.x + r[e.key][0],
				y: t.y + r[e.key][1]
			}
		}]);
		else if (e.key === "Escape") C(null);
		else return !1;
		return e.preventDefault(), !0;
	}, Fe = (e) => {
		let t = u.current;
		t && (t.scrollTop = Yo + Math.max(0, Math.min(a.count - 1, e)) * pe - Math.max(0, (d.h - ue) / 2));
	}, z = jr(), Ie = Pr(z), Le = (e, t, n) => {
		let r = a.slides[e];
		return r ? {
			quote: `Slide ${e + 1}`,
			at: {
				slide: r.path,
				x: Math.max(0, Math.min(a.w - 1, t)),
				y: Math.max(0, Math.min(a.h - 1, n))
			}
		} : null;
	}, Re = V({
		selected: S,
		current: A,
		go: Fe
	});
	Re.current = {
		selected: S,
		current: A,
		go: Fe
	}, B(() => {
		if (!z) return;
		let e = (e) => {
			let t = e.root.at, n = t && "slide" in t ? a.slides.findIndex((e) => e.path === t.slide) : -1;
			return n >= 0 ? {
				i: n,
				a: t
			} : null;
		};
		return z.setHost({
			kind: "pptx",
			hint: "Select a shape, or right-click the slide where the comment goes.",
			pending: () => {
				let { selected: e, current: t } = Re.current, n = e ? Ko(P(e.slide), e.top) : void 0;
				return n && e ? Le(e.slide, n.x + n.w, n.y + 28) : Le(t, 24, 40);
			},
			placed: (t) => {
				let n = [];
				for (let r of t) {
					let t = e(r);
					t && n.push({
						...r,
						quote: `Slide ${t.i + 1}`,
						k: [
							t.i,
							t.a.y,
							t.a.x
						]
					});
				}
				return n.sort((e, t) => e.k[0] - t.k[0] || e.k[1] - t.k[1] || e.k[2] - t.k[2]);
			},
			reveal: (t) => {
				let n = z.threads().find((e) => e.root.id === t), r = n && e(n);
				r && Re.current.go(r.i);
			}
		}), () => z.setHost(null);
	}, [
		z,
		a,
		T
	]), B(() => z?.touch(), [
		z,
		T,
		a.count
	]);
	let ze = Ve(() => {
		let e = /* @__PURE__ */ new Map();
		if (!z) return e;
		for (let t of z.threads()) {
			let n = t.root.at;
			if (!n || !("slide" in n) || t.root.done && t.root.id !== Ie.active) continue;
			let r = e.get(n.slide);
			r || e.set(n.slide, r = []), r.push({
				id: t.root.id,
				x: n.x,
				y: n.y,
				who: t.root.author.initials ?? s(t.root.author.name),
				n: t.replies.length
			});
		}
		return e;
	}, [z, Ie]), Be = (e) => {
		if (o.active || e.defaultPrevented || Pe(e)) return;
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
			e.preventDefault(), i.save();
			return;
		}
		if (e.key === "F5") {
			e.preventDefault(), D(e.shiftKey ? 0 : A);
			return;
		}
		let t = e.metaKey || e.ctrlKey;
		if (i.editable && t && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) e.preventDefault(), ke(e.key.toLowerCase() === "y" || e.shiftKey);
		else if (i.editable && t && !e.altKey && e.key.toLowerCase() === "m") e.preventDefault(), Ae("add");
		else {
			if (e.key === "PageDown" || e.key === "ArrowRight" || e.key === " " && !e.shiftKey) Fe(A + 1);
			else if (e.key === "PageUp" || e.key === "ArrowLeft") Fe(A - 1);
			else if (e.key === "Home") Fe(0);
			else if (e.key === "End") Fe(a.count - 1);
			else return;
			e.preventDefault();
		}
	}, He = (e) => {
		let t = w && w.slide === e && w.moved ? w.cur : S ? Ko(P(e), S.top) : void 0;
		if (t && S) return /* @__PURE__ */ W(Jo, {
			box: t,
			scale: le,
			onHandle: (t, n) => {
				let r = Ko(P(e), S.top);
				r && ee({
					slide: e,
					top: S.top,
					mode: t,
					sx: n.clientX,
					sy: n.clientY,
					box: r,
					cur: r,
					moved: !1,
					px: n.clientX,
					py: n.clientY
				});
			}
		});
	}, U = [];
	for (let t = k; t <= ve; t++) U.push(/* @__PURE__ */ G("div", {
		className: i.editable ? "de-slide-frame de-slide-editable" : "de-slide-frame",
		style: {
			top: Yo + t * pe,
			left: _e
		},
		"data-slide": t + 1,
		onMouseDown: (e) => De(t, e),
		onContextMenu: (e) => {
			if (!i.editable) return;
			let n = e.target;
			if (o.active && b.current?.contains(n)) return;
			e.preventDefault();
			let r = n.closest("[data-top]");
			if (r) {
				we();
				let n = {
					slide: t,
					top: Number(r.dataset.top)
				};
				L.current = n, C(n), re({
					x: e.clientX,
					y: e.clientY,
					items: Me()
				});
			} else {
				let n = e.currentTarget.getBoundingClientRect();
				re({
					x: e.clientX,
					y: e.clientY,
					items: Ne(t, {
						x: (e.clientX - n.left) / le,
						y: (e.clientY - n.top) / le
					})
				});
			}
		},
		children: [(ze.get(a.slides[t]?.path ?? "") ?? []).map((e) => /* @__PURE__ */ W("button", {
			type: "button",
			className: "de-cm-pin" + (Ie.active === e.id ? " on" : ""),
			style: {
				left: e.x * le,
				top: e.y * le
			},
			title: "Comment",
			"aria-label": "Show comment",
			"data-thread": e.id,
			onMouseDown: (e) => e.stopPropagation(),
			onClick: (t) => {
				t.stopPropagation(), z?.select(e.id, !1);
			},
			children: e.who
		}, e.id)), /* @__PURE__ */ W(Wo, {
			client: e,
			index: t,
			meta: a,
			scale: le,
			live: !0,
			editing: o.slide === t ? N : void 0,
			overlay: i.editable && S?.slide === t ? He(t) : void 0
		})]
	}, `${T}:${t}`));
	o.active && (o.slide < k || o.slide > ve) && we();
	let Ue = [];
	if (_) for (let t = xe; t <= Ce; t++) Ue.push(/* @__PURE__ */ G("div", {
		className: "de-thumb",
		style: { top: 10 + t * be },
		"aria-current": t === A,
		onClick: () => Fe(t),
		onContextMenu: (e) => {
			i.editable && (e.preventDefault(), Fe(t), re({
				x: e.clientX,
				y: e.clientY,
				items: Ne(t)
			}));
		},
		children: [/* @__PURE__ */ W("span", {
			className: "de-thumb-n",
			children: t + 1
		}), /* @__PURE__ */ W(Wo, {
			client: e,
			index: t,
			meta: a,
			scale: ye,
			live: !0
		})]
	}, `${T}:${t}`));
	return /* @__PURE__ */ G("div", {
		ref: c,
		style: {
			display: "flex",
			flex: 1,
			minWidth: 0
		},
		children: [_ && /* @__PURE__ */ W("div", {
			ref: p,
			className: "de-thumbs",
			children: /* @__PURE__ */ W("div", {
				style: {
					height: 20 + a.count * be,
					position: "relative"
				},
				children: Ue
			})
		}), /* @__PURE__ */ G("div", {
			style: {
				position: "relative",
				flex: 1,
				minWidth: 0,
				display: "flex"
			},
			children: [
				/* @__PURE__ */ W("div", {
					ref: u,
					className: "de-scroll",
					tabIndex: 0,
					onKeyDown: Be,
					style: { outline: "none" },
					onMouseDown: (e) => e.target === e.currentTarget && we(),
					children: /* @__PURE__ */ W("div", {
						ref: x,
						style: {
							position: "relative",
							height: he,
							width: ge
						},
						onMouseDown: (e) => e.target === e.currentTarget && we(),
						children: U
					})
				}),
				/* @__PURE__ */ W(nn, {
					zoom: h,
					effective: le,
					onChange: g
				}),
				!i.editable && /* @__PURE__ */ G("button", {
					type: "button",
					className: "de-mode de-present-btn",
					title: "Present (F5)",
					onClick: () => D(A),
					children: [/* @__PURE__ */ W(J, {
						name: "present",
						size: 14
					}), "Present"]
				}),
				/* @__PURE__ */ W(en, {
					text: `Slide ${A + 1} of ${a.count}`,
					onStatus: t
				}),
				i.editable && /* @__PURE__ */ W(_o, {
					editor: o,
					shape: S && !o.active ? (() => {
						let e = je(S), t = e?.t === "shape" ? e : void 0;
						return {
							canText: t?.sid !== void 0,
							anchor: t?.text?.anchor
						};
					})() : null,
					textAnchor: o.body?.anchor,
					canUndo: ie > 0,
					onUndo: (e) => void ke(e),
					onInsert: (e) => void Oe(e),
					onFill: (e) => S && void F(S.slide, [{
						op: "fill",
						top: S.top,
						color: e
					}]),
					onLine: (e) => S && void F(S.slide, [{
						op: "line",
						top: S.top,
						...e
					}]),
					onArrange: R.arrange,
					onRotate: R.rotate,
					onAlign: R.align,
					onAnchor: R.anchor,
					onDuplicate: R.duplicate,
					onDelete: R.remove,
					onBackground: (e) => void F(A, [{
						op: "bg",
						color: e
					}]),
					onSlide: (e) => Ae(e),
					onPresent: (e) => D(e ? 0 : A)
				}),
				ne && /* @__PURE__ */ W(sn, {
					x: ne.x,
					y: ne.y,
					items: ne.items,
					onClose: () => re(null)
				}),
				E !== null && /* @__PURE__ */ W(vo, {
					client: e,
					meta: a,
					start: E,
					onClose: () => D(null)
				})
			]
		})]
	});
}
// src/react/useDocument.ts
function Qo(e, t = {}, n = !1) {
	let [r, i] = H({
		client: null,
		error: null,
		loading: !!e,
		progress: null
	}), { name: a, worker: o, credentials: s } = t, c = t.headers ? JSON.stringify(t.headers) : "", l = V(null), u = V(n);
	u.current = n;
	let d = (e) => {
		l.current && l.current !== e && l.current.destroy(), l.current = e;
	};
	return B(() => () => d(null), []), B(() => {
		if (!e) {
			d(null), i({
				client: null,
				error: null,
				loading: !1,
				progress: null
			});
			return;
		}
		let t = !0;
		return u.current && l.current ? i((e) => ({
			...e,
			error: null,
			loading: !0
		})) : (d(null), i({
			client: null,
			error: null,
			loading: !0,
			progress: null
		})), D.open(e, {
			name: a,
			worker: o,
			credentials: s,
			headers: c ? JSON.parse(c) : void 0,
			onProgress: (e) => t && i((t) => ({
				...t,
				progress: e
			}))
		}).then((e) => {
			if (!t) return e.destroy();
			d(e), e.on("progress", (n) => t && l.current === e && i((e) => ({
				...e,
				progress: n
			}))), i((t) => ({
				...t,
				client: e,
				loading: !1
			}));
		}, (e) => {
			t && (d(null), i({
				client: null,
				error: e,
				loading: !1,
				progress: null
			}));
		}), () => {
			t = !1;
		};
	}, [
		e,
		a,
		o,
		s,
		c
	]), r;
}
// src/react/xlsx/XlsxToolbar.tsx
var $o = [
	{
		value: "General",
		label: "Automatic",
		hint: "1000.12"
	},
	{
		value: "@",
		label: "Plain text",
		hint: "abc"
	},
	{
		value: "0",
		label: "Number",
		hint: "1000",
		sep: !0
	},
	{
		value: "0.00",
		label: "Number",
		hint: "1000.12"
	},
	{
		value: "#,##0",
		label: "Number",
		hint: "1,000"
	},
	{
		value: "#,##0.00",
		label: "Number",
		hint: "1,000.12"
	},
	{
		value: "0.00E+00",
		label: "Scientific",
		hint: "1.01E+03"
	},
	{
		value: "0%",
		label: "Percent",
		hint: "10%",
		sep: !0
	},
	{
		value: "0.00%",
		label: "Percent",
		hint: "10.12%"
	},
	{
		value: "\"$\"#,##0.00",
		label: "Currency",
		hint: "$1,000.12",
		sep: !0
	},
	{
		value: "\"$\"#,##0",
		label: "Currency rounded",
		hint: "$1,000"
	},
	{
		value: "_(\"$\"* #,##0.00_);_(\"$\"* (#,##0.00);_(\"$\"* \"-\"??_);_(@_)",
		label: "Accounting",
		hint: "$ (1,000.12)"
	},
	{
		value: "#,##0 \"₫\"",
		label: "Currency",
		hint: "1,000 ₫"
	},
	{
		value: "# ?/?",
		label: "Fraction",
		hint: "1000 1/8"
	},
	{
		value: "yyyy-mm-dd",
		label: "Date",
		hint: "2026-09-26",
		sep: !0
	},
	{
		value: "dd/mm/yyyy",
		label: "Date",
		hint: "26/09/2026"
	},
	{
		value: "d mmmm yyyy",
		label: "Long date",
		hint: "26 September 2026"
	},
	{
		value: "h:mm",
		label: "Time",
		hint: "15:59"
	},
	{
		value: "h:mm:ss AM/PM",
		label: "Time",
		hint: "3:59:00 PM"
	},
	{
		value: "yyyy-mm-dd h:mm",
		label: "Date time",
		hint: "2026-09-26 15:59"
	},
	{
		value: "[h]:mm:ss",
		label: "Duration",
		hint: "24:01:00"
	}
], es = [
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	14,
	16,
	18,
	20,
	24,
	28,
	36,
	48
], ts = [
	{
		k: "all",
		icon: "bAll",
		title: "All borders"
	},
	{
		k: "inner",
		icon: "bInner",
		title: "Inner borders"
	},
	{
		k: "outer",
		icon: "bOuter",
		title: "Outer borders"
	},
	{
		k: "none",
		icon: "bNone",
		title: "Clear borders"
	},
	{
		k: "top",
		icon: "bTop",
		title: "Top border"
	},
	{
		k: "bottom",
		icon: "bBottom",
		title: "Bottom border"
	},
	{
		k: "left",
		icon: "bLeft",
		title: "Left border"
	},
	{
		k: "right",
		icon: "bRight",
		title: "Right border"
	}
], ns = [
	{
		value: "thin",
		label: "Thin",
		hint: "───"
	},
	{
		value: "medium",
		label: "Medium",
		hint: "━━━"
	},
	{
		value: "thick",
		label: "Thick",
		hint: "▬▬▬"
	},
	{
		value: "dashed",
		label: "Dashed",
		hint: "- - -"
	},
	{
		value: "dotted",
		label: "Dotted",
		hint: "·····"
	},
	{
		value: "double",
		label: "Double",
		hint: "═══"
	}
], rs = [
	{
		value: "left",
		label: "Left",
		icon: "alignLeft"
	},
	{
		value: "center",
		label: "Center",
		icon: "alignCenter"
	},
	{
		value: "right",
		label: "Right",
		icon: "alignRight"
	}
], is = [
	{
		value: "top",
		label: "Top",
		icon: "vTop"
	},
	{
		value: "center",
		label: "Middle",
		icon: "vMiddle"
	},
	{
		value: "bottom",
		label: "Bottom",
		icon: "vBottom"
	}
], as = [
	{
		value: 0,
		label: "None",
		icon: "rotNone"
	},
	{
		value: 45,
		label: "Tilt up",
		icon: "rotUp"
	},
	{
		value: -45,
		label: "Tilt down",
		icon: "rotDown"
	},
	{
		value: 255,
		label: "Stack vertically",
		icon: "rotStack"
	},
	{
		value: 90,
		label: "Rotate up",
		icon: "rotUp90"
	},
	{
		value: -90,
		label: "Rotate down",
		icon: "rotDown90"
	}
], os = [
	"SUM",
	"AVERAGE",
	"COUNT",
	"MAX",
	"MIN"
];
function ss(e, t) {
	let n = e === "General" || e === "@" ? "0" : e, r = /0(\.0*)?/.exec(n);
	if (!r) return t > 0 ? "0.0" : "0";
	let i = Math.max(0, (r[1] ? r[1].length - 1 : 0) + t);
	return n.slice(0, r.index) + "0" + (i ? "." + "0".repeat(i) : "") + n.slice(r.index + r[0].length);
}
var cs = "\0custom";
function ls({ format: e, onPick: t }) {
	let [n, r] = H(!1), i = V(null);
	St(i, n, () => r(!1));
	let a = $o.find((t) => t.value === e), o = [
		...a ? [] : [{
			value: e,
			label: "Custom",
			hint: e
		}],
		...$o,
		{
			value: cs,
			label: "Custom format…",
			sep: !0
		}
	];
	return /* @__PURE__ */ G("span", {
		ref: i,
		className: "de-tb-color",
		children: [/* @__PURE__ */ W(Ct, {
			title: `Number format: ${a?.label ?? "Custom"}`,
			width: 96,
			menuWidth: 270,
			value: e,
			options: o,
			onChange: (e) => e === cs ? r(!0) : t(e)
		}), n && /* @__PURE__ */ W("div", {
			className: "de-tb-pop",
			role: "dialog",
			"aria-label": "Custom number format",
			onKeyDown: (e) => e.key === "Escape" && r(!1),
			children: /* @__PURE__ */ W(Kt, {
				placeholder: "Format code: #,##0 \"đ\", ddd dd/mm",
				initial: e === "General" ? "" : e,
				ok: "Apply",
				onOk: (e) => {
					r(!1), t(e.trim().slice(0, 255) || "General");
				}
			})
		})]
	});
}
function us(e) {
	let { css: t, onFormat: n } = e, [r, i] = H("#000000"), [a, o] = H("thin"), s = String(t.textDecoration ?? ""), c = t.textAlign ?? "", l = t.alignItems === "flex-start" ? "top" : t.alignItems === "center" ? "center" : "bottom", u = Number(t.textRotate ?? 0), d = (e) => typeof e == "string" && e.endsWith("pt") ? parseFloat(e) : typeof e == "number" ? Math.round(e * .75 * 2) / 2 : void 0, f = d(t.fontSize) ?? d(e.base.fontSize), p = Vt(t.fontFamily ?? e.base.fontFamily);
	return /* @__PURE__ */ G(Qt, { children: [
		/* @__PURE__ */ W(Y, {
			icon: "undo",
			title: `Undo (${Q}Z)`,
			onClick: e.onUndo
		}),
		/* @__PURE__ */ W(Y, {
			icon: "redo",
			title: `Redo (${Q}Y)`,
			onClick: e.onRedo
		}),
		/* @__PURE__ */ W(Y, {
			icon: "paint",
			title: "Paint format (click, then select cells)",
			active: e.painter,
			onClick: e.onPaint
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "currency",
			title: "Format as currency",
			onClick: () => n({ numFmt: "\"$\"#,##0.00" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "percent",
			title: "Format as percent",
			onClick: () => n({ numFmt: "0%" })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "decLess",
			title: "Decrease decimal places",
			onClick: () => n({ numFmt: ss(e.format, -1) })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "decMore",
			title: "Increase decimal places",
			onClick: () => n({ numFmt: ss(e.format, 1) })
		}),
		/* @__PURE__ */ W(ls, {
			format: e.format,
			onPick: (e) => n({ numFmt: e })
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Ct, {
			title: "Font",
			width: 112,
			menuWidth: 200,
			value: p,
			placeholder: "Font",
			options: Bt(p),
			onChange: (e) => n({ font: e })
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(wt, {
			value: f,
			sizes: es,
			onChange: (e) => n({ sz: e })
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "bold",
			title: `Bold (${Q}B)`,
			active: t.fontWeight === 700,
			onClick: () => e.onToggle("b")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "italic",
			title: `Italic (${Q}I)`,
			active: t.fontStyle === "italic",
			onClick: () => e.onToggle("i")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "underline",
			title: `Underline (${Q}U)`,
			active: s.includes("underline"),
			onClick: () => e.onToggle("u")
		}),
		/* @__PURE__ */ W(Y, {
			icon: "strike",
			title: `Strikethrough (${Q}⇧X)`,
			active: s.includes("line-through"),
			onClick: () => e.onToggle("strike")
		}),
		/* @__PURE__ */ W(Lt, {
			icon: "color",
			title: "Text color",
			value: t.color,
			onPick: (e) => n({ color: e }),
			noneLabel: "Automatic"
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Lt, {
			icon: "fill",
			title: "Fill color",
			value: typeof t.background == "string" && !t.background.includes("gradient") ? t.background : void 0,
			onPick: (e) => n({ fill: e }),
			noneLabel: "No fill"
		}),
		/* @__PURE__ */ W(Wt, {
			icon: "borders",
			title: "Borders",
			chevron: !0,
			children: (e) => /* @__PURE__ */ G("div", {
				className: "de-borders-pop",
				children: [/* @__PURE__ */ W("div", {
					className: "de-borders",
					role: "group",
					"aria-label": "Borders",
					children: ts.map((t) => /* @__PURE__ */ W("button", {
						type: "button",
						className: "de-tb",
						title: t.title,
						"aria-label": t.title,
						onClick: () => {
							e(), n({
								border: t.k,
								borderColor: r,
								borderStyle: a
							});
						},
						children: /* @__PURE__ */ W(J, { name: t.icon })
					}, t.k))
				}), /* @__PURE__ */ G("div", {
					className: "de-borders-side",
					children: [/* @__PURE__ */ W(Lt, {
						icon: "color",
						title: "Border color",
						value: r,
						onPick: (e) => i(e ?? "#000000"),
						noneLabel: "Black"
					}), /* @__PURE__ */ W(Z, {
						title: "Border style",
						icon: "lineStyle",
						label: null,
						menuWidth: 150,
						value: a,
						options: [...ns],
						onChange: (e) => o(e)
					})]
				})]
			})
		}),
		/* @__PURE__ */ W(Z, {
			title: "Merge cells",
			icon: "merge",
			label: null,
			menuWidth: 190,
			options: [
				{
					value: "all",
					label: "Merge all"
				},
				{
					value: "across",
					label: "Merge horizontally"
				},
				{
					value: "down",
					label: "Merge vertically"
				},
				{
					value: "unmerge",
					label: "Unmerge",
					disabled: !e.merged,
					sep: !0
				}
			],
			onChange: (t) => e.onMerge(t)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Z, {
			title: "Horizontal align",
			icon: rs.find((e) => e.value === c)?.icon ?? "alignLeft",
			label: null,
			menuWidth: 140,
			value: c,
			options: rs.map((e) => ({ ...e })),
			onChange: (e) => n({ align: e === c ? null : e })
		}),
		/* @__PURE__ */ W(Z, {
			title: "Vertical align",
			icon: is.find((e) => e.value === l).icon,
			label: null,
			menuWidth: 140,
			value: l,
			options: is.map((e) => ({ ...e })),
			onChange: (e) => n({ valign: e })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "wrap",
			title: "Wrap text",
			active: t.whiteSpace === "pre-wrap",
			onClick: () => n({ wrap: t.whiteSpace !== "pre-wrap" })
		}),
		/* @__PURE__ */ W(Z, {
			title: "Text rotation",
			icon: as.find((e) => e.value === u)?.icon ?? "rotNone",
			label: null,
			menuWidth: 180,
			value: u,
			options: as,
			onChange: (e) => n({ rotate: e || null })
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Ut, {
			title: "Insert, delete or hide rows & columns",
			label: "Rows",
			icon: "rowAdd",
			items: [
				{
					value: "rowAbove",
					label: "Insert row above",
					icon: "rowAbove"
				},
				{
					value: "rowBelow",
					label: "Insert row below",
					icon: "rowBelow"
				},
				{
					value: "colLeft",
					label: "Insert column left",
					icon: "colLeft"
				},
				{
					value: "colRight",
					label: "Insert column right",
					icon: "colRight"
				},
				{
					value: "delRow",
					label: "Delete row(s)",
					icon: "delRow",
					sep: !0
				},
				{
					value: "delCol",
					label: "Delete column(s)",
					icon: "delCol"
				},
				{
					value: "hideRows",
					label: "Hide row(s)",
					icon: "hide",
					sep: !0
				},
				{
					value: "hideCols",
					label: "Hide column(s)",
					icon: "hide"
				},
				{
					value: "unhideRows",
					label: "Unhide rows",
					icon: "view"
				},
				{
					value: "unhideCols",
					label: "Unhide columns",
					icon: "view"
				}
			],
			onPick: (t) => e.onRows(t)
		}),
		/* @__PURE__ */ W(Z, {
			title: "Functions",
			icon: "sum",
			label: null,
			menuWidth: 170,
			options: [...os.map((e) => ({
				value: e,
				label: e
			})), {
				value: "",
				label: "More functions…",
				sep: !0
			}],
			onChange: (t) => e.onFunc(t || null)
		}),
		/* @__PURE__ */ W(Z, {
			title: "Sort range",
			icon: "sort",
			label: null,
			menuWidth: 200,
			options: [{
				value: "asc",
				label: "Sort range A → Z",
				icon: "sortAZ"
			}, {
				value: "desc",
				label: "Sort range Z → A",
				icon: "sortZA"
			}],
			onChange: (t) => e.onSort(t === "desc")
		}),
		/* @__PURE__ */ W(Ut, {
			title: "View: freeze, gridlines",
			label: "View",
			icon: "freeze",
			items: [
				{
					value: "row",
					label: "Freeze 1 row"
				},
				{
					value: "col",
					label: "Freeze 1 column"
				},
				{
					value: "sel",
					label: "Freeze up to current cell"
				},
				{
					value: "none",
					label: "Unfreeze",
					disabled: !e.frozen
				},
				{
					value: "grid",
					label: e.gridlines ? "Hide gridlines" : "Show gridlines",
					icon: "gridlines",
					sep: !0
				}
			],
			onPick: (t) => t === "grid" ? e.onGridlines() : e.onFreeze(t)
		}),
		/* @__PURE__ */ W(X, {}),
		/* @__PURE__ */ W(Y, {
			icon: "clear",
			title: `Clear formatting (${Q}\\)`,
			onClick: () => n({ clear: !0 })
		}),
		/* @__PURE__ */ W(Y, {
			icon: "search",
			title: `Find & replace (${Q}F)`,
			onClick: e.onFind
		})
	] });
}
// src/react/xlsx/axis.ts
var ds = class {
	def;
	count = 0;
	custom = /* @__PURE__ */ new Map();
	keys = [];
	cum = [];
	dirty = !1;
	constructor(e) {
		this.def = e;
	}
	set(e, t) {
		t === this.def ? this.custom.delete(e) : this.custom.set(e, t), this.dirty = !0;
	}
	setRange(e, t, n) {
		let r = Math.min(t, e + 2e4);
		for (let t = e; t <= r; t++) this.set(t, n);
	}
	build() {
		if (!this.dirty) return;
		this.keys = [...this.custom.keys()].sort((e, t) => e - t);
		let e = 0;
		this.cum = this.keys.map((t) => e += this.custom.get(t) - this.def), this.dirty = !1;
	}
	size(e) {
		return this.custom.get(e) ?? this.def;
	}
	pos(e) {
		this.build();
		let t = 0, n = this.keys.length - 1, r = -1;
		for (; t <= n;) {
			let i = t + Math.floor((n - t) / 2);
			this.keys[i] < e ? (r = i, t = i + 1) : n = i - 1;
		}
		return e * this.def + (r >= 0 ? this.cum[r] : 0);
	}
	total() {
		return this.pos(this.count);
	}
	index(e) {
		if (e <= 0 || Number.isNaN(e) || !Number.isSafeInteger(this.count)) return 0;
		let t = 0, n = Math.max(0, this.count - 1);
		for (; t < n;) {
			let r = t + Math.ceil((n - t) / 2);
			this.pos(r) <= e ? t = r : n = r - 1;
		}
		return t;
	}
};
// src/react/xlsx/drawings.tsx
function fs(e, t) {
	let [n, r] = H([]);
	return B(() => {
		let n = !0;
		return r([]), e.call("xlsx.drawings", t).then((t) => Promise.all(t.map(async (t) => ({
			...t,
			url: t.target ? await e.mediaUrl(t.target).catch(() => void 0) : void 0
		})))).then((e) => n && r(e)).catch((e) => console.warn("[office-engine] drawings not read:", e.message)), () => {
			n = !1;
		};
	}, [e, t]), n;
}
function ps(e, t, n) {
	let r, i;
	if (e.from) r = t.pos(e.from.c) + e.from.dx, i = n.pos(e.from.r) + e.from.dy;
	else if (e.at) r = e.at.x, i = e.at.y;
	else return null;
	let a = e.to ? t.pos(e.to.c) + e.to.dx - r : e.size?.w ?? 0, o = e.to ? n.pos(e.to.r) + e.to.dy - i : e.size?.h ?? 0;
	return a >= 2 && o >= 2 ? {
		x: r,
		y: i,
		w: a,
		h: o
	} : null;
}
function ms(e, t, n) {
	let r = 0, i = 0;
	for (let a of e) {
		let e = a.to ?? (a.from && a.size ? {
			c: a.from.c + Math.ceil(a.size.w / t.def),
			r: a.from.r + Math.ceil(a.size.h / n.def)
		} : void 0), o = !e && a.at && a.size ? {
			c: Math.ceil((a.at.x + a.size.w) / t.def),
			r: Math.ceil((a.at.y + a.size.h) / n.def)
		} : void 0, s = e ?? o;
		s && Number.isFinite(s.r) && Number.isFinite(s.c) && (r = Math.max(r, Math.min(T, s.r + 1)), i = Math.max(i, Math.min(x, s.c + 1)));
	}
	return {
		rows: r,
		cols: i
	};
}
var hs = {
	column: "Column chart",
	bar: "Bar chart",
	line: "Line chart",
	pie: "Pie chart",
	doughnut: "Doughnut chart",
	area: "Area chart",
	scatter: "Scatter chart",
	bubble: "Bubble chart",
	radar: "Radar chart",
	stock: "Stock chart",
	surface: "Surface chart"
};
function gs(e, t, n) {
	if (t.url) return /* @__PURE__ */ W("img", {
		className: "de-xl-pic",
		src: t.url,
		alt: t.title,
		style: n,
		draggable: !1
	}, e);
	let r = t.kind === "chart" ? hs[t.chart ?? ""] ?? "Chart" : "Picture";
	return /* @__PURE__ */ G("div", {
		className: "de-xl-drawing",
		style: n,
		title: [r, t.title].filter(Boolean).join(": "),
		children: [
			/* @__PURE__ */ W(J, {
				name: t.kind === "chart" ? "chart" : "image",
				size: 24
			}),
			/* @__PURE__ */ W("strong", { children: r }),
			t.title && /* @__PURE__ */ W("span", { children: t.title })
		]
	}, e);
}
// src/react/xlsx/fit.ts
var _s = (e, t) => typeof e == "string" && e.endsWith("pt") ? parseFloat(e) * 4 / 3 : typeof e == "number" ? e : t, vs = .48, ys = /^-?(?:\d+\.?\d*|\.\d+)(?:E[+-]?\d+)?$/i, bs, xs = /* @__PURE__ */ new Map();
function Ss(e, t) {
	if (bs === void 0 && (bs = typeof document > "u" ? null : document.createElement("canvas").getContext("2d")), !bs) return;
	let n = xs.get(t);
	n || (xs.size > 200 && xs.clear(), xs.set(t, n = /* @__PURE__ */ new Map()));
	let r = 0;
	for (let i of e) {
		let e = n.get(i);
		e === void 0 && (bs.font = t, n.set(i, e = bs.measureText(i).width)), r += e;
	}
	return r;
}
function Cs(e, t, n, r) {
	let i = (e) => (r ? Ss(e, r) : void 0) ?? e.length * n * vs, a = (e) => i(e) <= t + 1e-6;
	if (a(e)) return e;
	let o = () => "#".repeat(Math.max(1, Math.floor(t / i("#") + 1e-9)));
	if (!ys.test(e)) return o();
	let s = Number(e);
	for (let t = Math.min(e.length - 1, 21); t >= 1; t--) {
		let e = w(s, t);
		if (e[0] === "#") break;
		if (a(e)) return e;
	}
	return o();
}
// src/react/xlsx/html.ts
function ws(e) {
	let t = new DOMParser().parseFromString(e, "text/html"), n = (e) => {
		let t = e.cloneNode(!0);
		return t.querySelectorAll("br").forEach((e) => e.replaceWith("\n")), t.querySelectorAll("style,script").forEach((e) => e.remove()), (t.textContent ?? "").replace(/[ \t\r\f ]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
	}, r = t.querySelector("table");
	if (!r) return n(t.body);
	let i = [];
	for (let e of Array.from(r.rows)) {
		let t = [];
		for (let r of Array.from(e.cells)) {
			t.push(y(n(r)));
			for (let e = 1; e < Math.min(100, r.colSpan || 1); e++) t.push("");
		}
		i.push(t.join("	"));
	}
	return i.join("\n");
}
// src/react/xlsx/measure.ts
var Ts, Es = () => Ts === void 0 ? Ts = typeof document > "u" ? null : document.createElement("canvas").getContext("2d") : Ts;
function Ds(e, t, n) {
	let r = _s(e.fontSize, n);
	return `${e.fontStyle === "italic" ? "italic " : ""}${e.fontWeight === 700 ? "bold " : ""}${r}px ${e.fontFamily ?? t.fontFamily ?? "sans-serif"}`;
}
function Os(e, t, n, r) {
	let i = Es();
	if (!i) return e.length * _s(t.fontSize, r) * .56;
	i.font = Ds(t, n, r);
	let a = 0;
	for (let t of e.split("\n")) a = Math.max(a, i.measureText(t).width);
	return a;
}
function ks(e, t, n, r, i) {
	let a = document.createElement("div");
	Object.assign(a.style, {
		position: "fixed",
		left: "-9999px",
		top: "0",
		visibility: "hidden",
		width: `${Math.max(1, i)}px`,
		whiteSpace: "pre-wrap",
		lineHeight: "1.2",
		font: Ds(t, n, r),
		fontSize: `${_s(t.fontSize, r)}px`
	}), a.style.lineHeight = "1.2", a.textContent = e, document.body.appendChild(a);
	let o = a.getBoundingClientRect().height;
	return a.remove(), Math.ceil(o) + 1;
}
function As(e, t, n, r, i) {
	let a = _s(t.fontSize, r) * 1.2;
	if (i === 255) return Math.ceil([...e].length * a) + 3;
	let o = Math.min(90, Math.abs(i)) * Math.PI / 180;
	return Math.ceil(Os(e, t, n, r) * Math.sin(o) + a * Math.cos(o)) + 3;
}
// src/react/xlsx/print.tsx
var js = 2e3, Ms = 2e4, Ns = 100, Ps = 700, Fs = 960;
async function Is(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i = 0; i < n; i += js) {
		let a = await e.call("xlsx.block", t, i, Math.min(n, i + js));
		for (let e of a.rows) r.set(e.r, e.cells);
	}
	return r;
}
var Ls = () => /* @__PURE__ */ Error("The sheet is still loading — try again in a moment"), Rs = je({
	"flex-start": "top",
	center: "middle",
	"flex-end": "bottom"
});
async function zs(e, t, n, r) {
	if (!n.done) throw Ls();
	let i = await Is(e, t, Math.min(n.rows, Ms)), a = -1, o = -1;
	for (let [e, t] of i) for (let n of t) (n[1] !== "" || n[2]) && (a = Math.max(a, e), o = Math.max(o, n[0]));
	let s = n.merges.filter((e) => e.r0 <= a && e.c0 <= o);
	for (let e of s) a = Math.max(a, Math.min(e.r1, 19999)), o = Math.max(o, e.c1);
	let c = [];
	for (let e = 0; e <= o; e++) n.colAxis.size(e) > 0 && c.push(e);
	let l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Set(), d = (e, t) => e * 16384 + t, f = new Int32Array(a + 2);
	for (let e of s) {
		l.set(d(e.r0, e.c0), e);
		let t = Math.min(e.r1, a);
		for (let n = e.r0; n <= t; n++) for (let t = e.c0; t <= e.c1; t++) (n !== e.r0 || t !== e.c0) && u.add(d(n, t));
		t > e.r0 && (f[e.r0 + 1]++, f[t + 1]--);
	}
	let p = (e, t, n) => {
		let r = 0;
		for (let i = t; i <= n; i++) e.size(i) > 0 && r++;
		return Math.max(1, r);
	}, m = _s(r.baseFont.fontSize, 14.67), h = [], g = [], _ = 0;
	for (let e = 0; e <= a; e++) {
		_ += f[e], !_ && g.length >= Ns && (h.push(g), g = []);
		let t = n.rowAxis.size(e);
		if (!t) continue;
		let s = new Map((i.get(e) ?? []).map((e) => [e[0], e])), v = [];
		c.forEach((t, i) => {
			if (u.has(d(e, t))) return;
			let f = s.get(t), h = l.get(d(e, t)), [, g = "", _ = 0, y = 0, b] = f ?? [], { textAlign: x, textRotate: S, shrinkToFit: C, alignItems: w, whiteSpace: ee, ...T } = r.styles[_] ?? {}, te = h ? n.colAxis.pos(Math.min(h.c1, o) + 1) - n.colAxis.pos(h.c0) : n.colAxis.size(t), E = y === 1 && g ? Cs(g, te - 6, _s(T.fontSize, m), Ds(T, r.baseFont, m)) : g, D = x ?? (y === 1 ? "right" : y === 2 ? "center" : "left"), ne = c[i + 1], re = !!E && !h && D === "left" && !ee && (ne === void 0 || !s.get(ne)?.[1] && !u.has(d(e, ne))), ie = { ...T };
			ie.background !== void 0 && (ie.background = Oe(ie.background)), D !== "left" && (ie.textAlign = D);
			let ae = Rs[w];
			ae && ae !== "bottom" && (ie.verticalAlign = ae), ee && (ie.whiteSpace = ee), b && (ie.color = F(b)), v.push(/* @__PURE__ */ W("td", {
				style: ie,
				"data-de-fit": E && !re ? y === 1 ? "#" : "" : void 0,
				colSpan: h ? p(n.colAxis, h.c0, Math.min(h.c1, o)) : void 0,
				rowSpan: h ? p(n.rowAxis, h.r0, Math.min(h.r1, a)) : void 0,
				children: E
			}, t));
		}), g.push(/* @__PURE__ */ W("tr", {
			style: { height: t },
			children: v
		}, e));
	}
	(g.length || !h.length) && h.push(g);
	let v = c.reduce((e, t) => e + n.colAxis.size(t), 0), y = v > Ps, b = Math.max(.35, Math.min(1, (y ? Fs : Ps) / Math.max(1, v))), x = n.gridLines ? "de-print-table de-print-grid" : "de-print-table", S = {
		width: v,
		...r.baseFont
	}, C = /* @__PURE__ */ W("colgroup", { children: c.map((e) => /* @__PURE__ */ W("col", { style: { width: n.colAxis.size(e) } }, e)) });
	return {
		node: /* @__PURE__ */ W("div", {
			className: "de-print-sheet de-print-fit",
			style: { "--de-fit": b },
			children: h.map((e, t) => /* @__PURE__ */ G("table", {
				className: x,
				style: S,
				children: [C, /* @__PURE__ */ W("tbody", { children: e })]
			}, t))
		}),
		size: y ? "landscape" : "auto",
		margin: "12mm",
		notice: n.rows > Ms ? `Only the first ${Ms.toLocaleString()} rows are included` : void 0
	};
}
// src/react/xlsx/XlsxView.tsx
var Bs = 128, Vs = 22, Hs = 12e6, Us = class {
	rows = 0;
	cols = 0;
	done = !1;
	error;
	header = !1;
	rowAxis = new ds(20);
	colAxis = new ds(64);
	merges = [];
	colStyles = [];
	frozen = {
		rows: 0,
		cols: 0
	};
	gridLines = !0;
	blocks = /* @__PURE__ */ new Map();
	inflight = /* @__PURE__ */ new Set();
	sel;
	scrollPos;
	goto;
};
function Ws(e) {
	let t = [];
	for (let n of e ?? []) {
		let e = Number(n.x?.style ?? 0);
		e > 0 && t.push([
			n.min,
			n.max,
			e
		]);
	}
	return t;
}
function Gs(e) {
	if (!e || typeof e != "object") return !1;
	for (let t in e) if (t.startsWith("background") || t.startsWith("border")) return !0;
	return !1;
}
function Ks(e, t, n) {
	if (!(t > 0)) return 0;
	let r = n * .75, i = 0;
	for (; i < t && i < 4096 && e.pos(i + 1) <= r;) i++;
	return i;
}
function qs(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	if (!e || !t) return r;
	for (let i of e.threads()) {
		let e = i.root.at;
		!e || !("sheet" in e) || e.sheet !== t || i.root.done && i.root.id !== n || r.has(e.r * 16384 + e.c) || r.set(e.r * 16384 + e.c, i.root.id);
	}
	return r;
}
var Js = class {
	client;
	sheets = /* @__PURE__ */ new Map();
	focusGrid = !1;
	listeners = /* @__PURE__ */ new Set();
	off;
	constructor(e) {
		this.client = e;
		let t = [e.on("xlsx:progress", (e) => this.onProgress(e)), e.on("collab:xlsx", (t) => this.applied(t, e.info.xlsx))];
		this.off = () => t.forEach((e) => e());
	}
	subscribe(e) {
		return this.listeners.add(e), () => {
			this.listeners.delete(e);
		};
	}
	emit() {
		for (let e of this.listeners) e();
	}
	sheet(e) {
		let t = this.sheets.get(e);
		return t || (t = new Us(), this.sheets.set(e, t), this.client.call("xlsx.load", e).catch((e) => {
			t.error = e.message, t.done = !0, this.emit();
		})), t;
	}
	onProgress(e) {
		let t = this.sheet(e.sheet);
		if (e.defaultRowH !== void 0 && !t.header) {
			t.header = !0, t.rowAxis.def = e.defaultRowH || 20, t.colAxis.def = e.defaultColW || 64;
			for (let n of e.colInfo ?? []) t.colAxis.setRange(n.min, n.max, n.w);
			t.colStyles = Ws(e.colInfo), t.frozen = e.frozen ?? t.frozen, t.gridLines = e.gridLines ?? !0;
		}
		for (let [n, r] of e.rowSizes) t.rowAxis.set(n, r);
		e.recalc && t.blocks.clear(), t.rows = Math.max(t.rows, e.rows), t.cols = Math.max(t.cols, e.cols), e.merges && (t.merges = e.merges), e.error && (t.error = e.error), t.done = e.done, this.emit();
	}
	ensure(e, t, n) {
		let r = this.sheet(e);
		if (r.header || r.done) for (let i = Math.floor(t / Bs); i <= Math.floor(n / Bs); i++) {
			let t = r.blocks.get(i);
			if (r.inflight.has(i) || t && (t.complete || t.rowsAt === r.rows && !r.done) || i * Bs > r.rows && !r.done && t) continue;
			r.inflight.add(i);
			let n = r.rows;
			this.client.call("xlsx.block", e, i * Bs, (i + 1) * Bs).then((e) => {
				let t = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
				for (let n of e.rows) t.set(n.r, n.cells), n.s && a.set(n.r, n.s);
				if (r.blocks.set(i, {
					rows: t,
					own: a,
					complete: e.complete,
					rowsAt: n
				}), r.blocks.size > 400) {
					let e = r.blocks.keys().next().value;
					r.blocks.delete(e);
				}
			}).catch(() => {}).finally(() => {
				r.inflight.delete(i), this.emit();
			});
		}
	}
	invalidate(e, t, n) {
		let r = this.sheet(e);
		for (let e = Math.floor(t / Bs); e <= Math.floor(n / Bs); e++) r.blocks.delete(e);
		r.rows = Math.max(r.rows, n + 1), this.emit();
	}
	applied(e, t) {
		if (!e) return;
		for (let n of e.styles ?? []) t.styles[n.index] = n.css, t.formats[n.index] = n.format;
		for (let t of e.recalc ?? []) this.sheets.get(t)?.blocks.clear();
		if (e.sheets) {
			t.sheets = e.sheets, this.sheets.clear(), this.emit();
			return;
		}
		let n = this.sheet(e.sheet);
		if (e.layout) {
			let t = e.layout;
			n.rowAxis = new ds(t.defaultRowH || n.rowAxis.def), n.colAxis = new ds(t.defaultColW || n.colAxis.def);
			for (let e of t.colInfo ?? []) n.colAxis.setRange(e.min, e.max, e.w);
			n.colStyles = Ws(t.colInfo);
			for (let [e, r] of t.rowSizes) n.rowAxis.set(e, r);
			n.merges = t.merges ?? [], n.frozen = t.frozen ?? n.frozen, t.gridLines !== void 0 && (n.gridLines = t.gridLines), n.rows = t.rows, n.cols = t.cols, n.blocks.clear(), this.emit();
		} else e.range.c1 < 16383 && (n.cols = Math.max(n.cols, e.range.c1 + 1)), this.invalidate(e.sheet, e.range.r0, e.range.r1);
	}
	row(e, t) {
		return this.sheets.get(e)?.blocks.get(Math.floor(t / Bs))?.rows.get(t);
	}
	placeStyle(e, t, n) {
		let r = this.sheets.get(e);
		if (!r) return 0;
		let i = r.blocks.get(Math.floor(t / Bs))?.own.get(t);
		if (i) return i;
		for (let [e, t, i] of r.colStyles) if (e <= n && n <= t) return i;
		return 0;
	}
	loaded(e, t, n) {
		let r = this.sheets.get(e);
		if (!r || !r.done) return !1;
		for (let e = Math.floor(t / Bs); e <= Math.floor(n / Bs); e++) if (r.inflight.has(e) || !r.blocks.get(e)?.complete) return !1;
		return !0;
	}
	clip = null;
	dispose() {
		this.off(), this.listeners.clear();
	}
}, Ys = /* @__PURE__ */ new WeakMap();
function Xs(e) {
	let t = Ys.get(e);
	return t || Ys.set(e, t = new Js(e)), t;
}
function Zs({ client: e, onStatus: t, initialSheet: n }) {
	let i = e.info.xlsx, a = i.sheets.filter((e) => !e.hidden), [o, s] = H(n ?? a[0]?.index ?? 0), l = Ve(() => Xs(e), [e]), [, u] = ct();
	B(() => l.subscribe(u), [l, u]);
	let d = l.sheet(o), f = d.error ? `Error: ${d.error}` : `${d.rows.toLocaleString()} rows × ${d.cols.toLocaleString()} cols${d.done ? "" : " · loading…"}${d.rows > 1048576 ? ` · over Excel’s ${T.toLocaleString()}-row limit: save as CSV` : ""}`, p = Yt();
	Xt({
		printable: () => zs(e, w, l.sheet(w), i),
		text: (t) => e.call("xlsx.text", w, t === "tsv" ? "	" : ","),
		stats: () => {
			let e = l.sheet(w);
			return [
				["Sheets", `${i.sheets.length}${i.sheets.some((e) => e.hidden) ? ` (${i.sheets.filter((e) => e.hidden).length} hidden)` : ""}`],
				["Current sheet", i.sheets[w]?.name ?? ""],
				["Used range", `${e.rows.toLocaleString()} rows × ${e.cols.toLocaleString()} columns${e.done ? "" : " (loading)"}`]
			];
		},
		importText: async (t, n) => {
			let r = /\.(tsv|tab)$/i.test(t.name ?? "") ? "	" : void 0;
			if (e.interceptor) return m(t, n, r);
			let a = await e.call("xlsx.import", w, t, {
				name: n,
				sep: r
			});
			l.applied(a, i), p.setDirty(!0), s(w + 1);
		}
	});
	let m = async (t, n, a) => {
		let o = await t.text(), d = c(o, a ?? r(o)), f = await e.call("xlsx.bookOp", {
			op: "add",
			name: n,
			after: w
		});
		l.applied(f, i), p.setDirty(!0);
		let m = w + 1;
		s(m), await new Promise((e, t) => {
			let n = () => {}, r = () => {
				let r = l.sheet(m);
				if (r.error) t(Error(r.error));
				else if (r.done) e();
				else return;
				n();
			};
			n = l.subscribe(r), r();
		});
		let h = [];
		d.forEach((e, t) => e.forEach((e, n) => e !== "" && h.push({
			r: t,
			c: n,
			input: e
		}))), h.length && l.applied(await e.call("xlsx.set", m, h), i), u();
	}, [h, g] = H(null), [_, v] = H(null), [y, x] = H(null), S = async (t, n) => {
		try {
			let r = await e.call("xlsx.bookOp", t);
			l.applied(r, i), p.setDirty(!0), n !== void 0 && s(Math.max(0, Math.min(n, i.sheets.length - 1))), u();
		} catch (e) {
			Qs(e), v(e.message);
		}
	}, C = (e, t) => {
		let n = i.sheets[e];
		if (!n || t === n.name) return;
		let r = $s(t);
		if (!r) return v("A sheet name cannot be empty");
		if (i.sheets.some((t) => t.index !== e && t.name.toLowerCase() === r.toLowerCase())) return v(`A sheet named “${r}” already exists`);
		let a = [];
		t.trim().length > 31 && a.push(`Sheet names have at most 31 characters: shortened to “${r}”.`), /[\\/?*[\]:]/.test(t) && a.push("Sheet names cannot contain \\ / ? * [ ] : — they were replaced by _."), r !== n.name && S({
			op: "rename",
			index: e,
			name: t
		}), a.length && v(a.join(" "));
	}, w = Math.min(o, i.sheets.length - 1), ee = V(w);
	ee.current = w;
	let te = jr();
	B(() => {
		if (!te) return;
		let e = 0, t = (e) => {
			let t = e.root.at, n = t && "sheet" in t ? i.sheets.findIndex((e) => e.path === t.sheet) : -1;
			return n >= 0 ? {
				i: n,
				a: t
			} : null;
		};
		te.setHost({
			kind: "xlsx",
			hint: "Select a cell to comment on.",
			pending: () => {
				let e = ee.current, n = i.sheets[e];
				if (!n) return null;
				let r = l.sheet(e).sel ?? {
					ar: 0,
					ac: 0
				}, a = te.threads().find((n) => {
					let i = t(n);
					return i?.i === e && i.a.r === r.ar && i.a.c === r.ac;
				});
				return {
					quote: `${n.name}!${b(r.ac)}${r.ar + 1}`,
					at: {
						sheet: n.path,
						r: r.ar,
						c: r.ac
					},
					existing: a?.root.id
				};
			},
			placed: (e) => {
				let n = [];
				for (let r of e) {
					let e = t(r);
					e && n.push({
						...r,
						quote: `${i.sheets[e.i].name}!${b(e.a.c)}${e.a.r + 1}`,
						k: [
							e.i,
							e.a.r,
							e.a.c
						]
					});
				}
				return n.sort((e, t) => e.k[0] - t.k[0] || e.k[1] - t.k[1] || e.k[2] - t.k[2]);
			},
			reveal: (n) => {
				let r = te.threads().find((e) => e.root.id === n), i = r && t(r);
				if (!i) return;
				let a = l.sheet(i.i);
				a.sel = {
					ar: i.a.r,
					ac: i.a.c,
					fr: i.a.r,
					fc: i.a.c
				}, a.goto = {
					r: i.a.r,
					c: i.a.c,
					n: ++e
				}, s(i.i), l.emit();
			}
		});
		let n = l.subscribe(() => te.touch());
		return () => {
			n(), te.setHost(null);
		};
	}, [
		te,
		l,
		i
	]);
	let [E, D] = H(null), ne = V(!1), re = !!E && qe(E.value) && ac(E, Xe(E.value, E.caret));
	return /* @__PURE__ */ G("div", {
		className: "de-xlsx",
		children: [
			/* @__PURE__ */ W(en, {
				text: f,
				onStatus: t
			}),
			/* @__PURE__ */ W(fc, {
				store: l,
				sheet: w,
				meta: i,
				client: e,
				edit: E,
				setEdit: D,
				hold: ne,
				onSheet: s
			}, `${w}:${i.sheets[w]?.path}`),
			/* @__PURE__ */ G("div", {
				className: "de-tabs",
				role: "tablist",
				children: [p.editable && /* @__PURE__ */ W("button", {
					type: "button",
					className: "de-tab de-tab-add",
					title: "Add sheet",
					onClick: () => void S({
						op: "add",
						after: w
					}, w + 1),
					children: /* @__PURE__ */ W(J, {
						name: "sheetAdd",
						size: 16
					})
				}), i.sheets.filter((e) => !e.hidden).map((e) => h === e.index ? /* @__PURE__ */ W("input", {
					className: "de-tab-input",
					autoFocus: !0,
					defaultValue: e.name,
					onBlur: (t) => {
						g(null), C(e.index, t.target.value);
					},
					onKeyDown: (e) => {
						e.key === "Enter" && e.target.blur(), e.key === "Escape" && g(null);
					}
				}, e.index) : /* @__PURE__ */ W("button", {
					type: "button",
					role: "tab",
					className: "de-tab",
					"aria-selected": e.index === w,
					onMouseDown: (t) => {
						re && (t.preventDefault(), e.index !== w && (ne.current = !0));
					},
					onClick: () => s(e.index),
					onDoubleClick: () => p.editable && g(e.index),
					onContextMenu: (t) => {
						p.editable && (t.preventDefault(), x({
							index: e.index,
							x: t.clientX,
							y: t.clientY
						}));
					},
					children: e.name
				}, e.index))]
			}),
			y && /* @__PURE__ */ W(sn, {
				x: y.x,
				y: y.y,
				onClose: () => x(null),
				items: [
					{
						label: "Rename",
						run: () => g(y.index)
					},
					{
						label: "Duplicate sheet",
						run: () => void S({
							op: "duplicate",
							index: y.index
						}, y.index + 1)
					},
					{
						label: "Move left",
						disabled: y.index === 0,
						run: () => void S({
							op: "move",
							from: y.index,
							to: y.index - 1
						}, y.index - 1)
					},
					{
						label: "Move right",
						disabled: y.index >= i.sheets.length - 1,
						run: () => void S({
							op: "move",
							from: y.index,
							to: y.index + 1
						}, y.index + 1)
					},
					{
						label: "Delete sheet",
						disabled: i.sheets.length <= 1,
						run: () => void S({
							op: "delete",
							index: y.index
						}, Math.max(0, y.index - 1))
					}
				]
			}),
			_ && /* @__PURE__ */ W(un, {
				text: _,
				onDone: () => v(null)
			})
		]
	});
}
function Qs(e) {
	console.error("[office-engine]", e);
}
var $s = (e) => e.trim().slice(0, 31).replace(/[\\/?*[\]:]/g, "_").replace(/^'|'$/g, "_").trim();
function ec(e) {
	return e === 255 ? {
		writingMode: "vertical-rl",
		textOrientation: "upright",
		whiteSpace: "nowrap"
	} : e === 90 ? {
		writingMode: "vertical-rl",
		transform: "rotate(180deg)",
		whiteSpace: "nowrap"
	} : e === -90 ? {
		writingMode: "vertical-rl",
		whiteSpace: "nowrap"
	} : {
		display: "inline-block",
		transform: `rotate(${-e}deg)`,
		whiteSpace: "nowrap"
	};
}
function tc(e, t) {
	let n = e > 0;
	return {
		display: "inline-block",
		flex: "none",
		whiteSpace: "nowrap",
		transform: `rotate(${-e}deg)`,
		transformOrigin: n ? "left bottom" : "left top",
		alignSelf: n ? "flex-end" : "flex-start",
		marginLeft: Math.ceil(t * Math.sin(Math.abs(e) * Math.PI / 180))
	};
}
function nc(e) {
	if (!e.own) return;
	let t = [e.u ? "underline" : "", e.strike ? "line-through" : ""].filter(Boolean).join(" "), n = {
		fontWeight: e.b ? 700 : 400,
		fontStyle: e.i ? "italic" : "normal"
	};
	t && (n.textDecoration = t);
	let r = e.color && F(e.color);
	return r && (n.color = r), e.sz ? n.fontSize = `${e.va ? e.sz * .7 : e.sz}pt` : e.va && (n.fontSize = "0.7em"), e.font && (n.fontFamily = i(e.font)), e.va && (n.verticalAlign = e.va === "superscript" ? "super" : "sub"), n;
}
var rc = 545, ic = je({
	center: "center",
	right: "flex-end",
	left: "flex-start",
	justify: "flex-start"
});
function ac(e, t) {
	return t ? e.point && e.point.e === e.caret && e.caret === e.caretEnd ? !0 : e.caret === e.caretEnd ? t.pointable : t.refs.some((t) => t.s === e.caret && t.e === e.caretEnd) : !1;
}
var oc = [
	"#1a73e8",
	"#e8710a",
	"#9334e6",
	"#188038",
	"#d93025",
	"#12a4b8",
	"#e52592",
	"#b08800"
], sc = (e) => e.replace(/\$/g, "").toUpperCase(), cc = je({
	ArrowUp: [-1, 0],
	ArrowDown: [1, 0],
	ArrowLeft: [0, -1],
	ArrowRight: [0, 1]
}), lc = (e) => ({
	r0: Math.min(e.ar, e.fr),
	c0: Math.min(e.ac, e.fc),
	r1: Math.max(e.ar, e.fr),
	c1: Math.max(e.ac, e.fc)
});
function uc(e, t) {
	let n = e;
	for (let e = !0; e;) {
		e = !1;
		for (let r of t) r.r1 < n.r0 || r.r0 > n.r1 || r.c1 < n.c0 || r.c0 > n.c1 || r.r0 >= n.r0 && r.r1 <= n.r1 && r.c0 >= n.c0 && r.c1 <= n.c1 || (n = {
			r0: Math.min(n.r0, r.r0),
			c0: Math.min(n.c0, r.c0),
			r1: Math.max(n.r1, r.r1),
			c1: Math.max(n.c1, r.c1)
		}, e = !0);
	}
	return n;
}
var dc = {
	left: 4,
	top: 4,
	width: 1,
	height: 1
};
function fc({ store: e, sheet: t, meta: n, client: r, edit: i, setEdit: a, hold: o, onSheet: s }) {
	let c = Yt(), l = c.editable, u = e.sheet(t), [d, f] = lt(), p = ut(d), [m, h] = H(() => u.sel ?? {
		ar: 0,
		ac: 0,
		fr: 0,
		fc: 0
	});
	u.sel = m;
	let [g, _] = H(null), v = g && g.r === m.ar && g.c === m.ac ? g.d : void 0, [x, S] = H(0), C = V(!1), w = V(null), ee = V(null), T = V(null), [te, D] = H(0), [ne, re] = H(null), [ie, ae] = H(null), oe = V(null), se = V(null), [ce, le] = H(null), O = V(null), pe = V(Promise.resolve()), [me, he] = H({
		open: !1,
		q: "",
		idx: 0,
		replace: !1,
		tick: 0
	}), [ge, _e] = H({}), [k, ve] = H([]), [A, ye] = H(null), j = jr(), be = Pr(j), xe = Ve(() => qs(j, n.sheets[t]?.path, be.active), [
		j,
		be,
		n.sheets,
		t
	]), Se = (e, t) => {
		let n = st(e, t);
		return xe.get(n ? n.r0 * 16384 + n.c0 : e * 16384 + t);
	}, [Ce, we] = H(null), { rowAxis: M, colAxis: N } = u, P = fs(r, t), Te = ms(P, N, M), I = Math.max(40, 12 + 7 * String(Math.max(u.rows, 1e3)).length), Ae = Math.max(0, f.w - I), je = Math.max(0, f.h - Vs), L = {
		rows: Ks(M, u.frozen.rows, je),
		cols: Ks(N, u.frozen.cols, Ae)
	};
	M.count = Math.max(u.rows + (u.done ? 20 : 1), Math.ceil(je / M.def) + 1, L.rows + 1, m.fr + 2, Te.rows + 1), N.count = Math.max(u.cols + 3, 26, Math.ceil(Ae / Math.max(1, N.def)) + 1, L.cols + 1, m.fc + 2, Te.cols + 1);
	let R = N.pos(L.cols), Me = M.pos(L.rows), Ne = N.total(), Pe = M.total(), Fe = I + Ne, z = Math.min(Vs + Pe, Hs), Ie = Math.max(0, Vs + Pe - f.h), Le = Math.max(0, z - f.h), Re = Le > 0 ? Math.min(Ie, p.y / Le * Ie) : 0, ze = p.x, He = R + ze, Ue = Me + Re, Ge = Math.max(0, Ae - R), Ke = Math.max(0, je - Me), Je = M.index(Ue), Ye = Math.min(M.count - 1, M.index(Ue + Ke)), $e = N.index(He), et = Math.min(N.count - 1, N.index(He + Ge)), tt = Ve(() => u.merges.filter((e) => e.r1 >= Je && e.r0 <= Ye || e.r0 < L.rows ? e.c1 >= $e && e.c0 <= et || e.c0 < L.cols : !1), [
		u.merges,
		Je,
		Ye,
		$e,
		et,
		L.rows,
		L.cols
	]);
	B(() => {
		L.rows && e.ensure(t, 0, L.rows - 1), e.ensure(t, Math.max(0, Je - 20), Ye + 40);
		for (let n of tt) n.r0 < Je && e.ensure(t, n.r0, n.r0);
	}), B(() => {
		let e = !0, { ar: n, ac: i } = m;
		return r.call("xlsx.cell", t, n, i).then((t) => e && _({
			r: n,
			c: i,
			d: t
		}), () => {}), () => {
			e = !1;
		};
	}, [
		r,
		t,
		m.ar,
		m.ac,
		u.done,
		x
	]);
	let at = n.styles, ot = _s(n.baseFont.fontSize, 14.67), st = (e, t) => u.merges.find((n) => e >= n.r0 && e <= n.r1 && t >= n.c0 && t <= n.c1);
	Be(() => {
		let r = !1;
		for (let [i, a] of [[0, L.rows - 1], [Je, Ye]]) for (let o = i; o <= a; o++) {
			if (M.size(o) !== M.def) continue;
			let i = 0;
			for (let [r, a, s] of e.row(t, o) ?? []) {
				let e = at[s];
				if (!a || !e?.textRotate) continue;
				let t = u.merges.length ? st(o, r) : void 0;
				t && t.r0 !== t.r1 || (i = Math.max(i, Math.min(rc, As(a, e, n.baseFont, ot, Number(e.textRotate)))));
			}
			i > M.def && (M.set(o, i), r = !0);
		}
		r && e.emit();
	});
	let K = uc(lc(m), u.merges), ct = K.r0 === K.r1 && K.c0 === K.c1 || u.merges.some((e) => e.r0 === K.r0 && e.c0 === K.c0 && e.r1 === K.r1 && e.c1 === K.c1), dt = V(K);
	dt.current = K, B(() => fe(r, {
		sheet: t,
		range: K,
		ar: m.ar,
		ac: m.ac
	}), [
		r,
		t,
		K.r0,
		K.c0,
		K.r1,
		K.c1,
		m.ar,
		m.ac
	]);
	let ft = U((e) => ue(r, e), () => de(r)), pt = n.sheets[t]?.path, ht = ft.flatMap((e) => {
		let t = e.presence;
		return t?.k === "xlsx" && t.sheet === pt && t.range ? [{
			...e,
			range: t.range,
			ar: t.ar ?? t.range.r0,
			ac: t.ac ?? t.range.c0
		}] : [];
	});
	Be(() => {
		o.current = !1;
		let t = d.current;
		t && u.scrollPos && (t.scrollLeft = u.scrollPos.x, t.scrollTop = u.scrollPos.y);
		let n = (l ? w.current : null) ?? t ?? null;
		return e.focusGrid ? (e.focusGrid = !1, n?.focus({ preventScroll: !0 })) : mt(n), () => {
			t?.isConnected && (u.scrollPos = {
				x: t.scrollLeft,
				y: t.scrollTop
			});
		};
	}, []);
	let gt = (e) => {
		let t = st(e.ar, e.ac);
		t && (e = {
			...e,
			ar: t.r0,
			ac: t.c0
		}), h(e);
	};
	function _t(r, a, o, s, c, d, f, p, h, g, _) {
		if (g <= 0 || _ <= 0 || o < a || c < s) return null;
		let v = [];
		if (u.gridLines) {
			for (let e = a; e <= o; e++) v.push(/* @__PURE__ */ W("div", {
				className: "de-gl-h",
				style: { top: M.pos(e + 1) - f - 1 }
			}, "h" + e));
			for (let e = s; e <= c; e++) v.push(/* @__PURE__ */ W("div", {
				className: "de-gl-v",
				style: { left: N.pos(e + 1) - d - 1 }
			}, "v" + e));
		}
		let y = /* @__PURE__ */ new Set(), b = [];
		for (let e of tt) if (!(e.r1 < a || e.r0 > o || e.c1 < s || e.c0 > c)) {
			b.push(e);
			for (let t = Math.max(e.r0, a); t <= Math.min(e.r1, o); t++) for (let n = Math.max(e.c0, s); n <= Math.min(e.c1, c); n++) y.add(t * 16384 + n);
		}
		let x = (e, t, r, i, a, o = !1) => {
			let [s, l, u, p, m, h] = t, g = r ?? N.size(s), _ = i ?? M.size(e);
			if (!g || !_) return null;
			let v = at[u] ?? {}, b = l;
			p === 1 && l && (b = Cs(l, g - 6, _s(v.fontSize, ot), Ds(v, n.baseFont, ot)));
			let { textAlign: x, textRotate: S, alignItems: C, whiteSpace: w, shrinkToFit: ee, ...T } = v;
			T.background !== void 0 && (T.background = Oe(T.background));
			let te = Number(S ?? 0), E = x && ic[x] || (p === 1 ? "flex-end" : p === 2 ? "center" : "flex-start"), D = 0;
			if (b && !te && !w && !ee && E === "flex-start" && !o && a) {
				let t = s + 1;
				for (; t <= c + 8 && !a.has(t) && !y.has(e * 16384 + t);) t++;
				D = N.pos(t) - N.pos(s);
			}
			let ne = {
				...T,
				left: N.pos(s) - d,
				top: M.pos(e) - f,
				width: g,
				height: _,
				justifyContent: E,
				alignItems: C ?? "flex-end",
				textAlign: x ?? void 0
			};
			m && (ne.color = F(m)), w && (ne.whiteSpace = w), o && !T.background && (ne.background = "linear-gradient(#fff, #fff) 0 0 / calc(100% - 1px) calc(100% - 1px) no-repeat");
			let re = D > g, ie = !!b && te !== 0 && Math.abs(te) < 90 && !w && E === "flex-start";
			ie && Object.assign(ne, {
				overflow: "visible",
				clipPath: "inset(0 -4000px 0 0)"
			});
			let ae;
			if (ee && b && !te && !w) {
				let e = Os(b, v, n.baseFont, ot);
				e > g - 6 && (ae = {
					transform: `scale(${Math.max(.2, (g - 6) / e)})`,
					transformOrigin: E === "flex-end" ? "right center" : E === "center" ? "center" : "left center",
					whiteSpace: "nowrap",
					flex: "none"
				});
			}
			return /* @__PURE__ */ W("div", {
				className: re ? "de-cell de-ov" : "de-cell",
				style: ne,
				children: b && /* @__PURE__ */ W("span", {
					style: ie ? tc(te, _s(v.fontSize, ot) * 1.2) : te ? ec(te) : re ? {
						maxWidth: D - 6,
						overflow: "hidden",
						flex: "none"
					} : ae,
					children: h ? h.map((e, t) => /* @__PURE__ */ W("span", {
						style: nc(e),
						children: e.t
					}, t)) : b
				})
			}, `${e}:${s}`);
		};
		for (let n of b) {
			let r = e.row(t, n.r0)?.find((e) => e[0] === n.c0) ?? [
				n.c0,
				"",
				0,
				0
			];
			v.push(x(n.r0, r, N.pos(n.c1 + 1) - N.pos(n.c0), M.pos(n.r1 + 1) - M.pos(n.r0), void 0, !0));
		}
		let S = (e) => u.blocks.get(Math.floor(e / Bs));
		if (u.colStyles.length || [.../* @__PURE__ */ new Set([S(a), S(o)])].some((e) => e?.own.size)) for (let n = a; n <= o; n++) {
			let r = S(n)?.own.get(n);
			if (!r && !u.colStyles.length) continue;
			let i = e.row(t, n), a = i?.length ? new Set(i.map((e) => e[0])) : void 0;
			for (let i = s; i <= c; i++) {
				if (a?.has(i) || y.has(n * 16384 + i)) continue;
				let o = r || e.placeStyle(t, n, i);
				o && Gs(at[o]) && v.push(x(n, [
					i,
					"",
					o,
					0
				]));
			}
		}
		for (let n = a; n <= o; n++) {
			let r = e.row(t, n);
			if (!r) continue;
			let i;
			for (let e of r) {
				let t = e[0];
				t < s - 8 || t > c || y.has(n * 16384 + t) || t < s && (!e[1] || e[3] !== 0) || b.some((e) => e.r0 === n && e.c0 === t) || (!i && e[3] === 0 && e[1] && (i = new Set(r.filter((e) => e[1] !== "").map((e) => e[0]))), v.push(x(n, e, void 0, void 0, i)));
			}
		}
		let C = N.pos(s), w = N.pos(c + 1), ee = M.pos(a), T = M.pos(o + 1);
		if (P.forEach((e, t) => {
			let n = ps(e, N, M);
			!n || n.x > w || n.x + n.w < C || n.y > T || n.y + n.h < ee || v.push(gs("dr" + t, e, {
				left: n.x - d,
				top: n.y - f,
				width: n.w,
				height: n.h
			}));
		}), l && !i && !se.current && K.r1 >= a && K.r1 <= o && K.c1 >= s && K.c1 <= c && K.r1 - K.r0 < 5e3 && K.c1 - K.c0 < 200 && v.push(/* @__PURE__ */ W("div", {
			"data-fill": !0,
			className: "de-fill-handle",
			style: {
				left: N.pos(K.c1 + 1) - d - 4,
				top: M.pos(K.r1 + 1) - f - 4
			}
		}, "fillh")), ce) {
			let e = En(ce);
			e && v.push(/* @__PURE__ */ W("div", {
				className: "de-fill-preview",
				style: {
					left: N.pos(e.c0) - d - 1,
					top: M.pos(e.r0) - f - 1,
					width: N.pos(e.c1 + 1) - N.pos(e.c0) + 1,
					height: M.pos(e.r1 + 1) - M.pos(e.r0) + 1
				}
			}, "fillp"));
		}
		if (K.r1 >= a && K.r0 <= o && K.c1 >= s && K.c0 <= c && !ct && v.push(/* @__PURE__ */ W("div", {
			className: "de-range",
			style: {
				left: N.pos(K.c0) - d,
				top: M.pos(K.r0) - f,
				width: N.pos(K.c1 + 1) - N.pos(K.c0),
				height: M.pos(K.r1 + 1) - M.pos(K.r0)
			}
		}, "range")), m.ar >= a - 1 && m.ar <= o && m.ac >= s - 1 && m.ac <= c) {
			let e = st(m.ar, m.ac), t = e ? N.pos(e.c1 + 1) - N.pos(e.c0) : N.size(m.ac), n = e ? M.pos(e.r1 + 1) - M.pos(e.r0) : M.size(m.ar);
			v.push(/* @__PURE__ */ W("div", {
				className: "de-sel",
				style: {
					left: N.pos(m.ac) - d - 1,
					top: M.pos(m.ar) - f - 1,
					width: t + 1,
					height: n + 1
				}
			}, "sel"));
		}
		for (let [e, t] of xe) {
			let n = Math.floor(e / 16384), r = e % 16384;
			if (n < a || n > o || r < s || r > c) continue;
			let i = st(n, r), l = N.pos((i ? i.c1 : r) + 1);
			v.push(/* @__PURE__ */ W("div", {
				className: "de-cm-mark" + (be.active === t ? " on" : ""),
				style: {
					left: l - d - 8,
					top: M.pos(n) - f
				}
			}, "cm" + t));
		}
		for (let e of ht) {
			let t = e.range;
			if (t.r1 < a || t.r0 > o || t.c1 < s || t.c0 > c) continue;
			let n = N.pos(t.c0), r = M.pos(t.r0), i = N.pos(t.c1 + 1), l = M.pos(t.r1 + 1), u = F(e.color);
			v.push(/* @__PURE__ */ W("div", {
				className: "de-peer-range",
				style: {
					left: n - d - 1,
					top: r - f - 1,
					width: i - n + 1,
					height: l - r + 1,
					borderColor: u,
					background: u && u + "12"
				},
				children: e.ar >= a && e.ar <= o && e.ac >= s && e.ac <= c && /* @__PURE__ */ W("span", {
					className: "de-peer-tag",
					style: { background: u },
					children: e.name
				})
			}, "peer" + e.site));
		}
		return Wn.forEach((e, t) => {
			e.r < a || e.r > o || e.c < s || e.c > c || v.push(/* @__PURE__ */ W("div", {
				className: t === me.idx ? "de-findcell on" : "de-findcell",
				style: {
					left: N.pos(e.c) - d,
					top: M.pos(e.r) - f,
					width: N.size(e.c),
					height: M.size(e.r)
				}
			}, "fm" + t));
		}), Ht.forEach((e, t) => {
			if (e.r1 < a || e.r0 > o || e.c1 < s || e.c0 > c) return;
			let n = M.pos(Math.max(e.r0, a - 1)), r = M.pos(Math.min(e.r1, o + 1) + 1), i = N.pos(Math.max(e.c0, s - 1)), l = N.pos(Math.min(e.c1, c + 1) + 1);
			v.push(/* @__PURE__ */ W("div", {
				className: e.point ? "de-fref de-fref-pt" : "de-fref",
				style: {
					left: i - d - 1,
					top: n - f - 1,
					width: l - i + 1,
					height: r - n + 1,
					borderColor: e.color,
					background: e.color + "14"
				}
			}, "fr" + t));
		}), /* @__PURE__ */ W("div", {
			className: "de-region",
			style: {
				left: p,
				top: h,
				width: g,
				height: _
			},
			children: v
		}, r);
	}
	function q(e, t, n, r, i, a) {
		if (a <= 0) return null;
		let o = [];
		for (let e = t; e <= n; e++) {
			let t = N.size(e);
			t && (o.push(/* @__PURE__ */ W("div", {
				"data-col": e,
				className: e >= K.c0 && e <= K.c1 ? "de-head-c de-head-on" : "de-head-c",
				style: {
					left: N.pos(e) - r,
					top: 0,
					width: t,
					height: Vs
				},
				children: b(e)
			}, e)), l && o.push(/* @__PURE__ */ W("div", {
				"data-grip-col": e,
				className: "de-grip-c",
				style: {
					left: N.pos(e + 1) - r - 3,
					height: Vs
				}
			}, "g" + e)));
		}
		return /* @__PURE__ */ W("div", {
			className: "de-region",
			style: {
				left: i,
				top: 0,
				width: a,
				height: Vs
			},
			children: o
		}, e);
	}
	function vt(e, t, n, r, i, a) {
		if (a <= 0) return null;
		let o = [];
		for (let e = t; e <= n; e++) {
			let t = M.size(e);
			t && (o.push(/* @__PURE__ */ W("div", {
				"data-row": e,
				className: e >= K.r0 && e <= K.r1 ? "de-head-r de-head-on" : "de-head-r",
				style: {
					left: 0,
					top: M.pos(e) - r,
					width: I,
					height: t
				},
				children: e + 1
			}, e)), l && o.push(/* @__PURE__ */ W("div", {
				"data-grip-row": e,
				className: "de-grip-r",
				style: {
					top: M.pos(e + 1) - r - 3,
					width: I
				}
			}, "g" + e)));
		}
		return /* @__PURE__ */ W("div", {
			className: "de-region",
			style: {
				left: 0,
				top: i,
				width: I,
				height: a
			},
			children: o
		}, e);
	}
	let yt = L.rows, J = L.cols, bt = Math.min(R, Ae), xt = Math.min(Me, je), St = (e, t) => {
		let n = st(e, t);
		return {
			x: I + N.pos(t) - (t >= J ? ze : 0),
			y: Vs + M.pos(e) - (e >= yt ? Re : 0),
			w: n ? N.pos(n.c1 + 1) - N.pos(n.c0) : N.size(t),
			h: n ? M.pos(n.r1 + 1) - M.pos(n.r0) : M.size(e)
		};
	}, Y = (e, t) => {
		let n = d.current;
		if (!n) return;
		let r = N.pos(t), i = M.pos(e);
		if (t < J && ze > 0 && (n.scrollLeft = 0), e < yt && Re > 0 && (n.scrollTop = 0), t >= J && (r - R < ze ? n.scrollLeft = r - R : r + N.size(t) > He + Ge && (n.scrollLeft = r + N.size(t) - R - Ge)), e >= yt && Ie > 0) {
			let t = Re;
			i - Me < Re ? t = i - Me : i + M.size(e) > Ue + Ke && (t = i + M.size(e) - Me - Ke), t !== Re && (n.scrollTop = t / Ie * Le);
		}
	}, X = u.goto?.n;
	B(() => {
		let e = u.goto;
		e && (gt({
			ar: e.r,
			ac: e.c,
			fr: e.r,
			fc: e.c
		}), Y(e.r, e.c));
	}, [X]);
	let Z = (e, t, n) => {
		let r = n.getBoundingClientRect(), i = e - r.left - I, a = t - r.top - Vs, o = i < R ? i : i + ze, s = a < Me ? a : a + Re;
		return {
			r: a < 0 ? -1 : M.index(Math.max(0, s)),
			c: i < 0 ? -1 : N.index(Math.max(0, o))
		};
	}, Ct = () => ((l ? w.current : null) ?? d.current)?.focus({ preventScroll: !0 }), wt = () => gt({
		ar: 0,
		ac: 0,
		fr: Math.max(0, u.rows - 1),
		fc: Math.max(0, u.cols - 1),
		whole: "all"
	});
	Zt(() => {
		i || (Ct(), wt());
	});
	let Tt = (n, r) => e.row(t, n)?.find((e) => e[0] === r)?.[2] ?? e.placeStyle(t, n, r), Et = async (t) => {
		try {
			let r = await t;
			e.applied(r, n), r && c.setDirty(!0), S((e) => e + 1);
		} catch (e) {
			console.error("[office-engine]", e), ye(e.message);
		}
	}, Dt = (r, i, a) => r ? r.formula ? r.formula : r.type === "number" && /[dmyhs]/i.test((n.formats[Tt(i, a)] ?? "").replace(/"[^"]*"|\[[^\]]*\]/g, "")) ? e.row(t, i)?.find((e) => e[0] === a)?.[1] ?? r.value : r.value : "", Ot = async (e, n = !1) => {
		if (!l || !u.done || i) return;
		let { ar: o, ac: s } = m, c = (e, r, i) => a({
			sheet: t,
			r: o,
			c: s,
			value: e,
			initial: r,
			bar: n,
			mode: i,
			caret: e.length,
			caretEnd: e.length,
			sync: +!n
		});
		if (e !== void 0) return c(e, "\0", "enter");
		let d = g && g.r === o && g.c === s ? g.d : await r.call("xlsx.cell", t, o, s).catch(() => void 0), f = Dt(d, o, s);
		c(f, f, "edit");
	}, kt = V(null), At = (e) => {
		let n = i;
		if (!n || kt.current === n) return;
		kt.current = n, a(null);
		let o = Qe(n.value);
		if (o !== n.initial && (pe.current = Et(r.call("xlsx.set", n.sheet, [{
			r: n.r,
			c: n.c,
			input: o
		}])).then(() => fn({
			r0: n.r,
			c0: n.c,
			r1: n.r,
			c1: n.c
		}, n.sheet))), n.sheet !== t) return Ft(n, e);
		e && nn(e[0], e[1], !1), Ct();
	}, jt = () => {
		let e = i;
		if (e && kt.current !== e) {
			if (kt.current = e, a(null), e.sheet !== t) return Ft(e);
			Ct();
		}
	}, Mt = () => {
		let e = i;
		if (!e || kt.current === e) return;
		let n = e.sheet === t ? K : {
			r0: e.r,
			c0: e.c,
			r1: e.r,
			c1: e.c
		};
		if ((n.r1 - n.r0 + 1) * (n.c1 - n.c0 + 1) > 1e5) return ye("The selection has more than 100,000 cells: select fewer to fill them");
		kt.current = e, a(null);
		let o = Qe(e.value), s = [];
		for (let r = n.r0; r <= n.r1; r++) for (let i = n.c0; i <= n.c1; i++) {
			let n = e.sheet === t ? st(r, i) : void 0;
			if (n && (n.r0 !== r || n.c0 !== i)) continue;
			let a = o;
			if (qe(o) && (r !== e.r || i !== e.c)) try {
				a = "=" + ke(o.slice(1), r - e.r, i - e.c);
			} catch {
				a = o;
			}
			s.push({
				r,
				c: i,
				input: a
			});
		}
		if (pe.current = Et(r.call("xlsx.set", e.sheet, s)).then(() => fn(n, e.sheet)), e.sheet !== t) return Ft(e);
		Ct();
	}, Nt = (e) => {
		let n = e.value;
		n && l && u.done && (Y(m.ar, m.ac), a({
			sheet: t,
			r: m.ar,
			c: m.ac,
			value: n,
			initial: "\0",
			bar: !1,
			mode: "enter",
			caret: e.selectionStart ?? n.length,
			caretEnd: e.selectionEnd ?? n.length,
			sync: 0
		}));
	}, Pt = () => {
		if (!i || !Rt) return;
		let e = Rt.refs.find((e) => i.caret >= e.s && i.caretEnd <= e.e);
		if (!e) return;
		let t = e.text.lastIndexOf("!"), n = e.text.slice(t + 1).split(":"), r = /^(\$?)([A-Za-z]*)(\$?)(\d*)$/.exec(n[0]);
		if (!r) return;
		let [, o, , s] = r, c = `${+!!o}${+!!s}`, l = c === "00" ? "11" : c === "11" ? "01" : c === "01" ? "10" : "00", u = e.text.slice(0, t + 1) + n.map((e) => e.replace(/^(\$?)([A-Za-z]*)(\$?)(\d*)$/, (e, t, n, r, i) => (n && l[0] === "1" ? "$" : "") + n + (i && l[1] === "1" ? "$" : "") + i)).join(":");
		a((t) => t && {
			...t,
			value: t.value.slice(0, e.s) + u + t.value.slice(e.e),
			caret: e.s + u.length,
			caretEnd: e.s + u.length,
			sync: t.sync + 1,
			point: void 0
		});
	}, Ft = (t, n) => {
		let r = Math.max(0, t.r + (n?.[0] ?? 0)), i = Math.max(0, t.c + (n?.[1] ?? 0));
		e.sheet(t.sheet).sel = {
			ar: r,
			ac: i,
			fr: r,
			fc: i
		}, e.focusGrid = !0, s(t.sheet);
	}, It = !!i && i.sheet === t, Lt = It && !i?.bar, Rt = i && qe(i.value) ? Xe(i.value, i.caret) : null, zt = !!i && ac(i, Rt), Bt = !!i?.point && i.point.e === i.caret && i.caret === i.caretEnd, Vt = [], Ht = [];
	if (Rt && i) {
		let e = /* @__PURE__ */ new Map();
		for (let r of Rt.refs) {
			let a = sc(r.text), o = e.get(a);
			o || e.set(a, o = oc[e.size % oc.length]), Vt.push({
				s: r.s,
				e: r.e,
				color: o
			});
			let s = r.ref.sheet;
			(s === void 0 ? i.sheet : n.sheets.findIndex((e) => e.name.toLowerCase() === s.toLowerCase())) === t && Ht.push({
				r0: r.ref.r0,
				c0: r.ref.c0,
				r1: r.ref.r1,
				c1: r.ref.c1,
				color: o,
				point: Bt && r.s === i.point.s
			});
		}
	}
	let Ut = Rt?.word && i?.noSuggest !== Rt.word.s && i?.caret === i?.caretEnd ? Rt.word : void 0, Wt = Ut ? rt(Ut.text, 8) : [], Gt = !Wt.length && Rt?.call ? nt(Rt.call.name) : void 0, Kt = Ut ? `${Ut.s}:${Ut.text}` : "";
	B(() => D(0), [Kt]);
	let qt = () => Lt ? w.current : T.current;
	Be(() => {
		if (!i) return;
		let e = qt();
		e && (e.getRootNode().activeElement === e ? i.sync && e === w.current && typeof matchMedia == "function" && matchMedia("(pointer: coarse)").matches && (o.current = !0, e.blur(), e.focus({ preventScroll: !0 }), o.current = !1) : e.focus({ preventScroll: !0 }), i.sync && e.setSelectionRange(i.caret, i.caretEnd));
	}, [
		i?.sync,
		Lt,
		i !== null
	]);
	let Jt = (e) => {
		let t = e.selectionStart ?? e.value.length, n = e.selectionEnd ?? t;
		a((e) => e && (e.caret !== t || e.caretEnd !== n) ? {
			...e,
			caret: t,
			caretEnd: n
		} : e);
	}, Xt = (e) => {
		let t = e.value, n = e.selectionStart ?? t.length, r = e.selectionEnd ?? n;
		a((e) => e && {
			...e,
			value: t,
			caret: n,
			caretEnd: r,
			point: void 0
		});
	}, Qt = (e, r, i, o) => {
		a((a) => {
			if (!a) return a;
			let s = Ze(e, r, i, o, t === a.sheet ? void 0 : n.sheets[t]?.name), c = a.point && a.point.e === a.caret && a.caret === a.caretEnd, l = c ? a.point.s : a.caret, u = c ? a.point.e : a.caretEnd;
			if (c && a.value.slice(l, u) === s) return a;
			let d = l + s.length;
			return {
				...a,
				value: a.value.slice(0, l) + s + a.value.slice(u),
				caret: d,
				caretEnd: d,
				sync: a.sync + 1,
				point: {
					s: l,
					e: d,
					sheet: t,
					ar: e,
					ac: r,
					fr: i,
					fc: o
				}
			};
		});
	}, $t = V(null), en = (e, n, r) => {
		let a = i?.point && Bt && i.point.sheet === t ? i.point : null, o = a ? a.ar : It ? i.r : m.ar, s = a ? a.ac : It ? i.c : m.ac, c = (e) => Math.max(0, Math.min(M.count - 1, e)), l = (e) => Math.max(0, Math.min(N.count - 1, e));
		if (r) {
			let t = c((a ? a.fr : o) + e), r = l((a ? a.fc : s) + n);
			Qt(o, s, t, r), Y(t, r);
		} else {
			let t = c(o + e), r = l(s + n);
			Qt(t, r, t, r), Y(t, r);
		}
	}, tn = (e) => {
		let t = Ut;
		t && a((n) => {
			if (!n) return n;
			let r = !e.args.length && !e.variadic, i = e.name + (t.call ? "" : r ? "()" : "("), a = t.s + e.name.length + (r && !t.call ? 2 : 1);
			return {
				...n,
				value: n.value.slice(0, t.s) + i + n.value.slice(t.e),
				caret: a,
				caretEnd: a,
				sync: n.sync + 1,
				point: void 0
			};
		});
	}, nn = (e, t, n) => {
		let r = n ? m.fr : m.ar, i = n ? m.fc : m.ac, a = n ? void 0 : st(m.ar, m.ac), o = r + e, s = i + t;
		for (a && e > 0 && (o = a.r1 + e), a && t > 0 && (s = a.c1 + t), o = Math.max(0, Math.min(M.count - 1, o)), s = Math.max(0, Math.min(N.count - 1, s)); o > 0 && M.size(o) === 0 && e < 0;) o--;
		for (; M.size(o) === 0 && o < M.count - 1;) o++;
		for (; s > 0 && N.size(s) === 0 && t < 0;) s--;
		for (; N.size(s) === 0 && s < N.count - 1;) s++;
		n ? h({
			...m,
			fr: o,
			fc: s,
			whole: void 0
		}) : gt({
			ar: o,
			ac: s,
			fr: o,
			fc: s
		}), Y(o, s);
	}, rn = async (e, n) => {
		let i = /* @__PURE__ */ new Map();
		for (let a = Math.floor(e / Bs); a <= Math.floor(n / Bs); a++) {
			let o = u.blocks.get(a), s = o?.complete ? o.rows : void 0;
			s ||= new Map((await r.call("xlsx.block", t, a * Bs, (a + 1) * Bs)).rows.map((e) => [e.r, e.cells]));
			for (let [t, r] of s) t >= e && t <= n && i.set(t, r);
		}
		return i;
	}, an = (e, t, n) => {
		n ? h((n) => ({
			...n,
			fr: e,
			fc: t,
			whole: void 0
		})) : gt({
			ar: e,
			ac: t,
			fr: e,
			fc: t
		}), Y(e, t);
	}, on = async (e, t, n) => {
		let r = Math.max(0, u.rows - 1), i = Math.max(0, u.cols - 1), a = n ? m.fr : m.ar, o = n ? m.fc : m.ac, s = (e, t) => e >= 0 && t >= 0 && e <= r && t <= i, c = /* @__PURE__ */ new Map(), l = 0, d = async (e, t) => {
			if (!c.has(e)) {
				let t = Math.floor(e / Bs) * Bs;
				l++;
				let n = await rn(t, t + Bs - 1);
				for (let e = t; e < t + Bs; e++) c.set(e, n.get(e) ?? []);
			}
			return c.get(e).some((e) => e[0] === t && e[1] !== "");
		};
		if (s(a + e, o + t)) {
			if (await d(a, o) && await d(a + e, o + t)) for (; s(a + e, o + t) && await d(a + e, o + t);) a += e, o += t;
			else {
				do
					a += e, o += t;
				while (s(a, o) && l < 300 && !await d(a, o));
				(!s(a, o) || l >= 300) && (a = e > 0 ? r : e < 0 ? 0 : Math.max(0, Math.min(r, a)), o = t > 0 ? i : t < 0 ? 0 : Math.max(0, Math.min(i, o)));
			}
			an(a, o, n);
		}
	}, cn = async (e, t, n) => {
		let r = n ? m.fr : m.ar;
		if (t) return an(e ? Math.max(0, u.rows - 1) : 0, e ? Math.max(0, u.cols - 1) : 0, n);
		if (!e) return an(r, 0, n);
		let i = ((await rn(r, r)).get(r) ?? []).reduce((e, t) => t[1] === "" ? e : Math.max(e, t[0]), -1);
		an(r, i >= 0 ? i : Math.max(0, u.cols - 1), n);
	}, ln = (e, t) => (O.current === null && (O.current = t), [0, e ? -1 : 1]), dn = (e, t) => {
		let n = O.current;
		return O.current = null, [e ? -1 : 1, n !== null && !e ? n - t : 0];
	}, fn = async (r, i = t) => {
		if (!l || i !== t) return;
		let a = e.sheet(t), o = /* @__PURE__ */ new Map();
		for (let [, e] of await rn(r.r0, Math.min(r.r1, r.r0 + 999))) for (let [t, i, s, c] of e) {
			if (t < r.c0 || t > r.c1 || c !== 1 || !i || (n.formats[s] ?? "General") === "General" || a.colAxis.size(t) !== a.colAxis.def) continue;
			let e = at[s] ?? {}, l = _s(e.fontSize, ot), u = Ds(e, n.baseFont, ot);
			if (Cs(i, a.colAxis.size(t) - 6, l, u) === i) continue;
			let d = Math.ceil(Os(i, e, n.baseFont, ot)) + 12;
			for (; d < 400 && Cs(i, d - 6, l, u) !== i;) d += 6;
			o.set(t, Math.max(o.get(t) ?? 0, d));
		}
		for (let [e, t] of o) await jn({
			op: "colWidth",
			c0: e,
			c1: e,
			px: Math.min(t, 400)
		});
	}, pn = async (e) => {
		let t = 0, r = Math.min(u.rows, 2e4);
		for (let i = 0; i < r; i += 1024) for (let a of (await rn(i, Math.min(r - 1, i + 1024 - 1))).values()) {
			let r = a.find((t) => t[0] === e), i = r && at[r[2]];
			r?.[1] && i?.whiteSpace !== "pre-wrap" && (t = Math.max(t, Os(r[1], i ?? {}, n.baseFont, ot)));
		}
		return t ? Math.min(600, Math.ceil(t) + 12) : N.def;
	}, mn = async (r, i) => {
		let a = e.sheet(t), o = [], s = Math.min(r.r1, r.r0 + 999), c = await rn(r.r0, s);
		for (let e = r.r0; e <= s; e++) {
			let t = c.get(e) ?? [];
			if (a.rowAxis.size(e) === 0) continue;
			let r = i ? a.rowAxis.def : 0;
			for (let [e, o, s] of t) {
				if (!o) continue;
				let t = at[s] ?? {};
				t.textRotate ? r = Math.max(r, Math.min(rc, As(o, t, n.baseFont, ot, Number(t.textRotate)))) : t.whiteSpace === "pre-wrap" ? r = Math.max(r, ks(o, t, n.baseFont, ot, a.colAxis.size(e) - 6)) : i && (r = Math.max(r, Math.ceil(_s(t.fontSize, ot) * 1.2) + 3));
			}
			r && (i ? r !== a.rowAxis.size(e) : r > a.rowAxis.size(e)) && o.push([e, r]);
		}
		for (let e = 0; e < o.length;) {
			let t = e;
			for (; t + 1 < o.length && o[t + 1][0] === o[t][0] + 1 && o[t + 1][1] === o[e][1];) t++;
			await jn({
				op: "rowHeight",
				r0: o[e][0],
				r1: o[t][0],
				px: o[e][1]
			}), e = t + 1;
		}
	}, hn = () => void jn({
		op: "clear",
		range: K
	}), gn = at[Tt(m.ar, m.ac)] ?? {}, _n = (e) => vn(m.whole === "all" ? {
		r0: 0,
		c0: 0,
		r1: Ee,
		c1: De
	} : m.whole === "col" ? {
		...K,
		r0: 0,
		r1: Ee
	} : m.whole === "row" ? {
		...K,
		c0: 0,
		c1: De
	} : K, e), vn = (e, n) => {
		let i = Et(r.call("xlsx.format", t, e, n));
		n.wrap && i.then(() => mn(e, !1)), n.numFmt !== void 0 && i.then(() => fn(e)), Ct();
	}, yn = (e) => {
		let t = e === "b" ? gn.fontWeight === 700 : e === "i" ? gn.fontStyle === "italic" : String(gn.textDecoration ?? "").includes(e === "u" ? "underline" : "line-through");
		_n({ [e]: !t });
	}, bn = () => void Et(r.call("xlsx.undo")), xn = () => void Et(r.call("xlsx.redo")), Sn = () => {
		let n = Math.min(K.r1, u.rows - 1), r = Math.min(K.c1, u.cols - 1);
		if (n - K.r0 > 2e3 || !e.loaded(t, K.r0, Math.max(K.r0, n))) return null;
		let i = [];
		for (let a = K.r0; a <= Math.max(K.r0, n); a++) {
			let n = e.row(t, a), o = [];
			for (let e = K.c0; e <= Math.max(K.c0, r); e++) o.push(y(n?.find((t) => t[0] === e)?.[1] ?? ""));
			i.push(o.join("	"));
		}
		return i.join("\n");
	}, Cn = (n, i) => {
		n.preventDefault();
		let a = { ...K }, o = Sn();
		o !== null && n.clipboardData.setData("text/plain", o), e.clip = null, r.call("xlsx.copy", t, a).then(async (t) => {
			o === null && await navigator.clipboard.writeText(t.text), e.clip = {
				text: o ?? t.text,
				data: t,
				cut: i
			}, i && await jn({
				op: "clear",
				range: a
			});
		}).catch((e) => ye(o === null && e.name === "NotAllowedError" ? "The browser blocked clipboard access: select fewer rows to copy them" : e.message));
	}, wn = (e) => {
		if (i) return;
		let t = e.metaKey || e.ctrlKey, n = e.key.toLowerCase();
		if (t && n === "s") {
			e.preventDefault(), c.save();
			return;
		}
		if (t && n === "a" && !e.altKey && !e.shiftKey) {
			e.preventDefault(), wt();
			return;
		}
		if (l && t && !e.altKey) {
			if (n === "z") {
				e.preventDefault(), e.shiftKey ? xn() : bn();
				return;
			}
			if (n === "y") {
				e.preventDefault(), xn();
				return;
			}
			if (n === "b" || n === "i" || n === "u") {
				e.preventDefault(), yn(n);
				return;
			}
			if (n === "d" || n === "r") {
				e.preventDefault(), jn({
					op: "fill",
					range: K,
					dir: n === "d" ? "down" : "right"
				});
				return;
			}
			if (n === "\\") {
				e.preventDefault(), _n({ clear: !0 });
				return;
			}
			if (n === "x" && e.shiftKey) {
				e.preventDefault(), yn("strike");
				return;
			}
		}
		if (t && (n === "f" || n === "h")) {
			e.preventDefault(), he((e) => ({
				...e,
				open: !0,
				replace: n === "h" || e.replace,
				tick: e.tick + 1
			}));
			return;
		}
		if (e.code === "Space" && (e.shiftKey || t) && !e.altKey) {
			e.preventDefault(), gt(t ? {
				ar: 0,
				ac: K.c0,
				fr: Math.max(0, u.rows - 1),
				fc: K.c1,
				whole: "col"
			} : {
				ar: K.r0,
				ac: 0,
				fr: K.r1,
				fc: Math.max(0, u.cols - 1),
				whole: "row"
			});
			return;
		}
		if (e.key === "Escape" && ie !== null) {
			ae(null);
			return;
		}
		let r = Math.max(1, Math.floor(Ke / M.def) - 1), a = {
			ArrowUp: [-1, 0],
			ArrowDown: [1, 0],
			ArrowLeft: [0, -1],
			ArrowRight: [0, 1],
			PageDown: [r, 0],
			PageUp: [-r, 0]
		};
		if (a[e.key]) {
			e.preventDefault(), O.current = null;
			let [n, r] = a[e.key];
			t && !e.key.startsWith("Page") ? on(n, r, e.shiftKey) : nn(n, r, e.shiftKey);
		} else e.key === "Home" || e.key === "End" ? (e.preventDefault(), O.current = null, cn(e.key === "End", t, e.shiftKey)) : e.key === "Enter" || e.key === "Tab" ? (e.preventDefault(), e.key === "Enter" ? nn(...dn(e.shiftKey, m.ac), !1) : nn(...ln(e.shiftKey, m.ac), !1)) : l && (e.altKey && e.code === "Equal" ? (e.preventDefault(), In("SUM")) : t && !e.altKey && e.code === "Semicolon" ? (e.preventDefault(), Tn(e.shiftKey)) : e.key === "F2" ? (e.preventDefault(), Ot()) : (e.key === "Delete" || e.key === "Backspace") && (e.preventDefault(), hn()));
	}, Tn = (e) => {
		let n = /* @__PURE__ */ new Date(), i = e ? (n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()) / 86400 : Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 864e5) + 25569, a = {
			r0: m.ar,
			c0: m.ac,
			r1: m.ar,
			c1: m.ac
		};
		pe.current = (async () => {
			await Et(r.call("xlsx.set", t, [{
				r: m.ar,
				c: m.ac,
				input: String(i)
			}])), await Et(r.call("xlsx.format", t, a, { numFmt: e ? "hh:mm" : "yyyy-mm-dd" })), await fn(a);
		})();
	}, En = (e) => {
		let t = se.current?.src ?? K, n = e.r - t.r1, r = e.c - t.c1;
		return n > 0 && n >= r ? {
			r0: t.r0,
			c0: t.c0,
			r1: e.r,
			c1: t.c1
		} : r > 0 ? {
			r0: t.r0,
			c0: t.c0,
			r1: t.r1,
			c1: e.c
		} : null;
	}, Dn = async (e, n) => {
		let i = En(n);
		if (!i) return;
		let a = i.r1 > e.r1, o = e.r1 - e.r0 + 1, s = e.c1 - e.c0 + 1;
		if (a ? o === 1 : s === 1) await jn({
			op: "fill",
			range: i,
			dir: a ? "down" : "right"
		});
		else {
			let n = await r.call("xlsx.copy", t, e), c = a ? i.r1 - e.r1 : o, l = a ? s : i.c1 - e.c1, u = [];
			for (let e = 0; e < c; e++) {
				let t = [];
				for (let r = 0; r < l; r++) {
					let i = n.cells[a ? e % o : e]?.[a ? r : r % s] ?? null, c = Math.floor(a ? e / o : r / s);
					t.push(i && i[3] !== void 0 && c ? [
						i[0],
						i[1],
						i[2],
						ke(i[3], a ? c * o : 0, a ? 0 : c * s)
					] : i);
				}
				u.push(t);
			}
			let d = a ? {
				r0: e.r1 + 1,
				c0: e.c0,
				r1: i.r1,
				c1: e.c1
			} : {
				r0: e.r0,
				c0: e.c1 + 1,
				r1: e.r1,
				c1: i.c1
			};
			await jn({
				op: "paste",
				range: d,
				cells: u,
				from: {
					sheet: n.sheet,
					r0: e.r0,
					c0: e.c0
				}
			});
		}
		h({
			ar: e.r0,
			ac: e.c0,
			fr: i.r1,
			fc: i.c1
		});
	}, On = async (e) => {
		let t = e.dataset.gripCol, n = Number(t ?? e.dataset.gripRow);
		if (t !== void 0) {
			let e = K.r0 === 0 && K.r1 >= u.rows - 1 && n >= K.c0 && n <= K.c1;
			for (let t = e ? K.c0 : n; t <= (e ? Math.min(K.c1, K.c0 + 199) : n); t++) await jn({
				op: "colWidth",
				c0: t,
				c1: t,
				px: await pn(t)
			});
		} else {
			let e = K.c0 === 0 && K.c1 >= u.cols - 1 && n >= K.r0 && n <= K.r1;
			await mn({
				r0: e ? K.r0 : n,
				c0: 0,
				r1: e ? K.r1 : n,
				c1: 0
			}, !0);
		}
	}, kn = (e) => {
		if (e.button !== 0) return;
		if (e.target.closest("[data-fill]") && !i) {
			e.preventDefault(), se.current = { src: { ...K } }, oe.current = () => {
				let e = se.current;
				se.current = null, le(null), e?.to && Dn(e.src, e.to);
			};
			return;
		}
		O.current = null;
		let n = e.target.closest("[data-grip-col],[data-grip-row]");
		if (n) {
			e.preventDefault();
			let t = n.dataset.gripCol, r = Number(t ?? n.dataset.gripRow);
			we(t === void 0 ? {
				axis: "row",
				i: r,
				start: e.clientY,
				size: M.size(r)
			} : {
				axis: "col",
				i: r,
				start: e.clientX,
				size: N.size(r)
			});
			return;
		}
		let r = e.currentTarget, { r: a, c: o } = Z(e.clientX, e.clientY, r);
		if (i && zt) {
			if (e.preventDefault(), a < 0 && o < 0) return;
			let n = a < 0 ? "col" : o < 0 ? "row" : "cell", [r, s] = [Math.max(a, 0), Math.max(o, 0)], c = n === "cell" ? st(a, o) : void 0;
			c && ([r, s] = [c.r0, c.c0]);
			let l = e.shiftKey && Bt && i.point.sheet === t ? i.point : null;
			l && ([r, s] = [l.ar, l.ac]), $t.current = {
				ar: r,
				ac: s,
				axis: n
			}, An(r, s, a, o, n);
		} else {
			if (i && At(), e.preventDefault(), ie !== null && a >= 0 && o >= 0) {
				let e = ie;
				oe.current = () => {
					ae(null), vn(dt.current, { xf: e });
				};
			}
			if (Ct(), a < 0 && o < 0) gt({
				ar: 0,
				ac: 0,
				fr: Math.max(0, u.rows - 1),
				fc: Math.max(0, u.cols - 1),
				whole: "all"
			});
			else {
				if (a < 0) gt({
					ar: 0,
					ac: o,
					fr: Math.max(0, u.rows - 1),
					fc: o,
					whole: "col"
				});
				else if (o < 0) gt({
					ar: a,
					ac: 0,
					fr: a,
					fc: Math.max(0, u.cols - 1),
					whole: "row"
				});
				else if (e.shiftKey) h({
					...m,
					fr: a,
					fc: o,
					whole: void 0
				});
				else {
					gt({
						ar: a,
						ac: o,
						fr: a,
						fc: o
					});
					let e = Se(a, o);
					e ? j?.select(e, !1) : be.active && j?.select(null);
				}
				a >= 0 && o >= 0 && (C.current = !0);
			}
		}
	}, An = (e, t, n, r, i) => {
		if (i === "col") Qt(0, t, Ee, Math.max(0, r));
		else if (i === "row") Qt(e, 0, Math.max(0, n), De);
		else {
			let i = st(n, r), a = i && !(e >= i.r0 && e <= i.r1 && t >= i.c0 && t <= i.c1) ? i : void 0, o = a ? a.r0 < e ? a.r0 : a.r1 : Math.max(0, n), s = a ? a.c0 < t ? a.c0 : a.c1 : Math.max(0, r);
			Qt(e, t, o, s);
		}
	};
	B(() => {
		let e = () => {
			C.current = !1, $t.current = null;
			let e = oe.current;
			oe.current = null, e && setTimeout(e, 0);
		};
		return window.addEventListener("mouseup", e), () => window.removeEventListener("mouseup", e);
	}, []), B(() => {
		if (!Ce) return;
		let e = Ce.axis === "col" ? N : M, t = (t) => {
			let n = (Ce.axis === "col" ? t.clientX : t.clientY) - Ce.start;
			e.set(Ce.i, Math.max(Ce.axis === "col" ? 8 : 6, Math.round(Ce.size + n))), S((e) => e + 1);
		}, n = () => {
			let t = e.size(Ce.i);
			we(null);
			let [n, r] = (Ce.axis === "col" ? K.r0 === 0 && K.r1 >= u.rows - 1 && Ce.i >= K.c0 && Ce.i <= K.c1 : K.c0 === 0 && K.c1 >= u.cols - 1 && Ce.i >= K.r0 && Ce.i <= K.r1) ? Ce.axis === "col" ? [K.c0, K.c1] : [K.r0, K.r1] : [Ce.i, Ce.i];
			jn(Ce.axis === "col" ? {
				op: "colWidth",
				c0: n,
				c1: r,
				px: t
			} : {
				op: "rowHeight",
				r0: n,
				r1: r,
				px: t
			});
		};
		return window.addEventListener("mousemove", t), window.addEventListener("mouseup", n, { once: !0 }), () => {
			window.removeEventListener("mousemove", t), window.removeEventListener("mouseup", n);
		};
	});
	let jn = (e) => Et(r.call("xlsx.sheetOp", t, e)), Mn = u.merges.some((e) => e.r0 >= K.r0 && e.r1 <= K.r1 && e.c0 >= K.c0 && e.c1 <= K.c1), Nn = () => Pn(Mn ? "unmerge" : "all"), Pn = async (e) => {
		if (e === "unmerge") return void jn({
			op: "unmerge",
			range: K
		});
		let t = 0, n = { ...K };
		if (n.r1 - n.r0 < 5e3) for (let [r, i] of await rn(n.r0, n.r1)) for (let [a, o] of i) a < n.c0 || a > n.c1 || !o || (e === "all" ? r === n.r0 && a === n.c0 : e === "across" ? a === n.c0 : r === n.r0) || t++;
		await jn({
			op: "merge",
			range: n,
			mode: e
		}), t && ye(`Merging keeps only the upper-left value of each merged cell: ${t} other value${t > 1 ? "s were" : " was"} removed. Undo (${Q}Z) brings ${t > 1 ? "them" : "it"} back.`);
	}, Fn = (e) => void jn({
		op: "freeze",
		rows: e === "row" ? 1 : e === "sel" ? m.ar : 0,
		cols: e === "col" ? 1 : e === "sel" ? m.ac : 0
	}), In = (n = "SUM") => {
		let { ar: i, ac: a } = m;
		if (!ct) {
			let e = `${b(K.c0)}${K.r0 + 1}:${b(K.c1)}${K.r1 + 1}`;
			Et(r.call("xlsx.set", t, [{
				r: K.r1 + 1,
				c: K.c0,
				input: `=${n}(${e})`
			}]));
			return;
		}
		let o = (n, r) => e.row(t, n)?.find((e) => e[0] === r)?.[3] === 1, s = i - 1;
		for (; s >= 0 && o(s, a);) s--;
		let c = "";
		if (s < i - 1) c = `${b(a)}${s + 2}:${b(a)}${i}`;
		else {
			let e = a - 1;
			for (; e >= 0 && o(i, e);) e--;
			e < a - 1 && (c = `${b(e + 1)}${i + 1}:${b(a - 1)}${i + 1}`);
		}
		if (!c) return void Ot(`=${n}(`);
		Et(r.call("xlsx.set", t, [{
			r: i,
			c: a,
			input: `=${n}(${c})`
		}]));
	}, Ln = async (e) => {
		let n = { ...K }, i = m.ac, a;
		try {
			a = await r.call("xlsx.region", t, n);
		} catch (e) {
			return ye(e.message);
		}
		let o = a.range, s = n.r0 === n.r1 ? o.r0 : Math.max(n.r0, o.r0), c = n.r0 === n.r1 ? o.r1 : Math.min(n.r1, o.r1);
		s === o.r0 && a.header && s++, s = Math.max(s, u.frozen.rows), c <= s || jn({
			op: "sort",
			range: {
				r0: s,
				c0: o.c0,
				r1: c,
				c1: o.c1
			},
			col: i,
			desc: e
		});
	}, Rn = (e) => {
		let t = K.r1 - K.r0 + 1, n = K.c1 - K.c0 + 1, r = {
			rowAbove: {
				op: "insertRows",
				at: K.r0,
				n: t
			},
			rowBelow: {
				op: "insertRows",
				at: K.r1 + 1,
				n: t
			},
			colLeft: {
				op: "insertCols",
				at: K.c0,
				n
			},
			colRight: {
				op: "insertCols",
				at: K.c1 + 1,
				n
			},
			delRow: {
				op: "deleteRows",
				at: K.r0,
				n: t
			},
			delCol: {
				op: "deleteCols",
				at: K.c0,
				n
			},
			hideRows: {
				op: "hideRows",
				a: K.r0,
				b: K.r1,
				hidden: !0
			},
			hideCols: {
				op: "hideCols",
				a: K.c0,
				b: K.c1,
				hidden: !0
			},
			unhideRows: {
				op: "hideRows",
				a: Math.max(0, K.r0 - +(t === 1)),
				b: K.r1 + +(t === 1),
				hidden: !1
			},
			unhideCols: {
				op: "hideCols",
				a: Math.max(0, K.c0 - +(n === 1)),
				b: K.c1 + +(n === 1),
				hidden: !1
			}
		};
		r[e] && jn(r[e]);
	}, zn = (e, t) => u.merges.some((n) => {
		if (n.r1 < e.r0 || n.r0 > e.r1 || n.c1 < e.c0 || n.c0 > e.c1) return !1;
		for (let r = Math.max(n.r0, e.r0); r <= Math.min(n.r1, e.r1); r++) for (let i = Math.max(n.c0, e.c0); i <= Math.min(n.c1, e.c1); i++) if ((r !== n.r0 || i !== n.c0) && t(r, i)) return !0;
		return !1;
	}), Bn = "Cannot paste here: the cells would fill merged cells. Unmerge them, or paste into one cell.", Vn = (n) => {
		let i = (e) => e.replace(/\r\n?/g, "\n").replace(/\n$/, ""), a = {
			r: K.r0,
			c: K.c0
		}, o = e.clip;
		if (o && i(n) === i(o.text)) {
			let { cells: t, range: n } = o.data, r = t.length, i = Math.max(1, ...t.map((e) => e.length)), s = K.r1 - K.r0 + 1, c = K.c1 - K.c0 + 1, l = !o.cut && !ct && r > 0 && s % r === 0 && c % i === 0 && s * c <= 1e5 ? {
				r: s / r,
				c: c / i
			} : {
				r: 1,
				c: 1
			}, u = [];
			for (let e = 0; e < r * l.r; e++) {
				let n = [];
				for (let a = 0; a < i * l.c; a++) {
					let o = t[e % r]?.[a % i] ?? null, s = Math.floor(e / r), c = Math.floor(a / i);
					n.push(o && o[3] !== void 0 && (s || c) ? [
						o[0],
						o[1],
						o[2],
						ke(o[3], s * r, c * i)
					] : o);
				}
				u.push(n);
			}
			let d = {
				r0: a.r,
				c0: a.c,
				r1: a.r + u.length - 1,
				c1: a.c + i * l.c - 1
			};
			if (u.length * i * l.c > 1 && zn(d, (e, t) => !!u[e - d.r0]?.[t - d.c0] && u[e - d.r0][t - d.c0][1] !== "")) return ye(Bn);
			jn({
				op: "paste",
				range: d,
				cells: u,
				from: {
					sheet: o.data.sheet,
					r0: n.r0,
					c0: n.c0
				},
				...o.cut ? { moved: !0 } : {}
			}), o.cut && (e.clip = {
				...o,
				cut: !1
			});
			return;
		}
		let s = E(n);
		if (s.length === 1 && s[0].length === 1 && !ct) {
			let e = [];
			if ((K.r1 - K.r0 + 1) * (K.c1 - K.c0 + 1) > 1e5) return ye("The selection has more than 100,000 cells: select fewer to fill them");
			for (let t = K.r0; t <= K.r1; t++) for (let n = K.c0; n <= K.c1; n++) {
				let r = st(t, n);
				(!r || r.r0 === t && r.c0 === n) && e.push({
					r: t,
					c: n,
					input: s[0][0]
				});
			}
			Et(r.call("xlsx.set", t, e));
			return;
		}
		let c = s.flatMap((e, t) => e.map((e, n) => ({
			r: a.r + t,
			c: a.c + n,
			input: e
		}))), l = {
			r0: a.r,
			c0: a.c,
			r1: a.r + s.length - 1,
			c1: a.c + Math.max(1, ...s.map((e) => e.length)) - 1
		};
		if (c.length > 1 && zn(l, (e, t) => (s[e - l.r0]?.[t - l.c0] ?? "") !== "")) return ye(Bn);
		c.length > 1e5 && ye(`Only the first 100,000 of the ${c.length.toLocaleString()} cells were pasted`), c.length && Et(r.call("xlsx.set", t, c.slice(0, 1e5)));
	}, Hn = () => {
		let e = K.r1 - K.r0 + 1, t = K.c1 - K.c0 + 1, n = e === 1 ? `row ${K.r0 + 1}` : `rows ${K.r0 + 1}–${K.r1 + 1}`, r = t === 1 ? `column ${b(K.c0)}` : `columns ${b(K.c0)}–${b(K.c1)}`, i = e === 1 && t === 1, a = Se(m.ar, m.ac), o = a ? [{
			label: "Show comment",
			icon: "comment",
			run: () => j?.select(a)
		}] : j?.canComment ? [{
			label: "Comment",
			icon: "commentAdd",
			hint: Ir,
			run: () => j.start()
		}] : [];
		return [
			...o,
			{
				label: "Cut",
				icon: "cut",
				hint: `${Q}X`,
				sep: o.length > 0,
				run: () => document.execCommand("cut")
			},
			{
				label: "Copy",
				icon: "copy",
				hint: `${Q}C`,
				run: () => document.execCommand("copy")
			},
			{
				label: "Paste",
				icon: "paste",
				hint: `${Q}V`,
				run: () => void navigator.clipboard?.readText().then(Vn).catch(() => ye(`The browser blocked clipboard access — use ${Q}V to paste`))
			},
			{
				label: `Insert ${e} row${e > 1 ? "s" : ""} above`,
				icon: "rowAbove",
				sep: !0,
				run: () => Rn("rowAbove")
			},
			{
				label: `Insert ${e} row${e > 1 ? "s" : ""} below`,
				icon: "rowBelow",
				run: () => Rn("rowBelow")
			},
			{
				label: `Insert ${t} column${t > 1 ? "s" : ""} left`,
				icon: "colLeft",
				run: () => Rn("colLeft")
			},
			{
				label: `Insert ${t} column${t > 1 ? "s" : ""} right`,
				icon: "colRight",
				run: () => Rn("colRight")
			},
			{
				label: `Delete ${n}`,
				icon: "delRow",
				sep: !0,
				run: () => Rn("delRow")
			},
			{
				label: `Delete ${r}`,
				icon: "delCol",
				run: () => Rn("delCol")
			},
			{
				label: `Hide ${n}`,
				icon: "hide",
				sep: !0,
				run: () => Rn("hideRows")
			},
			{
				label: `Hide ${r}`,
				icon: "hide",
				run: () => Rn("hideCols")
			},
			{
				label: "Unhide rows",
				icon: "view",
				run: () => Rn("unhideRows")
			},
			{
				label: "Unhide columns",
				icon: "view",
				run: () => Rn("unhideCols")
			},
			{
				label: Mn ? "Unmerge cells" : "Merge cells",
				icon: "merge",
				sep: !0,
				run: Nn,
				disabled: i && !Mn
			},
			{
				label: `Sort ${i ? "sheet" : "range"} by ${b(m.ac)}, A → Z`,
				icon: "sortAZ",
				run: () => Ln(!1)
			},
			{
				label: `Sort ${i ? "sheet" : "range"} by ${b(m.ac)}, Z → A`,
				icon: "sortZA",
				run: () => Ln(!0)
			},
			{
				label: "Fill down",
				icon: "down",
				hint: `${Q}D`,
				run: () => void jn({
					op: "fill",
					range: K,
					dir: "down"
				}),
				disabled: e === 1
			},
			{
				label: "Fill right",
				hint: `${Q}R`,
				run: () => void jn({
					op: "fill",
					range: K,
					dir: "right"
				}),
				disabled: t === 1
			},
			{
				label: "Clear contents",
				icon: "trash",
				hint: "Del",
				sep: !0,
				run: hn
			},
			{
				label: "Clear formatting",
				icon: "clear",
				hint: `${Q}\\`,
				run: () => _n({ clear: !0 })
			},
			{
				label: `Freeze up to ${b(m.ac)}${m.ar + 1}`,
				icon: "freeze",
				sep: !0,
				run: () => Fn("sel")
			},
			{
				label: "Unfreeze",
				run: () => Fn("none"),
				disabled: !u.frozen.rows && !u.frozen.cols
			}
		];
	};
	B(() => {
		if (!me.open || !me.q) {
			ve([]);
			return;
		}
		let e = !0, n = setTimeout(() => {
			r.call("xlsx.find", t, me.q, ge).then((t) => e && ve(t), () => {});
		}, 150);
		return () => {
			e = !1, clearTimeout(n);
		};
	}, [
		r,
		t,
		me.open,
		me.q,
		me.tick,
		ge,
		x
	]);
	let Un = (e) => {
		let t = k[e];
		t && (he((t) => ({
			...t,
			idx: e
		})), gt({
			ar: t.r,
			ac: t.c,
			fr: t.r,
			fc: t.c
		}), Y(t.r, t.c));
	}, Wn = me.open ? k : [], Gn = (e) => {
		let t = $t.current;
		if (t) {
			let { r: n, c: r } = Z(e.clientX, e.clientY, e.currentTarget);
			An(t.ar, t.ac, n, r, t.axis);
			return;
		}
		let n = se.current;
		if (n) {
			let { r: t, c: r } = Z(e.clientX, e.clientY, e.currentTarget);
			t >= 0 && r >= 0 && (n.to?.r !== t || n.to?.c !== r) && (n.to = {
				r: t,
				c: r
			}, le({
				r: t,
				c: r
			}));
			return;
		}
		if (!C.current) return;
		let { r, c: i } = Z(e.clientX, e.clientY, e.currentTarget);
		r >= 0 && i >= 0 && (r !== m.fr || i !== m.fc) && h((e) => ({
			...e,
			fr: r,
			fc: i,
			whole: void 0
		}));
	}, Kn = i && It ? St(i.r, i.c) : null, qn = i ? i.value : Dt(v, m.ar, m.ac), Jn = (e) => {
		if (!i || e.nativeEvent.isComposing || e.keyCode === 229) return;
		let t = e.metaKey || e.ctrlKey;
		if (t && e.key.toLowerCase() === "s" && !e.altKey) {
			e.preventDefault(), At(), pe.current.then(() => c.save());
			return;
		}
		if (Wt.length) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				let t = Wt.length;
				D((n) => (Math.min(n, t - 1) + (e.key === "ArrowDown" ? 1 : t - 1)) % t);
				return;
			}
			if (e.key === "Tab" || e.key === "Enter" && !e.altKey && !e.shiftKey && !t) {
				e.preventDefault(), tn(Wt[Math.min(te, Wt.length - 1)]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				let t = Ut?.s;
				a((e) => e && {
					...e,
					noSuggest: t
				});
				return;
			}
		}
		let n = cc[e.key];
		if (n && !t && !e.altKey && i.mode === "enter") {
			if (zt) {
				e.preventDefault(), en(n[0], n[1], e.shiftKey);
				return;
			}
			if (Lt && !e.shiftKey) {
				e.preventDefault(), O.current = null, At(n);
				return;
			}
		}
		if ((e.key === "Home" || e.key === "End") && !t && !e.altKey) {
			e.preventDefault();
			let t = e.currentTarget, n = t.value.length;
			e.key === "Home" ? t.setSelectionRange(0, e.shiftKey ? t.selectionEnd ?? 0 : 0, e.shiftKey ? "backward" : "none") : t.setSelectionRange(e.shiftKey ? t.selectionStart ?? n : n, n), Jt(t);
		} else if (e.key === "F2") e.preventDefault(), a((e) => e && {
			...e,
			mode: e.mode === "enter" ? "edit" : "enter"
		});
		else if (e.key === "F4") e.preventDefault(), Pt();
		else if (e.key === "Enter" && t && !e.altKey) e.preventDefault(), Mt();
		else if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
			e.preventDefault();
			let t = e.currentTarget;
			t.ownerDocument.execCommand?.("insertText", !1, "\n") || (t.setRangeText("\n", t.selectionStart, t.selectionEnd, "end"), Xt(t));
		} else e.key === "Enter" ? (e.preventDefault(), At(dn(!1, i.c))) : e.key === "Tab" ? (e.preventDefault(), At(ln(e.shiftKey, i.c))) : e.key === "Escape" && (e.preventDefault(), jt());
	}, Yn = null;
	if (i && (Wt.length || Gt)) {
		let e = Gt && Rt?.call ? it(Gt, Rt.call.arg) : -1;
		Yn = Wt.length ? /* @__PURE__ */ W("div", {
			className: "de-fassist",
			role: "listbox",
			onMouseDown: (e) => e.preventDefault(),
			children: Wt.map((e, t) => {
				let n = t === Math.min(te, Wt.length - 1);
				return /* @__PURE__ */ G("div", {
					role: "option",
					"aria-selected": n,
					className: n ? "de-fsug on" : "de-fsug",
					onMouseEnter: () => D(t),
					onClick: () => tn(e),
					children: [
						/* @__PURE__ */ W("span", {
							className: "de-fsug-name",
							children: e.name
						}),
						/* @__PURE__ */ G("span", {
							className: "de-fsug-args",
							children: [
								"(",
								[...e.args, ...e.variadic ? ["..."] : []].join(", "),
								")"
							]
						}),
						n && /* @__PURE__ */ W("div", {
							className: "de-fsug-desc",
							children: e.desc
						})
					]
				}, e.name);
			})
		}) : /* @__PURE__ */ G("div", {
			className: "de-fassist de-fhint",
			onMouseDown: (e) => e.preventDefault(),
			children: [/* @__PURE__ */ G("div", { children: [
				Gt.name,
				"(",
				[...Gt.args, ...Gt.variadic ? ["..."] : []].map((t, n, r) => /* @__PURE__ */ G("span", { children: [n === e ? /* @__PURE__ */ W("b", { children: t }) : t, n < r.length - 1 ? ", " : ""] }, n)),
				")"
			] }), /* @__PURE__ */ W("div", {
				className: "de-fsug-desc",
				children: Gt.desc
			})]
		});
	}
	let Xn = i && Kn ? {
		left: Kn.x - 1,
		top: Kn.y - 1,
		minWidth: Kn.w + 2,
		width: Math.max(Kn.w + 2, Math.min(480, i.value.length * 8 + 16)),
		height: Math.max(Kn.h + 2, i.value.split("\n").length * 18 + 4),
		...n.baseFont
	} : void 0, Zn = [];
	if (i && Vt.length) {
		let e = 0;
		for (let t of Vt) t.s > e && Zn.push(i.value.slice(e, t.s)), Zn.push(/* @__PURE__ */ W("span", {
			style: { color: t.color },
			children: i.value.slice(t.s, t.e)
		}, t.s)), e = t.e;
		Zn.push(i.value.slice(e) + "​");
	}
	let Qn = !!i && Lt && !!Xn, $n = (() => {
		if (!Xn || !Yn) return;
		let e = Xn.top + Xn.height + 2;
		return e + 200 > f.h && Xn.top > 200 ? {
			left: Xn.left,
			bottom: f.h - Xn.top + 2
		} : {
			left: Xn.left,
			top: e
		};
	})();
	return /* @__PURE__ */ G(We, { children: [
		/* @__PURE__ */ G("div", {
			className: "de-fx",
			children: [
				/* @__PURE__ */ G("div", {
					className: "de-fx-ref",
					children: [
						b(m.ac),
						m.ar + 1,
						!ct && `:${b(K.c1)}${K.r1 + 1}`
					]
				}),
				l ? /* @__PURE__ */ W("textarea", {
					ref: T,
					className: "de-fx-val de-fx-input",
					value: qn,
					rows: 1,
					wrap: "off",
					spellCheck: !1,
					"aria-label": "Cell content",
					onFocus: () => !i && void Ot(void 0, !0),
					onChange: (e) => Xt(e.target),
					onSelect: (e) => Jt(e.currentTarget),
					onKeyDown: Jn,
					onScroll: (e) => {
						let t = e.currentTarget, n = parseFloat(getComputedStyle(t).lineHeight) || t.clientHeight, r = Math.round(t.scrollTop / n) * n;
						Math.abs(r - t.scrollTop) >= 1 && (t.scrollTop = r);
					},
					onBlur: (e) => {
						o.current || (e.currentTarget.scrollTop = 0, i && (i.bar || !It) && At());
					}
				}) : /* @__PURE__ */ W("div", {
					className: "de-fx-val",
					title: qn,
					children: qn
				}),
				i && !Lt && Yn && /* @__PURE__ */ W("div", {
					className: "de-fassist-at",
					style: {
						left: 88,
						top: 30
					},
					children: Yn
				})
			]
		}),
		/* @__PURE__ */ W("div", {
			ref: d,
			className: "de-grid",
			tabIndex: 0,
			onKeyDown: wn,
			onCopy: (e) => {
				i || Cn(e, !1);
			},
			onCut: (e) => {
				!i && l && Cn(e, !0);
			},
			onFocus: (e) => {
				e.target === e.currentTarget && l && !i && w.current?.focus({ preventScroll: !0 });
			},
			onPaste: (e) => {
				if (i || !l) return;
				e.preventDefault();
				let t = e.clipboardData.getData("text/html");
				Vn(e.clipboardData.getData("text/plain") || (t ? ws(t) : ""));
			},
			children: /* @__PURE__ */ W("div", {
				style: {
					position: "relative",
					width: Math.max(Fe, f.w),
					height: Math.max(z, f.h)
				},
				children: /* @__PURE__ */ G("div", {
					className: "de-grid-view",
					style: {
						width: f.w,
						height: f.h,
						...n.baseFont
					},
					onMouseDown: kn,
					onMouseMove: Gn,
					onContextMenu: (e) => {
						if (!l) return;
						e.preventDefault();
						let { r: t, c: n } = Z(e.clientX, e.clientY, e.currentTarget);
						t >= 0 && n >= 0 && (t < K.r0 || t > K.r1 || n < K.c0 || n > K.c1) && gt({
							ar: t,
							ac: n,
							fr: t,
							fc: n
						}), re({
							x: e.clientX,
							y: e.clientY
						});
					},
					onDoubleClick: (e) => {
						if (i) return;
						let t = e.target.closest("[data-grip-col],[data-grip-row]");
						t ? On(t) : Ot();
					},
					children: [
						_t("main", Je, Ye, $e, et, He, Ue, I + bt, Vs + xt, Ge, Ke),
						yt > 0 && _t("top", 0, yt - 1, $e, et, He, 0, I + bt, Vs, Ge, xt),
						J > 0 && _t("left", Je, Ye, 0, J - 1, 0, Ue, I, Vs + xt, bt, Ke),
						yt > 0 && J > 0 && _t("tl", 0, yt - 1, 0, J - 1, 0, 0, I, Vs, bt, xt),
						q("ch", $e, et, He, I + bt, Ge),
						J > 0 && q("chf", 0, J - 1, 0, I, bt),
						vt("rh", Je, Ye, Ue, Vs + xt, Ke),
						yt > 0 && vt("rhf", 0, yt - 1, 0, Vs, xt),
						yt > 0 && /* @__PURE__ */ W("div", {
							className: "de-freeze-h",
							style: {
								left: 0,
								top: Vs + xt - 1,
								width: f.w,
								height: 2
							}
						}),
						J > 0 && /* @__PURE__ */ W("div", {
							className: "de-freeze-v",
							style: {
								left: I + bt - 1,
								top: 0,
								width: 2,
								height: f.h
							}
						}),
						/* @__PURE__ */ W("div", {
							className: "de-corner",
							style: {
								width: I,
								height: Vs
							}
						}),
						i && Lt && Xn && Zn.length > 0 && /* @__PURE__ */ W("div", {
							ref: ee,
							className: "de-cell-edit de-cell-hl",
							style: Xn,
							"aria-hidden": !0,
							children: Zn
						}),
						l && /* @__PURE__ */ W("textarea", {
							ref: w,
							className: Qn ? Zn.length ? "de-cell-edit de-cell-edit-fx" : "de-cell-edit" : "de-cell-sink",
							spellCheck: !1,
							autoComplete: "off",
							autoCapitalize: "off",
							"aria-label": "Cell",
							inputMode: i ? void 0 : "none",
							value: Qn ? i.value : "",
							style: Qn ? Xn : dc,
							onMouseDown: (e) => e.stopPropagation(),
							onChange: (e) => i ? Xt(e.target) : Nt(e.target),
							onSelect: (e) => Jt(e.currentTarget),
							onScroll: (e) => {
								ee.current && (ee.current.scrollTop = e.currentTarget.scrollTop);
							},
							onKeyDown: Jn,
							onBlur: (e) => {
								if (i && Lt && !o.current) {
									if (e.relatedTarget && e.relatedTarget === T.current) return a((e) => e && {
										...e,
										bar: !0,
										sync: 0
									});
									At();
								}
							}
						}),
						Qn && Yn && $n && /* @__PURE__ */ W("div", {
							className: "de-fassist-at",
							style: $n,
							children: Yn
						})
					]
				})
			})
		}),
		l && /* @__PURE__ */ W(us, {
			css: gn,
			base: n.baseFont,
			format: n.formats[Tt(m.ar, m.ac)] ?? "General",
			merged: Mn,
			frozen: !!(u.frozen.rows || u.frozen.cols),
			gridlines: u.gridLines,
			painter: ie !== null,
			onToggle: yn,
			onFormat: _n,
			onUndo: bn,
			onRedo: xn,
			onPaint: () => {
				ae((e) => e === null ? Tt(m.ar, m.ac) : null), Ct();
			},
			onMerge: Pn,
			onFreeze: Fn,
			onGridlines: () => void jn({
				op: "gridlines",
				show: !u.gridLines
			}),
			onFunc: (e) => e ? In(e) : void Ot("="),
			onSort: Ln,
			onRows: Rn,
			onFind: () => he((e) => ({
				...e,
				open: !0,
				tick: e.tick + 1
			}))
		}),
		me.open && /* @__PURE__ */ W(ri, {
			query: me.q,
			index: me.idx,
			count: k.length,
			editable: l,
			replace: me.replace,
			placeholder: "Find in sheet",
			onQuery: (e) => he((t) => ({
				...t,
				q: e,
				idx: 0
			})),
			onNav: (e) => k.length && Un((me.idx + e + k.length) % k.length),
			onClose: () => {
				he((e) => ({
					...e,
					open: !1
				})), Ct();
			},
			onReplace: (e, n) => {
				let i = k[Math.min(me.idx, k.length - 1)];
				i && Et(r.call("xlsx.replace", t, me.q, e, ge, n ? void 0 : {
					r: i.r,
					c: i.c
				}));
			},
			options: /* @__PURE__ */ W(We, { children: [
				["matchCase", "Match case"],
				["whole", "Entire cell"],
				["formulas", "In formulas"]
			].map(([e, t]) => /* @__PURE__ */ G("label", {
				className: "de-find-opt",
				children: [/* @__PURE__ */ W("input", {
					type: "checkbox",
					checked: !!ge[e],
					onChange: (t) => _e((n) => ({
						...n,
						[e]: t.target.checked
					}))
				}), t]
			}, e)) })
		}),
		A && /* @__PURE__ */ W(un, {
			text: A,
			onDone: () => ye(null)
		}),
		ne && /* @__PURE__ */ W(sn, {
			x: ne.x,
			y: ne.y,
			items: Hn(),
			onClose: () => re(null)
		})
	] });
}
// src/collab/react.tsx
var pc = /* @__PURE__ */ new WeakMap(), mc = 0;
function hc(e) {
	if (!e) return "";
	let t;
	if (typeof e.transport == "string") t = e.transport;
	else {
		let n = pc.get(e.transport);
		n === void 0 && pc.set(e.transport, n = ++mc), t = `#${n}`;
	}
	return `${t}|${e.room}|${e.base ?? 0}|${e.user.id ?? ""}|${e.user.name}|${e.user.color ?? ""}`;
}
function gc(e, t) {
	let [n, r] = H({
		collab: null,
		status: null
	}), i = hc(t), a = V(t);
	return a.current = t, B(() => {
		let t = a.current;
		if (!e || !t) {
			r({
				collab: null,
				status: null
			});
			return;
		}
		let n;
		try {
			n = we(e, t);
		} catch (e) {
			r({
				collab: null,
				status: "error",
				error: e.message
			});
			return;
		}
		let i = () => r({
			collab: n,
			status: n.status,
			error: n.session.error
		});
		i();
		let o = [n.on("status", i), n.on("error", i)];
		return () => {
			o.forEach((e) => e()), n.close();
		};
	}, [e, i]), n;
}
var _c = (e) => e.split(/\s+/).filter(Boolean).slice(0, 2).map((e) => e[0].toUpperCase()).join("") || "?", vc = {
	connecting: "Connecting…",
	syncing: "Syncing…",
	live: "Live",
	offline: "Offline · changes will sync",
	error: "Not synced"
};
function yc({ client: e, state: t }) {
	let n = U((t) => ue(e, t), () => de(e)), [r, i] = H(0);
	if (B(() => {
		let e = t.collab?.session;
		if (!e) return;
		let n = setInterval(() => i(e.pending), 500);
		return () => clearInterval(n);
	}, [t.collab]), !t.status) return null;
	let a = t.status === "error" ? t.error ?? "Collaboration stopped" : t.status === "live" && r ? `Saving ${r} change${r > 1 ? "s" : ""}…` : vc[t.status];
	return /* @__PURE__ */ G("span", {
		className: "de-collab",
		children: [/* @__PURE__ */ G("span", {
			className: `de-collab-status de-collab-${t.status}`,
			title: a,
			children: [/* @__PURE__ */ W("span", { className: "de-collab-dot" }), /* @__PURE__ */ W("span", {
				className: "de-collab-label",
				children: t.status === "live" ? n.length ? `${n.length + 1} editing` : "Live" : vc[t.status]
			})]
		}), n.length > 0 && /* @__PURE__ */ G("span", {
			className: "de-peers",
			children: [n.slice(0, 5).map((e) => /* @__PURE__ */ W("span", {
				className: "de-peer",
				style: { background: F(e.color) },
				title: e.name,
				children: _c(e.name)
			}, e.site)), n.length > 5 && /* @__PURE__ */ G("span", {
				className: "de-peer de-peer-more",
				title: n.slice(5).map((e) => e.name).join(", "),
				children: ["+", n.length - 5]
			})]
		})]
	});
}
function bc({ client: e, collab: t }) {
	let n = V(null), r = U((t) => ue(e, t), () => de(e)), [i, a] = H([]), o = Ve(() => r.filter((e) => e.presence && e.presence.k !== "xlsx"), [r]);
	return B(() => {
		let r = n.current, i = r?.parentElement;
		if (!r || !i || !o.length) {
			a([]);
			return;
		}
		let s = 0, c = () => {
			s = 0;
			let n = r.getBoundingClientRect(), c = (e) => ({
				x: e.left - n.left,
				y: e.top - n.top,
				w: e.width,
				h: e.height
			}), l = [];
			for (let r of o) {
				let a = xc(r, i, t, e);
				a && l.push({
					key: String(r.site),
					color: r.color,
					name: r.name,
					caret: a.caret ? {
						x: a.caret.left - n.left,
						y: a.caret.top - n.top,
						h: a.caret.height || 16
					} : void 0,
					boxes: a.sel.map(c),
					outline: a.outline ? c(a.outline) : void 0
				});
			}
			a(l);
		}, l = () => {
			s ||= requestAnimationFrame(c);
		};
		l(), i.addEventListener("scroll", l, !0), window.addEventListener("resize", l);
		let u = t?.on("change", l), d = setInterval(l, 400);
		return () => {
			cancelAnimationFrame(s), i.removeEventListener("scroll", l, !0), window.removeEventListener("resize", l), u?.(), clearInterval(d);
		};
	}, [
		o,
		t,
		e
	]), /* @__PURE__ */ W("div", {
		ref: n,
		className: "de-peer-layer",
		"aria-hidden": !0,
		children: i.map((e) => /* @__PURE__ */ G("div", {
			style: { "--peer": F(e.color) },
			children: [
				e.boxes.map((e, t) => /* @__PURE__ */ W("div", {
					className: "de-peer-sel",
					style: {
						left: e.x,
						top: e.y,
						width: e.w,
						height: e.h
					}
				}, t)),
				e.outline && /* @__PURE__ */ W("div", {
					className: "de-peer-outline",
					style: {
						left: e.outline.x - 3,
						top: e.outline.y - 3,
						width: e.outline.w + 6,
						height: e.outline.h + 6
					},
					children: /* @__PURE__ */ W("span", {
						className: "de-peer-flag",
						children: e.name
					})
				}),
				e.caret && /* @__PURE__ */ W("div", {
					className: "de-peer-caret",
					style: {
						left: e.caret.x,
						top: e.caret.y,
						height: e.caret.h
					},
					children: /* @__PURE__ */ W("span", {
						className: "de-peer-flag",
						children: e.name
					})
				})
			]
		}, e.key))
	});
}
function xc(e, t, n, r) {
	let i = e.presence;
	if (i.k === "docx") {
		let r = n?.rects(t, e);
		return r ? {
			caret: r.caret,
			sel: r.sel
		} : null;
	}
	if (i.k === "pptx" && i.slide) {
		let e = r.info.pptx?.slides.findIndex((e) => e.path === i.slide) ?? -1, n = e >= 0 ? t.querySelector(`[data-slide="${e + 1}"]`) : null;
		return n ? {
			sel: [],
			outline: ((i.top === void 0 ? null : n.querySelector(`[data-top="${i.top}"]`)) ?? n).getBoundingClientRect()
		} : null;
	}
	return null;
}
// src/react/DocViewer.tsx
var Sc = {
	docx: ".docx",
	xlsx: ".xlsx",
	pptx: ".pptx"
}, Cc = {
	pages: "Apple Pages document",
	keynote: "Apple Keynote presentation",
	numbers: "Apple Numbers spreadsheet",
	visio: "Microsoft Visio drawing"
}, wc = {
	doc: "Word 97-2003 document",
	xls: "Excel 97-2003 workbook",
	ppt: "PowerPoint 97-2003 presentation",
	rtf: "Rich Text Format document",
	odt: "OpenDocument text",
	ods: "OpenDocument spreadsheet",
	odp: "OpenDocument presentation"
}, Tc = {
	csv: "csv",
	tsv: "tsv",
	text: "txt",
	markdown: "md",
	html: "html",
	svg: "svg",
	mermaid: "mmd",
	plantuml: "puml",
	graphviz: "dot"
}, Ec = {
	csv: "CSV file",
	tsv: "Tab-separated values",
	text: "Plain text",
	markdown: "Markdown",
	html: "HTML page",
	svg: "SVG picture",
	mermaid: "Mermaid diagram",
	plantuml: "PlantUML diagram",
	graphviz: "Graphviz diagram"
}, Dc = /* @__PURE__ */ new Set([
	"markdown",
	"html",
	"svg"
]), Oc = {
	docx: "Untitled document",
	xlsx: "Untitled spreadsheet",
	pptx: "Untitled presentation"
}, kc = /* @__PURE__ */ new WeakMap(), Ac = 0, jc = (e) => {
	let t = kc.get(e);
	return t === void 0 && kc.set(e, t = ++Ac), t;
};
function Mc(e) {
	return e < 1024 ? `${e} B` : e < 1048576 ? `${(e / 1024).toFixed(0)} KB` : `${(e / 1024 / 1024).toFixed(1)} MB`;
}
function Nc(e) {
	let { src: t, name: r, className: i, style: a, toolbar: o = !0, toolbarExtra: s, zoom: c, thumbnails: l, headers: u, credentials: f, worker: p, styleTarget: m, theme: h, onLoad: _, onError: y } = e, b = qa(h, a), { allowEdit: x = !0, allowSave: S = !0, allowDownload: w = !0, fileMenu: ee = !0, allowOpen: T = !0, captureSelectAll: te = !0, onSave: E, onDirtyChange: D } = e, [ie, oe] = H(!!e.editable);
	B(() => {
		e.editable !== void 0 && oe(!!e.editable);
	}, [e.editable]);
	let [se, ce] = H(!1), [le, O] = H(!1), [ue, de] = H(null), fe = e.injectStyles ?? !0;
	ze(() => {
		fe && Sa(m);
	}, [m, fe]);
	let [pe, me] = H(null), [he, ge] = H(null);
	B(() => {
		me(null), ge(null);
	}, [t]);
	let _e = pe ? pe.name : r, { client: k, error: ve, loading: A, progress: ye } = Qo(pe ? pe.src : t, {
		name: _e,
		headers: u,
		credentials: f,
		worker: p
	}, !!pe?.live), j = Ve(() => ({
		live: !0,
		saving: !1,
		revision: 0
	}), [
		k,
		t,
		pe
	]);
	B(() => (j.live = !0, O(!1), () => {
		j.live = !1;
	}), [j]);
	let be = he ?? _e, xe = gc(k, e.collab), Se = k?.info?.imported, Ce = Se === "svg", we = !!k?.info?.from || Ce, M = !we && (!e.collab || xe.status === "live" || xe.status === "offline"), [N, P] = H(null), Te = !!Se && g.has(Se), [Ee, De] = H(!1), F = Ee && Te, Oe = Se && Dc.has(Se) ? Se : null, I = Oe === "markdown" || Oe === "html", ke = V(null), Ae = V(null), [je, L] = H(null), R = V(!1), Me = V(void 0);
	B(() => () => clearTimeout(Me.current), []), B(() => {
		pe?.live || (clearTimeout(Me.current), L(null), R.current = !1, ke.current = null);
	}, [t, pe]), B(() => {
		if (!k || !F) return;
		let e = I && ke.current === "doc";
		if (je !== null && !e) return;
		let t = !0, n = Ae.current;
		return (e && n ? Promise.resolve(je ?? k.call("plain.source")).then((e) => n.text(Oe === "html" ? "html" : "md", e ?? void 0)).catch(() => null) : Promise.resolve(null)).then(async (e) => typeof e == "string" ? e : await k.call("plain.source")).then((n) => {
			t && (e && (ke.current = null), L(n ?? ""));
		}, () => {}), () => {
			t = !1;
		};
	}, [
		k,
		F,
		je,
		I,
		Oe
	]);
	let [Ne, Pe] = lt(), Fe = V(null), z = Pe.w > 0 && Pe.w < 720, [Le, Re] = H(.45), Be = V(null);
	B(() => {
		let e = Be.current;
		if (e === null || !k) return;
		Be.current = null;
		let t = 0, n = 0, r = -1, i = () => {
			let a = Fe.current?.querySelector(".de-scroll");
			if (a && a.scrollHeight > a.clientHeight + 1) {
				if (a.scrollTop = e * (a.scrollHeight - a.clientHeight), a.scrollHeight === r) return;
				r = a.scrollHeight;
			}
			++n < 40 && (t = requestAnimationFrame(i));
		};
		return t = requestAnimationFrame(i), () => cancelAnimationFrame(t);
	}, [k]);
	let He = e.comments !== !1 && !Ce, U = Ve(() => k && He ? new kr(k) : null, [k, He]);
	B(() => () => U?.dispose(), [U]);
	let Ue = e.comments || {};
	U && (U.opts = Ue, U.me = Ue.user ?? e.collab?.user ?? { name: "Me" }, U.canComment = !we && (Ue.canComment ?? (ie && M)));
	let We = Pr(U), Ge = !!Ue.open;
	B(() => {
		U && Ge && U.toggle(!0);
	}, [U]);
	let Ke = U ? U.visible().length : 0, qe = Ue.focus, Je = V(null);
	B(() => {
		if (!U || !qe || Je.current === qe || !U.loaded) return;
		let e = U.list.get(qe)?.parent ?? qe;
		U.threads().some((t) => t.root.id === e) && (Je.current = qe, U.toggle(!0), U.list.get(e)?.done && U.setShowResolved(!0), U.select(e));
	}, [
		U,
		qe,
		We.rev
	]);
	let Ye = V(_);
	Ye.current = _, B(() => {
		k && Ye.current?.(k);
	}, [k]), B(() => {
		ve && y?.(ve);
	}, [ve, y]);
	let Xe = V(!1);
	B(() => {
		let e = !!k && Xe.current;
		ce((t) => (t !== e && D?.(e), e)), k && (Xe.current = !1);
	}, [k]);
	let Ze = Ie((e) => {
		j.live && (e && j.revision++, ce((t) => (t !== e && D?.(e), e)));
	}, [D, j]), Qe = (he ?? (k?.name || be || "document")).replace(/\.[^.]+$/, ""), $e = k ? k.info?.ext ? `.${k.info.ext}` : Sc[k.kind] : "", et = Qe + $e, tt = Oe ? `.${ae[Oe].ext}` : $e, nt = Qe + tt, rt = Ie(async () => {
		if (!k) return "";
		if (I && ke.current === "doc" && Ae.current) {
			let e = await Ae.current.text(Oe === "html" ? "html" : "md", je ?? await k.call("plain.source") ?? void 0);
			return ke.current = null, L(e), e;
		}
		return je ?? await k.call("plain.source") ?? "";
	}, [
		k,
		I,
		Oe,
		je
	]), it = S && (!!E || w), at = Ie(async (e = !1) => {
		if (k && j.live && !j.saving && (e ? w : it)) {
			j.saving = !0, O(!0);
			try {
				if (await Ae.current?.flush?.(), !j.live) return;
				let t = j.revision, n = !e && Oe ? new Blob([await rt()], { type: `${ae[Oe].mime};charset=utf-8` }) : await k.call("save");
				if (!j.live) return;
				!e && E ? await E(n, nt) : Ht(n, e ? et : nt), !j.live || j.revision !== t || e && E || Ze(!1);
			} catch (e) {
				if (!j.live) return;
				y?.(e), console.error("[office-engine] save failed", e), q(e.message);
			} finally {
				j.saving = !1, j.live && O(!1);
			}
		}
	}, [
		k,
		j,
		it,
		w,
		E,
		et,
		nt,
		Oe,
		rt,
		Ze,
		y
	]), ot = Ie(() => at(), [at]), st = Ie((e) => {
		e && (ke.current = "doc"), Ze(e);
	}, [Ze]), K = V(null), ct = ie && M && !F, ut = Ve(() => ({
		bar: ue,
		editable: ct,
		setDirty: st,
		save: ot,
		canDownload: w,
		client: k,
		fileOps: Ae,
		selectAll: K
	}), [
		ue,
		ct,
		st,
		ot,
		w,
		k
	]), dt = (e) => {
		L(e), R.current || Ze(!0), R.current = !0, ke.current = "source", clearTimeout(Me.current);
		let t = Se;
		t && (Me.current = setTimeout(() => {
			let n = Fe.current?.querySelector(".de-scroll");
			Be.current = n && n.scrollHeight > n.clientHeight ? n.scrollTop / (n.scrollHeight - n.clientHeight) : null;
			let r = k?.name || _e || `document.${ae[t].ext}`;
			ne[v(re(r) ?? r)] !== t && (r += `.${ae[t].ext}`), Xe.current = !0, me({
				src: new Blob([e], { type: ae[t].mime }),
				name: r,
				converted: !0,
				live: !0
			});
		}, 350));
	}, ft = () => `${(he ?? k?.name ?? be ?? "document").replace(/\.[^.]+$/, "")}.${ae[Se ?? "text"].ext}`, mt = (e) => {
		let t = Ne.current;
		if (!t) return;
		e.preventDefault();
		let n = e.currentTarget;
		n.setPointerCapture(e.pointerId);
		let r = t.getBoundingClientRect(), i = (e) => Re(Math.min(.85, Math.max(.15, z ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width))), a = () => {
			n.removeEventListener("pointermove", i), n.removeEventListener("pointerup", a), n.removeEventListener("pointercancel", a);
		};
		n.addEventListener("pointermove", i), n.addEventListener("pointerup", a), n.addEventListener("pointercancel", a);
	}, ht = V(null);
	B(() => {
		let e = ht.current;
		if (!te || !e) return;
		let t = (t) => {
			if (t.defaultPrevented || !(t.metaKey || t.ctrlKey) || t.altKey || t.shiftKey || t.key.toLowerCase() !== "a") return;
			let n = t.composedPath()[0] ?? t.target;
			n && e.contains(n) || pt(n) || !K.current || (t.preventDefault(), K.current());
		}, n = e.ownerDocument;
		return n.addEventListener("keydown", t), () => n.removeEventListener("keydown", t);
	}, [te]);
	let gt = V(U);
	gt.current = U, B(() => {
		let e = ht.current;
		if (!e) return;
		let t = (t) => {
			let n = gt.current;
			if (t.defaultPrevented || !(t.metaKey || t.ctrlKey) || !t.altKey || t.shiftKey || t.code !== "KeyM" || !n?.canComment) return;
			let r = t.composedPath()[0] ?? t.target, i = e.ownerDocument;
			(r && e.contains(r) || r === i.body || r === i.documentElement) && (t.preventDefault(), n.start());
		}, n = e.ownerDocument;
		return n.addEventListener("keydown", t), () => n.removeEventListener("keydown", t);
	}, []);
	let [_t, q] = H(null), vt = Ie(() => q(null), []);
	B(() => k?.on("warning", (e) => q(e.text)), [k]);
	let [bt, xt] = H(null), [St, Y] = H(!1), [X, Z] = H(!1), Ct = (e, t) => se ? xt({
		message: e,
		run: t
	}) : t(), wt = Ie((e, t = !1) => {
		Xe.current = !!e.live, ge(null), me(e), t && oe(!0);
	}, []), Tt = ee && T && !e.collab, Et = Ba({
		kind: k?.kind,
		ext: $e,
		base: Qe,
		canOpen: Tt,
		canImport: ee && x && M,
		canSave: ee && it,
		canDownload: ee && w && !!k,
		ops: Ae,
		create: (e) => Ct(`A new ${Oc[e].split(" ")[1]} replaces the current document. Your changes are not saved.`, () => {
			(e === "docx" ? n([]) : e === "xlsx" ? C([], "Sheet1") : d()).then((t) => wt({
				src: t,
				name: Oc[e] + Sc[e],
				converted: !1
			}, x), (e) => q(e.message));
		}),
		open: (e) => Ct(`Opening “${e.name}” replaces the current document. Your changes are not saved.`, () => {
			ya(e).then(wt, (e) => q(e.message));
		}),
		save: ot,
		downloadOriginal: () => at(!0),
		picture: Ce ? {
			label: "SVG picture",
			ext: ".svg",
			download: async () => Ht(new Blob([await rt()], { type: "image/svg+xml" }), nt)
		} : void 0,
		rename: () => Y(!0),
		details: () => Z(!0),
		close: e.onClose,
		extra: e.fileMenuItems ?? [],
		notify: q
	}), Dt = (e) => {
		if (e.defaultPrevented || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
		let t = e.key.toLowerCase();
		if (t === "s" && e.target.closest?.(".de-src")) e.preventDefault(), ot();
		else if (t === "a") {
			if (pt(e.target) || !K.current) return;
			e.preventDefault(), K.current();
		} else if (ee) t === "p" ? (e.preventDefault(), w && Et.run("print")) : t === "o" && Tt && (e.preventDefault(), Et.run("open"));
		else return;
	}, Ot = ye && ye.total > 0 ? Math.min(100, ye.loaded / ye.total * 100) : 0, kt = A || !!ye && Ot < 100, At = he ?? k?.name ?? be ?? (typeof t == "string" ? decodeURIComponent(t.split(/[?#]/)[0].split("/").pop() ?? "") : t?.name) ?? "", jt;
	return jt = ve ? /* @__PURE__ */ W("div", {
		className: "de-center",
		children: /* @__PURE__ */ G("div", {
			className: "de-error",
			role: "alert",
			children: [/* @__PURE__ */ W("strong", { children: "Cannot open document." }), /* @__PURE__ */ W("div", { children: ve.message })]
		})
	}) : k ? Ce ? /* @__PURE__ */ W(no, { client: k }, jc(k)) : k.kind === "docx" ? /* @__PURE__ */ W(fa, {
		client: k,
		initialZoom: c
	}, jc(k)) : k.kind === "xlsx" ? /* @__PURE__ */ W(Zs, { client: k }) : /* @__PURE__ */ W(Zo, {
		client: k,
		initialZoom: c,
		thumbnails: l
	}) : t || pe ? /* @__PURE__ */ G("div", {
		className: "de-center",
		children: [/* @__PURE__ */ W("div", { className: "de-spinner" }), /* @__PURE__ */ W("div", { children: ye?.phase === "download" && ye.total ? `Downloading… ${Mc(ye.loaded)} / ${Mc(ye.total)}` : "Opening…" })]
	}) : /* @__PURE__ */ W("div", {
		className: "de-center",
		children: "No document"
	}), /* @__PURE__ */ W(yt, {
		icons: e.icons,
		children: /* @__PURE__ */ G("div", {
			ref: ht,
			className: b.className + (i ? ` ${i}` : ""),
			style: b.style,
			onKeyDown: Dt,
			children: [
				o && /* @__PURE__ */ G("div", {
					className: "de-bar",
					children: [
						k && /* @__PURE__ */ W("span", {
							className: `de-badge de-badge-${k.kind}`,
							children: k.info?.from ?? k.info?.converted ?? (k.info?.imported ? Tc[k.info.imported] : k.kind)
						}),
						ee && /* @__PURE__ */ W(Va, { actions: Et }),
						/* @__PURE__ */ W("span", {
							className: "de-title",
							title: At,
							children: At
						}),
						/* @__PURE__ */ W("span", {
							className: "de-status",
							ref: P,
							hidden: !k
						}),
						k && k.size > 0 && /* @__PURE__ */ W("span", {
							className: "de-status",
							children: Mc(k.size)
						}),
						k && e.collab && /* @__PURE__ */ W(yc, {
							client: k,
							state: xe
						}),
						s,
						k && Te && /* @__PURE__ */ G("button", {
							type: "button",
							className: "de-mode" + (F ? " de-mode-on" : ""),
							onClick: () => De((e) => !e),
							"aria-pressed": F,
							title: F ? "Hide the source" : "Edit the source side by side with the document",
							"data-testid": "de-code-toggle",
							children: [/* @__PURE__ */ W(J, {
								name: "code",
								size: 16
							}), "Code"]
						}),
						U && /* @__PURE__ */ G("button", {
							type: "button",
							className: "de-mode de-cm-toggle" + (We.open ? " de-mode-on" : ""),
							onClick: () => U.toggle(),
							title: U.canComment ? `Comments (${Ir} to comment on the selection)` : "Comments",
							"aria-pressed": We.open,
							"data-testid": "de-comments-toggle",
							children: [
								/* @__PURE__ */ W(J, {
									name: "comment",
									size: 16
								}),
								"Comments",
								Ke > 0 && /* @__PURE__ */ W("span", {
									className: "de-cm-n",
									children: Ke
								})
							]
						}),
						k && x && !we && !F && /* @__PURE__ */ G("button", {
							type: "button",
							className: ie ? "de-mode de-mode-on" : "de-mode",
							onClick: () => oe((e) => !e),
							title: ie ? "Switch to viewing" : "Edit document",
							children: [/* @__PURE__ */ W(J, {
								name: ie ? "view" : "edit",
								size: 16
							}), ie ? "View" : "Edit"]
						}),
						k && it && (ie && !we || se) && /* @__PURE__ */ G("button", {
							type: "button",
							className: se ? "de-mode de-save-dirty" : "de-mode",
							disabled: le,
							onClick: () => void ot(),
							title: "Save a copy (Ctrl+S)",
							children: [/* @__PURE__ */ W(J, {
								name: "save",
								size: 16
							}), le ? "Saving…" : se || E ? "Save" : "Download"]
						}),
						/* @__PURE__ */ W("div", {
							className: "de-progress",
							style: {
								width: `${kt ? Math.max(Ot, 3) : 100}%`,
								opacity: +!!kt
							}
						})
					]
				}),
				o && k && ct && /* @__PURE__ */ W("div", {
					className: "de-ebar-host",
					ref: de
				}),
				/* @__PURE__ */ G("div", {
					className: "de-body" + (F && z ? " de-body-stacked" : ""),
					ref: Ne,
					children: [
						F && /* @__PURE__ */ W("div", {
							className: "de-src-pane",
							style: z ? { height: `${Le * 100}%` } : { width: `${Le * 100}%` },
							children: je === null ? /* @__PURE__ */ W("div", {
								className: "de-center",
								children: /* @__PURE__ */ W("div", { className: "de-spinner" })
							}) : /* @__PURE__ */ W(to, {
								text: je,
								format: Se,
								onChange: dt,
								readOnly: !x || !!e.collab,
								notice: se && !R.current && !I ? "Changes made in the document are not in this source: editing it builds the document again from the source." : void 0,
								onCopy: () => navigator.clipboard?.writeText(je).then(() => q("Source copied"), () => q("Cannot copy here")),
								onDownload: w ? () => Ht(new Blob([je], { type: ae[Se].mime }), ft()) : void 0
							})
						}),
						F && /* @__PURE__ */ W("div", {
							className: "de-split-handle",
							role: "separator",
							"aria-orientation": z ? "horizontal" : "vertical",
							"aria-label": "Resize the source",
							"aria-valuenow": Math.round(Le * 100),
							"aria-valuemin": 15,
							"aria-valuemax": 85,
							tabIndex: 0,
							onPointerDown: mt,
							onKeyDown: (e) => {
								let t = e.key === (z ? "ArrowUp" : "ArrowLeft") ? -.05 : e.key === (z ? "ArrowDown" : "ArrowRight") ? .05 : 0;
								t && (e.preventDefault(), Re((e) => Math.min(.85, Math.max(.15, e + t))));
							}
						}),
						/* @__PURE__ */ W("div", {
							className: "de-main",
							ref: Fe,
							children: /* @__PURE__ */ W(Jt.Provider, {
								value: ut,
								children: /* @__PURE__ */ W(Ar.Provider, {
									value: U,
									children: /* @__PURE__ */ W($t.Provider, {
										value: N,
										children: jt
									})
								})
							})
						}),
						k && xe.collab && /* @__PURE__ */ W(bc, {
							client: k,
							collab: xe.collab
						}),
						U && We.open && /* @__PURE__ */ W(Kr, { ctl: U })
					]
				}),
				_t && /* @__PURE__ */ W(un, {
					text: _t,
					onDone: vt
				}),
				bt && /* @__PURE__ */ W(ln, {
					title: "Discard unsaved changes?",
					message: bt.message,
					ok: "Continue",
					onOk: bt.run,
					onClose: () => xt(null)
				}),
				St && k && /* @__PURE__ */ W(cn, {
					spec: {
						title: "Rename",
						label: "File name",
						initial: Qe,
						ok: "Rename",
						onOk: (t) => {
							let n = t.trim().replace(/[\\/:*?"<>|]+/g, " ").replace(RegExp(`(\\${$e}|\\${tt})$`, "i"), "");
							n && (ge(n + $e), e.onRename?.(n + tt));
						}
					},
					onClose: () => Y(!1)
				}),
				X && k && /* @__PURE__ */ W(ga, {
					client: k,
					file: [
						["Name", nt],
						["Type", k.info?.from ? `${Cc[k.info.from]} (view only)` : k.info?.converted ? `${wc[k.info.converted]}, opened as ${Ia[k.kind]}` : k.info?.imported ? `${Ec[k.info.imported]}, opened as ${Ia[k.kind]}` : Ia[k.kind]],
						...k.size > 0 ? [["File size", Mc(k.size)]] : [],
						...se ? [["Status", "Unsaved changes"]] : []
					],
					stats: Ae.current?.stats() ?? [],
					onClose: () => Z(!1)
				})
			]
		})
	});
}
export { yt as _, Zs as a, Ro as c, Ka as d, qa as f, _t as g, fa as h, gc as i, Ha as l, ba as m, yc as n, Qo as o, Sa as p, bc as r, Zo as s, Nc as t, Ua as u };

//# sourceMappingURL=DocViewer-CoKYmKjl.js.map