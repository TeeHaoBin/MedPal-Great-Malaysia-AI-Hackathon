'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Camera, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image';
}

const sampleFiles: UploadedFile[] = [
  { id: 1, name: 'blood_test_results.pdf', size: '2.3 MB', type: 'pdf' },
  { id: 2, name: 'prescription_image.jpg', size: '1.8 MB', type: 'image' }
];

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(sampleFiles);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: number) => {
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
          <Upload className={`mx-auto h-12 w-12 mb-4 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
        </motion.div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Medical Documents
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your files here, or click to browse
        </p>
        <p className="text-xs text-gray-500">
          Supports PDF, JPG, PNG files
        </p>
        
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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