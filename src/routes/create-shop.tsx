import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getFirebaseAuth } from "../lib/firebase";
import { createShop as createShopApi } from "@/lib/api/liquorflow";
import { syncProducts } from "../lib/syncProducts";
import { requireAuthBeforeLoad } from "@/lib/require-auth";

export const Route = createFileRoute("/create-shop")({
  ssr: false,
  beforeLoad: async () => requireAuthBeforeLoad("/create-shop"),
  component: CreateShopPage,
});

function CreateShopPage() {

  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("Wines");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createShop() {

    if (!shopName.trim()) {

      setError("Please enter shop name");

      return;

    }

    const user = getFirebaseAuth().currentUser;

    if (!user) {

      window.location.href = "/login";

      return;

    }

    try {

      setLoading(true);

      const shop = await createShopApi({
        shopName,
        shopCategory,
      });

      const shopId = shop.id;

      await syncProducts(shopId);

      localStorage.setItem(
        "selectedShopId",
        shopId
      );

      window.location.href = "/dashboard";

    } catch (err: any) {

      console.error(err);

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="min-h-screen bg-black flex justify-center items-center">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-white mb-6">
          Create New Shop
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Shop Name"
            value={shopName}
            onChange={(e)=>setShopName(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          <select
            value={shopCategory}
            onChange={(e)=>setShopCategory(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          >
            <option value="Wines">Wines</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {error && (

            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400">

              {error}

            </div>

          )}

          <button
            onClick={createShop}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 p-3 rounded-xl font-semibold text-white"
          >

            {loading
              ? "Creating..."
              : "Create Shop"}

          </button>

        </div>

      </div>

    </div>

  );

}