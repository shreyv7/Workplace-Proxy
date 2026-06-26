import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlow } from "../../personalisation/OnboardingFlow";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingFlow,
});
