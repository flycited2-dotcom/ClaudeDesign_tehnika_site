"use client";

import { useSyncExternalStore } from "react";

const EMPTY: number[] = [];

function readList(key: string): number[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((value): value is number => Number.isInteger(value));
  } catch {
    return EMPTY;
  }
}

function writeList(key: string, eventName: string, items: number[]) {
  // localStorage.setItem can throw (private mode / quota exceeded). Don't let a
  // storage failure swallow the toggle silently and leave the UI inconsistent —
  // log it, but still dispatch so subscribers re-read whatever did persist.
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn(`[sku-list-storage] failed to persist "${key}"`, error);
  }
  window.dispatchEvent(new Event(eventName));
}

function subscribeFactory(eventName: string) {
  return (callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(eventName, callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(eventName, callback);
    };
  };
}

function snapshotFactory(key: string) {
  let cachedRaw = "";
  let cachedList: number[] = EMPTY;
  return () => {
    const raw = window.localStorage.getItem(key) ?? "[]";
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    cachedList = readList(key);
    return cachedList;
  };
}

function getServerSnapshot() {
  return EMPTY;
}

export const FAV_KEY = "techno_market_favorites_v1";
export const FAV_EVENT = "favorites:changed";
export const COMPARE_KEY = "techno_market_compare_v1";
export const COMPARE_EVENT = "compare:changed";
export const COMPARE_MAX = 4;
export const RECENT_KEY = "techno_market_recent_v1";
export const RECENT_EVENT = "recent:changed";
export const RECENT_MAX = 12;

const subscribeFav = subscribeFactory(FAV_EVENT);
const subscribeCompare = subscribeFactory(COMPARE_EVENT);
const subscribeRecent = subscribeFactory(RECENT_EVENT);
const snapshotFav = snapshotFactory(FAV_KEY);
const snapshotCompare = snapshotFactory(COMPARE_KEY);
const snapshotRecent = snapshotFactory(RECENT_KEY);

export function useFavorites() {
  return useSyncExternalStore(subscribeFav, snapshotFav, getServerSnapshot);
}

export function useCompare() {
  return useSyncExternalStore(subscribeCompare, snapshotCompare, getServerSnapshot);
}

export function useRecentlyViewed() {
  return useSyncExternalStore(subscribeRecent, snapshotRecent, getServerSnapshot);
}

export function toggleFavorite(sku: number) {
  const current = readList(FAV_KEY);
  const next = current.includes(sku) ? current.filter((value) => value !== sku) : [...current, sku];
  writeList(FAV_KEY, FAV_EVENT, next);
}

export function toggleCompare(sku: number): { ok: boolean; message?: string } {
  const current = readList(COMPARE_KEY);
  if (current.includes(sku)) {
    writeList(COMPARE_KEY, COMPARE_EVENT, current.filter((value) => value !== sku));
    return { ok: true };
  }
  if (current.length >= COMPARE_MAX) {
    return { ok: false, message: `В сравнении максимум ${COMPARE_MAX} товаров — уберите один` };
  }
  writeList(COMPARE_KEY, COMPARE_EVENT, [...current, sku]);
  return { ok: true };
}

export function clearFavorites() {
  writeList(FAV_KEY, FAV_EVENT, []);
}

export function clearCompare() {
  writeList(COMPARE_KEY, COMPARE_EVENT, []);
}

/** Records a product view — most-recent-first, deduped, capped at RECENT_MAX. */
export function recordRecentlyViewed(sku: number) {
  const current = readList(RECENT_KEY);
  const next = [sku, ...current.filter((value) => value !== sku)].slice(0, RECENT_MAX);
  writeList(RECENT_KEY, RECENT_EVENT, next);
}

export function clearRecentlyViewed() {
  writeList(RECENT_KEY, RECENT_EVENT, []);
}
