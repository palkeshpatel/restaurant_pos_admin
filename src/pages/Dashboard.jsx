import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, Paper, CardActionArea, CircularProgress } from '@mui/material'
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  Security as SecurityIcon,
  LocalOffer as DiscountIcon,
  Layers as FloorIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSuperAdmin = user?.is_super_admin
  const [businessCount, setBusinessCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Business Admin counts
  const [counts, setCounts] = useState({
    employees: 0,
    roles: 0,
    permissions: 0,
    discountReasons: 0,
    floors: 0,
    tables: 0,
    menus: 0,
    menuCategories: 0,
    menuItems: 0,
    modifierGroups: 0,
    modifiers: 0,
    taxRates: 0,
    printers: 0,
  })

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSuperAdminCounts()
    } else {
      fetchBusinessAdminCounts()
    }
  }, [isSuperAdmin])

  const fetchSuperAdminCounts = async () => {
    try {
      const [businessesResponse, usersResponse] = await Promise.all([
        api.get('/super-admin/businesses'),
        api.get('/super-admin/users'),
      ])
      
      const businesses = businessesResponse.data.data?.data || businessesResponse.data.data || []
      const users = usersResponse.data.data?.data || usersResponse.data.data || []
      
      setBusinessCount(businesses.length || businessesResponse.data.data?.total || 0)
      setUserCount(users.length || usersResponse.data.data?.total || 0)
    } catch (error) {
      console.error('Error fetching counts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessAdminCounts = async () => {
    try {
      const [
        employeesRes,
        rolesRes,
        permissionsRes,
        discountReasonsRes,
        floorsRes,
        tablesRes,
        menusRes,
        menuCategoriesRes,
        menuItemsRes,
        modifierGroupsRes,
        modifiersRes,
        taxRatesRes,
        printersRes,
      ] = await Promise.all([
        api.get('/admin/employees').catch(() => ({ data: { data: [] } })),
        api.get('/admin/roles').catch(() => ({ data: { data: [] } })),
        api.get('/admin/permissions').catch(() => ({ data: { data: [] } })),
        api.get('/admin/discount-reasons').catch(() => ({ data: { data: [] } })),
        api.get('/admin/floors').catch(() => ({ data: { data: [] } })),
        api.get('/admin/tables').catch(() => ({ data: { data: [] } })),
        api.get('/admin/menus').catch(() => ({ data: { data: [] } })),
        api.get('/admin/menu-categories').catch(() => ({ data: { data: [] } })),
        api.get('/admin/menu-items').catch(() => ({ data: { data: [] } })),
        api.get('/admin/modifier-groups').catch(() => ({ data: { data: [] } })),
        api.get('/admin/modifiers').catch(() => ({ data: { data: [] } })),
        api.get('/admin/taxes').catch(() => ({ data: { data: [] } })),
        api.get('/admin/printers').catch(() => ({ data: { data: [] } })),
      ])

      const getCount = (response) => {
        const data = response.data.data?.data || response.data.data || []
        return data.length || response.data.data?.total || 0
      }

      setCounts({
        employees: getCount(employeesRes),
        roles: getCount(rolesRes),
        permissions: getCount(permissionsRes),
        discountReasons: getCount(discountReasonsRes),
        floors: getCount(floorsRes),
        tables: getCount(tablesRes),
        menus: getCount(menusRes),
        menuCategories: getCount(menuCategoriesRes),
        menuItems: getCount(menuItemsRes),
        modifierGroups: getCount(modifierGroupsRes),
        modifiers: getCount(modifiersRes),
        taxRates: getCount(taxRatesRes),
        printers: getCount(printersRes),
      })
    } catch (error) {
      console.error('Error fetching business admin counts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name || user?.email}!
      </Typography>
      {isSuperAdmin && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Super Admin - Manage Businesses and Users
        </Typography>
      )}
      {!isSuperAdmin && user?.business && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Business: {user.business.name}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {isSuperAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={6}>
              <Card>
                <CardActionArea onClick={() => navigate('/super-admin/businesses')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Businesses</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create and manage restaurant businesses
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {businessCount}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Card>
                <CardActionArea onClick={() => navigate('/super-admin/users')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Users</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create and manage user accounts
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {userCount}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/employees')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Employees</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage employees
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.employees}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/roles')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Roles</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage roles
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.roles}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/permissions')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Permissions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage permissions
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.permissions}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/discount-reasons')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <DiscountIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Discount Reasons</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage discounts
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.discountReasons}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/floors')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <FloorIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Floors</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage floors
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.floors}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/tables')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <TableIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Tables</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage tables
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.tables}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/menus')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <MenuBookIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Menus</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage menus
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.menus}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/menu-categories')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <CategoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Menu Categories</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage categories
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.menuCategories}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/menu-items')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <RestaurantIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Menu Items</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage menu items
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.menuItems}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/modifier-groups')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Modifier Groups</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage modifier groups
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.modifierGroups}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/modifiers')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Modifiers</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage modifiers
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.modifiers}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/tax-rates')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Tax Rates</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage tax rates
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.taxRates}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardActionArea onClick={() => navigate('/admin/printers')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <PrintIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">Printers</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Manage printers
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography variant="h4" color="primary.main">
                          {counts.printers}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  )
}

