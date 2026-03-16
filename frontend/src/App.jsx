import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Currencies from './pages/Currencies'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Monitor from './pages/Monitor'
import Appearance from './pages/Appearance'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-lg">載入中...</div></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="currencies" element={<Currencies />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="appearance" element={<Appearance />} />
            <Route path="monitor" element={<AdminRoute><Monitor /></AdminRoute>} />
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
          </Route>
        </Routes>
      </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
