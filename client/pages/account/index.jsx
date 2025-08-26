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
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const essentials = await essentialsOnLoad(context);

  return {
    props: {
      ...essentials.props,
    },
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { login } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Load profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/profile/details", {
          withCredentials: true,
        });
        setFullName(data?.full_name || "");
        setEmail(data?.email || "");
        setPhone(data?.phone || "");
      } catch (e) {
        setErr("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      await api.put(
        "/profile/update",
        { full_name: fullName, email },
        { withCredentials: true }
      );

      setMsg("Profile updated successfully");
      if (fullName) login(fullName.split(" ")[0]);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      setErr("Please fill current and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("New password and confirmation do not match");
      return;
    }

    try {
      setPwSaving(true);
      setErr("");
      setMsg("");

      await api.post(
        "/profile/change-password",
        { currentPassword, newPassword },
        { withCredentials: true }
      );

      setMsg("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Profile settings</h1>

      {loading ? (
        <div className="animate-pulse h-32 rounded-xl bg-gray-100" />
      ) : (
        <>
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
            <h2 className="text-lg font-semibold mb-4">Your details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Full name</span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Email</span>
                <input
                  type="email"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">Phone</span>
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
          </div>

          {/* Password card */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-4">Change password</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-600">Current password</span>
                <input
                  type="password"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">New password</span>
                <input
                  type="password"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-gray-600">
                  Confirm new password
                </span>
                <input
                  type="password"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4">
              <button
                onClick={changePassword}
                disabled={pwSaving}
                className={`px-5 py-2 rounded-lg text-white ${
                  pwSaving ? "bg-gray-400" : "bg-gray-800 hover:bg-black"
                }`}
              >
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>

          {(msg || err) && (
            <div className="mt-4">
              {msg && <p className="text-green-600">{msg}</p>}
              {err && <p className="text-red-600">{err}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}


// import { useEffect } from "react";
// import { useRouter } from "next/router";

// export default function SettingIndex() {
//   const router = useRouter();

//   useEffect(() => {
//     router.replace("/account/profile");
//   }, [router]);

//   return null;
// }
