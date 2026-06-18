import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";
import Sidebar from "../components/Sidebar";

import PageLoader
from "../components/PageLoader";

export const Route = createFileRoute("/sales-history")({
  component: SalesHistoryPage,
});

function SalesHistoryPage() {
  const [shopId,
    setShopId] =
    useState<string | null>(
      null
    );

  const [sales, setSales] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [selectedDate, setSelectedDate] =
    useState("");

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
    
        await fetchSales();
    
        setLoading(false);
    
      }
    
      if (shopId) {
    
        loadData();
    
      }
    
    }, [shopId]);

  async function fetchSales() {
    if (!shopId) return;

    const snapshot =
      await getDocs(
        collection(
          getFirestoreDb(),
          "shops",
          shopId,
          "sales"
        )
      );

    const salesData: any[] = [];

    snapshot.forEach((doc) => {
      salesData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    salesData.sort(
      (a, b) =>
        b.soldAt?.seconds -
        a.soldAt?.seconds
    );

    setSales(salesData);
  }

  const filteredSales =
    sales.filter((sale) => {

      const matchesSearch =
        sale.productName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesCategory =
        category === "All"
          ? true
          : sale.category ===
            category;

      let matchesDate = true;

      const saleDate =
        sale.soldAt?.toDate?.();

      if (!saleDate)
        return false;

      if (selectedDate) {

        const selected =
          new Date(
            selectedDate
          );

        matchesDate =
          saleDate.toDateString() ===
          selected.toDateString();

      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDate
      );
    });

  const totalRevenue =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.price || 0),
      0
    );
    async function downloadPDF() {

      const { default: jsPDF } = await import("jspdf");
const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF();
      
        const generatedAt =
          new Date().toLocaleString();
      
        doc.setFontSize(20);
      
        doc.text(
          "LiquorFlow Sales Report",
          14,
          20
        );
      
        doc.setFontSize(11);
      
        doc.text(
          `Generated At: ${generatedAt}`,
          14,
          30
        );
        const cashSales =
  filteredSales
    .filter(
      (sale) =>
        sale.paymentMethod ===
        "Cash"
    )
    .reduce(
      (sum, sale) =>
        sum + (sale.price || 0),
      0
    );

const upiSales =
  filteredSales
    .filter(
      (sale) =>
        sale.paymentMethod ===
        "UPI"
    )
    .reduce(
      (sum, sale) =>
        sum + (sale.price || 0),
      0
    );

const cardSales =
  filteredSales
    .filter(
      (sale) =>
        sale.paymentMethod ===
        "Card"
    )
    .reduce(
      (sum, sale) =>
        sum + (sale.price || 0),
      0
    );
      
        if (selectedDate) {
      
          doc.text(
            `Selected Date: ${selectedDate}`,
            14,
            38
          );
      
        }
      
        doc.text(
          `Cash Sales: ₹${cashSales}`,
          14,
          45
        );
        
        doc.text(
          `UPI Sales: ₹${upiSales}`,
          14,
          53
        );
        
        doc.text(
          `Card Sales: ₹${cardSales}`,
          14,
          61
        );
        
        autoTable(doc, {
        
          startY: 70,
      
          head: [[
            "Product",
            "Category",
            "Qty",
            "Rate",
            "Amount",
            "Payment",
            "Date & Time"
          ]],
      
              body:
  filteredSales.map(
    (sale) => [

      sale.productName,

      sale.category,

      sale.quantity,

      `₹${Math.round(
        sale.price /
        sale.quantity
      )}`,

      `₹${sale.price}`,

      sale.paymentMethod ||
      "Cash",

      sale.soldAt
        ?.toDate?.()
        .toLocaleString(),

    ]
  ),
      
        });
      
        const finalY =
          (doc as any)
            .lastAutoTable
            .finalY + 10;
      
            const totalItemsSold =
            filteredSales.reduce(
              (sum, sale) =>
                sum +
                (sale.quantity || 0),
              0
            );
          
          doc.text(
            `Total Items Sold: ${totalItemsSold}`,
            14,
            finalY
          );
      
        doc.text(
          `Total Revenue: ₹${totalRevenue}`,
          14,
          finalY + 8
        );
      
        doc.save(
          `LiquorFlow_Sales_Report_${Date.now()}.pdf`
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
    Sales History 📜
  </h1>

  <button
    onClick={downloadPDF}
    className="
      bg-green-500
      hover:bg-green-600
      px-5
      py-3
      rounded-xl
      font-semibold
      transition-all
    "
  >
    📄 Download PDF
  </button>

</div>

        {/* Filters */}

        <div className="grid lg:grid-cols-3 gap-4 mb-8">

          <input
            type="text"
            placeholder="🔍 Search Product..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="
              p-4
              rounded-xl
              bg-zinc-900
              border
              border-zinc-800
            "
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="
              p-4
              rounded-xl
              bg-zinc-900
              border
              border-zinc-800
            "
          >
            <option>All</option>
            <option>Whisky</option>
            <option>Brandy</option>
            <option>Vodka</option>
            <option>Rum</option>
            <option>Wine</option>
            <option>Beer</option>
            <option>Breezer</option>
          </select>

          <div className="flex items-center gap-2">

  <div className="relative flex-1">

    <input
      type="date"
      value={selectedDate}
      onChange={(e) =>
        setSelectedDate(
          e.target.value
        )
      }
      className="
        w-full
        p-4
        pl-12
        rounded-xl
        bg-zinc-900
        border
        border-zinc-800
        text-white
      "
    />

    <span
      className="
        absolute
        left-4
        top-1/2
        -translate-y-1/2
        text-orange-500
        text-xl
        pointer-events-none
      "
    >
      📅
    </span>

  </div>

  {selectedDate && (

    <button
      onClick={() =>
        setSelectedDate("")
      }
      className="
        px-4
        py-4
        rounded-xl
        bg-red-500
        hover:bg-red-600
        transition-all
        font-bold
      "
    >
      ✕
    </button>

  )}

</div>

        </div>

        {/* Stats */}

        <div className="grid md:grid-cols-2 gap-4 mb-8">

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400">
              Total Sales
            </h2>

            <p className="text-4xl font-bold mt-2">
              {filteredSales.length}
            </p>

          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

            <h2 className="text-zinc-400">
              Revenue
            </h2>

            <p className="text-4xl font-bold text-green-400 mt-2">
              ₹{totalRevenue}
            </p>

          </div>

        </div>

        {/* Sales List */}

        <div className="space-y-4">

          {filteredSales.map(
            (sale) => (

              <div
                key={sale.id}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-2xl
                  p-5
                "
              >

                <div className="flex justify-between items-center">

                <div>

<h2 className="text-2xl font-bold">
  {sale.productName}
</h2>

<p className="text-zinc-400 mt-1">
  Qty: {sale.quantity}
</p>

<p className="text-orange-400 mt-1">
  {sale.category}
</p>

</div>

                  <div className="text-right">

                    <p className="text-3xl font-bold text-green-400">
                      ₹{sale.price}
                    </p>
                   

<p className="text-zinc-400 text-sm">
  {sale.quantity} × ₹
  {Math.round(
    sale.price /
    sale.quantity
  )}
</p>

                    <p className="text-zinc-400 text-sm">
                      {sale.soldAt
                        ?.toDate?.()
                        .toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

            )
          )}

          {filteredSales.length ===
            0 && (

            <div className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-2xl
              p-8
              text-center
            ">

              <p className="text-zinc-400 text-lg">
                No sales found.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}