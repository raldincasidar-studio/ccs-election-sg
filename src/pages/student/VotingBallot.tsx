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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import {
  getEligiblePositions,
  getCandidatesByPosition,
  submitVotes,
} from '../../services/api';
import type { Student, Position, Candidate } from '../../types';

interface VotingBallotProps {
  student: Student;
  onBack: () => void;
  onComplete: () => void;
}

export function VotingBallot({ student, onBack, onComplete }: VotingBallotProps) {
  const { updateStudentAuth, showToast } = useApp();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidateMap, setCandidateMap] = useState<Record<string, Candidate[]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Filter out already-voted positions
  const unvotedPositions = positions.filter(
    (p) => !student.voted_positions.includes(p.id)
  );

  useEffect(() => {
    const load = async () => {
      const eligible = await getEligiblePositions(student);
      setPositions(eligible);

      // Load candidates for each position
      const map: Record<string, Candidate[]> = {};
      for (const pos of eligible) {
        const cands = await getCandidatesByPosition(pos.id);
        map[pos.id] = cands;
      }
      setCandidateMap(map);
      setLoading(false);
    };
    load();
  }, [student]);

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

  const currentPosition = unvotedPositions[currentIdx];
  const candidates = candidateMap[currentPosition?.id] ?? [];
  const currentSelections = selections[currentPosition?.id] ?? [];
  const maxVotes = currentPosition?.max_votes ?? 1;
  const progress = ((currentIdx) / unvotedPositions.length) * 100;

  function toggleCandidate(candidateId: string) {
    const posId = currentPosition.id;
    const current = selections[posId] ?? [];

    if (current.includes(candidateId)) {
      setSelections((p) => ({ ...p, [posId]: current.filter((id) => id !== candidateId) }));
    } else {
      if (current.length >= maxVotes) {
        if (maxVotes === 1) {
          // Replace
          setSelections((p) => ({ ...p, [posId]: [candidateId] }));
        } else {
          showToast('warning', `You can only select ${maxVotes} candidate${maxVotes > 1 ? 's' : ''} for this position.`);
        }
      } else {
        setSelections((p) => ({ ...p, [posId]: [...current, candidateId] }));
      }
    }
  }

  function handleNext() {
    if (currentSelections.length === 0) {
      showToast('warning', 'Please select at least one candidate before proceeding.');
      return;
    }
    if (currentIdx < unvotedPositions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowReview(true);
    }
  }

  function handleSkip() {
    if (currentIdx < unvotedPositions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowReview(true);
    }
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

        {/* Progress bar */}
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

          {/* Selection counter */}
          <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-500">Selected</span>
            <span className="text-sm font-bold text-[#2b2378]">
              {currentSelections.length} / {maxVotes}
            </span>
          </div>
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
                {/* Photo */}
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

                {/* Selection indicator */}
                <div className={`w-7 h-7 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#2b2378] border-[#2b2378]'
                    : 'border-gray-200 bg-white'
                }`}>
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
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
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
  positions: Position[];
  candidateMap: Record<string, Candidate[]>;
  selections: Record<string, string[]>;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const totalSelected = Object.values(selections).flat().length;
  const totalPositions = positions.length;
  const skippedPositions = positions.filter(
    (p) => !selections[p.id] || selections[p.id].length === 0
  );

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
                {totalPositions - skippedPositions.length}
              </p>
              <p className="text-xs text-gray-500">Positions Voted</p>
            </div>
            {skippedPositions.length > 0 && (
              <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{skippedPositions.length}</p>
                <p className="text-xs text-gray-500">Skipped</p>
              </div>
            )}
          </div>
        </div>

        {/* Skipped warning */}
        {skippedPositions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-start gap-2">
            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Some positions are empty</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                You skipped: {skippedPositions.map((p) => p.title).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Selections by position */}
        <div className="flex flex-col gap-3">
          {positions.map((pos) => {
            const selectedIds = selections[pos.id] ?? [];
            const selected = (candidateMap[pos.id] ?? []).filter((c) =>
              selectedIds.includes(c.id)
            );

            return (
              <div key={pos.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="font-bold text-[#2b2378] text-sm mb-2">{pos.title}</p>
                {selected.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Skipped</p>
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

        {/* Submit */}
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
