import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Customer, Supplier } from '../../types/party';
import {
  User,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  MessageCircle,
  BookOpen,
  Edit,
} from 'lucide-react';

interface PartyProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  party: Customer | Supplier | null;
  onOpenStatement: () => void;
  onOpenTransaction: () => void;
  onOpenAdjustment: () => void;
  onEdit: () => void;
}

export const PartyProfileDrawer: React.FC<PartyProfileDrawerProps> = ({
  isOpen,
  onClose,
  partyType,
  party,
  onOpenStatement,
  onOpenTransaction,
  onOpenAdjustment,
  onEdit,
}) => {
  if (!party) return null;

  const isCustomer = partyType === 'CUSTOMER';
  const customer = isCustomer ? (party as Customer) : null;
  const supplier = !isCustomer ? (party as Supplier) : null;

  const currentBal = Number(party.currentBalance || 0);
  const creditLimit = Number(customer?.creditLimit || 0);
  const creditUtilization = creditLimit > 0 ? Math.min(100, Math.round((currentBal / creditLimit) * 100)) : 0;
  const isOverLimit = customer?.isOverLimit || (creditLimit > 0 && currentBal > creditLimit);

  const handleWhatsApp = () => {
    let cleanPhone = (party.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.slice(1);
    const text = `Assalam-o-Alaikum ${party.name},\nThis is AL ARAB RICE TRADERS. Your current Khatabook balance is PKR ${currentBal.toLocaleString()} (${isCustomer ? 'Receivable' : 'Payable'}). For any ledger reconciliation, please contact 055-612-8899.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isCustomer ? 'Customer' : 'Supplier'} Profile: ${party.name}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Profile Header Box */}
        <div className="p-4 bg-white border border-[#E4EAE5] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#172B25]">{party.name}</h2>
              <span className="text-[10px] bg-emerald-100 text-[#087A55] px-2 py-0.5 rounded-full font-bold">
                {isCustomer ? customer?.customerType : supplier?.isArthi ? 'MANDI ARTHI' : 'SUPPLIER'}
              </span>
            </div>
            <p className="text-xs text-[#718078] mt-0.5">
              {party.businessName ? `${party.businessName} • ` : ''}{party.city} • Code: <span className="font-mono font-semibold">{party.code}</span>
            </p>
          </div>

          <div className="text-right bg-[#F5F7F5] px-3.5 py-2 rounded-xl border border-[#E4EAE5]">
            <span className="text-[9px] font-bold text-[#718078] uppercase block">
              {isCustomer ? 'Current Receivable (Dr)' : 'Current Payable (Cr)'}
            </span>
            <span className="text-base font-bold font-mono text-[#087A55]">
              PKR {currentBal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Credit Limit Usage Bar (For Customers) */}
        {isCustomer && creditLimit > 0 && (
          <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#718078] font-semibold">Credit Limit Utilization:</span>
              <span className={`font-mono font-bold ${isOverLimit ? 'text-red-600' : 'text-[#087A55]'}`}>
                PKR {currentBal.toLocaleString()} / PKR {creditLimit.toLocaleString()} ({creditUtilization}%)
              </span>
            </div>
            <div className="w-full bg-[#E4EAE5] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverLimit ? 'bg-red-500' : creditUtilization > 80 ? 'bg-amber-500' : 'bg-[#087A55]'
                }`}
                style={{ width: `${creditUtilization}%` }}
              ></div>
            </div>
            {isOverLimit && (
              <span className="text-[10px] text-red-600 font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Exceeded sanctioned credit limit
              </span>
            )}
          </div>
        )}

        {/* Contact & Commercial Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#E4EAE5] space-y-1.5">
            <span className="text-[10px] font-bold text-[#718078] uppercase block">Contact Details</span>
            <p className="flex items-center gap-1.5 text-[#172B25]">
              <Phone className="w-3.5 h-3.5 text-[#087A55]" />
              <span className="font-mono font-semibold">{party.phone}</span>
            </p>
            {party.alternatePhone && (
              <p className="flex items-center gap-1.5 text-[#718078]">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono">{party.alternatePhone}</span>
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[#718078]">
              <MapPin className="w-3.5 h-3.5 text-[#087A55]" />
              <span>{party.address || 'Address not specified'}</span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E4EAE5] space-y-1.5">
            <span className="text-[10px] font-bold text-[#718078] uppercase block">Commercial Terms</span>
            <p className="text-[#172B25]">
              <span className="text-[#718078]">Terms: </span>
              <span className="font-semibold">{isCustomer ? customer?.customerType : supplier?.paymentTerms}</span>
            </p>
            <p className="text-[#172B25]">
              <span className="text-[#718078]">Opening Balance: </span>
              <span className="font-mono font-semibold">PKR {Number(party.openingBalance).toLocaleString()}</span>
            </p>
            {party.taxNumber && (
              <p className="text-[#718078]">
                NTN / STRN: <span className="font-mono">{party.taxNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {party.notes && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase block mb-0.5">Notes</span>
            <p className="text-amber-800">{party.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-[#E4EAE5]">
          <Button variant="outline" size="sm" onClick={onOpenStatement}>
            <BookOpen className="w-3.5 h-3.5 mr-1 text-[#087A55]" /> Statement
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenTransaction}>
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            {isCustomer ? 'Record Receipt' : 'Record Payment'}
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenAdjustment}>
            <Scale className="w-3.5 h-3.5 mr-1 text-amber-600" /> Adjustment
          </Button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5 mr-1" /> Edit Profile
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
