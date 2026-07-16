import {
    collection,
    getDocs,
    deleteDoc,
    doc,
  } from "firebase/firestore";
  
  import { getFirestoreDb } from "./firebase";
  
  export async function removeDuplicateProducts(shopId: string) {
    const db = getFirestoreDb();
  
    const snapshot = await getDocs(
      collection(db, "shops", shopId, "products")
    );
  
    const products = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as any[];
  
    const seen = new Map<string, any>();
  
    for (const product of products) {
      const existing = seen.get(product.name);
  
      if (!existing) {
        seen.set(product.name, product);
        continue;
      }
  
      // Delete duplicate only if quantity is 0
      if (Number(product.quantity) === 0) {
        await deleteDoc(
          doc(
            db,
            "shops",
            shopId,
            "products",
            product.id
          )
        );
      }
    }
  
    console.log("Duplicate cleanup completed.");
  }