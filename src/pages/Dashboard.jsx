import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

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

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-black">🛒 Laravel POS</h1>

                    <div className="flex items-center gap-6">
                        <span className="text-gray-600">Halo, <span className="font-semibold">{user?.name}</span></span>
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <h2 className="text-3xl font-bold text-black mb-8">Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* POS - Paling Menonjol */}
                    <div
                        onClick={() => navigate('/pos')}
                        className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-8 rounded-3xl shadow-lg hover:scale-105 transition-all cursor-pointer lg:col-span-2"
                    >
                        <div className="text-6xl mb-4">💰</div>
                        <h3 className="text-3xl font-bold mb-2">Point of Sale</h3>
                        <p className="text-indigo-100 text-lg">Mulai transaksi penjualan sekarang</p>
                        <div className="mt-6 text-sm opacity-75">→ Klik untuk buka kasir</div>
                    </div>

                    {/* Produk */}
                    <div
                        onClick={() => navigate('/produk')}
                        className="bg-white p-8 rounded-3xl shadow hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-2xl font-semibold text-black mb-1">Produk</h3>
                        <p className="text-gray-500">Kelola stok & daftar barang</p>
                    </div>

                    {/* Pembelian */}
                    <div
                        onClick={() => navigate('/pembelian')}
                        className="bg-white p-8 rounded-3xl shadow hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="text-5xl mb-4">📥</div>
                        <h3 className="text-2xl font-semibold text-black mb-1">Pembelian</h3>
                        <p className="text-gray-500">Riwayat pembelian barang</p>
                    </div>

                    {/* Pesanan */}
                    <div
                        onClick={() => navigate('/pesanan')}
                        className="bg-white p-8 rounded-3xl shadow hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-2xl font-semibold text-black mb-1">Pesanan</h3>
                        <p className="text-gray-500">Riwayat transaksi penjualan</p>
                    </div>

                    {/* Pelanggan */}
                    <div
                        onClick={() => navigate('/pelanggan')}
                        className="bg-white p-8 rounded-3xl shadow hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="text-5xl mb-4">👥</div>
                        <h3 className="text-2xl font-semibold text-black mb-1">Pelanggan</h3>
                        <p className="text-gray-500">Data pelanggan & loyalty</p>
                    </div>

                    {/* Profil */}
                    <div
                        onClick={() => navigate('/profile')}
                        className="bg-white p-8 rounded-3xl shadow hover:shadow-xl transition cursor-pointer"
                    >
                        <div className="text-5xl mb-4">👤</div>
                        <h3 className="text-2xl font-semibold text-black mb-1">Profil</h3>
                        <p className="text-gray-500">Pengaturan akun</p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Dashboard;