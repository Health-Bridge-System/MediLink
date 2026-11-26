import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './styles/complete.css';

const root=document.getElementById('root');
if(!root) throw new Error('Missing #root element in frontend/index.html');
createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
