import React, { useRef } from 'react';
import { useKanban } from '../KanbanContext';
import * as XLSX from 'xlsx';
import { useFeedback } from '../KanbanBoard';

function downloadExcelTemplate() {
  // Columns per Supabase schema
  const template = [
    ['feature', 'description', 'assignee', 'notes', 'priority', 'status', 'due_date'],
    ['Sample Task', 'Description here', 'Alice', 'Notes here', 'High', 'To Do', '2024-01-31'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KanbanCards');
  XLSX.writeFile(wb, 'kanban_cards_template.xlsx');
}

function Toolbar() {
  const { addColumn, bulkInsertCards, columns } = useKanban();
  const inputRef = useRef();
  const { showToast } = useFeedback();

  const handleAddColumn = async () => {
    const title = prompt('Column Title:');
    if (title) await addColumn(title);
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Expecting [header, ...rows]
      const [header, ...entries] = rows;
      if (!header) {
        showToast("No header row found in Excel file.", "error");
        return;
      }

      // Prompt for which column to add to:
      const colTitle = prompt('Paste cards into which column?\n' +
        columns.map((c, i) => `${i+1}) ${c.title}`).join('\n'));
      const idx = Number(colTitle) - 1;
      const col = columns[idx];
      if (!col) {
        showToast('Invalid column selection.', "error");
        return;
      }

      // Fields required in DB (as per Supabase schema)
      const allowedFields = ['feature', 'description', 'assignee', 'notes', 'priority', 'status', 'due_date'];
      const cards = entries
        .map(row => {
          const obj = {};
          header.forEach((k, i) => {
            if (allowedFields.includes(k)) {
              obj[k] = row[i];
            }
          });
          // Parse due_date to yyyy-mm-dd format if present and is numeric (Excel)
          if (obj.due_date && typeof obj.due_date === 'number') {
            obj.due_date = XLSX.SSF.format('yyyy-mm-dd', obj.due_date);
          }
          // Stringify/trim all values except due_date (to catch "feature": "  foo  ")
          Object.keys(obj).forEach(k => {
            if (typeof obj[k] === 'string') obj[k] = obj[k].trim();
          });
          return obj;
        })
        // Require 'feature' field to be non-empty 
        .filter(card => card && typeof card.feature === 'string' && card.feature.trim().length > 0);

      if (cards.length === 0) {
        showToast('No valid cards found in the file. Make sure "feature" column is filled.', "error");
        return;
      }
      try {
        if (!cards.every(c => c.feature)) {
          // Non-blocking, so just log
          // eslint-disable-next-line no-console
          console.log("[Excel Bulk Upload] One or more mapped cards missing 'feature'");
        }
        // Call actual bulk insertion
        const error = await bulkInsertCards(col.id, cards);
        if (error) {
          showToast(`Bulk upload failed: ${error.message || error}`, "error");
        } else {
          showToast(`Bulk upload succeeded (${cards.length} cards added)`, "success");
        }
      } catch (e) {
        showToast('Bulk upload encountered an error: ' + (e.message || e), "error");
      }
      inputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="kanban-toolbar">
      <button className="btn" onClick={handleAddColumn}>
        + Add Column
      </button>
      <button className="btn" onClick={downloadExcelTemplate}>
        Download Excel Template
      </button>
      <label className="btn" style={{ marginLeft: 8 }}>
        Bulk Upload Excel
        <input
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          ref={inputRef}
          onChange={handleExcelUpload}
        />
      </label>
    </div>
  );
}

export default Toolbar;
