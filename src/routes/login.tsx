import { createFileRoute } from "@tanstack/react-router";

import { useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { getFirebaseAuth } from "../lib/firebase";
import { firebaseAuthErrorMessage } from "@/lib/firebase-auth-errors";
import { createShop as createShopApi } from "@/lib/api/liquorflow";
import { syncProducts } from "../lib/syncProducts";

import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import PageLoader from "../components/PageLoader";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("Wines");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (isLoading || !user) return;
    const shopId = localStorage.getItem("selectedShopId");
    void navigate({ to: shopId ? "/dashboard" : "/select-shop", replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading || user) {
    return <PageLoader />;
  }

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

        await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            email,
            password
          );

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

      } else {

        await signInWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password
        );


      }

      window.location.href =
"/select-shop";

    } catch (err: unknown) {
      console.error(err);
      setError(firebaseAuthErrorMessage(err));
    } finally {

      setLoading(false);

    }
  }

  async function handlePasswordReset() {
    setResetMessage("");
    setError("");

    if (!email.trim()) {
      setError("Enter your email to reset your password");
      return;
    }

    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setResetMessage("Password reset email sent. Check your inbox.");
    } catch (err: unknown) {
      setError(firebaseAuthErrorMessage(err));
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
  <>
            <input
              type="text"
              placeholder="Shop Name"
              value={shopName}
      onChange={(e) => setShopName(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            />

    <select
      value={shopCategory}
      onChange={(e) => setShopCategory(e.target.value)}
      className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
    >
      <option value="Wines">Wines</option>
      <option value="Walk-in">Walk-in</option>
    </select>
  </>
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

          {resetMessage && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded-lg text-sm">
              {resetMessage}
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
              ? "Create Account"
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
            : "Create Account"}

        </button>

        {!isSignup && (
          <button
            type="button"
            onClick={handlePasswordReset}
            className="mt-4 w-full text-zinc-400 hover:text-orange-300 text-sm transition-all"
          >
            Forgot password?
          </button>
        )}

      </div>

    </div>
  );
}