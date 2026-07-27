import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Film, Loader2, Trash2, X, Video, ImageIcon } from "lucide-react";

export default function MediaUploader({ label, value, onChange, max = 12 }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const items = (() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
  })();

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length === 0) {
      toast({ title: "Please select images or videos", variant: "destructive" });
      return;
    }
    if (items.length + files.length > max) {
      toast({ title: `Maximum ${max} items allowed`, variant: "destructive" });
      return;
    }
    setUploading(true);
    const newItems = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newItems.push({
          url: file_url,
          type: file.type.startsWith("video/") ? "video" : "image",
          caption: "",
        });
      } catch {}
    }
    setUploading(false);
    if (newItems.length > 0) onChange([...items, ...newItems]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateCaption = (index, caption) => {
    onChange(items.map((item, i) => (i === index ? { ...item, caption } : item)));
  };

  return (
    <div className="space-y-4">
      {label && (
        <div>
          <label className="text-sm font-bold text-foreground mb-1 block">{label}</label>
          <p className="text-xs text-foreground/50">Upload photos and videos to showcase your storefront and products.</p>
        </div>
      )}

      <label className="flex flex-col items-center justify-center gap-3 h-36 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-saffron hover:bg-saffron/5 transition-all">
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-saffron animate-spin" />
            <span className="text-sm font-medium text-foreground/60">Uploading…</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <ImagePlus className="w-7 h-7 text-saffron" />
              <Film className="w-7 h-7 text-terai" />
            </div>
            <span className="text-sm font-bold text-foreground">Click to upload photos & videos</span>
            <span className="text-xs text-foreground/40">JPG, PNG, WEBP, MP4, WEBM — up to 25MB each</span>
          </>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </label>

      {items.length === 0 && !uploading && (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-foreground/30" />
          </div>
          <p className="text-sm text-foreground/50">No media added yet.</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-border bg-muted aspect-square">
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <Image src={item.url} alt={item.caption || "Media"} fittingType="fill" className="w-full h-full" />
                )}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                  {item.type === "video"
                    ? <Video className="w-3 h-3 text-white" />
                    : <ImageIcon className="w-3 h-3 text-white" />}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  aria-label="Remove media"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"
                  aria-label="Preview media"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <input
                key={i}
                type="text"
                value={item.caption || ""}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder={item.type === "video" ? "Video caption (optional)" : "Photo caption (optional)"}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
          </div>
        </>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" aria-label="Close preview">
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {previewItem.type === "video" ? (
              <video src={previewItem.url} controls autoPlay className="w-full max-h-[80vh] rounded-xl" />
            ) : (
              <Image src={previewItem.url} alt={previewItem.caption || "Preview"} fittingType="fit" className="w-full max-h-[80vh] rounded-xl" />
            )}
            {previewItem.caption && <p className="text-center text-white/80 text-sm mt-3">{previewItem.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}