"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  PieChart,
  Target,
  Calendar,
  TrendingUp,
  Lock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  MapPin,
  Flame,
  Search,
  Scale,
  ExternalLink,
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  selector: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  highlights: string[];
  tips: string;
  preferredPosition?: "top" | "bottom" | "auto";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Couple Profile & Identity",
    subtitle: "Private Joint Finance for Couples",
    route: "/",
    selector: '[data-tour="header-profile"]',
    tag: "Couples",
    icon: Sparkles,
    description:
      "Welcome to Babi-Savings! Switch active partner, customize nicknames, avatar photos, and theme colors without linking sensitive bank logins.",
    highlights: [
      "No bank account linking required",
      "Instant cloud & offline sync",
      "Personalized partner colors and avatars",
    ],
    tips: "Tip: Tap 'Edit' anytime to change your nickname or avatar.",
    preferredPosition: "bottom",
  },
  {
    id: "safe-to-spend",
    title: "Safe-to-Spend Allowance",
    subtitle: "Your Daily Spending Guardrail",
    route: "/",
    selector: '[data-tour="safe-to-spend"]',
    tag: "Dashboard",
    icon: ShieldCheck,
    description:
      "Dynamic daily allowance calculated from your monthly budget minus upcoming bills and savings targets. Stay in the green to avoid end-of-month stress.",
    highlights: [
      "Auto-updates with every logged transaction",
      "Pace status (On Track, Caution, Over Pace)",
      "Daily vs Month-to-Date breakdown",
    ],
    tips: "Tip: Check this daily to know your exact comfortable spending allowance!",
    preferredPosition: "bottom",
  },
  {
    id: "quick-log",
    title: "Rapid Log & Fair Splits",
    subtitle: "Log Expenses in 5 Seconds",
    route: "/",
    selector: '[data-tour="quick-log-fab"]',
    tag: "Quick Action",
    icon: PlusCircle,
    description:
      "Tap this center [+] button anytime to log shared expenses. Split 50/50, custom income ratios, or 100/0 with receipt scanning and micro-roundups.",
    highlights: [
      "50/50, 60/40, 70/30 or custom income ratio",
      "Spare-change roundups swept into savings",
      "Partner approval for high-value purchases",
    ],
    tips: "Tip: Long-press or tap [+] on any page for instant logging.",
    preferredPosition: "top",
  },
  {
    id: "debt-settlement",
    title: "Couple IOU & Debt Tracker",
    subtitle: "Fair Balances Without Math",
    route: "/",
    selector: '[data-tour="debt-settlement"]',
    tag: "Settlement",
    icon: Scale,
    description:
      "Tracks who paid for what and computes exactly who owes whom. Settle up with a single tap to log a clean settlement payment.",
    highlights: [
      "Automated IOU balance tracking",
      "One-tap debt settlement record",
      "Accounts for non-50/50 shared ratios",
    ],
    tips: "Tip: Tap 'Settle Up' to clear out IOUs when you transfer money to your partner.",
    preferredPosition: "top",
  },
  {
    id: "budgets",
    title: "Shared Budgets & 50/30/20",
    subtitle: "Category Limits with Rollovers",
    route: "/budget",
    selector: '[data-tour="budget-hero"]',
    tag: "Budgets",
    icon: PieChart,
    description:
      "Manage category caps (Groceries, Dining, Rent). Unspent cash rolls over to the next month to reward mindful habits.",
    highlights: [
      "Live pace-per-day gauges",
      "50/30/20 smart budget calculator",
      "Automatic surplus rollover tracking",
    ],
    tips: "Tip: Tap '50/30/20' at the top to balance Needs, Wants & Savings!",
    preferredPosition: "bottom",
  },
  {
    id: "goals",
    title: "Shared Goals & Wishlists",
    subtitle: "Fund Dreams & Vacations Together",
    route: "/goals",
    selector: '[data-tour="goals-hero"]',
    tag: "Goals",
    icon: Target,
    description:
      "Save together for vacations, wedding funds, or emergency cushions. Boost targets with one-tap lump sums and spare-change roundups.",
    highlights: [
      "Target dates with required monthly pacing",
      "One-tap Windfall Boosts with confetti",
      "Automated coffee-run spare change sweeps",
    ],
    tips: "Tip: Enable 'Roundup Savings' to save effortlessly on every purchase.",
    preferredPosition: "bottom",
  },
  {
    id: "recurring",
    title: "Recurring Bills & Calendar",
    subtitle: "Never Miss a Shared Due Date",
    route: "/recurring",
    selector: '[data-tour="recurring-hero"]',
    tag: "Bills",
    icon: Calendar,
    description:
      "Manage subscriptions, rent, and utilities in one centralized place. Calendar view ensures both partners know who pays what and when.",
    highlights: [
      "Assigned payer badge and custom split breakdown",
      "Monthly & annual cost projections",
      "Price hike & unused subscription alerts",
    ],
    tips: "Tip: Switch to Calendar view to see upcoming due dates at a glance.",
    preferredPosition: "bottom",
  },
  {
    id: "analytics",
    title: "Cashflow Trends & Velocity",
    subtitle: "Deep Dive into Spending Habits",
    route: "/analytics",
    selector: '[data-tour="analytics-hero"]',
    tag: "Analytics",
    icon: TrendingUp,
    description:
      "Interactive graphs project your joint wealth growth, category distribution, and net savings velocity over 30, 90, 180 days or 1 year.",
    highlights: [
      "Forecasted savings growth trajectory",
      "Partner spending equity ratio",
      "One-click CSV & JSON export",
    ],
    tips: "Tip: Check the savings velocity to see how fast your joint vault is growing.",
    preferredPosition: "bottom",
  },
  {
    id: "security",
    title: "PIN Vault & Offline PWA",
    subtitle: "Bank-Grade Privacy & Anywhere Access",
    route: "/",
    selector: '[data-tour="header-actions"]',
    tag: "Privacy & Sync",
    icon: Lock,
    description:
      "Lock your app with a 4-digit PIN for private browsing. Log expenses completely offline—they sync to the cloud automatically once reconnected.",
    highlights: [
      "Encrypted 4-digit PIN lock with biometric feel",
      "Offline transaction queue with background sync",
      "Multi-currency selector (USD, EUR, GBP, PHP, JPY)",
    ],
    tips: "Tip: Tap the lock icon in the top header anytime to instantly secure your session!",
    preferredPosition: "bottom",
  },
];

const CHEAT_SHEET_FAQS = [
  {
    category: "Splits & Debts",
    question: "How does Fair Split work if we have unequal incomes?",
    answer:
      "When logging an expense, tap the Split Ratio selector. You can choose 50/50, 60/40, 70/30, or tap 'Custom' to match your exact take-home pay ratio. The Debt Settlement module on the home screen automatically computes who owes what without manual math.",
  },
  {
    category: "Safe-to-Spend",
    question: "How is the Safe-to-Spend daily allowance computed?",
    answer:
      "Safe-to-Spend starts with your monthly shared budget, subtracts fixed recurring bills and savings goal commitments, then divides the remaining discretionary funds by the days left in the month. As you log expenses, it recalculates instantly to keep you on pace.",
  },
  {
    category: "Savings Goals",
    question: "What is Roundup Savings and how do I enable it?",
    answer:
      "Roundup Savings rounds every joint transaction up to the nearest dollar (or $5 unit) and sweeps the spare change into your selected savings goal. Enable it directly on any Goal card via the 'Roundup' toggle.",
  },
  {
    category: "Offline & Privacy",
    question: "Can I log transactions when there is no internet connection?",
    answer:
      "Yes! Babi-Savings is a fully offline-ready PWA. Any transactions logged without network access are queued securely in your browser's IndexedDB/LocalStorage and automatically synced to the cloud once you regain connection.",
  },
  {
    category: "Approvals",
    question: "What is the Large Expense Approval threshold?",
    answer:
      "When logging a high-value purchase (or an unusual expense), toggle 'Require Partner Approval'. A glowing banner will appear on your partner's dashboard allowing them to review and approve the purchase with one tap.",
  },
  {
    category: "Budgets",
    question: "What is the 50/30/20 Smart Calculator in Budgets?",
    answer:
      "Under the Budget tab, tap the '50/30/20' button to open the wizard. Input your combined net monthly income, and it will automatically generate recommended caps: 50% for Needs (Rent, Bills), 30% for Wants (Dining, Entertainment), and 20% for Savings & Debt payoff.",
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function FloatingGuideTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerConfetti } = useApp();

  const [isTourActive, setIsTourActive] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<"cheatsheet" | "navigate">("cheatsheet");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showFirstTimeBadge, setShowFirstTimeBadge] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Target element measurement state
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("bottom");
  const [tooltipCoords, setTooltipCoords] = useState<{ top: number; left: number } | null>(null);

  const resizeObserverRef = useRef<number | null>(null);

  // Check first-time tour state
  useEffect(() => {
    const isCompleted = localStorage.getItem("babi_savings_tour_completed");
    if (!isCompleted) {
      setShowFirstTimeBadge(true);
    }

    const handleOpenTour = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab === "cheatsheet" || customEvent.detail?.tab === "navigate") {
        setHubTab(customEvent.detail.tab);
        setIsHubOpen(true);
        setIsTourActive(false);
      } else {
        handleStartTour();
      }
    };

    window.addEventListener("open-app-tour", handleOpenTour);
    return () => window.removeEventListener("open-app-tour", handleOpenTour);
  }, []);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Measure target DOM element and calculate position
  const measureTarget = useCallback(() => {
    if (!isTourActive || !currentStep) return;

    const el = document.querySelector(currentStep.selector);
    if (!el) {
      setTargetRect(null);
      setTooltipCoords(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const cardWidth = Math.min(360, viewportWidth - 32);
    const cardHeight = 240; // estimated height of card

    // Determine position: above or below target
    let pos: "top" | "bottom" = currentStep.preferredPosition === "top" ? "top" : "bottom";
    if (currentStep.preferredPosition === "auto" || !currentStep.preferredPosition) {
      if (rect.bottom + cardHeight + 20 > viewportHeight && rect.top > cardHeight + 20) {
        pos = "top";
      } else {
        pos = "bottom";
      }
    } else if (pos === "bottom" && rect.bottom + cardHeight + 20 > viewportHeight) {
      pos = "top";
    } else if (pos === "top" && rect.top - cardHeight - 20 < 0) {
      pos = "bottom";
    }

    setTooltipPosition(pos);

    // Calculate left coordinate clamped within screen
    const targetCenterX = rect.left + rect.width / 2;
    let computedLeft = targetCenterX - cardWidth / 2;
    computedLeft = Math.max(16, Math.min(computedLeft, viewportWidth - cardWidth - 16));

    // Calculate top coordinate
    let computedTop = 0;
    if (pos === "bottom") {
      computedTop = rect.bottom + 12;
    } else {
      computedTop = rect.top - 12; // in CSS we can translate-y -100%
    }

    setTooltipCoords({
      top: computedTop,
      left: computedLeft,
    });
  }, [isTourActive, currentStep]);

  // Scroll into view & measure when step changes or route changes
  useEffect(() => {
    if (!isTourActive || !currentStep) return;

    let retries = 0;
    const findAndScroll = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        setTimeout(measureTarget, 200);
      } else if (retries < 10) {
        retries++;
        setTimeout(findAndScroll, 100);
      }
    };

    findAndScroll();

    const handleScrollOrResize = () => {
      if (resizeObserverRef.current) cancelAnimationFrame(resizeObserverRef.current);
      resizeObserverRef.current = requestAnimationFrame(measureTarget);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
      if (resizeObserverRef.current) cancelAnimationFrame(resizeObserverRef.current);
    };
  }, [isTourActive, currentStepIndex, pathname, measureTarget, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTourActive(false);
      } else if (e.key === "ArrowRight") {
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        handlePrevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, currentStepIndex]);

  const handleStartTour = () => {
    setIsHubOpen(false);
    setShowFirstTimeBadge(false);
    setCurrentStepIndex(0);
    setIsTourActive(true);

    if (pathname !== TOUR_STEPS[0].route) {
      router.push(TOUR_STEPS[0].route);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextRoute = TOUR_STEPS[nextIndex].route;
      if (pathname !== nextRoute) {
        router.push(nextRoute);
      }
    } else {
      handleCompleteTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevRoute = TOUR_STEPS[prevIndex].route;
      if (pathname !== prevRoute) {
        router.push(prevRoute);
      }
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem("babi_savings_tour_completed", "true");
    setShowFirstTimeBadge(false);
    triggerConfetti();
    setIsTourActive(false);
  };

  const filteredFaqs = CHEAT_SHEET_FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* 1. First-Time Welcome Prompt (Compact floating invitation on bottom right) */}
      {showFirstTimeBadge && !isTourActive && !isHubOpen && (
        <div className="fixed bottom-20 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 text-white p-3.5 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">Welcome to Babi-Savings!</p>
              <p className="text-[11px] text-white/80 mt-0.5 leading-snug">
                Take a quick spotlight tour to discover where everything is.
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleStartTour}
                  className="px-2.5 py-1 rounded-lg bg-white text-indigo-700 text-xs font-bold hover:bg-white/90 active:scale-95 transition-transform flex items-center space-x-1"
                >
                  <span>Start Tour</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowFirstTimeBadge(false)}
                  className="text-[11px] text-white/70 hover:text-white underline px-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowFirstTimeBadge(false)}
              className="text-white/60 hover:text-white p-1 -mr-1 -mt-1"
              aria-label="Close welcome prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Persistent Guide Trigger Pill (Docked nicely above bottom nav) */}
      {!isTourActive && (
        <div className="fixed bottom-20 right-4 z-40 print:hidden flex items-center space-x-2">
          <button
            onClick={() => setIsHubOpen(true)}
            className="group relative flex items-center space-x-2 pl-3.5 pr-4 py-2.5 rounded-full bg-card/90 dark:bg-slate-900/90 hover:bg-card dark:hover:bg-slate-800 text-foreground border border-border shadow-lg hover:shadow-indigo-500/20 backdrop-blur-md transition-all active:scale-95 hover:border-indigo-500/50 ring-2 ring-primary/20"
            aria-label="Open App Tour & Guide"
            title="App Guide & Feature Tour"
          >
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 opacity-30 group-hover:opacity-75 blur-sm transition duration-300 group-hover:duration-200" />
            <div className="relative flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
                <Compass className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <span className="text-xs font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300 bg-clip-text text-transparent">
                Guide
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 3. ANCHORED SPOTLIGHT TOUR OVERLAY & FLOATING CALLOUT */}
      {isTourActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* A. Non-blocking luminous target highlight ring on target element */}
          {targetRect && (
            <div
              className="absolute pointer-events-none transition-all duration-300 ease-out"
              style={{
                top: `${Math.max(0, targetRect.top - 6)}px`,
                left: `${Math.max(0, targetRect.left - 6)}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
                borderRadius: "20px",
                boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.6), 0 0 25px 8px rgba(45, 212, 191, 0.4)",
                border: "2px solid rgba(255, 255, 255, 0.9)",
              }}
            >
              {/* Pulsing Beacon Dot */}
              <span className="absolute -top-2 -right-2 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 border-2 border-white" />
              </span>
            </div>
          )}

          {/* B. Floating Anchored Dialogue Card */}
          <div
            className="absolute pointer-events-auto transition-all duration-300 ease-out z-50"
            style={{
              top: tooltipCoords
                ? `${tooltipCoords.top}px`
                : "50%",
              left: tooltipCoords
                ? `${tooltipCoords.left}px`
                : "50%",
              transform: tooltipCoords
                ? tooltipPosition === "top"
                  ? "translateY(-100%)"
                  : "translateY(0)"
                : "translate(-50%, -50%)",
              width: "calc(100vw - 32px)",
              maxWidth: "360px",
            }}
          >
            {/* Popover Card Container */}
            <div className="relative bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/40 rounded-3xl p-4 shadow-2xl shadow-indigo-950/40 text-foreground space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Pointer Triangle */}
              {targetRect && tooltipCoords && (
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-card/95 dark:bg-slate-900/95 border-indigo-500/40 rotate-45 ${
                    tooltipPosition === "bottom"
                      ? "-top-2 border-t-2 border-l-2"
                      : "-bottom-2 border-b-2 border-r-2"
                  }`}
                />
              )}

              {/* Card Top: Step Tag, Counter, and Close */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    {currentStep.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {currentStepIndex + 1} / {TOUR_STEPS.length}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Step Progress Dots */}
                  <div className="flex items-center space-x-1 mr-1">
                    {TOUR_STEPS.map((step, idx) => (
                      <span
                        key={step.id}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentStepIndex
                            ? "w-4 bg-primary"
                            : idx < currentStepIndex
                            ? "w-1.5 bg-primary/40"
                            : "w-1.5 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setIsTourActive(false)}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label="Exit tour"
                    title="Exit tour"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step Title & Icon */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                  {React.createElement(currentStep.icon, { className: "w-5 h-5" })}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground leading-tight">
                    {currentStep.title}
                  </h4>
                  <p className="text-[11px] font-medium text-primary mt-0.5 leading-snug">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>

              {/* Quick Tip Pill */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 flex items-start space-x-2">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                  {currentStep.tips}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <button
                  onClick={() => {
                    localStorage.setItem("babi_savings_tour_completed", "true");
                    setIsTourActive(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold px-1"
                >
                  Skip
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStepIndex === 0}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1"
                  >
                    <span>
                      {currentStepIndex === TOUR_STEPS.length - 1
                        ? "Finish 🎉"
                        : "Next"}
                    </span>
                    {currentStepIndex < TOUR_STEPS.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. APP GUIDE & CHEAT SHEET HUB (Accessible from Guide Pill anytime) */}
      {isHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Babi-Savings Guide Hub</h3>
                  <p className="text-[11px] text-muted-foreground">
                    FAQ Cheat Sheet & Quick Navigation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHubOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close guide hub"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-2 bg-muted/20 border-b text-xs font-semibold">
              <button
                onClick={() => setHubTab("cheatsheet")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  hubTab === "cheatsheet"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cheat Sheet & FAQ</span>
              </button>

              <button
                onClick={() => setHubTab("navigate")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  hubTab === "navigate"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>App Feature Map</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {/* TAB 1: FAQ CHEAT SHEET */}
              {hubTab === "cheatsheet" && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search questions (splits, safe-to-spend, goals)..."
                      value={faqSearchQuery}
                      onChange={(e) => setFaqSearchQuery(e.target.value)}
                      className="w-full bg-secondary text-foreground text-xs rounded-xl pl-9 pr-4 py-2 border border-transparent focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredFaqs.map((faq, index) => {
                      const isExpanded = expandedFaqIndex === index;
                      return (
                        <div
                          key={index}
                          className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs transition-colors"
                        >
                          <button
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                            className="w-full p-3.5 text-left flex items-start justify-between space-x-2 hover:bg-secondary/40 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                                {faq.category}
                              </span>
                              <p className="text-xs font-bold text-foreground">{faq.question}</p>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 mt-1 ${
                                isExpanded ? "rotate-90 text-primary" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/20">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: APP MAP & QUICK JUMP */}
              {hubTab === "navigate" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Jump directly to any module in Babi-Savings:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        name: "Home Dashboard",
                        route: "/",
                        desc: "Safe-to-Spend, IOU Split balances, recent joint transactions",
                        icon: ShieldCheck,
                        color: "from-indigo-600 to-indigo-700",
                      },
                      {
                        name: "Budgeting & 50/30/20",
                        route: "/budget",
                        desc: "Category monthly caps, rollover savings, pace calculators",
                        icon: PieChart,
                        color: "from-teal-600 to-teal-700",
                      },
                      {
                        name: "Savings & Wishlists",
                        route: "/goals",
                        desc: "Joint vacation goals, roundups, and lump sum boosts",
                        icon: Target,
                        color: "from-amber-600 to-amber-700",
                      },
                      {
                        name: "Recurring Bills",
                        route: "/recurring",
                        desc: "Split calendar, due-date badges, monthly projection",
                        icon: Calendar,
                        color: "from-rose-600 to-rose-700",
                      },
                      {
                        name: "Cashflow Trends",
                        route: "/analytics",
                        desc: "Spending donuts, monthly trajectories, net savings rate",
                        icon: TrendingUp,
                        color: "from-purple-600 to-purple-700",
                      },
                    ].map((dest) => {
                      const Icon = dest.icon;
                      const isCurrent = pathname === dest.route;
                      return (
                        <button
                          key={dest.route}
                          onClick={() => {
                            router.push(dest.route);
                            setIsHubOpen(false);
                          }}
                          className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all hover:scale-[1.02] active:scale-95 ${
                            isCurrent
                              ? "bg-primary/10 border-primary text-foreground shadow-sm"
                              : "bg-card border-border hover:bg-secondary text-foreground"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${dest.color} flex items-center justify-center text-white shrink-0 shadow-xs`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{dest.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-white">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {dest.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
              <button
                onClick={handleStartTour}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Interactive Spotlight Tour</span>
              </button>

              <button
                onClick={() => setIsHubOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
