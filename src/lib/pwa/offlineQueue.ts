/**
 * IndexedDB Offline Transaction Queue & Auto-Sync
 */

import { Transaction } from "@/types";

const DB_NAME = "babi_savings_offline_db";
const STORE_NAME = "offline_transactions";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineTransaction(
  tx: Omit<Transaction, "id" | "createdAt">
): Promise<Transaction> {
  const offlineTx: Transaction = {
    ...tx,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    createdAt: new Date().toISOString(),
    syncedOffline: true,
  };

  try {
    const db = await openDB();
    const txStore = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
    txStore.put(offlineTx);
  } catch (err) {
    console.warn("Failed to store in IndexedDB, saving to localStorage:", err);
    const existing = JSON.parse(localStorage.getItem("babi_savings_offline_txs") || "[]");
    existing.push(offlineTx);
    localStorage.setItem("babi_savings_offline_txs", JSON.stringify(existing));
  }

  return offlineTx;
}

export async function getQueuedTransactions(): Promise<Transaction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const txStore = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
      const req = txStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    const existing = JSON.parse(localStorage.getItem("babi_savings_offline_txs") || "[]");
    return existing;
  }
}

export async function syncOfflineTransactions(
  onSynced?: (syncedCount: number) => void
): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const queued = await getQueuedTransactions();
  if (queued.length === 0) return 0;

  let successCount = 0;
  for (const item of queued) {
    try {
      const { id, syncedOffline, ...payload } = item;
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        successCount++;
        // Remove from IndexedDB
        const db = await openDB();
        const txStore = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
        txStore.delete(item.id);
      }
    } catch (err) {
      console.error("Failed to sync offline item:", err);
    }
  }

  // Clear localStorage fallback if present
  localStorage.removeItem("babi_savings_offline_txs");

  if (onSynced && successCount > 0) {
    onSynced(successCount);
  }

  return successCount;
}
