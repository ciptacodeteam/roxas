import { productData } from "./productItems";

export type ProductItem = {
  title: string;
  subtitle: string;
  image: string;
  slug: string;
  category: string;
};

export const flattenProducts = (): ProductItem[] => {
  return Object.entries(productData).flatMap(([category, items]) =>
    items.map((item) => ({
      ...item,
      category,
    })),
  );
};
