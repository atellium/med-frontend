"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CalendarDays, ChevronRight, Clock, Languages, MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import { getDoctorBySlug } from "../provider.service";
import type { DoctorListItem, DoctorScheduleEntry } from "../provider.types";
import { formatProviderTime } from "../provider.utils";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatFee(value: string | null) {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? currencyFormatter.format(amount) : null;
}

function formatScheduleLine(entry: DoctorScheduleEntry) {
  const label = entry.weekday === null ? entry.schedule_label : weekdayNames[entry.weekday] ?? entry.schedule_label;
  const time = formatScheduleTime(entry);
  const consultationType = formatConsultationType(entry.consultation_type);
  return [label, time, consultationType].filter(Boolean).join(", ");
}

function formatConsultationType(value: string | null | undefined) {
  if (value !== "appointment") return null;
  return "By Appointment";
}

function formatScheduleTime(entry: DoctorScheduleEntry) {
  const startTime = hasSelectedTime(entry.start_time) ? formatProviderTime(entry.start_time) : "";
  const endTime = hasSelectedTime(entry.end_time) ? formatProviderTime(entry.end_time) : "";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (endTime) return endTime;
  return "";
}

function hasSelectedTime(value: string | null | undefined) {
  const time = value?.match(/(\d{2}):(\d{2})(?::(\d{2}))?/)?.[0];
  return Boolean(time && !/^00:00(?::00)?$/.test(time));
}

function fullAddress(doctor: DoctorListItem) {
  const city = doctor.provider.city.name;
  return [
    doctor.provider.address.address,
    doctor.provider.address.landmark,
    doctor.provider.address.locality,
    city,
    doctor.provider.address.pincode,
  ].filter(Boolean).join(", ");
}

export function DoctorDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ["doctor", "detail", slug],
    queryFn: () => getDoctorBySlug(slug),
    enabled: Boolean(slug),
  });

  const errorMessage = axios.isAxiosError(query.error)
    ? String(query.error.response?.data?.detail ?? query.error.message)
    : query.error instanceof Error ? query.error.message : "Unable to load this doctor.";

  async function shareDoctor() {
    if (!query.data) return;
    const url = window.location.href;
    const isInstalledPwa = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (isInstalledPwa && navigator.share) {
      try {
        await navigator.share({ title: query.data.name, text: `Check out ${query.data.name} on MedNearby:\n${url}` });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      }
      return;
    }

    setShareUrl(url);
    setCopied(false);
    setShareOpen(true);
  }

  async function copyShareLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("textarea");
        input.value = shareUrl;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const didCopy = document.execCommand("copy");
        input.remove();
        if (!didCopy) return;
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-white">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/95 px-page py-1 backdrop-blur-xl">
        <div className="mx-auto flex h-10 w-full max-w-3xl items-center justify-between">
          <button type="button" onClick={() => router.back()} className="flex size-9 shrink-0 items-center justify-center rounded-full text-black" aria-label="Go back">
            <ArrowLeft size={23} strokeWidth={1.9} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => void shareDoctor()} disabled={!query.data} className="flex size-9 shrink-0 items-center justify-center rounded-full text-black disabled:opacity-40" aria-label="Share doctor">
            <Share2 size={20} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-page py-3 pb-10">
        {query.isPending && <DoctorDetailSkeleton />}
        {query.isError && (
          <section className="rounded-xl border border-red-100 bg-red-50 p-5 text-center text-sm font-semibold text-danger">
            <p>{errorMessage}</p>
            <button type="button" onClick={() => void query.refetch()} className="mt-3 rounded-lg bg-brand px-4 py-2 text-xs font-extrabold text-white">Try again</button>
          </section>
        )}
        {query.data && <DoctorDetail doctor={query.data} />}
      </main>
      <BottomSheetModal open={shareOpen} onClose={() => setShareOpen(false)} title={`Share ${query.data?.name ?? "doctor"}`} closeLabel="Close share options">
        <div className="px-page pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <h2 className="text-xl font-extrabold">Share this doctor</h2>
          <p className="mt-1 text-sm text-foreground-muted">Send {query.data?.name ?? "this doctor"} to friends and family.</p>
          <div className="mt-6 flex items-start justify-center gap-10">
            <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${query.data?.name ?? "this doctor"} on MedNearby:\n${shareUrl}`)}`} target="_blank" rel="noreferrer" className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-600 transition-transform group-hover:scale-105"><i className="fa-brands fa-whatsapp" aria-hidden="true" /></span><span className="text-[11px] font-semibold text-foreground-secondary">WhatsApp</span></a>
            <button type="button" onClick={copyShareLink} className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg text-brand transition-transform group-hover:scale-105"><i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true" /></span><span className="text-[11px] font-semibold text-foreground-secondary">{copied ? "Copied" : "Copy link"}</span></button>
          </div>
        </div>
      </BottomSheetModal>
    </div>
  );
}

function DoctorDetail({ doctor }: { doctor: DoctorListItem }) {
  const specialties = doctor.specialties?.map((specialty) => specialty.label || specialty.name).filter(Boolean) ?? [];
  const languages = (doctor.languages ?? []).map((item) => item.trim()).filter(Boolean);
  const treatments = (doctor.treatments ?? []).map((item) => item.trim()).filter(Boolean);
  const fee = formatFee(doctor.consultation_fee);
  const providerHref = `/${encodeURIComponent(doctor.provider.slug)}`;
  const address = fullAddress(doctor);
  const schedule = doctor.schedule;
  const directionsHref = Number.isFinite(doctor.provider.address.latitude) && Number.isFinite(doctor.provider.address.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${doctor.provider.address.latitude},${doctor.provider.address.longitude}`
    : undefined;

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border-dark-subtle dark:bg-surface-dark">
        <div className="flex items-start gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-900">
            <i className="fa-solid fa-user-doctor text-2xl" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold leading-6 text-foreground dark:text-foreground-dark">{doctor.name}</h2>
                {specialties.length > 0 && <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-300">{specialties.join(" | ")}</p>}
                {doctor.qualification && <p className="mt-1 text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted">{doctor.qualification}</p>}
              </div>
              {fee && <span className="shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{fee}</span>}
            </div>
            {doctor.registration_number && <p className="mt-2 text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted">Registration: {doctor.registration_number}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-border-dark-subtle dark:bg-surface-dark">
        <Link href={providerHref} className="group flex min-w-0 items-center gap-3 transition-colors">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-surface-dark-tertiary">
            <Image src={doctor.provider.cover_image || "/images/default.jpg"} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-base font-extrabold text-foreground group-hover:text-brand dark:text-foreground-dark">{doctor.provider.name}</span>
              {doctor.provider.is_verified && <BadgeCheck size={15} className="shrink-0 text-brand" aria-label="Verified provider" />}
            </span>
            {address && <span className="mt-1 flex min-w-0 items-center gap-1 text-xs text-foreground-muted dark:text-foreground-dark-muted"><MapPin size={12} className="shrink-0" aria-hidden="true" /><span className="truncate">{address}</span></span>}
          </span>
          <ChevronRight size={18} className="shrink-0 text-foreground-subtle transition-colors group-hover:text-brand" aria-hidden="true" />
        </Link>
        {schedule?.next_available && <p className={`mt-3 flex items-start gap-1.5 border-t border-border-subtle pt-3 text-sm font-bold dark:border-border-dark-subtle ${schedule.is_available || schedule.is_today ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}><CalendarDays size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{schedule.is_available ? "Available now" : schedule.next_available}</p>}
        <div className="mt-3 divide-y divide-border-subtle dark:divide-border-dark-subtle">
          {(schedule?.full_schedule ?? []).map((entry, index) => (
            <p key={`${entry.schedule_label}-${index}`} className="flex items-center gap-2 py-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
              <Clock size={14} className="shrink-0 text-foreground-muted" aria-hidden="true" />
              <span>{formatScheduleLine(entry)}</span>
            </p>
          ))}
          {!schedule?.full_schedule?.length && <p className="py-2 text-sm text-foreground-muted dark:text-foreground-dark-muted">Schedule unavailable</p>}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Action href={doctor.provider.contact.phone ? `tel:${doctor.provider.contact.phone}` : undefined} icon="fa-phone" label="Call" />
          <Action href={doctor.provider.contact.whatsapp ? `https://wa.me/${digits(doctor.provider.contact.whatsapp)}` : undefined} icon="fa-whatsapp" label="WhatsApp" brandIcon external />
          <Action href={directionsHref} icon="fa-diamond-turn-right" label="Direction" external />
        </div>
      </section>

      {doctor.bio?.trim() && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border-dark-subtle dark:bg-surface-dark">
          <h2 className="text-base font-extrabold text-foreground dark:text-foreground-dark">About</h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary dark:text-foreground-dark-secondary">{doctor.bio}</p>
        </section>
      )}

      {treatments.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border-dark-subtle dark:bg-surface-dark">
          <InfoGroup title="Treatments" items={treatments} />
        </section>
      )}

      {languages.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border-dark-subtle dark:bg-surface-dark">
          <InfoGroup icon={<Languages size={17} aria-hidden="true" />} title="Languages" items={languages} />
        </section>
      )}

    </div>
  );
}

function InfoGroup({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return <div><h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground dark:text-foreground-dark">{icon}{title}</h2><p className="mt-1 text-sm leading-6 text-foreground-secondary dark:text-foreground-dark-secondary">{items.join(" | ")}</p></div>;
}

function Action({ href, icon, label, external = false, brandIcon = false }: { href?: string; icon: string; label: string; external?: boolean; brandIcon?: boolean }) {
  const className = "flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-2 text-xs font-extrabold text-cyan-800 transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900 dark:bg-surface-dark dark:text-cyan-200 dark:hover:bg-cyan-950";
  const content = <><i className={`${brandIcon ? "fa-brands" : "fa-solid"} ${icon} shrink-0 text-xs`} aria-hidden="true" /><span className="truncate">{label}</span></>;
  if (!href) return <span className={`${className} cursor-not-allowed opacity-40`} aria-disabled="true">{content}</span>;
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className}>{content}</a>;
}

function DoctorDetailSkeleton() {
  return <div className="space-y-4" aria-label="Loading doctor details">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-white dark:bg-surface-dark" />)}</div>;
}
