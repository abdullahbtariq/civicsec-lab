import type { User } from "../types/api";

export function isAdmin(user: User | null) {
  return user?.role === "admin";
}

export function isAnalyst(user: User | null) {
  return user?.role === "analyst";
}

export function isViewer(user: User | null) {
  return user?.role === "viewer";
}

export function canCreateOperationalRecords(user: User | null) {
  return isAdmin(user) || isAnalyst(user);
}

export function canDeleteOperationalRecords(user: User | null) {
  return isAdmin(user);
}
