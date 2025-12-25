'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Checkbox,
  Snackbar,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function MenuItems() {
  const [loading, setLoading] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [allMenuItems, setAllMenuItems] = useState([]) // Store all items for filtering
  const [menus, setMenus] = useState([])
  const [menuTypes, setMenuTypes] = useState([])
  const [allCategories, setAllCategories] = useState([]) // All categories including sub-categories
  const [parentCategories, setParentCategories] = useState([]) // Parent categories for selected menu
  const [subCategories, setSubCategories] = useState([]) // Sub-categories for selected parent
  const [selectedMenuId, setSelectedMenuId] = useState(null)
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all') // Filter by category
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    menu_category_id: '',
    menu_type_id: '',
    description: '',
    price_cash: 0,
    is_active: true,
    is_open_item: false,
    parent_category_id: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [useModifier, setUseModifier] = useState(true) // true = Modifier, false = Decision
  const [selectedModifierGroups, setSelectedModifierGroups] = useState([])
  const [selectedDecisionGroups, setSelectedDecisionGroups] = useState([])
  const [availableModifierGroups, setAvailableModifierGroups] = useState([])
  const [availableDecisionGroups, setAvailableDecisionGroups] = useState([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    fetchMenus()
    fetchMenuTypes()
    fetchModifierAndDecisionGroups()
    fetchCategories()
    // Load all menu items on initial load (including NULL category items)
    fetchMenuItems()
  }, [])

  useEffect(() => {
    if (selectedMenuId) {
      // Filter parent categories (no parent_id) for selected menu
      const parents = allCategories.filter(
        cat => (!cat.parent_id || cat.parent_id === null) && cat.menu_id == selectedMenuId
      )
      setParentCategories(parents)
    } else {
      setParentCategories([])
    }
  }, [selectedMenuId, allCategories])

  useEffect(() => {
    if (selectedMenuId && selectedParentCategoryId) {
      // Filter sub-categories for selected parent category
      const subs = allCategories.filter(
        cat => cat.parent_id == selectedParentCategoryId && cat.menu_id == selectedMenuId
      )
      setSubCategories(subs)
      // Clear subcategory selection if parent changes
      if (formData.menu_category_id && !subs.find(sub => sub.id == formData.menu_category_id)) {
        setFormData({ ...formData, menu_category_id: '' })
      }
    } else {
      setSubCategories([])
      setFormData({ ...formData, menu_category_id: '' })
    }
  }, [selectedMenuId, selectedParentCategoryId, allCategories])

  const fetchModifierAndDecisionGroups = async () => {
    try {
      const [modifierGroupsRes, decisionGroupsRes] = await Promise.all([
        api.get('/admin/modifier-groups', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/decision-groups', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
      ])
      
      const modifierData = modifierGroupsRes.data.data?.data || modifierGroupsRes.data.data || []
      const decisionData = decisionGroupsRes.data.data?.data || decisionGroupsRes.data.data || []
      
      setAvailableModifierGroups(Array.isArray(modifierData) ? modifierData : [])
      setAvailableDecisionGroups(Array.isArray(decisionData) ? decisionData : [])
    } catch (error) {
      console.error('Error fetching modifier/decision groups:', error)
    }
  }

  useEffect(() => {
    // Always fetch menu items - if no menu selected, show all items (including NULL category items)
    fetchMenuItems()
  }, [selectedMenuId])

  useEffect(() => {
    // Apply category filter when it changes
    if (allMenuItems.length > 0) {
      applyCategoryFilter(allMenuItems, selectedCategoryFilter)
    }
  }, [selectedCategoryFilter])

  const applyCategoryFilter = (items, categoryFilter) => {
    if (categoryFilter === 'all') {
      setMenuItems(items)
    } else {
      const filtered = items.filter(item => item.menu_type_id == categoryFilter)
      setMenuItems(filtered)
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await api.get('/admin/menus', { params: { per_page: 1000 } })
      const menusData = response.data.data?.data || response.data.data || []
      setMenus(menusData)
      // Auto-select first menu if available and no menu is selected
      if (menusData.length > 0 && !selectedMenuId) {
        setSelectedMenuId(menusData[0].id)
      }
    } catch (error) {
      console.error('Error fetching menus:', error)
    }
  }

  const fetchMenuTypes = async () => {
    try {
      const response = await api.get('/admin/menu-types', { params: { per_page: 1000 } })
      const typesData = response.data.data?.data || response.data.data || []
      setMenuTypes(typesData)
    } catch (error) {
      console.error('Error fetching menu types:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/menu-categories', { params: { per_page: 1000 } })
      const categoriesData = response.data.data?.data || response.data.data || []
      setAllCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchMenuItems = async () => {
    // Don't fetch if no menu is selected
    if (!selectedMenuId) {
      setMenuItems([])
      setAllMenuItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      // API call - always require menu_id now
      const params = {
        per_page: 1000,
        menu_id: selectedMenuId,
      }
      
      const response = await api.get('/admin/menu-items', { params })
      
      console.log('Menu Items API Response:', response.data)
      
      // Handle different response structures
      let itemsData = []
      if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          itemsData = response.data.data
        } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
          itemsData = response.data.data.data
        }
      }
      
      console.log('Parsed Menu Items:', itemsData)
      
      // Data already includes modifier_groups and decision_groups from API
      setAllMenuItems(itemsData)
      // Apply category filter
      applyCategoryFilter(itemsData, selectedCategoryFilter)
    } catch (error) {
      console.error('Error fetching menu items:', error)
      console.error('Error response:', error.response?.data)
      setError(error.response?.data?.message || 'Failed to load menu items')
      setMenuItems([])
      setAllMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setSelectedParentCategoryId(null)
    setFormData({
      name: '',
      menu_id: selectedMenuId || '', // Include menu_id
      menu_category_id: '',
      menu_type_id: '',
      description: '',
      price_cash: 0,
      is_active: true,
      is_open_item: false,
      parent_category_id: '',
    })
    setUseModifier(true)
    setSelectedModifierGroups([])
    setSelectedDecisionGroups([])
    setError('')
    setOpenDialog(true)
  }

  const handleOpenEdit = async (item) => {
    setEditingItem(item)
    // Find parent category from menu_category_id
    const selectedSubCategory = allCategories.find(cat => cat.id == item.menu_category_id)
    const parentId = selectedSubCategory?.parent_id || null
    setSelectedParentCategoryId(parentId)
    
    setFormData({
      name: item.name || '',
      menu_id: item.menu_id || selectedMenuId || '', // Include menu_id
      menu_category_id: item.menu_category_id || '',
      menu_type_id: item.menu_type_id || '',
      description: item.description || '',
      price_cash: item.price_cash || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
      is_open_item: item.is_open_item !== undefined ? item.is_open_item : false,
      parent_category_id: parentId || '',
    })
    
    // Fetch full item details with modifier/decision groups
    try {
      const itemRes = await api.get(`/admin/menu-items/${item.id}`)
      const fullItem = itemRes.data.data || itemRes.data || item
      
      console.log('Loading item for edit:', fullItem)
      console.log('Modifier groups from item:', fullItem.modifier_groups)
      console.log('Decision groups from item:', fullItem.decision_groups)
      console.log('Available modifier groups:', availableModifierGroups)
      console.log('Available decision groups:', availableDecisionGroups)
      
      // Match the groups from the item with the available groups by ID
      const itemModifierGroupIds = (fullItem.modifier_groups || []).map(g => g.id || g)
      const itemDecisionGroupIds = (fullItem.decision_groups || []).map(g => g.id || g)
      
      // Match with available groups, or use item groups directly if available groups not loaded yet
      const matchedModifierGroups = availableModifierGroups.length > 0
        ? availableModifierGroups.filter(g => itemModifierGroupIds.includes(g.id))
        : (fullItem.modifier_groups || [])
      
      const matchedDecisionGroups = availableDecisionGroups.length > 0
        ? availableDecisionGroups.filter(g => itemDecisionGroupIds.includes(g.id))
        : (fullItem.decision_groups || [])
      
      const hasModifiers = matchedModifierGroups.length > 0
      const hasDecisions = matchedDecisionGroups.length > 0
      setUseModifier(hasModifiers || !hasDecisions) // Default to modifier if both or neither
      setSelectedModifierGroups(matchedModifierGroups)
      setSelectedDecisionGroups(matchedDecisionGroups)
      
      console.log('Item modifier group IDs:', itemModifierGroupIds)
      console.log('Item decision group IDs:', itemDecisionGroupIds)
      console.log('Set selected modifier groups:', matchedModifierGroups)
      console.log('Set selected decision groups:', matchedDecisionGroups)
    } catch (error) {
      console.error('Error loading item details:', error)
      // Fallback to item data without modifier/decision groups
      const hasModifiers = item.modifier_groups && item.modifier_groups.length > 0
      const hasDecisions = item.decision_groups && item.decision_groups.length > 0
      setUseModifier(hasModifiers || !hasDecisions)
      setSelectedModifierGroups(item.modifier_groups || [])
      setSelectedDecisionGroups(item.decision_groups || [])
    }
    
    setError('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setSelectedParentCategoryId(null)
    setFormData({
      name: '',
      menu_category_id: '',
      menu_type_id: '',
      description: '',
      price_cash: 0,
      is_active: true,
      is_open_item: false,
      parent_category_id: '',
    })
    setUseModifier(true)
    setSelectedModifierGroups([])
    setSelectedDecisionGroups([])
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      // Validate that only one type is selected
      if (selectedModifierGroups.length > 0 && selectedDecisionGroups.length > 0) {
        setError('Cannot have both modifiers and decisions. Please choose one.')
        setSaving(false)
        return
      }

      // For items, set price_card equal to price_cash if not already set
      const payload = {
        name: formData.name,
        menu_id: formData.menu_id || selectedMenuId || null, // Include menu_id
        menu_category_id: formData.menu_category_id || null,
        menu_type_id: formData.menu_type_id,
        description: formData.description || '',
        price_cash: formData.price_cash || 0,
        price_card: formData.price_cash || 0, // Set equal to price_cash
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        is_open_item: formData.is_open_item !== undefined ? formData.is_open_item : false,
      }

      let menuItemId
      if (editingItem) {
        const response = await api.put(`/admin/menu-items/${editingItem.id}`, payload)
        menuItemId = editingItem.id
        console.log('Updated menu item, ID:', menuItemId, 'Response:', response.data)
      } else {
        const response = await api.post('/admin/menu-items', payload)
        menuItemId = response.data.data?.id || response.data.id || response.data.data?.data?.id
        console.log('Created menu item, ID:', menuItemId, 'Response:', response.data)
      }

      if (!menuItemId) {
        throw new Error('Failed to get menu item ID from response')
      }

      console.log('Selected modifier groups:', selectedModifierGroups)
      console.log('Selected decision groups:', selectedDecisionGroups)

      // Attach modifier groups or decision groups (not both)
      if (selectedModifierGroups.length > 0) {
        const modifierGroupIds = selectedModifierGroups.map(g => g.id || g).filter(id => id !== null && id !== undefined)
        console.log('Attaching modifier groups:', modifierGroupIds, 'to menu item:', menuItemId)
        await api.post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
          modifier_group_ids: modifierGroupIds
        })
        // Clear decision groups
        await api.post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
          decision_group_ids: []
        })
      } else if (selectedDecisionGroups.length > 0) {
        const decisionGroupIds = selectedDecisionGroups.map(g => g.id || g).filter(id => id !== null && id !== undefined)
        console.log('Attaching decision groups:', decisionGroupIds, 'to menu item:', menuItemId)
        await api.post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
          decision_group_ids: decisionGroupIds
        })
        // Clear modifier groups
        await api.post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
          modifier_group_ids: []
        })
      } else {
        // Clear both if nothing selected
        console.log('Clearing all modifier/decision groups for menu item:', menuItemId)
        await api.post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
          modifier_group_ids: []
        })
        await api.post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
          decision_group_ids: []
        })
      }

      handleCloseDialog()
      fetchMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
      setError(error.response?.data?.message || 'Failed to save menu item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    try {
      await api.delete(`/admin/menu-items/${item.id}`)
      fetchMenuItems()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert(`Failed to delete menu item: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleCategoryChange = async (item, newMenuTypeId) => {
    try {
      await api.put(`/admin/menu-items/${item.id}`, {
        menu_type_id: newMenuTypeId,
      })
      fetchMenuItems()
    } catch (error) {
      console.error('Error updating category:', error)
      alert(`Failed to update category: ${error.response?.data?.message || error.message}`)
    }
  }

  const getMenuTypeName = (menuTypeId) => {
    const menuType = menuTypes.find((mt) => mt.id === menuTypeId)
    return menuType?.name || 'Other'
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Menu Items
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Menu</InputLabel>
            <Select
              value={selectedMenuId || ''}
              label="Select Menu"
              onChange={(e) => {
                setSelectedMenuId(e.target.value)
              }}
              disabled={menus.length === 0}
            >
              {menus.map((menu) => (
                <MuiMenuItem key={menu.id} value={menu.id}>
                  {menu.name}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenAdd}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60">No</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      displayEmpty
                      sx={{ 
                        '& .MuiSelect-select': { 
                          py: 1,
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }
                      }}
                    >
                      <MuiMenuItem value="all">All Categories</MuiMenuItem>
                      {menuTypes.map((type) => (
                        <MuiMenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MuiMenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>Modifiers</TableCell>
                <TableCell>Decision</TableCell>
                <TableCell align="center" width="120">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!selectedMenuId ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {menus.length === 0 ? 'No menus available' : 'Please select a menu'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : menuItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        No menu items found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add Item" to create a new menu item for this menu
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                menuItems.map((item, index) => {
                  // Get modifier groups
                  const modifierGroups = item.modifier_groups || []
                  
                  // Get decision groups
                  const decisionGroups = item.decision_groups || []
                  
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={item.menu_type_id || ''}
                            onChange={(e) => handleCategoryChange(item, e.target.value)}
                            displayEmpty
                          >
                            {menuTypes.map((type) => (
                              <MuiMenuItem key={type.id} value={type.id}>
                                {type.name}
                              </MuiMenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {modifierGroups.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {modifierGroups.map((modifier) => (
                              <Chip
                                key={modifier.id}
                                label={modifier.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {decisionGroups.length > 0 ? (
                          <Chip
                            label={decisionGroups[0].name}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Menu Item Name"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Menu Type (Category)</InputLabel>
              <Select
                value={formData.menu_type_id || ''}
                label="Menu Type (Category)"
                onChange={(e) => setFormData({ ...formData, menu_type_id: e.target.value })}
              >
                {menuTypes.map((type) => (
                  <MuiMenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Price and Modifier/Decision Selection - Hide if "Open Item" is enabled */}
            {!formData.is_open_item && (
              <>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price_cash || 0}
                  onChange={(e) => setFormData({ ...formData, price_cash: parseFloat(e.target.value) || 0 })}
                  margin="normal"
                  required
                />
                
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    width: 'fit-content',
                  }}
                >
                  <Box
                    component="button"
                    onClick={() => {
                      setUseModifier(true)
                      setSelectedDecisionGroups([])
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: useModifier ? 'primary.main' : 'transparent',
                      color: useModifier ? 'white' : 'text.primary',
                      fontWeight: 'medium',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: useModifier ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    Modifier
                  </Box>
                  <Box
                    sx={{
                      width: '1px',
                      backgroundColor: 'divider',
                    }}
                  />
                  <Box
                    component="button"
                    onClick={() => {
                      // Check if modifiers are selected
                      if (selectedModifierGroups.length > 0) {
                        setSnackbar({
                          open: true,
                          message: 'You can select either Modifier or Decision. If you want to select Decision, please unselect Modifier first.',
                          severity: 'warning',
                        })
                        return
                      }
                      setUseModifier(false)
                      setSelectedModifierGroups([])
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: !useModifier ? 'primary.main' : 'transparent',
                      color: !useModifier ? 'white' : 'text.primary',
                      fontWeight: 'medium',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: !useModifier ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    Decision
                  </Box>
                </Box>
              </Box>
              
              {useModifier ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Select Modifier Groups:
                  </Typography>
                  {availableModifierGroups.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No modifier groups available
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {availableModifierGroups.map((group) => {
                        const isSelected = selectedModifierGroups.some(g => g.id === group.id)
                        const groupModifiers = group.modifiers || []
                        return (
                          <Box key={group.id} sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Clear decisions when selecting modifier
                                      setSelectedDecisionGroups([])
                                      setSelectedModifierGroups([...selectedModifierGroups, group])
                                      // If we were on Decision tab, switch to Modifier
                                      if (!useModifier) {
                                        setUseModifier(true)
                                      }
                                    } else {
                                      setSelectedModifierGroups(selectedModifierGroups.filter(g => g.id !== group.id))
                                    }
                                  }}
                                />
                              }
                              label={
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {group.name}
                                </Typography>
                              }
                            />
                            {groupModifiers.length > 0 && (
                              <Box sx={{ ml: 4, mt: 0.5 }}>
                                {groupModifiers.map((modifier) => (
                                  <Typography key={modifier.id} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {modifier.name}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Select Decision Group:
                  </Typography>
                  {availableDecisionGroups.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No decision groups available
                    </Typography>
                  ) : (
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {availableDecisionGroups.map((group) => {
                        const isSelected = selectedDecisionGroups.some(g => g.id === group.id)
                        const groupDecisions = group.decisions || []
                        return (
                          <Box key={group.id} sx={{ mb: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Check if modifiers are selected
                                      if (selectedModifierGroups.length > 0) {
                                        setSnackbar({
                                          open: true,
                                          message: 'You can select either Modifier or Decision. If you want to select Decision, please unselect Modifier first.',
                                          severity: 'warning',
                                        })
                                        return
                                      }
                                      // Clear modifiers when selecting decision (only one decision allowed)
                                      setSelectedModifierGroups([])
                                      setSelectedDecisionGroups([group])
                                      // If we were on Modifier tab, switch to Decision
                                      if (useModifier) {
                                        setUseModifier(false)
                                      }
                                    } else {
                                      setSelectedDecisionGroups([])
                                    }
                                  }}
                                />
                              }
                              label={
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {group.name}
                                </Typography>
                              }
                            />
                            {groupDecisions.length > 0 && (
                              <Box sx={{ ml: 4, mt: 0.5 }}>
                                {groupDecisions.map((decision) => (
                                  <Typography key={decision.id} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {decision.name}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
              </>
            )}
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== undefined ? formData.is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_open_item !== undefined ? formData.is_open_item : false}
                    onChange={(e) => setFormData({ ...formData, is_open_item: e.target.checked })}
                  />
                }
                label="Open Item"
                sx={{ mt: 1 }}
              />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
