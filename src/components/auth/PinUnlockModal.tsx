"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Lock, Delete, ShieldCheck } from "lucide-react";

export function PinUnlockModal() {
  const { isPinLocked, unlockWithPin, currentUser } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isPinLocked) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const success = await unlockWithPin(nextPin);
      setIsVerifying(false);
      if (!success) {
        setError(true);
        setTimeout(() => {
          setPin("");
        }, 600);
      } else {
        setPin("");
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-1">
          Welcome back, {currentUser.nickname || currentUser.name.split(" ")[0]}
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Enter your 4-digit PIN to unlock session
        </p>

        {/* 4 Pin Dots */}
        <div className="flex justify-center space-x-4 mb-8">
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? "bg-destructive scale-110 animate-shake"
                    : filled
                    ? "bg-primary scale-115 shadow-md shadow-primary/30"
                    : "border-2 border-muted-foreground/30 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium mb-4 animate-in fade-in">
            Incorrect PIN code.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-card border text-lg font-semibold hover:bg-secondary active:scale-90 transition-all flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin("")}
            className="h-14 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary/50 active:scale-95 transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-card border text-lg font-semibold hover:bg-secondary active:scale-90 transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl text-muted-foreground hover:bg-secondary active:scale-90 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
