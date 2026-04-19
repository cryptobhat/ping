'use client';

import { useEffect, useState } from 'react';
import { competitionApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Trophy, Calendar, Users, Award, Clock, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-600',
  ACTIVE: 'bg-emerald-50 text-emerald-600',
  JUDGING: 'bg-amber-50 text-amber-600',
  COMPLETED: 'bg-warm-100 text-warm-500',
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const { data } = await competitionApi.getAll();
      setCompetitions(data?.data || data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Competitions</h1>
      </div>
      <p className="text-sm text-warm-500">Participate in writing contests and win exciting prizes!</p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : competitions.length === 0 ? (
        <EmptyState icon={Trophy} title="No competitions" description="Check back soon for writing contests!" />
      ) : (
        <div className="space-y-4">
          {competitions.map((comp: any) => (
            <Link key={comp.id} href={`/competition/${comp.id}`}>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5 hover:border-primary/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-warm-900 dark:text-warm-100 text-lg">{comp.title}</h3>
                    <p className="text-sm text-warm-500 mt-1 line-clamp-2">{comp.description}</p>
                  </div>
                  <Badge className={statusColors[comp.status] || statusColors.UPCOMING} size="md">{comp.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-warm-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(comp.startDate || comp.createdAt)}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{comp.entriesCount || 0} entries</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{comp.prizeDescription || 'Prize'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
