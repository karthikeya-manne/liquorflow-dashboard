import { createFileRoute } from "@tanstack/react-router";

import { useState, useEffect } from "react";

import {
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { getFirestoreDb, getFirebaseAuth } from "../lib/firebase";

import Sidebar from "../components/sidebar";

import toast from "react-hot-toast";

import PageLoader
from "../components/PageLoader";

export const Route = createFileRoute("/profile")({
component: ProfilePage,
});

function ProfilePage() {

const [shopData, setShopData] = useState<any>(null);

const [shopId,
  setShopId] =
  useState<string | null>(
    null
  );

const [isEditing,
  setIsEditing] =
  useState(false);

const [shopName,
  setShopName] =
  useState("");

const [email,
  setEmail] =
  useState("");

  const [showPasswordModal,
    setShowPasswordModal] =
    useState(false);
  
  const [currentPassword,
    setCurrentPassword] =
    useState("");
  
  const [newPassword,
    setNewPassword] =
    useState("");
  
  const [confirmPassword,
    setConfirmPassword] =
    useState("");

    const [emailPassword,
      setEmailPassword] =
      useState("");

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

  if (!shopData)
    return;

  setShopName(
    shopData.shopName || ""
  );

  setEmail(
    shopData.ownerEmail || ""
  );

}, [shopData]);

useEffect(() => {

  async function loadData() {

    await fetchShopData();

    setLoading(false);

  }

  if (shopId) {

    loadData();

  }

}, [shopId]);

async function fetchShopData() {


if (!shopId) return;

try {

  const docRef = doc(
    getFirestoreDb(),
    "shops",
    shopId
  );

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {

    setShopData(docSnap.data());

  }

} catch (error) {

  console.error(error);

}


}

async function saveProfile() {

  if (!shopId)
    return;

  try {

    const user =
  getFirebaseAuth()
    .currentUser;

if (!user)
  return;

if (
  email !== user.email
) {

  const credential =
    EmailAuthProvider.credential(
      user.email!,
      emailPassword
    );

  await reauthenticateWithCredential(
    user,
    credential
  );

  await verifyBeforeUpdateEmail(
    user,
    email
  );

  toast.success(
    "Verification email sent. Please verify the new email and then log in again."
  );
  return;

}

if (
  email === user.email
) {

  await updateDoc(
    doc(
      getFirestoreDb(),
      "shops",
      shopId
    ),
    {
      shopName,
      ownerEmail: email,
    }
  );

}

    setShopData({

      ...shopData,

      shopName,

      ownerEmail: email,

    });

    setIsEditing(false);

    toast.success(
      "Profile Updated Successfully"
    );

  } catch (error: any) {

    console.error(
      "PROFILE ERROR:",
      error
    );
  
    toast.error(
      error.message
    );
  
  }

}

async function changePasswordHandler() {

  const user =
    getFirebaseAuth()
      .currentUser;

  if (!user)
    return;

  if (
    newPassword !==
    confirmPassword
  ) {

    toast.error(
      "Passwords do not match"
    );

    return;

  }

  try {

    const credential =
      EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );

    await reauthenticateWithCredential(
      user,
      credential
    );

    await updatePassword(
      user,
      newPassword
    );

    toast.success(
      "Password Updated Successfully"
    );

    setShowPasswordModal(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

  } catch (error) {

    console.error(error);

    toast.error(
      "Current Password Incorrect"
    );

  }

}

if (loading) {

  return <PageLoader />;

}

return (

  <div className="min-h-screen bg-black text-white flex">

    <Sidebar />

    <div className="flex-1 p-6 pt-24">

      <div className="
        flex
        justify-between
        items-center
        mb-6
      ">

        <h1 className="
          text-4xl
          font-bold
        ">
          Shop Profile 🏪
        </h1>

        <button
          onClick={() =>
            setIsEditing(true)
          }
          className="
            bg-orange-500
            hover:bg-orange-600
            px-5
            py-3
            rounded-xl
            font-semibold
          "
        >
          Edit Profile
        </button>

      </div>

      <div className="
        bg-zinc-900
        p-8
        rounded-2xl
        border
        border-zinc-800
        max-w-2xl
      ">

        <div className="space-y-8">

          <div>

            <h2 className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Shop Name
            </h2>

            <p className="
              text-2xl
              font-bold
            ">
              {shopData?.shopName}
            </p>

          </div>

          <div>

            <h2 className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Owner Email
            </h2>

            <p className="
              text-xl
            ">
              {shopData?.ownerEmail}
            </p>

          </div>

          <div>

            <h2 className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Password
            </h2>

            <p className="
              text-xl
            ">
              ************
            </p>

          </div>

          <div>

            <h2 className="
              text-zinc-400
              text-sm
              mb-2
            ">
              Shop ID
            </h2>

            <p className="
              text-orange-400
              break-all
            ">
              {shopId}
            </p>

          </div>

        </div>

      </div>

      {isEditing && (

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
          w-[500px]
          border
          border-zinc-800
        ">

          <h2 className="
            text-3xl
            font-bold
            mb-6
          ">
            Edit Profile
          </h2>

          <div className="
            space-y-4
          ">

            <input
              type="text"
              value={shopName}
              onChange={(e) =>
                setShopName(
                  e.target.value
                )
              }
              placeholder="Shop Name"
              className="
                w-full
                p-4
                rounded-xl
                bg-zinc-800
                border
                border-zinc-700
              "
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="Email"
              className="
                w-full
                p-4
                rounded-xl
                bg-zinc-800
                border
                border-zinc-700
              "
            />
            <input
  type="password"
  placeholder="Current Password"
  value={emailPassword}
  onChange={(e) =>
    setEmailPassword(
      e.target.value
    )
  }
  className="
    w-full
    p-4
    rounded-xl
    bg-zinc-800
    border
    border-zinc-700
  "
/>

<button
  onClick={() =>
    setShowPasswordModal(true)
  }
  className="
    w-full
    bg-blue-500
    hover:bg-blue-600
    py-3
    rounded-xl
    font-semibold
  "
>
  Change Password
</button>

          </div>

          <div className="
            flex
            gap-3
            mt-6
          ">

<button
  onClick={saveProfile}
  className="
    flex-1
    bg-green-500
    hover:bg-green-600
    py-3
    rounded-xl
    font-semibold
  "
>
  Save Changes
</button>

            <button
              onClick={() =>
                setIsEditing(false)
              }
              className="
                flex-1
                bg-red-500
                hover:bg-red-600
                py-3
                rounded-xl
                font-semibold
              "
            >
              Cancel
            </button>

          </div>

        </div>

      </div>

      )}
      {showPasswordModal && (

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
    w-[500px]
    border
    border-zinc-800
  ">

    <h2 className="
      text-3xl
      font-bold
      mb-6
    ">
      Change Password 🔒
    </h2>

    <div className="
      space-y-4
    ">

      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) =>
          setCurrentPassword(
            e.target.value
          )
        }
        className="
          w-full
          p-4
          rounded-xl
          bg-zinc-800
        "
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(
            e.target.value
          )
        }
        className="
          w-full
          p-4
          rounded-xl
          bg-zinc-800
        "
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(
            e.target.value
          )
        }
        className="
          w-full
          p-4
          rounded-xl
          bg-zinc-800
        "
      />

    </div>

    <div className="
      flex
      gap-3
      mt-6
    ">

      <button
        onClick={
          changePasswordHandler
        }
        className="
          flex-1
          bg-green-500
          hover:bg-green-600
          py-3
          rounded-xl
        "
      >
        Update Password
      </button>

      <button
        onClick={() =>
          setShowPasswordModal(false)
        }
        className="
          flex-1
          bg-red-500
          hover:bg-red-600
          py-3
          rounded-xl
        "
      >
        Cancel
      </button>

    </div>

  </div>

</div>

)}

    </div>

  </div>

);
}
