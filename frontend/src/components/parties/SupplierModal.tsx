import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { Supplier, PaymentTerms } from '../../types/party';
import { UserCheck, Building2, Phone, MapPin, DollarSign, Calendar } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSuccess: (savedSupp: Supplier) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSuccess,
}) => {
  const isEditing = !!supplier;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    businessName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: 'Gujranwala',
    taxNumber: '',
    isArthi: true,
    paymentTerms: 'MANDI_CYCLE' as PaymentTerms,
    openingBalance: '0',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setFormData({
        code: supplier.code || '',
        name: supplier.name || '',
        businessName: supplier.businessName || '',
        phone: supplier.phone || '',
        alternatePhone: supplier.alternatePhone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || 'Gujranwala',
        taxNumber: supplier.taxNumber || '',
        isArthi: supplier.isArthi ?? true,
        paymentTerms: (supplier.paymentTerms as PaymentTerms) || 'MANDI_CYCLE',
        openingBalance: String(supplier.openingBalance || '0'),
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        businessName: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        city: 'Gujranwala',
        taxNumber: '',
        isArthi: true,
        paymentTerms: 'MANDI_CYCLE',
        openingBalance: '0',
        notes: '',
      });
    }
    setError(null);
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Supplier name and phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let saved: Supplier;
      if (isEditing && supplier) {
        saved = await partyService.updateSupplier(supplier.id, formData);
      } else {
        saved = await partyService.createSupplier({
          ...formData,
          openingBalance: parseFloat(formData.openingBalance) || 0,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Supplier: ${supplier?.name}` : 'Register Supplier / Mandi Arthi (Creditor)'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Supplier / Arthi Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ch. Tariq Mahmood"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Commission Shop / Business Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Tariq Grain Commission Shop"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Primary Phone (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0321-1234567"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Alternate Phone / Munshi
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                placeholder="0300-9876543"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Mandi / City Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Kamoke, Hafizabad, Gujranwala"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Payment Settlement Terms
            </label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as PaymentTerms })}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] outline-none font-medium"
            >
              <option value="MANDI_CYCLE">Mandi Cycle (Weekly Settlement)</option>
              <option value="CASH_ON_DELIVERY">Cash on Weighbridge Delivery</option>
              <option value="NET_7">Net 7 Days</option>
              <option value="NET_15">Net 15 Days</option>
              <option value="NET_30">Net 30 Days</option>
            </select>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                Opening Balance (PKR Payable / Credit)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono text-[#087A55] font-bold"
                />
              </div>
              <span className="text-[10px] text-[#718078] mt-0.5 block">
                *Automatically posts to Khatabook ledger
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
            <input
              type="checkbox"
              id="isArthiModal"
              checked={formData.isArthi}
              onChange={(e) => setFormData({ ...formData, isArthi: e.target.checked })}
              className="w-4 h-4 accent-[#087A55]"
            />
            <label htmlFor="isArthiModal" className="text-xs font-semibold text-[#172B25] cursor-pointer">
              Mandi Commission Agent (*Arthi*)
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Mandi Shop Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop No, Grain Market, Kamoke"
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Internal Procurement Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Primary supplier for 1121 Kainat Paddy, bank: HBL Kamoke"
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Supplier' : 'Save & Open Khata'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
