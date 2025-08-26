import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/axios";
import { useAppContext } from "@/context/AppContext";
import { essentialsOnLoad } from "@/lib/ssrHelper";

// SSR guard
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};

  if (!cookies["CK-REF-T"]) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const essentials = await essentialsOnLoad(context);

  return {
    props: { ...essentials.props },
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { userData, setUserData } = useAppContext();

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(userData?.full_name || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const saveProfile = async () => {
    try {
      setSaving(true);
      setErr("");
      setMsg("");
      await api.put(
        "/profile/update",
        { full_name: fullName },
        { withCredentials: true }
      );
      setMsg("Profile updated");
      setUserData({ ...userData, full_name: fullName });
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Profile Information</h1>

      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold mb-4">Your details</h2>

        <div className="grid grid-cols-1 gap-4">
          <label className="block">
            <span className="text-sm text-gray-600">Full name</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Phone (verified)</span>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-50"
              value={phone}
              disabled
            />
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-white ${
              saving ? "bg-gray-400" : "bg-gray-800 hover:bg-black"
            }`}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2 rounded-lg border"
          >
            Cancel
          </button>
        </div>

        {(msg || err) && (
          <div className="mt-4">
            {msg && <p className="text-green-600">{msg}</p>}
            {err && <p className="text-red-600">{err}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
