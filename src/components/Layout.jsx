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
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme,
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
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const drawerWidth = 240

export default function Layout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuManagementOpen, setMenuManagementOpen] = useState(true)

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

  const menuManagementItems = [
    { text: 'Menu Management', icon: <RestaurantIcon />, path: '/admin/menu-management' },
  ]

  const isMenuManagementActive = menuManagementItems.some(
    (item) => pathname === item.path
  )

  // Auto-open menu management if on one of its pages
  useEffect(() => {
    if (isMenuManagementActive && !menuManagementOpen) {
      setMenuManagementOpen(true)
    }
  }, [pathname, isMenuManagementActive, menuManagementOpen])

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
        { text: 'Permissions', icon: <SecurityIcon />, path: '/admin/permissions' },
        { text: 'Discount Reasons', icon: <SecurityIcon />, path: '/admin/discount-reasons' },
        { text: 'Floors', icon: <TableIcon />, path: '/admin/floors' },
        { text: 'Tables', icon: <TableIcon />, path: '/admin/tables' },
        { text: 'Menus', icon: <RestaurantIcon />, path: '/admin/menus' },
        { text: 'Tax Rates', icon: <SecurityIcon />, path: '/admin/tax-rates' },
        { text: 'Printers', icon: <SecurityIcon />, path: '/admin/printers' },
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
    <Box>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  router.push(item.path)
                  if (isMobile) {
                    setMobileOpen(false)
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          
          {!isSuperAdmin && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isMenuManagementActive}
                  onClick={() => setMenuManagementOpen(!menuManagementOpen)}
                >
                  <ListItemIcon>
                    <RestaurantIcon />
                  </ListItemIcon>
                  <ListItemText primary="Menu Management" />
                  {menuManagementOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={menuManagementOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {menuManagementItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        selected={pathname === item.path}
                        onClick={() => {
                          router.push(item.path)
                          if (isMobile) {
                            setMobileOpen(false)
                          }
                        }}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </>
          )}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restaurant POS Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name || user?.email}
            </Typography>
            <Avatar
              sx={{ cursor: 'pointer', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
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
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
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
              width: drawerWidth,
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
              width: drawerWidth,
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
          bgcolor: 'background.default',
          p: { xs: 1, sm: 2, md: 3 },
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}


