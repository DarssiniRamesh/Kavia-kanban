import React from 'react';
import './App.css';
import KanbanBoard from './KanbanBoard';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA KanbanSync
            </div>
            <span style={{color: "#38B2AC"}}>AI Board</span>
          </div>
        </div>
      </nav>

      <main>
        <KanbanBoard />
      </main>
    </div>
  );
}

export default App;