"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MobileHeader from "@/components/layout/MobileHeader";
import { BottomSheetModal } from "@/components/modals";
import type { DoctorListItem } from "@/features/providers/provider.types";
import { getProviderDoctorList } from "@/features/providers/provider.service";
import { deleteDoctor } from "../profile.service";

export function ProviderManageDoctorsScreen({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DoctorListItem | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["provider", slug, "doctors", page], queryFn: () => getProviderDoctorList(slug, page) });
  const remove = useMutation({
    mutationFn: (doctorId: string) => {
      if (!query.data?.provider?.id) throw new Error("Provider not loaded.");
      return deleteDoctor(query.data.provider.id, doctorId);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["provider", slug, "doctors"] });
    },
  });
  const pagination = query.data?.pagination;

  function changePage(nextPage: number) { setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <div className="min-h-dvh bg-slate-50 pb-10">
    <MobileHeader title="Doctors" subtitle={query.data?.provider?.name || "Loading provider..."} />
    <main className="mx-auto w-full max-w-3xl px-page pt-5">
      {query.data && <section className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"><div><p className="text-xs font-semibold text-foreground-muted">Total doctors</p><p className="mt-1 text-2xl font-extrabold text-foreground">{pagination?.total_items ?? query.data.results.length}</p></div><Link href={`/${encodeURIComponent(slug)}/manage/doctors/add`} className="flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-extrabold text-white"><i className="fa-solid fa-plus" aria-hidden="true" />Add doctor</Link></section>}
      {query.isPending && <DoctorListSkeleton />}
      {query.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-danger"><p className="font-semibold">Couldn&apos;t load doctors.</p><button type="button" onClick={() => void query.refetch()} className="mt-2 font-extrabold underline">Try again</button></div>}
      {query.data?.results.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center"><i className="fa-solid fa-user-doctor text-2xl text-brand" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-foreground">No doctors found</p></div>}
      {query.data && query.data.results.length > 0 && <><div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">{query.data.results.map((doctor) => <DoctorRow key={doctor.id} slug={slug} doctor={doctor} onDelete={() => setDeleteTarget(doctor)} />)}</div>{pagination && pagination.total_pages > 1 && <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Doctor pagination"><button type="button" disabled={!pagination.has_previous || query.isFetching} onClick={() => changePage(page - 1)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold disabled:opacity-40"><i className="fa-solid fa-chevron-left mr-2" />Previous</button><span className="text-xs font-semibold text-foreground-muted">Page {pagination.page} of {pagination.total_pages}</span><button type="button" disabled={!pagination.has_next || query.isFetching} onClick={() => changePage(page + 1)} className="h-10 rounded-xl bg-brand px-4 text-xs font-extrabold text-white disabled:opacity-40">Next<i className="fa-solid fa-chevron-right ml-2" /></button></nav>}</>}
    </main>
    <DeleteSheet doctor={deleteTarget} pending={remove.isPending} error={remove.isError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id)} />
  </div>;
}

function DoctorRow({ slug, doctor, onDelete }: { slug: string; doctor: DoctorListItem; onDelete: () => void }) {
  const specialties = doctor.specialties?.slice(0, 2).map((specialty) => specialty.name).join(" | ") || "No specialty";
  return <article className="border-b border-slate-100 p-4 last:border-b-0"><div className="flex items-center gap-3"><DoctorAvatar doctor={doctor} className="size-14 rounded-lg" iconClassName="text-lg" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="truncate text-sm font-extrabold text-foreground">{doctor.name}</h2>{doctor.consultation_fee && <p className="shrink-0 text-sm font-extrabold text-brand">{formatCurrency(doctor.consultation_fee)}</p>}</div><p className="mt-1 truncate text-xs font-semibold text-foreground-muted">{specialties}</p><p className="mt-1 truncate text-xs text-foreground-muted">{[doctor.qualification, doctor.schedule?.next_available].filter(Boolean).join(" | ")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><Link href={`/${encodeURIComponent(slug)}/manage/doctors/${encodeURIComponent(doctor.slug)}/edit`} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-50 text-[11px] font-extrabold text-brand"><i className="fa-solid fa-pen" />Edit</Link><button type="button" onClick={onDelete} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-red-50 text-[11px] font-extrabold text-danger"><i className="fa-solid fa-trash" />Delete</button></div></article>;
}

function DoctorAvatar({ doctor, className, iconClassName }: { doctor: DoctorListItem; className: string; iconClassName: string }) {
  return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-brand-50 text-brand ${className}`}>
    {doctor.profile_image ? <Image src={doctor.profile_image} alt="" fill sizes="56px" className="object-cover" /> : <i className={`fa-solid fa-user-doctor ${iconClassName}`} aria-hidden="true" />}
  </span>;
}

function DeleteSheet({ doctor, pending, error, onClose, onConfirm }: { doctor: DoctorListItem | null; pending: boolean; error: boolean; onClose: () => void; onConfirm: () => void }) {
  return <BottomSheetModal open={Boolean(doctor)} onClose={() => !pending && onClose()} title="Delete doctor" closeLabel="Close delete confirmation"><div className="px-page pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6"><h2 className="text-lg font-extrabold">Delete doctor?</h2><p className="mt-2 text-sm text-foreground-muted">{doctor?.name} will be permanently deleted.</p>{error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">Couldn&apos;t delete this doctor. Try again.</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={pending} onClick={onClose} className="h-11 rounded-xl border border-slate-200 text-sm font-extrabold">Cancel</button><button type="button" disabled={pending} onClick={onConfirm} className="h-11 rounded-xl bg-danger text-sm font-extrabold text-white disabled:opacity-60">{pending ? "Deleting..." : "Delete"}</button></div></div></BottomSheetModal>;
}

function formatCurrency(value: string) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value)); }
function DoctorListSkeleton() { return <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white" aria-label="Loading doctors">{[0, 1, 2, 3].map((item) => <div key={item} className="flex animate-pulse justify-between border-b border-slate-100 p-4"><div className="w-2/3"><div className="h-4 w-3/4 rounded bg-slate-100" /><div className="mt-2 h-3 w-1/2 rounded bg-slate-100" /></div><div className="h-4 w-16 rounded bg-slate-100" /></div>)}</div>; }
