import type {
  ProviderNameDetail,
  ProviderProduct,
  ProviderProducts,
  ProviderProductsListResponse,
  ProductDetail,
} from "./provider.types";
import { demoCatalogs, type DemoCatalog, type DemoProductTemplate } from "./demo-products.data";

type DemoProviderContext = {
  id: string;
  name: string;
  handle: string;
  slug: string;
  media: { thumbnail: string | null };
  location: {
    locality: string;
    city: ProductDetail["provider"]["city"];
  };
};

export function getDemoProviderProducts(provider: ProviderNameDetail, categorySlug?: string): ProviderProducts | null {
  const catalog = getDemoCatalogForProvider(provider);
  if (!catalog) return null;
  const products = materializeDemoProducts(catalog, provider, categorySlug);
  return { categories: catalog.categories, items: products };
}

export function getDemoProviderProductsPage(provider: ProviderNameDetail, categorySlug?: string): ProviderProductsListResponse | null {
  const catalog = getDemoCatalogForProvider(provider);
  if (!catalog) return null;
  const products = materializeDemoProducts(catalog, provider, categorySlug);
  return {
    provider: { id: provider.id, name: provider.name, slug: provider.slug },
    categories: catalog.categories,
    pagination: {
      page: 1,
      page_size: products.length,
      total_pages: 1,
      total_items: products.length,
      has_next: false,
      has_previous: false,
    },
    results: products,
  };
}

export function getDemoProductProviderSlug(slug: string) {
  return getDemoProductMatch(slug)?.providerSlug ?? null;
}

export function getDemoProductBySlug(slug: string, provider?: ProviderNameDetail): ProductDetail | null {
  const match = getDemoProductMatch(slug);
  if (!match) return null;
  const { catalog, template, providerSlug } = match;
  const providerContext = provider ? providerToDemoContext(provider) : fallbackDemoProvider(providerSlug);
  const category = catalog.categories.find((item) => item.slug === template.category) ?? catalog.categories[0];
  return {
    ...materializeDemoProduct(template, providerContext),
    type: "product",
    description: template.description,
    variants: template.variants ?? [],
    specifications: { is_bargain: false, is_available: true, is_bestseller: template.bestseller === true },
    custom_fields: template.custom_fields ?? [
      { title: "Availability", value: "In stock" },
      { title: "Product type", value: category.display_name },
    ],
    categories: [category],
    images: [
      ...(template.images ?? [template.image]).map((image, index) => ({
        image,
        alt_text: template.name,
        is_primary: index === 0,
        sort_order: index,
      })),
    ],
    provider: {
      id: providerContext.id,
      name: providerContext.name,
      handle: providerContext.handle,
      slug: providerContext.slug,
      thumbnail: providerContext.media.thumbnail,
      locality: providerContext.location.locality,
      city: providerContext.location.city,
    },
  };
}

function getDemoCatalogForProvider(provider: ProviderNameDetail) {
  const categoryTokens = (provider.categories ?? []).flatMap((category) => [category.slug, category.display_name]);
  return demoCatalogs.find((catalog) =>
    catalog.categoryMatchers.some((matcher) =>
      categoryTokens.some((token) => normalize(token).includes(normalize(matcher))),
    ),
  );
}

function materializeDemoProducts(catalog: DemoCatalog, provider: ProviderNameDetail, categorySlug?: string) {
  const providerContext = providerToDemoContext(provider);
  return catalog.products
    .filter((product) => !categorySlug || product.category === categorySlug)
    .map((product) => materializeDemoProduct(product, providerContext));
}

function materializeDemoProduct(product: DemoProductTemplate, provider: DemoProviderContext): ProviderProduct {
  return {
    id: `demo-${provider.id}-${product.slug}`,
    name: product.name,
    slug: `demo-${provider.slug}-${product.slug}`,
    short_description: product.short_description,
    price_type: product.price_type ?? "fixed",
    price: product.price,
    max_price: product.max_price ?? null,
    original_price: product.original_price ?? null,
    categories: null,
    variants: product.variants ?? [],
    specifications: { is_bargain: false, is_available: true, is_bestseller: product.bestseller === true },
    is_featured: product.bestseller === true,
    primary_image: product.image,
  };
}

function getDemoProductMatch(slug: string) {
  if (!slug.startsWith("demo-")) return null;
  for (const catalog of demoCatalogs) {
    for (const template of catalog.products) {
      const suffix = `-${template.slug}`;
      if (slug.endsWith(suffix)) {
        const providerSlug = slug.slice("demo-".length, -suffix.length);
        if (providerSlug) return { catalog, template, providerSlug };
      }
    }
  }
  return null;
}

function providerToDemoContext(provider: ProviderNameDetail): DemoProviderContext {
  return {
    id: provider.id,
    name: provider.name,
    handle: provider.handle,
    slug: provider.slug,
    media: provider.media,
    location: {
      locality: provider.location.locality,
      city: provider.location.city,
    },
  };
}

function fallbackDemoProvider(slug: string): DemoProviderContext {
  return {
    id: `demo-provider-${slug}`,
    name: labelFromSlug(slug),
    handle: slug,
    slug,
    media: { thumbnail: null },
    location: {
      locality: "Demo locality",
      city: {
        id: 0,
        name: "Demo city",
        state: "Demo state",
      },
    },
  };
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function labelFromSlug(slug: string) {
  return slug.split("-").filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
}
