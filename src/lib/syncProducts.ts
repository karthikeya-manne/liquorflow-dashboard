import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
  } from "firebase/firestore";
  
  import { defaultProducts } from "../data/defaultProducts";
  import { getFirestoreDb } from "./firebase";
  
  export async function syncProducts(shopId: string) {
  
    const db = getFirestoreDb();
  
    const snapshot = await getDocs(
      collection(db, "shops", shopId, "products")
    );
  
    const firestoreProducts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as any[];
  
    for (const product of defaultProducts) {
  
      const existing = firestoreProducts.find(
        (p) => p.name === product.name
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

    const existsInDefault = defaultProducts.some(
      (product) => product.name === firestoreProduct.name
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