import { createFileRoute } from "@tanstack/react-router";

import { useState, useEffect } from "react";

import {
collection,
addDoc,
getDocs,
updateDoc,
doc,
} from "firebase/firestore";

import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";

import Sidebar from "../components/Sidebar";

export const Route = createFileRoute("/orders")({
component: OrdersPage,
});

function OrdersPage() {

const shopId = getFirebaseAuth().currentUser?.uid;

const [orders, setOrders] = useState<any[]>([]);

const [customerName, setCustomerName] = useState("");

const [productName, setProductName] = useState("");

async function fetchOrders() {


if (!shopId) return;

try {

  const querySnapshot = await getDocs(
    collection(
      getFirestoreDb(),
      "shops",
      shopId,
      "orders"
    )
  );

  const ordersData: any[] = [];

  querySnapshot.forEach((docItem) => {

    ordersData.push({
      id: docItem.id,
      ...docItem.data(),
    });

  });

  setOrders(ordersData);

} catch (error) {

  console.error(error);

}


}

useEffect(() => {
fetchOrders();
}, [shopId]);

async function createOrder() {


if (!customerName || !productName) {
  alert("Please fill all fields");
  return;
}

try {

  await addDoc(
    collection(
      getFirestoreDb(),
      "shops",
      shopId!,
      "orders"
    ),
    {
      customerName,
      productName,
      status: "Pending",
      createdAt: new Date(),
    }
  );

  alert("Order Created 📦");

  setCustomerName("");
  setProductName("");

  fetchOrders();

} catch (error) {

  console.error(error);

}


}

async function completeOrder(id: string) {


try {

  await updateDoc(
    doc(
      getFirestoreDb(),
      "shops",
      shopId!,
      "orders",
      id
    ),
    {
      status: "Completed",
    }
  );

  fetchOrders();

} catch (error) {

  console.error(error);

}


}

return ( <div className="min-h-screen bg-black text-white flex">


  <Sidebar />

  <div className="flex-1 p-6 pt-24">

    <h1 className="text-4xl font-bold mb-6">
      Orders Management 📦
    </h1>

    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-6">

      <h2 className="text-xl font-semibold mb-4">
        Create Order
      </h2>

      <div className="grid gap-4 md:grid-cols-3">

        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) =>
            setCustomerName(e.target.value)
          }
          className="p-3 rounded-lg bg-zinc-800 border border-zinc-700"
        />

        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) =>
            setProductName(e.target.value)
          }
          className="p-3 rounded-lg bg-zinc-800 border border-zinc-700"
        />

        <button
          onClick={createOrder}
          className="bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold p-3"
        >
          Create Order
        </button>

      </div>

    </div>

    <div className="grid gap-4">

      {orders.map((order) => (

        <div
          key={order.id}
          className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between"
        >

          <div>

            <h2 className="text-xl font-semibold">
              {order.productName}
            </h2>

            <p className="text-zinc-400">
              Customer: {order.customerName}
            </p>

          </div>

          <div className="flex items-center gap-3">

            <span
              className={
                order.status === "Completed"
                  ? "bg-green-500/20 text-green-400 px-3 py-1 rounded-lg"
                  : "bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg"
              }
            >
              {order.status}
            </span>

            {order.status !== "Completed" && (

              <button
                onClick={() =>
                  completeOrder(order.id)
                }
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
              >
                Complete
              </button>

            )}

          </div>

        </div>

      ))}

    </div>

  </div>

</div>


);
}
