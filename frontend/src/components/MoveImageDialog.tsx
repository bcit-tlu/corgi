import { useState, useCallback } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import CategoryPickerSelect from './CategoryPickerSelect'
import type { ApiImage } from '../api'
import type { Category } from '../types'

interface MoveImageDialogProps {
  open: boolean
  onClose: () => void
  onMove: (categoryId: number | null) => void
  image: ApiImage | null
  categories: Category[]
  onAddCategory?: (label: string, parentId: number | null) => Promise<void>
}

export default function MoveImageDialog({
  open,
  onClose,
  onMove,
  image,
  categories,
  onAddCategory,
}: MoveImageDialogProps) {
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null)

  const handleEnter = useCallback(() => {
    setNewCategoryId(image?.category_id ?? null)
  }, [image])

  const handleMove = () => {
    onMove(newCategoryId)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>Move Image</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {image && (
          <Typography variant="body2" color="text.secondary">
            Move &ldquo;{image.label}&rdquo; to a different category.
          </Typography>
        )}
        <CategoryPickerSelect
          categories={categories}
          value={newCategoryId}
          onChange={setNewCategoryId}
          label="Destination"
          onAddCategory={onAddCategory}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleMove} variant="contained">
          Move
        </Button>
      </DialogActions>
    </Dialog>
  )
}
