import React, { useMemo, useState, useRef } from "react";
import { useKanban } from "../KanbanContext";
import "./FilterPanel.css";

// Basic utility to get unique values for a field among all cards.
function getUniqueFieldValues(cards, field) {
  return Array.from(
    new Set(cards.map((c) => (c[field] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

const FILTER_INFOS = [
  {
    key: "assignees",
    label: "Assignee",
    tooltip: "Filter cards by assigned team member. Type to add custom names.",
    icon: "👤",
  },
  {
    key: "priorities",
    label: "Priority",
    tooltip: "Filter by priority (Low/Medium/High/Critical). Multi-select supported.",
    icon: "⚡",
  },
  {
    key: "statuses",
    label: "Status",
    tooltip: "Filter cards by their workflow status (To Do, In Progress, etc).",
    icon: "📊",
  },
  {
    key: "columns",
    label: "Column",
    tooltip: "Show cards from only selected columns.",
    icon: "📦",
  },
  {
    key: "due_date",
    label: "Due Date",
    tooltip: "Filter by cards due on or after/before specific dates.",
    icon: "🗓️",
  },
];

function badge(n) {
  return n ? <span className="filter-badge" aria-label={`${n} selected`}>{n}</span> : null;
}

export default function FilterPanel({ onFiltersChange }) {
  const { cards, columns } = useKanban();

  const [filters, setFilters] = useState({
    assignees: [],
    priorities: [],
    statuses: [],
    columns: [],
    dueFrom: "",
    dueTo: "",
  });

  React.useEffect(() => {
    if (onFiltersChange) onFiltersChange(filters);
    // eslint-disable-next-line
  }, [filters]);

  const assigneeOptions = useMemo(
    () => getUniqueFieldValues(cards, "assignee"),
    [cards]
  );
  const priorityOptions = useMemo(
    () => getUniqueFieldValues(cards, "priority"),
    [cards]
  );
  const statusOptions = useMemo(
    () => getUniqueFieldValues(cards, "status"),
    [cards]
  );
  const columnOptions = useMemo(
    () => columns.map((col) => ({ id: col.id, title: col.title })),
    [columns]
  );

  // Typeahead state
  const [assigneeInput, setAssigneeInput] = useState("");
  const assigneeInputRef = useRef();

  // For remembering last undone per filter (for undo)
  const undoStack = useRef({});

  function handleSelectChange(field, value, type = "toggle") {
    setFilters((prev) => {
      if (!Array.isArray(prev[field])) return prev;
      let newArr;
      if (type === "add") {
        if (prev[field].includes(value)) return prev;
        newArr = [...prev[field], value];
      } else if (type === "remove") {
        newArr = prev[field].filter((v) => v !== value);
      } else {
        newArr = prev[field].includes(value)
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value];
      }
      // Save for undo
      undoStack.current[field] = prev[field];
      return { ...prev, [field]: newArr };
    });
  }

  function handleAssigneeInput(e) {
    setAssigneeInput(e.target.value);
  }

  function handleAssigneeInputKey(e) {
    if (e.key === "Enter" && assigneeInput.trim()) {
      handleSelectChange("assignees", assigneeInput.trim(), "add");
      setAssigneeInput("");
      assigneeInputRef.current && assigneeInputRef.current.blur();
    }
  }

  function handleDateChange(type, val) {
    setFilters((prev) => {
      undoStack.current[type] = prev[type];
      return { ...prev, [type]: val };
    });
  }

  function clearFilter(field, value = null) {
    setFilters((prev) => {
      undoStack.current[field] = prev[field];
      if (value) {
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      }
      // Clear all of the field
      if (["dueFrom", "dueTo"].includes(field))
        return { ...prev, [field]: "" };
      return { ...prev, [field]: [] };
    });
  }

  function undoFilter(field) {
    setFilters((prev) => ({
      ...prev,
      [field]: undoStack.current[field] ?? prev[field]
    }));
  }

  function resetFilters() {
    // Save full filter snapshot for undo/reset-all, omitted for simplicity
    setFilters({
      assignees: [],
      priorities: [],
      statuses: [],
      columns: [],
      dueFrom: "",
      dueTo: "",
    });
    setAssigneeInput("");
  }

  // Render badges for multi-filter select
  function renderFilterBadges() {
    return (
      <div className="filter-badge-row" style={{ display: "flex", gap: 13, alignItems: "center", flexWrap: "wrap" }}>
        <span className="filter-badge-label" title="Active filters">
          <svg width="17" height="17" fill="none" aria-hidden="true"><path d="M3 6a4 4 0 018 0v1a4 4 0 118 0v1" stroke="#38B2AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 13a3 3 0 016 0 3 3 0 016 0 3 3 0 016 0" stroke="#72e0d7" strokeWidth="2"/></svg>
        </span>
        {["assignees", "priorities", "statuses", "columns"].map(key =>
          filters[key] && filters[key].length
            ? <span key={key} className={"filter-badge-main" + (filters[key].length ? " active" : "")} title={`${filters[key].length} selected`}>
                {FILTER_INFOS.find(f => f.key === key)?.icon} {badge(filters[key].length)}
              </span>
            : null
        )}
        {[["dueFrom", "dueTo"]].map(fieldArr => {
          const n = Number(!!filters.dueFrom) + Number(!!filters.dueTo);
          return n
            ? <span key="date" className={"filter-badge-main" + (n ? " active" : "")} title="Date filter active">
                🗓️ {badge(n)}
              </span>
            : null;
        })}
      </div>
    );
  }

  // Get visual (active/inactive) for individual filter
  function isActive(key) {
    if (["dueFrom", "dueTo"].includes(key))
      return !!filters[key];
    return filters[key] && filters[key].length > 0;
  }

  // Compute helper for tooltip for undo
  function canUndo(key) {
    return !!undoStack.current[key];
  }

  // Helper to render chips for current filter values
  function renderChips() {
    const chips = [];
    filters.assignees.forEach((a) =>
      chips.push({
        label: `Assignee: ${a}`,
        field: "assignees",
        value: a,
      })
    );
    filters.priorities.forEach((p) =>
      chips.push({
        label: `Priority: ${p}`,
        field: "priorities",
        value: p,
      })
    );
    filters.statuses.forEach((s) =>
      chips.push({
        label: `Status: ${s}`,
        field: "statuses",
        value: s,
      })
    );
    filters.columns.forEach((colId) => {
      const col = columnOptions.find((c) => c.id === colId);
      chips.push({
        label: `Column: ${col ? col.title : colId}`,
        field: "columns",
        value: colId,
      });
    });
    if (filters.dueFrom)
      chips.push({
        label: `Due ≥ ${filters.dueFrom}`,
        field: "dueFrom",
        value: null,
      });
    if (filters.dueTo)
      chips.push({
        label: `Due ≤ ${filters.dueTo}`,
        field: "dueTo",
        value: null,
      });
    return chips;
  }

  // Responsive layout: stack on mobile
  return (
    <section className="kanban-filter-panel" aria-label="Kanban Filter Panel">
      <div className="filter-row">
        {/* Assignee */}
        <div className={"filter-group" + (isActive("assignees") ? " filter-active" : "")}
          title="Filter cards by assigned user"
          tabIndex={0}
          aria-label="Filter by assignee"
        >
          <label>
            👤 Assignee
            <span className="filter-tooltip" tabIndex={0} aria-label="tip" title="Filter cards by assigned team member. Type or pick name.">?</span>
            {badge(filters.assignees.length)}
          </label>
          <div className="filter-assignee-typeahead" title="Type or pick assignee name to filter.">
            <input
              ref={assigneeInputRef}
              value={assigneeInput}
              onChange={handleAssigneeInput}
              onKeyDown={handleAssigneeInputKey}
              placeholder="Type or Pick..."
              size={13}
              aria-label="Filter by assignee"
              list="kanban-filter-assignee-options"
              className={"filter-typeahead-input" + (isActive("assignees") ? " active" : "")}
            />
            <datalist id="kanban-filter-assignee-options">
              {assigneeOptions.map((a) => (
                <option value={a} key={a} />
              ))}
            </datalist>
            <div className="filter-chip-group">
              {filters.assignees.map((a) => (
                <span className="filter-chip" key={a}>
                  {a}{" "}
                  <button
                    type="button"
                    onClick={() => clearFilter("assignees", a)}
                    aria-label={`Remove assignee ${a}`}
                    title="Remove"
                  >×</button>
                </span>
              ))}
            </div>
            <div className="filter-indiv-actions">
              {isActive("assignees") && (
                <>
                  <button
                    className="filter-clear-btn"
                    type="button"
                    onClick={() => clearFilter("assignees")}
                    title="Clear all assignees"
                    aria-label="Clear assignee filter"
                  >Clear</button>
                  {canUndo("assignees") && (
                    <button
                      className="filter-undo-btn"
                      type="button"
                      onClick={() => undoFilter("assignees")}
                      title="Undo last assignee filter change"
                      aria-label="Undo remove assignees"
                    >Undo</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Priority */}
        <div className={"filter-group" + (isActive("priorities") ? " filter-active" : "")}
          tabIndex={0}
          title="Filter by priority (multi-select allowed)">
          <label>
            ⚡ Priority
            <span className="filter-tooltip" tabIndex={0} title="Filter by card priority, e.g., High/Medium/Low.">?</span>
            {badge(filters.priorities.length)}
          </label>
          <div className="filter-multiselect-wrap">
            <select
              multiple
              size={priorityOptions.length || 3}
              value={filters.priorities}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                );
                undoStack.current["priorities"] = filters.priorities;
                setFilters((prev) => ({ ...prev, priorities: selected }));
              }}
              className={"filter-multiselect" + (isActive("priorities") ? " active" : "")}
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="filter-indiv-actions">
              {isActive("priorities") && (
                <>
                  <button
                    className="filter-clear-btn"
                    type="button"
                    onClick={() => clearFilter("priorities")}
                    title="Clear all priorities"
                  >Clear</button>
                  {canUndo("priorities") && (
                    <button
                      className="filter-undo-btn"
                      type="button"
                      onClick={() => undoFilter("priorities")}
                      title="Undo last priority change"
                    >Undo</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Status */}
        <div className={"filter-group" + (isActive("statuses") ? " filter-active" : "")}
          tabIndex={0}
          title="Filter by status (multi-select)">
          <label>
            📊 Status
            <span className="filter-tooltip" tabIndex={0} title="Filter by workflow status, e.g., To Do, In Progress, Done.">?</span>
            {badge(filters.statuses.length)}
          </label>
          <div className="filter-multiselect-wrap">
            <select
              multiple
              size={statusOptions.length || 3}
              value={filters.statuses}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                );
                undoStack.current["statuses"] = filters.statuses;
                setFilters((prev) => ({ ...prev, statuses: selected }));
              }}
              className={"filter-multiselect" + (isActive("statuses") ? " active" : "")}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="filter-indiv-actions">
              {isActive("statuses") && (
                <>
                  <button
                    className="filter-clear-btn"
                    type="button"
                    onClick={() => clearFilter("statuses")}
                    title="Clear all statuses"
                  >Clear</button>
                  {canUndo("statuses") && (
                    <button
                      className="filter-undo-btn"
                      type="button"
                      onClick={() => undoFilter("statuses")}
                      title="Undo last status filter change"
                    >Undo</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Column */}
        <div className={"filter-group" + (isActive("columns") ? " filter-active" : "")}
          tabIndex={0}
          title="Filter by column (multi-select)">
          <label>
            📦 Column
            <span className="filter-tooltip" tabIndex={0} title="Show cards only in selected columns.">?</span>
            {badge(filters.columns.length)}
          </label>
          <div className="filter-multiselect-wrap">
            <select
              multiple
              size={columnOptions.length || 2}
              value={filters.columns}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                );
                undoStack.current["columns"] = filters.columns;
                setFilters((prev) => ({ ...prev, columns: selected }));
              }}
              className={"filter-multiselect" + (isActive("columns") ? " active" : "")}
            >
              {columnOptions.map((col) => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
            <div className="filter-indiv-actions">
              {isActive("columns") && (
                <>
                  <button
                    className="filter-clear-btn"
                    type="button"
                    onClick={() => clearFilter("columns")}
                    title="Clear all column filters"
                  >Clear</button>
                  {canUndo("columns") && (
                    <button
                      className="filter-undo-btn"
                      type="button"
                      onClick={() => undoFilter("columns")}
                      title="Undo last column filter change"
                    >Undo</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Due Date */}
        <div className={"filter-group filter-dates" + ((filters.dueFrom || filters.dueTo) ? " filter-active" : "")}
          tabIndex={0}
          title="Filter by due date range">
          <label>
            🗓️ Due Date
            <span className="filter-tooltip" tabIndex={0} title="Filter by cards due date range.">?</span>
            {badge(Number(!!filters.dueFrom) + Number(!!filters.dueTo))}
          </label>
          <div className="filter-date-wrap" style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              value={filters.dueFrom}
              onChange={(e) => handleDateChange("dueFrom", e.target.value)}
              className={"filter-date" + (filters.dueFrom ? " active" : "")}
              aria-label="Due date from"
              title="Due after or on"
            />
            <span style={{ color: "#888" }}>—</span>
            <input
              type="date"
              value={filters.dueTo}
              onChange={(e) => handleDateChange("dueTo", e.target.value)}
              className={"filter-date" + (filters.dueTo ? " active" : "")}
              aria-label="Due date to"
              title="Due before or on"
            />
            <div className="filter-indiv-actions">
              {(filters.dueFrom || filters.dueTo) && (
                <>
                  <button
                    className="filter-clear-btn"
                    type="button"
                    onClick={() => {
                      clearFilter("dueFrom");
                      clearFilter("dueTo");
                    }}
                    title="Clear due date filters"
                  >Clear</button>
                  {(canUndo("dueFrom") || canUndo("dueTo")) && (
                    <button
                      className="filter-undo-btn"
                      type="button"
                      onClick={() => {
                        if (canUndo("dueFrom")) undoFilter("dueFrom");
                        if (canUndo("dueTo")) undoFilter("dueTo");
                      }}
                      title="Undo last due date filter change"
                    >Undo</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reset all filters */}
        <div className="filter-group filter-actions">
          <button
            type="button"
            onClick={resetFilters}
            className="btn filter-reset-btn"
            aria-label="Reset all filters"
            title="Reset all filter fields to default"
          >
            Reset All
          </button>
        </div>
      </div>
      {/* Additional row: filter badges/visual cue, chips for all filters */}
      {renderFilterBadges()}
      <div className="filter-chipbar">
        {renderChips().map((chip, i) => (
          <span className="filter-chip" key={chip.label}>
            {chip.label}{" "}
            <button
              type="button"
              title="Remove filter"
              aria-label={`Remove ${chip.label}`}
              onClick={() => clearFilter(chip.field, chip.value)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
