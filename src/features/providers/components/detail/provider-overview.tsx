"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Clock, MapPin } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomSheetModal } from "@/components/modals";
import { getProviders } from "../../provider.service";
import type { ProviderNameDetail } from "../../provider.types";
import { formatProviderSlots, formatProviderTime, getProviderCityName, hasDisplayableProviderHours, providerDayNames } from "../../provider.utils";
import { getDemoProviderProducts } from "../../demo-products";
import { ProviderProductsSection } from "./provider-products";
import { ProviderOffersSection } from "./provider-offers";
import { ProviderGallery } from "./provider-gallery";
import { ProviderDoctorsSection } from "./provider-doctors";

function getScheduleDays() {
	const currentDay = (new Date().getDay() + 6) % 7;
	return [...providerDayNames.slice(currentDay), ...providerDayNames.slice(0, currentDay)];
}

const statusDetails = {
	open: { label: "Open", className: "text-emerald-600 dark:text-emerald-400" },
	closing_soon: { label: "Closing soon", className: "text-amber-600 dark:text-amber-400" },
	closed: { label: "Closed", className: "text-rose-600 dark:text-rose-400" },
} as const;

function externalUrl(value: string) {
	return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function socialLabel(value: string) {
	return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function socialIcon(value: string) {
	return value.toLowerCase() === "x" ? "fa-x-twitter" : `fa-${value.toLowerCase()}`;
}

function socialColor(value: string) {
	switch (value.toLowerCase()) {
		case "x": return "text-black dark:text-white";
		case "youtube": return "text-[#FF0000]";
		case "facebook": return "text-[#1877F2]";
		case "linkedin": return "text-[#0A66C2]";
		case "instagram": return "text-[#E4405F]";
		default: return "text-brand";
	}
}

function phoneDisplay(value: string) {
	return value.replace(/^\+91[\s-]?/, "");
}

function websiteDisplay(value: string) {
	return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function whatsappUrl(value: string, message?: string) {
	const number = value.replace(/\D/g, "");
	const query = message ? `?text=${encodeURIComponent(message)}` : "";
	return `https://wa.me/${number}${query}`;
}

function medicineEnquiryMessage() {
	return "Hi, I want to enquire about medicines.";
}

function homeCollectionMessage() {
	return "Hi, I want to book a home sample collection.";
}

function uniqueHighlights(items: string[]) {
	const seen = new Set<string>();
	return items.filter((item) => {
		const key = item.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function getProviderHighlights(provider: ProviderNameDetail) {
	const offerHighlights = (provider.offers ?? [])
		.filter((offer) => offer.is_active && (offer.is_currently_active || offer.status.toLowerCase() === "active"))
		.map((offer) => offer.title.trim())
		.filter(Boolean);
	const benefitPattern = /\b(discount|delivery|collection|pickup|home|free|offer|cashback)\b|%/i;
	const serviceHighlights = [...(provider.offerings ?? []), ...(provider.services ?? [])]
		.map((item) => item.trim())
		.filter((item) => item && benefitPattern.test(item));

	return uniqueHighlights([...offerHighlights, ...serviceHighlights]).slice(0, 6);
}

function highlightIcon(value: string) {
	const text = value.toLowerCase();
	if (text.includes("delivery")) return "fa-truck-fast";
	if (text.includes("collection") || text.includes("pickup") || text.includes("home")) return "fa-house-medical";
	if (text.includes("discount") || text.includes("offer") || text.includes("%") || text.includes("cashback")) return "fa-badge-percent";
	if (text.includes("free")) return "fa-gift";
	return "fa-circle-check";
}

function ProviderHighlightsSection({ highlights }: { highlights: string[] }) {
	if (highlights.length === 0) return null;

	return (
		<section className="mt-4" aria-labelledby="provider-highlights-heading">
			<h2 id="provider-highlights-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">
				Highlights
			</h2>
			<div className="-mx-page mt-2 flex gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{highlights.map((highlight, index) => (
					<div key={`${highlight}-${index}`} className="flex min-h-11 max-w-56 shrink-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-bold text-foreground shadow-sm dark:border-brand-800 dark:bg-brand-950/45 dark:text-foreground-dark">
						<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm dark:bg-surface-dark-secondary dark:text-brand-300">
							<i className={`fa-solid ${highlightIcon(highlight)} text-sm`} aria-hidden="true" />
						</span>
						<span className="line-clamp-2 leading-snug">{highlight}</span>
					</div>
				))}
			</div>
		</section>
	);
}

export function ProviderOverview({ provider, slug }: { provider: ProviderNameDetail; slug: string }) {
	const [hoursOpen, setHoursOpen] = useState(false);
	const [showFixedActions, setShowFixedActions] = useState(false);
	const primaryCategory = provider.categories?.[0];
	const categories = (provider.categories ?? []).map((category) => category.display_name).join(" · ");
	const offerings = (provider.offerings ?? []).map((offering) => offering.trim()).filter(Boolean).join(" · ");
	const { location, hours } = provider;
	const showHours = hasDisplayableProviderHours(hours);
	const similarProvidersQuery = useQuery({
		queryKey: ["providers", "similar", provider.id, primaryCategory?.slug],
		queryFn: () => getProviders({ lat: location.coordinates.latitude, lng: location.coordinates.longitude, category: primaryCategory?.slug, page: 1 }),
		enabled: Boolean(primaryCategory?.slug),
		select: (data) => data.results.filter((item) => item.id !== provider.id).slice(0, 10),
	});
	const address = (location.display_full_address
		? [location.address, location.landmark, location.locality, location.city.name, location.city.state, location.postal_code]
		: [location.locality, location.city.name]
	).filter(Boolean).join(", ");
  const status = showHours && hours ? statusDetails[hours.status] : null;
  const hoursText = showHours && hours
    ? hours.remark || (hours.next_closing_time ? formatProviderTime(hours.next_closing_time) : "")
    : "";
  const directionHref = location.display_full_address && Number.isFinite(location.coordinates.latitude) && Number.isFinite(location.coordinates.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.latitude},${location.coordinates.longitude}`
    : undefined;
  const actions = [
    provider.contact.phone ? {
      label: "Call",
      icon: "fa-phone",
      href: `tel:${provider.contact.phone}`,
      external: false,
      brandIcon: false,
    } : null,
    provider.contact.whatsapp ? {
      label: "WhatsApp",
      icon: "fa-whatsapp",
      href: whatsappUrl(provider.contact.whatsapp),
      external: true,
      brandIcon: true,
    } : null,
    directionHref ? {
      label: "Direction",
      icon: "fa-diamond-turn-right",
      href: directionHref,
      external: true,
      brandIcon: false,
    } : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);
  const enquiryActions = [
    provider.contact.whatsapp && provider.is_medicine_enquiry ? {
      label: "Medicine Enquiry",
      icon: "fa-prescription-bottle-medical",
      href: whatsappUrl(provider.contact.whatsapp, medicineEnquiryMessage()),
      className: "border-sky-500 bg-sky-500 hover:border-sky-600 hover:bg-sky-600 shadow-[0_6px_18px_rgba(14,165,233,0.22)] hover:shadow-[0_8px_22px_rgba(14,165,233,0.3)]",
    } : null,
    provider.contact.whatsapp && provider.is_test_book ? {
      label: "Book Home Collection",
      icon: "fa-vial-circle-check",
      href: whatsappUrl(provider.contact.whatsapp, homeCollectionMessage()),
      className: "border-emerald-500 bg-emerald-500 hover:border-emerald-600 hover:bg-emerald-600 shadow-[0_6px_18px_rgba(16,185,129,0.22)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.3)]",
    } : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);
  const alternateNumbers = (provider.contact.alternate_numbers ?? []).filter((number) => number && number !== provider.contact.phone);
  const contactOptions = [
    provider.contact.phone ? { label: "Phone", value: phoneDisplay(provider.contact.phone), href: `tel:${provider.contact.phone}`, icon: "fa-phone", brandIcon: false, external: false } : null,
    provider.contact.whatsapp ? { label: "WhatsApp", value: phoneDisplay(provider.contact.whatsapp), href: whatsappUrl(provider.contact.whatsapp), icon: "fa-whatsapp", brandIcon: true, external: true } : null,
    ...alternateNumbers.map((number, index) => ({ label: `Alternate phone${alternateNumbers.length > 1 ? ` ${index + 1}` : ""}`, value: phoneDisplay(number), href: `tel:${number}`, icon: "fa-phone-volume", brandIcon: false, external: false })),
    provider.contact.email ? { label: "Email", value: provider.contact.email, href: `mailto:${provider.contact.email}`, icon: "fa-envelope", brandIcon: false, external: false } : null,
    provider.contact.website ? { label: "Website", value: websiteDisplay(provider.contact.website), href: externalUrl(provider.contact.website), icon: "fa-globe", brandIcon: false, external: true } : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null);
  const socialOptions = ["facebook", "instagram", "youtube", "linkedin", "x"]
    .flatMap((network) => {
      const url = provider.contact.social_urls?.[network];
      return url ? [{ label: socialLabel(network), href: externalUrl(url), icon: socialIcon(network), color: socialColor(network) }] : [];
    });
  const services = (provider.services ?? []).map((service) => service.trim()).filter(Boolean);
  const realProducts = provider.product;
  const hasRealProducts = Boolean((realProducts?.items?.length ?? 0) > 0);
  const displayProducts = hasRealProducts ? realProducts : getDemoProviderProducts(provider);
	const highlights = getProviderHighlights(provider);

	useEffect(() => {
		function updateVisibility() {
			setShowFixedActions(window.scrollY > 200);
		}

		updateVisibility();
		window.addEventListener("scroll", updateVisibility, { passive: true });
		return () => window.removeEventListener("scroll", updateVisibility);
	}, []);

	return (
		<>
			<section className="relative z-10 -mt-6 rounded-t-3xl bg-surface px-page pt-2.5 pb-[calc(env(safe-area-inset-bottom)+5rem)] dark:bg-surface-dark dark:shadow-[0_-8px_24px_rgba(0,0,0,0.28)]">
				{provider.is_verified && (
					<span className="mb-0.5 inline-flex h-5 items-center gap-1 rounded-full bg-brand-50 px-2 text-[10px] font-extrabold leading-none text-brand dark:bg-brand-950 dark:text-brand-300">
						<i className="fa-solid fa-badge-check" aria-hidden="true" />
						Verified
					</span>
				)}
				<h1 className="text-xl font-extrabold leading-tight tracking-tight text-foreground dark:text-foreground-dark">{provider.name}</h1>
				{(offerings || categories) && <p className="mt-1 text-sm font-semibold text-foreground-muted dark:text-foreground-dark-muted">{offerings || categories}</p>}
				{address && (
					<p className="mt-1.5 flex items-start gap-2 text-sm text-foreground-secondary dark:text-foreground-dark-secondary">
						<MapPin size={17} className="mt-0.5 shrink-0 text-foreground-muted" aria-hidden="true" />
						<span>{address}</span>
					</p>
				)}
        {showHours && hours && status && (
					<button type="button" onClick={() => setHoursOpen(true)} className="mt-1.5 flex w-full items-center gap-2 text-left text-sm font-semibold text-foreground-secondary dark:text-foreground-dark-secondary" aria-haspopup="dialog">
						<Clock size={16} className={`shrink-0 ${status.className}`} aria-hidden="true" />
						<span className={status.className}>{status.label}</span>
						{hoursText && <><span aria-hidden="true">·</span><span className="min-w-0 truncate">{hoursText}</span></>}
						<ChevronDown size={16} className="ml-0.5 shrink-0" aria-hidden="true" />
          </button>
        )}
        {actions.length > 0 && (
          <div className={`mt-4 flex gap-2 ${actions.length > 3 ? "overflow-x-auto pb-1" : ""}`}>
            {actions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                className={`${actions.length > 3 ? "min-w-32 shrink-0" : "min-w-0 flex-1"} flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-brand-300/60 bg-brand-100/70 px-3 text-xs font-normal text-foreground shadow-sm transition-all hover:border-brand hover:bg-brand-100 hover:text-brand hover:shadow-md active:scale-[0.98] dark:border-brand-800 dark:bg-brand-950/70 dark:text-foreground-dark dark:hover:border-brand-500 dark:hover:bg-brand-900/70 dark:hover:text-brand-300`}
              >
                <i className={`${action.brandIcon ? "fa-brands text-[#25D366]" : "fa-solid text-brand dark:text-brand-300"} ${action.icon} shrink-0 text-base`} aria-hidden="true" />
                <span className="font-semibold">{action.label}</span>
              </a>
            ))}
          </div>
        )}
        {enquiryActions.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {enquiryActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className={`flex min-h-13 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center text-xs font-extrabold leading-tight text-white transition-all active:scale-[0.98] ${action.className}`}
              >
                <i className={`fa-solid ${action.icon} shrink-0 text-base`} aria-hidden="true" />
                <span>{action.label}</span>
              </a>
            ))}
          </div>
        )}
        <ProviderHighlightsSection highlights={highlights} />
        <ProviderOffersSection
          offers={provider.offers}
          providerThumbnail={provider.media.thumbnail}
        />
        {services.length > 0 && (
          <section className="mt-4" aria-labelledby="provider-services-heading">
            <h2 id="provider-services-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">
              Services & facilities
            </h2>
            <ul className="mt-1.5 space-y-2 p-3  rounded-xl border border-border-subtle">
              {services.map((service, index) => (
                <li key={`${service}-${index}`} className="flex items-start gap-2.5 text-sm text-foreground font-semibold dark:text-foreground-dark-secondary">
                  <i className="fa-solid fa-circle-check mt-1 shrink-0 text-xs text-brand dark:text-brand-300" aria-hidden="true" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ProviderDoctorsSection providerSlug={slug} phone={provider.contact.phone} />
        <ProviderProductsSection product={displayProducts} providerSlug={slug} />
        <ProviderGallery provider={provider} />
        {contactOptions.length > 0 && (
          <section className="mt-6" aria-labelledby="provider-contact-heading">
            <h2 id="provider-contact-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">Contact</h2>
            <div className="mt-2.5 overflow-hidden rounded-xl border border-border-subtle dark:border-border-dark-subtle">
              {contactOptions.map((option, index) => (
                <Fragment key={`${option.label}-${option.href}`}>
                {index > 0 && <div className="mx-3 border-t border-border-subtle dark:border-border-dark-subtle" />}
                <a href={option.href} target={option.external ? "_blank" : undefined} rel={option.external ? "noreferrer" : undefined} className="flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-brand-50 dark:hover:bg-brand-950/40">
                  <span className="flex size-8 shrink-0 items-center justify-center text-brand dark:text-brand-300"><i className={`${option.brandIcon ? "fa-brands" : "fa-solid"} ${option.icon}`} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-foreground-muted dark:text-foreground-dark-muted">{option.label}</span><span className="block truncate text-sm font-bold text-foreground dark:text-foreground-dark">{option.value}</span></span>
                  <ChevronRight size={16} className="shrink-0 text-foreground-subtle" aria-hidden="true" />
                </a>
                </Fragment>
              ))}
            </div>
          </section>
        )}
        {socialOptions.length > 0 && (
          <section className="mt-6" aria-labelledby="provider-social-heading">
            <h2 id="provider-social-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">Follow us</h2>
            <div className="-mx-page mt-2.5 flex gap-2 overflow-x-auto px-page pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {socialOptions.map((option) => (
                <a key={option.label} href={option.href} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground-secondary transition-colors hover:border-brand-200 hover:bg-brand-50 dark:border-border-dark dark:bg-surface-dark-secondary dark:text-foreground-dark-secondary dark:hover:border-brand-800 dark:hover:bg-brand-950/40">
                  <i className={`fa-brands ${option.icon} ${option.color} text-lg`} aria-hidden="true" />
                  {option.label}
                </a>
              ))}
            </div>
          </section>
        )}
        {provider.description?.trim() && (
          <section className="mt-6" aria-labelledby="provider-about-heading">
            <h2 id="provider-about-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">About us</h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-foreground-secondary dark:text-foreground-dark-secondary">{provider.description}</p>
          </section>
        )}
        {similarProvidersQuery.data && similarProvidersQuery.data.length > 0 && (
          <section className="mt-6" aria-labelledby="similar-providers-heading">
            <h2 id="similar-providers-heading" className="text-base font-extrabold tracking-tight text-foreground dark:text-foreground-dark">Similar healthcare providers nearby</h2>
            <div className="-mx-page mt-2.5 flex gap-3 overflow-x-auto px-page pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {similarProvidersQuery.data.map((item) => {
                const itemAddress = [
                  item.location.address,
                  item.location.landmark,
                  item.location.locality,
                  getProviderCityName(item.location.city),
                  item.location.state,
                  item.location.postal_code,
                ].filter(Boolean).join(", ");
                return <Link key={item.id} href={`/${encodeURIComponent(item.slug)}`} className="group w-52 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface transition-colors hover:border-brand-200 dark:border-border-dark-subtle dark:bg-surface-dark-secondary dark:hover:border-brand-800">
                  <div className="relative h-28 bg-surface-tertiary dark:bg-surface-dark-tertiary"><Image src={item.media.thumbnail || "/images/default.jpg"} alt="" fill sizes="208px" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />{item.is_verified && <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/95 text-brand shadow-sm" title="Verified provider"><i className="fa-solid fa-badge-check text-xs" aria-hidden="true" /></span>}</div>
                  <div className="p-3"><h3 className="truncate text-sm font-extrabold text-foreground dark:text-foreground-dark">{item.name}</h3>{itemAddress && <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-foreground-muted dark:text-foreground-dark-muted"><MapPin size={11} className="shrink-0" aria-hidden="true" /><span className="truncate">{itemAddress}</span></p>}</div>
                </Link>;
              })}
            </div>
          </section>
        )}
      </section>

      <div className={`fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-white px-page pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform dark:border-border-dark-subtle dark:bg-surface-dark ${showFixedActions ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0"}`} aria-hidden={!showFixedActions}>
        <div className="mx-auto flex max-w-160 items-center gap-3">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-foreground dark:text-foreground-dark">{provider.name}</p>{status && <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs"><span className={`shrink-0 font-bold ${status.className}`}>{status.label}</span>{hoursText && <><span className="text-foreground-subtle" aria-hidden="true">&middot;</span><span className="truncate font-semibold text-foreground-muted dark:text-foreground-dark-muted">{hoursText}</span></>}</p>}</div>
          <div className="flex shrink-0 gap-2">
            <FixedProviderAction href={provider.contact.phone ? `tel:${provider.contact.phone}` : undefined} icon="fa-phone" label="Call now" variant="brand" />
            <FixedProviderAction href={provider.contact.whatsapp ? whatsappUrl(provider.contact.whatsapp) : undefined} icon="fa-whatsapp" label="WhatsApp" external brandIcon variant="whatsapp" />
            <FixedProviderAction href={directionHref} icon="fa-diamond-turn-right" label="Direction" external variant="outline" />
          </div>
        </div>
      </div>

			{showHours && hours && (
				<BottomSheetModal open={hoursOpen} onClose={() => setHoursOpen(false)} title="Provider hours" closeLabel="Close provider hours">
					<div className="px-page pt-3 pb-5">
						<h2 className="text-xl font-extrabold text-foreground dark:text-foreground-dark">Provider hours</h2>
						{provider.name}{hours.remark && <p className="mt-1 text-sm text-foreground-muted dark:text-foreground-dark-muted">{hours.remark}</p>}
						<dl className="mt-2 divide-y divide-border-subtle dark:divide-border-dark-subtle">
							{getScheduleDays().map((day, index) => (
								<div key={day} className="flex items-start justify-between gap-6 py-3 text-sm">
									<dt className="font-semibold capitalize text-foreground dark:text-foreground-dark">
										{day}{index === 0 && <span className="ml-1.5 text-xs font-bold text-brand">Today</span>}
									</dt>
									<dd className={`text-right ${hours.schedule[day]?.length ? "text-foreground-secondary dark:text-foreground-dark-secondary" : "text-rose-600 dark:text-rose-400"}`}>
										{formatProviderSlots(hours.schedule[day])}
									</dd>
								</div>
							))}
						</dl>
					</div>
				</BottomSheetModal>
			)}
		</>
	);
}

function FixedProviderAction({ href, icon, label, variant, external = false, brandIcon = false }: { href?: string; icon: string; label: string; variant: "brand" | "whatsapp" | "outline"; external?: boolean; brandIcon?: boolean }) {
	const variantClasses = {
		brand: "border-brand bg-brand text-white hover:bg-brand-800",
		whatsapp: "border-[#25D366] bg-[#25D366] text-white hover:border-[#1fb859] hover:bg-[#1fb859]",
		outline: "border-brand bg-white text-brand hover:bg-brand-50 dark:bg-surface-dark dark:text-brand-300 dark:hover:bg-brand-950/40",
	}[variant];
	const className = `flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors ${variantClasses}`;
	const content = <i className={`${brandIcon ? "fa-brands" : "fa-solid"} ${icon} text-base`} aria-hidden="true" />;
	if (!href) return <span className={`${className} cursor-not-allowed opacity-40`} aria-disabled="true" aria-label={`${label} unavailable`} title={`${label} unavailable`}>{content}</span>;
	return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={className} aria-label={label} title={label}>{content}</a>;
}
