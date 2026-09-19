"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, CalendarClock, ChevronLeft, ChevronRight, LoaderCircle, MapPin, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { formatProviderTime } from "../provider.utils";
import type { DoctorListItem, DoctorScheduleEntry } from "../provider.types";
import { useDoctorList } from "../use-doctor-list";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function labelFromSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatFee(value: string | null) {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? currencyFormatter.format(amount) : null;
}

function formatSchedule(doctor: DoctorListItem) {
  if (doctor.schedule?.is_available) return "Available now";
  if (doctor.schedule?.next_available) return doctor.schedule.next_available;
  const nextSlot = doctor.schedule?.full_schedule[0];
  if (!nextSlot) return null;
  return formatScheduleEntry(nextSlot);
}

function formatConsultationType(value: string | null | undefined) {
  if (value !== "appointment") return null;
  return "By Appointment";
}

function formatScheduleTime(entry: DoctorScheduleEntry) {
  if (entry.start_time && entry.end_time) return `${formatProviderTime(entry.start_time)} - ${formatProviderTime(entry.end_time)}`;
  if (entry.start_time) return formatProviderTime(entry.start_time);
  if (entry.end_time) return formatProviderTime(entry.end_time);
  return "";
}

function formatScheduleEntry(entry: DoctorScheduleEntry) {
  const time = formatScheduleTime(entry);
  const consultationType = formatConsultationType(entry.consultation_type);
  return [entry.schedule_label, time, consultationType].filter(Boolean).join(", ");
}

export function DoctorListPage({ specialtySlug }: { city: string; locality: string; specialtySlug: string }) {
  const router = useRouter();
  const [availableToday, setAvailableToday] = useState(false);
  const { lat, lng } = useAppSelector((state) => state.location);
  const query = useDoctorList({ specialty: specialtySlug, lat, lng, availableToday });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const doctors = useMemo(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data],
  );
  const specialtyLabel = query.data?.pages[0]?.specialty?.label || labelFromSlug(specialtySlug);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const errorMessage = axios.isAxiosError(query.error)
    ? (query.error.response?.data?.detail ?? query.error.message)
    : query.error instanceof Error
      ? query.error.message
      : "Unable to load doctors.";

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-background-dark">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/95 px-page py-2.5 backdrop-blur-xl dark:border-border-dark-subtle dark:bg-surface-dark/95">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-2">
          <button type="button" onClick={() => router.back()} className="flex size-10 shrink-0 items-center justify-center rounded-full text-brand" aria-label="Go back">
            <ChevronLeft size={30} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold text-foreground dark:text-foreground-dark">{specialtyLabel}</h1>
            <p className="truncate text-xs font-semibold text-foreground-muted dark:text-foreground-dark-muted">{doctors.length || query.isPending ? `${doctors.length || ""} doctors nearby` : "Doctors nearby"}</p>
          </div>
          <button
            type="button"
            onClick={() => setAvailableToday((current) => !current)}
            aria-pressed={availableToday}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-extrabold transition-colors ${availableToday ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-foreground hover:border-brand-200 hover:bg-brand-50 dark:border-border-dark-subtle dark:bg-surface-dark-secondary dark:text-foreground-dark"}`}
          >
            <CalendarClock size={13} aria-hidden="true" />
            Today
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-page py-4 pb-10">
        {query.isPending && <DoctorListSkeleton />}
        {query.isError && <StateMessage title="Couldn't load doctors" message={errorMessage} action={() => query.refetch()} />}
        {query.isSuccess && doctors.length === 0 && <StateMessage title="No doctors found" message="Try a different specialty or nearby location." />}
        {doctors.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {doctors.map((doctor) => <DoctorListingCard key={doctor.id} doctor={doctor} />)}
          </div>
        )}
        <div ref={loadMoreRef} className="flex h-20 items-center justify-center" aria-live="polite">
          {query.isFetchingNextPage && <><LoaderCircle size={20} className="animate-spin text-brand" /><span className="ml-2 text-sm font-semibold text-foreground-muted">Loading more</span></>}
          {!query.hasNextPage && doctors.length > 0 && <span className="text-xs font-semibold text-foreground-subtle dark:text-foreground-dark-subtle">You&apos;ve reached the end</span>}
        </div>
      </main>
    </div>
  );
}

function DoctorListingCard({ doctor }: { doctor: DoctorListItem }) {
  const specialties = doctor.specialties?.map((specialty) => specialty.name).filter(Boolean) ?? [];
  const address = [doctor.provider.address.locality, doctor.provider.city.name].filter(Boolean).join(", ");
  const fullAddress = [doctor.provider.address.address, doctor.provider.address.landmark, address, doctor.provider.address.pincode].filter(Boolean).join(", ");
  const fee = formatFee(doctor.consultation_fee);
  const schedule = formatSchedule(doctor);
  const doctorHref = `/doctor/${encodeURIComponent(doctor.slug)}`;
  const providerHref = `/${encodeURIComponent(doctor.provider.slug)}`;

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-colors hover:border-cyan-200 dark:border-border-dark-subtle dark:bg-surface-dark dark:hover:border-cyan-900">
      <div className="relative z-20 p-3">
        <Link href={doctorHref} className="group flex items-start gap-2.5" aria-label={`View details for ${doctor.name}`}>
          <DoctorAvatar doctor={doctor} className="size-12 rounded-full" iconClassName="text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-lg font-extrabold leading-6 text-foreground transition-colors group-hover:text-brand dark:text-foreground-dark">{doctor.name}</h2>
                {specialties.length > 0 && <p className="mt-0.5 text-xs font-semibold leading-4 text-cyan-700 dark:text-cyan-300">{specialties.slice(0, 3).join(" | ")}</p>}
                {doctor.qualification && <p className="mt-0.5 truncate text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted">{doctor.qualification}</p>}
              </div>
              {fee && <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{fee}</span>}
            </div>
          </div>
        </Link>
        {schedule && (
          <p className={`mt-2 flex items-start gap-1.5 text-xs font-bold ${doctor.schedule?.is_available || doctor.schedule?.is_today ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            <CalendarClock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{schedule}</span>
          </p>
        )}
        <Link href={providerHref} className="group mt-3 flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:border-cyan-200 hover:bg-cyan-50/40 dark:border-border-dark-subtle dark:bg-surface-dark-secondary dark:hover:border-cyan-900 dark:hover:bg-cyan-950/20">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-slate-200 dark:bg-surface-dark-tertiary">
            <Image src={doctor.provider.cover_image || "/images/default.jpg"} alt="" fill sizes="44px" className="object-cover" />
          </div>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-extrabold text-foreground group-hover:text-brand dark:text-foreground-dark">{doctor.provider.name}</span>
                {doctor.provider.is_verified && <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Verified provider" />}
              </span>
            {fullAddress && <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-foreground-muted dark:text-foreground-dark-muted"><MapPin size={12} className="shrink-0" aria-hidden="true" /><span className="truncate">{fullAddress}</span></span>}
            </span>
          <ChevronRight size={17} className="shrink-0 text-foreground-subtle transition-colors group-hover:text-brand" aria-hidden="true" />
        </Link>
        <div className="relative z-20 mt-3 grid grid-cols-3 gap-2">
          <Action href={doctor.provider.contact.phone ? `tel:${doctor.provider.contact.phone}` : undefined} icon="fa-phone" label="Call" />
          <Action href={doctor.provider.contact.whatsapp ? `https://wa.me/${digits(doctor.provider.contact.whatsapp)}` : undefined} icon="fa-whatsapp" label="WhatsApp" brandIcon external />
          <Action href={doctorHref} icon="fa-circle-info" label="Details" />
        </div>
      </div>
    </article>
  );
}

function DoctorAvatar({ doctor, className, iconClassName }: { doctor: DoctorListItem; className: string; iconClassName: string }) {
  return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-900 ${className}`}>
    {doctor.profile_image ? <Image src={doctor.profile_image} alt="" fill sizes="48px" className="object-cover" /> : <i className={`fa-solid fa-user-doctor ${iconClassName}`} aria-hidden="true" />}
  </span>;
}

function Action({ href, icon, label, external = false, brandIcon = false }: { href?: string; icon: string; label: string; external?: boolean; brandIcon?: boolean }) {
  const className = "pointer-events-auto flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-2 text-[11px] font-extrabold text-cyan-800 transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900 dark:bg-surface-dark dark:text-cyan-200 dark:hover:bg-cyan-950";
  const content = <><i className={`${brandIcon ? "fa-brands" : "fa-solid"} ${icon} shrink-0 text-xs`} aria-hidden="true" /><span className="truncate">{label}</span></>;
  if (!href) return <span className={`${className} cursor-not-allowed opacity-40`} aria-disabled="true">{content}</span>;
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className}>{content}</a>;
}

function DoctorListSkeleton() {
  return <div className="grid gap-3 md:grid-cols-2" aria-label="Loading doctors">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-xl bg-white dark:bg-surface-dark" />)}</div>;
}

function StateMessage({ title, message, action }: { title: string; message: string; action?: () => void }) {
  return <div className="flex flex-col items-center px-5 py-20 text-center"><span className="flex size-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"><Stethoscope size={26} aria-hidden="true" /></span><h2 className="mt-4 text-lg font-extrabold text-foreground dark:text-foreground-dark">{title}</h2><p className="mt-2 text-sm text-foreground-muted dark:text-foreground-dark-muted">{message}</p>{action && <button type="button" onClick={action} className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Try again</button>}</div>;
}
