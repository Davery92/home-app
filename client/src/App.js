import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch('/dashboard.html')
      .then(res => res.text())
      .then(setHtml)
      .catch(err => console.error('Failed to load dashboard', err));
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default App;
