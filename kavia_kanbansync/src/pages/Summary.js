import React from 'react';
import { useKanban } from '../KanbanContext';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { COLUMN_TYPE } from '../components/dndTypes';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

/**
 * PUBLIC_INTERFACE
 * Summary (Presentation-friendly vertical columns view)
 * - Displays each Kanban column as a vertical panel (side-by-side) with minimal UI.
 * - Allows drag & drop reordering of columns (persisted via KanbanContext.reorderColumns).
 * - Provides controls to minimize/expand each column to customize the presentation.
 * - Keeps the application navigation header visible (Dashboard, Product).
 */
export default function Summary() {
  const { columns, cards, isLoading, error, reorderColumns } = useKanban();

  // Fullscreen toggle state (persisted)
  const [fullScreen, setFullScreen] = React.useState(() => {
    try {
      return localStorage.getItem('summary-fullscreen') === '1';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('summary-fullscreen', fullScreen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [fullScreen]);

  // Apply/remove fullscreen body class for presentation styling
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('summary-fullscreen', fullScreen);
      return () => {
        document.body.classList.remove('summary-fullscreen');
      };
    }
  }, [fullScreen]);

  // Keyboard shortcut: 'f' toggles fullscreen
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'f') {
        setFullScreen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Persist collapsed columns in localStorage
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      const raw = localStorage.getItem('summary-collapsed-columns');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('summary-collapsed-columns', JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const toggleCollapsed = (id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Cards by column, sorted by position
  const cardsByColumn = React.useMemo(() => {
    const map = new Map();
    (columns || []).forEach((c) => map.set(c.id, []));
    (cards || []).forEach((c) => {
      if (map.has(c.column_id)) map.get(c.column_id).push(c);
    });
    map.forEach((list) =>
      list.sort((a, b) => (a.position || 0) - (b.position || 0))
    );
    return map;
  }, [columns, cards]);

  // Move column via context API
  const moveColumn = (fromIdx, toIdx) => {
    if (!columns || fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= columns.length || toIdx >= columns.length) {
      return;
    }
    const reordered = [...columns];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    const ordered = reordered.map((col, i) => ({ id: col.id, position: i + 1 }));
    reorderColumns(ordered).catch(() => {
      // No toast here to keep summary clean
    });
  };

  function DraggableSummaryColumn({ column, index, totalColumns }) {
    // Drag source
    const [{ isDragging }, drag] = useDrag({
      type: COLUMN_TYPE,
      item: { id: column.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    // Drop target
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: COLUMN_TYPE,
      canDrop: (item) => item.id !== column.id,
      drop: (item) => {
        if (item.index !== index) {
          moveColumn(item.index, index);
          item.index = index;
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    });

    const items = cardsByColumn.get(column.id) || [];
    const isCollapsed = !!collapsed[column.id];

    return (
      <section
        ref={(node) => drag(drop(node))}
        className={`summary-col${isCollapsed ? ' collapsed' : ''}`}
        role="listitem"
        aria-label={`Column ${column.title}`}
        style={{
          opacity: isDragging ? 0.35 : 1,
          outline: (isOver && canDrop) ? '3px solid #38B2AC' : undefined,
          boxShadow: isDragging ? '0 2px 18px rgba(56,178,172,0.35)' : undefined,
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' && index > 0) moveColumn(index, index - 1);
          if (e.key === 'ArrowRight' && index < totalColumns - 1) moveColumn(index, index + 1);
          if (e.key === 'm') toggleCollapsed(column.id);
        }}
      >
        <header className="summary-col-header">
          <div className="summary-col-title" title={column.title}>
            <span className="summary-col-title-text">{column.title}</span>
            <span className="summary-col-count" title="Card count">{items.length}</span>
          </div>
          <div className="summary-col-actions">
            <button
              type="button"
              className="summary-col-actionbtn"
              aria-label={isCollapsed ? 'Expand column' : 'Minimize column'}
              title={isCollapsed ? 'Expand' : 'Minimize'}
              onClick={() => toggleCollapsed(column.id)}
            >
              {isCollapsed ? <UnfoldMoreIcon fontSize="small" /> : <UnfoldLessIcon fontSize="small" />}
            </button>
          </div>
        </header>

        {!isCollapsed && (
          <div className="summary-col-content">
            {items.length > 0 ? (
              <ul className="summary-col-cards" aria-label={`${column.title} cards`}>
                {items.map((card) => (
                  <li key={card.id} className="summary-col-card" title={card.description || card.feature}>
                    <span className="summary-chip-dot" aria-hidden
                      style={{ background: getStatusDotColor(card.status) }} />
                    <span className="summary-col-card-title">{card.feature}</span>
                    {card.assignee && (
                      <span className="summary-col-assignee" title="Assignee">@{card.assignee}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="summary-empty">No items</div>
            )}
          </div>
        )}
      </section>
    );
  }

  function getStatusDotColor(status) {
    const st = (status || '').toLowerCase();
    if (st.includes('progress')) return '#E1986E';
    if (st.includes('done')) return '#36B37E';
    if (st.includes('review')) return '#D3A94E';
    if (st.includes('hold')) return '#D7827F';
    if (st.includes('todo')) return '#A0A4AE';
    return '#CFCFD4';
  }

  if (isLoading) return <div className="kanban-loading">Loading...</div>;
  if (error) return <div className="kanban-error">{error}</div>;

  return (
    <div className="summary-page">
      <div className="container summary-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginTop: 8, marginBottom: 6 }}>Board Summary</h1>
            <p className="page-subtitle" style={{ marginBottom: 12 }}>
              Presentation view (clean, draggable columns). Tips: Left/Right to reorder, "m" to minimize, "f" to toggle fullscreen.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="summary-col-actionbtn"
              aria-label={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={() => setFullScreen(v => !v)}
              style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {fullScreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
              <span style={{ fontWeight: 700 }}>{fullScreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        <DndProvider backend={HTML5Backend}>
          <div className="summary-columns-board" role="list" aria-label="Summary columns (draggable)">
            {(columns || []).map((col, idx) => (
              <DraggableSummaryColumn
                key={col.id}
                column={col}
                index={idx}
                totalColumns={columns.length}
              />
            ))}
          </div>
        </DndProvider>
      </div>
    </div>
  );
}
