import React, { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm'; // Ange den korrekta sökvägen till LoginForm.js

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api') // Observera att vi använder den exakta serverdomänen och porten här
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="App">
            <h1>{message}</h1>
      <LoginForm />
    </div>
  );
}

export default App;
