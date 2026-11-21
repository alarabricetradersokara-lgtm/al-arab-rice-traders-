import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertCircle, Globe } from 'lucide-react';

interface ExportCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const ExportCustomerModal: React.FC<ExportCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('United Arab Emirates');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [destinationPort, setDestinationPort] = useState('Jebel Ali Port, Dubai');
  const [paymentTerms, setPaymentTerms] = useState('100% Irrevocable Letter of Credit (L/C) at sight');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !country) {
      setError('Company name and country are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        companyName,
        country,
        contactPerson,
        email,
        phone,
        address,
        preferredCurrency,
        destinationPort,
        paymentTerms,
        taxId,
        notes,
      });
      setCompanyName('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register export customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register International Export Buyer"
      subtitle="Configure foreign buyer profile with currency, destination port, and credit terms"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Company / Importer Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Al-Madina Foodstuff Trading LLC"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Country *</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United Arab Emirates, Saudi Arabia, UK"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Tariq Al-Mansoor"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="import@company.com"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Phone / WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971-50-1234567"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Currency</label>
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AED">AED (Dirham)</option>
              <option value="GBP">GBP (£)</option>
              <option value="PKR">PKR (Rs)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Destination Port</label>
            <input
              type="text"
              value={destinationPort}
              onChange={(e) => setDestinationPort(e.target.value)}
              placeholder="e.g. Jebel Ali, Jeddah, Felixstowe"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">Tax / VAT ID</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="TRN-1002931"
              className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Standard Payment Terms</label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="e.g. 100% Confirmed Irrevocable LC at Sight / 30% Advance TT"
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B25] mb-1">Address / Port Location</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Warehouse / commercial registration address..."
            className="w-full px-3 py-2 bg-white border border-[#E4EAE5] rounded-xl text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE5] rounded-xl text-sm font-semibold text-[#718078] hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register Buyer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
