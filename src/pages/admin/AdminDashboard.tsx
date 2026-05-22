import { useEffect, useState } from 'react';
import { Users, CheckSquare, Trophy, Layers, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import { getStudents, getPositions, getCandidates, getElectionSettings } from '../../services/api';
import type { Student, Position, Candidate, ElectionSettings } from '../../types';

export function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudents(), getPositions(), getCandidates(), getElectionSettings()]).then(
      ([s, p, c, set]) => {
        setStudents(s);
        setPositions(p);
        setCandidates(c);
        setSettings(set);
        setLoading(false);
      }
    );
  }, []);

  const votedCount = students.filter((s) => s.has_voted).length;
  const turnout = students.length > 0 ? Math.round((votedCount / students.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Election Status Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border-2 flex items-center gap-3 ${
          settings?.is_open
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            settings?.is_open ? 'bg-green-500' : 'bg-gray-400'
          }`}
        >
          <AlertCircle size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">
            Election is {settings?.is_open ? 'OPEN' : 'CLOSED'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {settings?.title} &bull; {settings?.school_year}
            {settings?.is_open && ` &bull; Ends ${settings?.end_date}`}
          </p>
        </div>
        <div
          className={`ml-auto shrink-0 w-3 h-3 rounded-full ${
            settings?.is_open ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Students"
          value={students.length}
          icon={<Users size={20} />}
          color="bg-[#2b2378]"
        />
        <StatCard
          label="Votes Cast"
          value={votedCount}
          icon={<CheckSquare size={20} />}
          color="bg-green-600"
          sub={`${students.length - votedCount} pending`}
        />
        <StatCard
          label="Positions"
          value={positions.filter((p) => p.is_active).length}
          icon={<Layers size={20} />}
          color="bg-indigo-600"
          sub={`${positions.length} total`}
        />
        <StatCard
          label="Candidates"
          value={candidates.length}
          icon={<Trophy size={20} />}
          color="bg-[#f9c301]"
        />
      </div>

      {/* Voter Turnout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#2b2378]" />
          <h3 className="font-bold text-gray-900 text-sm">Voter Turnout</h3>
          <span className="ml-auto font-bold text-[#2b2378]">{turnout}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-[#2b2378] h-3 rounded-full transition-all duration-700"
            style={{ width: `${turnout}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{votedCount} voted</span>
          <span>{students.length - votedCount} not yet voted</span>
        </div>
      </div>

      {/* Per-Position Vote Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-[#f9c301]" />
          Leading Candidates by Position
        </h3>
        <div className="flex flex-col gap-3">
          {positions.filter((p) => p.is_active).map((pos) => {
            const posCandidates = candidates
              .filter((c) => c.position_id === pos.id)
              .sort((a, b) => b.vote_count - a.vote_count);
            const leader = posCandidates[0];
            const totalVotes = posCandidates.reduce((s, c) => s + c.vote_count, 0);

            return (
              <div
                key={pos.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{pos.title}</p>
                  {leader ? (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Leading: <span className="font-medium text-[#2b2378]">{leader.name}</span>
                      {' '}({leader.vote_count} votes)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">No candidates yet</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#2b2378]">{totalVotes}</p>
                  <p className="text-xs text-gray-400">votes</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
