import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import clsx from 'clsx';
import { AuditLog, AuditSummary } from '../../types/auth';
import { authService } from '../../services/auth.service';

interface AuditLogsScreenProps {
  onToast: (msg: string) => void;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ onToast }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logRes, sumRes] = await Promise.all([
        authService.getAuditLogs({
          page,
          limit: 25,
          search: search || undefined,
          action: actionFilter || undefined,
          entityName: entityFilter || undefined,
        }),
        authService.getAuditSummary(),
      ]);
      setLogs(logRes.logs);
      setTotalPages(logRes.pagination.totalPages);
      setTotalLogs(logRes.pagination.total);
      setSummary(sumRes);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch audit records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CREATE':
        return 'bg-emerald-50 text-[#087A55] border-emerald-200';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'PASSWORD_CHANGE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DAILY_CLOSING_APPROVE':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'STOCK_ADJUSTMENT':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity', 'Entity ID', 'Operator', 'Role', 'IP Address'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.action,
      l.entityName,
      l.entityId,
      l.user ? `${l.user.fullName} (@${l.user.username})` : 'System',
      l.user?.role || 'N/A',
      l.ipAddress || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Audit trail exported as CSV');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-[#087A55] rounded-xl font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#172B25]">Immutable Audit Trail & Logs</h2>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            Tamper-proof compliance journal tracking operator logins, master edits, closing approvals & reconciliations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 bg-white border border-[#E4EAE5] text-[#172B25] hover:bg-[#F5F7F5] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={clsx('w-4 h-4 text-[#087A55]', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 bg-white border border-[#E4EAE5] hover:bg-[#F5F7F5] text-[#172B25] rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#087A55]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#718078] uppercase">Total Audit Records</span>
              <Activity className="w-4 h-4 text-[#087A55]" />
            </div>
            <p className="text-2xl font-black text-[#172B25] mt-2">{summary.totalLogs}</p>
            <p className="text-[11px] text-[#718078] mt-0.5">Recorded in database</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#718078] uppercase">Events Logged Today</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-600 mt-2">{summary.todayLogs}</p>
            <p className="text-[11px] text-[#718078] mt-0.5">Today's transactions & actions</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#718078] uppercase">Operator Logins Today</span>
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-[#087A55] mt-2">{summary.loginsToday}</p>
            <p className="text-[11px] text-[#718078] mt-0.5">Authenticated sessions</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#718078] uppercase">Security Events</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-600 mt-2">{summary.passwordChanges}</p>
            <p className="text-[11px] text-[#718078] mt-0.5">Password modifications</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E4EAE5] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#718078] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entity, operator name, username..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold text-[#172B25] bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2.5 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
            <option value="DAILY_CLOSING_APPROVE">DAILY_CLOSING_APPROVE</option>
            <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold text-[#172B25] bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl px-3 py-2.5 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="DailySalesEntry">DailySalesEntry</option>
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="StockMovement">StockMovement</option>
            <option value="Customer">Customer</option>
            <option value="Supplier">Supplier</option>
          </select>

          {(actionFilter || entityFilter || search) && (
            <button
              onClick={() => {
                setActionFilter('');
                setEntityFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#718078] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Operator</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Target Entity</th>
                <th className="px-4 py-3.5">Client Context (IP & Agent)</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE5]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#718078]">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-[#172B25] whitespace-nowrap">
                        <span className="font-mono font-bold block">{date.toLocaleTimeString()}</span>
                        <span className="text-[10px] text-[#718078] block">{date.toLocaleDateString()}</span>
                      </td>

                      {/* Operator */}
                      <td className="px-4 py-3.5">
                        {log.user ? (
                          <div>
                            <span className="font-bold text-[#172B25] block">{log.user.fullName}</span>
                            <span className="text-[10px] text-[#087A55] font-semibold block">
                              @{log.user.username} · {log.user.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#718078] italic">System Auto</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={clsx(
                            'text-[10px] px-2.5 py-0.5 rounded-full font-bold border inline-block',
                            getActionBadge(log.action)
                          )}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="px-4 py-3.5 text-[#172B25]">
                        <span className="font-bold block">{log.entityName}</span>
                        <span className="font-mono text-[10px] text-[#718078] block truncate max-w-[140px]">
                          {log.entityId}
                        </span>
                      </td>

                      {/* Client Context */}
                      <td className="px-4 py-3.5 text-[#718078]">
                        <p className="font-mono text-[11px] text-[#172B25]">{log.ipAddress || '127.0.0.1'}</p>
                        <p className="text-[10px] truncate max-w-[200px]" title={log.userAgent || ''}>
                          {log.userAgent || 'AL ARAB ERP Client'}
                        </p>
                      </td>

                      {/* Details Inspector Button */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-[#F5F7F5] hover:bg-[#E8F5E9] hover:text-[#087A55] text-[#172B25] rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E4EAE5] bg-[#F5F7F5]/50 flex items-center justify-between text-xs text-[#718078]">
          <span>
            Showing Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({totalLogs} total entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white border border-[#E4EAE5] rounded-lg hover:bg-[#F5F7F5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white border border-[#E4EAE5] rounded-lg hover:bg-[#F5F7F5] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#E4EAE5]">
            <div className="bg-[#087A55] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Audit Log Record Details</h3>
                <p className="text-xs text-emerald-100 font-mono">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
                <div>
                  <span className="text-[10px] font-bold text-[#718078] uppercase block">Action</span>
                  <span className="font-bold text-[#087A55]">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#718078] uppercase block">Entity</span>
                  <span className="font-bold text-[#172B25]">{selectedLog.entityName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#718078] uppercase block">Operator</span>
                  <span className="font-bold text-[#172B25]">{selectedLog.user?.fullName || 'System'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#718078] uppercase block">Timestamp</span>
                  <span className="font-mono text-[#172B25]">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Old vs New Values Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#718078] uppercase tracking-wider mb-1.5">
                    Previous Values (Before Change)
                  </label>
                  <pre className="p-3 bg-red-50/50 border border-red-200 rounded-xl font-mono text-[11px] text-red-900 overflow-x-auto max-h-48">
                    {selectedLog.oldValues
                      ? JSON.stringify(selectedLog.oldValues, null, 2)
                      : 'None (Initial Creation or Event)'}
                  </pre>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#718078] uppercase tracking-wider mb-1.5">
                    Updated Values (After Change)
                  </label>
                  <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl font-mono text-[11px] text-emerald-900 overflow-x-auto max-h-48">
                    {selectedLog.newValues
                      ? JSON.stringify(selectedLog.newValues, null, 2)
                      : 'None (Deletion Event)'}
                  </pre>
                </div>
              </div>

              {/* Client Network Footprint */}
              <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] space-y-1">
                <p className="text-[10px] font-bold text-[#718078] uppercase">Client Context & Network IP</p>
                <p className="font-mono text-xs text-[#172B25]">IP Address: {selectedLog.ipAddress || '127.0.0.1'}</p>
                <p className="text-[11px] text-[#718078] break-all">User Agent: {selectedLog.userAgent}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-[#087A55] text-white text-xs font-bold rounded-xl hover:bg-[#064E3B] transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
