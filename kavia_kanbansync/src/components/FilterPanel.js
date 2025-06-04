import React, { useMemo, useState, useRef } from "react";
import { useKanban } from "../KanbanContext";
import "./FilterPanel.css";

/**
 * Helper: Get unique values for a field among all cards (case-insensitive, trimmed, deduped).
 */
function getUniqueFieldValues(cards, field) {
  return Array.from(
    new Set(cards.map((c) => (c[field] || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

// Helper: badge, returns styled count
function Badge({ n }) {
  return n ? (
    <span className="filter-badge" aria-label={`${n} selected`}>
      {n}
    </span>
  ) : null;
}

/**
 * PUBLIC_INTERFACE
 * Modern, grouped, accessible FilterPanel for Kanban board. 
 * Features: grouped controls, touch-optimized, accessible cues, modern visuals.
 */
export default function FilterPanel({ onFiltersChange }) {
  const { cards, columns } = useKanban();

  // Main filter state
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

  // Dynamically computed options
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

  // Typeahead input for assignee (mobile touch-friendliness)
  const [assigneeInput, setAssigneeInput] = useState("");
  const assigneeInputRef = useRef();
  const undoStack = useRef({});

  // Utility: determine visual active state
  const isActive = (field) => {
    if (["dueFrom", "dueTo"].includes(field)) return !!filters[field];
    return Array.isArray(filters[field]) && filters[field].length > 0;
  };

  // Utility: can undo per field
  const canUndo = (field) => !!undoStack.current[field];

  // --- Generic handlers ---

  // For chips & multi-toggle
  function handleToggleFilter(field, value) {
    setFilters((prev) => {
      if (!Array.isArray(prev[field])) return prev;
      let newArr = prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value];
      undoStack.current[field] = prev[field];
      return { ...prev, [field]: newArr };
    });
  }

  // For select-multi fields
  function handleMultiSelect(field, arr) {
    undoStack.current[field] = filters[field];
    setFilters((prev) => ({ ...prev, [field]: arr }));
  }

  // For adding new Assignee from typeahead
  function handleAssigneeInput(e) {
    setAssigneeInput(e.target.value);
  }

  function handleAssigneeKeyDown(e) {
    if (e.key === "Enter" && assigneeInput.trim()) {
      if (!filters.assignees.includes(assigneeInput.trim())) {
        undoStack.current.assignees = filters.assignees;
        setFilters((prev) => ({
          ...prev,
          assignees: [...prev.assignees, assigneeInput.trim()],
        }));
      }
      setAssigneeInput("");
      assigneeInputRef.current && assigneeInputRef.current.blur();
    }
  }

  // DateRange
  function handleDateChange(type, val) {
    undoStack.current[type] = filters[type];
    setFilters((prev) => ({ ...prev, [type]: val }));
  }

  // Clear whole filter or single value from array
  function clearFilter(field, value = null) {
    if (value !== null) {
      setFilters((prev) => {
        undoStack.current[field] = prev[field];
        return { ...prev, [field]: prev[field].filter((v) => v !== value) };
      });
    } else {
      undoStack.current[field] = filters[field];
      setFilters((prev) =>
        ["dueFrom", "dueTo"].includes(field)
          ? { ...prev, [field]: "" }
          : { ...prev, [field]: [] }
      );
    }
  }

  // Undo per field
  function undoFilter(field) {
    setFilters((prev) => ({
      ...prev,
      [field]: undoStack.current[field] ?? prev[field],
    }));
  }

  // Reset all
  function resetFilters() {
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

  // Modern filter chips summary
  function renderActiveChips() {
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
      });
    if (filters.dueTo)
      chips.push({
        label: `Due ≤ ${filters.dueTo}`,
        field: "dueTo",
      });
    return chips;
  }

  // --- UI Layout, grouped and modern ---

  return (
    <section
      className="kanban-filter-panel"
      aria-label="Kanban Filter Panel"
      role="region"
    >
      {/* Accessibility skip-link shortcut */}
      <a
        href="#kanban-board-main"
        style={{
          position: "absolute",
          left: "-1000px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        tabIndex={0}
        aria-label="Skip filters and go to board"
      >
        Skip Filter Panel
      </a>
      {/* Section: All filters in clear separate groups */}
      <form
        className="filter-row"
        spellCheck={false}
        autoComplete="off"
        aria-label="Kanban Filters"
        onSubmit={(e) => e.preventDefault()} // No submission
        tabIndex={-1}
      >
        {/* Assignee Filter Group */}
        <fieldset
          className={"filter-group" + (isActive("assignees") ? " filter-active" : "")}
          aria-label="Filter by assignee"
        >
          <legend>
            <span role="img" aria-label="Person" style={{ fontSize: 17 }}>
              👤
            </span>{" "}
            Assignee
          </legend>
          <label htmlFor="kanban-filter-assignee-typeahead" style={{ marginBottom: 3 }}>
            <span style={{ fontSize: "0.97em" }}>Type or select a name</span>
            <span className="filter-tooltip" tabIndex={0} aria-label="tip" title="Filter cards by assigned team member. Type or pick name.">?</span>
            <Badge n={filters.assignees.length} />
          </label>
          <input
            ref={assigneeInputRef}
            id="kanban-filter-assignee-typeahead"
            value={assigneeInput}
            onChange={handleAssigneeInput}
            onKeyDown={handleAssigneeKeyDown}
            placeholder="Add or filter..."
            aria-label="Filter by assignee"
            list="kanban-filter-assignee-options"
            className={"filter-typeahead-input" + (isActive("assignees") ? " active" : "")}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            style={{ minWidth: "110px" }}
          />
          <datalist id="kanban-filter-assignee-options">
            {assigneeOptions.map((a) => (
              <option value={a} key={a} />
            ))}
          </datalist>
          {/* Chips row under input, each removable */}
          <div className="filter-chip-group" style={{ marginTop: 5, minHeight: 24 }}>
            {filters.assignees.map((a) => (
              <span className="filter-chip" key={a}>
                {a}
                <button
                  tabIndex={0}
                  type="button"
                  onClick={() => clearFilter("assignees", a)}
                  aria-label={`Remove assignee ${a}`}
                  title="Remove"
                  style={{ marginLeft: 2 }}
                >
                  ×
                </button>
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
                >
                  Clear
                </button>
                {canUndo("assignees") && (
                  <button
                    className="filter-undo-btn"
                    type="button"
                    onClick={() => undoFilter("assignees")}
                    title="Undo last assignee filter change"
                    aria-label="Undo remove assignees"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
        {/* Priority Multi-select */}
        <fieldset
          className={"filter-group" + (isActive("priorities") ? " filter-active" : "")}
          aria-label="Filter by priority"
        >
          <legend>
            <span role="img" aria-label="Lightning" style={{ fontSize: 17 }}>
              ⚡
            </span>{" "}
            Priority
          </legend>
          <label htmlFor="kanban-filter-priority-select">
            <span style={{ fontSize: "0.97em" }}>Priorities</span>
            <span
              className="filter-tooltip"
              tabIndex={0}
              title="Filter by card priority, e.g., High/Medium/Low."
              aria-label="Priority filter help"
            >
              ?
            </span>
            <Badge n={filters.priorities.length} />
          </label>
          <select
            id="kanban-filter-priority-select"
            multiple
            value={filters.priorities}
            onChange={(e) =>
              handleMultiSelect(
                "priorities",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("priorities") ? " active" : "")}
            size={Math.min(priorityOptions.length, 3) || 3}
            aria-label="Select priorities"
            style={{ minWidth: 110 }}
          >
            {priorityOptions.map((p) => (
              <option value={p} key={p}>{p}</option>
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
                >
                  Clear
                </button>
                {canUndo("priorities") && (
                  <button
                    className="filter-undo-btn"
                    type="button"
                    onClick={() => undoFilter("priorities")}
                    title="Undo last priority change"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
        {/* Status Multi-select */}
        <fieldset
          className={"filter-group" + (isActive("statuses") ? " filter-active" : "")}
          aria-label="Filter by status"
        >
          <legend>
            <span role="img" aria-label="Chart" style={{ fontSize: 17 }}>
              📊
            </span>{" "}
            Status
          </legend>
          <label htmlFor="kanban-filter-status-select">
            <span style={{ fontSize: "0.97em" }}>Statuses</span>
            <span className="filter-tooltip" tabIndex={0} title="Filter by workflow status, e.g., To Do, In Progress, Done." aria-label="Status filter help">
              ?
            </span>
            <Badge n={filters.statuses.length} />
          </label>
          <select
            id="kanban-filter-status-select"
            multiple
            value={filters.statuses}
            onChange={(e) =>
              handleMultiSelect(
                "statuses",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("statuses") ? " active" : "")}
            size={Math.min(statusOptions.length, 3) || 3}
            aria-label="Select statuses"
            style={{ minWidth: 110 }}
          >
            {statusOptions.map((s) => (
              <option value={s} key={s}>{s}</option>
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
                >
                  Clear
                </button>
                {canUndo("statuses") && (
                  <button
                    className="filter-undo-btn"
                    type="button"
                    onClick={() => undoFilter("statuses")}
                    title="Undo last status filter change"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
        {/* Column Multi-select */}
        <fieldset
          className={"filter-group" + (isActive("columns") ? " filter-active" : "")}
          aria-label="Filter by column"
        >
          <legend>
            <span role="img" aria-label="Box" style={{ fontSize: 17 }}>
              📦
            </span>{" "}
            Column
          </legend>
          <label htmlFor="kanban-filter-column-select">
            <span style={{ fontSize: "0.97em" }}>Columns</span>
            <span className="filter-tooltip" tabIndex={0} title="Show cards only in selected columns." aria-label="Column filter help">
              ?
            </span>
            <Badge n={filters.columns.length} />
          </label>
          <select
            id="kanban-filter-column-select"
            multiple
            value={filters.columns}
            onChange={(e) =>
              handleMultiSelect(
                "columns",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className={"filter-multiselect" + (isActive("columns") ? " active" : "")}
            size={Math.min(columnOptions.length, 3) || 2}
            aria-label="Select columns"
            style={{ minWidth: 110 }}
          >
            {columnOptions.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
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
                >
                  Clear
                </button>
                {canUndo("columns") && (
                  <button
                    className="filter-undo-btn"
                    type="button"
                    onClick={() => undoFilter("columns")}
                    title="Undo last column filter change"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
        {/* Due Date Group */}
        <fieldset
          className={"filter-group filter-dates" + ((filters.dueFrom || filters.dueTo) ? " filter-active" : "")}
          aria-label="Filter by Due Date range"
        >
          <legend>
            <span role="img" aria-label="Calendar" style={{ fontSize: 17 }}>
              🗓️
            </span>{" "}
            Due Date
          </legend>
          <div className="filter-date-wrap" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              type="date"
              value={filters.dueFrom}
              onChange={(e) => handleDateChange("dueFrom", e.target.value)}
              className={"filter-date" + (filters.dueFrom ? " active" : "")}
              aria-label="Due date from"
              title="Due after or on"
              style={{ minWidth: 95, flex: 1 }}
            />
            <span aria-hidden style={{ color: "#888", fontWeight: 500 }}>—</span>
            <input
              type="date"
              value={filters.dueTo}
              onChange={(e) => handleDateChange("dueTo", e.target.value)}
              className={"filter-date" + (filters.dueTo ? " active" : "")}
              aria-label="Due date to"
              title="Due before or on"
              style={{ minWidth: 95, flex: 1 }}
            />
          </div>
          <div className="filter-indiv-actions" style={{ marginTop: 4 }}>
            {(filters.dueFrom || filters.dueTo) && (
              <>
                <button
                  className="filter-clear-btn"
                  type="button"
                  onClick={() => { clearFilter("dueFrom"); clearFilter("dueTo"); }}
                  title="Clear due date filters"
                >
                  Clear
                </button>
                {(canUndo("dueFrom") || canUndo("dueTo")) && (
                  <button
                    className="filter-undo-btn"
                    type="button"
                    onClick={() => {
                      if (canUndo("dueFrom")) undoFilter("dueFrom");
                      if (canUndo("dueTo")) undoFilter("dueTo");
                    }}
                    title="Undo last due date change"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        </fieldset>
        {/* Reset All */}
        <div className="filter-group filter-actions" style={{ alignSelf: "flex-end" }}>
          <button
            type="button"
            className="btn filter-reset-btn"
            aria-label="Reset all filters"
            title="Reset all filter fields to default"
            style={{
              background: "#142a46",
              color: "#fa8686",
              fontWeight: 700,
              width: "100%",
              letterSpacing: "0.03em"
            }}
            onClick={resetFilters}
          >
            Reset All
          </button>
        </div>
      </form>
      {/* Visual: summary badges for quick glance */}
      <div className="filter-badge-row" style={{ marginTop: 3 }}>
        <span className="filter-badge-label" title="Active filters">
          <svg width="17" height="17" fill="none" aria-hidden="true"><path d="M3 6a4 4 0 018 0v1a4 4 0 118 0v1" stroke="#38B2AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 13a3 3 0 016 0 3 3 0 016 0 3 3 0 016 0" stroke="#72e0d7" strokeWidth="2"/></svg>
        </span>
        {["assignees", "priorities", "statuses", "columns"].map((k) =>
          filters[k] && filters[k].length
            ? (
              <span key={k} className={"filter-badge-main active"}>
                {k === "assignees" && <>👤</>}
                {k === "priorities" && <>⚡</>}
                {k === "statuses" && <>📊</>}
                {k === "columns" && <>📦</>}
                <Badge n={filters[k].length} />
              </span>
            )
            : null
        )}
        {(filters.dueFrom || filters.dueTo) && (
          <span className="filter-badge-main active" title="Date filter active">
            🗓️
            <Badge n={Number(!!filters.dueFrom) + Number(!!filters.dueTo)} />
          </span>
        )}
      </div>
      {/* Chip bar for currently active filters */}
      <div className="filter-chipbar" role="list" aria-label="Active filter list">
        {renderActiveChips().map((chip) => (
          <span role="listitem" className="filter-chip" key={chip.label + chip.value}>
            {chip.label}
            <button
              tabIndex={0}
              type="button"
              title="Remove filter"
              aria-label={`Remove ${chip.label}`}
              onClick={() => clearFilter(chip.field, chip.value)}
              style={{ marginLeft: 3 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
