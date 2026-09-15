"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Camera, Sparkles, Check, Palette, User, Loader2, Compass, Sun, Moon, Monitor, PaintBucket } from "lucide-react";
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

const BACKGROUND_THEMES: { id: BackgroundTheme; name: string; desc: string; darkBg: string; lightBg: string }[] = [
  { id: "default", name: "Default Slate", desc: "Modern balanced dark slate", darkBg: "#090d16", lightBg: "#f8fafc" },
  { id: "oled", name: "OLED Black", desc: "Pitch black for OLED displays", darkBg: "#000000", lightBg: "#ffffff" },
  { id: "midnight", name: "Midnight Navy", desc: "Deep oceanic blue tint", darkBg: "#060d1d", lightBg: "#f0f4f9" },
  { id: "warm", name: "Warm Espresso", desc: "Cozy coffee & warm cream", darkBg: "#14120e", lightBg: "#faf7f2" },
  { id: "forest", name: "Deep Forest", desc: "Rich pine & mint backdrop", darkBg: "#08140f", lightBg: "#f2f8f5" },
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
  } = useApp();

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

  const isNewProfile =
    !currentUser.nickname ||
    currentUser.nickname === "Partner A" ||
    currentUser.nickname === "Partner B";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-card border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isNewProfile ? "Welcome! Setup Your Profile" : "Personalize Profile"}
              </h3>
              <p className="text-xs text-muted-foreground">{currentUser.email || "Babi-Savings Partner"}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isNewProfile && (
          <div className="mt-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-start space-x-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <b className="font-semibold">First-Time Setup:</b>
              <p className="text-[11px] mt-0.5 opacity-90">
                Please enter your nickname, upload a photo, and pick your color so you and your partner can easily identify each other&apos;s contributions.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
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
              Tap camera to upload custom photo
            </span>
          </div>

          {/* Nickname */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Your Nickname / Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hanz / Julia"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border rounded-xl outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Theme Mode (Night / Day / System) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Display Appearance</span>
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {themeMode === "system" ? "Follows Device" : `${themeMode} mode`}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-secondary/60 rounded-2xl border">
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

          {/* Theme Accent Color */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>Partner Theme Accent</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Personalized per user</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {THEME_ACCENTS.map((color) => (
                <button
                  type="button"
                  key={color.hex}
                  onClick={() => {
                    setThemeAccent(color.hex);
                    setGlobalThemeAccent(color.hex);
                  }}
                  title={color.name}
                  className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                    themeAccent.toLowerCase() === color.hex.toLowerCase()
                      ? "ring-2 ring-foreground ring-offset-2 scale-105 shadow-md"
                      : "hover:scale-105 opacity-85 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {themeAccent.toLowerCase() === color.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Canvas Style */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <PaintBucket className="w-3.5 h-3.5 text-indigo-500" />
                <span>Background Canvas Style</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Adjusts dark & light tone</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {BACKGROUND_THEMES.map((bg) => (
                <button
                  type="button"
                  key={bg.id}
                  onClick={() => setBackgroundTheme(bg.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    backgroundTheme === bg.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                      : "hover:bg-secondary/60 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Dark / Light swatch bubble */}
                    <div className="flex -space-x-1 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border shadow-xs"
                        style={{ backgroundColor: bg.darkBg }}
                        title="Dark Tone"
                      />
                      <span
                        className="w-4 h-4 rounded-full border shadow-xs"
                        style={{ backgroundColor: bg.lightBg }}
                        title="Light Tone"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{bg.name}</div>
                      <div className="text-[10px] text-muted-foreground">{bg.desc}</div>
                    </div>
                  </div>
                  {backgroundTheme === bg.id && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving || !nickname}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
          </button>

          {/* Re-run Tour Button */}
          <div className="pt-2 border-t flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("open-app-tour", { detail: { tab: "tour" } }));
              }}
              className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1.5 py-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Re-take App Tour & Guide</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
