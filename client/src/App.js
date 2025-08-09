import { useEffect, useRef, useState } from 'react';
import './index.css';
import Login from './Login';
import Register from './Register';

function App() {
  const [html, setHtml] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);
  const containerRef = useRef(null);

  const loadPage = (url) => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.text())
      .then(text => {
        setHtml(text);
        setTimeout(() => {
          const scripts = containerRef.current?.querySelectorAll('script') || [];
          scripts.forEach(script => {
            try {
              // eslint-disable-next-line no-eval
              eval(script.textContent);
            } catch (e) {
              console.error('Error executing script', e);
            }
          });
        }, 0);
      })
      .catch(err => console.error('Failed to load page', err));
  };

  useEffect(() => {
    if (!token) return;
    loadPage('/dashboard.html');
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      if (anchor.dataset.nav !== undefined) {
        e.preventDefault();
        loadPage(anchor.getAttribute('href'));
      }
      if (anchor.dataset.logout !== undefined) {
        e.preventDefault();
        handleLogout();
      }
    };
    const current = containerRef.current;
    current?.addEventListener('click', handler);
    return () => current?.removeEventListener('click', handler);
  }, [token, html]);

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
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default App;
