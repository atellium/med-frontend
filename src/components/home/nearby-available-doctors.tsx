"use client";

import axios from "axios";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getNearbyAvailableDoctors } from "@/features/providers/provider.service";
import type { DoctorListItem } from "@/features/providers/provider.types";
import { formatProviderTime } from "@/features/providers/provider.utils";

const HOME_DOCTOR_LAT = 22.4677;
const HOME_DOCTOR_LNG = 88.4023;
const HOME_DOCTORS_PAGE_HREF = "/kolkata/baruipur/doctors";
const HOMEPAGE_DOCTOR_LIMIT = 6;

export function NearbyAvailableDoctors() {
  const query = useQuery({
    queryKey: ["nearby-available-doctors", "home", HOME_DOCTOR_LAT, HOME_DOCTOR_LNG],
    queryFn: () => getNearbyAvailableDoctors({ lat: HOME_DOCTOR_LAT, lng: HOME_DOCTOR_LNG }),
  });

  const doctors = query.data?.results.slice(0, HOMEPAGE_DOCTOR_LIMIT) ?? [];
  const errorMessage = axios.isAxiosError(query.error)
    ? (query.error.response?.data?.detail ?? query.error.message)
    : query.error instanceof Error
      ? query.error.message
      : "Unable to load nearby doctors.";

  if (query.isSuccess && doctors.length === 0) return null;

  return (
    <section
      className="mx-auto w-full max-w-5xl pb-5"
      aria-labelledby="nearby-available-doctors-title"
    >
      <div className="mb-4 flex items-end justify-between gap-4 px-page">
        <div className="min-w-0">
          <h2
            id="nearby-available-doctors-title"
            className="text-lg font-extrabold tracking-tight text-foreground dark:text-foreground-dark"
          >
            Nearby Doctors Available
          </h2>
        </div>
        <Link
          href={HOME_DOCTORS_PAGE_HREF}
          className="shrink-0 text-xs font-extrabold text-brand hover:text-brand-800"
        >
          View all
          <i className="fa-solid fa-chevron-right ml-1 text-[9px]" aria-hidden="true" />
        </Link>
      </div>

      {query.isPending ? (
        <NearbyDoctorsSkeleton />
      ) : query.isError ? (
        <div className="mx-page rounded-2xl border border-border-subtle bg-surface p-5 text-center shadow-xs dark:border-border-dark-subtle dark:bg-surface-dark">
          <p className="text-sm font-extrabold text-foreground dark:text-foreground-dark">
            Couldn&apos;t load nearby doctors
          </p>
          <p className="mt-1 text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          className="hide-scrollbar flex gap-3 overflow-x-auto px-page pb-3"
          aria-label="Nearby available doctors list"
        >
          {doctors.map((doctor) => (
            <NearbyAvailableDoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </section>
  );
}

function NearbyAvailableDoctorCard({ doctor }: { doctor: DoctorListItem }) {
  const specialties = doctor.specialties?.map((specialty) => specialty.name).filter(Boolean) ?? [];
  const schedule = formatSchedule(doctor);
  const address = [
    doctor.provider.address.address,
    doctor.provider.address.landmark,
    doctor.provider.address.locality,
    doctor.provider.city.name,
    doctor.provider.address.pincode,
  ].filter(Boolean).join(", ");
  const doctorHref = `/doctor/${encodeURIComponent(doctor.slug)}`;
  const providerHref = `/${encodeURIComponent(doctor.provider.slug)}`;
  const phone = doctor.provider.contact.phone;
  const directionsHref = doctor.provider.address.latitude !== null && doctor.provider.address.longitude !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${doctor.provider.address.latitude},${doctor.provider.address.longitude}`
    : undefined;

  return (
    <article className="flex w-[82vw] max-w-80 shrink-0 flex-col rounded-2xl border border-border-subtle bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-cyan-200 dark:border-border-dark-subtle dark:bg-surface-dark-secondary dark:hover:border-cyan-900">
      <Link href={doctorHref} className="group flex min-w-0 gap-3" aria-label={`View ${doctor.name}`}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-900">
          <i className="fa-solid fa-user-doctor text-xl" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-base font-extrabold leading-5 text-foreground transition-colors group-hover:text-brand dark:text-foreground-dark">
            {doctor.name}
          </span>
          {specialties.length > 0 && (
            <span className="mt-1 block truncate text-xs font-bold text-cyan-700 dark:text-cyan-300">
              {specialties.slice(0, 2).join(" | ")}
            </span>
          )}
          {doctor.qualification && (
            <span className="mt-1 block truncate text-xs font-medium text-foreground-muted dark:text-foreground-dark-muted">
              {doctor.qualification}
            </span>
          )}
        </span>
      </Link>

      <div className="mt-3 space-y-2 text-xs">
        {schedule && (
          <p className={`flex items-start gap-2 font-bold ${doctor.schedule?.is_available || doctor.schedule?.is_today ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            <i className="fa-solid fa-calendar-clock mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{schedule}</span>
          </p>
        )}
        <Link href={providerHref} className="flex min-w-0 items-start gap-2 text-foreground-muted transition-colors hover:text-brand dark:text-foreground-dark-muted">
          <i className="fa-solid fa-hospital mt-0.5 shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate font-extrabold text-foreground dark:text-foreground-dark">
              {doctor.provider.name}
            </span>
            {address && <span className="mt-0.5 block truncate">{address}</span>}
          </span>
        </Link>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
        <DoctorCardAction href={phone ? `tel:${phone}` : undefined} icon="fa-phone" label="Call" />
        <DoctorCardAction href={directionsHref} icon="fa-diamond-turn-right" label="Route" external />
        <DoctorCardAction href={doctorHref} icon="fa-circle-info" label="Details" />
      </div>
    </article>
  );
}

function DoctorCardAction({
  href,
  icon,
  label,
  external = false,
}: {
  href?: string;
  icon: string;
  label: string;
  external?: boolean;
}) {
  const className = "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-2 text-[11px] font-extrabold text-cyan-800 transition-colors hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900 dark:bg-surface-dark dark:text-cyan-200 dark:hover:bg-cyan-950";
  const content = (
    <>
      <i className={`fa-solid ${icon} shrink-0 text-xs`} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </>
  );

  if (!href) {
    return (
      <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-40`}>
        {content}
      </span>
    );
  }

  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className}>
      {content}
    </a>
  );
}

function formatSchedule(doctor: DoctorListItem) {
  if (doctor.schedule?.is_available) return "Available now";
  if (doctor.schedule?.next_available) return doctor.schedule.next_available;
  const nextSlot = doctor.schedule?.full_schedule[0];
  if (!nextSlot) return null;
  return `${nextSlot.schedule_label}, ${formatProviderTime(nextSlot.start_time)} - ${formatProviderTime(nextSlot.end_time)}`;
}

function NearbyDoctorsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-page pb-3" aria-label="Loading nearby doctors">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-64 w-[82vw] max-w-80 shrink-0 animate-pulse rounded-2xl bg-background-muted dark:bg-background-dark-muted"
        />
      ))}
    </div>
  );
}
