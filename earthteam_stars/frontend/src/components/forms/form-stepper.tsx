"use client";

import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface Step {
  label: string;
  sublabel?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <nav className="flex items-center justify-between">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isClickable = onStepClick && stepNum < currentStep;

        return (
          <div key={i} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-3",
                isClickable && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isComplete && "bg-emerald-600 text-white",
                  isCurrent && "border-2 border-emerald-600 bg-emerald-50 text-emerald-700",
                  !isComplete && !isCurrent && "border-2 border-gray-200 bg-white text-gray-400",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNum}
              </span>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-emerald-700" : isComplete ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {step.label}
                </p>
                {step.sublabel && (
                  <p className="text-xs text-gray-400">{step.sublabel}</p>
                )}
              </div>
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-0.5 flex-1",
                  isComplete ? "bg-emerald-500" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
