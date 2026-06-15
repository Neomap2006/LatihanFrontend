import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// Ambil base URL backend dari konfigurasi axios (misal: https://laravel-api.kebunkode.com/api)
// lalu ekstrak origin-nya (https://laravel-api.kebunkode.com)
const API_ORIGIN = (() => {
  try {
    return new URL(api.defaults.baseURL).origin;
  } catch {
    return '';
  }
})();

// Normalisasi URL foto: ganti host apapun (localhost, 127.0.0.1, dsb)
// dengan host backend yang benar agar foto bisa dimuat
const normalizeFotoUrl = (url) => {
  if (!url || !API_ORIGIN) return url;
  try {
    const parsed = new URL(url);
    const correct = new URL(API_ORIGIN);
    if (parsed.hostname !== correct.hostname) {
      parsed.hostname = correct.hostname;
      parsed.port = correct.port;
      parsed.protocol = correct.protocol;
    }
    return parsed.toString();
  } catch {
    return url;
  }
};
// --- Komponen Kamera dengan Frame Wajah ---
function KameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);

  const [ready, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [error, setError] = useState('');

  const startCamera = useCallback(async (mode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setError('');
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  // Gambar frame oval di overlay canvas
  useEffect(() => {
    if (!ready) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');

    const draw = () => {
      const w = overlay.width;
      const h = overlay.height;
      ctx.clearRect(0, 0, w, h);

      // Latar gelap semi-transparan
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, w, h);

      // Potong area oval (efek "lubang")
      const cx = w / 2;
      const cy = h * 0.46;
      const rx = w * 0.34;
      const ry = h * 0.42;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Border oval berwarna
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sudut-sudut dekoratif
      const corners = [
        [cx - rx - 2, cy - ry - 2, 0, Math.PI / 2],
        [cx + rx + 2, cy - ry - 2, Math.PI / 2, Math.PI],
        [cx + rx + 2, cy + ry + 2, Math.PI, Math.PI * 1.5],
        [cx - rx - 2, cy + ry + 2, Math.PI * 1.5, Math.PI * 2],
      ];
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      corners.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Teks panduan
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.round(w * 0.04)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Posisikan wajah dalam bingkai', cx, cy + ry + 36);
    };

    draw();
  }, [ready]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Potong tengah video menjadi persegi
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;

    // Flip horizontal untuk selfie camera
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    // Buat foto oval (crop circular)
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(imageUrl);
  };

  const handleUsePhoto = () => {
    if (!captured) return;
    // Convert dataURL ke File
    const arr = captured.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const file = new File([u8arr], 'foto-profil.jpg', { type: mime });
    onCapture(file, captured);
  };

  const switchCamera = () => {
    setCaptured(null);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4">
          <h3 className="text-white font-bold text-lg">📷 Ambil Foto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {error ? (
          <div className="p-6 text-center">
            <p className="text-5xl mb-3">🚫</p>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Coba Lagi
            </button>
          </div>
        ) : captured ? (
          /* Preview hasil foto */
          <div className="flex flex-col items-center p-5 gap-4">
            <div className="relative">
              <img
                src={captured}
                alt="Hasil foto"
                className="w-64 h-64 object-cover rounded-full border-4 border-blue-400 shadow-xl"
              />
              <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                ✓ Siap
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setCaptured(null)}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition text-sm"
              >
                🔄 Ulangi
              </button>
              <button
                onClick={handleUsePhoto}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-sm"
              >
                ✅ Gunakan Foto
              </button>
            </div>
          </div>
        ) : (
          /* Live camera */
          <div className="flex flex-col items-center gap-4 pb-5">
            <div className="relative w-full aspect-square bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {/* Overlay canvas frame wajah */}
              {ready && (
                <canvas
                  ref={overlayRef}
                  width={400}
                  height={400}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-sm animate-pulse">Memuat kamera...</div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 px-5 w-full">
              <button
                onClick={switchCamera}
                className="px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition text-sm"
                title="Ganti kamera"
              >
                🔄
              </button>
              <button
                onClick={handleCapture}
                disabled={!ready}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition font-bold"
              >
                📸 Ambil Foto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Halaman Profil Utama ---
function Profil() {
  const cachedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
  })();

  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const navigate = useNavigate();

  // State form profil (inisialisasi dari cache)
  const [formProfil, setFormProfil] = useState({
    name: cachedUser?.name || '',
    email: cachedUser?.email || '',
    no_hp: cachedUser?.no_hp || ''
  });
  const [savingProfil, setSavingProfil] = useState(false);

  // State form password
  const [formPassword, setFormPassword] = useState({ password_lama: '', password: '', password_confirmation: '' });
  const [showPasswords, setShowPasswords] = useState({ lama: false, baru: false, konfirmasi: false });
  const [savingPassword, setSavingPassword] = useState(false);

  // State foto (inisialisasi dari cache)
  const [previewFoto, setPreviewFoto] = useState(cachedUser?.foto ? normalizeFotoUrl(cachedUser.foto) : null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [showKamera, setShowKamera] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user');
        const data = res.data;
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data)); // Perbarui cache
        setFormProfil({ name: data.name || '', email: data.email || '', no_hp: data.no_hp || '' });
        setPreviewFoto(normalizeFotoUrl(data.foto) || null);
      } catch {
        toast.error('Sesi habis, silakan login lagi');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (err) { console.error('Logout error:', err); }
    localStorage.removeItem('token');
    toast.success('Berhasil logout');
    navigate('/login');
  };

  // --- Update profil ---
  const handleSaveProfil = async () => {
    setSavingProfil(true);
    try {
      const res = await api.put('/profil', formProfil);
      setUser(res.data.data);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors).flat()[0];
        toast.error(firstErr || 'Validasi gagal');
      } else {
        toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
      }
    } finally {
      setSavingProfil(false);
    }
  };

  // --- Ganti password ---
  const handleSavePassword = async () => {
    if (formPassword.password !== formPassword.password_confirmation) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/profil/password', formPassword);
      setFormPassword({ password_lama: '', password: '', password_confirmation: '' });
      toast.success('Password berhasil diubah!');
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors).flat()[0];
        toast.error(firstErr || 'Validasi gagal');
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengubah password');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // --- Upload foto (dari file atau kamera) ---
  const uploadFoto = async (file, localPreview) => {
    setPreviewFoto(localPreview);
    setUploadingFoto(true);
    setShowKamera(false);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await api.post('/profil/foto', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const normalizedUrl = normalizeFotoUrl(res.data.data.foto);
      setPreviewFoto(normalizedUrl);
      setUser((prev) => ({ ...prev, foto: normalizedUrl }));
      toast.success('Foto profil berhasil diperbarui!');
    } catch {
      toast.error('Gagal mengupload foto');
      setPreviewFoto(user?.foto || null);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => uploadFoto(file, ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file, dataUrl) => {
    uploadFoto(file, dataUrl);
  };

  const toggleShowPass = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🛒 Laravel POS</h1>
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

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Profil Saya</h1>
          <p className="text-gray-600 mt-1">Kelola informasi akun Anda</p>
        </div>

        {/* --- KARTU FOTO PROFIL --- */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-5">Foto Profil</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg
               bg-blue-50 flex items-center justify-center">
                {uploadingFoto ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-blue-500 mt-1">Uploading...</p>
                  </div>
                ) : previewFoto ? (
                  <img src={previewFoto} alt="Foto profil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-400">{initials}</span>
                )}
              </div>
              {!uploadingFoto && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white w-8 h-8 rounded-full flex 
                  items-center justify-center shadow hover:bg-blue-700 transition text-sm"
                  title="Upload dari galeri"
                >
                  📁
                </button>
              )}
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowKamera(true)}
                disabled={uploadingFoto}
                className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-xl 
                hover:bg-blue-700 disabled:opacity-40 transition font-medium"
              >
                <span className="text-xl">📷</span>
                <span>Ambil Foto dengan Kamera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="flex items-center gap-3 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl 
                hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <span className="text-xl">🖼️</span>
                <span>Upload dari Galeri / File</span>
              </button>
              <p className="text-xs text-gray-400">JPG, PNG, WebP • Maks. 5MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* --- KARTU DATA DIRI --- */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-5">Data Diri</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formProfil.name}
                onChange={(e) => setFormProfil({ ...formProfil, name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formProfil.email}
                onChange={(e) => setFormProfil({ ...formProfil, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
              <input
                type="tel"
                value={formProfil.no_hp}
                onChange={(e) => setFormProfil({ ...formProfil, no_hp: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <button
              onClick={handleSaveProfil}
              disabled={savingProfil}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-medium transition disabled:opacity-40"
            >
              {savingProfil ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </div>

        {/* --- KARTU GANTI PASSWORD --- */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-5">Ganti Password</h2>
          <div className="space-y-4">
            {/* Password lama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
              <div className="relative">
                <input
                  type={showPasswords.lama ? 'text' : 'password'}
                  value={formPassword.password_lama}
                  onChange={(e) => setFormPassword({ ...formPassword, password_lama: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Masukkan password lama"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPass('lama')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPasswords.lama ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Password baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <div className="relative">
                <input
                  type={showPasswords.baru ? 'text' : 'password'}
                  value={formPassword.password}
                  onChange={(e) => setFormPassword({ ...formPassword, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPass('baru')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPasswords.baru ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Indikator kekuatan password */}
              {formPassword.password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const len = formPassword.password.length;
                    const hasUpper = /[A-Z]/.test(formPassword.password);
                    const hasNum = /[0-9]/.test(formPassword.password);
                    const hasSymbol = /[^A-Za-z0-9]/.test(formPassword.password);
                    const strength = (len >= 6 ? 1 : 0) + (len >= 8 ? 1 : 0) + (hasUpper || hasNum ? 1 : 0) + (hasSymbol ? 1 : 0);
                    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
                    return (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${level <= strength ? colors[strength - 1] : 'bg-gray-200'}`}
                      />
                    );
                  })}
                  <span className="text-xs text-gray-400 ml-2">
                    {['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][
                      Math.min(4, (formPassword.password.length >= 6 ? 1 : 0) + (formPassword.password.length >= 8 ? 1 : 0) + 
                      (/[A-Z]/.test(formPassword.password) || /[0-9]/.test(formPassword.password) ? 1 : 0) + 
                      (/[^A-Za-z0-9]/.test(formPassword.password) ? 1 : 0))
                    ]}
                  </span>
                </div>
              )}
            </div>

            {/* Konfirmasi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showPasswords.konfirmasi ? 'text' : 'password'}
                  value={formPassword.password_confirmation}
                  onChange={(e) => setFormPassword({ ...formPassword, password_confirmation: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:outline-none ${
                    formPassword.password_confirmation && formPassword.password !== formPassword.password_confirmation
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Ulangi password baru"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPass('konfirmasi')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPasswords.konfirmasi ? '🙈' : '👁️'}
                </button>
              </div>
              {formPassword.password_confirmation && formPassword.password !== formPassword.password_confirmation && (
                <p className="text-red-500 text-xs mt-1">Password tidak cocok</p>
              )}
            </div>

            <button
              onClick={handleSavePassword}
              disabled={savingPassword || !formPassword.password_lama || !formPassword.password || !formPassword.password_confirmation}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3.5 rounded-2xl font-medium transition disabled:opacity-40"
            >
              {savingPassword ? 'Menyimpan...' : '🔒 Ganti Password'}
            </button>
          </div>
        </div>

        {/* --- INFO AKUN --- */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Info Akun</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">ID Pengguna</p>
              <p className="font-mono font-semibold text-gray-700">#{user?.id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Bergabung Sejak</p>
              <p className="font-semibold text-gray-700">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kamera */}
      {showKamera && (
        <KameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowKamera(false)}
        />
      )}
    </div>
  );
}

export default Profil;
