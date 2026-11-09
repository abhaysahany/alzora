import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { BusinessPlanPage } from './pages/BusinessPlanPage'
import { FaqPage } from './pages/FaqPage'
import { LoginPage } from './pages/LoginPage'
import { UserLookupPage } from './pages/UserLookupPage'
import { UserDetailsPage } from './pages/UserDetailsPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { PackagesPage } from './pages/PackagesPage'
import { EarningsPage } from './pages/EarningsPage'
import { IncomeHistoryPage } from './pages/IncomeHistoryPage'
import { RanksPage } from './pages/RanksPage'
import { SwapPage } from './pages/SwapPage'
import { ReferralPage } from './pages/ReferralPage'
import { TeamPage } from './pages/TeamPage'
import { HistoryPage } from './pages/HistoryPage'
import { TreePage } from './pages/TreePage'
import { WithdrawalPage } from './pages/WithdrawalPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminMembersPage } from './pages/admin/AdminMembersPage'
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage'
import { AdminIncomePage } from './pages/admin/AdminIncomePage'
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage'
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage'
import { AdminControlsPage } from './pages/admin/AdminControlsPage'
import { AdminTreePage } from './pages/admin/AdminTreePage'
import { ReferralListener } from './components/ReferralListener'

export default function App() {
  return (
    <Router>
      <ReferralListener />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/business-plan" element={<BusinessPlanPage />} />
        <Route path="/faqs" element={<FaqPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lookup" element={<UserLookupPage />} />
        <Route path="/user-lookup" element={<UserLookupPage />} />
        <Route path="/user-details/:id" element={<UserDetailsPage />} />
        <Route path="/user/:id" element={<UserDetailsPage />} />
        <Route path="/member/:id" element={<UserDetailsPage />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages"
          element={
            <ProtectedRoute>
              <PackagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <EarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-history"
          element={
            <ProtectedRoute>
              <IncomeHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranks"
          element={
            <ProtectedRoute>
              <RanksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swap"
          element={
            <ProtectedRoute>
              <SwapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute>
              <ReferralPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tree"
          element={
            <ProtectedRoute>
              <TreePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdrawal"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/withdraw"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* ADMIN PROTECTED ROUTES */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <AdminProtectedRoute>
              <AdminMembersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tree"
          element={
            <AdminProtectedRoute>
              <AdminTreePage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <AdminProtectedRoute>
              <AdminPackagesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/income"
          element={
            <AdminProtectedRoute>
              <AdminIncomePage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminProtectedRoute>
              <AdminWithdrawalsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <AdminProtectedRoute>
              <AdminTransactionsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/controls"
          element={
            <AdminProtectedRoute>
              <AdminControlsPage />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
