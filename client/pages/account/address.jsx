// pages/account/address.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';
import { essentialsOnLoad } from '@/lib/ssrHelper';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ✅ SSR guard
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.cookies || {};

  if (!cookies['CK-REF-T']) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const essentials = await essentialsOnLoad(context);
  const addAddressOnLoad = context?.query?.['add-address'] === 'true';

  return { props: { ...essentials.props, addAddressOnLoad } };
}

/** ✅ Confirm modal (lighter, accessible) */
const ConfirmModal = ({
  open,
  title = 'Delete address?',
  description = 'This action cannot be undone.',
  onCancel,
  onConfirm,
  loading,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={!loading ? onCancel : undefined} />
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white/95 ring-1 ring-black/5 shadow-2xl p-6
                      data-[show=true]:animate-in data-[show=true]:fade-in-0 data-[show=true]:zoom-in-95"
           data-show="true">
        <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
        <p id="confirm-desc" className="text-sm text-gray-600 mt-1">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-5 py-2 rounded-xl ring-1 ring-black/10 hover:bg-gray-50 transition disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-5 py-2 rounded-xl text-white shadow-sm transition active:scale-[0.99]
              ${loading ? 'bg-red-500/60 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-md'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AddressPage({ addAddressOnLoad = false }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const emptyForm = useMemo(
    () => ({
      id: null,
      label: 'Home',
      full_name: '',
      phone: '',
      address: '',
      district_id: '',
      upazila_id: '',
      postcode: '',
      landmark: '',
      alternate_phone: '',
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.post('/user/getAddresses', {}, { withCredentials: true });
      setAddresses(res?.data?.addresses || []);
    } catch (e) {
      console.error('Error fetching addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await fetch('/api/general/getDistrictsWithUpazilas');
      const data = await res.json();
      setDistricts(data || []);
    } catch (e) {
      console.error('Error fetching districts', e);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchDistricts();
  }, []);

  // 🔓 Open the "Add Address" form automatically when ?add-address=true
  useEffect(() => {
    if (addAddressOnLoad) {
      openNewAddressForm();
      // Optionally clean the query param:
      // router.replace('/account/address', undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addAddressOnLoad]);

  useEffect(() => {
    if (form.district_id) {
      const selected = districts.find((d) => d._id === form.district_id);
      const nextUpazilas = selected ? selected.upazilas || [] : [];
      setUpazilas(nextUpazilas);
      const hasCurrent = nextUpazilas.some((u) => u._id === form.upazila_id);
      if (!hasCurrent) {
        setForm((prev) => ({ ...prev, upazila_id: '' }));
      }
    } else {
      setUpazilas([]);
      if (form.upazila_id) setForm((prev) => ({ ...prev, upazila_id: '' }));
    }
  }, [form.district_id, districts]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (addr) => {
    const districtId = addr?.district_id?._id || addr?.district_id || '';
    const upazilaId = addr?.upazila_id?._id || addr?.upazila_id || '';

    setForm({
      id: addr._id,
      label: addr.label || 'Home',
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      address: addr.address || '',
      district_id: districtId,
      upazila_id: upazilaId,
      postcode: addr.postcode || '',
      landmark: addr.landmark || '',
      alternate_phone: addr.alternate_phone || '',
    });
    if (districtId) {
      const selected = districts.find((d) => d._id === districtId);
      setUpazilas(selected ? selected.upazilas : []);
    }
    setShowForm(true);
    setMsg('');
    setErr('');
  };

  // ✅ Form validity guard
  const isValid = useMemo(() => {
    const required = [
      form.full_name,
      form.phone,
      form.address,
      form.postcode,
      form.district_id,
      form.upazila_id,
    ];
    const phoneOk = /^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, ''));
    return required.every(v => String(v || '').trim().length > 0) && phoneOk;
  }, [form]);

  const saveAddress = async () => {
    if (!isValid) {
      setErr('Please fill all required fields correctly before saving.');
      return;
    }

    try {
      setSaving(true);
      setMsg('');
      setErr('');

      const payload = {
        label: form.label,
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        district_id: form.district_id,
        upazila_id: form.upazila_id,
        postcode: form.postcode,
        landmark: form.landmark,
        alternate_phone: form.alternate_phone,
      };

      if (form.id) {
        await api.put(`/user/editAddress?addressId=${form.id}`, payload, { withCredentials: true });
        setMsg('Address updated successfully.');
      } else {
        await api.post('/user/addAddress', payload, { withCredentials: true });
        setMsg('Address added successfully.');
      }

      resetForm();
      setShowForm(false);
      fetchAddresses();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (id) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setConfirmLoading(true);
      // ✅ put config in the 3rd arg
      await api.put(`/user/deleteAddress?addressId=${confirmId}`, {}, { withCredentials: true });
      setAddresses((prev) => prev.filter((a) => a._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (e) {
      console.error('Error deleting address', e);
      fetchAddresses();
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  const resetForm = () => setForm(emptyForm);
  const openNewAddressForm = () => {
    resetForm();
    setShowForm(true);
    setMsg('');
    setErr('');
  };

  return (
    <>
      <Navbar />

      <div className="px-4 md:px-10 lg:px-16 py-8 flex items-center justify-between max-w-6xl mx-auto">
        <div>
          <p className="text-2xl md:text-3xl text-gray-700">
            Manage Shipping <span className="font-semibold text-orange-600">Addresses</span>
          </p>
        </div>
        <button
          onClick={openNewAddressForm}
          className="hidden sm:inline-flex rounded-xl bg-orange-600 text-white px-5 py-3 shadow-sm hover:shadow-md hover:bg-orange-700 active:scale-[0.99] transition"
        >
          Add Address
        </button>
      </div>

      <div className="px-4 md:px-10 lg:px-16 pb-10">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={openNewAddressForm}
            className="sm:hidden mb-4 w-full rounded-xl bg-orange-600 text-white px-5 py-3 shadow-sm hover:shadow-md hover:bg-orange-700 active:scale-[0.99] transition"
          >
            Add Address
          </button>

          {showForm && (
            <div className="rounded-2xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg ring-1 ring-black/5">
              <div className="p-6">
                <p className="text-xl md:text-2xl text-gray-700">
                  {form.id ? 'Edit' : 'Add'} Shipping <span className="font-semibold text-orange-600">Address</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  <input
                    required
                    aria-invalid={!form.full_name ? 'true' : 'false'}
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    type="text"
                    placeholder="Full name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                  <input
                    required
                    aria-invalid={!/^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, '')) ? 'true' : 'false'}
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    type="text"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <textarea
                    required
                    aria-invalid={!form.address ? 'true' : 'false'}
                    className="md:col-span-2 px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition resize-none"
                    rows={4}
                    placeholder="Address (Area and Street)"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <input
                    required
                    aria-invalid={!form.postcode ? 'true' : 'false'}
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    type="text"
                    placeholder="Postcode"
                    value={form.postcode}
                    onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  />
                  <select
                    required
                    aria-invalid={!form.label ? 'true' : 'false'}
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                  <select
                    required
                    aria-invalid={!form.district_id ? 'true' : 'false'}
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    value={form.district_id}
                    onChange={(e) => setForm({ ...form, district_id: e.target.value })}
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                  <select
                    required
                    aria-invalid={!form.upazila_id ? 'true' : 'false'}
                    className={`px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition ${!form.district_id ? 'bg-gray-50 text-gray-500' : ''}`}
                    value={form.upazila_id}
                    onChange={(e) => setForm({ ...form, upazila_id: e.target.value })}
                    disabled={!form.district_id}
                  >
                    <option value="">Select Upazila</option>
                    {upazilas.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  <input
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    type="text"
                    placeholder="Landmark (optional)"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  />
                  <input
                    className="px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                    type="text"
                    placeholder="Alternate phone (optional)"
                    value={form.alternate_phone}
                    onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })}
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveAddress}
                    disabled={saving || !isValid}
                    className={`sm:flex-1 rounded-xl px-5 py-3 text-white shadow-sm transition active:scale-[0.99]
                      ${saving || !isValid ? 'bg-orange-600/60 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-md'}`}
                  >
                    {saving ? 'Saving…' : form.id ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="sm:flex-1 px-5 py-3 rounded-xl ring-1 ring-black/10 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>

                {(msg || err) && (
                  <div className="mt-5">
                    {err ? (
                      <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200/70">
                        {err}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-green-50 text-green-700 text-sm px-3 py-2 ring-1 ring-green-200/70">
                        {msg}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="h-3 rounded-b-2xl bg-gradient-to-b from-transparent to-gray-50/60" />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-10 lg:px-16 pb-20">
        <div className="max-w-3xl mx-auto rounded-2xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-lg ring-1 ring-black/5">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Saved Addresses</h2>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 rounded-xl bg-gray-200" />
                <div className="h-16 rounded-xl bg-gray-200" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl ring-1 ring-black/5 p-6 bg-gray-50/50 text-gray-600">
                No addresses saved.
              </div>
            ) : (
              <ul className="space-y-3">
                {addresses.map((addr) => (
                  <li
                    key={addr._id}
                    className="rounded-xl p-4 ring-1 ring-black/5 bg-white/70 flex justify-between items-start gap-4"
                  >
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{addr.full_name}</p>
                      <p className="text-gray-600">{addr.phone}</p>
                      <p className="text-gray-600">{addr.address}</p>
                      <p className="text-gray-600">
                        {addr.district_id?.name}{addr.upazila_id?.name ? `, ${addr.upazila_id?.name}` : ''}
                      </p>
                      {addr.postcode && <p className="text-gray-600">{addr.postcode}</p>}
                      {addr.landmark && <p className="text-gray-600">Landmark: {addr.landmark}</p>}
                      {addr.alternate_phone && <p className="text-gray-600">Alt: {addr.alternate_phone}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(addr)}
                        className="px-3 py-1.5 rounded-lg ring-1 ring-black/10 hover:bg-gray-50 transition text-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(addr._id)}
                        className="px-3 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm hover:shadow-md transition active:scale-[0.99]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="h-3 rounded-b-2xl bg-gradient-to-b from-transparent to-gray-50/60" />
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete address?"
        description="This action cannot be undone."
        onCancel={() => { if (!confirmLoading) { setConfirmOpen(false); setConfirmId(null); } }}
        onConfirm={confirmDelete}
        loading={confirmLoading}
      />

      <Footer />
    </>
  );
}
