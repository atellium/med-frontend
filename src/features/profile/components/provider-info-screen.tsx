"use client";

import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/layout/MobileHeader";
import { getProviderNameBySlug } from "@/features/providers/provider.service";
import type { ProviderNameDetail } from "@/features/providers/provider.types";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const supportNumber = (process.env.NEXT_PUBLIC_COMYNITY_WHATSAPP_NUMBER ?? "919876543210").replace(/\D/g, "");

export function ProviderInfoScreen({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["provider", "public-details", slug, "manage-info"],
    queryFn: () => getProviderNameBySlug(slug),
  });

  return <div className="min-h-dvh bg-slate-50 pb-10">
    <MobileHeader title="Provider Information" subtitle={query.data?.name ?? "Loading provider..."} />
    <main className="mx-auto w-full max-w-3xl space-y-4 px-page pt-5">
      {query.isPending && <InfoSkeleton />}
      {query.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-danger"><p className="font-semibold">Couldn&apos;t load provider information.</p><button type="button" onClick={() => void query.refetch()} className="mt-2 font-extrabold underline">Try again</button></div>}
      {query.data && <ProviderInfoCards provider={query.data} />}
    </main>
  </div>;
}

function ProviderInfoCards({ provider }: { provider: ProviderNameDetail }) {
  const categories = provider.categories?.map((category) => category.display_name).filter(Boolean).join(", ");
  const offerings = provider.offerings?.map((offering) => offering.trim()).filter(Boolean).join(", ");
  const city = provider.location.city.name;
  const state = provider.location.city.state;
  const socials = ["facebook", "instagram", "youtube", "linkedin", "x"].flatMap((network) => {
    const url = provider.contact.social_urls?.[network];
    return url ? [[network, url] as const] : [];
  });

  return <>
    <SupportCard providerName={provider.name} />
    <InfoCard title="Basic information" icon="fa-building"><InfoRow label="Name" value={provider.name} /><InfoRow label="Description" value={provider.description} multiline /><InfoRow label="Categories" value={categories} /><InfoRow label="Offerings" value={offerings} /></InfoCard>
    <InfoCard title="Address" icon="fa-location-dot"><InfoRow label="Address" value={provider.location.address} /><InfoRow label="Landmark" value={provider.location.landmark} /><InfoRow label="Locality" value={provider.location.locality} /><InfoRow label="City" value={city} /><InfoRow label="State" value={state} /><InfoRow label="Postal code" value={provider.location.postal_code} /><InfoRow label="Show full address" value={yesNo(provider.location.display_full_address)} /></InfoCard>
    <InfoCard title="Contact information" icon="fa-address-book"><InfoRow label="Phone" value={provider.contact.phone} /><InfoRow label="WhatsApp" value={provider.contact.whatsapp} /><InfoRow label="Other numbers" value={provider.contact.alternate_numbers?.join(", ")} /><InfoRow label="Email" value={provider.contact.email} /><InfoRow label="Website" value={provider.contact.website} /></InfoCard>
    <InfoCard title="Social media" icon="fa-share-nodes">{socials.length ? socials.map(([network, url]) => <InfoRow key={network} label={humanize(network)} value={url} />) : <InfoRow label="Profiles" value={null} />}</InfoCard>
    <InfoCard title="Provider hours" icon="fa-clock">{days.map((day) => <InfoRow key={day} label={humanize(day)} value={formatSlots(provider.hours?.schedule[day])} />)}</InfoCard>
    <InfoCard title="Listing status" icon="fa-circle-check"><InfoRow label="Active" value={yesNo(provider.is_active)} /><InfoRow label="Verified" value={yesNo(provider.is_verified)} /></InfoCard>
  </>;
}

function SupportCard({ providerName }: { providerName: string }) {
  const message = encodeURIComponent(`Hi MedNearby, I want to update the business details for ${providerName}.`);

  return <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
        <i className="fa-solid fa-headset" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-extrabold text-foreground">Need to change these details?</h2>
        <p className="mt-1 text-xs font-medium leading-5 text-foreground-secondary">Message support and we&apos;ll help update your business information.</p>
      </div>
    </div>
    <a href={`https://wa.me/${supportNumber}?text=${message}`} target="_blank" rel="noreferrer" className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-white">
      <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
      Message support
    </a>
  </section>;
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"><h2 className="flex items-center gap-2 text-sm font-extrabold"><i className={`fa-solid ${icon} text-brand`} />{title}</h2><dl className="mt-3 divide-y divide-slate-100">{children}</dl></section>;
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string | number | null | undefined; multiline?: boolean }) {
  return <div className={`${multiline ? "block" : "flex items-start justify-between gap-4"} py-2.5 first:pt-0 last:pb-0`}><dt className="text-xs font-semibold text-foreground-muted">{label}</dt><dd className={`${multiline ? "mt-1" : "max-w-[65%] text-right"} break-words text-xs font-bold`}>{value === null || value === undefined || value === "" ? "Not provided" : value}</dd></div>;
}

function formatSlots(slots?: Array<{ opens_at: string; closes_at: string }>) {
  return slots?.length ? slots.map((slot) => `${formatTime(slot.opens_at)} - ${formatTime(slot.closes_at)}`).join(", ") : "Closed";
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function InfoSkeleton() {
  return <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>;
}
