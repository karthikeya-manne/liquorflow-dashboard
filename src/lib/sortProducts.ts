import { defaultProducts } from "../data/defaultProducts";

export function sortProducts(products: any[]) {

  return [...products].sort((a, b) => {

    const aIndex =
      defaultProducts.findIndex(
        (p) => p.name === a.name
      );

    const bIndex =
      defaultProducts.findIndex(
        (p) => p.name === b.name
      );

    return aIndex - bIndex;

  });

}