import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SuperAdminBusinesses from './pages/SuperAdmin/Businesses'
import SuperAdminUsers from './pages/SuperAdmin/Users'
import AdminEmployees from './pages/Admin/Employees'
import AdminRoles from './pages/Admin/Roles'
import AdminPermissions from './pages/Admin/Permissions'
import AdminDiscountReasons from './pages/Admin/DiscountReasons'
import AdminFloors from './pages/Admin/Floors'
import AdminTables from './pages/Admin/Tables'
import AdminMenus from './pages/Admin/Menus'
import AdminMenuCategories from './pages/Admin/MenuCategories'
import AdminMenuItems from './pages/Admin/MenuItems'
import AdminModifierGroups from './pages/Admin/ModifierGroups'
import AdminModifiers from './pages/Admin/Modifiers'
import AdminDecisionGroups from './pages/Admin/DecisionGroups'
import AdminDecisions from './pages/Admin/Decisions'
import AdminTaxRates from './pages/Admin/TaxRates'
import AdminPrinters from './pages/Admin/Printers'
import AdminSettings from './pages/Admin/Settings'
import AdminDailySummaryReport from './pages/Admin/DailySummaryReport'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return user ? children : <Navigate to="/login" />
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (!user.is_super_admin) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Super Admin Routes */}
        <Route
          path="super-admin/businesses"
          element={
            <SuperAdminRoute>
              <SuperAdminBusinesses />
            </SuperAdminRoute>
          }
        />
        <Route
          path="super-admin/users"
          element={
            <SuperAdminRoute>
              <SuperAdminUsers />
            </SuperAdminRoute>
          }
        />

        {/* Business Admin Routes */}
        <Route path="admin/employees" element={<AdminEmployees />} />
        <Route path="admin/roles" element={<AdminRoles />} />
        <Route path="admin/permissions" element={<AdminPermissions />} />
        <Route path="admin/discount-reasons" element={<AdminDiscountReasons />} />
        <Route path="admin/floors" element={<AdminFloors />} />
        <Route path="admin/tables" element={<AdminTables />} />
        <Route path="admin/menus" element={<AdminMenus />} />
        <Route path="admin/menu-categories" element={<AdminMenuCategories />} />
        <Route path="admin/menu-items" element={<AdminMenuItems />} />
        <Route path="admin/modifier-groups" element={<AdminModifierGroups />} />
        <Route path="admin/modifiers" element={<AdminModifiers />} />
        <Route path="admin/decision-groups" element={<AdminDecisionGroups />} />
        <Route path="admin/decisions" element={<AdminDecisions />} />
        <Route path="admin/tax-rates" element={<AdminTaxRates />} />
        <Route path="admin/printers" element={<AdminPrinters />} />
        <Route path="admin/reports/daily-summary" element={<AdminDailySummaryReport />} />
        <Route path="admin/settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App


