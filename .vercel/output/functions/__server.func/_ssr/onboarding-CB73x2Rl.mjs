import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { P as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as BrainCircuit, A as List, E as MessageSquareCode, H as Cpu, I as GitPullRequest, J as Check, L as Flame, N as Kanban, O as MailWarning, Q as Brain, R as FileText, T as MessageSquareOff, U as Coffee, W as Clock, X as CalendarDays, at as ArrowLeft, c as Sun, ct as SquareCheckBig, dt as Layers, f as Shuffle, ft as CircleQuestionMark, it as ArrowRight, l as Sunset, m as ShieldCheck, t as Zap, tt as BellRing, u as Sunrise, ut as LoaderCircle, x as PhoneCall } from "../_libs/lucide-react.mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
import { n as useAuth } from "./AuthProvider-DtpAWP_D.mjs";
import { t as h } from "../_libs/timepicker-ui-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-CB73x2Rl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var INITIAL_STATE = {
	cognitiveProfile: "",
	communicationStyle: "",
	peakFocusTime: "",
	workingHoursStart: "09:00",
	workingHoursEnd: "17:00",
	stressTriggers: [],
	urgencyPreference: ""
};
var useOnboardingState = () => {
	const [data, setData] = (0, import_react.useState)(INITIAL_STATE);
	const updateField = (field, value) => {
		setData((prev) => ({
			...prev,
			[field]: value
		}));
	};
	const isStepComplete = (step) => {
		switch (step) {
			case 0: return true;
			case 1: return !!data.cognitiveProfile;
			case 2: return !!data.communicationStyle;
			case 3: return !!data.peakFocusTime;
			case 4: return !!data.workingHoursStart && !!data.workingHoursEnd;
			case 5: return data.stressTriggers.length > 0;
			case 6: return !!data.urgencyPreference;
			default: return false;
		}
	};
	const submitAll = async (userId) => {
		const isMock = userId.startsWith("mock-");
		localStorage.setItem(`profile_${userId}`, JSON.stringify({
			...data,
			onboarding_completed: true
		}));
		const payload = {
			user_id: userId,
			cognitive_profile: data.cognitiveProfile,
			communication_style: data.communicationStyle,
			peak_focus_time: data.peakFocusTime,
			working_hours_start: data.workingHoursStart,
			working_hours_end: data.workingHoursEnd,
			stress_triggers: data.stressTriggers,
			urgency_preference: data.urgencyPreference,
			onboarding_completed: true
		};
		if (!isMock) try {
			const { error } = await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" });
			if (error) console.warn("Supabase upsert failed (table might not exist yet):", error);
		} catch (err) {
			console.error("Supabase profile save error:", err);
		}
		try {
			const response = await fetch("http://localhost:8001/context/user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			if (!response.ok) throw new Error(`Memory service returned ${response.status}`);
			console.log("Onboarding data synced with Qdrant memory service.");
		} catch (err) {
			console.error("Memory service sync error:", err);
		}
	};
	return {
		data,
		updateField,
		isStepComplete,
		submitAll
	};
};
var StepProgress = ({ currentStep, totalSteps }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full max-w-2xl mx-auto px-4 mb-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex items-center justify-between",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 z-0",
					style: { width: `${(currentStep - 1) / (totalSteps - 1) * 100}%` }
				}),
				[
					{
						id: 1,
						label: "Cognitive Profile"
					},
					{
						id: 2,
						label: "Communication Style"
					},
					{
						id: 3,
						label: "Focus Time"
					},
					{
						id: 4,
						label: "Working Hours"
					},
					{
						id: 5,
						label: "Stress Triggers"
					},
					{
						id: 6,
						label: "Urgency"
					}
				].map((step) => {
					const isCompleted = step.id < currentStep;
					const isActive = step.id === currentStep;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex flex-col items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500 ${isCompleted ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : isActive ? "bg-black border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-4 ring-cyan-500/10" : "bg-[#0c0c0c] border-white/10 text-white/40"}`,
							children: isCompleted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 stroke-[3]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold font-mono",
								children: step.id
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `absolute top-10 whitespace-nowrap text-[9px] tracking-widest font-semibold uppercase hidden sm:block transition-all duration-300 ${isActive ? "text-cyan-400" : isCompleted ? "text-white/60" : "text-white/30"}`,
							children: step.label
						})]
					}, step.id);
				})
			]
		})
	});
};
var TypewriterIntro = ({ onComplete }) => {
	const fullText = "help us know you better...";
	const [displayedText, setDisplayedText] = (0, import_react.useState)("");
	const [isDone, setIsDone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (displayedText.length < 26) {
			const timeout = setTimeout(() => {
				setDisplayedText(fullText.slice(0, displayedText.length + 1));
			}, 100);
			return () => clearTimeout(timeout);
		} else setIsDone(true);
	}, [displayedText]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onClick: onComplete,
		className: "fixed inset-0 bg-[#030303] flex flex-col items-center justify-center cursor-pointer select-none z-50 animate-fade-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes caret-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-caret-blink {
          animation: caret-blink 0.8s infinite;
        }
        @keyframes soft-glow {
          0%, 100% { 
            opacity: 0.3; 
            text-shadow: 0 0 4px rgba(6,182,212,0.1); 
          }
          50% { 
            opacity: 0.8; 
            text-shadow: 0 0 12px rgba(6,182,212,0.7); 
          }
        }
        .animate-soft-glow {
          animation: soft-glow 2.5s infinite ease-in-out;
        }
      ` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center gap-6 px-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-lg sm:text-2xl md:text-3xl font-mono text-white tracking-widest font-light text-center",
				children: [displayedText, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block w-[3px] h-6 sm:h-8 ml-1.5 bg-white animate-caret-blink align-middle" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `text-[9px] sm:text-xs font-mono tracking-widest text-cyan-400/90 transition-all duration-1000 ${isDone ? "opacity-100 translate-y-0 animate-soft-glow" : "opacity-0 -translate-y-2 pointer-events-none"}`,
				children: "CLICK ANYWHERE TO CONTINUE"
			})]
		})]
	});
};
var OnboardingCard = ({ icon, title, description, selected, onClick, variant = "single" }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		type: "button",
		className: `group relative flex items-center gap-3.5 text-left w-full p-3.5 rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${selected ? "bg-cyan-950/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)]" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.005]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300 ${selected ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-white/70 group-hover:text-white"}`,
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0 pr-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: `text-xs font-semibold tracking-tight transition-colors duration-200 truncate ${selected ? "text-cyan-400" : "text-white"}`,
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-[11px] text-white/45 leading-normal font-sans group-hover:text-white/55 transition-colors duration-200 line-clamp-2",
					children: description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `flex-shrink-0 flex h-4.5 w-4.5 items-center justify-center border transition-all duration-200 ${variant === "single" ? "rounded-full" : "rounded"} ${selected ? "border-cyan-500 bg-cyan-500 text-black" : "border-white/20 bg-transparent"}`,
				children: selected && (variant === "single" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 w-1.5 rounded-full bg-black" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3 w-3 stroke-[3]" }))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute inset-0 -z-10 rounded-xl bg-gradient-to-tr from-cyan-500/3 via-transparent to-transparent transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}` })
		]
	});
};
var CognitiveProfileStep = ({ value, onChange }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "How does your brain work?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/50 leading-relaxed",
				children: "Select the profile that best describes your working style. This data determines how we structure your daily workspace interface."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto",
			children: [
				{
					id: "adhd",
					title: "ADHD",
					description: "Need structure. Task-switching drains me.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "h-5 w-5" })
				},
				{
					id: "autism",
					title: "Autism Spectrum",
					description: "Need explicit, direct communication.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" })
				},
				{
					id: "audhd",
					title: "AuDHD",
					description: "Need structure and directness.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-5 w-5" })
				},
				{
					id: "high_load",
					title: "High Cognitive Load",
					description: "Neurotypical, but overwhelmed by noise.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-5 w-5" })
				},
				{
					id: "prefer_not_to_say",
					title: "Prefer not to say",
					description: "Just optimise for clarity.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-5 w-5" })
				}
			].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingCard, {
				icon: opt.icon,
				title: opt.title,
				description: opt.description,
				selected: value === opt.id,
				onClick: () => onChange(opt.id),
				variant: "single"
			}, opt.id))
		})]
	});
};
var CommunicationStyleStep = ({ value, onChange }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "How should we talk to you?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/50 leading-relaxed",
				children: "Choose the content layout style that helps your brain digest information best. We will translate all agent communications into this layout."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto",
			children: [
				{
					id: "checklists",
					title: "Checklists",
					description: "Numbered action items to check off.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { className: "h-5 w-5" })
				},
				{
					id: "bullet_points",
					title: "Bullet Points",
					description: "Clean, scannable bullet summaries.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "h-5 w-5" })
				},
				{
					id: "short_paragraphs",
					title: "Short Paragraphs",
					description: "Paragraphs with key details bolded.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5" })
				},
				{
					id: "visual_kanban",
					title: "Visual / Kanban",
					description: "Visual columns instead of raw text.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kanban, { className: "h-5 w-5" })
				}
			].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingCard, {
				icon: opt.icon,
				title: opt.title,
				description: opt.description,
				selected: value === opt.id,
				onClick: () => onChange(opt.id),
				variant: "single"
			}, opt.id))
		})]
	});
};
var WorkScheduleStep = ({ peakFocusTime, onPeakFocusTimeChange }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "When are you sharpest?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/50 leading-relaxed",
				children: "Tell us when your brain executes task work best so we can safeguard deep work blocks and hold low-cognitive items for other times."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto",
				children: [
					{
						id: "morning",
						title: "Morning",
						description: "Peak focus 9 AM – 12 PM.",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sunrise, { className: "h-5 w-5" })
					},
					{
						id: "afternoon",
						title: "Afternoon",
						description: "Peak focus 1 PM – 4 PM.",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-5 w-5" })
					},
					{
						id: "evening",
						title: "Evening",
						description: "Peak focus 5 PM – 8 PM.",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sunset, { className: "h-5 w-5" })
					},
					{
						id: "variable",
						title: "Variable",
						description: "It changes day to day.",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: "h-5 w-5" })
					}
				].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingCard, {
					icon: opt.icon,
					title: opt.title,
					description: opt.description,
					selected: peakFocusTime === opt.id,
					onClick: () => onPeakFocusTimeChange(opt.id),
					variant: "single"
				}, opt.id))
			})
		})]
	});
};
var WorkHoursClockStep = ({ workingHoursStart, onWorkingHoursStartChange, workingHoursEnd, onWorkingHoursEndChange }) => {
	const to12h = (time24) => {
		if (!time24) return "09:00 AM";
		const [hStr, mStr] = time24.split(":");
		const h24 = parseInt(hStr || "9", 10);
		const min = mStr || "00";
		const period = h24 >= 12 ? "PM" : "AM";
		let h12 = h24 % 12;
		if (h12 === 0) h12 = 12;
		return `${h12.toString().padStart(2, "0")}:${min.padStart(2, "0")} ${period}`;
	};
	const handleStartUpdate = (data) => {
		const period = data.type.toUpperCase();
		let hr = parseInt(data.hour, 10);
		const min = data.minutes.padStart(2, "0");
		if (period === "PM" && hr < 12) hr += 12;
		if (period === "AM" && hr === 12) hr = 0;
		onWorkingHoursStartChange(`${hr.toString().padStart(2, "0")}:${min}`);
	};
	const handleEndUpdate = (data) => {
		const period = data.type.toUpperCase();
		let hr = parseInt(data.hour, 10);
		const min = data.minutes.padStart(2, "0");
		if (period === "PM" && hr < 12) hr += 12;
		if (period === "AM" && hr === 12) hr = 0;
		onWorkingHoursEndChange(`${hr.toString().padStart(2, "0")}:${min}`);
	};
	const startPickerRef = import_react.useRef(null);
	const endPickerRef = import_react.useRef(null);
	const themeOptions = { ui: { theme: "dark" } };
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "Define your core working hours"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/50 leading-relaxed",
				children: "Set your core working window. Click the inputs below to open the interactive clock selection dial."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto pt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full space-y-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold block",
					children: "Start Time"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => startPickerRef.current?.click(),
					className: "relative group flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(h, {
						ref: startPickerRef,
						value: to12h(workingHoursStart),
						onUpdate: handleStartUpdate,
						options: themeOptions,
						className: "bg-transparent border-none text-sm font-semibold font-mono text-white focus:outline-none text-center cursor-pointer w-24"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full space-y-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold block",
					children: "End Time"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => endPickerRef.current?.click(),
					className: "relative group flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3 cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(h, {
						ref: endPickerRef,
						value: to12h(workingHoursEnd),
						onUpdate: handleEndUpdate,
						options: themeOptions,
						className: "bg-transparent border-none text-sm font-semibold font-mono text-white focus:outline-none text-center cursor-pointer w-24"
					})]
				})]
			})]
		})]
	});
};
var StressTriggersStep = ({ selectedTriggers, onChange }) => {
	const options = [
		{
			id: "ambiguous_deadlines",
			title: "Ambiguous Deadlines",
			description: "No clear due date or priority given.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-5 w-5" })
		},
		{
			id: "passive_aggressive",
			title: "Passive-Aggressive Tone",
			description: "Vague feedback or tense chat messages.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareOff, { className: "h-5 w-5" })
		},
		{
			id: "vague_requests",
			title: "Vague Requests",
			description: "Tasks shared with zero context.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "h-5 w-5" })
		},
		{
			id: "context_switches",
			title: "Frequent Context Switches",
			description: "Constantly bouncing between app context.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitPullRequest, { className: "h-5 w-5" })
		},
		{
			id: "surprise_meetings",
			title: "Surprise Meetings",
			description: "Invites dropped without any agenda.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-5 w-5" })
		},
		{
			id: "info_overload",
			title: "Information Overload",
			description: "Giant text walls with no summaries.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailWarning, { className: "h-5 w-5" })
		},
		{
			id: "constant_notifs",
			title: "Constant Notifications",
			description: "Pings interrupting deep focus.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellRing, { className: "h-5 w-5" })
		},
		{
			id: "no_agenda_call",
			title: "Quick Calls / No Agenda",
			description: "Sudden voice calls with zero notice.",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneCall, { className: "h-5 w-5" })
		}
	];
	const handleToggle = (id) => {
		if (selectedTriggers.includes(id)) onChange(selectedTriggers.filter((item) => item !== id));
		else onChange([...selectedTriggers, id]);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "What drains your battery?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/50 leading-relaxed",
				children: "Select all communication patterns or events that increase your stress. Our translation engine wraps, buffers, or intercepts these."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto",
			children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingCard, {
				icon: opt.icon,
				title: opt.title,
				description: opt.description,
				selected: selectedTriggers.includes(opt.id),
				onClick: () => handleToggle(opt.id),
				variant: "multi"
			}, opt.id))
		})]
	});
};
var UrgencyPreferencesStep = ({ value, onChange }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center max-w-xl mx-auto space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold tracking-tight text-white",
				children: "How should we interpret vague urgency?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-white/50 leading-relaxed max-w-md mx-auto",
				children: [
					"When a colleague says ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cyan-400 italic",
						children: "\"no rush\""
					}),
					" or ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-cyan-400 italic",
						children: "\"whenever you get a chance\""
					}),
					", how should your proxy schedule it?"
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto",
			children: [
				{
					id: "assume_urgent",
					title: "Assume Urgent",
					description: "Treat all tasks as due today.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-5 w-5 text-red-400" })
				},
				{
					id: "use_context",
					title: "Use Context Clues (Recommended)",
					description: "Assess sender context and deadlines.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainCircuit, { className: "h-5 w-5 text-amber-400" })
				},
				{
					id: "ask_clarification",
					title: "Ask for Clarification",
					description: "Flag items and ask me to decide.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareCode, { className: "h-5 w-5 text-cyan-400" })
				},
				{
					id: "default_low",
					title: "Default to Low Priority",
					description: "Unless marked urgent, deprioritize.",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coffee, { className: "h-5 w-5 text-blue-400" })
				}
			].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingCard, {
				icon: opt.icon,
				title: opt.title,
				description: opt.description,
				selected: value === opt.id,
				onClick: () => onChange(opt.id),
				variant: "single"
			}, opt.id))
		})]
	});
};
var OnboardingFlow = () => {
	const navigate = useNavigate();
	const { user, isAuthenticated, isLoading, setShowAuthModal } = useAuth();
	const { data, updateField, isStepComplete, submitAll } = useOnboardingState();
	const [currentStep, setCurrentStep] = (0, import_react.useState)(0);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [transitioning, setTransitioning] = (0, import_react.useState)(false);
	const [playVideo, setPlayVideo] = (0, import_react.useState)(true);
	const [fadeOpacity, setFadeOpacity] = (0, import_react.useState)(1);
	const [hasStartedFadeOut, setHasStartedFadeOut] = (0, import_react.useState)(false);
	const videoRef = import_react.useRef(null);
	(0, import_react.useEffect)(() => {
		if (isAuthenticated && user?.id) {
			const checkProfile = async () => {
				const localProfile = localStorage.getItem(`profile_${user.id}`);
				if (localProfile) try {
					if (JSON.parse(localProfile).onboarding_completed) {
						navigate({ to: "/dashboard" });
						return;
					}
				} catch (e) {}
				if (!user.id.startsWith("mock-")) try {
					const { data, error } = await supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).single();
					if (data?.onboarding_completed) navigate({ to: "/dashboard" });
				} catch (e) {
					console.warn("Could not fetch profile for redirect check:", e);
				}
			};
			checkProfile();
		}
	}, [
		user,
		isAuthenticated,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		if (!isLoading && !isAuthenticated) {
			navigate({ to: "/" });
			setShowAuthModal(true);
		}
	}, [
		isLoading,
		isAuthenticated,
		navigate,
		setShowAuthModal
	]);
	const handleCompleteOnboarding = async () => {
		setIsSubmitting(true);
		try {
			await submitAll(user?.id || "mock-user-1234");
			navigate({ to: "/dashboard" });
		} catch (err) {
			console.error("Submission failed", err);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleNext = async () => {
		if (currentStep < 6) {
			setTransitioning(true);
			setTimeout(() => {
				setCurrentStep((prev) => prev + 1);
				setTransitioning(false);
			}, 150);
		} else await handleCompleteOnboarding();
	};
	const handleBack = () => {
		if (currentStep > 1) {
			setTransitioning(true);
			setTimeout(() => {
				setCurrentStep((prev) => prev - 1);
				setTransitioning(false);
			}, 150);
		}
	};
	const handleSkip = () => {
		switch (currentStep) {
			case 1:
				updateField("cognitiveProfile", "prefer_not_to_say");
				break;
			case 2:
				updateField("communicationStyle", "bullet_points");
				break;
			case 3:
				updateField("peakFocusTime", "morning");
				break;
			case 4:
				updateField("workingHoursStart", "09:00");
				updateField("workingHoursEnd", "17:00");
				break;
			case 5:
				updateField("stressTriggers", ["ambiguous_deadlines", "vague_requests"]);
				break;
			case 6:
				updateField("urgencyPreference", "use_context");
				break;
		}
		handleNext();
	};
	const handleSkipAll = async () => {
		if (!data.cognitiveProfile) updateField("cognitiveProfile", "prefer_not_to_say");
		if (!data.communicationStyle) updateField("communicationStyle", "bullet_points");
		if (!data.peakFocusTime) {
			updateField("peakFocusTime", "morning");
			updateField("workingHoursStart", "09:00");
			updateField("workingHoursEnd", "17:00");
		}
		if (data.stressTriggers.length === 0) updateField("stressTriggers", ["ambiguous_deadlines", "vague_requests"]);
		if (!data.urgencyPreference) updateField("urgencyPreference", "use_context");
		await handleCompleteOnboarding();
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-screen w-screen items-center justify-center bg-[#030303] text-white",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-cyan-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-mono tracking-widest text-white/50",
				children: "SECURE SHIELD INITIALIZING..."
			})]
		})
	});
	if (!isAuthenticated) return null;
	if (playVideo) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 bg-[#030303] flex items-center justify-center overflow-hidden w-screen h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				src: "/phone.mp4",
				className: "w-full h-full object-cover animate-fade-in",
				autoPlay: true,
				playsInline: true,
				onPlay: () => {
					setFadeOpacity(0);
				},
				onTimeUpdate: (e) => {
					const video = e.currentTarget;
					if (video.duration && video.duration - video.currentTime <= 3) {
						if (!hasStartedFadeOut) {
							setHasStartedFadeOut(true);
							setFadeOpacity(1);
						}
					}
				},
				onEnded: () => {
					setPlayVideo(false);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 bg-[#030303] pointer-events-none transition-opacity ease-in-out",
				style: {
					opacity: fadeOpacity,
					transitionDuration: "3000ms"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setPlayVideo(false),
				className: "absolute bottom-6 right-6 z-50 text-[10px] tracking-widest font-mono font-semibold uppercase text-white/50 hover:text-white border border-white/10 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] cursor-pointer",
				children: "Skip Intro"
			})
		]
	});
	if (currentStep === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypewriterIntro, { onComplete: () => setCurrentStep(1) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-screen w-screen bg-[#030303] text-white flex flex-col font-sans select-none overflow-x-hidden py-6 px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes slide-in-fade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-fade {
          animation: slide-in-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "max-w-4xl w-full mx-auto flex items-center justify-between mb-4 flex-shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-mono tracking-widest text-white/40 font-semibold uppercase",
						children: "Workplace Proxy / Onboarding"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: handleSkipAll,
					className: "text-[10px] tracking-widest font-semibold uppercase text-white/40 hover:text-white transition-colors cursor-pointer",
					children: "Skip Onboarding"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepProgress, {
				currentStep,
				totalSteps: 6
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto my-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `w-full transition-opacity duration-150 ${transitioning ? "opacity-0" : "opacity-100 animate-slide-in-fade"}`,
					children: [
						currentStep === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CognitiveProfileStep, {
							value: data.cognitiveProfile,
							onChange: (val) => updateField("cognitiveProfile", val)
						}),
						currentStep === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommunicationStyleStep, {
							value: data.communicationStyle,
							onChange: (val) => updateField("communicationStyle", val)
						}),
						currentStep === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkScheduleStep, {
							peakFocusTime: data.peakFocusTime,
							onPeakFocusTimeChange: (val) => updateField("peakFocusTime", val)
						}),
						currentStep === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkHoursClockStep, {
							workingHoursStart: data.workingHoursStart,
							onWorkingHoursStartChange: (val) => updateField("workingHoursStart", val),
							workingHoursEnd: data.workingHoursEnd,
							onWorkingHoursEndChange: (val) => updateField("workingHoursEnd", val)
						}),
						currentStep === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StressTriggersStep, {
							selectedTriggers: data.stressTriggers,
							onChange: (val) => updateField("stressTriggers", val)
						}),
						currentStep === 6 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UrgencyPreferencesStep, {
							value: data.urgencyPreference,
							onChange: (val) => updateField("urgencyPreference", val)
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "max-w-4xl w-full mx-auto flex items-center justify-between border-t border-white/5 pt-6 flex-shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: currentStep > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleBack,
					className: "group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4 transition-transform group-hover:-translate-x-0.5" }), "Back"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[84px]" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSkip,
						className: "px-4 py-2.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors cursor-pointer",
						children: "Skip Question"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						disabled: !isStepComplete(currentStep) || isSubmitting,
						onClick: handleNext,
						className: `group flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-semibold transition-all duration-300 cursor-pointer ${isStepComplete(currentStep) && !isSubmitting ? "bg-white text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"}`,
						children: isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }), " Saving..."] }) : currentStep === 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Complete Onboarding ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5 stroke-[3]" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Continue",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" })
						] })
					})]
				})]
			})
		]
	});
};
var SplitComponent = OnboardingFlow;
//#endregion
export { SplitComponent as component };
