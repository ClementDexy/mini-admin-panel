import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: { spinner: 'spinner-border-sm', text: 'small' },
    medium: { spinner: '', text: '' },
    large: { spinner: '', text: 'h5' }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <div 
        className={`spinner-border text-primary ${sizeClasses[size].spinner}`}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className={`text-muted mt-3 fw-medium ${sizeClasses[size].text}`}>
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;