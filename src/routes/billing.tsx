import { createFileRoute } from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";

import Sidebar from "../components/Sidebar";
import {
  useCart,
} from "@/context/CartContext";

import toast from "react-hot-toast";

import PageLoader
from "../components/PageLoader";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {

  const [shopId, setShopId] = useState<string | null>(null);

  const [products, setProducts] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

    const [loading,
      setLoading] =
      useState(true);

const [customerPaid, setCustomerPaid] =
  useState("");
  const {
    cart,
    setCart,
  } = useCart() as {
    cart: any[];
    setCart: React.Dispatch<
      React.SetStateAction<any[]>
    >;
  };

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

      const productsData: any[] = [];

      querySnapshot.forEach((docItem) => {

        productsData.push({
          id: docItem.id,
          ...docItem.data(),
        });

      });

      setProducts(productsData);

    } catch (error) {

      console.error(error);

    }
  }

  function addToCart(product: any) {

    const savedCart =
      JSON.parse(
        localStorage.getItem("cart") || "[]"
      );
  
    const existing =
      savedCart.find(
        (item: any) =>
          item.id === product.id
      );
  
    let updatedCart;
  
    if (existing) {
  
      updatedCart =
        savedCart.map(
          (item: any) =>
  
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
  
    } else {
  
      updatedCart = [
        ...savedCart,
        {
          ...product,
          quantity: 1,
        },
      ];
  
    }
  
    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  
    toast.success(
      `${product.name} added to cart`
    );
  
  }
  async function completeSale() {

    if (cart.length === 0) {
  
      toast.error("Cart is empty");
  
      return;
  
    }
  
    try {
  
      for (const item of cart) {
  
        const latestProduct =
          products.find(
            (p) =>
              p.id === item.id
          );
  
        if (
          !latestProduct ||
          latestProduct.quantity <
            item.quantity
        ) {
  
          toast.error(
            `${item.name} has insufficient stock`
          );
  
          return;
  
        }
  
        await updateDoc(
          doc(
            getFirestoreDb(),
            "shops",
            shopId!,
            "products",
            item.id
          ),
          {
            quantity:
              latestProduct.quantity -
              item.quantity,
          }
        );
  
        await addDoc(
          collection(
            getFirestoreDb(),
            "shops",
            shopId!,
            "sales"
          ),
          {
            productName:
              item.name,
  
            category:
              item.category ||
              "Others",
  
            quantity:
              item.quantity,
  
            price:
              Number(
                item.price
              ) *
              item.quantity,
  
            profit:
              Number(
                item.price
              ) *
              item.quantity,
  
            soldAt:
              Timestamp.now(),
          }
        );
  
      }
  
      setCart([]);

      localStorage.removeItem(
        "cart"
      );
  
      fetchProducts();
  
      toast.success(
        "Sale completed successfully 🚀"
      );
  
    } catch (error) {
  
      console.error(error);
  
      toast.error(
        "Failed to complete sale"
      );
  
    }
  
  }
  
  const totalBill =
  cart.reduce(
    (sum, item) =>
      sum +
      item.price *
      item.quantity,
    0
  );
  function getCart() {

    if (
      typeof window ===
      "undefined"
    ) {
  
      return [];
  
    }
  
    return JSON.parse(
      localStorage.getItem(
        "cart"
      ) || "[]"
    );
  
  }
  
  const [cartVersion, setCartVersion] =
    useState(0);
  
  function getCartQuantity(
    productId: string
  ) {
    const cart = getCart();
  
    const item = cart.find(
      (item: any) =>
        item.id === productId
    );
  
    return item
      ? item.quantity
      : 0;
  }
  
  function increaseQuantity(
    product: any
  ) {
  
    if (
      product.quantity <= 0
    ) {
  
      toast.error(
        `${product.name} is Out of Stock`
      );
  
      return;
  
    }
  
    const cart =
      getCart();
  
    const existing =
      cart.find(
        (item: any) =>
          item.id ===
          product.id
      );
  
    if (
      existing &&
      existing.quantity >=
      product.quantity
    ) {
  
      toast.error(
        `Only ${product.quantity} bottles available`
      );
  
      return;
  
    }
  
    let updatedCart;
  
    if (existing) {
  
      updatedCart =
        cart.map(
          (item: any) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
  
    } else {
  
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];
  
    }
  
    localStorage.setItem(
      "cart",
      JSON.stringify(
        updatedCart
      )
    );
  
    setCartVersion(
      (prev) =>
        prev + 1
    );
  
  }
  
  function decreaseQuantity(
    productId: string
  ) {
    const cart = getCart();
  
    const updatedCart = cart
      .map((item: any) =>
        item.id === productId
          ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
          : item
      )
      .filter(
        (item: any) =>
          item.quantity > 0
      );
  
    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  
    setCartVersion(
      (prev) => prev + 1
    );
  }
  
  function getCartCount() {
    const cart = getCart();
  
    return cart.reduce(
      (
        total: number,
        item: any
      ) =>
        total + item.quantity,
      0
    );
  }
  
  function getCartTotal() {
    const cart = getCart();
  
    return cart.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        item.price *
          item.quantity,
      0
    );
  }

  if (loading) {

    return <PageLoader />;
  
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
  
      <Sidebar />
  
      <div className="flex-1 p-6 pt-24">
  
        {/* Header */}
  
        <h1 className="text-4xl font-bold mb-6">
          Billing / POS 💵
        </h1>
  
        {/* Search + Category */}
  
        <div className="grid md:grid-cols-2 gap-4 mb-6">
  
          <input
            type="text"
            placeholder="🔍 Search Products..."
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
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
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
            <option>Beer</option>
            <option>Wine</option>
            <option>Breezer</option>
            <option>Others</option>
  
          </select>
  
        </div>
  
        {/* Products */}
  
        <div className="space-y-3">
  
          {products
            .filter((product) => {
  
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
                selectedCategory ===
                "All"
                  ? true
                  : category ===
                    selectedCategory;
  
              return (
                matchesSearch &&
                matchesCategory
              );
  
            })
            .map((product) => (
  
              <div
                key={product.id}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                  flex
                  justify-between
                  items-center
                "
              >
  
                <div>
  
                  <h2 className="text-lg font-semibold">
                    {product.name}
                  </h2>
  
                  <div className="flex gap-3 mt-1 text-sm">
  
                    <span className="text-orange-400">
                      {product.category ||
                        "Others"}
                    </span>
  
                    <span className="text-zinc-500">
                      Stock:
                      {" "}
                      {product.quantity}
                    </span>
  
                  </div>
  
                </div>
  
                <div className="flex items-center gap-5">
  
                  <span className="text-xl font-bold text-green-400">
                    ₹{product.price}
                  </span>
  
                  {getCartQuantity(product.id) === 0 ? (
  
  <button
  disabled={
    product.quantity <= 0
  }
  onClick={() =>
    increaseQuantity(
      product
    )
  }
  className={`
    px-5
    py-2
    rounded-lg
    font-medium
    min-w-[90px]

    ${
      product.quantity <= 0

        ? "bg-zinc-700 cursor-not-allowed"

        : "bg-orange-500 hover:bg-orange-600"
    }
  `}
>
  {
    product.quantity <= 0

      ? "Out of Stock"

      : "Add"
  }
</button>
  
                  ) : (
  
                    <div
                      className="
                        flex
                        items-center
                        bg-zinc-800
                        rounded-lg
                        overflow-hidden
                      "
                    >
  
                      <button
                        onClick={() =>
                          decreaseQuantity(
                            product.id
                          )
                        }
                        className="
                          px-3
                          py-2
                          text-red-400
                          font-bold
                          text-xl
                        "
                      >
                        −
                      </button>
  
                      <span
                        className="
                          px-4
                          font-semibold
                        "
                      >
                        {getCartQuantity(
                          product.id
                        )}
                      </span>
  
                      <button
                        onClick={() =>
                          increaseQuantity(
                            product
                          )
                        }
                        className="
                          px-3
                          py-2
                          text-green-400
                          font-bold
                          text-xl
                        "
                      >
                        +
                      </button>
  
                    </div>
  
                  )}
  
                </div>
  
              </div>
  
            ))}
  
        </div>
  
      </div>
  
      {/* Floating Cart Button */}
  
      <button
        onClick={() =>
          window.location.href =
            "/cart"
        }
        className="
          fixed
          bottom-6
          right-6
          bg-orange-500
          hover:bg-orange-600
          px-6
          py-4
          rounded-full
          shadow-xl
          font-semibold
          z-50
        "
      >
        🛒 {getCartCount()} |
        ₹{getCartTotal()}
      </button>
  
    </div>
  );
}