import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

import {
  getFirestoreDb,
  getFirebaseAuth,
} from "../lib/firebase";

import toast from "react-hot-toast";

import PageLoader
from "../components/PageLoader";

export const Route =
  createFileRoute("/cart")({
    component: CartPage,
  });

function CartPage() {

  const [customerPaid, setCustomerPaid] =
  useState("");

  const [paymentMethod, setPaymentMethod] =
  useState("Cash");

  const [cart, setCart] =
    useState<any[]>([]);

    

  useEffect(() => {

    const savedCart =
      JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

    setCart(savedCart);

  }, []);

  const totalBill =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );

  function saveCart(
    updatedCart: any[]
  ) {

    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

  }
  async function completeSale() {

    const shopId =
      getFirebaseAuth().currentUser?.uid;
  
    if (!shopId) return;
  
    if (cart.length === 0) {
  
      toast.error("Cart is empty");
  
      return;
  
    }
    
  
    try {

      if (
        Number(customerPaid) <
        totalBill
      ) {
      
        toast.error(
          "Customer paid amount is less than bill amount"
        );
      
        return;
      }
  
      for (const item of cart) {
  
        const productRef = doc(
          getFirestoreDb(),
          "shops",
          shopId,
          "products",
          item.id
        );
  
        const productSnap =
          await getDoc(productRef);
  
        if (!productSnap.exists())
          continue;
  
        const productData =
          productSnap.data();
  
        const newQty = Math.max(
  0,
  productData.quantity -
    item.quantity
);
  
        await updateDoc(
          productRef,
          {
            quantity: newQty,
          }
        );
  
        await addDoc(
          collection(
            getFirestoreDb(),
            "shops",
            shopId,
            "sales"
          ),
          {
            productName:
              item.name,
  
            category:
              item.category,
  
            quantity:
              item.quantity,
  
            price:
              item.price *
              item.quantity,

              paymentMethod:
              paymentMethod,
  
            soldAt:
              Timestamp.now(),
          }
        );
  
      }
  
      localStorage.removeItem(
        "cart"
      );
  
      setCart([]);
  
      setCustomerPaid("");
  
      toast.success(
        "Sale Completed Successfully 🎉"
      );
  
    } catch (error) {
  
      console.error(error);
  
      toast.error(
        "Failed to complete sale"
      );
  
    }
  
  }

  return (

    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <div className="flex-1 p-6 pt-24">

        <h1 className="text-5xl font-bold mb-8">
          Cart 🛒
        </h1>

        {cart.length === 0 ? (

          <div className="bg-zinc-900 p-6 rounded-2xl">

            No products in cart

          </div>

        ) : (

          <div className="space-y-4">

            {cart.map((item) => (

              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h2 className="text-xl font-bold">
                    {item.name}
                  </h2>

                  <p className="text-orange-400">
                    {item.category}
                  </p>

                  <p className="text-green-400 mt-2">
                    ₹{item.price}
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <button
                    onClick={() => {

                      const updated =
                        cart.map(
                          (cartItem) =>

                            cartItem.id === item.id
                              ? {
                                  ...cartItem,
                                  quantity:
                                    Math.max(
                                      1,
                                      cartItem.quantity - 1
                                    ),
                                }
                              : cartItem
                        );

                      saveCart(updated);

                    }}
                    className="bg-red-500 px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => {

                      const updated =
                        cart.map(
                          (cartItem) =>

                            cartItem.id === item.id
                              ? {
                                  ...cartItem,
                                  quantity:
                                    cartItem.quantity + 1,
                                }
                              : cartItem
                        );

                      saveCart(updated);

                    }}
                    className="bg-green-500 px-3 py-1 rounded"
                  >
                    +
                  </button>

                  <button
                    onClick={() => {

                      const updated =
                        cart.filter(
                          (cartItem) =>
                            cartItem.id !== item.id
                        );

                      saveCart(updated);

                    }}
                    className="bg-red-700 px-3 py-1 rounded"
                  >
                    🗑
                  </button>

                </div>

              </div>

            ))}

<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

<div className="flex justify-between">

  <span className="text-xl font-bold">
    Total Bill
  </span>

  <span className="text-3xl font-bold text-green-400">
    ₹{totalBill}
  </span>

</div>

<div>

  <label className="block mb-2 text-sm text-zinc-400">
    Payment Method
  </label>

  <select
    value={paymentMethod}
    onChange={(e) =>
      setPaymentMethod(
        e.target.value
      )
    }
    className="
      w-full
      p-3
      rounded-xl
      bg-zinc-800
      border
      border-zinc-700
    "
  >
    <option>Cash</option>
    <option>UPI</option>
    <option>Card</option>
  </select>

</div>

<input
  type="number"
  placeholder="Customer Paid"
  value={customerPaid}
  onChange={(e) =>
    setCustomerPaid(
      e.target.value
    )
  }
  className="
    w-full
    p-3
    rounded-xl
    bg-zinc-800
    border
    border-zinc-700
  "
/>

<div className="flex justify-between">

  <span>
    Change Return
  </span>

  <span className="text-green-400 font-bold">

    ₹
    {Math.max(
      0,
      Number(
        customerPaid || 0
      ) - totalBill
    )}

  </span>

</div>

<button
  onClick={completeSale}
  disabled={cart.length === 0}
  className="
    w-full
    bg-orange-500
    hover:bg-orange-600
    disabled:bg-zinc-700
    py-3
    rounded-xl
    font-semibold
  "
>
  Complete Sale
</button>

</div>

          </div>

        )}

      </div>

    </div>

  );
}