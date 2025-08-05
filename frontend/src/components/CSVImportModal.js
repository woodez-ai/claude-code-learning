import React, { useState, useRef } from 'react';
import apiService from '../services/api';

const CSVImportModal = ({ portfolioId, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importId, setImportId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError('');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const validateFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await apiService.importPortfolioCSV(portfolioId, file);
      setImportId(response.import_id);
      setPreview(response.preview);
      setFile(null); // Clear file after successful upload
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importId) return;

    setConfirming(true);
    setError('');

    try {
      const response = await apiService.confirmCSVImport(importId);
      onImportComplete(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import data');
    } finally {
      setConfirming(false);
    }
  };

  const formatColumnMapping = (mapping) => {
    return Object.entries(mapping).map(([field, index]) => (
      <span key={field} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
        {field}: Column {index + 1}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import Portfolio CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!preview ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              <p className="mb-2">Upload a CSV file with your portfolio positions. The file should contain:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Symbol/Ticker</strong> - Stock symbol (required)</li>
                <li><strong>Quantity/Shares</strong> - Number of shares (required)</li>
                <li><strong>Purchase Price/Cost Basis</strong> - Price per share (required)</li>
                <li><strong>Purchase Date</strong> - Date acquired (optional)</li>
                <li><strong>Notes</strong> - Additional notes (optional)</li>
              </ul>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-6xl text-gray-400">📄</div>
                <div>
                  <p className="text-lg text-gray-600 mb-2">
                    Drop your CSV file here, or{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV files up to 10MB
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {file && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Upload & Preview'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Import Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Rows:</span> {preview.total_rows}
                </div>
                <div>
                  <span className="font-medium text-green-600">Valid:</span> {preview.valid_rows}
                </div>
                <div>
                  <span className="font-medium text-red-600">Errors:</span> {preview.error_rows}
                </div>
                <div>
                  <span className="font-medium">Ready to Import:</span> {preview.valid_rows}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Column Mapping:</h4>
              <div className="flex flex-wrap">
                {formatColumnMapping(preview.column_mapping)}
              </div>
            </div>

            {preview.errors && preview.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Import Errors:</h4>
                <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                  {preview.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Sample Data (First 10 rows):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.sample_data.map((row, index) => (
                      <tr key={index} className={row.errors?.length > 0 ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.row_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.symbol || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.quantity || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {row.purchase_price ? `$${row.purchase_price}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {row.purchase_date || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {row.errors?.length > 0 ? (
                            <span className="text-red-600 text-xs">
                              {row.errors.join(', ')}
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs">✓ Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setPreview(null);
                  setImportId(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={preview.valid_rows === 0 || confirming}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  `Import ${preview.valid_rows} Positions`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImportModal;