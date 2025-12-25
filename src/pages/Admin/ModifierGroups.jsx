'use client'

import { useState, useEffect, useRef } from 'react'
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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function ModifierGroups() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [groups, setGroups] = useState([])
  const [modifiers, setModifiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [openGroupDialog, setOpenGroupDialog] = useState(false)
  const [openModifierDialog, setOpenModifierDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingModifier, setEditingModifier] = useState(null)
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    min_select: 1,
    max_select: 1,
  })
  const [modifierFormData, setModifierFormData] = useState({
    name: '',
    additional_price: 0,
    group_id: '',
  })
  const [isAddingFromGroup, setIsAddingFromGroup] = useState(false)
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
      const [groupsRes, modifiersRes] = await Promise.all([
        api.get('/admin/modifier-groups', { params: { per_page: 1000 } }).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/admin/modifiers', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
      ])

      if (isMountedRef.current) {
        const groupsData = groupsRes.data.data?.data || groupsRes.data.data || []
        const modifiersData = modifiersRes.data.data?.data || modifiersRes.data.data || []
        setGroups(Array.isArray(groupsData) ? groupsData : [])
        setModifiers(Array.isArray(modifiersData) ? modifiersData : [])
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

  const handleOpenGroupAdd = () => {
    setEditingGroup(null)
    setGroupFormData({ name: '', min_select: 1, max_select: 1 })
    setError('')
    setOpenGroupDialog(true)
  }

  const handleOpenGroupEdit = (group) => {
    setEditingGroup(group)
    setGroupFormData({
      name: group.name || '',
      min_select: group.min_select || 1,
      max_select: group.max_select || 1,
    })
    setError('')
    setOpenGroupDialog(true)
  }

  const handleCloseGroupDialog = () => {
    setOpenGroupDialog(false)
    setEditingGroup(null)
    setGroupFormData({ name: '', min_select: 1, max_select: 1 })
    setError('')
  }

  const handleGroupSubmit = async () => {
    setError('')
    try {
      if (editingGroup) {
        await api.put(`/admin/modifier-groups/${editingGroup.id}`, groupFormData)
      } else {
        await api.post('/admin/modifier-groups', groupFormData)
      }
      handleCloseGroupDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDeleteGroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this modifier group?')) {
      try {
        await api.delete(`/admin/modifier-groups/${id}`)
        fetchAllData()
      } catch (error) {
        console.error('Error deleting modifier group:', error)
        alert('Failed to delete modifier group')
      }
    }
  }

  const handleOpenModifierAdd = (groupId) => {
    setEditingModifier(null)
    setModifierFormData({ name: '', additional_price: 0, group_id: groupId })
    setIsAddingFromGroup(true)
    setError('')
    setOpenModifierDialog(true)
  }

  const handleOpenModifierEdit = (modifier) => {
    setEditingModifier(modifier)
    setModifierFormData({
      name: modifier.name || '',
      additional_price: modifier.additional_price || 0,
      group_id: modifier.group_id || '',
    })
    setIsAddingFromGroup(false)
    setError('')
    setOpenModifierDialog(true)
  }

  const handleCloseModifierDialog = () => {
    setOpenModifierDialog(false)
    setEditingModifier(null)
    setModifierFormData({ name: '', additional_price: 0, group_id: '' })
    setIsAddingFromGroup(false)
    setError('')
  }

  const handleModifierSubmit = async () => {
    setError('')
    try {
      if (editingModifier) {
        await api.put(`/admin/modifiers/${editingModifier.id}`, modifierFormData)
      } else {
        await api.post('/admin/modifiers', modifierFormData)
      }
      handleCloseModifierDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDeleteModifier = async (id) => {
    if (window.confirm('Are you sure you want to delete this modifier?')) {
      try {
        await api.delete(`/admin/modifiers/${id}`)
        fetchAllData()
      } catch (error) {
        console.error('Error deleting modifier:', error)
        alert('Failed to delete modifier')
      }
    }
  }

  const getModifiersForGroup = (groupId) => {
    return modifiers.filter((m) => String(m.group_id) === String(groupId))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Modifier Groups
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {groups.map((group) => {
            const groupModifiers = getModifiersForGroup(group.id)
            return (
              <Grid item xs={12} md={6} key={group.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {group.name}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenGroupEdit(group)}
                          title="Edit Group"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGroup(group.id)}
                          color="error"
                          title="Delete Group"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                                  {modifier.additional_price > 0 ? (
                                    <Chip
                                      label={`+$${modifier.additional_price}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ) : (
                                    <Chip
                                      label="No additional charge"
                                      size="small"
                                      variant="outlined"
                                      color="default"
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenModifierEdit(modifier)}
                                title="Edit Modifier"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteModifier(modifier.id)}
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
                      onClick={() => handleOpenModifierAdd(group.id)}
                      sx={{ mt: 2 }}
                      color="primary"
                    >
                      Add Modifier
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                border: '2px dashed',
                borderColor: 'primary.main',
                bgcolor: 'grey.50',
              }}
            >
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenGroupAdd}
                  fullWidth
                  size="large"
                >
                  Add Modifier Group
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Group Dialog */}
      <Dialog
        open={openGroupDialog}
        onClose={handleCloseGroupDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingGroup ? 'Edit' : 'Add'} Modifier Group</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={groupFormData.name}
            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
            required
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Min Select"
            type="number"
            fullWidth
            variant="outlined"
            value={groupFormData.min_select}
            onChange={(e) => setGroupFormData({ ...groupFormData, min_select: parseInt(e.target.value) || 0 })}
            inputProps={{ min: '0' }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Max Select"
            type="number"
            fullWidth
            variant="outlined"
            value={groupFormData.max_select}
            onChange={(e) => setGroupFormData({ ...groupFormData, max_select: parseInt(e.target.value) || 1 })}
            inputProps={{ min: '1' }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Button
            onClick={handleCloseGroupDialog}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGroupSubmit}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {editingGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modifier Dialog */}
      <Dialog
        open={openModifierDialog}
        onClose={handleCloseModifierDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingModifier ? 'Edit' : 'Add'} Modifier</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Modifier Group</InputLabel>
            <Select
              value={modifierFormData.group_id}
              onChange={(e) => setModifierFormData({ ...modifierFormData, group_id: e.target.value })}
              label="Modifier Group"
              required
              disabled={!!editingModifier || isAddingFromGroup}
            >
              {groups.map((group) => (
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
            value={modifierFormData.name}
            onChange={(e) => setModifierFormData({ ...modifierFormData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Additional Price"
            type="number"
            fullWidth
            variant="outlined"
            value={modifierFormData.additional_price}
            onChange={(e) =>
              setModifierFormData({ ...modifierFormData, additional_price: parseFloat(e.target.value) || 0 })
            }
            inputProps={{ min: '0', step: '0.01' }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Button
            onClick={handleCloseModifierDialog}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleModifierSubmit}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            {editingModifier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
