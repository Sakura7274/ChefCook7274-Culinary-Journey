import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export interface Photo {
  id: string;
  storage_path: string;
  title: string;
  caption: string | null;
  size: string;
  is_featured: boolean;
}

const sizeClass: Record<string, string> = {
  small: "md:col-span-1 md:row-span-1",
  medium: "md:col-span-2 md:row-span-2",
  large: "md:col-span-3 md:row-span-3",
  tall: "md:col-span-2 md:row-span-3",
  wide: "md:col-span-3 md:row-span-2",
};

export function PhotoCard({ photo, isAdmin, onChange }: { photo: Photo; isAdmin: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(photo.title);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [size, setSize] = useState(photo.size);
  const [featured, setFeatured] = useState(photo.is_featured);
  const [busy, setBusy] = useState(false);
  const url = supabase.storage.from("photos").getPublicUrl(photo.storage_path).data.publicUrl;

  const remove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${photo.title}"?`)) return;
    await supabase.storage.from("photos").remove([photo.storage_path]);
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); onChange(); }
  };

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(photo.title); setCaption(photo.caption ?? ""); setSize(photo.size); setFeatured(photo.is_featured);
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title required"); return; }
    setBusy(true);
    if (featured && !photo.is_featured) {
      await supabase.from("photos").update({ is_featured: false }).eq("is_featured", true);
    }
    const { error } = await supabase.from("photos").update({
      title: title.trim(), caption: caption.trim() || null, size, is_featured: featured,
    }).eq("id", photo.id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditOpen(false); onChange(); }
    setBusy(false);
  };

  return (
    <>
      <figure
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-md cursor-pointer bg-paper shadow-soft transition-all duration-500 hover:shadow-deep hover:-translate-y-1 ${sizeClass[photo.size] ?? sizeClass.medium}`}
        style={{ aspectRatio: photo.size === "wide" ? "3/2" : photo.size === "tall" ? "2/3" : "1/1" }}
      >
        <img src={url} alt={photo.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <figcaption className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <h3 className="serif text-2xl text-cream leading-tight">{photo.title}</h3>
          {photo.caption && <p className="text-cream/80 text-sm mt-1 line-clamp-2">{photo.caption}</p>}
        </figcaption>
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" onClick={openEdit} className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={remove} className="h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-card p-0 overflow-hidden">
          <img src={url} alt={photo.title} className="w-full max-h-[75vh] object-contain bg-ink" />
          <div className="p-6">
            <h2 className="text-3xl text-ink">{photo.title}</h2>
            {photo.caption && <p className="text-muted-foreground mt-2">{photo.caption}</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle className="text-3xl">Edit dish</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4">
            <div>
              <Label htmlFor="et">Title</Label>
              <Input id="et" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
            </div>
            <div>
              <Label htmlFor="ec">Caption</Label>
              <Textarea id="ec" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="tall">Tall</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch id="ef" checked={featured} onCheckedChange={setFeatured} />
                <Label htmlFor="ef">Featured</Label>
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-ink text-cream hover:bg-ink/90">
              {busy ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
