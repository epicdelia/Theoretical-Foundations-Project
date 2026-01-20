export type TherapistSpecialty =
  | "relationship"
  | "trauma"
  | "anxiety"
  | "depression"
  | "general";

export type TherapistLocation =
  | "california"
  | "new-york"
  | "texas"
  | "florida"
  | "online";

export interface Therapist {
  id: string;
  name: string;
  specialty: TherapistSpecialty;
  location: TherapistLocation;
  description: string;
  websiteUrl: string;
}

export const SPECIALTIES: { value: TherapistSpecialty | "all"; label: string }[] = [
  { value: "all", label: "All Specialties" },
  { value: "relationship", label: "Relationship" },
  { value: "trauma", label: "Trauma" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "general", label: "General" },
];

export const LOCATIONS: { value: TherapistLocation | "all"; label: string }[] = [
  { value: "all", label: "All Locations" },
  { value: "california", label: "California" },
  { value: "new-york", label: "New York" },
  { value: "texas", label: "Texas" },
  { value: "florida", label: "Florida" },
  { value: "online", label: "Online / Telehealth" },
];
