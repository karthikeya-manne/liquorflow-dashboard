import { createFileRoute } from "@tanstack/react-router";

import { useState, useEffect } from "react";

import { listSales } from "@/lib/api/liquorflow";

import Sidebar from "../components/Sidebar";

import PageLoader
from "../components/PageLoader";

import { getCurrentShopId } from "@/lib/currentShop";

export const Route = createFileRoute("/sales")({
component: SalesPage,
});

function SalesPage() {

const [sales, setSales] = useState<any[]>([]);

const [loading,
  setLoading] =
  useState(true);

  const shopId = getCurrentShopId();
  

  useEffect(() => {

    async function loadData() {
  
      if (!shopId) return;
  
      await fetchSales();
  
      setLoading(false);
  
    }
  
    loadData();
  
  }, [shopId]);

async function fetchSales() {


if (!shopId) return;

try {

  const salesData = await listSales(shopId);
  setSales(salesData);

} catch (error) {

  console.error(error);

}


}

const totalSales = sales.length;

const totalRevenue = sales.reduce(
(sum, sale) => sum + sale.price,
0
);

if (loading) {

  return <PageLoader />;

}

return ( <div className="min-h-screen bg-black text-white flex">


  <Sidebar />

  <div className="flex-1 p-6 pt-24">

    <h1 className="text-4xl font-bold mb-6">
      Sales Analytics 
    </h1>

    <div className="grid gap-6 md:grid-cols-3 mb-8">

      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

        <h2 className="text-zinc-400 text-sm">
          Total Sales
        </h2>

        <p className="text-4xl font-bold mt-2">
          {totalSales}
        </p>

      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

        <h2 className="text-zinc-400 text-sm">
          Total Revenue
        </h2>

        <p className="text-4xl font-bold text-green-400 mt-2">
          ₹{totalRevenue}
        </p>

      </div>

      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

        <h2 className="text-zinc-400 text-sm">
          Orders Processed
        </h2>

        <p className="text-4xl font-bold text-orange-400 mt-2">
          {totalSales}
        </p>

      </div>

    </div>

    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">

      <h2 className="text-2xl font-bold mb-4">
        Recent Sales
      </h2>

      <div className="grid gap-4">

        {sales.map((sale) => (

          <div
            key={sale.id}
            className="bg-zinc-800 p-4 rounded-xl flex items-center justify-between"
          >

<div>

<div className="font-bold">
  {sale.productName}
</div>

<div className="text-zinc-400">

  Qty:
  {" "}
  {sale.quantity}
  {" "}
  Bottles Sold

</div>

</div>

            <span className="text-green-400 font-bold">
              ₹{sale.price}
            </span>

          </div>

        ))}

      </div>

    </div>

  </div>

</div>


);
}
