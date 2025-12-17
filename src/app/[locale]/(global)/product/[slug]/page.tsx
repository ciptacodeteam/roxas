import { flattenProducts } from "@/lib/data/flattenProducts";

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const products = flattenProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return <div>Produk tidak ditemukan</div>;
  }

  return (
    <div>
      <h1 className="mt-96">{product.title}</h1>
    </div>
  );
}
