export function toPathSegment(value: string) {
	return value
		.trim()
		.toLocaleLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function providerListingPath({
	city,
	locality,
	categorySlug,
}: {
	city: string;
	locality: string;
	categorySlug: string;
}) {
	return `/${toPathSegment(city)}/${toPathSegment(locality)}/${encodeURIComponent(categorySlug)}`;
}

export function doctorSpecialtyListingPath({
	city,
	locality,
	specialtySlug,
}: {
	city: string;
	locality: string;
	specialtySlug: string;
}) {
	return `/${toPathSegment(city)}/${toPathSegment(locality)}/doctors/${encodeURIComponent(specialtySlug)}`;
}
