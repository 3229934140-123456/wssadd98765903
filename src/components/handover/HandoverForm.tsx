import { User, FileText, Send, CheckCircle } from "lucide-react";
import { useState } from "react";

interface HandoverFormProps {
  outgoingPerson: string;
  onSubmit: (incomingPerson: string, remarks: string) => void;
  disabled?: boolean;
  itemCount: number;
}

export const HandoverForm = ({ outgoingPerson, onSubmit, disabled, itemCount }: HandoverFormProps) => {
  const [incomingPerson, setIncomingPerson] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!incomingPerson.trim()) return;

    onSubmit(incomingPerson, remarks);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setIncomingPerson("");
      setRemarks("");
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-emerald-400 font-bold text-lg mb-1">交接成功！</h3>
        <p className="text-slate-400 text-sm">
          已将 {itemCount} 项未关闭事项交接给 {incomingPerson}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">交班人</span>
        </div>
        <div className="text-white font-semibold text-lg">{outgoingPerson}</div>
        <div className="text-slate-500 text-xs mt-1">当前班次值班员</div>
      </div>

      <div>
        <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
          <User className="w-4 h-4" />
          接班人 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={incomingPerson}
          onChange={(e) => setIncomingPerson(e.target.value)}
          placeholder="请输入接班人姓名..."
          className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          交接班备注
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="请输入班次交接备注..."
          className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none transition-colors"
          rows={3}
        />
      </div>

      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">待交接事项</span>
          <span className="text-blue-400 font-bold">{itemCount} 项</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !incomingPerson.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/30"
      >
        <Send className="w-5 h-5" />
        确认交接
      </button>
    </div>
  );
};
