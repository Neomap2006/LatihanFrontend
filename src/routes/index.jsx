import {Routes, Route, Navigate} from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProdukList from '../pages/ProdukList';
import POSPage from '../pages/POSPage';
import Pelanggan from '../pages/Pelanggan';
import Pesanan from '../pages/Pesanan';
import PembelianList from '../pages/PembelianList';
import Profile from '../pages/Profile';

function MainRoutes(){
    return(
        <Routes>
            <Route path="/" element={<Navigate to="/Login" />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            
            {/* Standard routes */}
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Produk" element={<ProdukList />} />
            <Route path="/Pelanggan" element={<Pelanggan />} />
            <Route path="/pesanan" element={<Pesanan />} />
            <Route path="/pembelian" element={<PembelianList />} />

            {/* Case-specific routes from instruction image */}
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/ProdukList" element={<ProdukList />} />

            {/* Nanti kita tambahkan route lain (order, profile, dll) */}                    
            <Route path="/Pos" element={<POSPage />} />
            <Route path="/Profile" element={<Profile />} />
        </Routes>           
    );
}

export default MainRoutes;
