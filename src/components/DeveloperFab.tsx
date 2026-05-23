import { useState } from 'react';
import { MessageCircle, X, Code2 } from 'lucide-react';

export function DeveloperFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-60 mb-1 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-[#2b2378]/10 rounded-lg">
              <Code2 size={14} className="text-[#2b2378]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">Developed by</p>
              <p className="text-sm font-bold text-[#2b2378]">Raldin Casidar</p>
            </div>
          </div>
          <a
            href="https://m.me/raldincasidar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#0084FF] text-white rounded-xl px-3 py-2 text-xs font-semibold hover:bg-[#006ED6] active:scale-95 transition-all w-full"
          >
            <MessageCircle size={14} />
            Message on Messenger
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen((p) => !p)}
        title="Developer Contact"
        className="w-12 h-12 bg-[#2b2378] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1e1a5a] active:scale-90 transition-all"
      >
        {open ? <X size={18} /> : <Code2 size={18} />}
      </button>
    </div>
  );
}
