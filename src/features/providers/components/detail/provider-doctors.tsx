"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { getProviderDoctorList } from "../../provider.service";
import type { DoctorListItem, DoctorScheduleEntry } from "../../provider.types";
import { formatProviderTime } from "../../provider.utils";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function ProviderDoctorsSection({ providerSlug, phone }: { providerSlug: string; phone: string | null }) {
  const query = useQuery({
    queryKey: ["provider", providerSlug, "doctors"],
    queryFn: () => getProviderDoctorList(providerSlug),
  });
  const doctors = (query.data?.results ?? []).filter((doctor) => doctor.is_active);

  if (query.isPending) return <DoctorSkeleton />;
  if (query.isError || doctors.length === 0) return null;

  return <section className="mt-5" aria-labelledby="provider-doctors-heading">
    <h2 id="provider-doctors-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">
      Available doctors
    </h2>
    <div className="mt-2.5 space-y-3">
      {doctors.slice(0, 6).map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} phone={phone} />)}
    </div>
  </section>;
}

function DoctorCard({ doctor, phone }: { doctor: DoctorListItem; phone: string | null }) {
  const specialties = doctor.specialties?.map((specialty) => specialty.label || specialty.name).filter(Boolean) ?? [];
  const feeText = formatFee(doctor.consultation_fee);
  const schedule = formatSchedule(doctor);
  const doctorHref = `/doctor/${encodeURIComponent(doctor.slug)}`;
  const enquiryPhone = doctor.provider.contact.phone || phone;

  return <article className="group relative rounded-xl border border-brand-100 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-colors hover:border-brand-200 dark:border-brand-900 dark:bg-surface-dark-secondary dark:hover:border-brand-800">
    <Link href={doctorHref} className="absolute inset-0 z-10 rounded-xl" aria-label={`View details for ${doctor.name}`} />
    <div className="relative flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-950 dark:text-brand-300">
        <i className="fa-solid fa-user-doctor text-lg" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-extrabold leading-5 text-foreground transition-colors group-hover:text-brand dark:text-foreground-dark dark:group-hover:text-brand-300">{doctor.name}</h3>
          {feeText && <span className="shrink-0 text-sm font-extrabold text-brand dark:text-brand-300">{feeText}</span>}
        </div>
        {specialties.length > 0 && <p className="mt-1 text-xs font-bold text-foreground-muted dark:text-foreground-dark-muted">{specialties.join(" | ")}</p>}
        {doctor.qualification && <p className="mt-1 text-xs text-foreground-muted dark:text-foreground-dark-muted">{doctor.qualification}</p>}
      </div>
    </div>
    {schedule && <p className={`mt-3 flex items-start gap-1.5 text-xs font-bold ${doctor.schedule?.is_available || doctor.schedule?.is_today ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}><CalendarClock size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{schedule}</span></p>}
    {doctor.schedule?.full_schedule && doctor.schedule.full_schedule.length > 0 && <FullSchedule doctor={doctor} />}
    {enquiryPhone && <a href={`tel:${enquiryPhone}`} className="relative z-20 mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white text-xs font-extrabold text-brand transition-colors hover:border-brand hover:bg-brand-50 dark:border-brand-800 dark:bg-surface-dark-secondary dark:text-brand-300 dark:hover:bg-brand-950/40"><i className="fa-solid fa-phone text-[11px]" aria-hidden="true" />Enquiry</a>}
  </article>;
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
  return [nextSlot.schedule_label, formatScheduleEntry(nextSlot)].filter(Boolean).join(", ");
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
  return [time, consultationType].filter(Boolean).join(" | ");
}

function FullSchedule({ doctor }: { doctor: DoctorListItem }) {
  const entries = doctor.schedule?.full_schedule ?? [];

  return <div className="mt-3 rounded-xl border border-border-subtle p-3 dark:border-border-dark-subtle">
    <div className="space-y-1.5">
      {entries.map((entry, index) => (
        <p key={`${entry.schedule_label}-${entry.start_time}-${index}`} className="flex items-start justify-between gap-3 text-xs text-foreground-muted dark:text-foreground-dark-muted">
          <span className="min-w-0 font-bold text-foreground dark:text-foreground-dark">{entry.schedule_label}</span>
          <span className="shrink-0 text-right font-semibold">
            {formatScheduleEntry(entry)}
          </span>
        </p>
      ))}
    </div>
  </div>;
}

function DoctorSkeleton() {
  return <section className="mt-5" aria-label="Loading doctors">
    <div className="h-5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-2.5 space-y-3">
      {[0, 1].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
    </div>
  </section>;
}
