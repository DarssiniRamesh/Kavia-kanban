import React, { useState, createContext, useContext } from 'react';
import { KanbanProvider } from './KanbanContext';
import Toolbar from './components/Toolbar';
import Column from './components/Column';
import FilterPanel from './components/FilterPanel';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ToastModal from './components/ToastModal';
import { COLUMN_TYPE } from './components/dndTypes';
import { useKanban } from './KanbanContext';
import { useDrop, useDrag } from 'react-dnd';

import './KanbanBoard.css';

/**
 * Extract unique assignee names (trimmed, non-empty, case-insensitive deduped) from cards
 */
function getUniqueAssignees(cards) {
  const seen = new Set();
  return cards
    .map(c => (c.assignee || "").trim())
    .filter(Boolean)
    .filter(a => {
      if (seen.has(a.toLowerCase())) return false;
      seen.add(a.toLowerCase());
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

// Feedback/toast context for global error/success UI
const FeedbackContext = createContext();
export function useFeedback() {
  return useContext(FeedbackContext);
}

/**
 * Filters the provided cards array by combining all filters with AND logic.
 * For each selected filter (any of assignees, priorities, statuses, columns, due date range), a card must match all applied filters.
 * Accepts:
 *   cards: Array of card objects
 *   filters: { assignees:[], priorities:[], statuses:[], columns:[], dueFrom:"", dueTo:"" }
 *   columns: Array of columns (for mapping)
 * Returns:
 *   Filtered array of cards.
 */
function filterCardsAND(cards, filters, columns) {
  return cards.filter(c => {
    // Assignee multi-filter (intersection)
    if (
      filters.assignees &&
      filters.assignees.length > 0 &&
      (!c.assignee || !filters.assignees.includes(c.assignee))
    ) return false;
    // Priority
    if (
      filters.priorities &&
      filters.priorities.length > 0 &&
      (!c.priority || !filters.priorities.includes(c.priority))
    ) return false;
    // Status
    if (
      filters.statuses &&
      filters.statuses.length > 0 &&
      (!c.status || !filters.statuses.includes(c.status))
    ) return false;
    // Column (by id)
    if (
      filters.columns &&
      filters.columns.length > 0 &&
      (!c.column_id || !filters.columns.includes(c.column_id))
    ) return false;
    // Due Date Range
    if (filters.dueFrom || filters.dueTo) {
      if (!c.due_date) return false;
      if (filters.dueFrom && c.due_date < filters.dueFrom) return false;
      if (filters.dueTo && c.due_date > filters.dueTo) return false;
    }
    return true;
  });
}
/** Dropdown filter for Assignee, placed at top toolbar of the board */
function AssigneeFilterDropdown({ assignees, value, onChange }) {
  if (!assignees || assignees.length === 0) return null;
  return (
    <div style={{ marginRight: 18, minWidth: 130, display: "inline-flex", alignItems: "center" }}>
      <label htmlFor="assignee-filter-select" style={{ color: "#38B2AC", fontWeight: 600, marginRight: 7, letterSpacing: ".02em" }}>
        Assignee:
      </label>
      <select
        id="assignee-filter-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "5px 15px 5px 9px",
          borderRadius: 6,
          border: "1.4px solid #38B2AC",
          background: "#1b2437",
          color: "#ebfdff",
          fontSize: "1.05em"
        }}
      >
        <option value="__ALL__">All</option>
        {assignees.map(a => (
          <option value={a} key={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}

function KanbanBoardInner() {
  const { columns, isLoading, error, reorderColumns, cards } = useKanban();
  const { showToast } = useFeedback();
  const [draggedCol, setDraggedCol] = React.useState(null);

  // State: for assignee filter (dropdown); "__ALL__" = no filtering, else string
  const [assigneeFilter, setAssigneeFilter] = React.useState("__ALL__");

  // Filter state for full filter panel (reset if dropdown used for assignee)
  const [filters, setFilters] = React.useState({
    assignees: [],
    priorities: [],
    statuses: [],
    columns: [],
    dueFrom: "",
    dueTo: ""
  });

  // Get unique assignees for dropdown
  const assigneeOptions = React.useMemo(() => getUniqueAssignees(cards), [cards]);

  // If the user selects via dropdown: update filters.assignees accordingly (single value)
  React.useEffect(() => {
    if (assigneeFilter === "__ALL__") {
      // Turn off assignee filter in filters
      setFilters(f => ({ ...f, assignees: [] }));
    } else {
      setFilters(f => ({ ...f, assignees: [assigneeFilter] }));
    }
    // eslint-disable-next-line
  }, [assigneeFilter]);

  // Update dropdown selection if filter panel updates assignees filter (sync for multi/clear)
  React.useEffect(() => {
    // If multi-assignees selected, set dropdown to __ALL__
    if (filters.assignees.length > 1) setAssigneeFilter("__ALL__");
    else if (filters.assignees.length === 1) setAssigneeFilter(filters.assignees[0]);
    else setAssigneeFilter("__ALL__");
    // eslint-disable-next-line
  }, [filters.assignees]);

  // Filtered cards, memoized for perf (updates when filters/cards/columns/assigneeFilter change)
  const filteredCards = React.useMemo(
    () => filterCardsAND(cards || [], filters, columns),
    [cards, filters, columns]
  );

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

  // Only define DraggableKanbanColumn once!
  function DraggableKanbanColumn({ column, index, moveColumn, draggedCol, setDraggedCol, totalColumns, filteredCards }) {
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
        // No op to prevent multiple updates
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

    // Keyboard reordering for accessibility
    const handleKeyDown = e => {
      if (e.key === 'ArrowLeft' && index > 0) {
        moveColumn(index, index - 1);
      } else if (e.key === 'ArrowRight' && index < totalColumns - 1) {
        moveColumn(index, index + 1);
      }
    };

    // Pass filteredCards to Column if present
    return (
      <div {...draggableProps} onKeyDown={handleKeyDown}>
        <Column column={column} index={index} isDragging={isDragging} isOver={isOver && canDrop} filteredCards={filteredCards} />
      </div>
    );
  }

  return (
    <div className="kanban-app-container">
      <Toolbar />
      <FilterPanel onFiltersChange={setFilters} />
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
              filteredCards={filteredCards.filter(c => c.column_id === col.id)}
            />
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
