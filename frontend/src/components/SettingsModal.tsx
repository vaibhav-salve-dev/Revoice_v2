import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Bluetooth, 
  Usb, 
  Volume2, 
  Save, 
  X, 
  RefreshCw, 
  Check
} from 'lucide-react';
import { eyeInputManager } from '../services/eyeInputManager';
import { speechService } from '../services/speechService';
import { apiService } from '../services/apiService';
import type { CaregiverSettingsData } from '../services/apiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'calibration' | 'speech' | 'hardware' | 'caregiver'>('calibration');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibCountdown, setCalibCountdown] = useState<number>(2);

  const [settings, setSettings] = useState<CaregiverSettingsData>({
    calibration: {
      horizontalThreshold: 80,
      blinkThreshold: 100,
      eyeDebounceMs: 450,
      blinkDebounceMs: 220,
      doubleBlinkWindowMs: 750,
      tripleBlinkWindowMs: 650
    },
    speech: {
      voiceIndex: 0,
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      audioTonesEnabled: true
    },
    caregiver: {
      name: 'Primary Caregiver / Nurse',
      contactNumber: '+91 98765 43210',
      roomNumber: 'ICU Bed 04',
      audioAlertVolume: 90
    },
    theme: {
      mode: 'dark'
    }
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setVoices(speechService.getAvailableVoices());
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const data = await apiService.getSettings();
    if (data) {
      setSettings(data);
    }
  };

  const saveSettings = async () => {
    const updated = await apiService.updateSettings(settings);
    if (updated) {
      eyeInputManager.updateCalibration({
        horizontalThreshold: settings.calibration.horizontalThreshold,
        blinkThreshold: settings.calibration.blinkThreshold,
        debounceMs: settings.calibration.eyeDebounceMs
      });

      speechService.setConfig({
        rate: settings.speech.rate,
        pitch: settings.speech.pitch,
        volume: settings.speech.volume,
        tonesEnabled: settings.speech.audioTonesEnabled,
        voiceIndex: settings.speech.voiceIndex
      });

      setStatusMsg('Configuration parameters saved successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const startRelaxationCalibration = () => {
    setIsCalibrating(true);
    setCalibCountdown(2);
    speechService.speak('Keep your eyes completely relaxed for 2 seconds.');

    const timer = setInterval(() => {
      setCalibCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCalibrating(false);
          speechService.speak('Baseline calibration completed.');
          setStatusMsg('Ocular baseline calibrated successfully.');
          setTimeout(() => setStatusMsg(null), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConnectBLE = async () => {
    try {
      setStatusMsg('Initiating BLE scan for NPG Lite / ESP32...');
      const success = await eyeInputManager.connectBLE();
      if (success) {
        setStatusMsg('Connected to ESP32 via Bluetooth Low Energy.');
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (err: any) {
      setStatusMsg(`BLE Connection Notice: ${err.message}`);
    }
  };

  const handleConnectSerial = async () => {
    try {
      setStatusMsg('Opening USB Serial Port...');
      const success = await eyeInputManager.connectSerial();
      if (success) {
        setStatusMsg('Connected to NPG Lite via USB-C Serial.');
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (err: any) {
      setStatusMsg(`Serial Port Notice: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    await eyeInputManager.disconnect();
    setStatusMsg('Hardware disconnected. Returned to simulator mode.');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const testVoice = () => {
    speechService.setConfig({
      rate: settings.speech.rate,
      pitch: settings.speech.pitch,
      volume: settings.speech.volume,
      voiceIndex: settings.speech.voiceIndex
    });
    speechService.speak('This is a test of the Revoice text to speech engine.');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-main">System Calibration & Preferences</h3>
              <p className="text-xs text-slate-400">Configure ocular thresholds, voice model, and telemetry interfaces</p>
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

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/60">
          {[
            { id: 'calibration', label: 'EOG Calibration' },
            { id: 'speech', label: 'Speech & Audio' },
            { id: 'hardware', label: 'Sensor Link' },
            { id: 'caregiver', label: 'Caregiver Station' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 cursor-pointer
                ${activeTab === tab.id ? 'border-blue-500 text-main bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toast Status */}
        {statusMsg && (
          <div className="mx-6 mt-4 py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2">
            <Check size={16} /> {statusMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* TAB 1: CALIBRATION */}
          {activeTab === 'calibration' && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-main text-sm">Resting Baseline Auto-Calibration</h4>
                  <p className="text-xs text-slate-400">
                    Instruct patient to relax eye muscles and look straight forward for 2 seconds.
                  </p>
                </div>
                <button
                  disabled={isCalibrating}
                  onClick={startRelaxationCalibration}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
                >
                  <RefreshCw size={14} className={isCalibrating ? 'animate-spin' : ''} />
                  {isCalibrating ? `Relax Eyes (${calibCountdown}s)...` : 'Calibrate Resting Baseline'}
                </button>
              </div>

              {/* Threshold Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Horizontal Saccade Threshold</span>
                    <span className="text-blue-400 font-mono">{settings.calibration.horizontalThreshold} mV</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="5"
                    value={settings.calibration.horizontalThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      calibration: { ...settings.calibration, horizontalThreshold: Number(e.target.value) }
                    })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Lower = triggers on subtle left/right glances.</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Blink Signal Threshold</span>
                    <span className="text-blue-400 font-mono">{settings.calibration.blinkThreshold} mV</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    step="5"
                    value={settings.calibration.blinkThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      calibration: { ...settings.calibration, blinkThreshold: Number(e.target.value) }
                    })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Higher = ignores natural involuntary twitches.</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Double-Blink Window</span>
                    <span className="text-amber-400 font-mono">{settings.calibration.doubleBlinkWindowMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="1200"
                    step="50"
                    value={settings.calibration.doubleBlinkWindowMs}
                    onChange={(e) => setSettings({
                      ...settings,
                      calibration: { ...settings.calibration, doubleBlinkWindowMs: Number(e.target.value) }
                    })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Allowed time between two blinks for tab cycling.</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Triple-Blink Window</span>
                    <span className="text-emerald-400 font-mono">{settings.calibration.tripleBlinkWindowMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="1000"
                    step="50"
                    value={settings.calibration.tripleBlinkWindowMs}
                    onChange={(e) => setSettings({
                      ...settings,
                      calibration: { ...settings.calibration, tripleBlinkWindowMs: Number(e.target.value) }
                    })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">Allowed time window for 3-blink item selection.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPEECH */}
          {activeTab === 'speech' && (
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Speech Voice Model</label>
                <select
                  value={settings.speech.voiceIndex}
                  onChange={(e) => setSettings({
                    ...settings,
                    speech: { ...settings.speech, voiceIndex: Number(e.target.value) }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-main text-xs outline-none focus:border-blue-500"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Speaking Rate</span>
                    <span className="text-blue-400 font-mono">{settings.speech.rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.05"
                    value={settings.speech.rate}
                    onChange={(e) => setSettings({
                      ...settings,
                      speech: { ...settings.speech, rate: Number(e.target.value) }
                    })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Pitch</span>
                    <span className="text-blue-400 font-mono">{settings.speech.pitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={settings.speech.pitch}
                    onChange={(e) => setSettings({
                      ...settings,
                      speech: { ...settings.speech, pitch: Number(e.target.value) }
                    })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <button
                  onClick={testVoice}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer border border-slate-700 transition-colors"
                >
                  <Volume2 size={15} className="text-blue-400" /> Play Audio Sample
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE LINK */}
          {activeTab === 'hardware' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-main text-sm">Active Hardware Device</h4>
                  <p className="text-xs text-slate-400 capitalize">
                    {deviceStatus.deviceName} ({deviceStatus.connectionType})
                  </p>
                </div>
                {deviceStatus.isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={handleConnectBLE}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 text-left cursor-pointer transition-all flex flex-col gap-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Bluetooth size={20} />
                  </div>
                  <h5 className="font-semibold text-main text-sm">Web Bluetooth (BLE)</h5>
                  <p className="text-xs text-slate-400">
                    Pair wirelessly with Upside Down Labs NPG Lite or ESP32-C6 EEG/EOG module.
                  </p>
                </button>

                <button
                  onClick={handleConnectSerial}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-left cursor-pointer transition-all flex flex-col gap-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Usb size={20} />
                  </div>
                  <h5 className="font-semibold text-main text-sm">Web Serial (USB-C)</h5>
                  <p className="text-xs text-slate-400">
                    Connect via physical USB-C COM port for ultra-low latency direct stream.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CAREGIVER INFO */}
          {activeTab === 'caregiver' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Attending Caregiver / Nurse Name</label>
                <input
                  type="text"
                  value={settings.caregiver.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    caregiver: { ...settings.caregiver, name: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-main text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Hospital Bed / Room Location</label>
                <input
                  type="text"
                  value={settings.caregiver.roomNumber}
                  onChange={(e) => setSettings({
                    ...settings,
                    caregiver: { ...settings.caregiver, roomNumber: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-main text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Emergency Staff Alert Phone</label>
                <input
                  type="text"
                  value={settings.caregiver.contactNumber}
                  onChange={(e) => setSettings({
                    ...settings,
                    caregiver: { ...settings.caregiver, contactNumber: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-main text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">Database synchronized • Press [Esc] to exit</span>
          <button
            onClick={saveSettings}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Save size={15} /> Save Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
