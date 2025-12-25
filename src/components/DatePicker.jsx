import { useState, useRef, useEffect } from 'react'
import {
  TextField,
  Popover,
  Box,
  IconButton,
  Typography,
  Grid,
  Button,
} from '@mui/material'
import { CalendarToday as CalendarIcon, ChevronLeft, ChevronRight } from '@mui/icons-material'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DatePicker({ value, onChange, label, fullWidth = true, maxDate, ...props }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const date = new Date(value)
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      return new Date(value)
    }
    return null
  })

  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
    } else {
      setSelectedDate(null)
    }
  }, [value])

  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const formatDateLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateSelect = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
    const formattedDate = formatDateLocal(newDate)
    onChange({ target: { value: formattedDate } })
    handleClose()
  }

  const isDateDisabled = (day) => {
    if (!day) return false
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (maxDate) {
      const maxDateObj = new Date(maxDate)
      maxDateObj.setHours(0, 0, 0, 0)
      return checkDate > maxDateObj
    }
    
    return checkDate > today
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    const today = new Date()
    const maxDateObj = maxDate ? new Date(maxDate) : today
    
    // Don't allow navigating to future months
    if (nextMonth.getFullYear() > maxDateObj.getFullYear() || 
        (nextMonth.getFullYear() === maxDateObj.getFullYear() && nextMonth.getMonth() > maxDateObj.getMonth())) {
      return
    }
    
    setCurrentDate(nextMonth)
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
    const formattedDate = formatDateLocal(today)
    onChange({ target: { value: formattedDate } })
    handleClose()
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    const isSelected = (day) => {
      if (!day || !selectedDate) return false
      return selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear()
    }

    const isToday = (day) => {
      if (!day) return false
      const today = new Date()
      return day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
    }

    return (
      <Box sx={{ p: 1.5, minWidth: 280, maxWidth: 300 }}>
        {/* Month/Year Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1.5,
          px: 0.5
        }}>
          <IconButton 
            size="small" 
            onClick={handlePrevMonth}
            sx={{ 
              padding: 0.5,
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleNextMonth}
            disabled={
              maxDate 
                ? (currentDate.getFullYear() >= new Date(maxDate).getFullYear() && 
                   currentDate.getMonth() >= new Date(maxDate).getMonth())
                : (currentDate.getFullYear() >= new Date().getFullYear() && 
                   currentDate.getMonth() >= new Date().getMonth())
            }
            sx={{ 
              padding: 0.5,
              '&:hover': { backgroundColor: 'action.hover' },
              '&.Mui-disabled': { opacity: 0.5 }
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>

        {/* Day headers */}
        <Grid container spacing={0.3} sx={{ mb: 1 }}>
          {DAYS.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography
                variant="caption"
                sx={{
                  textAlign: 'center',
                  fontWeight: 500,
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar days */}
        <Grid container spacing={0.3}>
          {days.map((day, index) => {
            const disabled = isDateDisabled(day)
            return (
              <Grid item xs={12 / 7} key={index}>
                {day ? (
                  <Button
                    onClick={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    sx={{
                      minWidth: 32,
                      width: '100%',
                      height: 32,
                      p: 0,
                      borderRadius: 0.75,
                      fontSize: '0.85rem',
                      backgroundColor: isSelected(day) ? 'primary.main' : 'transparent',
                      color: disabled 
                        ? 'text.disabled' 
                        : isSelected(day) 
                          ? 'white' 
                          : isToday(day) 
                            ? 'primary.main' 
                            : 'text.primary',
                      fontWeight: isSelected(day) || isToday(day) ? 'bold' : 'normal',
                      border: isToday(day) && !isSelected(day) ? '1.5px solid' : 'none',
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: disabled 
                          ? 'transparent' 
                          : isSelected(day) 
                            ? 'primary.dark' 
                            : 'action.hover',
                      },
                      '&.Mui-disabled': {
                        color: 'text.disabled',
                        opacity: 0.4,
                      },
                    }}
                  >
                    {day}
                  </Button>
                ) : (
                  <Box sx={{ height: 32 }} />
                )}
              </Grid>
            )
          })}
        </Grid>

        {/* Today button */}
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Button 
            size="small" 
            onClick={handleToday} 
            variant="outlined"
            sx={{ 
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              minHeight: 'auto'
            }}
          >
            Today
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <>
      <TextField
        {...props}
        label={label}
        value={value || ''}
        fullWidth={fullWidth}
        size="large"
        InputProps={{
          endAdornment: (
            <IconButton onClick={handleClick} edge="end" size="small" sx={{ mr: 0.5 }}>
              <CalendarIcon />
            </IconButton>
          ),
          sx: {
          }
        }}
        onClick={handleClick}
        readOnly
        sx={{
          '& .MuiInputBase-root': {
            height: '56px', // Match button height
          }
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {renderCalendar()}
      </Popover>
    </>
  )
}

