import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePreferences } from "@/hooks/use-preferences";
import { useGetNews, useGetNewsStatus, getGetNewsQueryKey, getGetNewsStatusQueryKey } from "@workspace/api-client-react";
import { Settings, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Feed() {
  const [, setLocation] = useLocation();
  const { preferences } = usePreferences();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!preferences || preferences.topics.length === 0) {
      setLocation("/setup");
    }
  }, [preferences, setLocation]);

  if (!preferences) return null;

  const topicsString = preferences.topics.join(",");
  const newsParams = { topics: topicsString, style: preferences.style };
  const statusParams = { topics: topicsString };

  const { data: news, isLoading, refetch } = useGetNews(
    newsParams,
    { query: { enabled: !!topicsString, queryKey: getGetNewsQueryKey(newsParams) } }
  );

  const { data: status } = useGetNewsStatus(
    statusParams,
    { query: { enabled: !!topicsString, refetchInterval: 60000, queryKey: getGetNewsStatusQueryKey(statusParams) } }
  );

  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: getGetNewsQueryKey({ topics: topicsString, style: preferences.style }) });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Bar */}
      <div className="border-b border-border py-2 px-4 flex justify-between items-center text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <div>
          {status?.lastRefreshed ? `Last updated ${new Date(status.lastRefreshed).toLocaleTimeString()}` : "Loading..."}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleRefresh} className="hover:text-foreground transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <Link href="/settings" className="hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 mt-8 md:mt-12">
        {/* Masthead */}
        <header className="text-center mb-8">
          <h1 className="font-serif text-6xl md:text-8xl lg:text-[140px] font-black tracking-tighter leading-none mb-4">
            {news?.masthead || "THE DAILY"}
          </h1>
          <div className="newspaper-rule-double"></div>
          <div className="flex justify-between items-center font-serif text-sm md:text-base italic">
            <span>Vol. I — No. 1</span>
            <span>{news?.edition || new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="hidden md:inline">The Independent Voice</span>
          </div>
          <div className="newspaper-rule mt-2"></div>
        </header>

        {isLoading ? (
          <div className="animate-pulse space-y-12">
            <div className="h-64 bg-muted w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-40 bg-muted col-span-2"></div>
              <div className="h-40 bg-muted"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {news?.sections.map((section) => (
              <section key={section.topic}>
                <h2 className="font-sans font-bold text-2xl uppercase tracking-widest border-b-[3px] border-foreground pb-2 mb-6">
                  {section.headline}
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Hero Article */}
                  {section.articles.length > 0 && (
                    <div className="lg:col-span-8 border-r-0 lg:border-r border-border lg:pr-8">
                      <article className="group">
                        {section.articles[0].urlToImage && (
                          <div className="mb-6 overflow-hidden">
                            <img 
                              src={section.articles[0].urlToImage} 
                              alt="" 
                              className="w-full h-[400px] object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
                            />
                          </div>
                        )}
                        <h3 className="font-serif text-4xl md:text-5xl font-black leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4">
                          <a href={section.articles[0].url} target="_blank" rel="noreferrer">
                            {section.articles[0].styledTitle}
                          </a>
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                          <span className="font-bold text-foreground">{section.articles[0].source}</span>
                          {section.articles[0].author && <span>— By {section.articles[0].author}</span>}
                        </div>
                        <p className="font-serif text-lg leading-relaxed text-foreground/80 mb-6">
                          {section.articles[0].styledDescription}
                        </p>
                        
                        {section.articles[0].pullQuote && (
                          <blockquote className="border-l-[4px] border-foreground pl-6 my-8 py-2">
                            <p className="font-serif text-2xl md:text-3xl italic font-medium text-foreground">
                              "{section.articles[0].pullQuote}"
                            </p>
                          </blockquote>
                        )}
                      </article>
                    </div>
                  )}

                  {/* Secondary Articles */}
                  <div className="lg:col-span-4 flex flex-col gap-8">
                    {section.articles.slice(1).map((article, idx) => (
                      <article key={article.id} className={`${idx !== section.articles.length - 2 ? "border-b border-border pb-8" : ""}`}>
                        {article.urlToImage && idx === 0 && (
                          <div className="mb-4">
                            <img src={article.urlToImage} alt="" className="w-full h-48 object-cover filter grayscale" />
                          </div>
                        )}
                        <h3 className="font-serif text-xl md:text-2xl font-bold leading-snug mb-3 hover:underline underline-offset-2">
                          <a href={article.url} target="_blank" rel="noreferrer">
                            {article.styledTitle}
                          </a>
                        </h3>
                        <p className="font-sans text-sm leading-relaxed text-foreground/70 mb-3 line-clamp-3">
                          {article.styledDescription}
                        </p>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          {article.source}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
