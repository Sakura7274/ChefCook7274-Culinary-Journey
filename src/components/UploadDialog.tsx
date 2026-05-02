import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function UploadDialog({ onUploaded }: { onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [size, setSize] = useState("medium");
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFile(null); setTitle(""); setCaption(""); setSize("medium"); setFeatured(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) { toast.error("Title and photo required"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    
    // Validate MIME type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) { 
      toast.error("Only JPEG, PNG, WebP, and AVIF allowed"); 
      return; 
    }
    
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
    if (upErr) { toast.error(upErr.message); setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (featured) {
      await supabase.from("photos").update({ is_featured: false }).eq("is_featured", true);
    }
    const { error } = await supabase.from("photos").insert({
      storage_path: path, title: title.trim(), caption: caption.trim() || null,
      size, is_featured: featured, uploaded_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Photo added"); reset(); setOpen(false); onUploaded(); }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-ember hover:bg-ember/90 text-cream gap-2"><Plus className="w-4 h-4" /> Add photo</Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-lg">
        <DialogHeader><DialogTitle className="text-3xl">Add a new dish</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="file">Photo</Label>
            <Input id="file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          <div>
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div>
            <Label htmlFor="c">Caption (optional)</Label>
            <Textarea id="c" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size in grid</Label>
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
              <Switch id="f" checked={featured} onCheckedChange={setFeatured} />
              <Label htmlFor="f">Featured (hero)</Label>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-ink text-cream hover:bg-ink/90">
            {busy ? "Uploading..." : "Add to gallery"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
