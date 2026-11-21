import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CompanySettings } from '../../types/advanced';
import { advancedService } from '../../services/advanced.service';
import {
  Settings,
  Factory,
  Users,
  Globe,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';

interface FeatureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: (updated: CompanySettings) => void;
}

export const FeatureSettingsModal: React.FC<FeatureSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await advancedService.getCompanySettings();
      setSettings(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load enterprise settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof CompanySettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await advancedService.updateCompanySettings({
        enableMilling: settings.enableMilling,
        enableCommission: settings.enableCommission,
        enableExport: settings.enableExport,
        enableMultiWarehouse: settings.enableMultiWarehouse,
        companyName: settings.companyName,
        phone: settings.phone,
        address: settings.address,
      });
      setSuccess('Enterprise feature modules updated successfully');
      onSettingsUpdated(updated);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Module Configuration & Feature Toggles" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center text-sm">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-[#F5F7F5] p-3.5 rounded-xl border border-[#E4EAE5] text-xs text-[#718078]">
          <p>
            Configure optional enterprise modules for <strong className="text-[#172B25]">AL ARAB RICE TRADERS</strong>. A basic trader can turn off advanced features to maintain a streamlined trading workflow, or toggle them on as business operations scale.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#718078] animate-pulse">
            Loading enterprise settings...
          </div>
        ) : settings ? (
          <div className="space-y-4">
            {/* 1. Rice Milling */}
            <div className="p-4 border border-[#E4EAE5] rounded-xl flex items-center justify-between hover:border-[#087A55]/40 transition-colors">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-emerald-50 text-[#087A55] rounded-xl mt-0.5">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172B25]">Rice Milling & Processing</h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Paddy crushing batches, yield ratios (Head Rice, Broken/Tota, Bran/Khul, Husk/Bhoosa), processing costs & manufacturing journals.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.enableMilling}
                  onChange={() => handleToggle('enableMilling')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#087A55]"></div>
              </label>
            </div>

            {/* 2. Commission */}
            <div className="p-4 border border-[#E4EAE5] rounded-xl flex items-center justify-between hover:border-[#087A55]/40 transition-colors">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-emerald-50 text-[#087A55] rounded-xl mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172B25]">Commission & Broker Management</h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Mandi agents & dalal profiles, percentage / per-bag / per-kg commission accruals, payout disbursements & broker statements.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.enableCommission}
                  onChange={() => handleToggle('enableCommission')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#087A55]"></div>
              </label>
            </div>

            {/* 3. Export */}
            <div className="p-4 border border-[#E4EAE5] rounded-xl flex items-center justify-between hover:border-[#087A55]/40 transition-colors">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-emerald-50 text-[#087A55] rounded-xl mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172B25]">International Rice Export</h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Multi-currency contracts (USD/EUR), Incoterms (FOB/CIF), container tracking, B/L, banking remittance & FX Gain/Loss GL accounting.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.enableExport}
                  onChange={() => handleToggle('enableExport')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#087A55]"></div>
              </label>
            </div>

            {/* 4. Multi-Warehouse */}
            <div className="p-4 border border-[#E4EAE5] rounded-xl flex items-center justify-between hover:border-[#087A55]/40 transition-colors">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-emerald-50 text-[#087A55] rounded-xl mt-0.5">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172B25]">Multi-Warehouse Logistics & Transfers</h4>
                  <p className="text-xs text-[#718078] mt-0.5">
                    Inter-godown stock transfers, in-transit status, destination weighbridge verification, transit shortage auditing & physical reconciliation.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.enableMultiWarehouse}
                  onChange={() => handleToggle('enableMultiWarehouse')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#087A55]"></div>
              </label>
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-[#E4EAE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE5] rounded-lg text-sm font-medium text-[#718078] hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#087A55] text-white rounded-lg text-sm font-medium hover:bg-[#064E3B] flex items-center shadow-sm"
            disabled={saving || loading}
          >
            {saving ? 'Saving Preferences...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
