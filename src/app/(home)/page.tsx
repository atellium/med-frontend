import type { Metadata } from "next";
import {
	HomeFooter,
	HomeSearchLink,
	MobileHomeHeader,
	NearbyAvailableDoctors,
	PopularCategoriesGrid,
} from "@/components/home";
import { getSiteUrl } from "@/lib/site-url";

const title = "Find Doctors, Pharmacies & Healthcare Services Near You | MedNearby";

const description =
	"Find nearby doctors, pharmacies, clinics, diagnostic centres, hospitals and other healthcare services with MedNearby. Search local medical providers, view details and connect easily.";

const appIconUrl = new URL("/app-icons/app-icon-1024X1024.png", getSiteUrl()).toString();

export const metadata: Metadata = {
	title: { absolute: title },
	description,
	keywords: [
		"local providers",
		"providers near me",
		"local services",
		"shops near me",
		"service providers near me",
		"provider directory",
		"MedNearby",
	],
	applicationName: "MedNearby",
	category: "Local provider directory",
	creator: "MedNearby",
	publisher: "MedNearby",
	alternates: { canonical: "/" },
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	openGraph: {
		title,
		description,
		type: "website",
		siteName: "MedNearby",
		url: "/",
		locale: "en_IN",
		images: [
			{
				url: appIconUrl,
				width: 1024,
				height: 1024,
				alt: "MedNearby app icon",
				type: "image/png",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: [
			{
				url: appIconUrl,
				width: 1024,
				height: 1024,
				alt: "MedNearby app icon",
				type: "image/png",
			},
		],
	},
};

export default function Home() {
	const siteUrl = getSiteUrl();
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				"@id": `${siteUrl}#website`,
				url: siteUrl.toString(),
				name: "MedNearby",
				description,
				inLanguage: "en-IN",
				publisher: { "@id": `${siteUrl}#organization` },
			},
			{
				"@type": "Organization",
				"@id": `${siteUrl}#organization`,
				name: "MedNearby",
				url: siteUrl.toString(),
				logo: new URL("/app-icons/app-icon-512X512.png", siteUrl).toString(),
				description,
			},
		],
	};



	return (
		<div className="min-h-dvh bg-white dark:bg-background-dark">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
				}}
			/>
			<h1 className="sr-only">
				Discover trusted local providers and services near you
			</h1>
			<MobileHomeHeader />
			<HomeSearchLink />
			<PopularCategoriesGrid />
			<NearbyAvailableDoctors />
			<HomeFooter />
		</div>
	);
}
