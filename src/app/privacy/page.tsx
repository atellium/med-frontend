import type { Metadata } from "next";
import { LegalList, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: "Learn how MedNearby collects, uses, and protects your information.",
};

export default function PrivacyPage() {
	return (
		<LegalPage
			title="Privacy Policy"
			intro="This Privacy Policy explains how MedNearby collects, uses, stores, and shares information when you use our local provider discovery platform, create an account, or interact with a provider listing."
			sections={[
				{
					title: "Information we collect",
					content: (
						<LegalList>
							<li>Account information, such as your name, phone number, and profile details.</li>
							<li>Location information you provide or allow your device to share, including approximate or precise coordinates.</li>
							<li>Provider information, photos, contact details, categories, and edits submitted by provider owners or users.</li>
							<li>Usage and device information, such as searches, viewed listings, saved preferences, browser type, and diagnostic data.</li>
						</LegalList>
					),
				},
				{
					title: "How we use information",
					content: (
						<LegalList>
							<li>Provide nearby search results, location-aware recommendations, accounts, and provider-management features.</li>
							<li>Authenticate users, maintain security, prevent abuse, and troubleshoot the service.</li>
							<li>Review, publish, correct, and improve provider listings and platform content.</li>
							<li>Understand how MedNearby is used and improve its performance and features.</li>
							<li>Communicate about your account, requests, listings, and important service updates.</li>
						</LegalList>
					),
				},
				{
					title: "Location information",
					content: <p>Location access is used to show relevant providers and services near you. You can deny or revoke device location permission at any time and may select a location manually where that option is available.</p>,
				},
				{
					title: "How information is shared",
					content: (
						<>
							<p>Public provider listing information is visible to other users. We may also share information with service providers that help operate hosting, authentication, analytics, communications, mapping, and security functions.</p>
							<p>We may disclose information when required by law, to protect users or the service, or as part of a merger, acquisition, financing, or transfer of assets. We do not sell personal information for money.</p>
						</>
					),
				},
				{
					title: "Storage, security, and retention",
					content: <p>We use reasonable technical and organizational safeguards, but no online service can guarantee absolute security. We retain information only as long as reasonably necessary to provide the service, meet legal obligations, resolve disputes, and enforce agreements.</p>,
				},
				{
					title: "Your choices and rights",
					content: <p>You may update certain profile or provider information through MedNearby and manage location permissions through your device. Depending on applicable law, you may request access, correction, deletion, restriction, or a copy of your personal information.</p>,
				},
				{
					title: "Children's privacy",
					content: <p>MedNearby is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided information, please contact us so we can review and remove it where appropriate.</p>,
				},
				{
					title: "Policy changes and contact",
					content: <p>We may update this policy as MedNearby evolves. The effective date above identifies the latest version. For privacy questions or requests, use the support or contact channel made available within MedNearby.</p>,
				},
			]}
		/>
	);
}
