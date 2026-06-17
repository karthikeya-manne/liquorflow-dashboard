import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { products as mockProducts, type Product } from "@/lib/mock-data";

export function productsCollectionPath(userId: string) {
  return `users/${userId}/products`;
}

export function subscribeToProducts(
  userId: string,
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(getFirestoreDb(), productsCollectionPath(userId)));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<Product, "id">),
      }));
      onData(items);
    },
    (error) => onError?.(error),
  );
}

export async function seedProductsIfEmpty(userId: string) {
  const colRef = collection(getFirestoreDb(), productsCollectionPath(userId));
  const existing = await getDocs(colRef);
  if (!existing.empty) return;

  const batch = writeBatch(getFirestoreDb());
  for (const product of mockProducts) {
    const { id, ...data } = product;
    batch.set(doc(colRef, id), data);
  }
  await batch.commit();
}
