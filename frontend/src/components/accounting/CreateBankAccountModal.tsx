import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { accountingService } from '../../services/accounting.service';
import { BankAccount } from '../../types/accounting';

interface CreateBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAccount: BankAccount) => void;
  accountToEdit?: BankAccount | null;
}

const COMMON_PAKISTANI_BANKS = [
  'Meezan Bank Limited',
  'Habib Bank Limited (HBL)',
  'MCB Bank Limited',
  'Allied Bank Limited (ABL)',
  'United Bank Limited (UBL)',
  'Bank Alfalah',
  'Faysal Bank',
  'Bank of Punjab (BOP)',
  'Askari Bank',
  'National Bank of Pakistan (NBP)',
  'Dubai Islamic Bank',
  'Soneri Bank',
];

export const CreateBankAccountModal: React.FC<CreateBankAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountToEdit = null,
}) => {
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [branchName, setBranchName] = useState('');
  const [iban, setIban] = useState('');
  const [balance, setBalance] = useState<number | ''>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        if (COMMON_PAKISTANI_BANKS.includes(accountToEdit.bankName)) {
          setBankName(accountToEdit.bankName);
          setCustomBankName('');
        } else {
          setBankName('OTHER');
          setCustomBankName(accountToEdit.bankName);
        }
        setAccountNumber(accountToEdit.accountNumber || '');
        setBranchName(accountToEdit.branchName || '');
        setAccountTitle('');
        setIban(accountToEdit.iban || '');
        setBalance(Number(accountToEdit.currentBalance) || 0);
      } else {
        setBankName('');
        setCustomBankName('');
        setAccountNumber('');
        setAccountTitle('');
        setBranchName('');
        setIban('');
        setBalance(0);
      }
      setError(null);
    }
  }, [isOpen, accountToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBank = bankName === 'OTHER' ? customBankName.trim() : bankName.trim();
    if (!finalBank) {
      setError('براہ کرم بینک کا نام درج کریں۔');
      return;
    }
    if (!accountNumber.trim()) {
      setError('براہ کرم اکاؤنٹ نمبر درج کریں۔');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const resolvedBranch =
        branchName.trim() ||
        (accountTitle.trim() ? `Title: ${accountTitle.trim()}` : 'Main Branch');

      let saved: BankAccount;
      if (accountToEdit) {
        saved = await accountingService.updateBankAccount(accountToEdit.id, {
          bankName: finalBank,
          accountNumber: accountNumber.trim(),
          branchName: resolvedBranch,
          iban: iban.trim() || undefined,
          currentBalance: Number(balance) || 0,
        });
      } else {
        saved = await accountingService.createBankAccount({
          bankName: finalBank,
          accountNumber: accountNumber.trim(),
          branchName: resolvedBranch,
          iban: iban.trim() || undefined,
          openingBalance: Number(balance) || 0,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'بینک اکاؤنٹ محفوظ کرنے میں غلطی ہوئی۔'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isEditMode = Boolean(accountToEdit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditMode
          ? 'بینک اکاؤنٹ تبدیل کریں (Edit Bank Account)'
          : 'نیا بینک اکاؤنٹ درج کریں (Add Bank Account)'
      }
      subtitle={
        isEditMode
          ? 'بینک کا نام، اکاؤنٹ نمبر یا برانچ کی تفصیلات تبدیل کریں'
          : 'کاروباری لین دین اور ترسیل کے لیے نیا بینک کھاتہ رجسٹر کریں'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            بینک منتخب کریں (Bank Name) *
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
          >
            <option value="">-- بینک کا انتخاب کریں --</option>
            {COMMON_PAKISTANI_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value="OTHER">دیگر بینک (Other Bank)</option>
          </select>
        </div>

        {bankName === 'OTHER' && (
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              بینک کا نام لکھیں *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً زرعی ترقیاتی بینک یا دیگر"
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              اکاؤنٹ نمبر (Account Number) *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً 0104829104"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              اکاؤنٹ ٹائٹل (Account Title)
            </label>
            <input
              type="text"
              placeholder="مثلاً اجمل فیضان / العرب رائس ٹریڈرز"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              برانچ کا نام / شہر (Branch City)
            </label>
            <input
              type="text"
              placeholder="مثلاً اوکاڑہ مین برانچ یا مانسہرہ"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {isEditMode ? 'موجودہ بیلنس (Balance PKR)' : 'ابتدائی بیلنس (Opening PKR)'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            IBAN نمبر (اختیاری)
          </label>
          <input
            type="text"
            placeholder="مثلاً PK45MEZN0002040104829104"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/20 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            منسوخ کریں
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="bg-emerald-700 hover:bg-emerald-600 font-bold text-xs"
          >
            {isEditMode ? 'تبدیلیاں محفوظ کریں (Update)' : 'بینک محفوظ کریں (Save Bank)'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
