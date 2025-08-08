import { useEffect, useState } from 'react';
import './index.css';
import Login from './Login';
import Register from './Register';

function App() {
  const [html, setHtml] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

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
      if (showRegister) {
        return (
          <Register
            onRegisterComplete={() => setShowRegister(false)}
            onShowLogin={() => setShowRegister(false)}
          />
        );
      }
      return <Login onLogin={setToken} onShowRegister={() => setShowRegister(true)} />;
    }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setHtml('');
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded"
      >
        Logout
      </button>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default App;
