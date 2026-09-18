import type { Metadata } from "next";
import { NearbyOffersPage } from "@/features/providers";

export const metadata: Metadata = { title: "Nearby Offers", description: "Discover offers from providers near you." };

export default function OffersPage() {
  return <NearbyOffersPage />;
}
