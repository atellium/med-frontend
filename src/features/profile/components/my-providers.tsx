"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import { getOwnedProviders } from "../profile.service";
import type { OwnedProvider } from "../profile.types";

export function MyProviders() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({ queryKey: ["providers", "mine"], queryFn: getOwnedProviders });

  if (!isPending && !isError && data?.results.length === 0) return null;

  return <section className="mt-5" aria-labelledby="my-providers-heading">
    <h2 id="my-providers-heading" className="mb-3 text-base font-extrabold text-foreground">My listings</h2>
    {isPending && <ProviderListSkeleton />}
    {isError && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-danger"><p className="font-semibold">Couldn&apos;t load your providers.</p><button type="button" onClick={() => void refetch()} disabled={isFetching} className="mt-2 font-extrabold underline disabled:opacity-60">{isFetching ? "Trying again…" : "Try again"}</button></div>}
    {data && data.results.length > 0 && <div className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">{data.results.map((provider) => <OwnedProviderCard key={provider.id} provider={provider} />)}</div>}
  </section>;
}

function OwnedProviderCard({ provider }: { provider: OwnedProvider }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const category = provider.categories?.map((item) => item.display_name).join(" · ") || "Uncategorized";
  const isPublished = provider.publication_status === "published";
  const publicPath = `/${encodeURIComponent(provider.slug)}`;
  const shareMessage = `Please view our business profile on MedNearby, ${provider.name}. You can see details, contact, services, timings & more:\n${shareUrl}`;

  async function shareProvider() {
    const url = new URL(publicPath, window.location.origin).href;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (!isMobile || !navigator.share) {
      setShareUrl(url);
      setCopied(false);
      setShareOpen(true);
      return;
    }

    try {
      await navigator.share({
        title: provider.name,
        text: `Please view our business profile on MedNearby, ${provider.name}. You can see details, contact, services, timings & more:\n${url}`,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setCopied(false);
    }
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

  return <>
  <article className="bg-white p-3">
    <div className="flex min-w-0 gap-2.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Image src={!imageFailed && provider.media.thumbnail ? provider.media.thumbnail : "/images/default.jpg"} alt="" fill sizes="56px" className="object-cover" onError={() => setImageFailed(true)} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1"><h3 className="truncate text-sm font-extrabold text-foreground">{provider.name}</h3>{provider.is_verified && <i className="fa-solid fa-badge-check shrink-0 text-xs text-brand" title="Verified" aria-label="Verified" />}</div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold capitalize ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{provider.publication_status.replaceAll("_", " ")}</span>
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-foreground-muted">{category}</p>
      </div>
    </div>
    <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-2.5">
      <CardAction href={publicPath} icon="fa-eye" label="View" />
      <CardAction href={`${publicPath}/manage/dashboard`} icon="fa-gear" label="Manage" />
      <CardAction onClick={shareProvider} icon={copied ? "fa-check" : "fa-share-nodes"} label={copied ? "Copied" : "Share"} />
    </div>
  </article>
  <BottomSheetModal open={shareOpen} onClose={() => setShareOpen(false)} title={`Share ${provider.name}`} closeLabel="Close share options">
    <div className="px-page pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <h2 className="text-xl font-extrabold">Share your business</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Send your MedNearby profile to customers.
      </p>
      <div className="mt-6 flex items-start justify-center gap-10">
        <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noreferrer" className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-600 transition-transform group-hover:scale-105">
            <i className="fa-brands fa-whatsapp" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold text-foreground-secondary">WhatsApp</span>
        </a>
        <button type="button" onClick={copyShareLink} className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg text-brand transition-transform group-hover:scale-105">
            <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold text-foreground-secondary">{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
    </div>
  </BottomSheetModal>
  </>;
}

function CardAction({ href, icon, label, onClick }: { href?: string; icon: string; label: string; onClick?: () => void }) {
  const className = "flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-50 px-2 text-[11px] font-extrabold text-brand transition hover:bg-brand-100";
  const content = <><i className={`fa-solid ${icon}`} aria-hidden="true" /><span>{label}</span></>;
  if (href) return <Link href={href} className={className}>{content}</Link>;
  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function ProviderListSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading providers">{[0, 1].map((item) => <div key={item} className="flex animate-pulse gap-2.5 rounded-xl border border-slate-100 p-2.5"><div className="size-14 rounded-lg bg-slate-100" /><div className="flex-1 py-1"><div className="h-4 w-2/3 rounded bg-slate-100" /><div className="mt-3 h-3 w-1/2 rounded bg-slate-100" /></div></div>)}</div>;
}
