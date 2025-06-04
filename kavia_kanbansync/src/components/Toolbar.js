import React, { useRef } from 'react';
import { useKanban } from '../KanbanContext';
import * as XLSX from 'xlsx';

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

// PUBLIC_INTERFACE
function Toolbar() {
  const { addColumn, bulkInsertCards, columns } = useKanban();
  const inputRef = useRef();

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
      if (!header) return;

      // Prompt for which column to add to:
      const colTitle = prompt('Paste cards into which column?\n' +
        columns.map((c, i) => `${i+1}) ${c.title}`).join('\n'));
      const idx = Number(colTitle) - 1;
      const col = columns[idx];
      if (!col) {
        alert('Invalid column selection.');
        return;
      }

      // Map rows to card objects:
      const cards = entries
        .map(row => {
          const obj = {};
          header.forEach((k, i) => (obj[k] = row[i]));
          // Parse due_date to yyyy-mm-dd format if present
          if (obj.due_date && typeof obj.due_date === 'number') {
            obj.due_date = XLSX.SSF.format('yyyy-mm-dd', obj.due_date);
          }
          return obj;
        })
        .filter(card => card && typeof card.feature === 'string' && card.feature.trim().length > 0); // require feature

      if (cards.length === 0) {
        alert('No valid cards found in the file. Make sure "feature" column is filled.');
        return;
      }
      try {
        const error = await bulkInsertCards(col.id, cards);
        if (error) {
          // Show Supabase error if present
          alert(`Bulk upload failed: ${error.message || error}`);
          console.error('Supabase error bulk inserting cards:', error);
        }
      } catch (e) {
        alert('Bulk upload encountered an error: ' + (e.message || e));
        console.error('Exception uploading cards:', e);
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
