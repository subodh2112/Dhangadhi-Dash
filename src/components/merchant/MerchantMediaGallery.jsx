import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Video, Loader2, Trash2, X, Film, ImageIcon, AlertCircle } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

export default function MerchantMediaGallery({ storeId }) {
  const { toast } = useToast();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      try {
        const store = await base44.entities.Store.get(storeId);
        let items = [];
        if (store.media_gallery) {
          try { items = JSON.parse(store.media_gallery); } catch {}
        }
        setMedia(Array.isArray(items) ? items : []);
      } catch {} finally { setLoading(false); }
    })();
  }, [storeId]);

  const persist = async (newMedia) => {
    setMedia(newMedia);
    try {
      await base44.entities.Store.update(storeId, { media_gallery: JSON.stringify(newMedia) });
      toast({ title: "Gallery updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter(f =>
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length === 0) {
      toast({ title: "Please select images or videos", variant: "destructive" });
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
    if (newItems.length > 0) await persist([...media, ...newItems]);
  };

  const removeItem = (index) => {
    persist(media.filter((_, i) => i !== index));
  };

  const updateCaption = (index, caption) => {
    const updated = media.map((item, i) => i === index ? { ...item, caption } : item);
    setMedia(updated);
  };

  const saveCaptions = () => {
    base44.entities.Store.update(storeId, { media_gallery: JSON.stringify(media) })
      .then(() => toast({ title: "Captions saved" }))
      .catch(() => toast({ title: "Failed to save captions", variant: "destructive" }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-saffron animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-foreground mb-1">Media Gallery</h2>
        <p className="text-sm text-foreground/50">Upload photos and videos to showcase your store, products, and ambiance.</p>
      </div>

      {/* Upload Zone */}
      <label className="flex flex-col items-center justify-center gap-3 h-40 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-saffron hover:bg-saffron/5 transition-all">
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

      {/* Empty State */}
      {media.length === 0 && !uploading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7 text-foreground/30" />
          </div>
          <p className="text-sm text-foreground/50">No media uploaded yet. Add photos and videos to make your store stand out.</p>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((item, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-border bg-muted aspect-square">
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <Image src={item.url} alt={item.caption || "Gallery image"} fittingType="fill" className="w-full h-full" />
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

          {/* Caption Editor */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Captions</h3>
            {media.map((item, i) => (
              <input
                key={i}
                type="text"
                value={item.caption || ""}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder={item.type === "video" ? "Video caption (optional)" : "Photo caption (optional)"}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
            <button
              onClick={saveCaptions}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-saffron text-white hover:bg-saffron/90 transition-colors"
            >
              Save Captions
            </button>
          </div>
        </>
      )}

      {/* Preview Modal */}
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