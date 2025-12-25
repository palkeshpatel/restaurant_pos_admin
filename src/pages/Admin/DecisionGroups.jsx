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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import api from '../../services/api'

export default function DecisionGroups() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [groups, setGroups] = useState([])
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(false)
  const [openGroupDialog, setOpenGroupDialog] = useState(false)
  const [openDecisionDialog, setOpenDecisionDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingDecision, setEditingDecision] = useState(null)
  const [groupFormData, setGroupFormData] = useState({ name: '' })
  const [decisionFormData, setDecisionFormData] = useState({
    name: '',
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
      const [groupsRes, decisionsRes] = await Promise.all([
        api.get('/admin/decision-groups', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/decisions', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
      ])

      if (isMountedRef.current) {
        const groupsData = groupsRes.data.data?.data || groupsRes.data.data || []
        const decisionsData = decisionsRes.data.data?.data || decisionsRes.data.data || []
        setGroups(Array.isArray(groupsData) ? groupsData : [])
        setDecisions(Array.isArray(decisionsData) ? decisionsData : [])
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
    setGroupFormData({ name: '' })
    setError('')
    setOpenGroupDialog(true)
  }

  const handleOpenGroupEdit = (group) => {
    setEditingGroup(group)
    setGroupFormData({ name: group.name || '' })
    setError('')
    setOpenGroupDialog(true)
  }

  const handleCloseGroupDialog = () => {
    setOpenGroupDialog(false)
    setEditingGroup(null)
    setGroupFormData({ name: '' })
    setError('')
  }

  const handleGroupSubmit = async () => {
    setError('')
    try {
      if (editingGroup) {
        await api.put(`/admin/decision-groups/${editingGroup.id}`, groupFormData)
      } else {
        await api.post('/admin/decision-groups', groupFormData)
      }
      handleCloseGroupDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDeleteGroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this decision group?')) {
      try {
        await api.delete(`/admin/decision-groups/${id}`)
        fetchAllData()
      } catch (error) {
        console.error('Error deleting decision group:', error)
        alert('Failed to delete decision group')
      }
    }
  }

  const handleOpenDecisionAdd = (groupId) => {
    setEditingDecision(null)
    setDecisionFormData({ name: '', group_id: groupId })
    setIsAddingFromGroup(true)
    setError('')
    setOpenDecisionDialog(true)
  }

  const handleOpenDecisionEdit = (decision) => {
    setEditingDecision(decision)
    setDecisionFormData({
      name: decision.name || '',
      group_id: decision.group_id || '',
    })
    setIsAddingFromGroup(false)
    setError('')
    setOpenDecisionDialog(true)
  }

  const handleCloseDecisionDialog = () => {
    setOpenDecisionDialog(false)
    setEditingDecision(null)
    setDecisionFormData({ name: '', group_id: '' })
    setIsAddingFromGroup(false)
    setError('')
  }

  const handleDecisionSubmit = async () => {
    setError('')
    try {
      if (editingDecision) {
        await api.put(`/admin/decisions/${editingDecision.id}`, decisionFormData)
      } else {
        await api.post('/admin/decisions', decisionFormData)
      }
      handleCloseDecisionDialog()
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    }
  }

  const handleDeleteDecision = async (id) => {
    if (window.confirm('Are you sure you want to delete this decision?')) {
      try {
        await api.delete(`/admin/decisions/${id}`)
        fetchAllData()
      } catch (error) {
        console.error('Error deleting decision:', error)
        alert('Failed to delete decision')
      }
    }
  }

  const getDecisionsForGroup = (groupId) => {
    return decisions.filter((d) => String(d.group_id) === String(groupId))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Decision Groups
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {groups.map((group) => {
            const groupDecisions = getDecisionsForGroup(group.id)
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
                                onClick={() => handleOpenDecisionEdit(decision)}
                                title="Edit Decision"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteDecision(decision.id)}
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
                      onClick={() => handleOpenDecisionAdd(group.id)}
                      sx={{ mt: 2 }}
                      color="secondary"
                    >
                      Add Decision
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
                borderColor: 'secondary.main',
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
                  color="secondary"
                >
                  Add Decision Group
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
        <DialogTitle>{editingGroup ? 'Edit' : 'Add'} Decision Group</DialogTitle>
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
            color="secondary"
          >
            {editingGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog
        open={openDecisionDialog}
        onClose={handleCloseDecisionDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingDecision ? 'Edit' : 'Add'} Decision</DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Decision Group</InputLabel>
            <Select
              value={decisionFormData.group_id}
              onChange={(e) => setDecisionFormData({ ...decisionFormData, group_id: e.target.value })}
              label="Decision Group"
              required
              disabled={!!editingDecision || isAddingFromGroup}
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
            value={decisionFormData.name}
            onChange={(e) => setDecisionFormData({ ...decisionFormData, name: e.target.value })}
            required
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
            onClick={handleCloseDecisionDialog}
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDecisionSubmit}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
            color="secondary"
          >
            {editingDecision ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
