import type { Metadata } from "next";
import { SearchPage } from "@/features/search";

export const metadata: Metadata = {
  title: "Search Doctors & Healthcare Services Near You | MedNearby",
  description: "Search for doctors, pharmacies, clinics, diagnostic centres, hospitals and other healthcare services near you. Find local medical providers quickly with MedNearby.",
};

export default function Page() {
  return <SearchPage />;
}
