import { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';
// const BASE_URL = 'https://laravel-api.kebunkode.com/api';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);

export default function PaymentModal({ cart, total, user, token, onClose, onSuccess }) {
  const [phoneInput, setPhoneInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [pelanggan, setPelanggan] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ nama: '', no_hp: '', alamat: '' });
  const [skipCustomer, setSkipCustomer] = useState(false);

  const [bayar, setBayar] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

  const DISCOUNT_MEMBER = 5;
  const isMember = pelanggan && !isNewCustomer;
  const discountAmount = isMember ? Math.round(total * (DISCOUNT_MEMBER / 100)) : 0;
  const totalAfterDiscount = total - discountAmount;

  const nominalBayar = parseInt(bayar.replace(/\D/g, ''), 10) || 0;
  const kembalian = nominalBayar - totalAfterDiscount;

  const handlePhoneLookup = async () => {
    if (!phoneInput.trim()) return;
    setLookingUp(true);
    setErrorMsg('');
    setPelanggan(null);
    setIsNewCustomer(false);

    try {
      const res = await axios.get(`${BASE_URL}/pelanggan/phone/${phoneInput}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPelanggan(res.data.data);
      setIsNewCustomer(false);
    } catch {
      // Tidak ditemukan -> tampilkan form baru
      setIsNewCustomer(true);
      setNewCustomer({ nama: '', no_hp: phoneInput, alamat: '' });
    } finally {
      setLookingUp(false);
    }
  };

  const handleBayar = async () => {
    if (nominalBayar < totalAfterDiscount) {
      setErrorMsg('Nominal pembayaran kurang!');
      return;
    }

    setLoading(true);
    setErrors({});
    setErrorMsg('');

    try {
      let pelangganId = pelanggan?.id || null;

      // Buat pelanggan baru jika perlu
      if (isNewCustomer && newCustomer.nama && newCustomer.no_hp) {
        const createRes = await axios.post(`${BASE_URL}/pelanggan`, newCustomer, {
          headers: { Authorization: `Bearer ${token}` },
        });
        pelangganId = createRes.data.data.id;
      }

      const payload = {
        user_id: user?.id,
        pelanggan_id: pelangganId,
        shipping_address: pelanggan?.alamat || newCustomer.alamat || 'Kasir POS',
        items: cart.map((i) => ({
          produk_id: i.produk_id,
          quantity: i.quantity,
        })),
      };

      const res = await axios.post(`${BASE_URL}/orders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      onSuccess({
        ...res.data.data,
        bayar: nominalBayar,
        kembalian,
        discountAmount,
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        setErrorMsg(Object.values(err.response.data.errors)[0]?.[0] || 'Validasi gagal');
      } else {
        setErrorMsg(err.response?.data?.message || 'Gagal membuat transaksi');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [...new Set([
    Math.ceil(totalAfterDiscount / 10000) * 10000,
    Math.ceil(totalAfterDiscount / 50000) * 50000,
    Math.ceil(totalAfterDiscount / 100000) * 100000,
  ])].filter((v) => v >= totalAfterDiscount).slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-black">💳 Proses Pembayaran</h2>

        {/* Ringkasan Belanja */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          {cart.map((item) => (
            <div key={item.produk_id} className="flex justify-between text-sm text-black">
              <span>
                {item.nama} x{item.quantity}
              </span>
              <span>{formatRupiah(item.harga * item.quantity)}</span>
            </div>
          ))}
          <hr />
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatRupiah(total)}</span>
          </div>
          {isMember && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>Diskon Member 5%</span>
              <span>- {formatRupiah(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-black">
            <span>Total Bayar</span>
            <span className="text-blue-600">{formatRupiah(totalAfterDiscount)}</span>
          </div>
        </div>

        {/* --- SECTION: Data Pelanggan --- */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-sm text-black">👤 Data Pelanggan</p>
            {!skipCustomer && !pelanggan && !isNewCustomer && (
              <button
                onClick={() => setSkipCustomer(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Lewati (tanpa member)
              </button>
            )}
            {(skipCustomer || pelanggan || isNewCustomer) && (
              <button
                onClick={() => {
                  setSkipCustomer(false);
                  setPelanggan(null);
                  setIsNewCustomer(false);
                  setPhoneInput('');
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                Ubah
              </button>
            )}
          </div>

          {/* Sudah skip */}
          {skipCustomer && !pelanggan && !isNewCustomer && (
            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-500 text-center">
              Transaksi tanpa data pelanggan
            </div>
          )}

          {/* Belum cek phone */}
          {!skipCustomer && !pelanggan && !isNewCustomer && (
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Masukkan no. HP pelanggan..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
              />
              <button
                onClick={handlePhoneLookup}
                disabled={lookingUp || !phoneInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40"
              >
                {lookingUp ? '...' : 'Cek'}
              </button>
            </div>
          )}

          {/* Pelanggan ditemukan */}
          {pelanggan && !isNewCustomer && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-green-700">✅ Member Ditemukan!</p>
                  <p className="text-sm font-semibold text-black">{pelanggan.nama}</p>
                  <p className="text-xs text-gray-500">📞 {pelanggan.no_hp}</p>
                  {pelanggan.alamat && (
                    <p className="text-xs text-gray-500">📍 {pelanggan.alamat}</p>
                  )}
                </div>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Diskon 5%
                </span>
              </div>
            </div>
          )}

          {/* Pelanggan tidak ditemukan -> form baru */}
          {isNewCustomer && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-yellow-700">
                ⚠️ Pelanggan belum terdaftar. Daftarkan sekarang?
              </p>
              <input
                type="text"
                placeholder="Nama lengkap *"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
                value={newCustomer.nama}
                onChange={(e) => setNewCustomer({ ...newCustomer, nama: e.target.value })}
              />
              <input
                type="tel"
                placeholder="No. HP *"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
                value={newCustomer.no_hp}
                onChange={(e) => setNewCustomer({ ...newCustomer, no_hp: e.target.value })}
              />
              <input
                type="text"
                placeholder="Alamat (opsional)"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
                value={newCustomer.alamat}
                onChange={(e) => setNewCustomer({ ...newCustomer, alamat: e.target.value })}
              />
              <p className="text-xs text-gray-400">
                * Akan otomatis didaftarkan saat transaksi berhasil. Belum mendapat diskon member.
              </p>
            </div>
          )}
        </div>

        {/* --- SECTION: Pembayaran --- */}
        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-600 mb-1 block">
            Nominal Bayar
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Masukkan nominal..."
            className="w-full border-2 rounded-xl px-4 py-3 text-xl font-bold focus:outline-none focus:border-blue-500 text-black"
            value={
              bayar
                ? `Rp ${parseInt(bayar.replace(/\D/g, ''), 10).toLocaleString('id-ID')}`
                : ''
            }
            onChange={(e) => setBayar(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        {/* Quick Amount */}
        {quickAmounts.length > 0 && (
          <div className="flex gap-2 mb-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setBayar(String(amt))}
                className="flex-1 py-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-400 text-black"
              >
                {formatRupiah(amt)}
              </button>
            ))}
          </div>
        )}

        {/* Kembalian */}
        {nominalBayar >= totalAfterDiscount && nominalBayar > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-green-600">Kembalian</p>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(kembalian)}</p>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-red-600 text-sm font-semibold">{errorMsg}</p>
            {Object.entries(errors).map(([field, messages]) => (
              <p key={field} className="text-red-500 text-xs mt-1">
                * {field}: {messages[0]}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl hover:bg-gray-50 font-medium text-black"
          >
            Batal
          </button>
          <button
            onClick={handleBayar}
            disabled={loading || nominalBayar < totalAfterDiscount}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-40"
          >
            {loading ? 'Memproses...' : '✅ Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
