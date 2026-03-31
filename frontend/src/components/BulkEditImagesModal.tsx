import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CategoryPickerSelect from './CategoryPickerSelect'
import type { Category } from '../types'

interface BulkEditImagesModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    category_id?: number | null
    copyright?: string
    origin?: string
    program?: string
    active?: boolean
  }) => void
  onDelete: () => void
  categories: Category[]
  selectedCount: number
}

export default function BulkEditImagesModal({
  open,
  onClose,
  onSave,
  onDelete,
  categories,
  selectedCount,
}: BulkEditImagesModalProps) {
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categoryEnabled, setCategoryEnabled] = useState(false)
  const [copyright, setCopyright] = useState('')
  const [copyrightEnabled, setCopyrightEnabled] = useState(false)
  const [origin, setOrigin] = useState('')
  const [originEnabled, setOriginEnabled] = useState(false)
  const [program, setProgram] = useState('')
  const [programEnabled, setProgramEnabled] = useState(false)
  const [active, setActive] = useState(true)
  const [activeEnabled, setActiveEnabled] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const resetForm = useCallback(() => {
    setCategoryId(null)
    setCategoryEnabled(false)
    setCopyright('')
    setCopyrightEnabled(false)
    setOrigin('')
    setOriginEnabled(false)
    setProgram('')
    setProgramEnabled(false)
    setActive(true)
    setActiveEnabled(false)
    setConfirmDelete(false)
  }, [])

  const handleEnter = useCallback(() => {
    resetForm()
  }, [resetForm])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = () => {
    const data: {
      category_id?: number | null
      copyright?: string
      origin?: string
      program?: string
      active?: boolean
    } = {}
    if (categoryEnabled) data.category_id = categoryId
    if (copyrightEnabled) data.copyright = copyright
    if (originEnabled) data.origin = origin
    if (programEnabled) data.program = program
    if (activeEnabled) data.active = active
    onSave(data)
    resetForm()
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete()
    resetForm()
  }

  const hasChanges =
    categoryEnabled || copyrightEnabled || originEnabled || programEnabled || activeEnabled

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle>Bulk Edit Images</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          Edit {selectedCount} selected{' '}
          {selectedCount === 1 ? 'image' : 'images'}. Toggle on the fields you
          want to change.
        </Typography>

        {/* Move Category */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={categoryEnabled}
                onChange={(e) => setCategoryEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Move Category"
          />
          {categoryEnabled && (
            <Box sx={{ mt: 1 }}>
              <CategoryPickerSelect
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                label="Destination Category"
              />
            </Box>
          )}
        </Box>

        {/* Copyright */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={copyrightEnabled}
                onChange={(e) => setCopyrightEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Change Copyright"
          />
          {copyrightEnabled && (
            <TextField
              label="Copyright"
              fullWidth
              variant="outlined"
              size="small"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Origin */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={originEnabled}
                onChange={(e) => setOriginEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Change Origin"
          />
          {originEnabled && (
            <TextField
              label="Origin"
              fullWidth
              variant="outlined"
              size="small"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Program */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={programEnabled}
                onChange={(e) => setProgramEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Change Program"
          />
          {programEnabled && (
            <TextField
              label="Program"
              fullWidth
              variant="outlined"
              size="small"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Status (Active) */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={activeEnabled}
                onChange={(e) => setActiveEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Change Status"
          />
          {activeEnabled && (
            <Box sx={{ mt: 1, pl: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                }
                label={active ? 'Active (visible to students)' : 'Inactive (hidden from students)'}
              />
            </Box>
          )}
        </Box>

        <Divider />

        {/* Delete */}
        <Box>
          <Button
            color="error"
            variant={confirmDelete ? 'contained' : 'outlined'}
            onClick={handleDelete}
            fullWidth
          >
            {confirmDelete
              ? `Confirm Delete ${selectedCount} ${selectedCount === 1 ? 'Image' : 'Images'}`
              : `Delete ${selectedCount} Selected ${selectedCount === 1 ? 'Image' : 'Images'}`}
          </Button>
          {confirmDelete && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
            >
              This action cannot be undone. Click again to confirm.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}
