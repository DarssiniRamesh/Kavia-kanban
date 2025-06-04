import React, { useState, createContext, useContext } from 'react';
import { KanbanProvider } from './KanbanContext';
import Toolbar from './components/Toolbar';
import Column from './components/Column';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ToastModal from './components/ToastModal';
import { COLUMN_TYPE } from './components/dndTypes';
import { useKanban } from './KanbanContext';
import { useDrop, useDrag } from 'react-dnd';

import './KanbanBoard.css';

// Feedback/toast context for global error/success UI
const FeedbackContext = createContext();
export function useFeedback() {
  return useContext(FeedbackContext);
}

function KanbanBoardInner() {
  const { columns, isLoading, error, reorderColumns } = useKanban();
  const { showToast } = useFeedback();
  const [draggedCol, setDraggedCol] = React.useState(null);

  React.useEffect(() => {
    if (error) showToast(error, "error", 3800);
    // eslint-disable-next-line
  }, [error]);

  // Handles local column reordering, triggers Supabase sync
  const moveColumn = (fromIdx, toIdx) => {
    // Defensive: do not swap to invalid
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= columns.length || toIdx >= columns.length) return;
    const reordered = [...columns];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    // Renumber positions: 1-based sequencing
    const newOrder = reordered.map((col, i) => ({
      id: col.id,
      position: i + 1
    }));
    reorderColumns(newOrder)
      .catch(e => showToast && showToast("Failed to reorder columns: " + (e.message || e), "error"));
  };

  return (
    <div className="kanban-app-container">
      <Toolbar />
      <div className="kanban-board" role="list" aria-label="Kanban Columns">
        {isLoading ? (
          <div className="kanban-loading">Loading...</div>
        ) : error ? (
          <div className="kanban-error">{error}</div>
        ) : (
          columns.map((col, idx) =>
            <DraggableKanbanColumn
              key={col.id}
              column={col}
              index={idx}
              moveColumn={moveColumn}
              draggedCol={draggedCol}
              setDraggedCol={setDraggedCol}
              totalColumns={columns.length}
            />
          )
        )}
      </div>
    </div>
  );
}

// Draggable+Droppable column wrapper
function DraggableKanbanColumn({ column, index, moveColumn, draggedCol, setDraggedCol, totalColumns }) {
  // Drag source
  const [{ isDragging }, drag, preview] = useDrag({
    type: COLUMN_TYPE,
    item: () => {
      setDraggedCol(index);
      return { id: column.id, index };
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => setDraggedCol(null),
  });

  // Drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: COLUMN_TYPE,
    canDrop: (item) => item.id !== column.id,
    hover: (item, monitor) => {
      if (item.index === index) return;
      // Monitor - do visual move only if not already moved in-place
      // moveColumn is not directly called here to prevent multiple rapid state updates.
    },
    drop: (item, monitor) => {
      if (item.index !== index) {
        moveColumn(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Accessible markup/ARIA
  const draggableProps = {
    ref: node => drag(drop(node)),
    'role': 'listitem',
    'aria-grabbed': isDragging,
    'aria-label': `Column: ${column.title}`,
    tabIndex: 0,
    style: {
      opacity: isDragging ? 0.3 : 1,
      zIndex: isDragging ? 90 : 1,
      boxShadow: isDragging ? '0 2px 18px #38B2AC66' : undefined,
      border: (isOver && canDrop) ? '3.5px solid #38B2AC' : undefined,
      outline: (isOver && canDrop) ? '2.5px dashed #42fae9' : undefined,
      transition: 'box-shadow .17s, outline .13s, opacity .19s, border .18s'
    }
  };

  // Keyboard reordering (accessibility): move left/right via arrow
  const handleKeyDown = e => {
    if (e.key === 'ArrowLeft' && index > 0) {
      moveColumn(index, index - 1);
    } else if (e.key === 'ArrowRight' && index < totalColumns - 1) {
      moveColumn(index, index + 1);
    }
  };

  return (
    <div {...draggableProps} onKeyDown={handleKeyDown}>
      <Column column={column} index={index} isDragging={isDragging} isOver={isOver && canDrop} />
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
