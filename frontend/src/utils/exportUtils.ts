/**
 * Utility functions for exporting tables and reports to Excel (CSV with UTF-8 BOM) and PDF/Print.
 */

export function exportToExcel(data: Record<string, any>[], filename: string = 'export'): void {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);

  // Build CSV rows
  const csvRows: string[] = [];

  // Header row
  csvRows.push(
    headers
      .map((header) => {
        // Humanize header: camelCase to Words
        const formatted = header
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  // UTF-8 BOM (\uFEFF) ensures Excel properly recognizes character encoding and formatting
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReportDocument(title: string, contentHtml: string): void {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    alert('Please allow popups to print/export PDF report.');
    return;
  }

  const currentDate = new Date().toLocaleString();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - AL ARAB RICE TRADERS</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #172B25;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #087A55;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .logo-area h1 {
            margin: 0;
            color: #087A55;
            font-size: 20px;
            letter-spacing: -0.5px;
          }
          .logo-area p {
            margin: 2px 0 0 0;
            color: #718078;
            font-size: 11px;
          }
          .report-info {
            text-align: right;
            font-size: 11px;
            color: #718078;
          }
          .report-title {
            font-size: 15px;
            font-weight: bold;
            color: #172B25;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          th {
            background-color: #F5F7F5;
            color: #172B25;
            text-align: left;
            padding: 8px 6px;
            border-bottom: 1.5px solid #087A55;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 6px 6px;
            border-bottom: 1px solid #E4EAE5;
          }
          tr:nth-child(even) td {
            background-color: #FAFCFA;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .font-bold {
            font-weight: bold;
          }
          .text-primary {
            color: #087A55;
          }
          .summary-box {
            margin-top: 16px;
            padding: 10px 14px;
            background-color: #F5F7F5;
            border: 1px solid #E4EAE5;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
          }
          .footer {
            margin-top: 25px;
            border-top: 1px dashed #E4EAE5;
            padding-top: 8px;
            text-align: center;
            font-size: 10px;
            color: #718078;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <h1>AL ARAB RICE TRADERS</h1>
            <p>Rice Trading ERP & Mandi Management System</p>
          </div>
          <div class="report-info">
            <div class="report-title">${title}</div>
            <div>Generated: ${currentDate}</div>
          </div>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          This is an official system-generated business intelligence document. Verified against double-entry General Ledger records.
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
