import { useEffect, useState, useRef } from 'react';
import {
  BarChart3,
  Trophy,
  Users,
  CheckCircle,
  Clock,
  Printer,
  Medal,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Card';
import { getElectionResults, getVoterMasterlist } from '../../services/api';
import type { PositionReport, VoterMasterlist } from '../../services/api';
import type { Position } from '../../types';

function EligibilityChips({ position }: { position: Position }) {
  if (position.voter_eligibility === 'all') return null;
  const showCourses = position.voter_eligibility === 'by_course' || position.voter_eligibility === 'by_course_and_year';
  const showYears   = position.voter_eligibility === 'by_year_level' || position.voter_eligibility === 'by_course_and_year';
  return (
    <div className="flex flex-wrap gap-1 mt-1 mb-0.5">
      {showCourses && position.eligible_courses.map((c) => (
        <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{c}</span>
      ))}
      {showYears && position.eligible_year_levels.map((y) => (
        <span key={y} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{y}</span>
      ))}
    </div>
  );
}

type ReportTab = 'results' | 'masterlist';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('results');
  const [results, setResults] = useState<PositionReport[]>([]);
  const [masterlist, setMasterlist] = useState<VoterMasterlist | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getElectionResults(), getVoterMasterlist()]).then(([r, m]) => {
      setResults(r);
      setMasterlist(m);
      setLoading(false);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">Election results and voter masterlist</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Printer size={16} />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        <TabBtn
          active={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
          icon={<BarChart3 size={16} />}
          label="Election Results"
        />
        <TabBtn
          active={activeTab === 'masterlist'}
          onClick={() => setActiveTab('masterlist')}
          icon={<Users size={16} />}
          label="Voter Masterlist"
        />
      </div>

      {/* Print Area */}
      <div ref={printRef} className="print-area">
        {/* Print Header - only shows on print */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-[#2b2378]">JRMSU CCS Student Org Election</h1>
          <p className="text-lg font-semibold mt-1">Academic Year 2025–2026</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'results' ? 'Official Election Results' : 'Voter Masterlist Report'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Generated: {new Date().toLocaleDateString('en-PH', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {activeTab === 'results' && <ResultsView results={results} />}
        {activeTab === 'masterlist' && masterlist && <MasterlistView masterlist={masterlist} />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
        active ? 'bg-white text-[#2b2378] shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

import React from 'react';

function ResultsView({ results }: { results: PositionReport[] }) {
  const totalVotes = results.reduce((sum, r) => sum + r.total_votes, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#2b2378]">{results.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Positions</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#2b2378]">{totalVotes}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Votes Cast</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-[#f9c301]">
            {results.reduce((s, r) => s + r.position.max_votes, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total Winners</p>
        </div>
      </div>

      {/* Winners Summary */}
      <div className="bg-gradient-to-br from-[#2b2378] to-[#1e1a5a] rounded-2xl p-5 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Award size={20} className="text-[#f9c301]" />
          Elected Officials
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map((r) =>
            r.candidates
              .filter((c) => c.is_winner)
              .map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center gap-3 bg-white/10 rounded-xl p-3"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 shrink-0 flex items-center justify-center">
                    {winner.candidate_photo ? (
                      <img src={winner.candidate_photo} alt={winner.name} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy size={18} className="text-[#f9c301]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{winner.name}</p>
                    <p className="text-white/60 text-xs truncate">{r.position.title}</p>
                    <p className="text-[#f9c301] text-xs font-semibold mt-0.5">
                      {winner.vote_count} votes
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Position-by-position results */}
      {results.map((r) => (
        <PositionResult key={r.position.id} report={r} />
      ))}
    </div>
  );
}

function PositionResult({ report }: { report: PositionReport }) {
  const maxVotes = report.candidates[0]?.vote_count || 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Position Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">{report.position.title}</h3>
          <EligibilityChips position={report.position} />
          <p className="text-xs text-gray-500 mt-0.5">
            {report.total_votes} total votes &bull; Electing {report.position.max_votes}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={16} className="text-[#2b2378]" />
          <span className="text-sm font-bold text-[#2b2378]">{report.total_votes}</span>
        </div>
      </div>

      {/* Candidates */}
      <div className="p-4 flex flex-col gap-3">
        {report.candidates.map((c) => {
          const pct = report.total_votes > 0 ? Math.round((c.vote_count / report.total_votes) * 100) : 0;
          return (
            <div key={c.id} className="flex items-center gap-3">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                c.is_winner ? 'bg-[#f9c301] text-[#2b2378]' : 'bg-gray-100 text-gray-400'
              }`}>
                {c.rank === 1 ? <Medal size={16} /> : c.rank}
              </div>

              {/* Photo */}
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {c.candidate_photo ? (
                  <img src={c.candidate_photo} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <Users size={16} className="text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                  <Badge color={c.party_color}>{c.party}</Badge>
                  {c.is_winner && (
                    <Badge color="#16a34a"><Trophy size={10} /> Winner</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${maxVotes > 0 ? (c.vote_count / maxVotes) * 100 : 0}%`,
                        backgroundColor: c.is_winner ? '#2b2378' : '#d1d5db',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 shrink-0 w-16 text-right">
                    {c.vote_count} ({pct}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {report.candidates.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No candidates in this position.</p>
        )}
      </div>
    </div>
  );
}

function MasterlistView({ masterlist }: { masterlist: VoterMasterlist }) {
  const turnout =
    masterlist.total > 0
      ? Math.round((masterlist.voted_count / masterlist.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#2b2378]">{masterlist.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{masterlist.voted_count}</p>
          <p className="text-xs text-gray-500 mt-0.5">Voted</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{masterlist.not_voted_count}</p>
          <p className="text-xs text-gray-500 mt-0.5">Not Voted</p>
        </div>
      </div>

      {/* Turnout bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">Voter Turnout</span>
          <span className="text-sm font-bold text-[#2b2378]">{turnout}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-[#2b2378] h-3 rounded-full"
            style={{ width: `${turnout}%` }}
          />
        </div>
      </div>

      {/* Voted */}
      <MasterlistTable
        title="Students Who Voted"
        students={masterlist.voted}
        voted
      />

      {/* Not Voted */}
      <MasterlistTable
        title="Students Who Have Not Voted"
        students={masterlist.not_voted}
        voted={false}
      />
    </div>
  );
}

function MasterlistTable({
  title,
  students,
  voted,
}: {
  title: string;
  students: import('../../types').Student[];
  voted: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        {voted ? (
          <CheckCircle size={16} className="text-green-600" />
        ) : (
          <Clock size={16} className="text-yellow-600" />
        )}
        <h3 className="font-bold text-gray-900 text-sm">
          {title} ({students.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Student ID</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Course</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">Year</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700">
                  {s.student_id}
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {s.last_name}, {s.first_name}
                  {s.middle_name ? ` ${s.middle_name[0]}.` : ''}
                </td>
                <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{s.course}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">{s.year_level}</td>
                <td className="px-4 py-2.5">
                  {s.has_voted ? (
                    <Badge color="#16a34a"><CheckCircle size={10} /> Voted</Badge>
                  ) : (
                    <Badge color="#d97706"><Clock size={10} /> Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                  No students in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
