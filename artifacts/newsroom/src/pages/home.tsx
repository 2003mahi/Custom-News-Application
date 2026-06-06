import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePreferences } from "@/hooks/use-preferences";

export default function Home() {
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();

  useEffect(() => {
    if (preferences && preferences.topics.length > 0) {
      setLocation("/feed");
    } else {
      setLocation("/setup");
    }
  }, [preferences, setLocation]);

  return null;
}
