"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  Camera,
  Sparkles,
  Check,
  Palette,
  User,
  Loader2,
  Compass,
  Sun,
  Moon,
  Monitor,
  PaintBucket,
  Layers,
  Wand2,
  TrendingUp,
} from "lucide-react";
import { ThemeMode, BackgroundTheme } from "@/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_ACCENTS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Sky Blue", hex: "#0284c7" },
  { name: "Hot Fuchsia", hex: "#d946ef" },
  { name: "Sunset Coral", hex: "#f97316" },
  { name: "Slate", hex: "#475569" },
];

const BACKGROUND_THEMES: {
  id: BackgroundTheme;
  name: string;
  desc: string;
  darkBg: string;
  lightBg: string;
}[] = [
  { id: "default", name: "Slate", desc: "Balanced slate", darkBg: "#090d16", lightBg: "#f8fafc" },
  { id: "pink", name: "Pink", desc: "Blush sakura", darkBg: "#12060e", lightBg: "#fdf4f8" },
  { id: "blue", name: "Sky Blue", desc: "Polar ocean", darkBg: "#050d18", lightBg: "#f0f8ff" },
  { id: "yellow", name: "Sunny", desc: "Warm butter", darkBg: "#120f04", lightBg: "#fefcf0" },
  { id: "purple", name: "Lavender", desc: "Royal violet", darkBg: "#0c0517", lightBg: "#fbf7ff" },
  { id: "coral", name: "Peach", desc: "Sunset amber", darkBg: "#140804", lightBg: "#fff8f3" },
  { id: "forest", name: "Mint Pine", desc: "Fresh mint", darkBg: "#050e09", lightBg: "#f1fbf5" },
  { id: "midnight", name: "Navy", desc: "Ocean deep", darkBg: "#040914", lightBg: "#f0f5fc" },
  { id: "warm", name: "Espresso", desc: "Cozy coffee", darkBg: "#110d0a", lightBg: "#faf6f0" },
  { id: "oled", name: "OLED", desc: "Pitch black", darkBg: "#000000", lightBg: "#ffffff" },
];

const AESTHETIC_PRESETS = [
  {
    name: "Sakura Blossom",
    emoji: "🌸",
    bg: "pink" as BackgroundTheme,
    accent: "#f43f5e",
    desc: "Soft pink & rose glow",
  },
  {
    name: "Nordic Ocean",
    emoji: "🌊",
    bg: "blue" as BackgroundTheme,
    accent: "#0d9488",
    desc: "Polar sky & ocean teal",
  },
  {
    name: "Golden Sunset",
    emoji: "☀️",
    bg: "yellow" as BackgroundTheme,
    accent: "#f59e0b",
    desc: "Warm butter & golden amber",
  },
  {
    name: "Cyber Amethyst",
    emoji: "🔮",
    bg: "purple" as BackgroundTheme,
    accent: "#8b5cf6",
    desc: "Neon violet & royal purple",
  },
  {
    name: "Emerald Oasis",
    emoji: "🌿",
    bg: "forest" as BackgroundTheme,
    accent: "#10b981",
    desc: "Pine mist & emerald green",
  },
  {
    name: "OLED Luxury",
    emoji: "🖤",
    bg: "oled" as BackgroundTheme,
    accent: "#6366f1",
    desc: "Pure pitch black & indigo",
  },
  {
    name: "Cozy Mocha",
    emoji: "☕",
    bg: "warm" as BackgroundTheme,
    accent: "#f97316",
    desc: "Espresso & sunset coral",
  },
  {
    name: "Titanium Slate",
    emoji: "🪙",
    bg: "default" as BackgroundTheme,
    accent: "#0284c7",
    desc: "Modern slate & sky cyan",
  },
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const {
    currentUser,
    updateProfile,
    refreshData,
    themeMode,
    setThemeMode,
    themeAccent: currentAccent,
    setThemeAccent: setGlobalThemeAccent,
    backgroundTheme,
    setBackgroundTheme,
    customBgColor,
    setCustomBgColor,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"theme" | "profile">("theme");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeAccent, setThemeAccent] = useState("#6366f1");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initialNickname =
        currentUser.nickname ||
        (currentUser.name !== "Partner A" && currentUser.name !== "Partner B"
          ? currentUser.name
          : "");
      setNickname(initialNickname);
      setAvatarUrl(currentUser.avatarUrl || "");
      setThemeAccent(currentUser.themeAccent || "#6366f1");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("babi_onboarding_shown", "true");
    }
    onClose();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.receiptUrl);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("babi_onboarding_shown", "true");
      }
      await updateProfile(nickname, avatarUrl, themeAccent);
      await refreshData();
      onClose();
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (bg: BackgroundTheme, accentHex: string) => {
    setBackgroundTheme(bg);
    setThemeAccent(accentHex);
    setGlobalThemeAccent(accentHex);
  };

  const isNewProfile =
    !currentUser.nickname ||
    currentUser.nickname === "Partner A" ||
    currentUser.nickname === "Partner B";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-card/95 backdrop-blur-2xl border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between bg-secondary/30">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm text-white"
              style={{ backgroundColor: themeAccent }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight">
                {isNewProfile ? "Welcome Setup" : "Appearance & Profile Studio"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Personalized specifically for your device & view
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Top Navigation Tabs */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 bg-secondary/70 rounded-2xl border">
            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === "theme"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Theme & Colors</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                activeTab === "profile"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Profile Info</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
          
          {activeTab === "theme" ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Interactive Live Preview Mini-Card */}
              <div
                className="p-3.5 rounded-2xl border shadow-sm transition-all duration-300 relative overflow-hidden"
                style={{
                  background:
                    backgroundTheme === "custom"
                      ? customBgColor
                      : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Live Theme Preview</span>
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-xs"
                    style={{ backgroundColor: themeAccent }}
                  >
                    Active View
                  </span>
                </div>

                <div className="bg-card/90 backdrop-blur-md p-3 rounded-xl border border-border/70 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-9 h-9 rounded-full border-2 flex items-center justify-center overflow-hidden bg-secondary shadow-xs"
                      style={{ borderColor: themeAccent }}
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {nickname || "Your Nickname"}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span>$4,250.00 MTD Savings</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
                    style={{ backgroundColor: themeAccent }}
                  >
                    Log +
                  </button>
                </div>
              </div>

              {/* Display Mode: Day / Night / System */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Display Mode</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal capitalize">
                    {themeMode === "system" ? "Follows Device" : `${themeMode} mode`}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-secondary/50 rounded-2xl border">
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      themeMode === "light"
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Day</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      themeMode === "dark"
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Night</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("system")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      themeMode === "system"
                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-teal-400" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Aesthetic Harmonies */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Curated Color Harmonies</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    1-Click Matched Styles
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {AESTHETIC_PRESETS.map((preset) => {
                    const isSelected =
                      backgroundTheme === preset.bg &&
                      themeAccent.toLowerCase() === preset.accent.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset.bg, preset.accent)}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs scale-[1.02]"
                            : "hover:bg-secondary/60 opacity-85 hover:opacity-100"
                        }`}
                      >
                        <span className="text-base leading-none">{preset.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold truncate leading-tight">
                            {preset.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate">
                            {preset.desc.split("&")[0]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Canvas Styles */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PaintBucket className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Background Canvas Palette</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Tones dark & light modes
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {BACKGROUND_THEMES.map((bg) => (
                    <button
                      type="button"
                      key={bg.id}
                      onClick={() => setBackgroundTheme(bg.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                        backgroundTheme === bg.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                          : "hover:bg-secondary/60 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border shadow-xs"
                          style={{ backgroundColor: bg.darkBg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border shadow-xs"
                          style={{ backgroundColor: bg.lightBg }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-center leading-none">
                        {bg.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Accent Color Swatches */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>UI Accent & Button Color</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Buttons, badges & glow
                  </span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {THEME_ACCENTS.map((color) => (
                    <button
                      type="button"
                      key={color.hex}
                      onClick={() => {
                        setThemeAccent(color.hex);
                        setGlobalThemeAccent(color.hex);
                      }}
                      title={color.name}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all ${
                        themeAccent.toLowerCase() === color.hex.toLowerCase()
                          ? "ring-2 ring-foreground ring-offset-2 scale-110 shadow-md"
                          : "hover:scale-105 opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {themeAccent.toLowerCase() === color.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Canvas Color Wheel */}
              <div className="p-2.5 rounded-2xl border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <input
                      type="color"
                      value={customBgColor || "#1e1b4b"}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        setBackgroundTheme("custom");
                      }}
                      className="w-8 h-8 rounded-xl border cursor-pointer opacity-0 absolute inset-0 z-10"
                      title="Choose custom background hex"
                    />
                    <div
                      className="w-8 h-8 rounded-xl border shadow-sm flex items-center justify-center cursor-pointer pointer-events-none"
                      style={{ backgroundColor: customBgColor || "#1e1b4b" }}
                    >
                      <Palette className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Custom Hex Canvas Color</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {customBgColor.toUpperCase()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBackgroundTheme("custom")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    backgroundTheme === "custom"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  }`}
                >
                  {backgroundTheme === "custom" ? "Active" : "Apply"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Avatar Photo Section */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full border-4 shadow-md flex items-center justify-center overflow-hidden bg-secondary"
                    style={{ borderColor: themeAccent }}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                    title="Upload Profile Picture"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground mt-2">
                  Tap camera icon to upload custom avatar
                </span>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Your Nickname / Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hanz / Julia"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              {/* Partner Role / Email */}
              <div className="p-3 rounded-xl bg-secondary/40 border text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Logged in partner</div>
                  <div className="text-[11px] text-muted-foreground">{currentUser.email || "Couple Partner Account"}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                  {currentUser.partnerKey === "partner_a" ? "Partner A" : "Partner B"}
                </span>
              </div>

              {/* Re-run Tour Button */}
              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent("open-app-tour", { detail: { tab: "tour" } }));
                  }}
                  className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1.5 py-1"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Re-take App Tour & Interactive Guide</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || !nickname}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Appearance</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
