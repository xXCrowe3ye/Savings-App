"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  highlights: string[];
  tips: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Babi-Savings",
    subtitle: "Private Joint Finance for Couples",
    route: "/",
    tag: "Overview",
    icon: Sparkles,
    description:
      "A stress-free financial sanctuary built specifically for couples. Track joint expenses, split costs fairly without awkward money talks, and build your shared wealth together in real time.",
    highlights: [
      "No bank account linking required for ultimate privacy",
      "Seamless cloud sync between both partner devices",
      "Real-time visibility without feeling micromanaged",
    ],
    tips: "Tip: Customize your nicknames, avatar photos, and theme colors in the Top Profile anytime!",
  },
  {
    id: "safe-to-spend",
    title: "Safe-to-Spend Allowance",
    subtitle: "Your Daily Spending Guardrail",
    route: "/",
    tag: "Dashboard",
    icon: ShieldCheck,
    description:
      "Our smart algorithm calculates exactly how much you can spend per day without falling short on upcoming bills, monthly budget caps, or savings targets.",
    highlights: [
      "Dynamic daily allowance updated with every expense",
      "Pace status (On Track, Caution, Over Pace)",
      "Daily vs. Month-to-Date breakdown",
    ],
    tips: "Tip: Stay in the green to guarantee your month-end savings goal is met!",
  },
  {
    id: "quick-log",
    title: "Center [+] Rapid Log & Split",
    subtitle: "Log Expenses in 5 Seconds",
    route: "/",
    tag: "Quick Action",
    icon: PlusCircle,
    description:
      "Tap the glowing center [+] button anytime to record an expense. Choose equal 50/50 splits, income-proportional ratios, or 100/0 solo funding with optional receipt attachments.",
    highlights: [
      "50/50, 60/40, 70/30 or custom income-weighted split",
      "Spare-change roundups swept into joint savings",
      "Partner approval alerts for high-value purchases",
    ],
    tips: "Tip: Set a large expense threshold (e.g. $100) to notify your partner before finalizing!",
  },
  {
    id: "budgets",
    title: "Shared Category Budgets",
    subtitle: "Flexible Caps with Rollovers",
    route: "/budget",
    tag: "Budgets",
    icon: PieChart,
    description:
      "Organize shared living expenses into clear categories like Groceries, Rent, Utilities, and Dining. Unspent funds rollover to the next month as a reward for disciplined spending.",
    highlights: [
      "Live percentage bars and pace-per-day gauges",
      "50/30/20 Rule Smart Budget Calculator modal",
      "Automatic rollover accumulation for surplus cash",
    ],
    tips: "Tip: Tap '50/30/20' at the top of the Budget tab to automatically balance your joint income!",
  },
  {
    id: "goals",
    title: "Joint Savings & Wishlists",
    subtitle: "Fund Dreams & Vacations Together",
    route: "/goals",
    tag: "Goals",
    icon: Target,
    description:
      "Create shared targets for emergency funds, dream vacations, weddings, or home renovations. Contribute individually or jointly and track your milestone progress visually.",
    highlights: [
      "Target dates with required monthly pacing",
      "One-tap 'Boost Goal' with celebratory confetti",
      "Automatic spare-change roundup integrations",
    ],
    tips: "Tip: Turn on 'Roundup Savings' on your top goal to build wealth effortlessly from daily coffee runs!",
  },
  {
    id: "recurring",
    title: "Recurring Bills & Calendar",
    subtitle: "Never Miss a Shared Due Date",
    route: "/recurring",
    tag: "Bills",
    icon: Calendar,
    description:
      "Manage subscriptions, rent, insurance, and utilities in one centralized dashboard. Visual calendar view and due-date alerts ensure both partners know who is responsible.",
    highlights: [
      "Assigned payer badge and custom split breakdown",
      "Monthly and annual cost projections",
      "Color-coded status (Due Soon, Overdue, Paid)",
    ],
    tips: "Tip: Mark bills as paid with one tap to automatically log the transaction into your shared history!",
  },
  {
    id: "analytics",
    title: "Cashflow Trends & Insights",
    subtitle: "Deep Dive into Spending Habits",
    route: "/analytics",
    tag: "Analytics",
    icon: TrendingUp,
    description:
      "Gain total transparency into your couple cashflow. Interactive category donut charts, monthly spending trajectories, and partner contribution breakdowns highlight your financial strengths.",
    highlights: [
      "Interactive category donut charts with tap breakdown",
      "Monthly cashflow comparison and net savings rate",
      "Partner-by-partner contribution equity gauge",
    ],
    tips: "Tip: Check the Net Savings Rate monthly to measure your collective financial velocity!",
  },
  {
    id: "security",
    title: "PIN Vault & Offline PWA Sync",
    subtitle: "Total Privacy & Anywhere Access",
    route: "/",
    tag: "Privacy & Sync",
    icon: Lock,
    description:
      "Your financial intimacy is protected. Lock your app with a 4-digit PIN for private viewing. Log expenses completely offline on flights or underground subways—they sync automatically upon reconnecting.",
    highlights: [
      "Encrypted 4-digit PIN lock with biometric feel",
      "Offline transaction queue with background sync",
      "Installable as a standalone Progressive Web App (PWA)",
    ],
    tips: "Tip: Tap the lock icon in the top header anytime to instantly secure your session!",
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

export function FloatingGuideTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerConfetti } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tour" | "cheatsheet" | "navigate">("tour");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showFirstTimeBadge, setShowFirstTimeBadge] = useState(false);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Check if user has completed tour previously
  useEffect(() => {
    const isCompleted = localStorage.getItem("babi_savings_tour_completed");
    if (!isCompleted) {
      setShowFirstTimeBadge(true);
    }

    // Global listener so Header / Profile can trigger the tour
    const handleOpenTour = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-app-tour", handleOpenTour);
    return () => window.removeEventListener("open-app-tour", handleOpenTour);
  }, []);

  // Keyboard navigation for tour
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowRight" && activeTab === "tour") {
        handleNextStep();
      } else if (e.key === "ArrowLeft" && activeTab === "tour") {
        handlePrevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab, currentStepIndex]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleStartTour = () => {
    setActiveTab("tour");
    setCurrentStepIndex(0);
    setIsOpen(true);
    setShowFirstTimeBadge(false);
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
      // Tour completed!
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

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const targetRoute = TOUR_STEPS[index].route;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem("babi_savings_tour_completed", "true");
    setShowFirstTimeBadge(false);
    triggerConfetti();
    setIsOpen(false);
  };

  const filteredFaqs = CHEAT_SHEET_FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* 1. First-time User Welcome Banner (Floating above bottom right) */}
      {showFirstTimeBadge && !isOpen && (
        <div className="fixed bottom-20 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 text-white p-3.5 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">Welcome to Babi-Savings!</p>
              <p className="text-[11px] text-white/80 mt-0.5 leading-snug">
                Take a 1-minute interactive tour to master all couple features.
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

      {/* 2. Floating Interactive Guide Trigger Bubble (Docked above bottom nav on right) */}
      <div className="fixed bottom-20 right-4 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2 pl-3.5 pr-4 py-2.5 rounded-full bg-card/90 dark:bg-slate-900/90 hover:bg-card dark:hover:bg-slate-800 text-foreground border border-border shadow-lg hover:shadow-indigo-500/20 backdrop-blur-md transition-all active:scale-95 hover:border-indigo-500/50 ring-2 ring-primary/20"
          aria-label="Open App Tour & Guide"
          title="App Guide & Feature Tour"
        >
          {/* Animated Glowing Ring */}
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

      {/* 3. Interactive Modal / Tour Spotlight Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Babi-Savings Guide</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Interactive Walkthrough & Feature Map
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-muted/20 border-b text-xs font-semibold">
              <button
                onClick={() => setActiveTab("tour")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === "tour"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Tour</span>
              </button>

              <button
                onClick={() => setActiveTab("cheatsheet")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === "cheatsheet"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cheat Sheet</span>
              </button>

              <button
                onClick={() => setActiveTab("navigate")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === "navigate"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>App Map</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {/* TAB 1: STEP-BY-STEP INTERACTIVE TOUR */}
              {activeTab === "tour" && (
                <div className="space-y-4">
                  {/* Step Progress & Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {currentStep.tag}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                      </span>
                    </div>

                    {/* Step Dots */}
                    <div className="flex items-center space-x-1">
                      {TOUR_STEPS.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => handleJumpToStep(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentStepIndex
                              ? "w-5 bg-primary"
                              : idx < currentStepIndex
                              ? "w-2 bg-primary/40"
                              : "w-1.5 bg-muted-foreground/30"
                          }`}
                          aria-label={`Jump to step ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Main Step Card */}
                  <div className="bg-gradient-to-br from-indigo-500/10 via-teal-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-5 space-y-3 relative overflow-hidden">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                        {React.createElement(currentStep.icon, { className: "w-6 h-6" })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-base text-foreground leading-tight">
                          {currentStep.title}
                        </h4>
                        <p className="text-xs font-semibold text-primary mt-0.5">
                          {currentStep.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {currentStep.description}
                    </p>

                    {/* Key Highlights */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Key Capabilities:
                      </p>
                      {currentStep.highlights.map((h, i) => (
                        <div key={i} className="flex items-start space-x-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start space-x-2.5">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                        {currentStep.tips}
                      </p>
                    </div>

                    {/* Live Screen Route Status */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/50">
                      <span>Currently viewing screen:</span>
                      <button
                        onClick={() => {
                          if (pathname !== currentStep.route) {
                            router.push(currentStep.route);
                          }
                        }}
                        className="font-mono text-primary font-bold hover:underline flex items-center space-x-1"
                      >
                        <span>{currentStep.route}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHEAT SHEET & FAQ HUB */}
              {activeTab === "cheatsheet" && (
                <div className="space-y-4">
                  {/* Search Bar */}
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

                  {/* FAQ Accordion List */}
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

                    {filteredFaqs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No matches found. Try searching for &quot;split&quot; or &quot;budget&quot;.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: APP MAP & QUICK JUMP */}
              {activeTab === "navigate" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Tap any screen below to navigate immediately and view its features:
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
                            setIsOpen(false);
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

            {/* Modal Footer Controls */}
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
              {activeTab === "tour" ? (
                <>
                  <button
                    onClick={() => {
                      localStorage.setItem("babi_savings_tour_completed", "true");
                      setIsOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
                  >
                    Skip Tour
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevStep}
                      disabled={currentStepIndex === 0}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={handleNextStep}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5"
                    >
                      <span>
                        {currentStepIndex === TOUR_STEPS.length - 1
                          ? "Complete Tour 🎉"
                          : "Next Step"}
                      </span>
                      {currentStepIndex < TOUR_STEPS.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <button
                    onClick={handleStartTour}
                    className="text-xs text-primary hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Step-by-Step Tour</span>
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Got It
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
