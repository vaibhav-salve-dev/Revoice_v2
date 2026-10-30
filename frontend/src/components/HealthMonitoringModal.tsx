import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Battery, 
  Wifi, 
  CheckCircle2, 
  Clock, 
  X, 
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/apiService';
import type { PatientRequestData, HealthTelemetryData } from '../services/apiService';
import { socketService } from '../services/socketService';
import { eyeInputManager } from '../services/eyeInputManager';

interface HealthMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  saccadeStats: { left: number; right: number; blinks: number };
}

export const HealthMonitoringModal: React.FC<HealthMonitoringModalProps> = ({
  isOpen,
  onClose,
  saccadeStats
}) => {
  const [requests, setRequests] = useState<PatientRequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [healthData] = useState<HealthTelemetryData>({
    blinkRatePerMinute: 16,
    saccadeCount: { left: saccadeStats.left, right: saccadeStats.right },
    batteryPercentage: 94,
    signalQuality: 'good',
    connectionType: 'simulator',
    deviceState: 'active'
  });

  const deviceStatus = eyeInputManager.getStatus();

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchRecentRequests = async () => {
    setLoading(true);
    const data = await apiService.getRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentRequests();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubNew = socketService.onNewRequest(newReq => {
      setRequests(prev => [newReq, ...prev]);
    });

    const unsubAttended = socketService.onRequestAttended(updatedReq => {
      setRequests(prev => prev.map(r => r._id === updatedReq._id ? updatedReq : r));
    });

    return () => {
      unsubNew();
      unsubAttended();
    };
  }, []);

  const handleMarkAttended = async (id?: string) => {
    if (!id) return;
    await apiService.attendRequest(id, 'Staff Nurse On Duty');
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'attended', attendedBy: 'Staff Nurse On Duty', attendedAt: new Date().toISOString() } : r));
  };

  if (!isOpen) return null;

  const totalSaccades = saccadeStats.left + saccadeStats.right || 1;
  const leftPct = Math.round((saccadeStats.left / totalSaccades) * 100);

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-main">Caregiver Telemetry & Communication Feed</h3>
              <p className="text-xs text-slate-400">ICU Bed 04 • Patient: Alex R. (Locked-In Syndrome Care)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close [Esc]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Top Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Status */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Heart size={14} className="text-rose-400" /> Patient State
              </span>
              <span className="text-base font-bold text-emerald-400 flex items-center gap-2 mt-1">
                <span className="status-dot-active"></span>
                Awake & Active
              </span>
              <span className="text-[11px] text-slate-500">Autonomous AAC Active</span>
            </div>

            {/* Saccade Count */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-400" /> Saccades (L / R)
              </span>
              <span className="text-base font-bold text-main font-mono mt-1">
                {saccadeStats.left} <span className="text-slate-500 font-normal">/</span> {saccadeStats.right}
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 flex">
                <div style={{ width: `${leftPct}%` }} className="bg-blue-500 h-full"></div>
                <div style={{ width: `${100 - leftPct}%` }} className="bg-purple-500 h-full"></div>
              </div>
            </div>

            {/* Battery */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Battery size={14} className="text-emerald-400" /> ESP32-C6 Battery
              </span>
              <span className="text-base font-bold text-main font-mono mt-1">
                {healthData.batteryPercentage}%
              </span>
              <span className="text-[11px] text-emerald-400/90 font-medium">Nominal (LiPo 4.02V)</span>
            </div>

            {/* Hardware Link */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Wifi size={14} className="text-purple-400" /> Telemetry Link
              </span>
              <span className="text-sm font-bold text-main truncate mt-1">
                {deviceStatus.deviceName}
              </span>
              <span className="text-[11px] text-slate-400">
                Mode: {deviceStatus.connectionType}
              </span>
            </div>
          </div>

          {/* Patient Requests & History Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-main flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" />
                  Chronological Communication Log
                </h4>
                <p className="text-xs text-slate-400">Timestamped list of requests sent via eye-gaze and assistive triggers</p>
              </div>

              <button
                onClick={fetchRecentRequests}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {requests.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  No requests recorded in database for this session yet.
                </div>
              ) : (
                requests.map(req => {
                  const isEmergency = req.urgency === 'emergency';
                  const isAttended = req.status === 'attended';

                  return (
                    <div
                      key={req._id}
                      className={`
                        p-3 rounded-xl border flex items-center justify-between gap-4 transition-colors
                        ${isEmergency ? 'bg-red-950/30 border-red-500/50' : isAttended ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-800/50 border-blue-500/40'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs
                          ${isEmergency ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}
                        `}>
                          {isEmergency ? 'SOS' : req.category[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-main text-sm">{req.label}</span>
                            {isEmergency && (
                              <span className="px-2 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                                Urgent Alert
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">"{req.speechText}"</p>
                          <span className="text-[10px] text-slate-500">
                            {req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {/* Attend Action Button */}
                      <div>
                        {isAttended ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 size={15} /> Attended
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMarkAttended(req._id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          >
                            <UserCheck size={14} /> Mark Attended
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Revoice Clinical Bedside Monitor • Press [Esc] to close</span>
          <span>MongoDB Connected • WebSockets Active</span>
        </div>
      </div>
    </div>
  );
};
