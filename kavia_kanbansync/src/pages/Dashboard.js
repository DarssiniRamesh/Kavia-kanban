/* PUBLIC_INTERFACE */
import React from 'react';
import { useKanban } from '../KanbanContext';

/** PUBLIC_INTERFACE
 * Dashboard
 * A high-level overview of the Kanban data:
 * - Status counts (To Do, In Progress, Review, Done, On Hold)
 * - Assignee summary (assignee -> number of cards)
 * - Column summary (column -> number of cards)
 * All powered by live data from KanbanContext (Supabase).
 */
export default function Dashboard() {
  const { cards, columns, isLoading, error } = useKanban();

  const statusOrder = ['To Do', 'In Progress', 'Review', 'Done', 'On Hold'];
  const statusCounts = React.useMemo(() => {
    const counts = Object.create(null);
    statusOrder.forEach(s => { counts[s] = 0; });
    (cards || []).forEach(c => {
      const s = c.status && statusOrder.includes(c.status) ? c.status : null;
      if (s) counts[s] += 1;
    });
    return counts;
  }, [cards]);

  const assigneeCounts = React.useMemo(() => {
    const map = Object.create(null);
    (cards || []).forEach(c => {
      const key = (c.assignee && String(c.assignee).trim()) || 'Unassigned';
      map[key] = (map[key] || 0) + 1;
    });
    // Convert to sorted array
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cards]);

  const colCounts = React.useMemo(() => {
    const map = new Map();
    columns.forEach(col => map.set(col.id, { title: col.title, count: 0 }));
    (cards || []).forEach(c => {
      if (map.has(c.column_id)) {
        const item = map.get(c.column_id);
        item.count += 1;
      }
    });
    return Array.from(map.values());
  }, [cards, columns]);

  const totalCards = cards?.length || 0;
  const uniqueAssignees = assigneeCounts.length;

  if (isLoading) {
    return <div className="kanban-loading">Loading...</div>;
  }
  if (error) {
    return <div className="kanban-error">{error}</div>;
  }

  return (
    <div className="container dashboard-container" style={{ paddingTop: 96, paddingBottom: 32 }}>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Live summary of your product board</p>

      {/* KPI cards */}
      <section className="dashboard-grid" aria-label="Key metrics">
        <div className="stat-card">
          <div className="stat-label">Total Features</div>
          <div className="stat-value">{totalCards}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Assignees</div>
          <div className="stat-value">{uniqueAssignees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Columns</div>
          <div className="stat-value">{columns.length}</div>
        </div>
      </section>

      {/* Status counts */}
      <section className="panel" aria-label="Status breakdown">
        <div className="panel-title">Status</div>
        <div className="status-row">
          {statusOrder.map(s => (
            <div className="status-chip" key={s} title={s}>
              <span className={"dot " + s.toLowerCase().replace(/\s+/g, '-')}></span>
              <span className="status-label">{s}</span>
              <span className="status-count">{statusCounts[s] || 0}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Assignee summary */}
      <section className="panel" aria-label="Assignee summary">
        <div className="panel-title">Assignees</div>
        <div className="simple-table" role="table" aria-label="Assignee counts">
          <div className="table-row header" role="row">
            <div role="columnheader">Assignee</div>
            <div role="columnheader" style={{ textAlign: 'right' }}>Features</div>
          </div>
          {assigneeCounts.map(([name, count]) => (
            <div className="table-row" role="row" key={name}>
              <div role="cell">{name}</div>
              <div role="cell" style={{ textAlign: 'right', fontWeight: 700 }}>{count}</div>
            </div>
          ))}
          {assigneeCounts.length === 0 && (
            <div className="table-row" role="row">
              <div role="cell" colSpan={2} style={{ opacity: 0.7 }}>No data</div>
            </div>
          )}
        </div>
      </section>

      {/* Column summary */}
      <section className="panel" aria-label="Column summary">
        <div className="panel-title">Columns</div>
        <div className="simple-table" role="table" aria-label="Column counts">
          <div className="table-row header" role="row">
            <div role="columnheader">Column</div>
            <div role="columnheader" style={{ textAlign: 'right' }}>Features</div>
          </div>
          {colCounts.map((c) => (
            <div className="table-row" role="row" key={c.title}>
              <div role="cell">{c.title}</div>
              <div role="cell" style={{ textAlign: 'right', fontWeight: 700 }}>{c.count}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
