import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/login', {
                email,
                password,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success('Login berhasil!');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Login gagal. Cek email/password');
        }
    };

    return (
        <div className="min-h-screen bg-[#EEF2FF] flex items-center justify-center p-4">
            {/* Login Card */}
            <div className="bg-white px-8 py-10 rounded-[35px] shadow-sm w-full max-w-[450px]">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-[32px] font-bold text-gray-900 mb-1">Login</h1>
                    <p className="text-gray-500 text-sm">Masuk ke akun Anda</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Input */}
                    <div className="text-left">
                        <label className="block text-[14px] font-semibold text-gray-700 mb-2 ml-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-[#F0F5FF] border border-[#DCE4FF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="test@example.com"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="text-left">
                        <label className="block text-[14px] font-semibold text-gray-700 mb-2 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-[#F0F5FF] border border-[#DCE4FF] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full bg-[#1D5DFF] hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-2"
                    >
                        Login
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-10">
                    <p className="text-gray-500 text-[15px] font-medium">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-[#1D5DFF] font-bold hover:underline">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;