import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  User,
  Users,
  AlertCircle,
  Send,
  Globe,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { getBallot, submitVotes } from '../../services/api';
import type { Student, Position, Candidate } from '../../types';

interface VotingBallotProps {
  student: Student;
  onBack: () => void;
  onComplete: () => void;
}

interface UndervoteModalProps {
  positionTitle: string;
  selected: number;
  max: number;
  onProceed: () => void;
  onClose: () => void;
}

function UndervoteModal({ positionTitle, selected, max, onProceed, onClose }: UndervoteModalProps) {
  const isAbstain = selected === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAbstain ? 'bg-orange-100' : 'bg-yellow-100'}`}>
            <AlertTriangle size={28} className={isAbstain ? 'text-orange-500' : 'text-yellow-500'} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {isAbstain ? 'No Candidate Selected' : 'Undervote Detected'}
            </h3>
            <p className={`text-xs font-semibold mt-1 px-3 py-1 rounded-full inline-block ${isAbstain ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-700'}`}>
              {isAbstain ? 'Abstaining from this position' : `${selected} of ${max} selected`}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${isAbstain ? 'bg-orange-50 border border-orange-100' : 'bg-yellow-50 border border-yellow-100'}`}>
          <p className="text-sm font-semibold text-gray-800 mb-1">{positionTitle}</p>
          {isAbstain ? (
            <p className="text-xs text-gray-500 leading-relaxed">
              You have not chosen any candidate for this position. Proceeding means you are <strong>abstaining</strong> — your vote will not count for this race.
            </p>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed">
              This position allows up to <strong>{max} candidates</strong>, but you only selected <strong>{selected}</strong>. You may go back and select more, or proceed with fewer votes.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          This action is allowed. Once your ballot is submitted, it cannot be changed.
        </p>

        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={onProceed}>
            Proceed Anyway
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Go Back &amp; Select
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VotingBallot({ student, onBack, onComplete }: VotingBallotProps) {
  const { updateStudentAuth, showToast } = useApp();
  const [positions, setPositions]       = useState<Position[]>([]);
  const [candidateMap, setCandidateMap] = useState<Record<string, Candidate[]>>({});
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [selections, setSelections]     = useState<Record<string, string[]>>({});
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [showReview, setShowReview]     = useState(false);
  const [undervoteModal, setUndervoteModal] = useState<{
    visible: boolean;
    onProceed: () => void;
  }>({ visible: false, onProceed: () => {} });

  const unvotedPositions = positions.filter(
    (p) => !student.voted_positions.includes(p.id)
  );

  useEffect(() => {
    const load = async () => {
      try {
        const { ballot } = await getBallot();
        const eligible = ballot.map((b) => b.position);
        setPositions(eligible);
        const map: Record<string, Candidate[]> = {};
        for (const entry of ballot) {
          map[entry.position.id] = entry.candidates;
        }
        setCandidateMap(map);
      } catch (e: unknown) {
        showToast('error', e instanceof Error ? e.message : 'Failed to load ballot.');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-3">
        <div className="w-10 h-10 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading your ballot...</p>
      </div>
    );
  }

  if (unvotedPositions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-2">All Votes Submitted</h2>
          <p className="text-gray-500 text-sm">You have already voted for all eligible positions.</p>
          <Button fullWidth className="mt-6" onClick={onBack}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <ReviewBallot
        positions={unvotedPositions}
        candidateMap={candidateMap}
        selections={selections}
        onBack={() => setShowReview(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    );
  }

  const currentPosition   = unvotedPositions[currentIdx];
  const candidates        = candidateMap[currentPosition?.id] ?? [];
  const currentSelections = selections[currentPosition?.id] ?? [];
  const maxVotes          = currentPosition?.max_votes ?? 1;
  const progress          = (currentIdx / unvotedPositions.length) * 100;

  function toggleCandidate(candidateId: string) {
    const posId  = currentPosition.id;
    const current = selections[posId] ?? [];
    if (current.includes(candidateId)) {
      setSelections((p) => ({ ...p, [posId]: current.filter((id) => id !== candidateId) }));
    } else {
      if (current.length >= maxVotes) {
        if (maxVotes === 1) {
          setSelections((p) => ({ ...p, [posId]: [candidateId] }));
        } else {
          showToast('warning', `You can only select ${maxVotes} candidate${maxVotes > 1 ? 's' : ''} for this position.`);
        }
      } else {
        setSelections((p) => ({ ...p, [posId]: [...current, candidateId] }));
      }
    }
  }

  function proceedToNext() {
    if (currentIdx < unvotedPositions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowReview(true);
    }
  }

  function handleNext() {
    const isAbstain    = currentSelections.length === 0;
    const isUndervote  = currentSelections.length > 0 && currentSelections.length < maxVotes;

    if (isAbstain || isUndervote) {
      setUndervoteModal({
        visible: true,
        onProceed: () => {
          setUndervoteModal((m) => ({ ...m, visible: false }));
          proceedToNext();
        },
      });
      return;
    }
    proceedToNext();
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const updatedStudent = await submitVotes(student, selections);
      updateStudentAuth(updatedStudent);
      showToast('success', 'Your vote has been submitted successfully!');
      onComplete();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to submit vote.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {undervoteModal.visible && (
        <UndervoteModal
          positionTitle={currentPosition.title}
          selected={currentSelections.length}
          max={maxVotes}
          onProceed={undervoteModal.onProceed}
          onClose={() => setUndervoteModal((m) => ({ ...m, visible: false }))}
        />
      )}

      {/* Header */}
      <div className="bg-[#2b2378] text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Casting Your Vote</p>
            <p className="text-white/60 text-xs">
              Position {currentIdx + 1} of {unvotedPositions.length}
            </p>
          </div>
          <div className="bg-[#f9c301] text-[#2b2378] text-xs font-bold px-3 py-1.5 rounded-xl">
            {currentIdx + 1}/{unvotedPositions.length}
          </div>
        </div>
        <div className="mt-3 max-w-lg mx-auto w-full">
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-[#f9c301] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ballot */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        {/* Position Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#2b2378]/10 rounded-xl shrink-0">
              <Users size={20} className="text-[#2b2378]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">
                {currentPosition.title}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-[#2b2378] font-medium bg-[#2b2378]/10 px-2.5 py-1 rounded-full">
                  <CheckCircle size={12} />
                  Select {maxVotes} {maxVotes > 1 ? 'candidates' : 'candidate'}
                </span>
                <EligibilityBadge position={currentPosition} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-500">Selected</span>
            <span className={`text-sm font-bold ${currentSelections.length === 0 ? 'text-gray-400' : currentSelections.length < maxVotes ? 'text-yellow-600' : 'text-[#2b2378]'}`}>
              {currentSelections.length} / {maxVotes}
            </span>
          </div>
          {currentSelections.length === 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 rounded-xl px-3 py-2">
              <AlertTriangle size={13} className="shrink-0" />
              <span>No selection — proceeding will count as abstaining.</span>
            </div>
          )}
          {currentSelections.length > 0 && currentSelections.length < maxVotes && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 rounded-xl px-3 py-2">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Undervote — you may still select {maxVotes - currentSelections.length} more.</span>
            </div>
          )}
        </div>

        {/* Candidates */}
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => {
            const isSelected = currentSelections.includes(candidate.id);
            return (
              <button
                key={candidate.id}
                onClick={() => toggleCandidate(candidate.id)}
                className={`w-full text-left bg-white rounded-2xl border-2 p-4 flex items-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-sm ${
                  isSelected
                    ? 'border-[#2b2378] bg-[#2b2378]/5 shadow-md'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {candidate.candidate_photo ? (
                    <img
                      src={candidate.candidate_photo}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base ${isSelected ? 'text-[#2b2378]' : 'text-gray-900'}`}>
                    {candidate.name}
                  </p>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1"
                    style={{
                      backgroundColor: `${candidate.party_color}20`,
                      color: candidate.party_color,
                    }}
                  >
                    {candidate.party}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {candidate.description}
                  </p>
                </div>
                <div
                  className={`w-7 h-7 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#2b2378] border-[#2b2378]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isSelected && <CheckCircle size={16} className="text-white" />}
                </div>
              </button>
            );
          })}

          {candidates.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <AlertCircle size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">No candidates for this position.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pb-4">
          {currentIdx > 0 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="shrink-0"
            >
              <ChevronLeft size={18} />
            </Button>
          )}
          <Button
            onClick={handleNext}
            fullWidth
            rightIcon={
              currentIdx < unvotedPositions.length - 1 ? (
                <ChevronRight size={18} />
              ) : (
                <Send size={16} />
              )
            }
          >
            {currentIdx < unvotedPositions.length - 1 ? 'Next' : 'Review Ballot'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EligibilityBadge({ position }: { position: Position }) {
  if (position.voter_eligibility === 'all') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Globe size={12} /> All students
      </span>
    );
  }
  if (position.voter_eligibility === 'by_course') {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <BookOpen size={12} /> By course
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <GraduationCap size={12} /> By year level
    </span>
  );
}

function ReviewBallot({
  positions,
  candidateMap,
  selections,
  onBack,
  onSubmit,
  submitting,
}: {
  positions:    Position[];
  candidateMap: Record<string, Candidate[]>;
  selections:   Record<string, string[]>;
  onBack:       () => void;
  onSubmit:     () => void;
  submitting:   boolean;
}) {
  const totalSelected = Object.values(selections).flat().length;
  const totalPositions = positions.length;
  const abstainedPositions = positions.filter(
    (p) => !selections[p.id] || selections[p.id].length === 0
  );
  const undervotedPositions = positions.filter(
    (p) =>
      selections[p.id] &&
      selections[p.id].length > 0 &&
      selections[p.id].length < (p.max_votes ?? 1)
  );
  const hasIssues = abstainedPositions.length > 0 || undervotedPositions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#2b2378] text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="font-bold text-sm">Review Ballot</p>
            <p className="text-white/60 text-xs">Confirm your selections before submitting</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="font-bold text-gray-900 text-sm mb-2">Ballot Summary</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-[#2b2378]/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#2b2378]">{totalSelected}</p>
              <p className="text-xs text-gray-500">Votes Cast</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {totalPositions - abstainedPositions.length}
              </p>
              <p className="text-xs text-gray-500">Positions Voted</p>
            </div>
            {abstainedPositions.length > 0 && (
              <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{abstainedPositions.length}</p>
                <p className="text-xs text-gray-500">Abstained</p>
              </div>
            )}
          </div>
        </div>

        {hasIssues && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Review before you submit</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  You can still go back and adjust your selections.
                </p>
              </div>
            </div>
            {abstainedPositions.length > 0 && (
              <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                <p className="text-xs font-semibold text-orange-700 mb-1">Abstained ({abstainedPositions.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {abstainedPositions.map((p) => (
                    <span key={p.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {p.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {undervotedPositions.length > 0 && (
              <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                <p className="text-xs font-semibold text-yellow-700 mb-1">Undervoted ({undervotedPositions.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {undervotedPositions.map((p) => (
                    <span key={p.id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {p.title} ({selections[p.id].length}/{p.max_votes})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {positions.map((pos) => {
            const selectedIds = selections[pos.id] ?? [];
            const selected = (candidateMap[pos.id] ?? []).filter((c) =>
              selectedIds.includes(c.id)
            );
            const isAbstained  = selected.length === 0;
            const isUndervoted = selected.length > 0 && selected.length < (pos.max_votes ?? 1);
            return (
              <div
                key={pos.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 ${
                  isAbstained ? 'border-orange-200' : isUndervoted ? 'border-yellow-200' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-[#2b2378] text-sm">{pos.title}</p>
                  {isAbstained && (
                    <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Abstained</span>
                  )}
                  {isUndervoted && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                      Undervote {selected.length}/{pos.max_votes}
                    </span>
                  )}
                </div>
                {selected.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No candidate selected</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selected.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-[#2b2378]/5 rounded-xl p-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {c.candidate_photo ? (
                            <img src={c.candidate_photo} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-xs truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.party}</p>
                        </div>
                        <CheckCircle size={16} className="text-[#2b2378] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Once submitted, your vote cannot be changed. Please review carefully.
          </p>
          <Button fullWidth size="lg" loading={submitting} onClick={onSubmit}>
            <Send size={18} className="mr-1" />
            Submit My Vote
          </Button>
          <Button variant="ghost" fullWidth onClick={onBack} disabled={submitting}>
            Go Back and Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
