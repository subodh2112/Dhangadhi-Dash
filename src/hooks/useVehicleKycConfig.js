import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { VEHICLE_TYPES, DOC_FIELDS } from "@/lib/vehicleKyc";

const SETTING_KEY = "vehicle_kyc_config";

// Merges admin-configured overrides (from Setting entity) with code defaults.
// Returns { vehicleTypes: [{...v, enabled}], isDocRequired: (vehicleKey, docKey) => bool }
export function useVehicleKycConfig() {
  const [overrides, setOverrides] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Setting.filter({ key: SETTING_KEY })
      .then((stored) => {
        if (!active || stored.length === 0) return;
        const parsed = JSON.parse(stored[0].value);
        setOverrides(parsed);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const vehicleTypes = VEHICLE_TYPES.map((v) => {
    const ov = overrides?.[v.key];
    return { ...v, enabled: ov?.enabled !== false };
  }).filter(Boolean);

  const enabledVehicleTypes = vehicleTypes.filter((v) => v.enabled);

  function isDocRequired(vehicleKey, docKey) {
    const ov = overrides?.[vehicleKey];
    if (ov?.required) return ov.required.includes(docKey);
    // fall back to code defaults
    const v = VEHICLE_TYPES.find((x) => x.key === vehicleKey);
    if (!v) return false;
    const defaultRequired =
      v.group === "bicycle"
        ? ["citizenship_front_url", "citizenship_back_url", "profile_photo_url", "emergency_contact"]
        : ["citizenship_front_url", "citizenship_back_url", "license_number", "license_front_url", "license_back_url", "vehicle_bluebook_url", "number_plate", "profile_photo_url"];
    return defaultRequired.includes(docKey);
  }

  function getRequiredDocsFor(vehicleKey) {
    return Object.keys(DOC_FIELDS).filter((docKey) => isDocRequired(vehicleKey, docKey));
  }

  return { vehicleTypes, enabledVehicleTypes, isDocRequired, getRequiredDocsFor, configLoaded: overrides !== null };
}