import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'

interface RejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReject: (remark: string) => void
  loading?: boolean
}

export function RejectionDialog({ open, onOpenChange, onReject, loading = false }: RejectionDialogProps) {
  const [remark, setRemark] = useState('')

  const handleReject = () => {
    if (remark.trim()) {
      onReject(remark.trim())
      setRemark('')
    }
  }

  const handleCancel = () => {
    setRemark('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this request. This remark will be sent to the manager for review.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="remark">Rejection Reason *</Label>
            <Textarea
              id="remark"
              placeholder="Enter the reason for rejection..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject} 
            disabled={loading || !remark.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
