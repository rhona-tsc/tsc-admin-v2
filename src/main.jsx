import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios';
import { attachProtectedRequestToken } from './utils/protectedRequests.js';

axios.defaults.withCredentials = false;
axios.interceptors.request.use(config => attachProtectedRequestToken(
  config,
  import.meta.env.VITE_BACKEND_URL || 'https://tsc-backend-v2.onrender.com',
  () => localStorage.getItem('token') || sessionStorage.getItem('token') || '',
));

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
