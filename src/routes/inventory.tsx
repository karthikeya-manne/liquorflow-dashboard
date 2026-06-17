import { createFileRoute } from "@tanstack/react-router";

import { useState, useEffect } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";

import Sidebar from "../components/Sidebar";

import toast from "react-hot-toast";

import PageLoader
from "../components/PageLoader";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {

  const [shopId,
    setShopId] =
    useState<string | null>(
      null
    );

  const [products, setProducts] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

    const [pendingRefills,
      setPendingRefills] =
      useState(0);

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

    if (
      typeof window ===
      "undefined"
    )
      return;
  
    const queue =
      JSON.parse(
        localStorage.getItem(
          "refillQueue"
        ) || "[]"
      );
  
    setPendingRefills(
      queue.length
    );
  
  }, []);

  useEffect(() => {

    async function loadData() {
  
      await fetchProducts();
  
      setLoading(false);
  
    }
  
    if (shopId) {
  
      loadData();
  
    }
  
  }, [shopId]);

  async function fetchProducts() {

    if (!shopId) return;

    try {

      const querySnapshot =
        await getDocs(
          collection(
            getFirestoreDb(),
            "shops",
            shopId,
            "products"
          )
        );

      const data: any[] = [];

      querySnapshot.forEach((docItem) => {

        data.push({
          id: docItem.id,
          ...docItem.data(),
        });

      });

      setProducts(data);

    } catch (error) {

      console.error(error);

    }
  }

  async function deleteProduct(id: string) {

    try {

      await deleteDoc(
        doc(
          getFirestoreDb(),
          "shops",
          shopId!,
          "products",
          id
        )
      );

      fetchProducts();

    } catch (error) {

      console.error(error);

    }
  }

  async function editProduct(
    id: string,
    quantity: number,
    price: number
  ) {

    const newQuantity = prompt(
      "Enter quantity",
      quantity.toString()
    );

    const newPrice = prompt(
      "Enter price",
      price.toString()
    );

    if (!newQuantity || !newPrice)
      return;

    try {

      await updateDoc(
        doc(
          getFirestoreDb(),
          "shops",
          shopId!,
          "products",
          id
        ),
        {
          quantity: Number(newQuantity),
          price: Number(newPrice),
        }
      );

      fetchProducts();

    } catch (error) {

      console.error(error);

    }
  }

  const filteredProducts =
    products.filter((product) => {

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const category =
        product.category ||
        "Others";

      const matchesCategory =
        selectedCategory === "All"
          ? true
          : category ===
            selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );

    });

    async function refillAllStocks() {

      if (!shopId) return;

      const queue =
        JSON.parse(
          localStorage.getItem(
            "refillQueue"
          ) || "[]"
        );
    
      if (queue.length === 0) {
    
        toast.error(
          "No refill stocks pending"
        );
    
        return;
    
      }
    
      for (const refill of queue) {
    
        const product =
          products.find(
            (p) =>
              p.id ===
              refill.productId
          );
    
        if (!product)
          continue;
    
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
              Number(
                product.quantity
              ) +
              Number(
                refill.refillQty
              ),
          }
        );
    
      }
    
      localStorage.removeItem(
        "refillQueue"
      );
    
      toast.success(
        "Stocks Refilled Successfully"
      );
    
      fetchProducts();
    
    }

    if (!shopId) {

      return (
    
        <div className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        ">
          Loading Inventory...
        </div>
    
      );
    
    }

    if (loading) {

      return <PageLoader />;
    
    }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <div className="flex-1 p-6 pt-24">

        <h1 className="text-5xl font-bold mb-8">
          Inventory 📦
        </h1>

        <div className="flex justify-between items-center mb-6">

  <p className="text-orange-400 font-semibold">
    Pending Refills:
    {pendingRefills}
  </p>

  <button
    onClick={refillAllStocks}
    className="
      bg-green-500
      hover:bg-green-600
      px-4
      py-2
      rounded-xl
      font-semibold
    "
  >
    📦 Refill All Stocks
  </button>

</div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <input
            type="text"
            placeholder="Search Products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
          />

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
          >

            <option>All</option>
            <option>Whisky</option>
            <option>Brandy</option>
            <option>Vodka</option>
            <option>Rum</option>
            <option>Beer</option>
            <option>Wine</option>
            <option>Breezer</option>
            <option>Others</option>

          </select>

        </div>

        <div className="grid gap-4">

          {filteredProducts.map(
            (product) => (

              <div
                key={product.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between"
              >

                <div>

                  <h2 className="text-2xl font-bold">
                    {product.name}
                  </h2>

                  <p className="text-orange-400 mt-1">
                    {
                      product.category ||
                      "Others"
                    }
                  </p>

                  <p className="text-zinc-400 mt-2">
                    Qty:{" "}
                    {
                      product.quantity
                    }
                  </p>

                  <p className="text-green-400 text-3xl font-bold mt-2">
                    ₹{product.price}
                  </p>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      editProduct(
                        product.id,
                        product.quantity,
                        product.price
                      )
                    }
                    className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-xl"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteProduct(
                        product.id
                      )
                    }
                    className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl"
                  >
                    Delete
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}