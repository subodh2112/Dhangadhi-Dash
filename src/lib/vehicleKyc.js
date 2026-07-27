// Single source of truth for vehicle types and conditional KYC document requirements.

export const VEHICLE_TYPES = [
  { key: "bicycle", label: "Bicycle", emoji: "🚲", group: "bicycle" },
  { key: "motorcycle", label: "Motorcycle", emoji: "🏍️", group: "motorized" },
  { key: "scooter", label: "Scooter", emoji: "🛵", group: "motorized" },
  { key: "electric_scooter", label: "Electric Scooter", emoji: "⚡", group: "motorized" },
  { key: "electric_bike", label: "Electric Bike", emoji: "⚡", group: "motorized" },
  { key: "car", label: "Car", emoji: "🚗", group: "vehicle" },
  { key: "van", label: "Van", emoji: "🚐", group: "vehicle" },
];

export const DOC_FIELDS = {
  citizenship_front_url: { label: "Citizenship Front", type: "file" },
  citizenship_back_url: { label: "Citizenship Back", type: "file" },
  profile_photo_url: { label: "Profile Photo", type: "file" },
  license_number: { label: "Driving License Number", type: "text" },
  license_front_url: { label: "Driving License Front", type: "file" },
  license_back_url: { label: "Driving License Back", type: "file" },
  vehicle_bluebook_url: { label: "Vehicle Registration (Bluebook)", type: "file" },
  number_plate: { label: "Number Plate", type: "text" },
  insurance_url: { label: "Vehicle Insurance", type: "file", optional: true },
  emergency_contact: { label: "Emergency Contact", type: "text" },
};

const GROUP_REQUIREMENTS = {
  bicycle: {
    required: ["citizenship_front_url", "citizenship_back_url", "profile_photo_url", "emergency_contact"],
    optional: ["insurance_url"],
    note: "Bicycle riders are not required to provide a driving license or vehicle registration.",
    needsLicense: false,
    needsVehicleDocs: false,
  },
  motorized: {
    required: ["citizenship_front_url", "citizenship_back_url", "license_number", "license_front_url", "license_back_url", "vehicle_bluebook_url", "number_plate", "profile_photo_url"],
    optional: ["emergency_contact", "insurance_url"],
    note: null,
    needsLicense: true,
    needsVehicleDocs: true,
  },
  vehicle: {
    required: ["citizenship_front_url", "citizenship_back_url", "license_number", "license_front_url", "license_back_url", "vehicle_bluebook_url", "number_plate", "profile_photo_url"],
    optional: ["emergency_contact", "insurance_url"],
    note: null,
    needsLicense: true,
    needsVehicleDocs: true,
  },
};

export function getVehicleConfig(vehicleKey) {
  const vehicle = VEHICLE_TYPES.find((v) => v.key === vehicleKey);
  if (!vehicle) return null;
  return {
    ...vehicle,
    ...GROUP_REQUIREMENTS[vehicle.group],
  };
}

export function getRequiredDocs(vehicleKey) {
  const config = getVehicleConfig(vehicleKey);
  if (!config) return [];
  return config.required;
}

export function getOptionalDocs(vehicleKey) {
  const config = getVehicleConfig(vehicleKey);
  if (!config) return [];
  return config.optional;
}

// Returns array of { field, label } for missing required documents given a form/data object
export function getMissingDocs(vehicleKey, data = {}) {
  const required = getRequiredDocs(vehicleKey);
  return required
    .filter((field) => !data[field] || (typeof data[field] === "string" && data[field].trim() === ""))
    .map((field) => ({ field, label: DOC_FIELDS[field]?.label || field }));
}

export function isKycComplete(vehicleKey, data = {}) {
  return getMissingDocs(vehicleKey, data).length === 0;
}