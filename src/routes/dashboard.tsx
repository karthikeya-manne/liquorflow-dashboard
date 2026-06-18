import { createFileRoute } from "@tanstack/react-router";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";



import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";

import Sidebar from "../components/Sidebar";

import PageLoader
from "../components/PageLoader";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {

  const [products, setProducts] =
    useState<any[]>([]);

  const [sales, setSales] =
    useState<any[]>([]);

    const [openingStock, setOpeningStock] =
  useState<number>(0);

  const [shopId, setShopId] =
  useState<string | null>(null);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {

    const unsubscribe =
      getFirebaseAuth()
        .onAuthStateChanged(
          (user) => {
  
            if (user) {
  
              setShopId(
                user.uid
              );
  
            }
  
          }
        );
  
    return () =>
      unsubscribe();
  
  }, []);

  useEffect(() => {

    async function loadData() {
  
      await fetchData();
  
      setLoading(false);
  
    }
  
    if (shopId) {
  
      loadData();
  
    }
  
  }, [shopId]);

    const [purchaseQty, setPurchaseQty] =
  useState<Record<string, number>>({});

  const inputRefs =
  useRef<HTMLInputElement[]>(
    []
  );

  async function fetchData() {

    if (!shopId) return;

    try {

      const productsSnapshot =
        await getDocs(
          collection(
            getFirestoreDb(),
            "shops",
            shopId,
            "products"
          )
        );

      const productsData: any[] = [];

      productsSnapshot.forEach(
        (docItem) => {

          productsData.push({
            id: docItem.id,
            ...docItem.data(),
          });

        }
      );

      setProducts(productsData);

      const salesSnapshot =
        await getDocs(
          collection(
            getFirestoreDb(),
            "shops",
            shopId,
            "sales"
          )
        );

      const salesData: any[] = [];

      salesSnapshot.forEach(
        (docItem) => {

          salesData.push({
            id: docItem.id,
            ...docItem.data(),
          });

        }
      );

      setSales(salesData);

    } catch (error) {

      console.error(error);

    }
  }

  const totalStock =
  products.reduce(
    (sum, product) =>
      sum +
      (product.quantity || 0),
    0
  );

  useEffect(() => {

    if (
      typeof window ===
      "undefined"
    )
      return;
  
    if (totalStock === 0)
      return;
  
    const today =
      new Date()
        .toISOString()
        .split("T")[0];
  
    const openingKey =
      `openingStock-${today}`;
  
    const savedOpening =
      localStorage.getItem(
        openingKey
      );
  
    if (
      savedOpening &&
      Number(savedOpening) > 0
    ) {
  
      setOpeningStock(
        Number(savedOpening)
      );
  
      return;
  
    }
  
    const yesterday =
      new Date();
  
    yesterday.setDate(
      yesterday.getDate() - 1
    );
  
    const yesterdayDate =
      yesterday
        .toISOString()
        .split("T")[0];
  
    const yesterdayClosing =
      localStorage.getItem(
        `closingStock-${yesterdayDate}`
      );
  
    if (
      yesterdayClosing &&
      Number(yesterdayClosing) > 0
    ) {
  
      setOpeningStock(
        Number(yesterdayClosing)
      );
  
      localStorage.setItem(
        openingKey,
        yesterdayClosing
      );
  
    } else {
  
      setOpeningStock(
        totalStock
      );
  
      localStorage.setItem(
        openingKey,
        totalStock.toString()
      );
  
    }
  
  }, [totalStock]);


  const totalProducts =
    products.length;



  const lowStockProducts =
    products.filter(
      (product) =>
        product.quantity <= 5
    ).length;

    const lowStockList =
  products.filter(
    (product) =>
      product.quantity <= 5
  );

  const totalInventoryValue =
    products.reduce(
      (sum, product) =>
        sum +
        (
          (product.quantity || 0) *
          (product.price || 0)
        ),
      0
    );

  const totalRevenue =
    sales.reduce(
      (sum, sale) =>
        sum +
        (sale.price || 0),
      0
    );

    const closingStock =
    totalStock;

    useEffect(() => {

      if (
        typeof window ===
        "undefined"
      )
        return;
    
      const today =
        new Date()
          .toISOString()
          .split("T")[0];
    
      localStorage.setItem(
        `closingStock-${today}`,
        closingStock.toString()
      );
    
    }, [closingStock]);

  const today =
    new Date();

  const todayProfit =
    sales
      .filter((sale) => {

        const saleDate =
          sale.soldAt?.toDate?.();

        return (
          saleDate &&
          saleDate.toDateString() ===
            today.toDateString()
        );

      })
      .reduce(
        (sum, sale) =>
          sum +
          (sale.profit || 0),
        0
      );

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1
  );

  const yesterdayProfit =
    sales
      .filter((sale) => {

        const saleDate =
          sale.soldAt?.toDate?.();

        return (
          saleDate &&
          saleDate.toDateString() ===
            yesterday.toDateString()
        );

      })
      .reduce(
        (sum, sale) =>
          sum +
          (sale.profit || 0),
        0
      );

  const profitGrowth =
    yesterdayProfit > 0
      ? (
          (
            (
              todayProfit -
              yesterdayProfit
            ) /
            yesterdayProfit
          ) * 100
        ).toFixed(1)
      : "100";

  const monthlyRevenue =
    sales.reduce(
      (sum, sale) =>
        sum +
        (sale.price || 0),
      0
    );

  // =========================
  // DAILY CATEGORY SALES
  // =========================

  const dailyCategorySales: any =
    {};

  sales.forEach((sale) => {

    const saleDate =
      sale.soldAt?.toDate?.();

    if (!saleDate) return;

    const isToday =
      saleDate.toDateString() ===
      today.toDateString();

    if (!isToday) return;

    const category =
      sale.category ||
      "Others";

    if (
      !dailyCategorySales[
        category
      ]
    ) {

      dailyCategorySales[
        category
      ] = 0;

    }

    dailyCategorySales[
      category
    ] += sale.price || 0;

  });

  async function downloadPurchaseList() {

    const { default: jsPDF } = await import("jspdf");
const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
  
    doc.setFontSize(20);
  
    doc.text(
      "LiquorFlow Purchase List",
      14,
      20
    );
  
    autoTable(doc, {
  
      startY: 30,
  
      head: [[
        "Product",
        "Category",
        "Current Stock",
        "Order Qty"
      ]],
  
      body:
      lowStockList.map(
        
          (product) => [

      product.name,

      product.category,

      product.quantity,

      purchaseQty[
        product.id
      ] || 0,

    ]
  ),
  
    });
  
    doc.save(
      `Purchase_List_${Date.now()}.pdf`
    );
  
  }

  async function saveToRefillQueue(
    product: any,
    qty: number
  ) {
  
    if (!qty) return;
  
    const queue =
      JSON.parse(
        localStorage.getItem(
          "refillQueue"
        ) || "[]"
      );
  
    const existing =
      queue.findIndex(
        (item: any) =>
          item.productId ===
          product.id
      );
  
    if (existing >= 0) {
  
      queue[existing].refillQty =
        qty;
  
    } else {
  
      queue.push({
        productId:
          product.id,
        productName:
          product.name,
        category:
          product.category,
        refillQty: qty,
      });
  
    }
  
    localStorage.setItem(
      "refillQueue",
      JSON.stringify(queue)
    );
  
  }

  const soldToday =
  Math.max(
    openingStock -
    closingStock,
    0
  );

  async function downloadDailyReport() {

    const { default: jsPDF } = await import("jspdf");
const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
  
    const today =
      new Date();
  
    const todaySales =
      sales.filter((sale) => {
  
        const saleDate =
          sale.soldAt?.toDate?.();
  
        return (
          saleDate &&
          saleDate.toDateString() ===
            today.toDateString()
        );
  
      });
  
    const todayRevenue =
      todaySales.reduce(
        (sum, sale) =>
          sum +
          (sale.price || 0),
        0
      );
  
    const cashSales =
      todaySales
        .filter(
          (sale) =>
            sale.paymentMethod ===
            "Cash"
        )
        .reduce(
          (sum, sale) =>
            sum +
            (sale.price || 0),
          0
        );
  
    const upiSales =
      todaySales
        .filter(
          (sale) =>
            sale.paymentMethod ===
            "UPI"
        )
        .reduce(
          (sum, sale) =>
            sum +
            (sale.price || 0),
          0
        );
  
    const cardSales =
      todaySales
        .filter(
          (sale) =>
            sale.paymentMethod ===
            "Card"
        )
        .reduce(
          (sum, sale) =>
            sum +
            (sale.price || 0),
          0
        );
  
    doc.setFontSize(20);
  
    doc.text(
      "LiquorFlow Daily Report",
      14,
      20
    );
  
    doc.setFontSize(12);
  
    doc.text(
      `Date: ${today.toLocaleDateString()}`,
      14,
      30
    );
  
    doc.text(
      `Opening Stock: ${openingStock} Bottles`,
      14,
      40
    );
  
    doc.text(
      `Closing Stock: ${closingStock} Bottles`,
      14,
      50
    );
  
    doc.text(
      `Sold Today: ${soldToday} Bottles`,
      14,
      60
    );
  
    autoTable(doc, {
  
      startY: 75,
  
      head: [[
        "Product",
        "Qty",
        "Amount",
        "Payment"
      ]],
  
      body:
        todaySales.map(
          (sale) => [
  
            sale.productName ||
            sale.name,
  
            sale.quantity || 1,
  
            `₹${sale.price || 0}`,
  
            sale.paymentMethod ||
            "-",
  
          ]
        ),
  
    });
  
    const finalY =
      (doc as any)
        .lastAutoTable
        .finalY + 15;
  
    doc.text(
      `Total Revenue: ₹${todayRevenue}`,
      14,
      finalY
    );
  
    doc.text(
      `Cash Sales: ₹${cashSales}`,
      14,
      finalY + 10
    );
  
    doc.text(
      `UPI Sales: ₹${upiSales}`,
      14,
      finalY + 20
    );
  
    doc.text(
      `Card Sales: ₹${cardSales}`,
      14,
      finalY + 30
    );
  
    doc.save(
      `Daily_Report_${Date.now()}.pdf`
    );
  
  }

  if (loading) {

    return <PageLoader />;
  
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <div className="flex-1 p-6 pt-24">

      <div className="flex justify-between items-center mb-8">

<h1 className="text-5xl font-bold">
  Dashboard 📊
</h1>

<button
  onClick={downloadDailyReport}
  className="
    bg-green-500
    hover:bg-green-600
    px-5
    py-3
    rounded-xl
    font-semibold
    text-white
  "
>
  📄 Daily Report
</button>

</div>

        {/* TOP CARDS */}

        <div className="grid gap-6 md:grid-cols-4">

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400 text-sm">
              Total Products
            </h2>

            <p className="text-4xl font-bold mt-2">
              {totalProducts}
            </p>

          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400 text-sm">
              Low Stock Alerts
            </h2>

            <p className="text-4xl font-bold text-red-400 mt-2">
              {
                lowStockProducts
              }
            </p>

          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400 text-sm">
              Inventory Value
            </h2>

            <p className="text-4xl font-bold text-orange-400 mt-2">
              ₹
              {
                totalInventoryValue
              }
            </p>

          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400 text-sm">
              Monthly Revenue
            </h2>

            <p className="text-4xl font-bold text-green-400 mt-2">
              ₹
              {monthlyRevenue}
            </p>

          </div>

        </div>

       {/* TODAY SUMMARY + INVENTORY SUMMARY */}

<div className="grid gap-6 md:grid-cols-2 mt-8">

<div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

  <h2 className="text-2xl font-bold mb-4">
    Today's Summary 📊
  </h2>

  <div className="space-y-6">

    <div>

      <p className="text-zinc-400 text-sm">
        Total Sales
      </p>

      <p className="text-3xl font-bold text-green-400 mt-2">
        ₹{totalRevenue}
      </p>

    </div>

    <div>

      <p className="text-zinc-400 text-sm">
        Transactions
      </p>

      <p className="text-3xl font-bold text-orange-400 mt-2">
        {sales.length}
      </p>

    </div>

    <div>

      <p className="text-zinc-400 text-sm">
        Inventory Products
      </p>

      <p className="text-3xl font-bold text-blue-400 mt-2">
        {totalProducts}
      </p>

    </div>

  </div>

</div>

{/* INVENTORY SUMMARY */}

<div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

  <h2 className="text-2xl font-bold mb-4">
    Inventory Summary 📦
  </h2>

  <div className="space-y-6">

    <div>

      <p className="text-zinc-400 text-sm">
        Opening Stock
      </p>

      <p className="text-3xl font-bold text-blue-400 mt-2">
        {openingStock} Bottles
      </p>

    </div>

    <div>

      <p className="text-zinc-400 text-sm">
        Sold Today
      </p>

      <p className="text-3xl font-bold text-orange-400 mt-2">
        {soldToday > 0 ? soldToday : 0} Bottles
      </p>

    </div>

    <div>

      <p className="text-zinc-400 text-sm">
        Closing Stock
      </p>

      <p className="text-3xl font-bold text-green-400 mt-2">
        {closingStock} Bottles
      </p>

    </div>

  </div>

</div>

</div>

        {/* REVENUE SUMMARY */}

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Revenue Summary 💰
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

<div>

  <p className="text-zinc-400 text-sm">
    Total Revenue
  </p>

  <p className="text-3xl font-bold text-green-400 mt-2">
    ₹{totalRevenue}
  </p>

</div>

<div>

  <p className="text-zinc-400 text-sm">
    Total Transactions
  </p>

  <p className="text-3xl font-bold text-orange-400 mt-2">
    {sales.length}
  </p>

</div>

<div>

  <p className="text-zinc-400 text-sm">
    Low Stock Alerts
  </p>

  <p className="text-3xl font-bold text-red-400 mt-2">
    {lowStockProducts}
  </p>

</div>

</div>

        </div>

        {/* DAILY CATEGORY SALES */}

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8">

          <h2 className="text-3xl font-bold mb-6">
            Daily Sales Report 📊
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            {Object.entries(
              dailyCategorySales
            ).map(
              (
                [
                  category,
                  revenue,
                ]: any
              ) => (

                <div
                  key={category}
                  className="bg-zinc-800 p-5 rounded-2xl"
                >

                  <h3 className="text-2xl font-bold">
                    {category}
                  </h3>

                  <p className="text-green-400 text-4xl font-bold mt-4">
                    ₹{revenue}
                  </p>

                </div>

              )
            )}

          </div>

        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mt-8">

  <div className="flex justify-between items-center mb-6">

    <h2 className="text-3xl font-bold">
      Low Stock Purchase List 📦
    </h2>

    <button
      onClick={downloadPurchaseList}
      className="
        bg-orange-500
        hover:bg-orange-600
        px-4
        py-2
        rounded-xl
        font-semibold
      "
    >
      Download PDF
    </button>

  </div>

  <div className="space-y-3">

  {lowStockList.map(
  (
    product,
    index
  ) => (

    <div
      key={product.id}
      className="
        bg-zinc-800
        p-4
        rounded-xl
        flex
        justify-between
        items-center
      "
    >

      <div>

        <h3 className="font-bold text-lg">
          {product.name}
        </h3>

        <p className="text-orange-400">
          {product.category}
        </p>

        <p className="text-red-400 font-bold mt-2">
          Stock: {product.quantity}
        </p>

      </div>

      <div className="flex flex-col items-end">

        <label className="text-sm text-zinc-400 mb-1">
          Order Qty
        </label>

        <input
  ref={(el) => {

    if (el)
      inputRefs.current[
        index
      ] = el;

  }}

  type="number"

  placeholder="Qty"

  value={
    purchaseQty[
      product.id
    ] || ""
  }

  onChange={(e) =>
    setPurchaseQty({
      ...purchaseQty,
      [product.id]:
        Number(
          e.target.value
        ),
    })
  }

  onKeyDown={async (
    e
  ) => {

    if (
      e.key === "Enter"
    ) {

      await saveToRefillQueue(
        product,
        purchaseQty[
          product.id
        ]
      );

      inputRefs.current[
        index + 1
      ]?.focus();

    }

  }}

  className="
    w-24
    p-2
    rounded-lg
    bg-zinc-700
    border
    border-zinc-600
    text-center
  "
/>

      </div>

    </div>

  )
)}

  </div>

</div>

      </div>

    </div>
  );
}