import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirestoreDb,
} from "../lib/firebase";

export const Route = createFileRoute("/select-shop")({
  component: SelectShopPage,
});

function SelectShopPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getFirebaseAuth().onAuthStateChanged(
      async (user) => {
  
        console.log("Auth User:", user);
  
        if (!user) {
          console.log("No user found");
          setLoading(false);
          window.location.href = "/login";
          return;
        }
  
        try {
          const snapshot = await getDocs(
            query(
              collection(getFirestoreDb(), "shops"),
              where("ownerUid", "==", user.uid)
            )
          );
  
          console.log("UID:", user.uid);
          console.log("Docs:", snapshot.docs.length);
  
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          console.log("Shop List:", list);
  
          setShops(list);
  
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    );
  
    return () => unsubscribe();
  }, []);

  function openShop(shop: any) {
    localStorage.setItem("selectedShopId", shop.id);
    window.location.href = "/dashboard";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading Shops...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-orange-500">
          Select Shop
        </h1>

        <p className="text-zinc-400 mt-2 mb-8">
          Choose a shop to continue
        </p>

        <div className="space-y-5">

          {shops.map((shop: any) => (

            <div
              key={shop.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between items-center"
            >

              <div>

                <h2 className="text-2xl font-bold">
                  {shop.shopName}
                </h2>

                <p className="text-orange-400">
                  {shop.shopCategory}
                </p>

              </div>

              <button
                onClick={() => openShop(shop)}
                className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold"
              >
                Open Shop
              </button>

            </div>

          ))}

        </div>

      </div>

      <div className="mt-8 flex justify-center">

  <button
    onClick={() =>
      window.location.href = "/create-shop"
    }
    className="
      bg-orange-500
      hover:bg-orange-600
      px-6
      py-3
      rounded-xl
      font-semibold
    "
  >

    + Create New Shop

  </button>

</div>

    </div>
  );
}