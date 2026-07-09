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
import { sortProducts } from "../lib/sortProducts";
import { exportMorningStock } from "../lib/exportMorningStock";



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
const [previewOpen, setPreviewOpen] = useState(false);

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
    
      // Opening Balance
      openingStock: Number(doc.data().quantity),
    
      // Receipts entered by manager
      receipts: 0,
    
      // Total = OB + Receipts
      total:
        Number(doc.data().quantity),
    
      // Closing Balance
      closingStock:
        Number(doc.data().quantity),
    
    }));

    setProducts(sortProducts(list));
    
    setLoading(false);
  }

  function updateMorningSummary(updatedProducts: any[]) {

    let updatedCount = 0;
    let totalSales = 0;
    let revenue = 0;
  
    updatedProducts.forEach((item) => {
  
      const sales = Math.max(
        0,
        Number(item.total) - Number(item.closingStock)
      );
  
      if (
        Number(item.receipts) > 0 ||
        Number(item.closingStock) !== Number(item.openingStock)
      ) {
        updatedCount++;
      }
  
      totalSales += sales;
      revenue += sales * Number(item.price);
  
    });
  
    setProductsUpdated(updatedCount);
    setTotalSold(totalSales);
    setEstimatedRevenue(revenue);
  
  }

  async function saveMorningStock() {
    setSaving(true)
    const user = getFirebaseAuth().currentUser;
  
    if (!user) return;
  
    try {
  
      let totalSold = 0;
  
      for (const product of products) {
  
        const sold =
  Number(product.total) -
  Number(product.closingStock);
  
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
            quantity: Number(product.closingStock),
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
    sum + Number(item.closingStock),
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
  const changedProducts = filteredProducts.filter(
    (product) =>
      Number(product.receipts) > 0 ||
      Number(product.closingStock) !== Number(product.openingStock)
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      <div className="flex-1 p-6 pt-24">

      <div className="flex items-center justify-between mb-6">

<div>
  <h1 className="text-3xl font-bold text-orange-500">
    Morning Stock Entry
  </h1>

  <p className="text-zinc-400 mt-2">
    Enter the physical stock available in the shop.
  </p>
</div>

<button
  onClick={async () => {
    await exportMorningStock(filteredProducts);
  }}
  className="
    bg-green-600
    hover:bg-green-700
    px-6
    py-3
    rounded-xl
    font-semibold
    flex
    items-center
    gap-2
    shadow-lg
  "
>
   Export Morning Stock
</button>

</div>

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

<th className="p-3 w-16">S.No</th>

<th className="p-3 text-left">Brand</th>

<th className="p-3">OB</th>

<th className="p-3">Receipts</th>

<th className="p-3">Total</th>

<th className="p-3">CB</th>

<th className="p-3">Sales</th>

<th className="p-3">Rate</th>

<th className="p-3">Amount</th>

</tr>

</thead>

          <tbody>

          {filteredProducts.map((product, index) => (

              <tr
                key={product.id}
                className="border-t border-zinc-700"
              >

<td className="p-3 text-center">
  {index + 1}
</td>

<td className="p-3">
  {product.name}
</td>

{/* Opening Balance */}

<td className="p-3 text-center">
  {product.openingStock}
</td>

{/* Receipts */}

<td className="p-3">

  <input
    type="number"
    value={product.receipts}
    onChange={(e) => {

      const value = Number(e.target.value);

      const updated = [...products];

      const originalIndex = updated.findIndex(
        (p) => p.id === product.id
      );
      
      updated[originalIndex].receipts = value;
      
      updated[originalIndex].total =
        updated[originalIndex].openingStock +
        value;

let updatedProducts = 0;
let sold = 0;
let revenue = 0;

updated.forEach((item) => {

  const sales =
    item.total -
    item.closingStock;

  if (
    item.receipts > 0 ||
    item.closingStock !== item.openingStock
  ) {

    updatedProducts++;

  }

  sold += sales;

  revenue +=
    sales *
    Number(item.price);

});

setProducts(updated);

updateMorningSummary(updated);

    }}
    className="w-20 bg-zinc-800 rounded p-2 text-center"
  />

</td>

{/* Total */}

<td className="p-3 text-center font-semibold text-blue-400">

  {product.total}

</td>

{/* Closing Balance */}

<td className="p-3">

  <input
    type="number"
    value={product.closingStock}
    onChange={(e) => {

      const value = Number(e.target.value);

const updated = [...products];

if (value > updated[index].total) {

  toast.error(
    "Closing Stock cannot exceed Total Stock"
  );

  return;

}

const originalIndex = updated.findIndex(
  (p) => p.id === product.id
);

updated[originalIndex].closingStock = value;

let updatedProducts = 0;
let sold = 0;
let revenue = 0;

updated.forEach((item) => {

  const sales =
    item.total -
    item.closingStock;

  if (
    item.receipts > 0 ||
    item.closingStock !== item.openingStock
  ) {

    updatedProducts++;

  }

  sold += sales;

  revenue +=
    sales *
    Number(item.price);

});

setProducts(updated);

updateMorningSummary(updated);

    }}
    className="w-20 bg-zinc-800 rounded p-2 text-center"
  />

</td>

{/* Sales */}

<td className="p-3 text-center text-red-400 font-semibold">

  {Math.max(
  0,
  product.total -
  product.closingStock
)}

</td>

{/* Rate */}

<td className="p-3 text-center">

₹{product.price}

</td>

{/* Amount */}

<td className="p-3 text-center text-green-400 font-bold">

₹{
Math.max(
  0,
  product.total -
  product.closingStock
)
*
Number(product.price)
}

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
      onClick={() => setPreviewOpen(true)}
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
        ? " Saving..."
        : " Save Morning Stock"}

    </button>

  </div>

</div>
{previewOpen && (

<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

<div className="bg-zinc-900 rounded-2xl w-[900px] max-h-[85vh] overflow-hidden">

<div className="p-6 border-b border-zinc-700">

<h2 className="text-2xl font-bold text-orange-500">

Morning Stock Preview

</h2>

<p className="text-zinc-400">

Verify the entries before saving.

</p>

</div>
<div className="max-h-[500px] overflow-y-auto">

<table className="w-full">

<thead className="sticky top-0 bg-zinc-800">

<tr>

<th>S.No</th>

<th>Brand</th>

<th>OB</th>

<th>Rec.</th>

<th>Total</th>

<th>CB</th>

<th>Sales</th>

<th>Amount</th>

</tr>

</thead>

<tbody>

{changedProducts.map((product,index)=>{

const sales = Math.max(
  0,
  product.total - product.closingStock
);

return(

<tr
key={product.id}
className="border-b border-zinc-800"
>

<td>{index+1}</td>

<td>{product.name}</td>

<td>{product.openingStock}</td>

<td>{product.receipts}</td>

<td>{product.total}</td>

<td>{product.closingStock}</td>

<td>{sales}</td>

<td>
₹{sales*product.price}
</td>

</tr>

);

})}

</tbody>

</table>

</div>
<div className="p-6 border-t border-zinc-700 flex justify-between">

<div>

<p>

Products Updated :
<strong>
{productsUpdated}
</strong>

</p>

<p>

Bottles Sold :
<strong>
{totalSold}
</strong>

</p>

<p>

Revenue :
<strong>

₹{estimatedRevenue}

</strong>

</p>

</div>

<div className="flex gap-3">

  <button
    onClick={() => setPreviewOpen(false)}
    className="
      bg-yellow-500
      hover:bg-yellow-600
      px-4
      py-2
      rounded-lg
      text-sm
      font-medium
      transition
    "
  >
     Edit
  </button>

  <button
    onClick={async () => {
      setPreviewOpen(false);
      await saveMorningStock();
    }}
    className="
      bg-green-600
      hover:bg-green-700
      px-4
      py-2
      rounded-lg
      text-sm
      font-medium
      transition
    "
  >
     Save
  </button>

</div>

</div>

</div>

</div>

)}
    </div> 
  );
}