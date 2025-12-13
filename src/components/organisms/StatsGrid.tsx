import { SimpleGrid } from '@chakra-ui/react';
import { Clock, Zap, TrendingUp, Activity } from 'lucide-react';
import { StatCard } from '../molecules';

interface StatsGridProps {
  duration: string;
  tss: number;
  intensityFactor: number;
  intervals: number;
}

export function StatsGrid({ duration, tss, intensityFactor, intervals }: StatsGridProps) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
      <StatCard
        label="Duration"
        value={duration}
        icon={Clock}
        iconColor="blue.400"
      />
      <StatCard
        label="TSS"
        value={tss.toFixed(0)}
        icon={Zap}
        iconColor="yellow.400"
      />
      <StatCard
        label="IF"
        value={intensityFactor.toFixed(2)}
        icon={TrendingUp}
        iconColor="green.400"
      />
      <StatCard
        label="Intervals"
        value={intervals}
        icon={Activity}
        iconColor="purple.400"
      />
    </SimpleGrid>
  );
}
