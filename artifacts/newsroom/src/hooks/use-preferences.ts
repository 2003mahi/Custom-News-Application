import { useState, useEffect } from "react";
import { GetNewsStyle } from "@workspace/api-client-react";

export type NewsPreferences = {
  topics: string[];
  style: GetNewsStyle;
};

const STORAGE_KEY = "newsPreferences";

export function usePreferences() {
  const [preferences, setPreferences] = useState<NewsPreferences | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse preferences from localStorage", e);
    }
    return null;
  });

  const savePreferences = (newPrefs: NewsPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
  };

  return { preferences, savePreferences };
}
