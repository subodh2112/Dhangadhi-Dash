import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, Loader2, FileSpreadsheet, Check } from "lucide-react";

export default function BulkProductManager() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const products = await base44.entities.Product.list("-created_date", 2000);
      const headers = ["name", "store_name", "category", "price", "description", "image_url", "is_available", "stock", "food_type", "is_popular", "is_bestseller", "discount_percent"];
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = products.map((p) => [p.name, p.store_name, p.category || "food", p.price || 0, p.description || "", p.image_url || "", p.is_available ? "true" : "false", p.stock || 0, p.food_type || "veg", p.is_popular ? "true" : "false", p.is_bestseller ? "true" : "false", p.discount_percent || 0].map(escape).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ddash_products_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported ${products.length} products` });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
    finally { setExporting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" }, store_name: { type: "string" }, category: { type: "string" },
                  price: { type: "number" }, description: { type: "string" }, image_url: { type: "string" },
                  is_available: { type: "boolean" }, stock: { type: "number" }, food_type: { type: "string" },
                  is_popular: { type: "boolean" }, is_bestseller: { type: "boolean" }, discount_percent: { type: "number" },
                },
              },
            },
          },
        },
      });
      const products = result.output?.products || (Array.isArray(result.output) ? result.output : []);
      if (!Array.isArray(products) || products.length === 0) {
        toast({ title: "No products found in file", variant: "destructive" });
        setImporting(false);
        return;
      }
      const cleaned = products
        .filter((p) => p.name && p.store_name && p.price != null)
        .map((p) => ({
          name: String(p.name), store_name: String(p.store_name), category: p.category || "food",
          price: Number(p.price) || 0, description: p.description || "", image_url: p.image_url || "",
          is_available: p.is_available !== false, stock: Number(p.stock) || 0, food_type: p.food_type || "veg",
          is_popular: !!p.is_popular, is_bestseller: !!p.is_bestseller, discount_percent: Number(p.discount_percent) || 0,
        }));
      if (cleaned.length === 0) {
        toast({ title: "No valid products (need name, store_name, price)", variant: "destructive" });
        setImporting(false);
        return;
      }
      const created = await base44.entities.Product.bulkCreate(cleaned);
      setImportResult({ total: cleaned.length, created: created.length });
      toast({ title: `Imported ${created.length} products` });
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="w-12 h-12 rounded-xl bg-terai/10 flex items-center justify-center mb-4"><Download className="w-6 h-6 text-terai" /></div>
          <h3 className="font-bold text-lg text-foreground mb-2">Export Products</h3>
          <p className="text-sm text-foreground/50 mb-4">Download all products as a CSV file. Use it as a template for bulk imports.</p>
          <Button onClick={handleExport} disabled={exporting} className="w-full bg-terai hover:bg-terai/90">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center mb-4"><Upload className="w-6 h-6 text-saffron" /></div>
          <h3 className="font-bold text-lg text-foreground mb-2">Import Products</h3>
          <p className="text-sm text-foreground/50 mb-4">Upload a CSV file with product data. Required: name, store_name, price.</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} disabled={importing} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} disabled={importing} className="w-full">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? "Importing..." : "Choose File"}
          </Button>
        </div>
      </div>
      {importResult && (
        <div className="bg-terai/5 border border-terai/20 rounded-2xl p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-terai/10 flex items-center justify-center"><Check className="w-5 h-5 text-terai" /></div>
          <div>
            <p className="font-bold text-sm text-terai">Import successful!</p>
            <p className="text-xs text-foreground/50">{importResult.created} of {importResult.total} products added to the catalog.</p>
          </div>
        </div>
      )}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-saffron" /> CSV Format</h3>
        <div className="bg-muted rounded-xl p-4 overflow-x-auto">
          <code className="text-xs text-foreground/60 whitespace-nowrap">name,store_name,category,price,description,image_url,is_available,stock,food_type,is_popular,is_bestseller,discount_percent</code>
        </div>
        <p className="text-xs text-foreground/40 mt-3">Example: "Chicken Momo","DD Kitchen","food",180,"Steamed chicken dumplings","https://...",true,50,non_veg,true,false,10</p>
      </div>
    </div>
  );
}