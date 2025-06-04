import React from 'react';
import { KanbanProvider, useKanban } from './KanbanContext';
import Toolbar from './components/Toolbar';
import Column from './components/Column';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import './KanbanBoard.css';

function KanbanBoardInner() {
  const { columns, isLoading, error } = useKanban();

  return (
    <div className="kanban-app-container">
      <Toolbar />
      <div className="kanban-board">
        {isLoading ? (
          <div className="kanban-loading">Loading...</div>
        ) : error ? (
          <div className="kanban-error">{error}</div>
        ) : (
          columns.map((col, idx) => 
            <Column key={col.id} column={col} index={idx} />
          )
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function KanbanBoard() {
  return (
    <KanbanProvider>
      <DndProvider backend={HTML5Backend}>
        <KanbanBoardInner />
      </DndProvider>
    </KanbanProvider>
  );
}
