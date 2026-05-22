import { useEffect, useState } from 'react';
import { Users, CheckSquare, Trophy, Layers, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import { getDashboardStats } from '../../services/api';
import type { DashboardStats } from '../../services/api';
import type { Position } from '../../types';

function EligibilityChips({ position }: { position: Position }) {
  if (position.voter_eligibility === 'all') return null;
  const showCourses = position.voter_eligibility === 'by_course' || position.voter_eligibility === 'by_course_and_year';
  const showYears   = position.voter_eligibility === 'by_year_level' || position.voter_eligibility === 'by_course_and_year';
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {showCourses && position.eligible_courses.map((c) => (
        <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{c}</span>
      ))}
      {showYears && position.eligible_year_levels.map((y) => (
        <span key={y} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{y}</span>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((s) => { setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-[#2b2378] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { settings } = stats;

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
            {settings?.is_open && settings?.end_date && ` \u2022 Ends ${settings.end_date}`}
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
          value={stats.students_total}
          icon={<Users size={20} />}
          color="bg-[#2b2378]"
        />
        <StatCard
          label="Votes Cast"
          value={stats.voted_count}
          icon={<CheckSquare size={20} />}
          color="bg-green-600"
          sub={`${stats.not_voted_count} pending`}
        />
        <StatCard
          label="Positions"
          value={stats.active_positions_count}
          icon={<Layers size={20} />}
          color="bg-indigo-600"
          sub={`${stats.positions_count} total`}
        />
        <StatCard
          label="Candidates"
          value={stats.candidates_count}
          icon={<Trophy size={20} />}
          color="bg-[#f9c301]"
        />
      </div>

      {/* Voter Turnout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-[#2b2378]" />
          <h3 className="font-bold text-gray-900 text-sm">Voter Turnout</h3>
          <span className="ml-auto font-bold text-[#2b2378]">{stats.turnout_percent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-[#2b2378] h-3 rounded-full transition-all duration-700"
            style={{ width: `${stats.turnout_percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{stats.voted_count} voted</span>
          <span>{stats.not_voted_count} not yet voted</span>
        </div>
      </div>

      {/* Per-Position Vote Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-[#f9c301]" />
          Leading Candidates by Position
        </h3>
        {stats.leading_by_position.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No active positions yet. Add positions in the Positions tab.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.leading_by_position.map(({ position, leader, total_votes }) => (
              <div
                key={position.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{position.title}</p>
                  <EligibilityChips position={position} />
                  {leader ? (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Leading:{' '}
                      <span className="font-medium text-[#2b2378]">{leader.name}</span>{' '}
                      ({leader.vote_count} votes)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">No candidates yet</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#2b2378]">{total_votes}</p>
                  <p className="text-xs text-gray-400">votes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
