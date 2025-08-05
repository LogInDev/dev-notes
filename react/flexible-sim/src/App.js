import React from 'react';
import MessageSimulator from './simulator/MessageSimulator';

function App() {
  return (
      <div style={{ background: '#f8fafb', minHeight: '100vh', padding: 60 }}>
        <h2 style={{ color: '#1976d2' }}>Flexible Message Simulator</h2>
        <MessageSimulator />
      </div>
  );
}
export default App;
