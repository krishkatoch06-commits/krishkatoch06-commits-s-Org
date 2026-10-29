import React, { useEffect, useState } from 'react';
import { History, Shield, RefreshCw, Eye } from 'lucide-react';
import { AuditLog } from '../../types/restaurant';
import { api } from '../../lib/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            Compliance & Security
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Protected Audit History</h1>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-xs font-semibold text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F0EBE1] flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#E05A47]" />
            <span>Immutable Administrative Log Entries ({logs.length})</span>
          </h2>
          <span className="text-[11px] text-[#78716C]">
            Records price changes, role modifications, order adjustments, and setting updates
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#78716C]">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#78716C]">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[#78716C] font-semibold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Acting User</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">State Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="p-3 font-mono text-[#78716C] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-[#1E1B18]">
                      {log.user_name || 'System / Admin'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D8] text-[#1E1B18]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-[#78716C]">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#A8A29E]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-white text-[#1E1B18] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <span className="font-bold text-sm text-[#1E1B18] block">{selectedLog.action}</span>
                <span className="text-[11px] text-[#78716C]">
                  By {selectedLog.user_name || 'System'} at {new Date(selectedLog.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#78716C] hover:text-[#1E1B18] font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 font-mono text-[11px]">
              {selectedLog.before_state && (
                <div>
                  <span className="font-bold text-red-600 font-sans block mb-1">State Before:</span>
                  <pre className="p-3 bg-red-50/50 border border-red-200 rounded-xl overflow-x-auto text-red-950">
                    {JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_state && (
                <div>
                  <span className="font-bold text-emerald-700 font-sans block mb-1">State After:</span>
                  <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl overflow-x-auto text-emerald-950">
                    {JSON.stringify(selectedLog.after_state, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#E8E2D8] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#1E1B18] text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
