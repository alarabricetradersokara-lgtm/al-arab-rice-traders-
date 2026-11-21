import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { Customer, CustomerType } from '../../types/party';
import { User, Phone, MapPin, Building2, CreditCard, DollarSign, FileText } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: (savedCust: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const isEditing = !!customer;

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
    customerType: 'WHOLESALER' as CustomerType,
    creditLimit: '0',
    openingBalance: '0',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code || '',
        name: customer.name || '',
        businessName: customer.businessName || '',
        phone: customer.phone || '',
        alternatePhone: customer.alternatePhone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || 'Gujranwala',
        taxNumber: customer.taxNumber || '',
        customerType: (customer.customerType as CustomerType) || 'WHOLESALER',
        creditLimit: String(customer.creditLimit || '0'),
        openingBalance: String(customer.openingBalance || '0'),
        notes: customer.notes || '',
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
        customerType: 'WHOLESALER',
        creditLimit: '1000000',
        openingBalance: '0',
        notes: '',
      });
    }
    setError(null);
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let saved: Customer;
      if (isEditing && customer) {
        saved = await partyService.updateCustomer(customer.id, {
          ...formData,
          creditLimit: parseFloat(formData.creditLimit) || 0,
        });
      } else {
        saved = await partyService.createCustomer({
          ...formData,
          creditLimit: parseFloat(formData.creditLimit) || 0,
          openingBalance: parseFloat(formData.openingBalance) || 0,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Customer: ${customer?.name}` : 'Register New Rice Customer (Debtor)'}
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
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Malik Zafar & Sons"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Business / Trading Firm Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Zafar Rice Corporation"
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
                placeholder="0300-1234567"
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
                placeholder="0321-9876543"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Customer Classification
            </label>
            <select
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] bg-white rounded-xl focus:border-[#087A55] outline-none font-medium"
            >
              <option value="WHOLESALER">Wholesale Grain Merchant</option>
              <option value="RETAILER">Retail Grocery Store</option>
              <option value="BROKER">Mandi Rice Broker / Arthi</option>
              <option value="EXPORTER">International Exporter</option>
              <option value="HOTEL_BULK">Catering / Hotel Bulk Buyer</option>
              <option value="WALK_IN">Counter Walk-In Cash Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              City / Market Hub
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Lahore, Karachi, Rawalpindi"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Credit Limit (PKR)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
              <input
                type="number"
                step="1000"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="1000000"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none font-mono"
              />
            </div>
            <span className="text-[10px] text-[#718078] mt-0.5 block">0 = Unlimited credit</span>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-[#172B25] mb-1">
                Opening Balance (PKR Receivable)
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

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Shop / Godown Delivery Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop No, Grain Market / Bazar location"
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172B25] mb-1">
              Commercial Terms & Internal Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. 15 days credit cycle, preferred transport: Bilawal Goods"
              className="w-full px-3 py-2 text-xs border border-[#E4EAE5] rounded-xl focus:border-[#087A55] outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#E4EAE5]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Save & Open Khata'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
