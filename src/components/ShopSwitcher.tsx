import { useEffect, useState, useRef } from "react";
import { getFirebaseAuth } from "../lib/firebase";
import { listShops } from "@/lib/api/liquorflow";

export default function ShopSwitcher() {

  const [shops, setShops] = useState<any[]>([]);
  const [currentShop, setCurrentShop] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadShops();
  }, []);

  async function loadShops() {

    const user = getFirebaseAuth().currentUser;

    if (!user) return;

    const list = await listShops();

    setShops(list);

    const selectedShopId =
      localStorage.getItem("selectedShopId");

    setCurrentShop(
      list.find(
        (shop:any) =>
          shop.id === selectedShopId
      )
    );

  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
  
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
          w-full
          text-left
          bg-zinc-900
          hover:bg-zinc-800
          rounded-xl
          p-4
          border
          border-zinc-700
          transition
        "
      >
  
        <div className="flex items-center justify-between">
  
          <div>
  
            <h2 className="font-bold text-white text-lg">
  
              🏪 {currentShop?.shopName ?? "Loading..."}
  
            </h2>
  
            <p className="text-zinc-400 text-sm">
  
              {currentShop?.shopCategory}
  
            </p>
  
          </div>
  
          <span
            className={`transition-transform ${
              open
                ? "rotate-180"
                : ""
            }`}
          >
            ▼
          </span>
  
        </div>
  
      </button>

      {open && (

<div
  className="
    absolute
    left-0
    mt-2
    w-full
    bg-zinc-900
    border
    border-zinc-700
    rounded-xl
    shadow-2xl
    overflow-hidden
    z-50
  "
>

  {shops.map((shop: any) => (

    <button
      key={shop.id}
      onClick={() => {

        localStorage.setItem(
          "selectedShopId",
          shop.id
        );
      
        setOpen(false);
      
        window.location.reload();
      
      }}
      className="
        w-full
        text-left
        px-4
        py-3
        hover:bg-zinc-800
        transition
        border-b
        border-zinc-800
      "
    >

      <div className="flex justify-between items-center">

        <div>

          <p className="font-semibold text-white">

            {shop.shopName}

          </p>

          <p className="text-xs text-zinc-400">

            {shop.shopCategory}

          </p>

        </div>

        {shop.id ===
          currentShop?.id && (

          <span className="text-orange-500">

            ✓

          </span>

        )}

      </div>

    </button>

  ))}

</div>

)}
  
    </div>
  );

}