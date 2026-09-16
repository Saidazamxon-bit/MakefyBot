import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { RequireGuest, RequireUser, RequireAdmin } from './components/Guards';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import MyBots from './pages/MyBots';
import BotDetail from './pages/BotDetail';
import ManageBot from './pages/ManageBot';
import Create from './pages/Create';
import KunlikTolov from './pages/KunlikTolov';
import Tariflar from './pages/Tariflar';
import Deposit from './pages/Deposit';
import Balance from './pages/Balance';
import Referal from './pages/Referal';
import PulIshlash from './pages/PulIshlash';
import Chat from './pages/Chat';
import Sozlamalar from './pages/Sozlamalar';
import ComingSoon from './components/ComingSoon';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTariflar from './pages/admin/AdminTariflar';
import AdminPromokodlar from './pages/admin/AdminPromokodlar';
import AdminKanallar from './pages/admin/AdminKanallar';
import AdminTurlar from './pages/admin/AdminTurlar';
import AdminSorovlar from './pages/admin/AdminSorovlar';
import AdminChat from './pages/admin/AdminChat';
import AdminChatSuhbat from './pages/admin/AdminChatSuhbat';

export default function App() {
  return (
    <Routes>
      {/* Mehmon (login qilinmagan) sahifalar */}
      <Route
        path="/login"
        element={
          <RequireGuest>
            <Login />
          </RequireGuest>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RequireGuest>
            <ForgotPassword />
          </RequireGuest>
        }
      />

      {/* Login qilingan foydalanuvchi sahifalari — umumiy Layout (TopBar+BottomNav) bilan */}
      <Route
        element={
          <RequireUser>
            <Layout />
          </RequireUser>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/bots" element={<MyBots />} />
        <Route path="/bots/:username" element={<BotDetail />} />
        <Route path="/bots/:username/manage" element={<ManageBot />} />
        <Route path="/bots/:username/kunlik" element={<KunlikTolov />} />
        <Route path="/create" element={<Create />} />
        <Route path="/vazifalar" element={<PulIshlash />} />
        <Route path="/referal" element={<Referal />} />
        <Route path="/profil" element={<Balance />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/tariflar" element={<Tariflar />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/sozlamalar" element={<Sozlamalar />} />
      </Route>

      {/* Admin sahifalari — alohida AdminLayout bilan */}
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/sorovlar" element={<AdminSorovlar />} />
        <Route path="/admin/chat" element={<AdminChat />} />
        <Route path="/admin/chat/:uid" element={<AdminChatSuhbat />} />
        <Route path="/admin/tariflar" element={<AdminTariflar />} />
        <Route path="/admin/promokodlar" element={<AdminPromokodlar />} />
        <Route path="/admin/kanallar" element={<AdminKanallar />} />
        <Route path="/admin/turlar" element={<AdminTurlar />} />
      </Route>

      <Route path="*" element={<ComingSoon title="Sahifa topilmadi" icon="fa-circle-question" />} />
    </Routes>
  );
}
