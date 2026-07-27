import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Bike, Save, Loader2, Check, X } from "lucide-react";
import { VEHICLE_TYPES, DOC_FIELDS } from "@/lib/vehicleKyc";

const SETTING_KEY = "vehicle_kyc_config";
const ALL_DOC_KEYS = Object.keys(DOC_FIELDS);

// default config derived from code defaults
function buildDefaultConfig() {
  const config = {};
  VEHICLE_TYPES.forEach((v) => {
    config[v.key] = {
      enabled: true,
      required: v.group === "bicycle"
        ? ["citizenship_front_url", "citizenship_back_url", "profile_photo_url", "emergency_contact"]
        : ["citizenship_front_url", "citizenship_back_url", "license_number", "license_front_url", "license_back_url", "vehicle_bluebook_url", "number_plate", "profile_photo_url"],
    };
  });
  return config;
}

export default function VehicleKycConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState(buildDefaultConfig());
  const [settingId, setSettingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await base44.entities.Setting.filter({ key: SETTING_KEY }).catch(() => []);
        if (stored.length > 0) {
          setSettingId(stored[0].id);
          const parsed = JSON.parse(stored[0].value);
          // merge with defaults so new vehicle types aren't lost
          const merged = { ...buildDefaultConfig(), ...parsed };
          setConfig(merged);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = JSON.stringify(config);
      if (settingId) {
        await base44.entities.Setting.update(settingId, { value });
      } else {
        const created = await base44.entities.Setting.create({ key: SETTING_KEY, value, label: "Vehicle KYC Document Requirements", category: "rider" });
        setSettingId(created.id);
      }
      toast({ title: "Vehicle KYC settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleEnabled = (vehicleKey) => {
    setConfig((prev) => ({
      ...prev,
      [vehicleKey]: { ...prev[vehicleKey], enabled: !prev[vehicleKey]?.enabled },
    }));
  };

  const toggleDoc = (vehicleKey, docKey) => {
    setConfig((prev) => {
      const current = prev[vehicleKey] || { enabled: true, required: [] };
      const isRequired = current.required.includes(docKey);
      const required = isRequired
        ? current.required.filter((d) => d !== docKey)
        : [...current.required, docKey];
      return { ...prev, [vehicleKey]: { ...current, required } };
    });
  };

  if (loading) {
    return <div className="bg-card rounded-3xl border border-border p-6"><Loader2 className="w-6 h-6 text-saffron animate-spin" /></div>;
  }

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Bike className="w-5 h-5 text-saffron" /> Vehicle KYC Configuration</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-4 rounded-xl bg-saffron text-white font-bold text-sm hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Config
        </button>
      </div>
      <p className="text-sm text-foreground/50 mb-6">Enable/disable vehicle types and configure which documents are required for rider KYC per vehicle type.</p>

      <div className="space-y-4">
        {VEHICLE_TYPES.map((v) => {
          const vc = config[v.key] || { enabled: true, required: [] };
          return (
            <div key={v.key} className={`rounded-2xl border p-4 ${vc.enabled ? "border-border" : "border-border opacity-60"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{v.emoji}</span>
                  <span className="font-bold text-foreground text-sm">{v.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleEnabled(v.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${vc.enabled ? "bg-terai" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${vc.enabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              {vc.enabled && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {ALL_DOC_KEYS.map((docKey) => {
                    const doc = DOC_FIELDS[docKey];
                    const isRequired = vc.required.includes(docKey);
                    const optional = doc.optional;
                    return (
                      <button
                        key={docKey}
                        type="button"
                        onClick={() => toggleDoc(v.key, docKey)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                          isRequired ? "bg-terai/10 text-terai" : optional ? "bg-muted/50 text-foreground/50" : "bg-muted/30 text-foreground/40"
                        }`}
                      >
                        {isRequired ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <X className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="flex-1">{doc.label}</span>
                        {optional && !isRequired && <span className="text-[9px] uppercase">optional</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {!vc.enabled && <p className="text-xs text-foreground/40">This vehicle type is disabled. Riders cannot select it.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}