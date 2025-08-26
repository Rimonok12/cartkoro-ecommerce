// pages/account/address.jsx
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { essentialsOnLoad } from "@/lib/ssrHelper";

// ✅ SSR guard
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};

  if (!cookies["CK-REF-T"]) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const essentials = await essentialsOnLoad(context);

  return { props: { ...essentials.props } };
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);

  const [form, setForm] = useState({
    id: null,
    label: "Home",
    full_name: "",
    phone: "",
    address: "",
    district_id: "",
    upazila_id: "",
    postcode: "",
    landmark: "",
    alternate_phone: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // ✅ Fetch saved addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.post("/user/getAddresses", {}, { withCredentials: true });
      setAddresses(res.data.addresses || []);
    } catch (e) {
      console.error("Error fetching addresses", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch districts + upazilas
  const fetchDistricts = async () => {
    try {
      const res = await fetch("/api/general/getDistrictsWithUpazilas");
      const data = await res.json();
      setDistricts(data || []);
    } catch (e) {
      console.error("Error fetching districts", e);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchDistricts();
  }, []);

  // ✅ Handle district change → update available upazilas
  useEffect(() => {
    if (form.district_id) {
      const selected = districts.find((d) => d._id === form.district_id);
      setUpazilas(selected ? selected.upazilas : []);
      setForm((prev) => ({ ...prev, upazila_id: "" })); // reset upazila
    } else {
      setUpazilas([]);
    }
  }, [form.district_id, districts]);

  // ✅ Save (add / update)
  const saveAddress = async () => {
    try {
      setSaving(true);
      setMsg("");
      setErr("");

      if (form.id) {
        await api.put(`/user/editAddress?addressId=${form.id}`, form, { withCredentials: true });
        setMsg("Address updated successfully");
      } else {
        await api.post("/user/addAddress", form, { withCredentials: true });
        setMsg("Address added successfully");
      }

      resetForm();
      fetchAddresses();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete
  const deleteAddress = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/user/deleteAddress?addressId=${id}`, { withCredentials: true });
      fetchAddresses();
    } catch (e) {
      console.error("Error deleting address", e);
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setForm({
      id: null,
      label: "Home",
      full_name: "",
      phone: "",
      address: "",
      district_id: "",
      upazila_id: "",
      postcode: "",
      landmark: "",
      alternate_phone: "",
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Manage Addresses</h1>

      {/* Address Form */}
      <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {form.id ? "Edit Address" : "Add New Address"}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <input
            placeholder="Full Name"
            className="border rounded-lg px-3 py-2"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="border rounded-lg px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Address (House, Road, Area)"
            className="border rounded-lg px-3 py-2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            placeholder="Postcode"
            className="border rounded-lg px-3 py-2"
            value={form.postcode}
            onChange={(e) => setForm({ ...form, postcode: e.target.value })}
          />

          {/* ✅ District dropdown */}
          <select
            className="border rounded-lg px-3 py-2"
            value={form.district_id}
            onChange={(e) => setForm({ ...form, district_id: e.target.value })}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* ✅ Upazila dropdown */}
          <select
            className="border rounded-lg px-3 py-2"
            value={form.upazila_id}
            onChange={(e) => setForm({ ...form, upazila_id: e.target.value })}
            disabled={!upazilas.length}
          >
            <option value="">Select Upazila</option>
            {upazilas.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveAddress}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-white ${
              saving ? "bg-gray-400" : "bg-gray-800 hover:bg-black"
            }`}
          >
            {saving ? "Saving…" : form.id ? "Update Address" : "Add Address"}
          </button>
          {form.id && (
            <button onClick={resetForm} className="px-5 py-2 rounded-lg border">
              Cancel
            </button>
          )}
        </div>

        {(msg || err) && (
          <div className="mt-4">
            {msg && <p className="text-green-600">{msg}</p>}
            {err && <p className="text-red-600">{err}</p>}
          </div>
        )}
      </div>

      {/* Address List */}
      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold mb-4">Saved Addresses</h2>
        {loading ? (
          <p>Loading…</p>
        ) : addresses.length === 0 ? (
          <p className="text-gray-600">No addresses saved.</p>
        ) : (
          <ul className="space-y-4">
            {addresses.map((addr) => (
              <li
                key={addr._id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{addr.full_name}</p>
                  <p className="text-gray-600">{addr.phone}</p>
                  <p className="text-gray-600">{addr.address}</p>
                  <p className="text-gray-600">
                    {addr.district_id?.name}, {addr.upazila_id?.name}
                  </p>
                  <p className="text-gray-600">{addr.postcode}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(addr)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAddress(addr._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
