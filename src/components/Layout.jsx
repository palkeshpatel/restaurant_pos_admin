'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  TableRestaurant as TableIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  CheckCircle as CheckCircleIcon,
  Fastfood as FastfoodIcon,
  Assessment as AssessmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 250
const drawerWidthCollapsed = 70

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Check if user is super admin - handle both boolean true and string "1" or number 1
  const isSuperAdmin = 
    user?.is_super_admin === true || 
    user?.is_super_admin === 1 || 
    user?.is_super_admin === '1' ||
    user?.is_super_admin === 'true'

  // Debug: Log user data to console
  if (user) {
    console.log('Current User:', user)
    console.log('is_super_admin value:', user?.is_super_admin)
    console.log('isSuperAdmin calculated:', isSuperAdmin)
  }

  // Check if menu should be expanded based on current path
  useEffect(() => {
    if (sidebarCollapsed) {
      setMenuOpen(false)
      setReportsMenuOpen(false)
      return
    }
    const menuPaths = ['/admin/menu-management', '/admin/modifier-groups', '/admin/decision-groups', '/admin/menu-items', '/admin/categories']
    if (menuPaths.some(path => pathname.startsWith(path))) {
      setMenuOpen(true)
    }
    const reportsPaths = ['/admin/reports']
    if (reportsPaths.some(path => pathname.startsWith(path))) {
      setReportsMenuOpen(true)
    }
  }, [pathname, sidebarCollapsed])

  const menuItems = isSuperAdmin
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Businesses', icon: <BusinessIcon />, path: '/super-admin/businesses' },
        { text: 'Users', icon: <PeopleIcon />, path: '/super-admin/users' },
      ]
    : [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/admin/employees' },
        { text: 'Roles', icon: <SecurityIcon />, path: '/admin/roles' },
        { text: 'Floor & Table Management', icon: <TableIcon />, path: '/admin/floor-table-management' },
        {
          text: 'Menu Management',
          icon: <RestaurantIcon />,
          path: null,
          children: [
            { text: 'Pad View', icon: <MenuBookIcon />, path: '/admin/menu-management' },
            { text: 'Category', icon: <CategoryIcon />, path: '/admin/categories' },
            { text: 'Modifier Group', icon: <TuneIcon />, path: '/admin/modifier-groups' },
            { text: 'Decision Group', icon: <CheckCircleIcon />, path: '/admin/decision-groups' },
            { text: 'Menu Item', icon: <FastfoodIcon />, path: '/admin/menu-items' },
          ],
        },
        {
          text: 'Reports',
          icon: <AssessmentIcon />,
          path: null,
          children: [
            { text: 'Daily Summary Report', icon: <AssessmentIcon />, path: '/admin/reports/daily-summary' },
            { text: 'Order Agent Activity Report', icon: <AssessmentIcon />, path: '/admin/reports/order-agent-activity' },
          ],
        },
        { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
      ]

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    handleMenuClose()
  }


  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          padding: { xs: '0.875rem', sm: '1rem' },
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        {!sidebarCollapsed && (
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.125rem',
              whiteSpace: 'nowrap',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            Restaurant POS
          </Typography>
        )}
        <IconButton
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          sx={{
            color: 'white',
            padding: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            },
            transition: 'background-color 0.2s ease',
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      {/* Navigation Menu */}
      <Box sx={{ 
        overflowY: 'auto', 
        overflowX: 'hidden',
        flex: 1, 
        position: 'relative', 
        zIndex: 2,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.4)',
        },
      }}>
        <List sx={{ padding: '0.5rem 0', backgroundColor: 'transparent' }}>
          {menuItems.map((item) => {
            if (item.children) {
              // Nested menu item
              const isMenuManagement = item.text === 'Menu Management'
              const isReports = item.text === 'Reports'
              const isOpen = !sidebarCollapsed && (isMenuManagement ? menuOpen : (isReports ? reportsMenuOpen : false))
              const setOpen = isMenuManagement ? setMenuOpen : (isReports ? setReportsMenuOpen : () => {})
              
              return (
                <Box key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (sidebarCollapsed) {
                          // If sidebar is collapsed, expand it and open the menu
                          setSidebarCollapsed(false)
                          setOpen(true)
                        } else {
                          setOpen(!isOpen)
                        }
                      }}
                      sx={{
                        color: 'white',
                        padding: sidebarCollapsed ? '0.5rem 0' : '0.5rem 1rem',
                        margin: sidebarCollapsed ? '0.15rem 0.5rem' : '0.15rem 0.75rem',
                        borderRadius: '8px',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          transform: sidebarCollapsed ? 'scale(1.05)' : 'translateX(5px)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.35)',
                          },
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                          minWidth: sidebarCollapsed ? 'auto' : '40px',
                          marginRight: sidebarCollapsed ? 0 : '0.75rem',
                          justifyContent: 'center',
                        },
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      {!sidebarCollapsed && <ListItemText primary={item.text} />}
                      {!sidebarCollapsed && (isOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />)}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={isOpen && !sidebarCollapsed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <ListItem key={child.text} disablePadding>
                          <ListItemButton
                            selected={pathname === child.path}
                            onClick={() => {
                              router.push(child.path)
                              if (isMobile) {
                                setMobileOpen(false)
                              }
                            }}
                            sx={{
                              pl: sidebarCollapsed ? 0 : 3,
                              padding: sidebarCollapsed ? '0.5rem 0' : '0.5rem 1rem',
                              margin: sidebarCollapsed ? '0.15rem 0.5rem' : '0.15rem 0.75rem',
                              borderRadius: '8px',
                              color: 'white',
                              fontSize: '0.9rem',
                              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                transform: sidebarCollapsed ? 'scale(1.05)' : 'none',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                fontWeight: 600,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                },
                              },
                              '& .MuiListItemIcon-root': {
                                color: 'white',
                                minWidth: sidebarCollapsed ? 'auto' : '32px',
                                marginRight: sidebarCollapsed ? 0 : '0.75rem',
                                justifyContent: 'center',
                                '& svg': {
                                  fontSize: '1rem',
                                },
                              },
                            }}
                          >
                            <ListItemIcon>{child.icon}</ListItemIcon>
                            {!sidebarCollapsed && <ListItemText primary={child.text} />}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )
            } else {
              // Regular menu item
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={pathname === item.path}
                    onClick={() => {
                      router.push(item.path)
                      if (isMobile) {
                        setMobileOpen(false)
                      }
                    }}
                    sx={{
                      color: 'white',
                      padding: sidebarCollapsed ? '0.5rem 0' : '0.5rem 1rem',
                      margin: sidebarCollapsed ? '0.15rem 0.5rem' : '0.15rem 0.75rem',
                      borderRadius: '8px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: sidebarCollapsed ? 'scale(1.05)' : 'translateX(5px)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.35)',
                        },
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                        minWidth: sidebarCollapsed ? 'auto' : '40px',
                        marginRight: sidebarCollapsed ? 0 : '0.75rem',
                        justifyContent: 'center',
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    {!sidebarCollapsed && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </ListItem>
              )
            }
          })}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        backgroundImage: 'url(/restaurant-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${sidebarCollapsed ? drawerWidthCollapsed : drawerWidth}px)` },
          ml: { md: `${sidebarCollapsed ? drawerWidthCollapsed : drawerWidth}px` },
          transition: 'margin-left 0.3s ease, width 0.3s ease',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 64 },
            padding: { xs: '0 16px', sm: '0 24px' },
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'white',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600,
              color: 'white',
              letterSpacing: '0.5px',
            }}
          >
            Restaurant POS Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { sm: '0.875rem', md: '0.9375rem' },
                maxWidth: { sm: 150, md: 200 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'white',
                fontWeight: 500,
              }}
            >
              {user?.name || user?.email}
            </Typography>
            <Avatar
              sx={{ 
                cursor: 'pointer', 
                width: { xs: 36, sm: 40 }, 
                height: { xs: 36, sm: 40 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                },
              }}
              onClick={handleMenuOpen}
              src={user?.avatar}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { md: sidebarCollapsed ? drawerWidthCollapsed : drawerWidth }, 
          flexShrink: { md: 0 },
          transition: 'width 0.3s ease',
        }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarCollapsed ? drawerWidthCollapsed : drawerWidth,
              backgroundColor: 'rgba(255, 153, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              overflowY: 'hidden',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarCollapsed ? drawerWidthCollapsed : drawerWidth,
              backgroundColor: 'rgba(255, 153, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              overflowY: 'hidden',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          minHeight: '100vh',
          width: { 
            xs: '100%',
            md: `calc(100% - ${sidebarCollapsed ? drawerWidthCollapsed : drawerWidth}px)` 
          },
          mt: { xs: 0, md: 0 },
          transition: 'width 0.3s ease',
          position: 'relative',
          zIndex: 0,
          backgroundColor: 'white',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        {children}
      </Box>

    </Box>
  )
}


