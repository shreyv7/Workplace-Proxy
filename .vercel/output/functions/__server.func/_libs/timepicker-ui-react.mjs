import { i as __toESM } from "../_runtime.mjs";
import { r as require_react } from "./@lottiefiles/dotlottie-react+[...].mjs";
//#region node_modules/timepicker-ui-react/dist/index.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var x = (n, o) => ({
	onConfirm: n.onConfirm || o?.onConfirm ? (e) => {
		o?.onConfirm?.(e), n.onConfirm?.(e);
	} : void 0,
	onCancel: n.onCancel || o?.onCancel ? (e) => {
		o?.onCancel?.(e), n.onCancel?.(e);
	} : void 0,
	onOpen: n.onOpen || o?.onOpen ? (e) => {
		o?.onOpen?.(e), n.onOpen?.(e);
	} : void 0,
	onUpdate: n.onUpdate || o?.onUpdate ? (e) => {
		o?.onUpdate?.(e), n.onUpdate?.(e);
	} : void 0,
	onSelectHour: n.onSelectHour || o?.onSelectHour ? (e) => {
		o?.onSelectHour?.(e), n.onSelectHour?.(e);
	} : void 0,
	onSelectMinute: n.onSelectMinute || o?.onSelectMinute ? (e) => {
		o?.onSelectMinute?.(e), n.onSelectMinute?.(e);
	} : void 0,
	onSelectAM: n.onSelectAM || o?.onSelectAM ? (e) => {
		o?.onSelectAM?.(e), n.onSelectAM?.(e);
	} : void 0,
	onSelectPM: n.onSelectPM || o?.onSelectPM ? (e) => {
		o?.onSelectPM?.(e), n.onSelectPM?.(e);
	} : void 0,
	onError: n.onError || o?.onError ? (e) => {
		o?.onError?.(e), n.onError?.(e);
	} : void 0,
	onTimezoneChange: n.onTimezoneChange || o?.onTimezoneChange ? (e) => {
		o?.onTimezoneChange?.(e), n.onTimezoneChange?.(e);
	} : void 0,
	onRangeConfirm: n.onRangeConfirm || o?.onRangeConfirm ? (e) => {
		o?.onRangeConfirm?.(e), n.onRangeConfirm?.(e);
	} : void 0,
	onRangeSwitch: n.onRangeSwitch || o?.onRangeSwitch ? (e) => {
		o?.onRangeSwitch?.(e), n.onRangeSwitch?.(e);
	} : void 0,
	onRangeValidation: n.onRangeValidation || o?.onRangeValidation ? (e) => {
		o?.onRangeValidation?.(e), n.onRangeValidation?.(e);
	} : void 0,
	onClear: n.onClear || o?.onClear ? (e) => {
		o?.onClear?.(e), n.onClear?.(e);
	} : void 0
}), a = (n, o) => {
	let e = (0, import_react.useMemo)(() => x(n, o), [
		o,
		n.onConfirm,
		n.onCancel,
		n.onOpen,
		n.onUpdate,
		n.onSelectHour,
		n.onSelectMinute,
		n.onSelectAM,
		n.onSelectPM,
		n.onError,
		n.onTimezoneChange,
		n.onRangeConfirm,
		n.onRangeSwitch,
		n.onRangeValidation,
		n.onClear
	]);
	return {
		attachEventHandlers: (0, import_react.useCallback)((i) => {
			e.onConfirm && i.on("confirm", e.onConfirm), e.onCancel && i.on("cancel", e.onCancel), e.onOpen && i.on("open", e.onOpen), e.onUpdate && i.on("update", e.onUpdate), e.onSelectHour && i.on("select:hour", e.onSelectHour), e.onSelectMinute && i.on("select:minute", e.onSelectMinute), e.onSelectAM && i.on("select:am", e.onSelectAM), e.onSelectPM && i.on("select:pm", e.onSelectPM), e.onError && i.on("error", e.onError), e.onTimezoneChange && i.on("timezone:change", e.onTimezoneChange), e.onRangeConfirm && i.on("range:confirm", e.onRangeConfirm), e.onRangeSwitch && i.on("range:switch", e.onRangeSwitch), e.onRangeValidation && i.on("range:validation", e.onRangeValidation), e.onClear && i.on("clear", e.onClear);
		}, [e]),
		detachEventHandlers: (0, import_react.useCallback)((i) => {
			e.onConfirm && i.off("confirm", e.onConfirm), e.onCancel && i.off("cancel", e.onCancel), e.onOpen && i.off("open", e.onOpen), e.onUpdate && i.off("update", e.onUpdate), e.onSelectHour && i.off("select:hour", e.onSelectHour), e.onSelectMinute && i.off("select:minute", e.onSelectMinute), e.onSelectAM && i.off("select:am", e.onSelectAM), e.onSelectPM && i.off("select:pm", e.onSelectPM), e.onError && i.off("error", e.onError), e.onTimezoneChange && i.off("timezone:change", e.onTimezoneChange), e.onRangeConfirm && i.off("range:confirm", e.onRangeConfirm), e.onRangeSwitch && i.off("range:switch", e.onRangeSwitch), e.onRangeValidation && i.off("range:validation", e.onRangeValidation), e.onClear && i.off("clear", e.onClear);
		}, [e])
	};
};
var P = () => typeof window > "u";
var s = (n, o, e, r, t, i) => {
	let f = (0, import_react.useRef)(null);
	return (0, import_react.useEffect)(() => {
		if (P() || !n.current) return;
		let p = true;
		return import("./timepicker-ui.mjs").then((n) => n.t).then(({ TimepickerUI: c }) => {
			if (!p || !n.current) return;
			let m = new c(n.current, o);
			m.create(), t(m), f.current = m, e !== void 0 ? m.setValue(e, true) : r !== void 0 && m.setValue(r, true);
		}), () => {
			p = false;
			let c = f.current;
			c && (i(c), c.destroy(), f.current = null);
		};
	}, []), f;
};
var d = (n, o) => {
	let e = (0, import_react.useRef)(void 0);
	(0, import_react.useEffect)(() => {
		let r = n.current;
		!r || o === void 0 || o === e.current || (r.setValue(o, true), e.current = o);
	}, [o]);
};
var T = (n, o) => {
	(0, import_react.useEffect)(() => {
		let e = n.current;
		!e || !o || e.update({
			options: o,
			create: true
		});
	}, [o]);
};
var S = (n, o, e, r) => {
	(0, import_react.useEffect)(() => {
		let t = n.current;
		if (t) return e(t), o(t), () => {
			n.current && e(n.current);
		};
	}, [
		o,
		e,
		r.onConfirm,
		r.onCancel,
		r.onOpen,
		r.onUpdate,
		r.onSelectHour,
		r.onSelectMinute,
		r.onSelectAM,
		r.onSelectPM,
		r.onError,
		r.onTimezoneChange,
		r.onRangeConfirm,
		r.onRangeSwitch,
		r.onRangeValidation
	]);
};
var h = (0, import_react.forwardRef)((n, o) => {
	let { options: e, value: r, defaultValue: t, onConfirm: i, onCancel: f, onOpen: p, onUpdate: c, onSelectHour: m, onSelectMinute: k, onSelectAM: O, onSelectPM: E, onError: H, onTimezoneChange: y, onRangeConfirm: I, onRangeSwitch: w, onRangeValidation: V, onClear: z, onChange: Q, ...A } = n, u = (0, import_react.useRef)(null);
	(0, import_react.useImperativeHandle)(o, () => u.current, []);
	let g = {
		onConfirm: i,
		onCancel: f,
		onOpen: p,
		onUpdate: c,
		onSelectHour: m,
		onSelectMinute: k,
		onSelectAM: O,
		onSelectPM: E,
		onError: H,
		onTimezoneChange: y,
		onRangeConfirm: I,
		onRangeSwitch: w,
		onRangeValidation: V,
		onClear: z
	}, { attachEventHandlers: C, detachEventHandlers: R } = a(g, e?.callbacks), l = s(u, e, r, t, C, R);
	return d(l, r), T(l, e), S(l, C, R, g), import_react.createElement("input", {
		ref: u,
		type: "text",
		...A,
		...r !== void 0 ? {
			value: r,
			readOnly: true
		} : { defaultValue: t }
	});
});
h.displayName = "Timepicker";
//#endregion
export { h as t };
