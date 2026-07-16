import {
    collection,
    getDocs,
  getDoc,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
  } from "firebase/firestore";
  
  import { defaultProducts } from "../data/defaultProducts";
import { walkInProducts } from "../data/walkInProducts";
  import { getFirestoreDb } from "./firebase";
  
  export async function syncProducts(shopId: string) {
  
    const db = getFirestoreDb();
    const shopDoc = await getDoc(
      doc(db, "shops", shopId)
    );
    
    const shopData = shopDoc.data();
    const products =
  shopData?.shopCategory === "Walk-in"
    ? walkInProducts
    : defaultProducts;
  
    const snapshot = await getDocs(
      collection(db, "shops", shopId, "products")
    );
  
    const firestoreProducts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as any[];
  
    for (const product of products) {
  
      const existing = firestoreProducts.find(
        (p) =>
          p.name.trim().toLowerCase() ===
          product.name.trim().toLowerCase()
      );
  
      if (!existing) {
  
        await addDoc(
          collection(db, "shops", shopId, "products"),
          {
            ...product,
            quantity: 0,
          }
        );
  
      } else {
  
        if (

            existing.price !== product.price ||
          
            existing.category !== product.category
          
          ) {
          
            await updateDoc(
          
              doc(
                db,
                "shops",
                shopId,
                "products",
                existing.id
              ),
          
              {
                price: product.price,
                category: product.category,
              }
          
            );
          
          }
  
      }
  
    }
    // Remove products that are no longer in defaultProducts
for (const firestoreProduct of firestoreProducts) {

  const existsInDefault = products.some(
    (product) =>
      product.name.trim().toLowerCase() ===
      firestoreProduct.name.trim().toLowerCase()
    );
  
    if (
      !existsInDefault &&
      Number(firestoreProduct.quantity) === 0
    ) {
  
      await deleteDoc(
        doc(
          db,
          "shops",
          shopId,
          "products",
          firestoreProduct.id
        )
      );
  
    }
  
  }
  
  }