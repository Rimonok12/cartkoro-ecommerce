// // pages/account/address.jsx
// 'use client';
// import { useEffect, useMemo, useState } from 'react';
// import api from '@/lib/axios';
// import { essentialsOnLoad } from '@/lib/ssrHelper';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';

// // ✅ SSR guard
// export async function getServerSideProps(context) {
//   const { req } = context;
//   const cookies = req.cookies || {};

//   if (!cookies['CK-REF-T']) {
//     return { redirect: { destination: '/login', permanent: false } };
//   }

//   const essentials = await essentialsOnLoad(context);
//   return { props: { ...essentials.props } };
// }

// const ConfirmModal = ({ open, title = 'Delete address?', description = 'This action cannot be undone.', onCancel, onConfirm, loading }) => {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/30" />
//       <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
//         <h2 className="text-lg font-semibold">{title}</h2>
//         <p className="text-sm text-gray-600 mt-1">{description}</p>
//         <div className="mt-6 flex justify-end gap-2">
//           <button
//             className="px-5 py-2 rounded-lg border"
//             onClick={onCancel}
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             className={`px-5 py-2 rounded-lg text-white ${loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
//             onClick={onConfirm}
//             disabled={loading}
//           >
//             {loading ? 'Deleting…' : 'Delete'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function AddressPage() {
//   const [addresses, setAddresses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [districts, setDistricts] = useState([]);
//   const [upazilas, setUpazilas] = useState([]);

//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [confirmId, setConfirmId] = useState(null);
//   const [confirmLoading, setConfirmLoading] = useState(false);

//   const emptyForm = useMemo(
//     () => ({
//       id: null,
//       label: 'Home',
//       full_name: '',
//       phone: '',
//       address: '',
//       district_id: '',
//       upazila_id: '',
//       postcode: '',
//       landmark: '',
//       alternate_phone: '',
//     }),
//     []
//   );

//   const [form, setForm] = useState(emptyForm);
//   const [msg, setMsg] = useState('');
//   const [err, setErr] = useState('');
//   const [showForm, setShowForm] = useState(false);

//   const fetchAddresses = async () => {
//     try {
//       setLoading(true);
//       const res = await api.post('/user/getAddresses', {}, { withCredentials: true });
//       setAddresses(res?.data?.addresses || []);
//     } catch (e) {
//       console.error('Error fetching addresses', e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDistricts = async () => {
//     try {
//       const res = await fetch('/api/general/getDistrictsWithUpazilas');
//       const data = await res.json();
//       setDistricts(data || []);
//     } catch (e) {
//       console.error('Error fetching districts', e);
//     }
//   };

//   useEffect(() => {
//     fetchAddresses();
//     fetchDistricts();
//   }, []);

//   useEffect(() => {
//     if (form.district_id) {
//       const selected = districts.find((d) => d._id === form.district_id);
//       const nextUpazilas = selected ? selected.upazilas || [] : [];
//       setUpazilas(nextUpazilas);
//       const hasCurrent = nextUpazilas.some((u) => u._id === form.upazila_id);
//       if (!hasCurrent) {
//         setForm((prev) => ({ ...prev, upazila_id: '' }));
//       }
//     } else {
//       setUpazilas([]);
//       if (form.upazila_id) setForm((prev) => ({ ...prev, upazila_id: '' }));
//     }
//   }, [form.district_id, districts]); // eslint-disable-line react-hooks/exhaustive-deps

//   const startEdit = (addr) => {
//     const districtId = addr?.district_id?._id || addr?.district_id || '';
//     const upazilaId = addr?.upazila_id?._id || addr?.upazila_id || '';

//     setForm({
//       id: addr._id,
//       label: addr.label || 'Home',
//       full_name: addr.full_name || '',
//       phone: addr.phone || '',
//       address: addr.address || '',
//       district_id: districtId,
//       upazila_id: upazilaId,
//       postcode: addr.postcode || '',
//       landmark: addr.landmark || '',
//       alternate_phone: addr.alternate_phone || '',
//     });
//     if (districtId) {
//       const selected = districts.find((d) => d._id === districtId);
//       setUpazilas(selected ? selected.upazilas : []);
//     }
//     setShowForm(true);
//     setMsg('');
//     setErr('');
//   };

//   // ✅ Form validity guard
//   const isValid = useMemo(() => {
//     const required = [
//       form.full_name,
//       form.phone,
//       form.address,
//       form.postcode,
//       form.district_id,
//       form.upazila_id,
//     ];
//     // Optional: simple phone sanity (10–15 digits, allows leading + and spaces)
//     const phoneOk = /^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, ''));
//     return required.every(v => String(v || '').trim().length > 0) && phoneOk;
//   }, [form]);

//   const saveAddress = async () => {
//     // 🚫 prevent submit if invalid
//     if (!isValid) {
//       setErr('Please fill all required fields correctly before saving.');
//       return;
//     }

//     try {
//       setSaving(true);
//       setMsg('');
//       setErr('');

//       const payload = {
//         label: form.label,
//         full_name: form.full_name,
//         phone: form.phone,
//         address: form.address,
//         district_id: form.district_id,
//         upazila_id: form.upazila_id,
//         postcode: form.postcode,
//         landmark: form.landmark,
//         alternate_phone: form.alternate_phone,
//       };

//       if (form.id) {
//         await api.put(`/user/editAddress?addressId=${form.id}`, payload, { withCredentials: true });
//         setMsg('Address updated successfully');
//       } else {
//         await api.post('/user/addAddress', payload, { withCredentials: true });
//         setMsg('Address added successfully');
//       }

//       resetForm();
//       setShowForm(false);
//       fetchAddresses();
//     } catch (e) {
//       setErr(e?.response?.data?.error || 'Failed to save address');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const openDeleteConfirm = (id) => {
//     setConfirmId(id);
//     setConfirmOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!confirmId) return;
//     try {
//       setConfirmLoading(true);
//       await api.put(`/user/deleteAddress?addressId=${confirmId}`, { withCredentials: true });
//       setAddresses((prev) => prev.filter((a) => a._id !== confirmId));
//       setConfirmOpen(false);
//       setConfirmId(null);
//     } catch (e) {
//       console.error('Error deleting address', e);
//       fetchAddresses();
//       setConfirmOpen(false);
//     } finally {
//       setConfirmLoading(false);
//     }
//   };

//   const resetForm = () => setForm(emptyForm);
//   const openNewAddressForm = () => {
//     resetForm();
//     setShowForm(true);
//     setMsg('');
//     setErr('');
//   };

//   return (
//     <>
//       <Navbar />

//       <div className="px-4 md:px-10 lg:px-16 py-8 flex items-center justify-between max-w-6xl mx-auto">
//         <div>
//           <p className="text-2xl md:text-3xl text-gray-600">
//             Manage Shipping <span className="font-semibold text-orange-600">Addresses</span>
//           </p>
//         </div>
//         <button
//           onClick={openNewAddressForm}
//           className="hidden sm:inline-flex bg-orange-600 text-white px-5 py-3 rounded hover:bg-orange-700"
//         >
//           {form.id ? 'Edit Address' : 'Add Address'}
//         </button>
//       </div>

//       <div className="px-4 md:px-10 lg:px-16 pb-10">
//         <div className="max-w-3xl mx-auto">
//           <button
//             onClick={openNewAddressForm}
//             className="sm:hidden mb-4 w-full bg-orange-600 text-white px-5 py-3 rounded hover:bg-orange-700"
//           >
//             {form.id ? 'Edit Address' : 'Add Address'}
//           </button>

//           {showForm && (
//             <div className="bg-white rounded-2xl shadow-sm border p-6">
//               <p className="text-xl md:text-2xl text-gray-600">
//                 {form.id ? 'Edit' : 'Add'} Shipping <span className="font-semibold text-orange-600">Address</span>
//               </p>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
//                 <input
//                   required
//                   aria-invalid={!form.full_name ? 'true' : 'false'}
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   type="text"
//                   placeholder="Full name"
//                   value={form.full_name}
//                   onChange={(e) => setForm({ ...form, full_name: e.target.value })}
//                 />
//                 <input
//                   required
//                   aria-invalid={!/^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, '')) ? 'true' : 'false'}
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   type="text"
//                   placeholder="Phone number"
//                   value={form.phone}
//                   onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                 />
//                 <textarea
//                   required
//                   aria-invalid={!form.address ? 'true' : 'false'}
//                   className="md:col-span-2 px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800 resize-none"
//                   rows={4}
//                   placeholder="Address (Area and Street)"
//                   value={form.address}
//                   onChange={(e) => setForm({ ...form, address: e.target.value })}
//                 />
//                 <input
//                   required
//                   aria-invalid={!form.postcode ? 'true' : 'false'}
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   type="text"
//                   placeholder="Postcode"
//                   value={form.postcode}
//                   onChange={(e) => setForm({ ...form, postcode: e.target.value })}
//                 />
//                 <select
//                   required
//                   aria-invalid={!form.label ? 'true' : 'false'}
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   value={form.label}
//                   onChange={(e) => setForm({ ...form, label: e.target.value })}
//                 >
//                   <option>Home</option>
//                   <option>Office</option>
//                   <option>Other</option>
//                 </select>
//                 <select
//                   required
//                   aria-invalid={!form.district_id ? 'true' : 'false'}
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   value={form.district_id}
//                   onChange={(e) => setForm({ ...form, district_id: e.target.value })}
//                 >
//                   <option value="">Select District</option>
//                   {districts.map((d) => (
//                     <option key={d._id} value={d._id}>{d.name}</option>
//                   ))}
//                 </select>
//                 <select
//                   required
//                   aria-invalid={!form.upazila_id ? 'true' : 'false'}
//                   className={`px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800 ${!form.district_id ? 'bg-gray-100 text-gray-500' : ''}`}
//                   value={form.upazila_id}
//                   onChange={(e) => setForm({ ...form, upazila_id: e.target.value })}
//                   disabled={!form.district_id} // ✅ disabled until district selected
//                 >
//                   <option value="">Select Upazila</option>
//                   {upazilas.map((u) => (
//                     <option key={u._id} value={u._id}>{u.name}</option>
//                   ))}
//                 </select>
//                 <input
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   type="text"
//                   placeholder="Landmark (optional)"
//                   value={form.landmark}
//                   onChange={(e) => setForm({ ...form, landmark: e.target.value })}
//                 />
//                 <input
//                   className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
//                   type="text"
//                   placeholder="Alternate phone (optional)"
//                   value={form.alternate_phone}
//                   onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })}
//                 />
//               </div>

//               <div className="mt-6 flex flex-col sm:flex-row gap-3">
//                 <button
//                   onClick={saveAddress}
//                   disabled={saving || !isValid}
//                   className={`sm:flex-1 bg-orange-600 text-white py-3 uppercase rounded ${
//                     (saving || !isValid) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-700'
//                   }`}
//                 >
//                   {saving ? 'Saving…' : form.id ? 'Update Address' : 'Save Address'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => { resetForm(); setShowForm(false); }}
//                   className="sm:flex-1 py-3 border rounded"
//                 >
//                   Cancel
//                 </button>
//               </div>

//               {(msg || err) && (
//                 <div className="mt-4">
//                   {msg && <p className="text-green-600">{msg}</p>}
//                   {err && <p className="text-red-600">{err}</p>}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="px-4 md:px-10 lg:px-16 pb-20">
//         <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-6">
//           <h2 className="text-lg font-semibold mb-4">Saved Addresses</h2>
//           {loading ? (
//             <p>Loading…</p>
//           ) : addresses.length === 0 ? (
//             <p className="text-gray-600">No addresses saved.</p>
//           ) : (
//             <ul className="space-y-4">
//               {addresses.map((addr) => (
//                 <li key={addr._id} className="border rounded-lg p-4 flex justify-between items-start gap-4">
//                   <div>
//                     <p className="font-medium">{addr.full_name}</p>
//                     <p className="text-gray-600">{addr.phone}</p>
//                     <p className="text-gray-600">{addr.address}</p>
//                     <p className="text-gray-600">
//                       {addr.district_id?.name}{addr.upazila_id?.name ? `, ${addr.upazila_id?.name}` : ''}
//                     </p>
//                     {addr.postcode && <p className="text-gray-600">{addr.postcode}</p>}
//                     {addr.landmark && <p className="text-gray-600">Landmark: {addr.landmark}</p>}
//                     {addr.alternate_phone && <p className="text-gray-600">Alt: {addr.alternate_phone}</p>}
//                   </div>
//                   <div className="flex gap-2">
//                     <button onClick={() => startEdit(addr)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
//                     <button onClick={() => openDeleteConfirm(addr._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </div>

//       <ConfirmModal
//         open={confirmOpen}
//         title="Delete address?"
//         description="This action cannot be undone."
//         onCancel={() => { if (!confirmLoading) { setConfirmOpen(false); setConfirmId(null); } }}
//         onConfirm={confirmDelete}
//         loading={confirmLoading}
//       />

//       <Footer />
//     </>
//   );
// }



/////////


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

const ConfirmModal = ({ open, title = 'Delete address?', description = 'This action cannot be undone.', onCancel, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-5 py-2 rounded-lg border"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-5 py-2 rounded-lg text-white ${loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
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
      // Optional: clean the query param so it doesn't auto-open on refresh/back
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
    // Optional: simple phone sanity (10–15 digits, allows leading + and spaces)
    const phoneOk = /^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, ''));
    return required.every(v => String(v || '').trim().length > 0) && phoneOk;
  }, [form]);

  const saveAddress = async () => {
    // 🚫 prevent submit if invalid
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
        setMsg('Address updated successfully');
      } else {
        await api.post('/user/addAddress', payload, { withCredentials: true });
        setMsg('Address added successfully');
      }

      resetForm();
      setShowForm(false);
      fetchAddresses();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to save address');
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
      await api.put(`/user/deleteAddress?addressId=${confirmId}`, { withCredentials: true });
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
          <p className="text-2xl md:text-3xl text-gray-600">
            Manage Shipping <span className="font-semibold text-orange-600">Addresses</span>
          </p>
        </div>
        <button
          onClick={openNewAddressForm}
          className="hidden sm:inline-flex bg-orange-600 text-white px-5 py-3 rounded hover:bg-orange-700"
        >
          {form.id ? 'Edit Address' : 'Add Address'}
        </button>
      </div>

      <div className="px-4 md:px-10 lg:px-16 pb-10">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={openNewAddressForm}
            className="sm:hidden mb-4 w-full bg-orange-600 text-white px-5 py-3 rounded hover:bg-orange-700"
          >
            {form.id ? 'Edit Address' : 'Add Address'}
          </button>

          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <p className="text-xl md:text-2xl text-gray-600">
                {form.id ? 'Edit' : 'Add'} Shipping <span className="font-semibold text-orange-600">Address</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                <input
                  required
                  aria-invalid={!form.full_name ? 'true' : 'false'}
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                <input
                  required
                  aria-invalid={!/^\+?\d{10,15}$/.test((form.phone || '').replace(/\s+/g, '')) ? 'true' : 'false'}
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
                  type="text"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <textarea
                  required
                  aria-invalid={!form.address ? 'true' : 'false'}
                  className="md:col-span-2 px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800 resize-none"
                  rows={4}
                  placeholder="Address (Area and Street)"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <input
                  required
                  aria-invalid={!form.postcode ? 'true' : 'false'}
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
                  type="text"
                  placeholder="Postcode"
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                />
                <select
                  required
                  aria-invalid={!form.label ? 'true' : 'false'}
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
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
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
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
                  className={`px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800 ${!form.district_id ? 'bg-gray-100 text-gray-500' : ''}`}
                  value={form.upazila_id}
                  onChange={(e) => setForm({ ...form, upazila_id: e.target.value })}
                  disabled={!form.district_id} // ✅ disabled until district selected
                >
                  <option value="">Select Upazila</option>
                  {upazilas.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <input
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
                  type="text"
                  placeholder="Landmark (optional)"
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                />
                <input
                  className="px-2 py-2.5 border border-gray-300 rounded outline-none w-full text-gray-800"
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
                  className={`sm:flex-1 bg-orange-600 text-white py-3 uppercase rounded ${
                    (saving || !isValid) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-700'
                  }`}
                >
                  {saving ? 'Saving…' : form.id ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="sm:flex-1 py-3 border rounded"
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
          )}
        </div>
      </div>

      <div className="px-4 md:px-10 lg:px-16 pb-20">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Saved Addresses</h2>
          {loading ? (
            <p>Loading…</p>
          ) : addresses.length === 0 ? (
            <p className="text-gray-600">No addresses saved.</p>
          ) : (
            <ul className="space-y-4">
              {addresses.map((addr) => (
                <li key={addr._id} className="border rounded-lg p-4 flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">{addr.full_name}</p>
                    <p className="text-gray-600">{addr.phone}</p>
                    <p className="text-gray-600">{addr.address}</p>
                    <p className="text-gray-600">
                      {addr.district_id?.name}{addr.upazila_id?.name ? `, ${addr.upazila_id?.name}` : ''}
                    </p>
                    {addr.postcode && <p className="text-gray-600">{addr.postcode}</p>}
                    {addr.landmark && <p className="text-gray-600">Landmark: {addr.landmark}</p>}
                    {addr.alternate_phone && <p className="text-gray-600">Alt: {addr.alternate_phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(addr)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => openDeleteConfirm(addr._id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
