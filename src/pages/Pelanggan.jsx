import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';
// const BASE_URL = 'https://laravel-api.kebunkode.com/api';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Pelanggan() {
  const [pelanggan, setPelanggan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ nama: '', no_hp: '', alamat: '' });

  const token = localStorage.getItem('token');
  const navigate = useNavigate();



  const fetchPelanggan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/pelanggan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPelanggan(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPelanggan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditData(null);
    setForm({ nama: '', no_hp: '', alamat: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditData(p);
    setForm({ nama: p.nama, no_hp: p.no_hp, alamat: p.alamat || '' });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.no_hp.trim()) {
      setError('Nama dan No. HP wajib diisi');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editData) {
        await axios.put(`${BASE_URL}/pelanggan/${editData.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${BASE_URL}/pelanggan`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowForm(false);
      fetchPelanggan();
    } catch (err) {
      const msg =
        err.response?.data?.errors?.no_hp?.[0] || err.response?.data?.message || 'Gagal menyimpan';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/pelanggan/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchPelanggan();
    } catch (err) {
      console.error(err);
    }
  };

  const openHistory = async (p) => {
    try {
      const res = await axios.get(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allOrders = res.data.data || res.data;
      const myOrders = allOrders.filter((o) => o.pelanggan?.id === p.id);
      setHistoryData({ pelanggan: p, orders: myOrders });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = pelanggan.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nama?.toLowerCase().includes(q) ||
      p.no_hp?.includes(q) ||
      p.alamat?.toLowerCase().includes(q)
    );
  });

  const totalBelanja = (orders) => orders.reduce((sum, o) => sum + Number(o.total_price), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Laravel POS</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold">👥 Data Pelanggan</h2>
            <p className="text-gray-500 mt-1">{pelanggan.length} pelanggan terdaftar</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow"
          >
            + Tambah Pelanggan
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari nama, no. HP, atau alamat..."
            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">Memuat data...</div>
        ) : pelanggan.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-lg">Belum ada pelanggan terdaftar</p>
            <button
              onClick={openAdd}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              + Tambah Pertama
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">No. HP</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Alamat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Terdaftar</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {p.nama?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold">{p.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700">{p.no_hp}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {p.alamat || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openHistory(p)}
                          className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-xs font-medium"
                        >
                          📋 Riwayat
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-medium"
                        >
                          📝 Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 text-xs font-medium"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Modal Tambah / Edit --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-5">
              {editData ? '📝 Edit Pelanggan' : '➕ Tambah Pelanggan'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  No. HP <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.no_hp}
                  onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Alamat <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Jl. Contoh No. 10, Kota..."
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40"
              >
                {saving ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambahkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Konfirmasi Hapus --- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-xl font-bold mb-2">Hapus Pelanggan?</h3>
            <p className="text-gray-500 mb-6">
              Data <span className="font-semibold text-gray-700">{deleteTarget.nama}</span> akan
              dihapus permanen. Riwayat transaksi tidak ikut terhapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Riwayat Transaksi --- */}
      {historyData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {historyData.pelanggan.nama?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{historyData.pelanggan.nama}</h3>
                <p className="text-blue-600 font-bold text-sm">📞 {historyData.pelanggan.no_hp}</p>
                {historyData.pelanggan.alamat && (
                  <p className="text-sm text-gray-500">📍 {historyData.pelanggan.alamat}</p>
                )}
              </div>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{historyData.orders.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Transaksi</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-green-600">
                  {formatRupiah(totalBelanja(historyData.orders))}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Belanja</p>
              </div>
            </div>

            {/* List Transaksi */}
            {historyData.orders.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">👎</p>
                <p>Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold text-sm text-gray-600">Riwayat Transaksi</p>
                {historyData.orders.map((o) => (
                  <div key={o.id} className="border rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-blue-600 text-sm">{o.order_code}</p>
                        <p className="text-xs text-gray-400">{o.created_at}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatRupiah(o.total_price)}</p>
                        {Number(o.discount) > 0 && (
                          <p className="text-xs text-green-600">Diskon {o.discount}%</p>
                        )}
                      </div>
                    </div>
                    {o.items && o.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-500">
                            <span>
                              {item.produk_name} x{item.quantity}
                            </span>
                            <span>{formatRupiah(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryData(null)}
              className="w-full mt-5 py-2.5 border rounded-xl hover:bg-gray-50 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
