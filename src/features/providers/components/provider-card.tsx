"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import type { ProviderListItem } from "../provider.types";
import { formatProviderTime, getProviderCityName, hasDisplayableProviderHours } from "../provider.utils";

function digits(value: string) {
	return value.replace(/\D/g, "");
}

const hoursStatus = {
	open: { label: "Open", className: "text-emerald-600 dark:text-emerald-400" },
	closing_soon: {
		label: "Closing soon",
		className: "text-amber-600 dark:text-amber-400",
	},
	closed: { label: "Closed", className: "text-rose-600 dark:text-rose-400" },
} as const;

export function ProviderCard({ provider }: { provider: ProviderListItem }) {
	const [shareOpen, setShareOpen] = useState(false);
	const [shareUrl, setShareUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const categoryText = (provider.categories ?? [])
		.map((category) => category.display_name)
		.join(" · ");
	const offeringsText = (provider.offerings ?? [])
		.map((offering) => offering.trim())
		.filter(Boolean)
		.join(" · ");
	const cityName = getProviderCityName(provider.location.city);
	const addressParts = provider.location.display_full_address === false
		? [provider.location.locality, cityName]
		: [
			provider.location.address,
			provider.location.locality,
			cityName,
		];
	const address = addressParts
		.filter(Boolean)
		.join(", ");
	const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${provider.location.coordinates.latitude},${provider.location.coordinates.longitude}`;
	const providerHours = hasDisplayableProviderHours(provider.hours) ? provider.hours : null;
	const currentHours = providerHours ? hoursStatus[providerHours.status] : null;
	const hoursText = providerHours
		? providerHours.remark || (providerHours.next_closing_time ? formatProviderTime(providerHours.next_closing_time) : "")
		: "";
	const shareMessage = `Check out this provider on MedNearby, ${provider.name}, View details, contact, services, timings & more:\n${shareUrl}`;

	async function share() {
		const url = new URL(`/${encodeURIComponent(provider.slug)}`, window.location.origin).href;
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
				text: `Check out this provider on MedNearby, ${provider.name}, View details, contact, services, timings & more:\n${url}`,
			});
		} catch (error) {
			if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
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

	return (
		<>
			<article className="relative -mx-page border-b-4 border-background-muted bg-surface px-page py-4 first:border-t-4 first:pt-3 dark:border-background-dark-muted dark:bg-surface-dark">
				<Link href={`/${encodeURIComponent(provider.slug)}`} className="flex items-center gap-2.5" aria-label={`View ${provider.name}`}>
					<div className="relative h-30 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-tertiary dark:bg-surface-dark-tertiary">
						<Image
							src={provider.media.thumbnail || "/images/default.jpg"}
							alt=""
							fill
							sizes="112px"
							className="object-cover"
						/>
					</div>
					<div className="min-w-0 flex-1 py-0.5">
						{provider.is_verified && (
							<span
								className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-extrabold text-brand dark:bg-brand-950 dark:text-brand-300"
								title="Verified provider"
							>
								<i className="fa-solid fa-badge-check" aria-hidden="true" />
								Verified
							</span>
						)}
						<h2 className="truncate text-base font-extrabold text-foreground transition-colors group-hover/details:text-brand dark:text-foreground-dark">
							{provider.name}
						</h2>
						<p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
							{offeringsText || categoryText}
						</p>
						<p className="mt-1.5 flex min-w-0 items-center gap-1 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
							<MapPin size={14} className="shrink-0 text-foreground-muted" aria-hidden="true" />
							<span className="min-w-0 truncate">{address}</span>
						</p>
						{providerHours && currentHours && (
							<p className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-foreground-muted dark:text-foreground-dark-muted">
								<Clock size={12} className={currentHours.className} aria-hidden="true" />
								<span className={currentHours.className}>{currentHours.label}</span>
								{hoursText && (
									<>
										<span aria-hidden="true">·</span>
										<span className="min-w-0 truncate font-medium">{hoursText}</span>
									</>
								)}
							</p>
						)}
					</div>
				</Link>

				<div className="mt-2.5 flex gap-1.5">
					<Action href={provider.contact.phone ? `tel:${provider.contact.phone}` : undefined} icon="fa-phone" label="Call" />
					{provider.contact.whatsapp && (
						<Action href={`https://wa.me/${digits(provider.contact.whatsapp)}`} icon="fa-whatsapp" label="WhatsApp" external />
					)}
					{provider.location.display_full_address !== false && provider.location.address && (
						<Action href={directionsUrl} icon="fa-diamond-turn-right" label="Direction" external />
					)}
					<Action onClick={share} icon="fa-share-nodes" label="Share" />
				</div>
			</article>
			<BottomSheetModal open={shareOpen} onClose={() => setShareOpen(false)} title={`Share ${provider.name}`} closeLabel="Close share options">
				<div className="px-page pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
					<h2 className="text-xl font-extrabold">Share this provider</h2>
					<p className="mt-1 text-sm text-foreground-muted dark:text-foreground-dark-muted">
						Send {provider.name} to friends and family.
					</p>
					<div className="mt-6 flex items-start justify-center gap-10">
						<a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noreferrer" className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center">
							<span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-600 transition-transform group-hover:scale-105 dark:bg-emerald-950 dark:text-emerald-300">
								<i className="fa-brands fa-whatsapp" aria-hidden="true" />
							</span>
							<span className="text-[11px] font-semibold text-foreground-secondary dark:text-foreground-dark-secondary">WhatsApp</span>
						</a>
						<button type="button" onClick={copyShareLink} className="group flex w-16 min-w-0 flex-col items-center gap-2 text-center">
							<span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg text-brand transition-transform group-hover:scale-105 dark:bg-brand-950 dark:text-brand-300">
								<i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} aria-hidden="true" />
							</span>
							<span className="text-[11px] font-semibold text-foreground-secondary dark:text-foreground-dark-secondary">{copied ? "Copied" : "Copy link"}</span>
						</button>
					</div>
				</div>
			</BottomSheetModal>
		</>
	);
}

function Action({
	href,
	icon,
	label,
	external = false,
	onClick,
}: {
	href?: string;
	icon: string;
	label: string;
	external?: boolean;
	onClick?: () => void;
}) {
	const classes =
		"group flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/70 px-2 text-[10px] font-bold text-foreground-secondary transition-all hover:border-brand hover:bg-brand-100 hover:text-brand active:scale-[0.98] dark:border-brand-800 dark:bg-brand-950/50 dark:text-foreground-dark-secondary dark:hover:border-brand-500 dark:hover:bg-brand-900/60 dark:hover:text-brand-300";
	const content = (
		<>
			<span className="flex shrink-0 items-center justify-center text-brand dark:text-brand-300">
				<i className={`${icon === "fa-whatsapp" ? "fa-brands" : "fa-solid"} ${icon} text-xs`} />
			</span>
			<span className="truncate">{label}</span>
			{external && <ExternalLink className="sr-only" />}
		</>
	);
	if (onClick)
		return (
			<button type="button" onClick={onClick} className={classes}>
				{content}
			</button>
		);
	if (!href)
		return (
			<span className={`${classes} cursor-not-allowed opacity-40`} aria-disabled="true">
				{content}
			</span>
		);
	return (
		<a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={classes}>
			{content}
		</a>
	);
}
