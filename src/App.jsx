import React, { useState } from 'react';
import Ii from './ii';
import Admin from './admin';
import './App.css';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return isAdmin
    ? <Admin onExit={() => setIsAdmin(false)} />
    : <Ii openAdmin={() => setIsAdmin(true)} />;
}