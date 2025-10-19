import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-light text-center text-muted py-3 mt-4 border-top">
      <div className="container d-flex justify-content-between align-items-center">
        <small>© {new Date().getFullYear()} Mini Admin Panel By Clement</small>
        <small>Admin Panel • Protobuf Export • RSA Signature Verification • SHA-384 Hashing</small>
        <small>
          <a href="/privacy" className="text-muted text-decoration-none me-3">Privacy</a>
          <a href="/terms" className="text-muted text-decoration-none">Terms</a>
        </small>
        
      </div>
    </footer>
  );
}