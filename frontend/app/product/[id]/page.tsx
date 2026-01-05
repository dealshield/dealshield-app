import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductDetailsClient from './ProductDetailsClient';

// Initialize Supabase client for server-side metadata fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  // fetch data
  const { data: product } = await supabase
    .from('listings')
    .select('title, description, image_url, category')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found | DealShield',
    };
  }

  // Truncate description for SEO
  const description = product.description 
    ? (product.description.length > 160 ? product.description.slice(0, 160) + '...' : product.description)
    : `Buy ${product.title} on DealShield - Secure Crypto Escrow Marketplace`;

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${product.title} | DealShield`,
    description: description,
    openGraph: {
      title: product.title,
      description: description,
      images: product.image_url ? [product.image_url, ...previousImages] : previousImages,
      type: 'website',
      siteName: 'DealShield',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: description,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default function Page() {
  return <ProductDetailsClient />;
}
