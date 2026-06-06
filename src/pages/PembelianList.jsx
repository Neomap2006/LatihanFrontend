import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

const STATUS_LABEL = {
  pending: { text: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  diterima: { text: 'Diterima', cls: 'bg-green-100 text-green-700' },
  dibatalkan: { text: 'Dibatalkan', cls: 'bg-red-100 text-red-700' },
};

const KATEGORI_LIST = ['Software', 'Hardware', 'Storage', 'Aksesoris', 'Elektronik'];

// —— Modal: Tambah Pembelian
function TambahPembelianModal({ onClose, onSuccess }) {
  const [suppliers, setSuppliers] = useState([]);
  const [produks, setProduks] = useState([]);
  const [form, setForm] = useState({
    supplier_id: '',
    tanggal_pembelian: new Date().toISOString().split('T')[0],
    keterangan: '',
  });
  const emptyItem = () => ({
    produk_id: '', quantity: 1, harga_beli: '', is_new: false, new_produk: 
    {kode_barang: '',nama_barang: '', kategori: '', harga: '' } });
    const [items, setItems] = useState([emptyItem()]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // State untuk modal tambah supplier baru
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ nama: '', no_hp: '', email: '', alamat: '' });
    const [savingSupplier, setSavingSupplier] = useState(false);

  useEffect(() => {
    const loadData = async()=>{
      try {
        const pRes = await api.get('/products');
        let pData = pRes.data;
        if(pData.data) pData = pData.data
        setProduks(Array.isArray(pData) ? pData : []);
      } catch {
        toast.error('gagal mengambil data produk');
      }

      try{
        const sRes = await api.get('/suppliers');
        setSuppliers(sRes.data.data || []);
      } catch {
        // suppliers belum ada, tidak apa-apa
        setSuppliers([]);
      }
    }
    
    loadData();
  }, []);

  const addItem = () => { setItems([...items, emptyItem()]);};
  const removeItem = (idx) => { setItems(items.filter((_, i) => i !== idx)); };
  const updateItem = (idx, field, value) => {
    const updated = [...items];

    // Jika pilih "new" → aktifkan mode produk baru
    if (field === 'produk_id') {
      if (value === '__new__') {
        updated[idx] = { ...updated[idx], produk_id: '_new_', is_new: true, harga_beli: '',};
      }else{
        updated[idx] = { ...updated[idx], produk_id: value, is_new: false,}; 
        const produk = produks.find((p) => String(p.id) === String(value)); 
        if (produk) updated[idx].harga_beli = produk.harga;       
      }
    } else if (field.startsWith('new_produk.')){
      const subField = field.replace('new_produk.', '');
      updated[idx] = { ...updated[idx], new_produk: { ...updated[idx].new_produk, [subField]: value } };
      if (subField === 'harga') {
        updated[idx].harga_beli = value;
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setItems(updated);
  };

  const totalHarga = items.reduce(
    (sum, i) => sum + (parseInt(i.quantity) || 0) * (parseFloat(i.harga_beli) || 0),
    0
  );

  const handleSaveSupplier = async () => {
    if (!supplierForm.nama.trim()) {
      toast.error('Nama supplier wajib diisi');
      return;
    }
    setSavingSupplier(true);
    try {
      const res = await api.post('/suppliers', supplierForm);
      const newSupplier = res.data.data;
      setSuppliers((prev) => [...prev, newSupplier]);
      setForm((prev) => ({ ...prev, supplier_id: newSupplier.id }));
      setShowAddSupplier(false);
      setSupplierForm({ nama: '', no_hp: '', email: '', alamat: '' });
      toast.success('Supplier berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambah supplier');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!form.supplier_id) {
      setErrors({ supplier_id: ['Supplier wajib dipilih'] });
      return;
    }

    // Validasi items
    const validItems = items.filter((i) =>
      (i.is_new ? i.new_produk?.nama_barang?.trim() : i.produk_id) && i.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/pembelians', {
        ...form,
        items: validItems.map((i) => ({
          produk_id: i.is_new ? null : parseInt(i.produk_id),
          quantity: parseInt(i.quantity),
          harga_beli: parseFloat(i.harga_beli) || 0,
          ...(i.is_new && {
            new_produk: {
              kode_barang: i.new_produk.kode_barang || '',
              nama_barang: i.new_produk.nama_barang,
              kategori: i.new_produk.kategori || '',
              harga: parseFloat(i.new_produk.harga) || parseFloat(i.harga_beli),
              stok: 0,
            },
          }),
        })),
      });
      toast.success('Pembelian berhasil dibuat!');
      onSuccess(res.data.data);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        const firstErr = Object.values(err.response.data.errors).flat()[0];
        toast.error(firstErr || 'Validasi gagal');
      } else {
        toast.error(err.response?.data?.message || 'Gagal membuat pembelian');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-black">📦 Tambah Pembelian</h2>

          {/* Supplier */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-black">Supplier *</label>
              <button
                onClick={() => setShowAddSupplier(!showAddSupplier)}
                className="text-xs font-semibold text-blue-600 hover:underline transition"
              >
                {showAddSupplier ? 'Batal tambah' : '+ Supplier baru'}
              </button>
            </div>

            {showAddSupplier ? (
              <div className="bg-[#f0f5ff] border border-blue-200 rounded-2xl p-5 space-y-4 mb-2">
                <p className="text-sm font-bold text-blue-700">Tambah Supplier Baru</p>
                <input
                  type="text"
                  placeholder="Nama supplier"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 
                  focus:ring-blue-500/20 focus:outline-none transition bg-white text-black placeholder:text-gray-500"
                  value={supplierForm.nama}
                  onChange={(e) => setSupplierForm({ ...supplierForm, nama: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="tel"
                    placeholder="No. HP"
                    className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 
                    focus:ring-blue-500/20 focus:outline-none transition bg-white text-black placeholder:text-gray-500"
                    value={supplierForm.no_hp}
                    onChange={(e) => setSupplierForm({ ...supplierForm, no_hp: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 
                    focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white text-black placeholder:text-gray-500"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Alamat"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 
                  focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition bg-white text-black placeholder:text-gray-500"
                  value={supplierForm.alamat}
                  onChange={(e) => setSupplierForm({ ...supplierForm, alamat: e.target.value })}
                />
                <button
                  onClick={handleSaveSupplier}
                  disabled={savingSupplier}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold 
                  hover:bg-blue-700 disabled:opacity-40 transition"
                >
                  {savingSupplier ? 'Menyimpan...' : 'Simpan Supplier'}
                </button>
              </div>
            ) : (
              <select
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition bg-white text-black ${
                  errors.supplier_id 
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            )}
            {errors.supplier_id && (
              <p className="text-red-500 text-xs mt-1">{errors.supplier_id[0]}</p>
            )}
          </div>

          {/* Tanggal */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Pembelian *</label>
            <div className="relative">
              <input
                type="date"
                value={form.tanggal_pembelian}
                onChange={(e) => setForm({ ...form, tanggal_pembelian: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500/20 
                focus:border-blue-500 focus:outline-none text-black text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">📅</span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Daftar Produk *</label>
              <button
                onClick={addItem}
                className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-semibold"
              >
                + Tambah Produk
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                // Kumpulkan produk_id yang sudah dipilih di baris lain
                const selectedIds = items
                  .filter((_, i) => i !== idx)
                  .map((i) => String(i.produk_id))
                  .filter(Boolean);

                return (
                <div
                  key={idx}
                  className={`rounded-2xl p-4 transition duration-200 ${
                    item.is_new
                      ? 'bg-blue-50/30 border border-blue-200'
                      : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <div className="flex gap-2 mb-3 items-center">
                    <select
                      value={item.is_new ? "__new__" : item.produk_id}
                      onChange={(e) => updateItem(idx, 'produk_id', e.target.value)}
                      className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 
                        focus:border-blue-500 focus:outline-none bg-white text-black transition ${
                        item.is_new ? 'border-blue-200' : 'border-slate-300'
                      }`}
                    >
                      <option value="">-- Pilih Produk --</option>
                      <option value="__new__">✨ + Produk Baru (belum ada di daftar)</option>
                      {produks.map((p) => {
                        const alreadySelected = selectedIds.includes(String(p.id));
                        return (
                          <option key={p.id} value={p.id} disabled={alreadySelected}>
                            {p.nama_barang} (Stok: {p.stok ?? p.quantity ?? 0}){alreadySelected ? ' — Sudah dipilih' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700 font-bold px-2 text-lg transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Form Produk Baru */}
                  {item.is_new && (
                    <>
                      <hr className="border-t border-blue-200/60 mt-3 mb-2" />
                      <div className="space-y-3 mb-3">
                        <p className="text-xs font-bold text-blue-600">Data Produk Baru (otomatis masuk tabel produk)</p>
                        <input
                          type="text"
                          placeholder="Nama produk"
                          value={item.new_produk?.nama_barang || ''}
                          onChange={(e) => updateItem(idx, 'new_produk.nama_barang', e.target.value)}
                          className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 
                          focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white text-black transition !mt-2"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Kode barang (opsional)"
                            value={item.new_produk?.kode_barang || ''}
                            onChange={(e) => updateItem(idx, 'new_produk.kode_barang', e.target.value)}
                            className="border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 
                            focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white text-black transition"
                          />
                          <select
                            value={item.new_produk?.kategori || ''}
                            onChange={(e) => updateItem(idx, 'new_produk.kategori', e.target.value)}
                            className="border border-blue-200 rounded-xl px-3 py-2.5 text-sm 
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white text-black transition"
                          >
                            <option value="">-- Kategori --</option>
                            {KATEGORI_LIST.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Harga jual produk"
                          value={item.new_produk?.harga || ''}
                          onChange={(e) => updateItem(idx, 'new_produk.harga', e.target.value)}
                          className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm 
                          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white text-black transition"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Qty</label>
                      <input
                        type="text"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 
                          focus:border-blue-500 focus:outline-none text-black text-left transition ${
                          item.is_new ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Harga Beli (Rp)</label>
                      <input
                        type="text"
                        value={item.harga_beli}
                        onChange={(e) => updateItem(idx, 'harga_beli', e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 
                          focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-black transition ${
                          item.is_new ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Subtotal per item */}
                  {(parseInt(item.quantity) || 0) > 0 && (parseFloat(item.harga_beli) || 0) > 0 && (
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      Subtotal: {formatRupiah((parseInt(item.quantity) || 0) * (parseFloat(item.harga_beli) || 0))}
                    </p>
                  )}
                </div>
              )})}
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50/60 rounded-2xl p-5 flex justify-between items-center mb-6">
            <span className="font-semibold text-slate-700 text-sm">Total Pembelian</span>
            <span className="text-xl font-bold text-blue-600">{formatRupiah(totalHarga)}</span>
          </div>

          {/* Keterangan */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Keterangan (opsional)</label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 
              focus:border-blue-500 focus:outline-none h-24 bg-white text-black transition resize-none"
              placeholder="Catatan pembelian..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-semibold transition disabled:opacity-40"
            >
              {loading ? 'Menyimpan...' : '💾 Simpan Pembelian'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-2xl font-semibold text-black transition"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// —— Modal: Detail Pembelian
function DetailPembelianModal({ pembelian, onClose, onStatusChange }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleUpdateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/pembelians/${pembelian.id}/status`, { status });
      toast.success(`Status diubah ke "${STATUS_LABEL[status].text}"`);
      onStatusChange();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const s = STATUS_LABEL[pembelian.status] || {};


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Detail Pembelian</h2>
              <p className="font-mono text-sm font-semibold text-blue-600 mt-1">{pembelian.no_pembelian}</p>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
              pembelian.status === 'diterima'
                ? 'bg-green-50 text-green-700 border-green-200/50'
                : pembelian.status === 'pending'
                ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                : 'bg-red-50 text-red-700 border-red-200/50'
            }`}>
              {s.text}
            </span>
          </div>

          {/* Info Supplier & Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
              <p className="text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Supplier</p>
              <p className="font-bold text-slate-800 text-base">{pembelian.supplier?.nama || '—'}</p>
              {pembelian.supplier?.no_hp && (
                <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span className="text-rose-500">📞</span> {pembelian.supplier.no_hp}
                </p>
              )}
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
              <p className="text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Tanggal</p>
              <p className="font-bold text-slate-800 text-base">
                {new Date(pembelian.tanggal_pembelian).toLocaleString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
              </p>
              <p className="text-sm text-slate-500 mt-1">Oleh: {pembelian.user?.name || '—'}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-base mb-3">Daftar Produk</h3>
            <div className="border border-black rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-black">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-bold text-slate-600">Produk</th>
                    <th className="text-center px-5 py-3.5 font-bold text-slate-600">Qty</th>
                    <th className="text-center px-5 py-3.5 font-bold text-slate-600">Harga Beli</th>
                    <th className="text-right px-5 py-3.5 font-bold text-slate-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(pembelian.items || []).map((item, idx) => (
                    <tr key={idx} className="border-t border-black hover:bg-slate-50/30 transition">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{item.produk?.nama_barang || '-'}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.produk?.kode_barang}</p>
                      </td>
                      <td className="px-5 py-4 text-center text-slate-600 font-medium">{item.quantity}</td>
                      <td className="px-5 py-4 text-center text-slate-600">{formatRupiah(item.harga_beli)}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white border-t border-black">
                  <tr>
                    <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-800">Total</td>
                    <td className="px-5 py-4 text-right font-bold text-blue-600 text-base">
                      {formatRupiah(pembelian.total_harga)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {pembelian.keterangan && (
            <div className="mb-6 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
              <p className="text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Keterangan</p>
              <p className="text-sm text-slate-800 leading-relaxed font-semibold">{pembelian.keterangan}</p>
            </div>
          )}

          {/* Actions */}
          {pembelian.status === 'pending' && (
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => handleUpdateStatus('diterima')}
                disabled={updatingStatus}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-bold transition disabled:opacity-40"
              >
                {updatingStatus ? 'Memproses...' : '✅ Tandai Diterima'}
              </button>
              <button
                onClick={() => handleUpdateStatus('dibatalkan')}
                disabled={updatingStatus}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-3.5 rounded-2xl font-bold transition disabled:opacity-40"
              >
                Batalkan
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 py-3.5 rounded-2xl font-bold text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// —— Main Component: PembelianList
function PembelianList() {
  const [pembelians, setPembelians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTambah, setShowTambah] = useState(false);
  const [selectedPembelian, setSelectedPembelian] = useState(null);
  const navigate = useNavigate();

  const fetchPembelians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pembelians');
      let data = res.data;
      if (data.data) data = data.data;
      setPembelians(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal mengambil data pembelian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user');
        setUser(res.data);
      } catch {
        toast.error('Sesi habis, silakan login lagi');
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchUser();
    fetchPembelians();
  }, [navigate]);


  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error(error);
    }
    localStorage.removeItem('token');
    toast.success('Berhasil logout');
    navigate('/login');
  };

  const filtered = pembelians.filter((p) => {
    const matchSearch =
      p.no_pembelian?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.nama?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalNilai = filtered.reduce((sum, p) => sum +(p.total_harga) || 0, 0);
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🛒 Laravel POS
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                  Halo, <span className="font-semibold">{user?.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
            
            <div className="w-px h-6 bg-gray-300" /> {/* Divider */}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

        {/* Content*/}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header*/}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pembelian</h1>
            <p className="text-gray-600 mt-1">
               {filtered.length} transaksi . Total: {formatRupiah(totalNilai)}</p>
          </div>
          <button
            onClick={() => setShowTambah(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            + Tambah Pembelian
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Cari no. pembelian atau supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[450px] px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-500 bg-white 
            focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[165px] px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 bg-white 
            focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diterima">Diterima</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700">Memuat data...</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum ada pembelian</h3>
            <p className="text-gray-500">Mulai catat pembelian barang dari supplier</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-black">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 text-sm">No. Pembelian</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 text-sm">Supplier</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-600 text-sm">Tanggal</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">Items</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-600 text-sm">Total</th>
                    <th className="text-center px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const s = STATUS_LABEL[p.status] || {};
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPembelian(p)}
                        className="border-t border-black hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-blue-600 text-sm font-semibold">
                            {p.no_pembelian}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{p.supplier?.nama || '-'}</p>
                          {p.supplier?.no_hp && (
                            <p className="text-xs text-gray-400">{p.supplier.no_hp}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(p.tanggal_pembelian).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {p.items?.length || 0} produk
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                          {formatRupiah(p.total_harga)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>
                            {s.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showTambah && (
        <TambahPembelianModal
          onClose={() => setShowTambah(false)}
          onSuccess={() => {
            setShowTambah(false);
            fetchPembelians();
          }}
        />
      )}

      {/* Modal Detail */}
      {selectedPembelian && (
        <DetailPembelianModal
          pembelian={selectedPembelian}
          onClose={() => setSelectedPembelian(null)}
          onStatusChange={fetchPembelians}
        />
      )}
    </div>
  );
}

export default PembelianList;
