import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    Timestamp,
  } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../lib/firebase";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

export const Route = createFileRoute("/morning-stocks")({
  component: MorningStockPage,
});

function MorningStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [productsUpdated, setProductsUpdated] = useState(0);
const [totalSold, setTotalSold] = useState(0);
const [estimatedRevenue, setEstimatedRevenue] = useState(0);
const [shopId, setShopId] = useState<string | null>(null);
const [search, setSearch] = useState("");

useEffect(() => {

    const unsubscribe =
      getFirebaseAuth().onAuthStateChanged((user) => {
  
        if (user) {
          setShopId(user.uid);
        }
  
      });
  
    return () => unsubscribe();
  
  }, []);
  
  useEffect(() => {
  
    if (shopId) {
      loadProducts();
    }
  
  }, [shopId]);

  async function loadProducts() {
    if (!shopId) {
        return;
      }

    const snapshot = await getDocs(
      collection(
        getFirestoreDb(),
        "shops",
        shopId,
        "products"
      )
    );

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      currentStock: doc.data().quantity,
    }));

    setProducts(list);
    setLoading(false);
  }



  async function saveMorningStock() {
    setSaving(true)
    const user = getFirebaseAuth().currentUser;
  
    if (!user) return;
  
    try {
  
      let totalSold = 0;
  
      for (const product of products) {
  
        const sold =
          Number(product.quantity) -
          Number(product.currentStock);
  
        totalSold += sold;
  
        await updateDoc(
  
          doc(
            getFirestoreDb(),
            "shops",
            user.uid,
            "products",
            product.id
          ),
  
          {
            quantity: Number(product.currentStock),
          }
  
        );
        if (sold > 0) {

            const yesterday = new Date();

            yesterday.setDate(yesterday.getDate() - 1);
            
            yesterday.setHours(23, 59, 59, 999);
            
            await addDoc(
              collection(
                getFirestoreDb(),
                "shops",
                shopId!,
                "sales"
              ),
              {
                productName: product.name,
                category: product.category || "Others",
                quantity: sold,
                price: sold * Number(product.price),
                profit: sold * Number(product.price),
                paymentMethod: "Morning Stock",
            
                soldAt: Timestamp.fromDate(yesterday),
              }
            );
          
          }
  
      }

      
  
     // Reset summary
setProductsUpdated(0);
setTotalSold(0);
setEstimatedRevenue(0);

// Success message
toast.success(
  "Morning Stock Saved Successfully 🎉"
);

// Scroll to top
window.scrollTo({
  top: 0,
  behavior: "smooth",
});

// Reload updated inventory
await loadProducts();

const today = new Date()
  .toISOString()
  .split("T")[0];

const currentStock = products.reduce(
  (sum, item) =>
    sum + Number(item.currentStock),
  0
);

localStorage.setItem(
  `openingStock-${today}`,
  currentStock.toString()
);

localStorage.setItem(
  `closingStock-${today}`,
  currentStock.toString()
);

// Stop saving animation
setSaving(false);
  
    } catch (error) {

        console.error(error);
      
        setSaving(false);
      
        toast.error(
          "Failed to save morning stock."
        );
      
      }
  
  }

  const filteredProducts = products.filter((product) =>
    product.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      <div className="flex-1 p-6 pt-24">

      <h1 className="text-3xl font-bold text-orange-500">
        Morning Stock Entry
      </h1>

      <p className="text-zinc-400 mb-6">
        Enter the physical stock available in the shop.
      </p>

      <input
  type="text"
  placeholder="🔍 Search Product..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="
    w-full
    mb-6
    p-3
    rounded-xl
    bg-zinc-900
    border
    border-zinc-700
    text-white
    focus:border-orange-500
    focus:outline-none
  "
/>

      <div className="overflow-x-auto">

        <table className="w-full border border-zinc-700">

          <thead>

            <tr className="bg-zinc-900">

              <th className="p-3">Product</th>

              <th className="p-3">Opening Stock</th>

              <th className="p-3">Current Count</th>

              <th className="p-3">Sold</th>

            </tr>

          </thead>

          <tbody>

          {filteredProducts.map((product) => (

              <tr
                key={product.id}
                className="border-t border-zinc-700"
              >

                <td className="p-3">
                  {product.name}
                </td>

                <td className="p-3 text-center">
                  {product.quantity}
                </td>

                <td className="p-3">

                  <input
                    type="number"
                    value={product.currentStock}
                    onChange={(e) => {

                        const value = Number(e.target.value);
                      
                        const updated = products.map((item) =>
                          item.id === product.id
                            ? {
                                ...item,
                                currentStock: value,
                              }
                            : item
                        );
                      
                        setProducts(updated);
                      
                        let updatedProducts = 0;
                        let sold = 0;
                        let revenue = 0;
                      
                        updated.forEach((item) => {
                      
                          if (item.currentStock != item.quantity) {
                      
                            updatedProducts++;
                      
                            const qtySold =
                              Number(item.quantity) -
                              Number(item.currentStock);
                      
                            sold += qtySold;
                      
                            revenue += qtySold * Number(item.price);
                      
                          }
                      
                        });
                      
                        setProductsUpdated(updatedProducts);
                      
                        setTotalSold(sold);
                      
                        setEstimatedRevenue(revenue);
                      
                      }}
                    className="w-24 bg-zinc-800 rounded p-2 text-center"
                  />

                </td>

                <td className="p-3 text-center">

                  {product.quantity -
                    product.currentStock}

                </td>

              </tr>

            ))}

          </tbody>

        </table>


      </div>

    </div>
    <div className="fixed bottom-6 right-6 z-50">

  <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl w-72">

    <h2 className="text-xl font-bold text-orange-400 mb-4">

      Morning Summary

    </h2>

    <div className="space-y-3">

      <div className="flex justify-between">

        <span>Products Updated</span>

        <span className="font-bold">

          {productsUpdated}

        </span>

      </div>

      <div className="flex justify-between">

        <span>Bottles Sold</span>

        <span className="font-bold text-red-400">

          {totalSold}

        </span>

      </div>

      <div className="flex justify-between">

        <span>Estimated Revenue</span>

        <span className="font-bold text-green-400">

          ₹{estimatedRevenue}

        </span>

      </div>

    </div>

    <button
      onClick={saveMorningStock}
      disabled={saving || productsUpdated === 0}
      className={`
        mt-5
        w-full
        rounded-xl
        py-3
        font-bold
        transition-all
        duration-300

        ${
          saving
            ? "bg-gray-600"
            : productsUpdated === 0
            ? "bg-zinc-700 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 hover:scale-105"
        }
      `}
    >

      {saving
        ? "⏳ Saving..."
        : "💾 Save Morning Stock"}

    </button>

  </div>

</div>
    </div> 
  );
}