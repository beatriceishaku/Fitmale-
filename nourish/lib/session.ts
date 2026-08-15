"use client";

const USER_KEY = "nourish_user_id";
const CHECKIN_KEY = "nourish_today_checkin_id";

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function setUserId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, id);
}

export function getTodayCheckInId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHECKIN_KEY);
}

export function setTodayCheckInId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKIN_KEY, id);
}
