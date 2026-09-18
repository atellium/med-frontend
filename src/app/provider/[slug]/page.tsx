import { redirect } from "next/navigation";

export default async function LegacyProviderPage({ params }: PageProps<"/provider/[slug]">) {
  const { slug } = await params;
  redirect(`/${encodeURIComponent(decodeURIComponent(slug))}`);
}
