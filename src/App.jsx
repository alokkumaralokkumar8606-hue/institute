import React, { useState } from 'react';
import Ii from './ii';
import Admin from './admin';
import './App.css';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  return isAdmin ? <Admin onExit={() => setIsAdmin(false)} /> : <>
    <div className="public-admin-bar"><button onClick={() => setIsAdmin(true)}>🔐 Admin Login</button></div>
    <Ii />
  </>;
}
