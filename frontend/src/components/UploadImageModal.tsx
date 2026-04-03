import { useState, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { SelectChangeEvent } from '@mui/material/Select'
import { uploadSourceImage, fetchSourceImage } from '../api'
import CategoryPickerSelect from './CategoryPickerSelect'
import type { Category, Program } from '../types'

/** Image file extensions accepted by the app (including TIFF). */
const ACCEPTED_IMAGE_TYPES = 'image/*,.tif,.tiff'

/** Recognised image extensions for drag-and-drop validation. */
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tif', '.tiff', '.svs',
])

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return IMAGE_EXTENSIONS.has(ext)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Polling interval for checking processing status (ms). */
const POLL_INTERVAL_MS = 3000

interface UploadImageModalProps {
  open: boolean
  onClose: () => void
  onUploaded: () => void
  /** Called when user dismisses the modal while processing is still in progress.
   *  The parent can continue polling in the background. */
  onProcessingDismissed?: (sourceImageId: number) => void
  categoryId?: number | null
  categories: Category[]
  programs: Program[]
  onAddCategory?: (label: string, parentId: number | null) => Promise<void>
  onEditCategory?: (categoryId: number, newLabel: string) => Promise<void>
  onToggleVisibility?: (categoryId: number, hidden: boolean) => Promise<void>
}

export default function UploadImageModal({
  open,
  onClose,
  onUploaded,
  onProcessingDismissed,
  categoryId: initialCategoryId,
  categories,
  programs,
  onAddCategory,
  onEditCategory,
  onToggleVisibility,
}: UploadImageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null)
  const [copyright, setCopyright] = useState('')
  const [note, setNote] = useState('')
  const [programIds, setProgramIds] = useState<number[]>([])
  const [active, setActive] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Processing-phase state
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('pending')
  const [sourceImageId, setSourceImageId] = useState<number | null>(null)
  const [processingDone, setProcessingDone] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync categoryId state when the dialog opens with a new prop value
  useEffect(() => {
    if (open) {
      setCategoryId(initialCategoryId ?? null) // eslint-disable-line react-hooks/set-state-in-effect -- syncing prop to state on dialog open
    }
  }, [open, initialCategoryId])

  // Poll for processing status when in the processing phase
  useEffect(() => {
    if (!processing || sourceImageId === null) return

    const poll = async () => {
      try {
        const src = await fetchSourceImage(sourceImageId)
        setProcessingStatus(src.status)
        if (src.status === 'completed') {
          setProcessingDone(true)
          setProcessing(false)
          if (pollRef.current) clearInterval(pollRef.current)
          onUploaded()
        } else if (src.status === 'failed') {
          setProcessing(false)
          setProcessingError(src.error_message || 'Processing failed. Check server logs.')
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {
        // Network error — keep polling
      }
    }

    // Run immediately, then set interval
    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [processing, sourceImageId, onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isImageFile(dropped)) {
      setFile(dropped)
      if (!name) {
        setName(dropped.name.replace(/\.[^.]+$/, ''))
      }
    }
  }, [name])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) {
        setFile(selected)
        if (!name) {
          setName(selected.name.replace(/\.[^.]+$/, ''))
        }
      }
    },
    [name],
  )

  const handleProgramChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value
    setProgramIds(typeof value === 'string' ? [] : value)
  }

  const handleReset = () => {
    setFile(null)
    setName('')
    setCategoryId(initialCategoryId ?? null)
    setCopyright('')
    setNote('')
    setProgramIds([])
    setActive(true)
    setError(null)
    setUploading(false)
    setUploadProgress(null)
    setProcessing(false)
    setProcessingStatus('pending')
    setSourceImageId(null)
    setProcessingDone(false)
    setProcessingError(null)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setUploadProgress(0)
    try {
      const result = await uploadSourceImage(
        file,
        name || undefined,
        categoryId ?? undefined,
        copyright || undefined,
        note || undefined,
        programIds.length > 0 ? programIds : undefined,
        active,
        (fraction) => setUploadProgress(fraction),
      )
      // Transition to the processing phase
      setUploading(false)
      setUploadProgress(null)
      setSourceImageId(result.id)
      setProcessingStatus(result.status)
      setProcessing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleClose = () => {
    // If still processing, hand off to parent for background tracking
    if (processing && sourceImageId !== null) {
      onProcessingDismissed?.(sourceImageId)
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    onClose()
  }

  // Determine the dialog title based on current phase
  const dialogTitle = processingDone
    ? 'Image Ready'
    : processingError
      ? 'Processing Failed'
      : processing
        ? 'Processing Image'
        : 'Add Image'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onExited: handleReset }}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
      >
        {/* Hide the upload form fields during and after processing */}
        {!processing && !processingDone && !processingError && (<>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={handleFileSelect}
        />
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mt: 1,
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 180,
            bgcolor: dragOver ? 'action.hover' : 'grey.50',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          <CloudUploadIcon
            sx={{ fontSize: 48, color: 'grey.500', mb: 1 }}
          />
          {file ? (
            <>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(file.size)}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" color="text.secondary">
                Drag and drop an image here
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                or{' '}
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  browse to upload
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Supports JPEG, PNG, TIFF, BMP, GIF, WebP, and SVS files.
              </Typography>
            </>
          )}
        </Box>
        <TextField
          label="Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Image name (defaults to filename)"
        />
        <Box>
          <CategoryPickerSelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onToggleVisibility={onToggleVisibility}
          />
        </Box>
        <TextField
          label="Copyright"
          fullWidth
          variant="outlined"
          value={copyright}
          onChange={(e) => setCopyright(e.target.value)}
          placeholder="e.g. 2026 BCIT"
        />
        <TextField
          label="Note"
          fullWidth
          variant="outlined"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Image note"
        />
        <FormControl fullWidth>
          <InputLabel id="upload-program-select-label">Program</InputLabel>
          <Select
            labelId="upload-program-select-label"
            multiple
            value={programIds}
            onChange={handleProgramChange}
            input={<OutlinedInput label="Program" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((id) => {
                  const prog = programs.find((p) => p.id === id)
                  return <Chip key={id} label={prog?.name ?? id} size="small" />
                })}
              </Box>
            )}
          >
            {programs.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Multiple programs can be selected.
          </Typography>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          }
          label="Active (visible to students)"
        />
        {uploading && uploadProgress !== null && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={Math.round(uploadProgress * 100)}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Uploading: {Math.round(uploadProgress * 100)}%
              {file ? ` (${formatBytes(Math.round(uploadProgress * file.size))} / ${formatBytes(file.size)})` : ''}
            </Typography>
          </Box>
        )}
        </>)}
        {/* Processing phase UI */}
        {(processing || processingDone || processingError) && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 3,
            }}
          >
            {processing && (
              <>
                <CircularProgress size={56} thickness={4} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Processing image…
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Generating zoomable tiles for <strong>{file?.name ?? 'your image'}</strong>.
                  This may take a moment for large files.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status: {processingStatus}
                </Typography>
              </>
            )}
            {processingDone && (
              <>
                <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Image processed successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your image is now available for viewing.
                </Typography>
              </>
            )}
            {processingError && (
              <>
                <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }} color="error">
                  Processing failed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {processingError}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Upload-phase hint (only before processing starts) */}
        {!processing && !processingDone && !processingError && (
          <Typography variant="caption" color="text.secondary">
            The image will be processed after upload to generate a zoomable view.
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {/* Before processing starts: Cancel / Add buttons */}
        {!processing && !processingDone && !processingError && (
          <>
            <Button onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!file || uploading}
              onClick={handleUpload}
              startIcon={uploading ? <CircularProgress size={16} /> : undefined}
            >
              {uploading ? 'Adding…' : 'Add'}
            </Button>
          </>
        )}
        {/* During processing: allow dismissing (parent tracks in background) */}
        {processing && (
          <Button onClick={handleClose}>
            Continue in background
          </Button>
        )}
        {/* After processing completes or fails: Close button */}
        {(processingDone || processingError) && (
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
