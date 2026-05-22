import { CheckCircle, Trophy, Home, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Student } from '../../types';

interface VoteConfirmationProps {
  student: Student;
  onDone: () => void;
}

export function VoteConfirmation({ student, onDone }: VoteConfirmationProps) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2b2378] via-[#1e1a5a] to-[#0f0d30] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center text-center">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={56} className="text-green-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#f9c301] flex items-center justify-center">
            <Trophy size={16} className="text-[#2b2378]" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Vote Submitted!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Thank you for participating in the JRMSU CCS Student Org Election.
        </p>

        {/* Receipt-like box */}
        <div className="w-full mt-6 bg-gray-50 rounded-2xl border border-gray-100 p-4 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Vote Receipt
          </p>
          <div className="flex flex-col gap-2">
            <ReceiptRow label="Voter" value={`${student.first_name} ${student.last_name}`} />
            <ReceiptRow label="Student ID" value={student.student_id} mono />
            <ReceiptRow label="Course" value={student.course} />
            <ReceiptRow label="Year Level" value={student.year_level} />
            <ReceiptRow label="Timestamp" value={timeStr} />
            <div className="pt-2 border-t border-gray-200 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Status</span>
                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Submitted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3 mt-6">
          <Button
            fullWidth
            size="lg"
            onClick={onDone}
            leftIcon={<Home size={18} />}
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'I voted!',
                  text: `I just cast my vote in the JRMSU CCS Student Org Election 2025-2026!`,
                });
              }
            }}
            leftIcon={<Share2 size={16} />}
          >
            Share
          </Button>
        </div>
      </div>

      {/* Bottom text */}
      <p className="text-white/40 text-xs mt-6 text-center">
        Your vote has been securely recorded.
      </p>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={`text-xs font-semibold text-gray-800 text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
