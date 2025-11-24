import { Outlet, useNavigate, useLocation } from 'react-router-dom'
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

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
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
    { text: 'Menu Categories', icon: <RestaurantIcon />, path: '/admin/menu-categories' },
    { text: 'Menu Items', icon: <RestaurantIcon />, path: '/admin/menu-items' },
    { text: 'Modifier Groups', icon: <RestaurantIcon />, path: '/admin/modifier-groups' },
    { text: 'Modifiers', icon: <RestaurantIcon />, path: '/admin/modifiers' },
    { text: 'Decision Groups', icon: <SecurityIcon />, path: '/admin/decision-groups' },
    { text: 'Decisions', icon: <SecurityIcon />, path: '/admin/decisions' },
  ]

  const isMenuManagementActive = menuManagementItems.some(
    (item) => location.pathname === item.path
  )

  // Auto-open menu management if on one of its pages
  useEffect(() => {
    if (isMenuManagementActive && !menuManagementOpen) {
      setMenuManagementOpen(true)
    }
  }, [location.pathname, isMenuManagementActive, menuManagementOpen])

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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    handleMenuClose()
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <MenuIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restaurant POS Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name || user?.email}</Typography>
            <Avatar
              sx={{ cursor: 'pointer' }}
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
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
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
                          selected={location.pathname === item.path}
                          onClick={() => navigate(item.path)}
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
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}


