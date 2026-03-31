import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Category } from '../types'
import { MAX_DEPTH } from '../types'
import AddCategoryDialog from './AddCategoryDialog'

interface FlatOption {
  id: number
  label: string
  depth: number
}

function flattenTree(nodes: Category[], depth: number = 0): FlatOption[] {
  const result: FlatOption[] = []
  for (const node of nodes) {
    result.push({ id: node.id, label: node.label, depth })
    result.push(...flattenTree(node.children, depth + 1))
  }
  return result
}

interface ManageCategoriesDialogProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  onAddCategory: (label: string, parentId: number | null) => Promise<void>
  onDeleteCategory: (categoryId: number) => Promise<void>
}

export default function ManageCategoriesDialog({
  open,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}: ManageCategoriesDialogProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addParentId, setAddParentId] = useState<number | null>(null)
  const [addParentDepth, setAddParentDepth] = useState(0)

  const options = useMemo(() => flattenTree(categories), [categories])

  const handleAddClick = (parentId: number | null, depth: number) => {
    setAddParentId(parentId)
    setAddParentDepth(depth)
    setAddDialogOpen(true)
  }

  const handleAddCategory = async (label: string) => {
    await onAddCategory(label, addParentId)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add/Edit Categories</DialogTitle>
        <DialogContent>
          <List dense disablePadding>
            {/* Root-level add button */}
            <ListItem
              sx={{ pl: 2 }}
              secondaryAction={
                <Tooltip title="Add root category">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleAddClick(null, 0)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={<em>Root level</em>}
                primaryTypographyProps={{ color: 'text.secondary' }}
              />
            </ListItem>

            {options.map((opt) => (
              <ListItem
                key={opt.id}
                sx={{ pl: 2 + opt.depth * 3 }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {opt.depth + 1 < MAX_DEPTH && (
                      <Tooltip title="Add child category">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleAddClick(opt.id, opt.depth + 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete category">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onDeleteCategory(opt.id)}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <>
                      {opt.depth > 0 && (
                        <Typography component="span" color="text.secondary">
                          {'\u2514 '}
                        </Typography>
                      )}
                      {opt.label}
                    </>
                  }
                />
              </ListItem>
            ))}

            {options.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No categories yet."
                  primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <AddCategoryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddCategory}
        currentDepth={addParentDepth}
      />
    </>
  )
}
