import { useEffect, useState } from 'react';
import './index.css';
import Login from './Login';

function App() {
  const [html, setHtml] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (!token) return;
    fetch('/dashboard.html', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.text())
      .then(setHtml)
      .catch(err => console.error('Failed to load dashboard', err));
  }, [token]);

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default App;
