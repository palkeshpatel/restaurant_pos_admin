'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, CardActionArea, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  CheckCircle as ClosedOrderIcon,
  RadioButtonUnchecked as OpenOrderIcon,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isSuperAdmin = user?.is_super_admin
  const [businessCount, setBusinessCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Business Admin counts
  const [counts, setCounts] = useState({
    employees: 0,
    orders: 0,
    openOrders: 0,
    closedOrders: 0,
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
      const response = await api.get('/admin/dashboard/counts')
      const countsData = response.data.data || response.data || {}
      
      setCounts({
        employees: countsData.employees || 0,
        orders: countsData.orders || 0,
        openOrders: countsData.open_orders || 0,
        closedOrders: countsData.closed_orders || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard counts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome back, {user?.name || user?.email}!
        </Typography>
        {isSuperAdmin && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Super Admin - Manage Businesses and Users
          </Typography>
        )}
        {!isSuperAdmin && user?.business && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Business: <strong>{user.business.name}</strong>
          </Typography>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {isSuperAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={6}>
              <Card>
                <CardActionArea onClick={() => router.push('/super-admin/businesses')}>
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
                <CardActionArea onClick={() => router.push('/super-admin/users')}>
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
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/employees')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Employees</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total employees
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={32} />
                      ) : (
                        <Typography variant="h3" color="primary.main" fontWeight="bold">
                          {counts.employees}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <OrderIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Total Orders</Typography>
                        <Typography variant="body2" color="text.secondary">
                          All orders
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={32} />
                      ) : (
                        <Typography variant="h3" color="info.main" fontWeight="bold">
                          {counts.orders}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                <CardActionArea sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <OpenOrderIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Open Orders</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active orders
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={32} />
                      ) : (
                        <Typography variant="h3" color="success.main" fontWeight="bold">
                          {counts.openOrders}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'grey.400' }}>
                <CardActionArea sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <ClosedOrderIcon sx={{ fontSize: 48, color: 'grey.600', mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Closed Orders</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed orders
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={32} />
                      ) : (
                        <Typography variant="h3" color="grey.600" fontWeight="bold">
                          {counts.closedOrders}
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

