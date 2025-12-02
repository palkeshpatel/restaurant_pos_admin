'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  Category as CategoryIcon,
  Fastfood as FastfoodIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import api from '../../services/api'

export default function MenuManagement() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [modifierGroups, setModifierGroups] = useState([])
  const [modifiers, setModifiers] = useState([])
  const [decisionGroups, setDecisionGroups] = useState([])
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState(null) // 'menu', 'category', 'item', 'modifier-group', 'modifier', 'decision-group', 'decision', 'item-modifiers', 'item-decisions'
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')
  const isMountedRef = useRef(true)
  const fetchInProgressRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    fetchAllData()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchAllData = async () => {
    if (fetchInProgressRef.current) return
    fetchInProgressRef.current = true
    setLoading(true)
    try {
      const [menusRes, categoriesRes, itemsRes, modGroupsRes, modsRes, decGroupsRes, decsRes] = await Promise.all([
        api.get('/admin/menus').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/menu-categories', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/menu-items', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/modifier-groups').catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/modifiers', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/decision-groups', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/decisions', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
      ])

      // Menu items should already have relationships from the API
      // Extract from paginated response if needed
      let itemsWithRelations = itemsRes.data.data?.data || itemsRes.data.data || []

      if (isMountedRef.current) {
        // Ensure all are arrays
        const menusData = menusRes.data.data?.data || menusRes.data.data || []
        // Handle paginated categories response
        const categoriesData = categoriesRes.data.data?.data || categoriesRes.data.data || []
        const itemsData = itemsRes.data.data || []
        const modGroupsData = modGroupsRes.data.data?.data || modGroupsRes.data.data || []
        // Handle paginated modifiers response
        const modsData = modsRes.data.data?.data || modsRes.data.data || []
        // Handle paginated decision groups response
        const decGroupsData = decGroupsRes.data.data?.data || decGroupsRes.data.data || []
        // Handle paginated decisions response
        const decsData = decsRes.data.data?.data || decsRes.data.data || []

        console.log('Fetched Categories:', categoriesData)
        console.log('Fetched Menus:', menusData)
        console.log('Fetched Decision Groups:', decGroupsData)

        setMenus(Array.isArray(menusData) ? menusData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setMenuItems(Array.isArray(itemsWithRelations) ? itemsWithRelations : (Array.isArray(itemsData) ? itemsData : []))
        setModifierGroups(Array.isArray(modGroupsData) ? modGroupsData : [])
        setModifiers(Array.isArray(modsData) ? modsData : [])
        setDecisionGroups(Array.isArray(decGroupsData) ? decGroupsData : [])
        setDecisions(Array.isArray(decsData) ? decsData : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }))
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const getCategoriesForMenu = (menuId) => {
    if (!Array.isArray(categories)) {
      console.log('Categories is not an array:', categories)
      return []
    }
    const filtered = categories.filter((cat) => {
      const matchesMenu = String(cat.menu_id) === String(menuId)
      const isTopLevel = !cat.parent_id || cat.parent_id === null
      return matchesMenu && isTopLevel
    })
    console.log(`Categories for menu ${menuId}:`, filtered)
    return filtered
  }

  const getSubCategories = (parentId) => {
    if (!Array.isArray(categories)) return []
    return categories.filter((cat) => cat.parent_id == parentId)
  }

  const getItemsForCategory = (categoryId) => {
    if (!Array.isArray(menuItems)) return []
    return menuItems.filter((item) => item.menu_category_id == categoryId)
  }

  const renderMenuItem = (item, isSubCategoryItem = false) => {
    const itemModifierGroups = item.modifier_groups || []
    const itemDecisionGroups = item.decision_groups || []

    return (
      <Box
        key={item.id}
        sx={{
          mb: 1,
          ml: isSubCategoryItem ? 2 : 0,
          pl: isSubCategoryItem ? 2 : 0,
          borderLeft: isSubCategoryItem ? '2px dashed' : 'none',
          borderLeftColor: isSubCategoryItem ? 'secondary.light' : 'transparent',
        }}
      >
        <Card
          sx={{
            bgcolor: isSubCategoryItem ? 'grey.50' : 'white',
            border: '1px solid',
            borderColor: isSubCategoryItem ? 'secondary.light' : 'divider',
            boxShadow: isSubCategoryItem ? 0 : 1,
          }}
        >
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <FastfoodIcon fontSize="small" color={isSubCategoryItem ? "secondary" : "primary"} />
                  <Typography variant="body1" fontWeight="medium">
                    {isSubCategoryItem ? '  └─ ' : ''}{item.name}
                  </Typography>
                  {item.is_active ? (
                    <Chip label="Active" color="success" size="small" />
                  ) : (
                    <Chip label="Inactive" color="default" size="small" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: isSubCategoryItem ? 6 : 4, mb: 1 }}>
                  💵 Cash: ${item.price_cash || 0} | 💳 Card: ${item.price_card || 0}
                </Typography>

                {/* Modifier Groups */}
                {itemModifierGroups.length > 0 && (
                  <Box sx={{ ml: isSubCategoryItem ? 6 : 4, mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      🔧 Modifiers:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      {itemModifierGroups.map((group) => (
                        <Chip
                          key={group.id}
                          label={group.name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Decision Groups */}
                {itemDecisionGroups.length > 0 && (
                  <Box sx={{ ml: isSubCategoryItem ? 6 : 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      ⚙️ Decisions:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      {itemDecisionGroups.map((group) => (
                        <Chip
                          key={group.id}
                          label={group.name}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('item', item)}
                  title="Edit Item"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('item-modifiers', item)}
                  title="Manage Modifiers"
                  color="primary"
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('item', item.id)}
                  color="error"
                  title="Delete Item"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const handleOpenDialog = (type, item = null, parentData = {}) => {
    setDialogType(type)
    setEditingItem(item)
    setError('')
    
    if (type === 'menu') {
      setFormData(item ? { ...item } : { name: '', description: '', is_active: true })
    } else if (type === 'category') {
      setFormData(
        item
          ? { ...item }
          : { menu_id: parentData.menuId || '', parent_id: parentData.parentId || '', name: '', description: '', is_active: true }
      )
    } else if (type === 'item') {
      setFormData(
        item
          ? { ...item }
          : {
              menu_category_id: parentData.categoryId || '',
              name: '',
              price_cash: 0,
              price_card: 0,
              is_active: true,
            }
      )
    } else if (type === 'item-modifiers') {
      // For managing modifier groups on a menu item
      const currentModifierGroupIds = item?.modifier_groups?.map((g) => g.id) || []
      setFormData({
        menu_item_id: item?.id,
        modifier_group_ids: currentModifierGroupIds,
      })
    } else if (type === 'item-decisions') {
      // For managing decision groups on a menu item
      const currentDecisionGroupIds = item?.decision_groups?.map((g) => g.id) || []
      setFormData({
        menu_item_id: item?.id,
        decision_group_ids: currentDecisionGroupIds,
      })
    } else if (type === 'modifier-group') {
      setFormData(item ? { ...item } : { name: '', min_select: 1, max_select: 1 })
    } else if (type === 'modifier') {
      setFormData(
        item
          ? { ...item }
          : { group_id: parentData.groupId || '', name: '', additional_price: 0 }
      )
    } else if (type === 'decision-group') {
      setFormData(item ? { ...item } : { name: '' })
    } else if (type === 'decision') {
      setFormData(
        item ? { ...item } : { group_id: parentData.groupId || '', name: '' }
      )
    }
    
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setDialogType(null)
    setEditingItem(null)
    setFormData({})
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    try {
      let endpoint = ''
      let method = 'POST'
      let payload = { ...formData }

      // For item-modifiers and item-decisions, we don't use editingItem
      const isEditMode = editingItem && dialogType !== 'item-modifiers' && dialogType !== 'item-decisions'
      
      if (dialogType === 'menu') {
        endpoint = isEditMode ? `/admin/menus/${editingItem.id}` : '/admin/menus'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'category') {
        endpoint = isEditMode ? `/admin/menu-categories/${editingItem.id}` : '/admin/menu-categories'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'item') {
        endpoint = isEditMode ? `/admin/menu-items/${editingItem.id}` : '/admin/menu-items'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'item-modifiers') {
        // Attach modifier groups to menu item
        endpoint = `/admin/menu-items/${formData.menu_item_id}/attach-modifier-groups`
        method = 'POST'
        payload = { modifier_group_ids: formData.modifier_group_ids || [] }
      } else if (dialogType === 'item-decisions') {
        // Attach decision groups to menu item
        endpoint = `/admin/menu-items/${formData.menu_item_id}/attach-decision-groups`
        method = 'POST'
        payload = { decision_group_ids: formData.decision_group_ids || [] }
      } else if (dialogType === 'modifier-group') {
        endpoint = isEditMode ? `/admin/modifier-groups/${editingItem.id}` : '/admin/modifier-groups'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'modifier') {
        endpoint = isEditMode ? `/admin/modifiers/${editingItem.id}` : '/admin/modifiers'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'decision-group') {
        endpoint = isEditMode ? `/admin/decision-groups/${editingItem.id}` : '/admin/decision-groups'
        method = isEditMode ? 'PUT' : 'POST'
      } else if (dialogType === 'decision') {
        endpoint = isEditMode ? `/admin/decisions/${editingItem.id}` : '/admin/decisions'
        method = isEditMode ? 'PUT' : 'POST'
      }

      let response
      if (method === 'PUT') {
        response = await api.put(endpoint, payload)
      } else {
        response = await api.post(endpoint, payload)
      }

      // If attaching modifiers/decisions, update the specific menu item in state
      if (dialogType === 'item-modifiers' || dialogType === 'item-decisions') {
        const updatedItem = response.data.data || response.data
        if (updatedItem && updatedItem.id) {
          setMenuItems((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
          )
        }
      }

      handleCloseDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      let endpoint = ''
      if (type === 'menu') endpoint = `/admin/menus/${id}`
      else if (type === 'category') endpoint = `/admin/menu-categories/${id}`
      else if (type === 'item') endpoint = `/admin/menu-items/${id}`
      else if (type === 'modifier-group') endpoint = `/admin/modifier-groups/${id}`
      else if (type === 'modifier') endpoint = `/admin/modifiers/${id}`
      else if (type === 'decision-group') endpoint = `/admin/decision-groups/${id}`
      else if (type === 'decision') endpoint = `/admin/decisions/${id}`

      await api.delete(endpoint)
      fetchAllData()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    }
  }

  const renderMenuTree = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )
    }

    if (!Array.isArray(menus) || menus.length === 0) {
      return (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" py={3}>
              No menus found. Create your first menu to get started!
            </Typography>
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('menu')}
              >
                Add Menu
              </Button>
            </Box>
          </CardContent>
        </Card>
      )
    }

    return menus.map((menu) => {
      const menuCategories = getCategoriesForMenu(menu.id)
      const isExpanded = expandedMenus[menu.id]
      
      console.log(`Menu: ${menu.name} (ID: ${menu.id}), Categories:`, menuCategories)

      return (
        <Card key={menu.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1} flex={1}>
                <IconButton size="small" onClick={() => toggleMenu(menu.id)}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <RestaurantIcon color="primary" />
                <Typography variant="h6">{menu.name}</Typography>
                {menu.is_active ? (
                  <Chip label="Active" color="success" size="small" />
                ) : (
                  <Chip label="Inactive" color="default" size="small" />
                )}
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleOpenDialog('menu', menu)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete('menu', menu.id)} color="error">
                  <DeleteIcon />
                </IconButton>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('category', null, { menuId: menu.id })}
                  sx={{ ml: 1 }}
                >
                  Add Category
                </Button>
              </Box>
            </Box>

            {menu.description && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mt: 0.5 }}>
                {menu.description}
              </Typography>
            )}

            <Collapse in={isExpanded}>
              <Box sx={{ ml: 4, mt: 2 }}>
                {menuCategories.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No categories. Add one to get started!
                  </Typography>
                ) : (
                  menuCategories.map((category) => {
                    const subCategories = getSubCategories(category.id)
                    // Get items directly under this category (not under any sub-category)
                    const allSubCategoryIds = subCategories.map((subCat) => subCat.id)
                    const categoryItems = getItemsForCategory(category.id).filter(
                      (item) => {
                        // Check if this item belongs to any sub-category
                        const itemCategory = categories.find((cat) => cat.id === item.menu_category_id)
                        return !itemCategory || !allSubCategoryIds.includes(item.menu_category_id)
                      }
                    )
                    const isCategoryExpanded = expandedCategories[category.id]

                    return (
                      <Card key={category.id} sx={{ mb: 2, bgcolor: 'grey.50', borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={1} flex={1}>
                              <IconButton
                                size="small"
                                onClick={() => toggleCategory(category.id)}
                              >
                                {isCategoryExpanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                              <CategoryIcon color="primary" />
                              <Typography variant="subtitle1" fontWeight="medium">{category.name}</Typography>
                              {category.is_active ? (
                                <Chip label="Active" color="success" size="small" />
                              ) : (
                                <Chip label="Inactive" color="default" size="small" />
                              )}
                              {subCategories.length > 0 && (
                                <Chip 
                                  label={`${subCategories.length} sub-categories`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                />
                              )}
                              {categoryItems.length > 0 && (
                                <Chip 
                                  label={`${categoryItems.length} items`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                />
                              )}
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog('category', category)}
                                title="Edit Category"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete('category', category.id)}
                                color="error"
                                title="Delete Category"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  handleOpenDialog('category', null, {
                                    menuId: menu.id,
                                    parentId: category.id,
                                  })
                                }
                                sx={{ ml: 1 }}
                                variant="outlined"
                              >
                                Add Sub-Category
                              </Button>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                  handleOpenDialog('item', null, { categoryId: category.id })
                                }
                                sx={{ ml: 1 }}
                                variant="outlined"
                              >
                                Add Item
                              </Button>
                            </Box>
                          </Box>

                          <Collapse in={isCategoryExpanded}>
                            <Box sx={{ ml: 4, mt: 2 }}>
                              {/* Sub-Categories with Tree Structure */}
                              {subCategories.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      mb: 1, 
                                      fontWeight: 'bold',
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}
                                  >
                                    <CategoryIcon fontSize="small" />
                                    Sub-Categories ({subCategories.length}):
                                  </Typography>
                                  {subCategories.map((subCat) => {
                                    const subCatItems = getItemsForCategory(subCat.id)
                                    return (
                                      <Box
                                        key={subCat.id}
                                        sx={{
                                          mb: 2,
                                          ml: 2,
                                          pl: 2,
                                          borderLeft: '2px dashed',
                                          borderLeftColor: 'primary.light',
                                        }}
                                      >
                                        <Card
                                          sx={{
                                            bgcolor: 'white',
                                            border: '1px solid',
                                            borderColor: 'primary.light',
                                            boxShadow: 1,
                                          }}
                                        >
                                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                              <Box display="flex" alignItems="center" gap={1}>
                                                <CategoryIcon fontSize="small" color="secondary" />
                                                <Typography variant="body1" fontWeight="medium" color="secondary.main">
                                                  └─ {subCat.name}
                                                </Typography>
                                                {subCat.is_active ? (
                                                  <Chip label="Active" color="success" size="small" />
                                                ) : (
                                                  <Chip label="Inactive" color="default" size="small" />
                                                )}
                                                {subCatItems.length > 0 && (
                                                  <Chip
                                                    label={`${subCatItems.length} items`}
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                  />
                                                )}
                                              </Box>
                                              <Box>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleOpenDialog('category', subCat)}
                                                  title="Edit Sub-Category"
                                                >
                                                  <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleDelete('category', subCat.id)}
                                                  color="error"
                                                  title="Delete Sub-Category"
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Button
                                                  size="small"
                                                  startIcon={<AddIcon />}
                                                  onClick={() =>
                                                    handleOpenDialog('item', null, {
                                                      categoryId: subCat.id,
                                                    })
                                                  }
                                                  sx={{ ml: 0.5 }}
                                                  variant="outlined"
                                                  color="secondary"
                                                >
                                                  Add Item
                                                </Button>
                                              </Box>
                                            </Box>
                                            
                                            {subCat.description && (
                                              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                                                {subCat.description}
                                              </Typography>
                                            )}

                                            {/* Items under Sub-Category */}
                                            {subCatItems.length > 0 && (
                                              <Box sx={{ mt: 1.5, ml: 2 }}>
                                                <Typography 
                                                  variant="caption" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 1
                                                  }}
                                                >
                                                  Items in {subCat.name}:
                                                </Typography>
                                                {subCatItems.map((item) => renderMenuItem(item, true))}
                                              </Box>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </Box>
                                    )
                                  })}
                                </Box>
                              )}

                              {/* Menu Items directly under Category (not in sub-category) */}
                              {categoryItems.length > 0 && (
                                <Box>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      mb: 1, 
                                      fontWeight: 'bold',
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}
                                  >
                                    <FastfoodIcon fontSize="small" />
                                    Items ({categoryItems.length}):
                                  </Typography>
                                  {categoryItems.map((item) => renderMenuItem(item, false))}
                                </Box>
                              )}

                              {/* Show message if no sub-categories and no items */}
                              {subCategories.length === 0 && categoryItems.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                                  No sub-categories or items. Add a sub-category or item to get started!
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )
    })
  }

  const renderModifiers = () => {
    if (!Array.isArray(modifierGroups)) return null
    console.log('Modifier Groups:', modifierGroups)
    console.log('All Modifiers:', modifiers)
    return (
      <Grid container spacing={2}>
        {modifierGroups.map((group) => {
          const groupModifiers = Array.isArray(modifiers) ? modifiers.filter((m) => String(m.group_id) === String(group.id)) : []
          console.log(`Modifiers for group "${group.name}" (ID: ${group.id}):`, groupModifiers)
          return (
            <Grid item xs={12} md={6} key={group.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{group.name}</Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('modifier-group', group)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete('modifier-group', group.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Min: {group.min_select} | Max: {group.max_select}
                  </Typography>
                  {groupModifiers.length > 0 ? (
                    <List dense>
                      {groupModifiers.map((modifier) => (
                        <ListItem
                          key={modifier.id}
                          sx={{
                            bgcolor: 'grey.50',
                            mb: 0.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontWeight="medium">
                                  {modifier.name}
                                </Typography>
                                {modifier.additional_price > 0 && (
                                  <Chip
                                    label={`+$${modifier.additional_price}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={modifier.additional_price === 0 ? 'No additional charge' : ''}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('modifier', modifier)}
                              title="Edit Modifier"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete('modifier', modifier.id)}
                              color="error"
                              title="Delete Modifier"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                      No modifiers. Add one to get started!
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('modifier', null, { groupId: group.id })}
                    sx={{ mt: 2 }}
                    color="primary"
                  >
                    + ADD MODIFIER
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <CardContent>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('modifier-group')}
                fullWidth
                size="large"
              >
                Add Modifier Group
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderDecisions = () => {
    if (!Array.isArray(decisionGroups)) return null
    console.log('Decision Groups:', decisionGroups)
    console.log('All Decisions:', decisions)
    return (
      <Grid container spacing={2}>
        {decisionGroups.map((group) => {
          const groupDecisions = Array.isArray(decisions) ? decisions.filter((d) => String(d.group_id) === String(group.id)) : []
          console.log(`Decisions for group "${group.name}" (ID: ${group.id}):`, groupDecisions)
          return (
            <Grid item xs={12} md={6} key={group.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{group.name}</Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('decision-group', group)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete('decision-group', group.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  {groupDecisions.length > 0 ? (
                    <List dense>
                      {groupDecisions.map((decision) => (
                        <ListItem
                          key={decision.id}
                          sx={{
                            bgcolor: 'grey.50',
                            mb: 0.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                {decision.name}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('decision', decision)}
                              title="Edit Decision"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete('decision', decision.id)}
                              color="error"
                              title="Delete Decision"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                      No decisions. Add one to get started!
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('decision', null, { groupId: group.id })}
                    sx={{ mt: 2 }}
                    color="secondary"
                  >
                    + ADD DECISION
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <CardContent>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('decision-group')}
                fullWidth
                size="large"
              >
                Add Decision Group
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const renderDialog = () => {
    if (!dialogType) return null

      const getTitle = () => {
      const action = editingItem ? 'Edit' : 'Add'
      const typeMap = {
        menu: 'Menu',
        category: 'Category',
        item: 'Menu Item',
        'item-modifiers': 'Manage Modifiers',
        'item-decisions': 'Manage Decisions',
        'modifier-group': 'Modifier Group',
        modifier: 'Modifier',
        'decision-group': 'Decision Group',
        decision: 'Decision',
      }
      return `${action} ${typeMap[dialogType]}`
    }

    return (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{getTitle()}</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {dialogType === 'menu' && (
            <>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== undefined ? formData.is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </>
          )}

          {dialogType === 'category' && (
            <>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Menu</InputLabel>
                <Select
                  value={formData.menu_id || ''}
                  onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })}
                  label="Menu"
                  required
                >
                  {Array.isArray(menus) && menus.map((menu) => (
                    <MenuItem key={menu.id} value={menu.id}>
                      {menu.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Parent Category (Optional)</InputLabel>
                <Select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  label="Parent Category (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {Array.isArray(categories) &&
                    categories
                      .filter((cat) => cat.menu_id == formData.menu_id)
                      .map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== undefined ? formData.is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </>
          )}

          {dialogType === 'item' && (
            <>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.menu_category_id || ''}
                  onChange={(e) => setFormData({ ...formData, menu_category_id: e.target.value })}
                  label="Category"
                  required
                >
                  {Array.isArray(categories) && categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Price (Cash)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.price_cash || 0}
                onChange={(e) =>
                  setFormData({ ...formData, price_cash: parseFloat(e.target.value) || 0 })
                }
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Price (Card)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.price_card || 0}
                onChange={(e) =>
                  setFormData({ ...formData, price_card: parseFloat(e.target.value) || 0 })
                }
                required
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== undefined ? formData.is_active : true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </>
          )}

          {dialogType === 'modifier-group' && (
            <>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Min Select"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.min_select || 1}
                onChange={(e) =>
                  setFormData({ ...formData, min_select: parseInt(e.target.value) || 1 })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Max Select"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.max_select || 1}
                onChange={(e) =>
                  setFormData({ ...formData, max_select: parseInt(e.target.value) || 1 })
                }
                sx={{ mb: 2 }}
              />
            </>
          )}

          {dialogType === 'modifier' && (
            <>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Modifier Group</InputLabel>
                <Select
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  label="Modifier Group"
                  required
                >
                  {Array.isArray(modifierGroups) && modifierGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Additional Price"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.additional_price || 0}
                onChange={(e) =>
                  setFormData({ ...formData, additional_price: parseFloat(e.target.value) || 0 })
                }
                sx={{ mb: 2 }}
              />
            </>
          )}

          {dialogType === 'decision-group' && (
            <TextField
              margin="dense"
              label="Name"
              fullWidth
              variant="outlined"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          )}

          {dialogType === 'decision' && (
            <>
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Decision Group</InputLabel>
                <Select
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  label="Decision Group"
                  required
                >
                  {Array.isArray(decisionGroups) && decisionGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </>
          )}

          {dialogType === 'item-modifiers' && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select modifier groups to attach to this menu item:
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Modifier Groups</InputLabel>
                <Select
                  multiple
                  value={formData.modifier_group_ids || []}
                  onChange={(e) => setFormData({ ...formData, modifier_group_ids: e.target.value })}
                  label="Modifier Groups"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const group = modifierGroups.find((g) => g.id === id)
                        return group ? (
                          <Chip key={id} label={group.name} size="small" />
                        ) : null
                      })}
                    </Box>
                  )}
                >
                  {Array.isArray(modifierGroups) &&
                    modifierGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <span>{group.name}</span>
                          <Typography variant="caption" color="text.secondary">
                            {modifiers.filter((m) => m.group_id == group.id).length} modifiers
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </>
          )}

          {dialogType === 'item-decisions' && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select decision groups to attach to this menu item:
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Decision Groups</InputLabel>
                <Select
                  multiple
                  value={formData.decision_group_ids || []}
                  onChange={(e) => setFormData({ ...formData, decision_group_ids: e.target.value })}
                  label="Decision Groups"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const group = decisionGroups.find((g) => g.id === id)
                        return group ? (
                          <Chip key={id} label={group.name} size="small" color="secondary" />
                        ) : null
                      })}
                    </Box>
                  )}
                >
                  {Array.isArray(decisionGroups) &&
                    decisionGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                          <span>{group.name}</span>
                          <Typography variant="caption" color="text.secondary">
                            {decisions.filter((d) => d.group_id == group.id).length} decisions
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 }
        }}>
          <Button 
            onClick={handleCloseDialog}
            size={isMobile ? "medium" : "large"}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            size={isMobile ? "medium" : "large"}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Menu Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('menu')}
        >
          Add Menu
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Menu Structure" icon={<RestaurantIcon />} iconPosition="start" />
          <Tab label="Modifiers" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Decisions" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && renderMenuTree()}
      {selectedTab === 1 && renderModifiers()}
      {selectedTab === 2 && renderDecisions()}

      {renderDialog()}
    </Box>
  )
}

