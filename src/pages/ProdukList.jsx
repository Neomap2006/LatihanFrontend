import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function ProdukList() {
    const [produks, setProduks] = useState([]);
    const [search, setSearch] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('');
    const [selectedProduk, setSelectedProduk] = useState(null);
    const [editForm, setEditForm] = useState({});

    // State untuk Navbar
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Fetch User untuk Navbar
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/user');
                setUser(response.data);
            } catch (error) {
                console.error(error);
                toast.error('Sesi habis, silakan login lagi');
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    const fetchProduks = async () => {
        try {
            const response = await api.get('/products', {
                params: {
                    search: search,
                    kategori: kategoriFilter
                }
            });
            let data = response.data.data;
            if (data && data.data) data = data.data;
            setProduks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil data produk');
        }
    };

    // Effect untuk fetch produk saat filter berubah (dengan debounce untuk search)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProduks();
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, kategoriFilter]);

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

    const openDetail = (produk) => {
        setSelectedProduk(produk);
        setEditForm({ ...produk });
    };

    const closeDetail = () => {
        setSelectedProduk(null);
        setEditForm({});
    };

    const handleEditChange = (e) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const updateProduk = async () => {
        try {
            // eslint-disable-next-line no-unused-vars
            const { kode_barang, gambar, ...dataToUpdate } = editForm;

            console.log("Data yang dikirim (tanpa kode_barang):", dataToUpdate);

            await api.put(`/products/${editForm.id}`, dataToUpdate);

            toast.success('Produk berhasil diupdate!');
            closeDetail();
            fetchProduks();
        } catch (error) {
            console.error("Error:", error.response?.data);

            if (error.response?.status === 422) {
                const errors = error.response.data.errors || {};
                const firstError = Object.values(errors).flat()[0];
                toast.error(firstError || 'Gagal update produk');
            } else {
                toast.error('Gagal update produk');
            }
        }
    };

    // Data sudah di-filter dari API
    const displayProduks = produks;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* ======================= NAVBAR ======================= */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                        🛒 Laravel POS
                    </h1>

                    <div className="flex items-center gap-6">
                        <span className="text-gray-600">
                            Halo, <span className="font-semibold">{user?.name}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* ======================= CONTENT ======================= */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header + Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Daftar Produk</h1>
                        <p className="text-gray-600 mt-1">{displayProduks.length} produk ditemukan</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 md:w-80 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={kategoriFilter}
                            onChange={(e) => setKategoriFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-black"
                        >
                            <option value="">Semua Kategori</option>
                            <option value="Software">Software</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Storage">Storage</option>
                            <option value="Aksesoris">Aksesoris</option>
                            <option value="Elektronik">Elektronik</option>
                        </select>
                    </div>
                </div>

                {/* Grid Produk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displayProduks.map((produk) => (
                        <div
                            key={produk.id}
                            onClick={() => openDetail(produk)}
                            className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-xl transition cursor-pointer"
                        >
                            <div className="h-48 bg-gray-200 relative">
                                {produk.gambar ? (
                                    <img
                                        src={produk.gambar}
                                        alt={produk.nama_barang}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">📦</div>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="font-mono text-sm text-gray-500">{produk.kode_barang}</div>
                                <h3 className="font-semibold text-lg text-black mt-1 line-clamp-2">{produk.nama_barang}</h3>
                                <div className="mt-3 flex justify-between items-end">
                                    <div className="text-xl font-bold text-blue-600">
                                        Rp {parseInt(produk.harga).toLocaleString('id-ID')}
                                    </div>
                                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                        {produk.kategori}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Stok: {produk.stok || produk.quantity}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL DETAIL + EDIT */}
            {selectedProduk && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-black mb-4">Detail & Edit Produk</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Preview Gambar */}
                                <div>
                                    {selectedProduk.gambar && (
                                        <img
                                            src={selectedProduk.gambar}
                                            alt={selectedProduk.nama_barang}
                                            className="w-full rounded-2xl shadow"
                                        />
                                    )}
                                </div>

                                {/* Form Edit */}
                                <div className="space-y-3">
                                    {/* KODE BARANG - READ ONLY */}
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Kode Barang</label>
                                        <div className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-500 font-mono">
                                            {editForm.kode_barang}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Kode barang tidak dapat diubah</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Nama Barang</label>
                                        <input
                                            type="text"
                                            name="nama_barang"
                                            value={editForm.nama_barang || ''}
                                            onChange={handleEditChange}
                                            className="w-full border rounded-lg px-4 py-3 text-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Harga (Rp)</label>
                                        <input
                                            type="text"
                                            name="harga"
                                            value={editForm.harga || ''}
                                            onChange={handleEditChange}
                                            className="w-full border rounded-lg px-4 py-3 text-black"
                                        />
                                    </div>

                                    {/* STOK */}
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Stok</label>
                                        <input
                                            type="text"
                                            name="stok"
                                            value={editForm.stok || editForm.quantity || ''}
                                            onChange={handleEditChange}
                                            className="w-full border rounded-lg px-4 py-3 text-black"
                                        />
                                    </div>

                                    {/* KATEGORI */}
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Kategori</label>
                                        <select
                                            name="kategori"
                                            value={editForm.kategori || ''}
                                            onChange={handleEditChange}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-black"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            <option value="Software">Software</option>
                                            <option value="Hardware">Hardware</option>
                                            <option value="Storage">Storage</option>
                                            <option value="Aksesoris">Aksesoris</option>
                                            <option value="Elektronik">Elektronik</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">Rating</label>
                                        <input
                                            type="text"
                                            step="0.1"
                                            name="rating"
                                            value={editForm.rating || ''}
                                            onChange={handleEditChange}
                                            className="w-full border rounded-lg px-4 py-3 text-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={updateProduk}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-medium transition"
                                >
                                    💾 Simpan Perubahan
                                </button>
                                <button
                                    onClick={closeDetail}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-3.5 rounded-2xl font-medium text-black transition"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProdukList;
