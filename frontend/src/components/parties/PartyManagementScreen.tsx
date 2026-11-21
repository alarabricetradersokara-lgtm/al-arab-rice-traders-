import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { partyService } from '../../services/party.service';
import { Customer, Supplier, KhatabookSummary } from '../../types/party';
import {
  Users,
  Search,
  Plus,
  Phone,
  Building2,
  DollarSign,
  AlertTriangle,
  BookOpen,
  Scale,
  RefreshCw,
  MessageCircle,
  Truck,
  LayoutGrid,
  List,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
} from 'lucide-react';

interface PartyManagementScreenProps {
  onOpenCustomerModal: (customer?: Customer) => void;
  onOpenSupplierModal: (supplier?: Supplier) => void;
  onOpenCustomerReceipt: (customer: Customer) => void;
  onOpenSupplierPayment: (supplier: Supplier) => void;
  onOpenAdjustment: (type: 'CUSTOMER' | 'SUPPLIER', party: Customer | Supplier) => void;
  onOpenStatement: (type: 'CUSTOMER' | 'SUPPLIER', party: Customer | Supplier) => void;
  onOpenProfile: (type: 'CUSTOMER' | 'SUPPLIER', party: Customer | Supplier) => void;
  showToast: (msg: string) => void;
}

export const PartyManagementScreen: React.FC<PartyManagementScreenProps> = ({
  onOpenCustomerModal,
  onOpenSupplierModal,
  onOpenCustomerReceipt,
  onOpenSupplierPayment,
  onOpenAdjustment,
  onOpenStatement,
  onOpenProfile,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<KhatabookSummary>({
    totalCustomers: 0,
    totalSuppliers: 0,
    totalReceivables: '0',
    totalPayables: '0',
    netDifference: '0',
    overLimitCustomersCount: 0,
    mandiArthisCount: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [onlyOverLimit, setOnlyOverLimit] = useState(false);
  const [onlyArthis, setOnlyArthis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await partyService.getKhatabookSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load Khatabook summary:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await partyService.getCustomers({
        search: searchTerm || undefined,
        customerType: customerTypeFilter || undefined,
        overLimit: onlyOverLimit ? true : undefined,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await partyService.getSuppliers({
        search: searchTerm || undefined,
        isArthi: onlyArthis ? true : undefined,
      });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'CUSTOMERS') {
      fetchCustomers();
    } else {
      fetchSuppliers();
    }
  }, [activeTab, searchTerm, customerTypeFilter, onlyOverLimit, onlyArthis]);

  const handleRefresh = () => {
    fetchSummary();
    if (activeTab === 'CUSTOMERS') fetchCustomers();
    else fetchSuppliers();
    showToast('کھاتہ بیلنس دوبارہ تصدیق کر لیا گیا (Balances Reconciled)');
  };

  // WhatsApp statement share
  const openWhatsApp = (e: React.MouseEvent, phone: string, name: string, balance: string, type: 'CUSTOMER' | 'SUPPLIER') => {
    e.stopPropagation();
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.slice(1);
    const amt = Number(balance).toLocaleString();
    const isRec = type === 'CUSTOMER';
    const text = `السلام علیکم جناب ${name} صاحب!\nالعرب رائز ٹریڈرز (AL ARAB RICE TRADERS) کی جانب سے آپ کا ڈیجی کھاتہ بیلنس درج ذیل ہے:\n\n*موجودہ بقایا: PKR ${amt}* (${isRec ? 'آپ نے ادا کرنی ہے / لینا ہے' : 'ہم نے ادا کرنی ہے / دینا ہے'})\n\nبرائے رابطہ: 055-612-8899 • غلہ منڈی کامونکی`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'AR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter parties by balance filter
  const displayedCustomers = customers.filter((c) => {
    const bal = Number(c.currentBalance || 0);
    if (balanceFilter === 'PENDING') return bal > 0;
    if (balanceFilter === 'SETTLED') return bal === 0;
    return true;
  });

  const displayedSuppliers = suppliers.filter((s) => {
    const bal = Number(s.currentBalance || 0);
    if (balanceFilter === 'PENDING') return bal > 0;
    if (balanceFilter === 'SETTLED') return bal === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4EAE5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#172B25] flex items-center gap-2">
              <span className="text-[#087A55]">📒</span> ڈیجی کھاتہ رجسٹر (Al Arab DigiKhata)
            </h1>
            <span className="text-xs font-bold bg-emerald-100 text-[#087A55] px-2.5 py-0.5 rounded-full border border-emerald-200">
              ڈیجی کھاتہ موڈ
            </span>
          </div>
          <p className="text-xs text-[#718078] mt-1">
            گاہکوں کا ادھار (لینا ہے) اور سپلائرز کی ادائیگیاں (دینا ہے) کا آسان و شفاف حساب کتاب مع واٹس ایپ سٹیٹمنٹ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-[#F5F7F5] p-1 rounded-xl border border-[#E4EAE5]">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-[#087A55] shadow-xs'
                  : 'text-[#718078] hover:text-[#172B25]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ڈیجی کارڈز</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-[#087A55] shadow-xs'
                  : 'text-[#718078] hover:text-[#172B25]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>ٹیبل ویو</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#087A55]" /> ریفریش
          </Button>

          {activeTab === 'CUSTOMERS' ? (
            <Button variant="primary" size="sm" onClick={() => onOpenCustomerModal()}>
              <Plus className="w-4 h-4 mr-1" /> + نیا گاہک (Customer)
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onOpenSupplierModal()}>
              <Plus className="w-4 h-4 mr-1" /> + نیا سپلائر / آڑھتی (Supplier)
            </Button>
          )}
        </div>
      </div>

      {/* DigiKhata Iconic Header Highlight Cards: لینا ہے (Green) vs دینا ہے (Red) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Box 1: آپ نے لینے ہیں (Receivables Card) */}
        <div
          onClick={() => {
            setActiveTab('CUSTOMERS');
            setBalanceFilter('PENDING');
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'CUSTOMERS'
              ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-1 ring-emerald-400/30'
              : 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                آپ نے لینے ہیں (You Will Receive)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
              {summary.totalCustomers} گاہک
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono-num mt-1">
            PKR {Number(summary.totalReceivables).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-200/70 text-xs text-emerald-800">
            <span>مارکیٹ گاہکوں کا کل ادھار (وصولی)</span>
            <span className="font-semibold flex items-center gap-1">
              گاہک دیکھیں <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
            </span>
          </div>
        </div>

        {/* Box 2: آپ نے دینے ہیں (Payables Card) */}
        <div
          onClick={() => {
            setActiveTab('SUPPLIERS');
            setBalanceFilter('PENDING');
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'SUPPLIERS'
              ? 'bg-rose-50/80 border-rose-400 shadow-sm ring-1 ring-rose-400/30'
              : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                آپ نے دینے ہیں (You Will Give)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full">
              {summary.totalSuppliers} سپلائرز
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-rose-900 font-mono-num mt-1">
            PKR {Number(summary.totalPayables).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-rose-200/70 text-xs text-rose-800">
            <span>آڑھتیوں اور ملز کو کل ادائیگیاں</span>
            <span className="font-semibold flex items-center gap-1">
              سپلائر دیکھیں <ArrowUpRight className="w-3.5 h-3.5 text-rose-700" />
            </span>
          </div>
        </div>

        {/* Box 3: خالص میزان کھاتہ (Net Difference) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                میزان کھاتہ (Net Position)
              </span>
              <Scale className="w-4 h-4 text-slate-400" />
            </div>

            <div
              className={`text-2xl font-extrabold font-mono-num mt-1 ${
                Number(summary.netDifference) >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              PKR {Math.abs(Number(summary.netDifference)).toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {Number(summary.netDifference) >= 0 ? 'وصولیاں زیادہ ہیں (Net Surplus)' : 'ادائیگیاں زیادہ ہیں (Net Deficit)'}
            </span>
            <span className="font-medium px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
              دکان کھاتہ
            </span>
          </div>
        </div>
      </div>

      {/* Main DigiKhata Card: Tabs, Search & List */}
      <Card>
        {/* DigiKhata Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>گاہک (Customers - لینا ہے)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>سپلائر و آڑھتی (Suppliers - دینا ہے)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                {suppliers.length}
              </span>
            </button>
          </div>
        </div>

        {/* DigiKhata Search & Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گاہک یا سپلائر کا نام یا موبائل نمبر تلاش کریں..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-slate-800"
            />
          </div>

          {/* Quick Balance Filter Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-semibold mr-1">فلٹر:</span>
            <button
              onClick={() => setBalanceFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                balanceFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              تمام ({activeTab === 'CUSTOMERS' ? customers.length : suppliers.length})
            </button>
            <button
              onClick={() => setBalanceFilter('PENDING')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                balanceFilter === 'PENDING'
                  ? activeTab === 'CUSTOMERS'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {activeTab === 'CUSTOMERS' ? 'بقایا ادھار (لینا ہے)' : 'ادائیگیاں باقی (دینا ہے)'}
            </button>
            <button
              onClick={() => setBalanceFilter('SETTLED')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                balanceFilter === 'SETTLED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              صاف کھاتے (Settled)
            </button>
          </div>
        </div>

        {/* Content Area: DigiKhata Cards View or Table View */}
        {viewMode === 'CARDS' ? (
          /* ==================== DIGIKHATA CARDS VIEW ==================== */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-[#F5F7F5]/40 min-h-[400px]">
            {isLoading ? (
              <div className="col-span-full py-16 text-center text-[#718078]">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#087A55] mb-2" />
                <p className="font-semibold text-sm">کھاتہ لوڈ ہو رہا ہے...</p>
              </div>
            ) : (activeTab === 'CUSTOMERS' ? displayedCustomers : displayedSuppliers).length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#718078] bg-white rounded-2xl border border-[#E4EAE5]">
                <Users className="w-10 h-10 mx-auto text-[#718078] mb-2 opacity-40" />
                <p className="font-bold text-sm text-[#172B25]">کوئی کھاتہ نہیں ملا (No records found)</p>
                <p className="text-xs text-[#718078] mt-1">تلاش کی شرائط درست کریں یا نیا کھاتہ درج کریں</p>
              </div>
            ) : activeTab === 'CUSTOMERS' ? (
              /* Customers Cards */
              displayedCustomers.map((c) => {
                const bal = Number(c.currentBalance || 0);
                const hasBalance = bal > 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenProfile('CUSTOMER', c)}
                    className="bg-white rounded-2xl border border-[#E4EAE5] p-4 shadow-xs hover:shadow-md hover:border-[#087A55] transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    {/* Top Row: Avatar & Party Info + Balance */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar & Names */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#064E3B] text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#172B25] group-hover:text-[#087A55] transition-colors leading-tight">
                              {c.name}
                            </h3>
                            <span className="text-[11px] text-[#718078] block">
                              {c.businessName || 'ٹریڈنگ پارٹی'} {c.city ? `• ${c.city}` : ''}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-[#718078] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#087A55]" /> {c.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-lg font-black font-mono leading-none ${
                              hasBalance ? 'text-[#087A55]' : 'text-gray-400'
                            }`}
                          >
                            PKR {bal.toLocaleString()}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              hasBalance
                                ? 'bg-emerald-100 text-[#087A55]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {hasBalance ? 'لینے ہیں (Lena Hai)' : 'حساب صاف'}
                          </span>
                        </div>
                      </div>

                      {/* Overlimit Warning if any */}
                      {c.isOverLimit && (
                        <div className="mt-2.5 px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-red-200">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span>ادھار کی حد ({Number(c.creditLimit).toLocaleString()}) سے تجاوز!</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom DigiKhata Action Buttons */}
                    <div
                      className="mt-4 pt-3 border-t border-[#E4EAE5] grid grid-cols-3 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => openWhatsApp(e, c.phone, c.name, String(c.currentBalance), 'CUSTOMER')}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#087A55] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                        title="واٹس ایپ پر سٹیٹمنٹ بھیجیں"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>واٹس ایپ</span>
                      </button>

                      <button
                        onClick={() => onOpenCustomerReceipt(c)}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="رقم وصول ہوئی (+ وصولی)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ ملے (وصولی)</span>
                      </button>

                      <button
                        onClick={() => onOpenStatement('CUSTOMER', c)}
                        className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-[#172B25] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="کھاتہ تفصیل"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#087A55]" />
                        <span>کھاتہ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Suppliers Cards */
              displayedSuppliers.map((s) => {
                const bal = Number(s.currentBalance || 0);
                const hasBalance = bal > 0;

                return (
                  <div
                    key={s.id}
                    onClick={() => onOpenProfile('SUPPLIER', s)}
                    className="bg-white rounded-2xl border border-[#E4EAE5] p-4 shadow-xs hover:shadow-md hover:border-red-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    {/* Top Row: Avatar & Party Info + Balance */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar & Names */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-amber-700 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-[#172B25] group-hover:text-red-700 transition-colors leading-tight">
                                {s.name}
                              </h3>
                              {s.isArthi && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-[#087A55] font-bold rounded">
                                  آڑھتی
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#718078] block">
                              {s.businessName || 'غلہ منڈی'} {s.city ? `• ${s.city}` : ''}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-[#718078] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-red-600" /> {s.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-lg font-black font-mono leading-none ${
                              hasBalance ? 'text-red-600' : 'text-gray-400'
                            }`}
                          >
                            PKR {bal.toLocaleString()}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              hasBalance
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {hasBalance ? 'دینے ہیں (Dena Hai)' : 'حساب صاف'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom DigiKhata Action Buttons */}
                    <div
                      className="mt-4 pt-3 border-t border-[#E4EAE5] grid grid-cols-3 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => openWhatsApp(e, s.phone, s.name, String(s.currentBalance), 'SUPPLIER')}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#087A55] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                        title="واٹس ایپ پر سٹیٹمنٹ بھیجیں"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>واٹس ایپ</span>
                      </button>

                      <button
                        onClick={() => onOpenSupplierPayment(s)}
                        className="py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        title="رقم ادا کی (- ادائیگی)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>- دیے (ادائیگی)</span>
                      </button>

                      <button
                        onClick={() => onOpenStatement('SUPPLIER', s)}
                        className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-[#172B25] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="کھاتہ تفصیل"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-red-600" />
                        <span>کھاتہ</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ==================== TRADITIONAL TABLE VIEW ==================== */
          <div className="overflow-x-auto">
            {activeTab === 'CUSTOMERS' ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold">
                  <tr>
                    <th className="py-3 px-3">گاہک / کسٹمر</th>
                    <th className="py-3 px-3">فون نمبر</th>
                    <th className="py-3 px-3">شہر</th>
                    <th className="py-3 px-3 text-right">ادھار کی حد</th>
                    <th className="py-3 px-3 text-right font-bold text-[#087A55]">بقایا (لینے ہیں)</th>
                    <th className="py-3 px-3 text-center">ایکشنز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {displayedCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => onOpenProfile('CUSTOMER', c)}
                      className="hover:bg-[#F5F7F5]/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#172B25] block">{c.name}</span>
                        <span className="text-[10px] text-[#718078]">{c.businessName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{c.phone}</td>
                      <td className="py-3 px-3">{c.city}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        {Number(c.creditLimit) > 0 ? `PKR ${Number(c.creditLimit).toLocaleString()}` : 'لا محدود'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-sm text-[#087A55]">
                          PKR {Number(c.currentBalance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenCustomerReceipt(c)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="+ ملے (وصولی)"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenStatement('CUSTOMER', c)}
                            className="p-1.5 text-[#087A55] hover:bg-emerald-50 rounded-lg"
                            title="کھاتہ تفصیل"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F5F7F5] text-[#172B25] font-semibold">
                  <tr>
                    <th className="py-3 px-3">سپلائر / آڑھتی</th>
                    <th className="py-3 px-3">فون نمبر</th>
                    <th className="py-3 px-3">منڈی / شہر</th>
                    <th className="py-3 px-3 text-right font-bold text-red-600">بقایا (دینے ہیں)</th>
                    <th className="py-3 px-3 text-center">ایکشنز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE5]">
                  {displayedSuppliers.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => onOpenProfile('SUPPLIER', s)}
                      className="hover:bg-[#F5F7F5]/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#172B25] block">{s.name}</span>
                        <span className="text-[10px] text-[#718078]">{s.businessName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{s.phone}</td>
                      <td className="py-3 px-3">{s.city}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-sm text-red-600">
                          PKR {Number(s.currentBalance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenSupplierPayment(s)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                            title="- دیے (ادائیگی)"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenStatement('SUPPLIER', s)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="کھاتہ تفصیل"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
