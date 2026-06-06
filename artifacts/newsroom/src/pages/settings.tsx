import { useState } from "react";
import { useLocation, Link } from "wouter";
import { usePreferences, NewsPreferences } from "@/hooks/use-preferences";
import { useGetTrendingTopics, GetNewsStyle, getGetNewsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const STYLES = [
  { id: "serious", label: "Serious", description: "Measured. Authoritative. Like The Economist." },
  { id: "punchy", label: "Punchy", description: "Sharp. Snappy. Every word earns its place." },
  { id: "casual", label: "Casual", description: "Relaxed and conversational. Like a smart friend explaining." },
  { id: "genz", label: "Gen Z", description: "No cap. Unhinged but accurate. Fr fr." },
];

export default function Settings() {
  const [, setLocation] = useLocation();
  const { preferences, savePreferences } = usePreferences();
  const { data: trending } = useGetTrendingTopics();
  const queryClient = useQueryClient();

  const [selectedTopics, setSelectedTopics] = useState<string[]>(preferences?.topics || []);
  const [selectedStyle, setSelectedStyle] = useState<GetNewsStyle>(preferences?.style || "serious");
  const [customTopic, setCustomTopic] = useState("");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const addCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics([...selectedTopics, customTopic.trim()]);
      setCustomTopic("");
    }
  };

  const handleSave = () => {
    if (selectedTopics.length > 0) {
      savePreferences({ topics: selectedTopics, style: selectedStyle });
      // Invalidate the news query to force fresh fetch with new style
      queryClient.invalidateQueries({ queryKey: getGetNewsQueryKey() });
      setLocation("/feed");
    }
  };

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-12 md:py-20 font-serif">
      <div className="mb-8">
        <Link href="/feed" className="inline-flex items-center text-sm font-sans uppercase tracking-widest hover:text-muted-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
        </Link>
      </div>

      <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">PREFERENCES</h1>
      <div className="newspaper-rule-double"></div>

      <div className="space-y-12 font-sans mt-12">
        <section>
          <h2 className="text-2xl font-bold font-serif mb-6">Topics</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {trending?.topics.map((t) => (
              <button
                key={t.name}
                onClick={() => toggleTopic(t.name)}
                className={`px-4 py-2 border flex items-center gap-2 transition-colors ${
                  selectedTopics.includes(t.name)
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span>{t.emoji}</span>
                <span className="font-medium">{t.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={addCustomTopic} className="flex gap-2 max-w-sm">
            <Input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Add another topic..."
              className="rounded-none border-foreground focus-visible:ring-foreground"
            />
            <Button type="submit" variant="outline" className="rounded-none border-foreground">
              Add
            </Button>
          </form>
          
          {selectedTopics.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {selectedTopics.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-none px-3 py-1 bg-muted">
                  {t}
                  <button onClick={() => toggleTopic(t)} className="ml-2 hover:text-foreground">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold font-serif mb-6">Reading Style</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STYLES.map((style) => (
              <div
                key={style.id}
                onClick={() => setSelectedStyle(style.id as GetNewsStyle)}
                className={`p-6 border cursor-pointer transition-colors ${
                  selectedStyle === style.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                <h3 className="text-xl font-bold font-serif mb-2">{style.label}</h3>
                <p className={`text-sm ${selectedStyle === style.id ? "text-background/80" : "text-muted-foreground"}`}>
                  {style.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-8 flex gap-4">
          <Button
            onClick={handleSave}
            disabled={selectedTopics.length === 0}
            size="lg"
            className="w-full sm:w-auto rounded-none font-serif text-lg px-12 py-6 bg-foreground text-background hover:bg-foreground/90"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
