import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

interface DocumentUploadProps {
  section: string
  onDocumentUpload: (file: File, section: string) => Promise<void>
  existingDocument?: {
    name: string
    size: number
    uploadedAt: string
  } | null
  onDocumentRemove?: (section: string) => Promise<void>
}

export function DocumentUpload({ 
  section, 
  onDocumentUpload, 
  existingDocument, 
  onDocumentRemove 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const MAX_FILE_SIZE = 300 * 1024 // 300KB in bytes

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      })
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 300KB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await onDocumentUpload(selectedFile, section)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!onDocumentRemove) return

    setIsUploading(true)
    try {
      await onDocumentRemove(section)
      toast({
        title: "Success",
        description: "Document removed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload a PDF document (max 300KB) for this section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingDocument ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-medium text-green-700 dark:text-green-300">{existingDocument.name}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {formatFileSize(existingDocument.size)} • Uploaded {new Date(existingDocument.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {onDocumentRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-destructive dark:text-destructive-foreground hover:opacity-80"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/25 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF files only, max 300KB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-blue-700 dark:text-blue-300">{selectedFile.name}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-destructive dark:text-destructive-foreground hover:opacity-80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Only PDF files under 300KB are accepted</span>
        </div>
      </CardContent>
    </Card>
  )
}
