import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);

const STATUS_STYLE = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function Pesanan() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();


  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_code?.toLowerCase().includes(search.toLowerCase()) ||
      o.pelanggan?.nama?.toLowerCase().includes(search.toLowerCase()) ||
      o.pelanggan?.no_hp?.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">🚀 Laravel POS</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-6 text-black">📋 Riwayat Pesanan</h2>

        {/* Filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Cari kode order, nama atau no HP pelanggan..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none text-black"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-lg">Memuat data...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kode Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Pelanggan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kasir</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Diskon</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {order.order_code}
                    </td>
                    <td className="px-4 py-3 text-black">
                      {order.pelanggan ? (
                        <div>
                          <p className="font-semibold">{order.pelanggan.nama}</p>
                          <p className="text-xs text-gray-400">{order.pelanggan.no_hp}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">- Tamu</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.user?.name}</td>
                    <td className="px-4 py-3 font-bold text-black">
                      {formatRupiah(order.total_price)}
                    </td>
                    <td className="px-4 py-3">
                      {order.discount > 0 ? (
                        <span className="text-green-600 font-semibold">{order.discount}%</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          STATUS_STYLE[order.status]
                        }`}
                      >
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{order.created_at}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(order)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-black">{selected.order_code}</h3>
                <p className="text-sm text-gray-400">{selected.created_at}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  STATUS_STYLE[selected.status]
                }`}
              >
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

            {/* Info Pelanggan */}
            {selected.pelanggan && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">👤 Pelanggan Member</p>
                <p className="font-semibold text-black">{selected.pelanggan.nama}</p>
                <p className="text-sm text-gray-500">{selected.pelanggan.no_hp}</p>
                {selected.pelanggan.alamat && (
                  <p className="text-sm text-gray-500">📍 {selected.pelanggan.alamat}</p>
                )}
              </div>
            )}

            {/* Item */}
            <div className="space-y-2 mb-4">
              <p className="font-semibold text-sm text-gray-600">Item Pesanan</p>
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-semibold text-black">{item.produk_name}</p>
                    <p className="text-gray-400 text-xs">
                      {item.quantity} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <p className="font-bold text-black">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-3 space-y-1">
              {selected.discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>
                      {formatRupiah(
                        Number(selected.total_price) + Number(selected.discount_amount)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>Diskon Member ({selected.discount}%)</span>
                    <span>- {formatRupiah(selected.discount_amount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-lg text-black">
                <span>Total</span>
                <span className="text-blue-600">{formatRupiah(selected.total_price)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Kasir</span>
                <span>{selected.user?.name}</span>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-4 py-2 border rounded-xl hover:bg-gray-50 text-black font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
