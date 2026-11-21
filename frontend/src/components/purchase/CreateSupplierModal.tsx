import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { purchaseService } from '../../services/purchase.service';
import { Supplier } from '../../types/purchase';
import { UserCheck, Building2, Phone, MapPin, CreditCard, DollarSign } from 'lucide-react';

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSupplier: Supplier) => void;
}

export const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: 'Gujranwala',
    taxNumber: '',
    openingBalance: '0',
    isArthi: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Supplier name and primary phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const supplier = await purchaseService.createSupplier({
        ...formData,
        openingBalance: parseFloat(formData.openingBalance) || 0,
      });
      onSuccess(supplier);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Supplier / Mandi Arthi" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Business / Commission Shop Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Tariq Grain Commission Shop"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
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
                placeholder="0300-1234567"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
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
                placeholder="0321-9876543"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              City / Mandi Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Kamoke, Gujranwala, Hafizabad"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Opening Balance (PKR)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.01"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Physical Mandi Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop No, Grain Market, Kamoke"
              className="w-full px-3 py-2 text-sm border border-[#E4EAE5] rounded-xl focus:border-[#087A55] focus:ring-1 focus:ring-[#087A55] outline-none"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
            <input
              type="checkbox"
              id="isArthi"
              checked={formData.isArthi}
              onChange={(e) => setFormData({ ...formData, isArthi: e.target.checked })}
              className="w-4 h-4 text-[#087A55] rounded focus:ring-[#087A55] accent-[#087A55]"
            />
            <label htmlFor="isArthi" className="text-xs font-medium text-[#172B25] cursor-pointer">
              This party is a Mandi Commission Agent (Arthi) - eligible for commission deduction & mandi settlement
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Save & Register Party'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
