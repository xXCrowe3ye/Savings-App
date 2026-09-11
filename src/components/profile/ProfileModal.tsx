"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Camera, Sparkles, Check, Palette, User, Loader2 } from "lucide-react";

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
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateProfile, refreshData } = useApp();

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

          {/* Theme Accent Color */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              <span>Partner Accent Color</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {THEME_ACCENTS.map((color) => (
                <button
                  type="button"
                  key={color.hex}
                  onClick={() => setThemeAccent(color.hex)}
                  className={`h-10 rounded-xl flex items-center justify-center transition-all ${
                    themeAccent === color.hex
                      ? "ring-2 ring-foreground ring-offset-2 scale-105 shadow-sm"
                      : "hover:scale-105 opacity-80"
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {themeAccent === color.hex && <Check className="w-4 h-4 text-white" />}
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
        </form>
      </div>
    </div>
  );
}
