import React, { useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FileUploadField({ label, value, onChange, accept = "image/*,.pdf" }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch {
      // error
    } finally {
      setUploading(false);
    }
  };

  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div>
      <label className="text-sm font-semibold text-foreground mb-2 block">{label}</label>
      {value ? (
        <div className="relative rounded-xl border border-border overflow-hidden">
          {isImage ? (
            <img src={value} alt={label} className="w-full h-28 object-cover" />
          ) : (
            <a href={value} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 text-saffron text-sm hover:underline">
              <FileText className="w-5 h-5" /> View Document
            </a>
          )}
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-saffron hover:bg-saffron/5 transition-all">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-foreground/30" />
              <span className="text-xs text-foreground/40 font-medium">Click to upload</span>
            </>
          )}
          <input type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={uploading} />
        </label>
      )}
    </div>
  );
}