import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { P as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as Cpu, Q as Brain, Y as Calendar, et as Bot, it as ArrowRight, lt as Sparkles } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
import { n as useAuth } from "./AuthProvider-DtpAWP_D.mjs";
import { a as Renderer, i as Mesh, n as Color, o as Program, r as RenderTarget, t as Triangle } from "../_libs/ogl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DyjnfYYA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_STRANDS = 12;
var MAX_COLORS = 8;
var VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
var FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}

vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}

vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);

  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);

  vec3 col = vec3(0.0);

  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;

    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;

    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;

    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;

    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;

    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.07 + uHueShift;
    col += strandColor(h) * g * env;
  }

  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);

  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);

  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;

  fragColor = vec4(col * uOpacity, alpha);
}
`;
var GLASS_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;

out vec4 fragColor;

vec2 toUv(vec2 p) {
  return p * (uResolution.y / uResolution) + 0.5;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float d = length(p);
  float r = uRadius;

  float edge = fwidth(d) * 1.5;
  float mask = 1.0 - smoothstep(r - edge, r + edge, d);
  if (mask <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  // sphere height: 0 at the rim, 1 at the center
  float z = sqrt(max(r * r - d * d, 0.0)) / r;
  float nd = d / r; // 0 at the center, 1 at the rim

  // refraction is confined to a narrow band near the rim; the rest stays undistorted
  vec2 dir = d > 0.0 ? p / d : vec2(0.0);
  float lens = smoothstep(0.85, 1.0, nd) * pow(nd, 6.0);
  vec2 offset = -dir * lens * uRefraction * 0.15;
  vec2 disp = -dir * lens * uDispersion * 0.012;

  vec3 light;
  light.r = texture(uScene, toUv(p + offset - disp)).r;
  light.g = texture(uScene, toUv(p + offset)).g;
  light.b = texture(uScene, toUv(p + offset + disp)).b;

  // neutral fresnel rim (no color tint so the glass stays clear)
  float fres = pow(1.0 - z, 3.0);
  vec3 rim = vec3(1.0) * fres * 0.18;

  // specular highlight from the upper-left
  vec2 lightDir = normalize(vec2(-0.55, 0.6));
  float spec = pow(max(dot(p / max(r, 1e-4), lightDir), 0.0), 6.0);
  spec *= smoothstep(r, r * 0.55, d);

  vec3 emissive = light + rim + vec3(spec) * 0.4;
  float emissiveA = clamp(max(max(emissive.r, emissive.g), emissive.b), 0.0, 1.0);

  // almost clear glass body: only a faint neutral darkening, mostly near the rim
  float bodyA = 0.05 + fres * 0.05;

  // composite emissive light over the clear body (premultiplied)
  float outA = emissiveA + bodyA * (1.0 - emissiveA);
  vec3 outRGB = emissive;

  outRGB *= mask;
  outA *= mask;

  fragColor = vec4(outRGB, outA);
}
`;
var buildPalette = (colors) => {
	const filled = colors && colors.length ? colors : ["#ffffff"];
	const padded = [];
	for (let i = 0; i < MAX_COLORS; i++) {
		const c = new Color(filled[i] ?? filled[filled.length - 1]);
		padded.push([
			c.r,
			c.g,
			c.b
		]);
	}
	return padded;
};
function Strands({ colors = [
	"#FF4242",
	"#7C3AED",
	"#06B6D4",
	"#EAB308"
], count = 3, speed = .5, amplitude = 1, waviness = 1, thickness = .7, glow = 2.6, taper = 3, spread = 1, hueShift = 0, intensity = .6, saturation = 1.5, opacity = 1, scale = 1.5, glass = false, refraction = 1, dispersion = 1, glassSize = 1, className = "", style }) {
	const propsRef = (0, import_react.useRef)({
		colors,
		count,
		speed,
		amplitude,
		waviness,
		thickness,
		glow,
		taper,
		spread,
		hueShift,
		intensity,
		saturation,
		opacity,
		scale,
		glass,
		refraction,
		dispersion,
		glassSize
	});
	propsRef.current = {
		colors,
		count,
		speed,
		amplitude,
		waviness,
		thickness,
		glow,
		taper,
		spread,
		hueShift,
		intensity,
		saturation,
		opacity,
		scale,
		glass,
		refraction,
		dispersion,
		glassSize
	};
	const ctnDom = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const ctn = ctnDom.current;
		if (!ctn) return;
		const renderer = new Renderer({
			alpha: true,
			premultipliedAlpha: true,
			antialias: true
		});
		const gl = renderer.gl;
		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.canvas.style.backgroundColor = "transparent";
		const geometry = new Triangle(gl);
		if (geometry.attributes.uv) delete geometry.attributes.uv;
		const program = new Program(gl, {
			vertex: VERT,
			fragment: FRAG,
			uniforms: {
				uTime: { value: 0 },
				uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
				uColors: { value: buildPalette(propsRef.current.colors) },
				uColorCount: { value: Math.min(propsRef.current.colors.length, MAX_COLORS) },
				uStrandCount: { value: Math.min(propsRef.current.count, MAX_STRANDS) },
				uSpeed: { value: speed },
				uAmplitude: { value: amplitude },
				uWaviness: { value: waviness },
				uThickness: { value: thickness },
				uGlow: { value: glow },
				uTaper: { value: taper },
				uSpread: { value: spread },
				uHueShift: { value: hueShift },
				uIntensity: { value: intensity },
				uOpacity: { value: opacity },
				uScale: { value: scale },
				uSaturation: { value: saturation }
			}
		});
		const mesh = new Mesh(gl, {
			geometry,
			program
		});
		const renderTarget = new RenderTarget(gl, {
			width: ctn.offsetWidth,
			height: ctn.offsetHeight
		});
		const glassProgram = new Program(gl, {
			vertex: VERT,
			fragment: GLASS_FRAG,
			uniforms: {
				uScene: { value: renderTarget.texture },
				uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
				uRadius: { value: .46 * glassSize },
				uRefraction: { value: refraction },
				uDispersion: { value: dispersion }
			}
		});
		const glassMesh = new Mesh(gl, {
			geometry,
			program: glassProgram
		});
		ctn.appendChild(gl.canvas);
		function resize() {
			if (!ctn) return;
			const width = ctn.offsetWidth;
			const height = ctn.offsetHeight;
			renderer.setSize(width, height);
			program.uniforms.uResolution.value = [width, height];
			renderTarget.setSize(width, height);
			glassProgram.uniforms.uResolution.value = [width, height];
		}
		window.addEventListener("resize", resize);
		resize();
		let animateId = 0;
		const update = (t) => {
			animateId = requestAnimationFrame(update);
			const current = propsRef.current;
			program.uniforms.uTime.value = t * .001;
			program.uniforms.uColors.value = buildPalette(current.colors);
			program.uniforms.uColorCount.value = Math.min(current.colors.length, MAX_COLORS);
			program.uniforms.uStrandCount.value = Math.min(Math.max(Math.round(current.count), 1), MAX_STRANDS);
			program.uniforms.uSpeed.value = current.speed;
			program.uniforms.uAmplitude.value = current.amplitude;
			program.uniforms.uWaviness.value = current.waviness;
			program.uniforms.uThickness.value = current.thickness;
			program.uniforms.uGlow.value = current.glow;
			program.uniforms.uTaper.value = current.taper;
			program.uniforms.uSpread.value = current.spread;
			program.uniforms.uHueShift.value = current.hueShift;
			program.uniforms.uIntensity.value = current.intensity;
			program.uniforms.uOpacity.value = current.opacity;
			program.uniforms.uScale.value = current.scale;
			program.uniforms.uSaturation.value = current.saturation;
			if (current.glass) {
				renderer.render({
					scene: mesh,
					target: renderTarget
				});
				glassProgram.uniforms.uScene.value = renderTarget.texture;
				glassProgram.uniforms.uRefraction.value = current.refraction;
				glassProgram.uniforms.uDispersion.value = current.dispersion;
				glassProgram.uniforms.uRadius.value = .46 * glassSize;
				renderer.render({ scene: glassMesh });
			} else renderer.render({ scene: mesh });
		};
		animateId = requestAnimationFrame(update);
		return () => {
			cancelAnimationFrame(animateId);
			window.removeEventListener("resize", resize);
			if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
			gl.getExtension("WEBGL_lose_context")?.loseContext();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: ctnDom,
		className: `relative w-full h-full bg-transparent ${className}`,
		style
	});
}
function GoogleIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className,
		viewBox: "0 0 24 24",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
				fill: "#4285F4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
				fill: "#34A853"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
				fill: "#FBBC05"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
				fill: "#EA4335"
			})
		]
	});
}
function LandingPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading, loginWithGoogle, loginMock, user } = useAuth();
	const [signingIn, setSigningIn] = (0, import_react.useState)(false);
	const [signInError, setSignInError] = (0, import_react.useState)(null);
	const handleStart = async () => {
		if (isAuthenticated && user) {
			if (user.id?.startsWith("mock-")) {
				const localProfile = localStorage.getItem(`profile_${user.id}`);
				let onboardingCompleted = false;
				if (localProfile) try {
					onboardingCompleted = JSON.parse(localProfile).onboarding_completed;
				} catch {}
				navigate({ to: onboardingCompleted ? "/dashboard" : "/onboarding" });
				return;
			}
			try {
				const { data: { session } } = await supabase.auth.getSession();
				if (session) {
					const { data: profile } = await supabase.from("user_profiles").select("onboarding_completed").eq("user_id", session.user.id).single();
					navigate({ to: profile?.onboarding_completed ? "/dashboard" : "/onboarding" });
					return;
				}
			} catch {}
			navigate({ to: "/dashboard" });
		} else handleGoogleSignIn();
	};
	const handleGoogleSignIn = async () => {
		setSignInError(null);
		setSigningIn(true);
		try {
			await loginWithGoogle();
		} catch (err) {
			setSignInError(err?.message ?? "Google sign-in failed. Please try again.");
			setSigningIn(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-screen w-screen bg-[#030303] text-white flex flex-col font-sans select-none overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 -top-20 z-0 h-[calc(100%+5rem)] w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Strands, {
						colors: [
							"#00F2FE",
							"#7C3AED",
							"#EC4899",
							"#10B981"
						],
						count: 5,
						speed: .25,
						amplitude: 1.8,
						waviness: .8,
						thickness: 1.2,
						glow: 2.8,
						taper: 2.5,
						spread: 1.2,
						intensity: .65,
						saturation: 1.5,
						opacity: .85,
						scale: 1.9,
						glass: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#030303]/60 backdrop-blur-[1px] pointer-events-none" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,3,3,0.1)_0%,rgba(3,3,3,0.95)_85%)] pointer-events-none" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-10 flex-shrink-0 flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 bg-[#030303]/40 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "h-4.5 w-4.5 text-black",
							strokeWidth: 2
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg font-semibold tracking-tight",
						children: "Workplace Proxy"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleStart,
						className: "group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/20",
						children: ["Launch App", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-4 md:px-12 max-w-7xl mx-auto w-full overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3 py-0.5 text-xs text-cyan-300 font-mono mb-4 animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-3 w-3 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Google Agent Labs Hackathon '26" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center max-w-2xl space-y-3 mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent leading-[1.15]",
							children: "The cognitive shell for deep work"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed",
							children: "Workplace Proxy is an AI-native workspace. It continuously ingests, interprets, and debates messy signals from Slack, Jira, and Email, translating them into structured schedule blocks."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-3 w-full max-w-xs mb-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleStart,
								disabled: signingIn,
								className: "relative group flex items-center justify-center gap-3 w-full rounded-xl bg-white text-gray-900 px-6 py-3 text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.22)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
								children: [signingIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleIcon, { className: "h-4 w-4" }), signingIn ? "Redirecting…" : "Continue with Google"]
							}),
							signInError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-xs text-red-400 px-2",
								children: signInError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-px bg-white/10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-white/30 font-mono tracking-widest",
										children: "OR"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-px bg-white/10" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									loginMock();
									navigate({ to: "/onboarding" });
								},
								className: "w-full rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-medium text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white/80",
								children: "Launch Demo Workspace"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, {
											className: "h-5 w-5",
											strokeWidth: 1.5
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-base font-semibold mb-1.5",
										children: "Swarm Intelligence"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-white/50 leading-relaxed",
										children: "Autonomous agents intercept, translate, and debate incoming ambiguous signals. No raw text or notifications ever reach you directly."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 -z-10 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-purple-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
											className: "h-5 w-5",
											strokeWidth: 1.5
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-base font-semibold mb-1.5",
										children: "Cognitive Scheduling"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-white/50 leading-relaxed",
										children: "Visualizes your daily mental bandwidth. Protects focus hours, reserves context-switching buffer, and automatically blocks calendar slots."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 -z-10 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "group relative overflow-hidden rounded-xl border border-white/5 bg-[#080808]/40 p-5 md:p-6 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0a]/50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, {
											className: "h-5 w-5",
											strokeWidth: 1.5
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-base font-semibold mb-1.5",
										children: "Vector Context Memory"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-white/50 leading-relaxed",
										children: "A high-precision semantic knowledge store backed by Qdrant. Saves working relationships, preferred formats, and organization context."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 -z-10 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" })
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "relative z-10 flex-shrink-0 w-full text-center py-4 text-xs text-white/35 border-t border-white/5 bg-[#030303]/60 backdrop-blur-sm mt-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" Workplace Proxy. All rights reserved."
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Powered by Google Adk, Lyzr, Qdrant and Supabase" })
					})]
				})
			})
		]
	});
}
//#endregion
export { LandingPage as component };
