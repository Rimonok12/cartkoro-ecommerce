// pages/account/profile.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
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
  return { props: { ...essentials.props } };
}

/** ✅ Success modal (lighter, animated, accessible) */
const SuccessModal = ({ open, title = 'Saved!', description = 'Your profile was updated successfully.', onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      aria-describedby="success-desc"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/5 p-6
                      data-[show=true]:animate-in data-[show=true]:fade-in-0 data-[show=true]:zoom-in-95"
           data-show="true">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-green-50 ring-1 ring-green-200/60 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 id="success-title" className="text-lg font-semibold">{title}</h2>
            <p id="success-desc" className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="px-5 py-2 rounded-xl bg-orange-600 text-white shadow-sm hover:shadow-md hover:bg-orange-700 active:scale-[0.99] transition"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setMsg('');
      setErr('');
      const res = await api.post('/user/getProfileData', {}, { withCredentials: true });
      const p = res?.data || {};
      const next = {
        full_name: p.full_name || '',
        phone: p.phone || '',
        email: p.email || '',
      };
      setProfile(next);
      setForm(next);
    } catch (e) {
      console.error('Error fetching profile', e);
      setErr(e?.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ Simple validity guard (phone is read-only)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = useMemo(() => {
    const nameOk = String(form.full_name || '').trim().length > 0;
    const emailStr = String(form.email || '').trim();
    const emailOk = emailRegex.test(emailStr);
    return nameOk && emailOk;
  }, [form.full_name, form.email]);

  // ✅ Only enable "Save" when something changed
  const isDirty = useMemo(() => {
    return (
      String(form.full_name || '').trim() !== String(profile.full_name || '').trim() ||
      String(form.email || '').trim().toLowerCase() !== String(profile.email || '').trim().toLowerCase()
    );
  }, [form.full_name, form.email, profile.full_name, profile.email]);

  const startEdit = () => {
    setForm(profile);
    setEditing(true);
    setMsg('');
    setErr('');
  };

  const cancelEdit = () => {
    setForm(profile);
    setEditing(false);
    setMsg('');
    setErr('');
  };

  const saveProfile = async () => {
    const nameStr = String(form.full_name || '').trim();
    const emailStr = String(form.email || '').trim().toLowerCase();

    if (!nameStr) {
      setErr('Full name is required.');
      return;
    }
    if (!emailRegex.test(emailStr)) {
      setErr('Please provide a valid email.');
      return;
    }
    if (!isDirty) {
      setErr('No changes to save.');
      return;
    }

    try {
      setSaving(true);
      setMsg('');
      setErr('');

      const payload = {
        full_name: nameStr,
        phone: form.phone,
        email: emailStr,
      };

      const updatedResponse = await api.put('/user/updateProfileData', payload, { withCredentials: true });

      // Optimistic sync (phone unchanged)
      const updated = { ...profile, full_name: nameStr, email: emailStr };
      setProfile(updated);
      setForm(updated);
      setEditing(false);

      // Show modal + inline message
      setMsg(updatedResponse?.data?.message || 'Profile updated successfully.');
      setShowSuccess(true);
    } catch (e) {
      console.error('Error updating profile', e);
      setErr(e?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="px-4 md:px-10 lg:px-16 py-8 flex items-center justify-between max-w-6xl mx-auto">
        <div>
          <p className="text-2xl md:text-3xl text-gray-700">
            Manage <span className="font-semibold text-orange-600">Profile</span>
          </p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="hidden sm:inline-flex bg-orange-600 text-white px-5 py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-orange-700 active:scale-[0.99] transition disabled:opacity-60"
            disabled={loading}
          >
            Edit Profile
          </button>
        ) : (
          <div className="hidden sm:flex gap-2">
            <button
              onClick={saveProfile}
              disabled={saving || !isValid || !isDirty}
              className={`rounded-xl px-5 py-3 text-white shadow-sm transition active:scale-[0.99]
                ${saving || !isValid || !isDirty ? 'bg-orange-600/60 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-md'}`}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-5 py-3 rounded-xl ring-1 ring-black/10 hover:bg-gray-50 transition"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="px-4 md:px-10 lg:px-16 pb-20">
        <div className="max-w-3xl mx-auto rounded-2xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80
                        shadow-lg ring-1 ring-black/5">
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-40 rounded bg-gray-200" />
                <div className="h-10 w-full rounded bg-gray-200" />
                <div className="h-10 w-3/4 rounded bg-gray-200" />
                <div className="h-10 w-2/3 rounded bg-gray-200" />
              </div>
            ) : (
              <>
                {/* Header / avatar-ish row */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-50 ring-1 ring-orange-200/70 flex items-center justify-center text-orange-700 font-semibold">
                    {String(profile.full_name || 'U').trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Profile Information</h2>
                    <p className="text-xs text-gray-500">Your account basics</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Full Name */}
                  {!editing ? (
                    <div className="md:col-span-1">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Full name</p>
                      <p className="text-gray-900 font-medium">{profile.full_name || '—'}</p>
                    </div>
                  ) : (
                    <div className="md:col-span-1">
                      <label className="text-xs uppercase tracking-wide text-gray-500">Full name</label>
                      <input
                        required
                        aria-invalid={!String(form.full_name || '').trim() ? 'true' : 'false'}
                        className="mt-1 px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner
                                   ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                        type="text"
                        placeholder="Full name"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Phone (Read-only always) */}
                  {!editing ? (
                    <div className="md:col-span-1">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                      <p className="text-gray-900 font-medium">{profile.phone || '—'}</p>
                    </div>
                  ) : (
                    <div className="md:col-span-1">
                      <label className="text-xs uppercase tracking-wide text-gray-500">Phone (read-only)</label>
                      <input
                        className="mt-1 px-3 py-2.5 rounded-xl w-full text-gray-700 bg-gray-50 shadow-inner
                                   ring-1 ring-inset ring-gray-200 cursor-not-allowed"
                        type="text"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={() => {}}
                        readOnly
                        disabled
                      />
                    </div>
                  )}

                  {/* Email */}
                  {!editing ? (
                    <div className="md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium break-all">{profile.email || '—'}</p>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="text-xs uppercase tracking-wide text-gray-500">Email</label>
                      <input
                        required
                        aria-invalid={!emailRegex.test(String(form.email || '').trim()) ? 'true' : 'false'}
                        className="mt-1 px-3 py-2.5 rounded-xl w-full text-gray-900 bg-white shadow-inner
                                   ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile action buttons */}
                <div className="mt-6 flex flex-col sm:hidden gap-3">
                  {!editing ? (
                    <button
                      onClick={startEdit}
                      className="w-full bg-orange-600 text-white px-5 py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-orange-700 active:scale-[0.99] transition"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={saveProfile}
                        disabled={saving || !isValid || !isDirty}
                        className={`w-full rounded-xl px-5 py-3 text-white shadow-sm transition active:scale-[0.99]
                          ${saving || !isValid || !isDirty ? 'bg-orange-600/60 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:shadow-md'}`}
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-full py-3 rounded-xl ring-1 ring-black/10 hover:bg-gray-50 transition"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {/* Inline alerts */}
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
              </>
            )}
          </div>

          {/* soft divider footer zone for spacing */}
          <div className="h-3 rounded-b-2xl bg-gradient-to-b from-transparent to-gray-50/60" />
        </div>
      </div>

      <SuccessModal
        open={showSuccess}
        title="Profile updated"
        description="Your changes have been saved."
        onClose={() => { setShowSuccess(false); setMsg(''); }}
      />

      <Footer />
    </>
  );
}
