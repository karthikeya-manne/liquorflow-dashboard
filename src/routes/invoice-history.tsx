import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
  } from "firebase/firestore";
  
  import {
    getFirestoreDb,
    getFirebaseAuth,
  } from "../lib/firebase";

  import toast from "react-hot-toast";

  import PageLoader
from "../components/PageLoader";

export const Route =
  createFileRoute(
    "/invoice-history"
  )({
    component:
      InvoiceHistoryPage,
  });

function InvoiceHistoryPage() {
    const [invoices,
        setInvoices] =
        useState<any[]>([]);

        const [selectedInvoice,
            setSelectedInvoice] =
            useState<string | null>(
              null
            );

            const [searchDate,
                setSearchDate] =
                useState("");

                const [showDeleteModal,
                    setShowDeleteModal] =
                    useState(false);
                  
                  const [invoiceToDelete,
                    setInvoiceToDelete] =
                    useState<any>(null);

                    const [deleting,
                        setDeleting] =
                        useState(false);

                        const [loading,
                            setLoading] =
                            useState(true);

                            const [shopId,
                                setShopId] =
                                useState<string | null>(
                                  null
                                );

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
          
              await loadInvoices();
          
              setLoading(false);
          
            }
          
            if (shopId) {
          
              loadData();
          
            }
          
          }, [shopId]);

          async function loadInvoices() {

            const shopId =
              getFirebaseAuth()
                .currentUser?.uid;
          
            if (!shopId)
              return;
          
            const snapshot =
              await getDocs(
          
                collection(
                  getFirestoreDb(),
                  "shops",
                  shopId,
                  "invoiceHistory"
                )
          
              );
          
            const data: any[] = [];
          
            snapshot.forEach(
              (docItem) => {
          
                data.push({
          
                  id:
                    docItem.id,
          
                  ...docItem.data(),
          
                });
          
              }
            );
          
            data.sort(
                (a, b) =>
                  new Date(
                    b.uploadedAt
                  ).getTime() -
                  new Date(
                    a.uploadedAt
                  ).getTime()
              );
              
              setInvoices(data);

            console.log(
                "INVOICES:",
                data
              );
          
          }

          async function deleteInvoice(
            invoice: any
          ) {

            setDeleting(true);
          
            const shopId =
              getFirebaseAuth()
                .currentUser?.uid;
          
                if (!shopId) {

                    setDeleting(false);
                  
                    return;
                  
                  }
          
            const productsSnapshot =
              await getDocs(
                collection(
                  getFirestoreDb(),
                  "shops",
                  shopId,
                  "products"
                )
              );
          
            const products: any[] = [];
          
            productsSnapshot.forEach(
              (docItem) => {
          
                products.push({
                  id: docItem.id,
                  ...docItem.data(),
                });
          
              }
            );
          
            for (const item of invoice.items) {
          
              const product =
                products.find(
                  (p) =>
                    p.name ===
                    item.inventoryName
                );
          
              if (!product)
                continue;
          
              const bottlesToRemove =
              (
                Number(item.qty) *
                Number(item.packQty)
              ) +
              Number(item.bottles || 0);

await updateDoc(
  doc(
    getFirestoreDb(),
    "shops",
    shopId,
    "products",
    product.id
  ),
  {
    quantity:
      Math.max(
        Number(
          product.quantity
        ) -
          bottlesToRemove,
        0
      ),
  }
);
          
            }
          
            await deleteDoc(
              doc(
                getFirestoreDb(),
                "shops",
                shopId,
                "invoiceHistory",
                invoice.id
              )
            );
          
            await loadInvoices();

            const today =
  new Date()
    .toISOString()
    .split("T")[0];

const refreshed =
  await getDocs(
    collection(
      getFirestoreDb(),
      "shops",
      shopId,
      "products"
    )
  );

let totalStock = 0;

refreshed.forEach(
  (docItem) => {

    totalStock += Number(
      docItem.data().quantity || 0
    );

  }
);

localStorage.setItem(
  `openingStock-${today}`,
  totalStock.toString()
);

localStorage.setItem(
  `closingStock-${today}`,
  totalStock.toString()
);
          
toast.success(
              "Invoice deleted successfully"
            );

            setDeleting(false);
          
          }

          if (loading) {

            return <PageLoader />;
          
          }

          return (

            <div className="min-h-screen bg-black text-white flex">
          
              <Sidebar />
          
              <div className="flex-1 p-6 pt-24">
          
                <h1 className="
                  text-5xl
                  font-bold
                  mb-8
                ">
                  Invoice History 📜
                </h1>
          
                <div className="
                  flex
                  items-center
                  gap-3
                  mb-6
                ">
          
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) =>
                      setSearchDate(
                        e.target.value
                      )
                    }
                    className="
                      bg-zinc-900
                      border
                      border-zinc-800
                      rounded-xl
                      px-4
                      py-3
                      text-white
                      outline-none
                    "
                  />
          
                  <button
                    onClick={() =>
                      setSearchDate("")
                    }
                    className="
                      bg-zinc-700
                      hover:bg-zinc-600
                      px-4
                      py-3
                      rounded-xl
                    "
                  >
                    Show All
                  </button>
          
                </div>
          
                {invoices
                  .filter(
                    (invoice) => {
          
                      if (!searchDate)
                        return true;
          
                      return (
                        invoice.uploadedAt
                          ?.split("T")[0] ===
                        searchDate
                      );
          
                    }
                  )
                  .map(
                    (invoice) => (
          
                      <div
                        key={invoice.id}
                        className="
                          bg-zinc-900
                          border
                          border-zinc-800
                          p-6
                          rounded-2xl
                          mb-4
                        "
                      >
          
                        <div className="
                          flex
                          justify-between
                          items-center
                        ">
          
                          <div>
          
                            <h2 className="
                              text-xl
                              font-bold
                            ">
                              {
                                invoice.invoiceNumber
                              }
                            </h2>
          
                            <p className="
                              text-zinc-400
                              text-sm
                              mt-1
                            ">
                              {
                                new Date(
                                  invoice.uploadedAt
                                ).toLocaleString()
                              }
                            </p>
          
                            <p className="mt-2">
                              Products:
                              {" "}
                              {
                                invoice.totalProducts
                              }
                            </p>
          
                            <p>
                              Cases:
                              {" "}
                              {
                                invoice.totalCases
                              }
                            </p>
          
                          </div>
          
                          <div className="flex gap-2">

  <button
    onClick={() =>

      setSelectedInvoice(
        selectedInvoice ===
        invoice.id
          ? null
          : invoice.id
      )

    }
    className="
      bg-orange-500
      hover:bg-orange-600
      px-4
      py-2
      rounded-lg
      font-semibold
    "
  >

    {
      selectedInvoice ===
      invoice.id

        ? "Hide Details"

        : "View Details"
    }

  </button>

  <button
  onClick={() => {

    setInvoiceToDelete(
      invoice
    );

    setShowDeleteModal(
      true
    );

  }}
  className="
    bg-red-500
    hover:bg-red-600
    px-4
    py-2
    rounded-lg
    font-semibold
  "
>
  Delete
</button>
</div>
          
                        </div>
          
                        {selectedInvoice ===
                          invoice.id && (
          
                          <div className="
                            mt-6
                            border-t
                            border-zinc-700
                            pt-4
                          ">
          
                            <h3 className="
                              font-bold
                              mb-4
                            ">
                              Products
                            </h3>
          
                            {invoice.items?.map(
                              (
                                item: any,
                                index: number
                              ) => (
          
                                <div
                                  key={index}
                                  className="
                                    flex
                                    justify-between
                                    py-2
                                    border-b
                                    border-zinc-800
                                  "
                                >
          
                                  <span>
                                    {
                                      item.inventoryName
                                    }
                                  </span>
          
                                  <span className="
  text-green-400
">
  {item.qty}
  {" "}
  Cases

  {Number(item.bottles || 0) > 0 && (
    <>
      {" "}
      +{" "}
      {item.bottles}
      {" "}
      Bottles
    </>
  )}

</span>
          
                                </div>
          
                              )
                            )}
          
                          </div>
          
                        )}
          
                      </div>
          
                    )
                  )}
          
                {invoices.length === 0 && (
          
                  <div className="
                    bg-zinc-900
                    p-6
                    rounded-xl
                    text-center
                    text-zinc-400
                  ">
          
                    No invoices found
          
                  </div>
          
                )}
          
              </div>

              {showDeleteModal && (

<div className="
  fixed
  inset-0
  bg-black/70
  flex
  items-center
  justify-center
  z-50
">

  <div className="
    bg-zinc-900
    p-8
    rounded-2xl
    border
    border-zinc-800
    w-[450px]
  ">

    <h2 className="
      text-2xl
      font-bold
      text-red-400
      mb-4
    ">
      Delete Invoice?
    </h2>

    <p className="mb-6">

      Invoice:

      <span className="
        text-orange-400
        font-bold
      ">
        {" "}
        {
          invoiceToDelete?.invoiceNumber
        }
      </span>

    </p>

    <div className="
      flex
      gap-3
    ">

      <button
        onClick={() =>
          setShowDeleteModal(
            false
          )
        }
        className="
          flex-1
          bg-zinc-700
          hover:bg-zinc-600
          py-3
          rounded-xl
        "
      >
        Cancel
      </button>

      <button
  disabled={deleting}
  onClick={async () => {

    await deleteInvoice(
      invoiceToDelete
    );

    setShowDeleteModal(
      false
    );

  }}
  className="
    flex-1
    bg-red-500
    hover:bg-red-600
    py-3
    rounded-xl
    disabled:opacity-50
  "
>
  {
    deleting
      ? "Deleting..."
      : "Delete"
  }
</button>

    </div>

  </div>

</div>

)}
          
            </div>
          
          );

}