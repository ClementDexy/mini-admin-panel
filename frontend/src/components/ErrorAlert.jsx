import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorAlert = ({ error, onRetry, retryLabel = 'Try Again' }) => {
  if (!error) return null;

  return (
    <div className="alert alert-danger d-flex align-items-start mb-4">
      <AlertCircle className="text-danger me-3 mt-1 flex-shrink-0" style={{ width: '20px', height: '20px' }} />
      <div className="flex-grow-1">
        <h6 className="alert-heading mb-1 fw-medium">
          Error Loading Data
        </h6>
        <p className="mb-0 text-danger">{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-outline-danger btn-sm ms-3 d-flex align-items-center"
        >
          <RefreshCw className="me-2" style={{ width: '16px', height: '16px' }} />
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;