import React, { useState, createContext, useContext } from 'react';
import { KanbanProvider, useKanban } from './KanbanContext';
import Toolbar from './components/Toolbar';
import Column from './components/Column';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ToastModal from './components/ToastModal';

import { COLUMN_TYPE } from './components/dndTypes';
import { useKanban } from './KanbanContext';

import './KanbanBoard.css';

// Feedback/toast context for global error/success UI
const FeedbackContext = createContext();
export function useFeedback() {
  return useContext(FeedbackContext);
}

function KanbanBoardInner() {
  const { columns, isLoading, error } = useKanban();
  const { showToast } = useFeedback();

  // Show critical Kanban board loading/fetching error as permanent toast
  // (Fallback since KanbanContext still sets error for major API issues)
  React.useEffect(() => {
    if (error) showToast(error, "error", 3800);
    // eslint-disable-next-line
  }, [error]);

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
  // Toast state: {msg, type, id}
  const [toast, setToast] = useState(null);

  // PUBLIC_INTERFACE
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ id: Date.now(), message, type, duration });
  };

  const closeToast = () => setToast(null);

  return (
    <KanbanProvider>
      <FeedbackContext.Provider value={{ showToast }}>
        <DndProvider backend={HTML5Backend}>
          <KanbanBoardInner />
          {toast && (
            <ToastModal
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={closeToast}
            />
          )}
        </DndProvider>
      </FeedbackContext.Provider>
    </KanbanProvider>
  );
}
