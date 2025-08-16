import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Index from './pages/Index.tsx'
import PersonalDetails from './pages/PersonalDetails.tsx'
import Education from './pages/Education.tsx'
import Family from './pages/Family.tsx'
import Leave from './pages/Leave.tsx'
import Medical from './pages/Medical.tsx'
import Salary from './pages/Salary.tsx'
import Others from './pages/Others.tsx'
import NotFound from './pages/NotFound.tsx'
import { Toaster } from './components/ui/toaster'
import './App.css'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import ManagerDashboard from './pages/ManagerDashboard.tsx'
import Logout from './pages/Logout.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import RequireAuth from './components/auth/RequireAuth.tsx'
import RequireRole from './components/auth/RequireRole.tsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin - No Layout wrapper */}
        <Route path="/admin-dashboard" element={
          <RequireAuth>
            <RequireRole role="ADMIN">
              <AdminDashboard />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="MANAGER">
                <ManagerDashboard />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />

        {/* User routes with Layout wrapper */}
        <Route path="/" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Index />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/personal-details" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <PersonalDetails />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/education" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Education />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/family" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Family />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/leave" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Leave />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/medical" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Medical />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/salary" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Salary />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />
        <Route path="/others" element={
          <Layout>
            <RequireAuth>
              <RequireRole role="USER">
                <Others />
              </RequireRole>
            </RequireAuth>
          </Layout>
        } />

        {/* Logout */}
        <Route path="/logout" element={
          <Layout>
            <RequireAuth>
              <Logout />
            </RequireAuth>
          </Layout>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

export default App
