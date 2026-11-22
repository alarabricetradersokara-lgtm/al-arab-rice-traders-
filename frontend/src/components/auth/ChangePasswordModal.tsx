import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/auth.service';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      onSuccessToast('پاس ورڈ کامیابی سے تبدیل ہو گیا! نیا پاس ورڈ لاگو ہے۔');
      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'پاس ورڈ تبدیل کرنے میں خرابی ہوئی۔ موجودہ پاس ورڈ چیک کریں۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E4EAE5]">
        {/* Header */}
        <div className="bg-[#087A55] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">پاس ورڈ تبدیل کریں</h3>
              <p className="text-xs text-emerald-100">Change Operator Password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-[#172B25] mb-1">
              موجودہ پاس ورڈ (Current Password)
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="موجودہ پاس ورڈ درج کریں"
                className="w-full text-sm px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718078] hover:text-[#172B25]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-[#172B25] mb-1">
              نیا پاس ورڈ (New Password)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="کم از کم 6 حروف یا ہندسے"
                className="w-full text-sm px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718078] hover:text-[#172B25]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-[#172B25] mb-1">
              نئے پاس ورڈ کی تصدیق (Confirm New Password)
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="نیا پاس ورڈ دوبارہ درج کریں"
              className="w-full text-sm px-3.5 py-2.5 bg-[#F5F7F5] border border-[#E4EAE5] rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#087A55]/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-[#718078] hover:bg-[#F5F7F5] rounded-xl transition-colors cursor-pointer"
            >
              منسوخ کریں
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#087A55] hover:bg-[#064E3B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <span>تبدیل ہو رہا ہے...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> پاس ورڈ تبدیل کریں
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
