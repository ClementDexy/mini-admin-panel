import React from 'react';
import TopNav from './TopNav';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <>
      <TopNav />
      <main className="container my-4">
        {children}
      </main>
      <Footer />
    </>
  );
}