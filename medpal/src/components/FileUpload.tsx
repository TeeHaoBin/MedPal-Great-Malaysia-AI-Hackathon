'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Camera, Scan, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image';
  s3Key?: string;
  url?: string;
}

const sampleFiles: UploadedFile[] = [
  { id: '1', name: 'blood_test_results.pdf', size: '2.3 MB', type: 'pdf' },
  { id: '2', name: 'prescription_image.jpg', size: '1.8 MB', type: 'image' }
];

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(sampleFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFileToS3 = async (file: File): Promise<UploadedFile | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.file;
      } else {
        console.error('Upload failed:', result.error);
        alert(`Upload failed: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      return null;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadedFile = await uploadFileToS3(file);
      if (uploadedFile) {
        newFiles.push(uploadedFile);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    setIsUploading(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    await handleFileUpload(files);
  }, []);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    await handleFileUpload(files);
    e.target.value = ''; // Reset input
  };

  const removeFile = (id: string) => {
    setUploadedFiles(files => files.filter(file => file.id !== id));
  };

  const getFileIcon = (type: 'pdf' | 'image') => {
    return type === 'pdf' ? FileText : Camera;
  };

  return (
    <div className="space-y-6">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isUploading ? (
            <Loader2 className="mx-auto h-12 w-12 mb-4 text-blue-500 animate-spin" />
          ) : (
            <Upload className={`mx-auto h-12 w-12 mb-4 ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`} />
          )}
        </motion.div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isUploading ? 'Uploading...' : 'Upload Medical Documents'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {isUploading 
            ? 'Please wait while your files are being uploaded'
            : 'Drag and drop your files here, or click to browse'
          }
        </p>
        <p className="text-xs text-gray-500">
          Supports PDF, JPG, PNG files (Max 10MB each)
        </p>
        
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </motion.div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded border">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                      {file.s3Key && (
                        <p className="text-xs text-green-600">✓ Uploaded to S3</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
      >
        <Scan className="w-5 h-5" />
        <span>Process with OCR</span>
      </motion.button>
    </div>
  );
}