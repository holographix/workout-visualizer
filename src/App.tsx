import { useState, useMemo, useCallback } from 'react';
import { ParentSize } from '@visx/responsive';
import { parseWorkout } from './utils/parser';
import { sampleWorkout } from './data/sample';
import { WorkoutChart } from './components/WorkoutChart';
import { Clock, Zap, TrendingUp, Activity, Upload, X, AlertCircle, Check } from 'lucide-react';
import type { TrainingPeaksWorkout } from './types/workout';
import './App.css';

// Format duration from seconds to readable string
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

// Stat card component
const StatCard = ({
  icon: Icon,
  label,
  value,
  unit,
  color
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) => (
  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-white font-mono">{value}</span>
      {unit && <span className="text-sm text-gray-400">{unit}</span>}
    </div>
  </div>
);

// Legend item component
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div
      className="w-3 h-3 rounded-sm"
      style={{ background: `linear-gradient(to bottom, ${color}88, ${color})` }}
    />
    <span className="text-xs text-gray-400">{label}</span>
  </div>
);

function App() {
  const [workoutData, setWorkoutData] = useState<TrainingPeaksWorkout>(sampleWorkout);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState(false);

  const parsedWorkout = useMemo(() => parseWorkout(workoutData), [workoutData]);

  const handleJsonSubmit = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Validate basic structure
      if (!parsed.attributes?.structure?.structure) {
        throw new Error('Invalid workout structure. Missing attributes.structure.structure');
      }
      if (!parsed.title) {
        throw new Error('Invalid workout: missing title');
      }

      setWorkoutData(parsed as TrainingPeaksWorkout);
      setJsonError(null);
      setJsonSuccess(true);
      setHoveredIndex(null);
      setSelectedIndex(null);

      // Hide success message and modal after delay
      setTimeout(() => {
        setJsonSuccess(false);
        setShowJsonInput(false);
        setJsonInput('');
      }, 1000);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      setJsonSuccess(false);
    }
  }, [jsonInput]);

  const handleSegmentHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  const handleSegmentClick = useCallback((index: number | null) => {
    setSelectedIndex(index);
  }, []);

  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'warmUp': return '#3b82f6';
      case 'active': return '#ef4444';
      case 'rest': return '#22c55e';
      case 'coolDown': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Workout Visualizer</h1>
                <p className="text-xs text-gray-500">TrainingPeaks Compatible</p>
              </div>
            </div>

            {/* Load JSON Button */}
            <button
              onClick={() => setShowJsonInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Load Workout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Workout Title & Type */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
              {workoutData.attributes.workoutTypeName}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {parsedWorkout.metadata.title}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Duration"
            value={formatDuration(parsedWorkout.totalDuration)}
            color="text-blue-400"
          />
          <StatCard
            icon={Zap}
            label="TSS"
            value={parsedWorkout.metadata.tss.toFixed(0)}
            color="text-yellow-400"
          />
          <StatCard
            icon={TrendingUp}
            label="IF"
            value={parsedWorkout.metadata.if.toFixed(2)}
            color="text-green-400"
          />
          <StatCard
            icon={Activity}
            label="Intervals"
            value={parsedWorkout.segments.length}
            color="text-purple-400"
          />
        </div>

        {/* Chart Container */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 shadow-xl">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Workout Profile
            </h3>
            <div className="flex items-center gap-4">
              <LegendItem color="#3b82f6" label="Warm Up" />
              <LegendItem color="#ef4444" label="Active" />
              <LegendItem color="#22c55e" label="Rest" />
              <LegendItem color="#8b5cf6" label="Cool Down" />
            </div>
          </div>

          {/* Chart */}
          <div className="h-[350px] md:h-[400px] w-full">
            <ParentSize>
              {({ width, height }) => (
                <WorkoutChart
                  workout={parsedWorkout}
                  width={width}
                  height={height}
                  hoveredIndex={hoveredIndex}
                  selectedIndex={selectedIndex}
                  onSegmentHover={handleSegmentHover}
                  onSegmentClick={handleSegmentClick}
                />
              )}
            </ParentSize>
          </div>
        </div>

        {/* Workout Structure Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Description */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Description
            </h3>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {parsedWorkout.metadata.description || 'No description provided.'}
            </p>
          </div>

          {/* Interval Summary */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Interval Structure
            </h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {parsedWorkout.segments.map((segment, i) => {
                const isHovered = hoveredIndex === i;
                const isSelected = selectedIndex === i;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer ${
                      isHovered || isSelected
                        ? 'bg-gray-600/50 ring-1 ring-white/30'
                        : 'bg-gray-700/30 hover:bg-gray-700/50'
                    }`}
                    onMouseEnter={() => handleSegmentHover(i)}
                    onMouseLeave={() => handleSegmentHover(null)}
                    onClick={() => handleSegmentClick(selectedIndex === i ? null : i)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-8 rounded-full transition-all ${
                          isHovered || isSelected ? 'w-3' : ''
                        }`}
                        style={{ background: getSegmentColor(segment.type) }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{segment.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDuration(segment.duration)}
                          {segment.openDuration && ' (open)'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-gray-300">
                        {segment.targetMin === segment.targetMax
                          ? `${segment.targetMax}%`
                          : `${segment.targetMin}-${segment.targetMax}%`
                        }
                      </p>
                      <p className="text-xs text-gray-500">FTP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* JSON Input Modal */}
      {showJsonInput && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Load Workout JSON</h3>
                <p className="text-xs text-gray-500 mt-0.5">Paste TrainingPeaks workout data</p>
              </div>
              <button
                onClick={() => {
                  setShowJsonInput(false);
                  setJsonError(null);
                  setJsonInput('');
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-hidden">
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError(null);
                  setJsonSuccess(false);
                }}
                placeholder='{"id": 123, "title": "My Workout", "attributes": {...}}'
                className="w-full h-64 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
              />

              {/* Error Message */}
              {jsonError && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {jsonError}
                </div>
              )}

              {/* Success Message */}
              {jsonSuccess && (
                <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  Workout loaded successfully!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowJsonInput(false);
                  setJsonError(null);
                  setJsonInput('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJsonSubmit}
                disabled={!jsonInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Load Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-xs text-gray-600 text-center">
            Workout data visualization for TrainingPeaks structured workouts
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
