'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering - prevent static generation
export async function getServerSideProps() {
  return {
    props: {},
  }
}
import { Box, Typography, Grid, Card, CardContent, CardActionArea, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  TableRestaurant as TableIcon,
  Restaurant as RestaurantIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  CheckCircle as CheckCircleIcon,
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
    roles: 0,
    floors: 0,
    menu_types: 0,
    modifier_groups: 0,
    decision_groups: 0,
    menu_items_breakdown: [],
    menu_items_total: 0,
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
        roles: countsData.roles || 0,
        floors: countsData.floors || 0,
        menu_types: countsData.menu_types || 0,
        modifier_groups: countsData.modifier_groups || 0,
        decision_groups: countsData.decision_groups || 0,
        menu_items_breakdown: countsData.menu_items_breakdown || [],
        menu_items_total: countsData.menu_items_total || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard counts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight="bold"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Welcome back, {user?.name || user?.email}!
        </Typography>
        {isSuperAdmin && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Super Admin - Manage Businesses and Users
          </Typography>
        )}
        {!isSuperAdmin && user?.business && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Business: <strong>{user.business.name}</strong>
          </Typography>
        )}
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 1, sm: 2 } }}>
        {isSuperAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={6}>
              <Card>
                <CardActionArea onClick={() => router.push('/super-admin/businesses')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <BusinessIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6"
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                          Businesses
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Create and manage restaurant businesses
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 20 : 24} />
                      ) : (
                        <Typography 
                          variant="h4" 
                          color="primary.main"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                        >
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
                        <PeopleIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6"
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                          Users
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Create and manage user accounts
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 20 : 24} />
                      ) : (
                        <Typography 
                          variant="h4" 
                          color="primary.main"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                        >
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
                        <PeopleIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Employees
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Total employees
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
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
                <CardActionArea onClick={() => router.push('/admin/roles')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SecurityIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Roles
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Employee roles
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
                          {counts.roles}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/floor-table-management')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <TableIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Floor & Table
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Total floors
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
                          {counts.floors}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/menu-management')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <RestaurantIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                          <Typography 
                            variant="h6" 
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                          >
                            Menu Items
                          </Typography>
                        </Box>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Box>
                          {counts.menu_items_breakdown && counts.menu_items_breakdown.length > 0 ? (
                            counts.menu_items_breakdown.map((menu, index) => (
                              <Box key={menu.menu_id || index} sx={{ mb: 0.5 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  {menu.menu_name}: <strong>{menu.count}</strong>
                                </Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography 
                              variant="h3" 
                              color="primary.main" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                            >
                              {counts.menu_items_total}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/categories')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <CategoryIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Categories
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Menu types
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
                          {counts.menu_types}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/modifier-groups')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <TuneIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Modifier Groups
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Total modifier groups
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
                          {counts.modifier_groups}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/decision-groups')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <CheckCircleIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Decision Groups
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          Total decision groups
                        </Typography>
                      </Box>
                      {loading ? (
                        <CircularProgress size={isMobile ? 24 : 32} />
                      ) : (
                        <Typography 
                          variant="h3" 
                          color="primary.main" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                        >
                          {counts.decision_groups}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => router.push('/admin/settings')} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <SettingsIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main', mb: 1 }} />
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
                        >
                          Settings
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          System settings
                        </Typography>
                      </Box>
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

