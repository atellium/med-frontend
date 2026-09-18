"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MobileHeader from "@/components/layout/MobileHeader";
import { getProviderNameBySlug } from "@/features/providers/provider.service";
import type { ProviderNameDetail } from "@/features/providers/provider.types";
import { updateOwnedProvider } from "../profile.service";

type ServiceItem = { id: string; name: string };

function createServiceId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProviderManageServicesScreen({ slug }: { slug: string }) {
  const provider = useQuery({
    queryKey: ["provider", "public-details", slug, "manage-services"],
    queryFn: () => getProviderNameBySlug(slug),
  });

  return <div className="min-h-dvh bg-slate-50 pb-10">
    <MobileHeader title="Services" subtitle={provider.data?.name ?? "Loading provider..."} />
    <main className="mx-auto w-full max-w-3xl px-page pt-5">
      {provider.isPending && <ServiceListSkeleton />}
      {provider.isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-danger"><p className="font-semibold">Couldn&apos;t load services.</p><button type="button" onClick={() => void provider.refetch()} className="mt-2 font-extrabold underline">Try again</button></div>}
      {provider.data && <ServicesEditor key={provider.data.slug} provider={provider.data} />}
    </main>
  </div>;
}

function ServicesEditor({ provider }: { provider: ProviderNameDetail }) {
  const [items, setItems] = useState<ServiceItem[]>(() => (provider.services ?? []).map((name) => ({ id: createServiceId(), name })));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (services: string[]) => updateOwnedProvider(provider.id, { services }),
    onSuccess: (updated) => {
      setItems((updated.services ?? []).map((name) => ({ id: createServiceId(), name })));
      setError(null);
      setSuccess("Services saved.");
      void queryClient.invalidateQueries({ queryKey: ["provider", "detail", provider.slug] });
      void queryClient.invalidateQueries({ queryKey: ["provider", "public-details", provider.slug] });
    },
    onError: () => { setSuccess(null); setError("Unable to save services. Please try again."); },
  });

  useEffect(() => {
    if (!focusItemId) return;
    const input = inputRefs.current[focusItemId];
    if (!input) return;
    input.focus();
    input.select();
    setFocusItemId(null);
  }, [focusItemId, items]);

  function updateItem(id: string, name: string) {
    setSuccess(null);
    setItems((current) => current.map((item) => item.id === id ? { ...item, name } : item));
  }

  function removeItem(id: string) {
    setSuccess(null);
    setError(null);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    setSuccess(null);
    setItems((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function addItem() {
    setSuccess(null);
    const blankItem = items.find((item) => !item.name.trim());
    if (blankItem) {
      setError("Enter a name for the blank service before adding another.");
      setFocusItemId(blankItem.id);
      return;
    }
    const nextItem = { id: createServiceId(), name: "" };
    setError(null);
    setItems((current) => [...current, nextItem]);
    setFocusItemId(nextItem.id);
  }

  function saveServices() {
    const services = items.map((item) => item.name.trim());
    if (services.some((name) => !name)) {
      setSuccess(null);
      setError("Enter a name for every service or delete empty items.");
      return;
    }
    setError(null);
    mutation.mutate(services);
  }

  return <>
    {items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center"><i className="fa-solid fa-screwdriver-wrench text-2xl text-brand" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-foreground">No services added</p></div>
      : <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">{items.map((item, index) => <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 p-3 last:border-b-0">
        <input ref={(element) => { inputRefs.current[item.id] = element; }} value={item.name} onChange={(event) => updateItem(item.id, event.target.value)} disabled={mutation.isPending} placeholder="Service name" aria-label={`Service ${index + 1}`} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-foreground outline-none focus:border-brand disabled:opacity-60" />
        <div className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-brand-100 bg-brand-50/40">
          <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0 || mutation.isPending} aria-label={`Move service ${index + 1} up`} className="flex size-6 items-center justify-center text-brand disabled:text-slate-300"><i className="fa-solid fa-arrow-up text-[10px]" aria-hidden="true" /></button>
          <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1 || mutation.isPending} aria-label={`Move service ${index + 1} down`} className="flex size-6 items-center justify-center border-t border-brand-100 text-brand disabled:text-slate-300"><i className="fa-solid fa-arrow-down text-[10px]" aria-hidden="true" /></button>
        </div>
        <button type="button" onClick={() => removeItem(item.id)} disabled={mutation.isPending} aria-label={`Delete service ${index + 1}`} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger disabled:opacity-60"><i className="fa-solid fa-trash" aria-hidden="true" /></button>
      </div>)}</div>}
    <button type="button" onClick={addItem} disabled={mutation.isPending} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white text-sm font-extrabold text-brand disabled:opacity-60"><i className="fa-solid fa-plus" aria-hidden="true" />Add service</button>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p>}
    {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</p>}
    <button type="button" onClick={saveServices} disabled={mutation.isPending} className="mt-5 h-12 w-full rounded-xl bg-brand text-sm font-extrabold text-white disabled:opacity-60">{mutation.isPending ? "Saving..." : "Save changes"}</button>
  </>;
}

function ServiceListSkeleton() {
  return <div className="space-y-3" aria-label="Loading services">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-white" />)}</div>;
}
