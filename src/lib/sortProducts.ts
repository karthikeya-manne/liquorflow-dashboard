import { defaultProducts } from "../data/defaultProducts";
import { walkInProducts } from "../data/walkInProducts";

export function sortProducts(
  products: any[],
  shopCategory?: string
) {

  const productOrder =
    shopCategory === "Walk-in"
      ? walkInProducts
      : defaultProducts;

  return [...products].sort((a, b) => {

    const aIndex = productOrder.findIndex(
        (p) => p.name === a.name
      );

    const bIndex = productOrder.findIndex(
        (p) => p.name === b.name
      );

    return aIndex - bIndex;

  });

}