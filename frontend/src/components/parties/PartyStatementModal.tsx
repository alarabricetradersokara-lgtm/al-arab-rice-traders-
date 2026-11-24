import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { Customer, Supplier, PartyStatementResponse } from '../../types/party';
import {
  Printer,
  Calendar,
  Share2,
  FileSpreadsheet,
  Building2,
  Phone,
  MapPin,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';

interface PartyStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  party: Customer | Supplier | null;
}

export const PartyStatementModal: React.FC<PartyStatementModalProps> = ({
  isOpen,
  onClose,
  partyType,
  party,
}) => {
  const [statement, setStatement] = useState<PartyStatementResponse | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatement = async () => {
    if (!party) return;
    try {
      setIsLoading(true);
      let data: PartyStatementResponse;
      if (partyType === 'CUSTOMER') {
        data = await partyService.getCustomerStatement(party.id, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      } else {
        data = await partyService.getSupplierStatement(party.id, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      }
      setStatement(data);
    } catch (err) {
      console.error('Failed to load party statement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && party) {
      fetchStatement();
    }
  }, [isOpen, party?.id, startDate, endDate]);

  if (!party) return null;

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Statement Sharing Handler
  const handleShareWhatsApp = () => {
    if (!statement) return;

    const rawPhone = party.phone || '';
    // Clean phone number (e.g. 0300-1234567 -> 923001234567)
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }

    const recentLines = statement.transactions
      .slice(-5)
      .map(
        (t) =>
          `• ${new Date(t.date).toLocaleDateString('en-GB')} | ${t.referenceNo} | Dr: ${Number(t.debit) > 0 ? Number(t.debit).toLocaleString() : '0'} | Cr: ${Number(t.credit) > 0 ? Number(t.credit).toLocaleString() : '0'}`
      )
      .join('\n');

    const isCustomer = partyType === 'CUSTOMER';
    const balType = isCustomer ? 'Receivable (Aap ki taraf baqaya)' : 'Payable (Hamari taraf baqaya)';

    const text =
      `🌾 *AL ARAB RICE TRADERS - KHATABOOK STATEMENT*\n` +
      `-------------------------------------------\n` +
      `*Party:* ${party.name}\n` +
      `*Contact:* ${party.phone} (${party.city || 'Mandi'})\n` +
      `*Statement Date:* ${new Date().toLocaleDateString('en-GB')}\n` +
      `-------------------------------------------\n` +
      `Opening Balance: PKR ${Number(statement.openingBalance).toLocaleString()}\n` +
      `Total Billed / Debits: PKR ${Number(statement.totalDebit).toLocaleString()}\n` +
      `Total Paid / Credits: PKR ${Number(statement.totalCredit).toLocaleString()}\n` +
      `*Net Closing Balance: PKR ${Number(statement.closingBalance).toLocaleString()}*\n` +
      `(${balType})\n` +
      `-------------------------------------------\n` +
      `*Recent Ledger Entries:*\n` +
      `${recentLines || 'No recent entries'}\n` +
      `-------------------------------------------\n` +
      `العرب رائز ٹریڈرز • اناج مارکیٹ، مانسہرہ / اوکاڑہ\n` +
      `رابطہ: 0300-1234567`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${partyType === 'CUSTOMER' ? 'Customer (Debtor)' : 'Supplier (Creditor)'} Khatabook Statement`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] print:hidden">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div>
              <label className="block text-[10px] font-bold text-[#718078] uppercase mb-0.5">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#718078] uppercase mb-0.5">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-[#E4EAE5] bg-white rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Share statement summary to WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Statement
            </button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF
            </Button>
          </div>
        </div>

        {/* Printable Statement Area */}
        <div className="bg-white p-5 border border-[#E4EAE5] rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 text-[#172B25] text-xs">
          {/* Header */}
          <div className="border-b-2 border-[#087A55] pb-3 mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#087A55] flex items-center justify-center text-white font-bold text-sm">
                  🌾
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-[#087A55]">AL ARAB RICE TRADERS</h1>
                  <p className="text-[9px] text-[#718078] font-medium tracking-wide">
                    PREMIUM GRAIN PROCUREMENT, MILLING & KHATABOOK SETTLEMENT
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#718078] mt-1.5">
                مرکزی دکان، اناج مارکیٹ، مانسہرہ | ہیڈ آفس: اوکاڑہ • فون: 0300-1234567
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#087A55] text-white px-2 py-0.5 rounded">
                PARTY KHATABOOK STATEMENT
              </span>
              <p className="text-xs font-mono font-bold text-[#087A55] mt-1.5">{party.code}</p>
              <p className="text-[10px] text-[#718078]">
                Date: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Party Details 2-Col Box */}
          <div className="p-3 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5] mb-4 flex flex-col md:flex-row justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold text-[#718078] uppercase block">
                {partyType === 'CUSTOMER' ? 'CUSTOMER ACCOUNT (DEBTOR)' : 'SUPPLIER / ARTHI (CREDITOR)'}
              </span>
              <p className="text-sm font-bold text-[#172B25] mt-0.5">{party.name}</p>
              <p className="text-xs text-[#718078]">{party.businessName || 'General Market'}</p>
              <p className="text-xs text-[#718078]">
                {party.city} • Phone: <span className="font-mono font-semibold">{party.phone}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-[#718078] uppercase block">
                CURRENT CALCULATED BALANCE
              </span>
              <p className="text-lg font-bold font-mono text-[#087A55] mt-0.5">
                PKR {Number(statement?.closingBalance || party.currentBalance).toLocaleString()}
                <span className="text-xs font-sans ml-1 text-[#718078]">
                  ({partyType === 'CUSTOMER' ? 'Dr / Receivable' : 'Cr / Payable'})
                </span>
              </p>
              {partyType === 'CUSTOMER' && Number((party as Customer).creditLimit) > 0 && (
                <p className="text-[10px] text-[#718078]">
                  Credit Limit: PKR {Number((party as Customer).creditLimit).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* 4-Col Statement Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
            <div className="p-2.5 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
              <span className="text-[9px] text-[#718078] uppercase font-bold block">Opening Balance</span>
              <span className="text-xs font-bold font-mono text-[#172B25]">
                PKR {Number(statement?.openingBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
              <span className="text-[9px] text-[#718078] uppercase font-bold block">Total Debits</span>
              <span className="text-xs font-bold font-mono text-emerald-700">
                PKR {Number(statement?.totalDebit || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-[#F5F7F5] rounded-xl border border-[#E4EAE5]">
              <span className="text-[9px] text-[#718078] uppercase font-bold block">Total Credits</span>
              <span className="text-xs font-bold font-mono text-amber-700">
                PKR {Number(statement?.totalCredit || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[9px] text-[#087A55] uppercase font-bold block">Closing Balance</span>
              <span className="text-xs font-bold font-mono text-[#087A55]">
                PKR {Number(statement?.closingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-[#E4EAE5] rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F5F7F5] border-b border-[#E4EAE5] text-[#172B25] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Ref / Voucher #</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2.5 text-right font-mono text-emerald-700">Debit (Dr)</th>
                    <th className="py-2 px-2.5 text-right font-mono text-amber-700">Credit (Cr)</th>
                    <th className="py-2 px-2.5 text-right font-mono font-bold text-[#087A55]">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#718078]">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : statement?.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#718078]">
                        No posted transactions found in this period.
                      </td>
                    </tr>
                  ) : (
                    statement?.transactions?.map((t) => (
                      <tr key={t.id} className="hover:bg-[#F5F7F5]/50">
                        <td className="py-2 px-2.5 font-mono text-[#718078]">
                          {new Date(t.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-[#087A55]">
                          {t.referenceNo}
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                            {t.transactionType}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-[#172B25] max-w-[200px] truncate">
                          {t.description}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-emerald-700">
                          {Number(t.debit) > 0 ? Number(t.debit).toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-amber-700">
                          {Number(t.credit) > 0 ? Number(t.credit).toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-[#087A55]">
                          PKR {Number(t.runningBalance).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 pt-4 mt-4 border-t border-[#E4EAE5] text-center text-[10px] text-[#718078]">
            <div>
              <div className="border-b border-[#E4EAE5] pb-4 mb-1"></div>
              <span>Prepared By (Accountant / Munshi)</span>
            </div>
            <div>
              <div className="border-b border-[#E4EAE5] pb-4 mb-1"></div>
              <span>Party Confirmation & Signature</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
