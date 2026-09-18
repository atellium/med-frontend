import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { InstallPrompt } from "@/features/pwa";
import { getSiteUrl } from "@/lib/site-url";

const nunito = Nunito({
	variable: "--font-nunito",
	subsets: ["latin"],
});

const appIconUrl = new URL("/app-icons/app-icon-1024X1024.png", getSiteUrl()).toString();

export const metadata: Metadata = {
	metadataBase: getSiteUrl(),
	title: {
		default: "MedNearby",
		template: "%s | MedNearby",
	},
	description: "Your MedNearby account and local experience.",
	applicationName: "MedNearby",
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		siteName: "MedNearby",
		title: "MedNearby",
		description: "Discover trusted local providers and services near you.",
		url: "/",
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
		title: "MedNearby",
		description: "Discover trusted local providers and services near you.",
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
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "MedNearby",
	},
	icons: {
		icon: [
			{ url: "/app-icons/app-icon-128X128.png", sizes: "128x128", type: "image/png" },
			{ url: "/app-icons/app-icon-256X256.png", sizes: "256x256", type: "image/png" },
			{ url: "/app-icons/app-icon-512X512.png", sizes: "512x512", type: "image/png" },
			{ url: "/app-icons/app-icon-1024X1024.png", sizes: "1024x1024", type: "image/png" },
		],
		shortcut: {
			url: "/app-icons/app-icon-128X128.png",
			type: "image/png",
		},
		apple: {
			url: "/app-icons/app-icon-256X256.png",
			sizes: "256x256",
			type: "image/png",
		},
	},
};

export const viewport: Viewport = {
	colorScheme: "light",
	themeColor: "#FFFFFF",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${nunito.variable}`}
			suppressHydrationWarning
		>
			<head>
				{/* Font Awesome is a static, self-hosted stylesheet from public/. */}
				{/* eslint-disable-next-line @next/next/no-css-tags */}
				<link rel="stylesheet" href="/fontawesome/css/all.css" />
			</head>
			<body>
				<Providers>
					<div className="mx-auto min-h-dvh w-full max-w-160 bg-background shadow-sm dark:bg-background-dark">
						<InstallPrompt />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
