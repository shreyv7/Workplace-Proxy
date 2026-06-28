import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/@lottiefiles/dotlottie-react+[...].mjs";
import { t as supabase } from "./supabase-gMqJtobQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthProvider-DtpAWP_D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AuthContext = (0, import_react.createContext)(void 0);
var AuthProvider = ({ children }) => {
	const [session, setSession] = (0, import_react.useState)(null);
	const [user, setUser] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [showAuthModal, setShowAuthModal] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.provider_token) sessionStorage.setItem("google_provider_token", session.provider_token);
			if (!session) try {
				const mockUserJson = localStorage.getItem("mock_user");
				if (mockUserJson) {
					const mockUser = JSON.parse(mockUserJson);
					setUser(mockUser);
					setSession({ user: mockUser });
				}
			} catch {}
			setIsLoading(false);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session) {
				localStorage.removeItem("mock_user");
				if (session.provider_token) sessionStorage.setItem("google_provider_token", session.provider_token);
			}
			setIsLoading(false);
		});
		return () => subscription.unsubscribe();
	}, []);
	const loginWithGoogle = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: `${window.location.origin}/onboarding` }
		});
		if (error) throw error;
	};
	const loginMock = () => {
		const mockUser = {
			id: "mock-uuid-1234-5678",
			email: "alex.dev@example.com",
			user_metadata: {
				full_name: "Alex Developer",
				avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Alex"
			}
		};
		localStorage.removeItem(`profile_${mockUser.id}`);
		localStorage.setItem("mock_user", JSON.stringify(mockUser));
		setUser(mockUser);
		setSession({ user: mockUser });
		setShowAuthModal(false);
	};
	const logout = async () => {
		await supabase.auth.signOut();
		localStorage.removeItem("mock_user");
		if (typeof window !== "undefined") sessionStorage.removeItem("calibrationLoaded");
		setUser(null);
		setSession(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			session,
			isAuthenticated: !!user,
			isLoading,
			showAuthModal,
			setShowAuthModal,
			loginWithGoogle,
			loginMock,
			logout
		},
		children
	});
};
var useAuth = () => {
	const context = (0, import_react.useContext)(AuthContext);
	if (context === void 0) throw new Error("useAuth must be used within an AuthProvider");
	return context;
};
//#endregion
export { useAuth as n, AuthProvider as t };
