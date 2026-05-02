import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "@/components/UploadDialog";
import { PhotoCard, Photo } from "@/components/PhotoCard";
import { LogOut } from "lucide-react";

const heroFallback = new URL("../../Photos/Main_Background.jpg", import.meta.url).href;

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false });
    setPhotos((data ?? []) as Photo[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const featured = photos.find((p) => p.is_featured);
  const rest = photos.filter((p) => !featured || p.id !== featured.id);
  const heroUrl = featured ? supabase.storage.from("photos").getPublicUrl(featured.storage_path).data.publicUrl : heroFallback;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <a href="#top" className="serif text-xl text-ink tracking-tight">ChefCook<span className="text-ember">.</span></a>
          <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
            <a href="#gallery" className="hover:text-ink transition">Gallery</a>
            <a href="#about" className="hover:text-ink transition">About</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && <UploadDialog onUploaded={load} />}
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2"><LogOut className="w-4 h-4" /> Sign out</Button>
            ) : (
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative min-h-screen flex items-end overflow-hidden">
        <img src={heroUrl} alt={featured?.title ?? "Featured dish"} width={1920} height={1280}
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <div className="relative container pb-20 pt-32">
          <p className="text-ember-glow text-xs uppercase tracking-[0.3em] mb-6">Culinary Portfolio</p>
          <h1 className="serif text-cream text-6xl md:text-8xl leading-[0.95] max-w-4xl text-balance">
            ChefCook's<br /><em className="text-ember-glow">Culinary</em> Journey
          </h1>
          <p className="text-cream/70 mt-8 max-w-xl text-lg leading-relaxed">
            A living archive of dishes, plates and moments — crafted with intention, photographed with care.
          </p>
          {featured && (
            <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 bg-cream/10 backdrop-blur-sm border border-cream/20 rounded-sm">
              <span className="w-1.5 h-1.5 bg-ember-glow rounded-full animate-pulse" />
              <span className="text-cream/90 text-sm">Featured: <span className="serif italic">{featured.title}</span></span>
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="container py-24 md:py-32">
        <div className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <p className="text-ember text-xs uppercase tracking-[0.3em] mb-3">The Gallery</p>
            <h2 className="serif text-5xl md:text-6xl text-ink">Selected works</h2>
          </div>
          <p className="hidden md:block text-muted-foreground text-sm">{photos.length} {photos.length === 1 ? "dish" : "dishes"}</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : photos.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border rounded-md">
            <p className="serif text-3xl text-ink mb-2">The kitchen is warming up</p>
            <p className="text-muted-foreground">{isAdmin ? "Add your first photo to begin." : "Check back soon."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 auto-rows-[120px] md:auto-rows-[140px] gap-4 md:gap-6">
            {rest.map((p) => <PhotoCard key={p.id} photo={p} isAdmin={isAdmin} onChange={load} />)}
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="bg-paper border-t border-border">
        <div className="container py-24 md:py-32 max-w-3xl">
          <p className="text-ember text-xs uppercase tracking-[0.3em] mb-6">About</p>
          <h2 className="serif text-4xl md:text-5xl text-ink leading-tight text-balance">
            Cooking is memory, made edible. This portfolio is the long form of mine.
          </h2>
          <p className="mt-8 text-muted-foreground leading-relaxed">
            Each plate here represents an hour, a service, an idea worth keeping.
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-8 flex justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ChefCook</span>
          <span className="serif italic">Made with fire & patience</span>
        </div>
      </footer>
    </div>
  );
}
