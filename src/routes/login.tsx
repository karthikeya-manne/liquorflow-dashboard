import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  collection,
  addDoc,
} from "firebase/firestore";

import {
  getFirebaseAuth,
  getFirestoreDb,
} from "../lib/firebase";

  import { defaultProducts } from "../data/defaultProducts";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {

  const [isSignup, setIsSignup] =
    useState(false);

  const [shopName, setShopName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleAuth() {

    if (
      !email ||
      !password ||
      (isSignup && !shopName)
    ) {

      setError("Please fill all fields");

      return;
    }

    setLoading(true);

    setError("");

    try {

      if (isSignup) {

        const userCredential =
          await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            email,
            password
          );

        const uid =
          userCredential.user.uid;

        await setDoc(
          doc(getFirestoreDb(), "shops", uid),
          {
            shopName: shopName,
            ownerEmail: email,
            createdAt: new Date(),
          }
        );

        for (const product of defaultProducts) {

          await addDoc(
            collection(
              getFirestoreDb(),
              "shops",
              uid,
              "products"
            ),
            product
          );

        }

      } else {

        await signInWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password
        );

      }

      window.location.href =
        "/dashboard";

    } catch (err: any) {

      console.error(err);

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

      <div className="flex justify-center mb-6">

<img
  src="/logo-full.png"
  alt="LiquorFlow"
  className="w-[380px] max-w-full object-contain"
/>

</div>

<p className="text-zinc-400 text-center mb-8">

Inventory & Billing Solution

</p>

        <div className="space-y-4">

          {isSignup && (

            <input
              type="text"
              placeholder="Shop Name"
              value={shopName}
              onChange={(e) =>
                setShopName(e.target.value)
              }
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            />

          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          {error && (

            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg text-sm">

              {error}

            </div>

          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all p-3 rounded-lg font-semibold text-white"
          >

            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Shop Account"
              : "Login"}

          </button>

        </div>

        <button
          onClick={() =>
            setIsSignup(!isSignup)
          }
          className="mt-6 text-orange-400 hover:text-orange-300 transition-all"
        >

          {isSignup
            ? "Already have an account? Login"
            : "Create New Shop Account"}

        </button>

      </div>

    </div>
  );
}