import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p><i className="fas fa-utensils"></i> Loading delicious recipes...</p>
  </div>
);

export default LoadingSpinner;