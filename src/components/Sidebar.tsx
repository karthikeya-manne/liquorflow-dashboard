import { Link } from "@tanstack/react-router";

import { useState } from "react";

import { signOut } from "firebase/auth";

import { getFirebaseAuth } from "../lib/firebase";

export default function Sidebar() {

  const [isOpen, setIsOpen] =
    useState(false);

  async function handleLogout() {

    try {

      await signOut(getFirebaseAuth());

      window.location.href = "/login";

    } catch (error) {

      console.error(error);

    }
  }

  function closeSidebar() {

    setIsOpen(false);

  }

  return (
    <>

      {/* Top Navbar */}

      <div className="fixed top-0 left-0 w-full h-16 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 z-50">

        <button
          onClick={() =>
            setIsOpen(!isOpen)
          }
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
        >
          ☰
        </button>

        <h1 className="
  ml-4
  text-2xl
  font-extrabold
  tracking-wide
">
  <span className="text-white">
    Liquor
  </span>
  <span className="text-orange-500">
    Flow
  </span>
</h1>

      </div>

      {/* Overlay */}

      {isOpen && (

        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/50 z-40"
        />

      )}

      {/* Sidebar */}

      <div
  className={`
    fixed top-0 left-0 h-screen w-72 bg-zinc-950 border-r border-zinc-800 p-6 z-50 transition-transform duration-300 overflow-y-auto
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

<div className="flex justify-end">

<button
  onClick={closeSidebar}
  className="
    text-white
    text-3xl
    font-bold
    hover:text-red-400
    transition-all
  "
>
  ✕
</button>

</div>

<div className="mt-20 flex flex-col gap-4 pb-24">

          <Link
            to="/dashboard"
            onClick={closeSidebar}
            className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
          >
            📊 Dashboard
          </Link>

          <Link
            to="/inventory"
            onClick={closeSidebar}
            className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
          >
            📦 Inventory
          </Link>

          <Link
            to="/billing"
            onClick={closeSidebar}
            className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
          >
            💵 Billing / POS
          </Link>

          <Link
            to="/sales-history"
            onClick={closeSidebar}
            className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
          >
            📜 Sales History
          </Link>

          <Link
            to="/sales"
            onClick={closeSidebar}
            className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
          >
            📈 Sales Analytics
          </Link>

          <Link
  to="/invoice-upload"
  onClick={closeSidebar}
  className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
>
  📄 Invoice Upload
</Link>

<Link
  to="/invoice-history"
  onClick={closeSidebar}
  className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
>
  📜 Invoice History
</Link>

<Link
  to="/profile"
  onClick={closeSidebar}
  className="bg-zinc-900 hover:bg-zinc-800 transition-all p-4 rounded-xl"
>
  🏪 Shop Profile
</Link>



          

        </div>

        <div className="mt-6">

  <button
    onClick={handleLogout}
    className="
      w-full
      bg-red-500
      hover:bg-red-600
      transition-all
      p-4
      rounded-xl
      font-semibold
    "
  >
    Logout
  </button>

</div>

      </div>

    </>
  );
}