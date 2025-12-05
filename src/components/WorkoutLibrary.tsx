import { useState, useMemo } from 'react';
import { X, FolderOpen, Zap, Search, Clock, TrendingUp } from 'lucide-react';
import { workoutLibrary, type WorkoutCategory, type WorkoutLibraryItem } from '../data/workoutLibrary';
import type { Workout } from '../types/workout';

interface WorkoutLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectWorkout: (workout: Workout) => void;
}

const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
    isOpen,
    onClose,
    onSelectWorkout,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>(workoutLibrary[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');

    const currentCategory = useMemo(() => {
        return workoutLibrary.find(c => c.id === selectedCategory);
    }, [selectedCategory]);

    const filteredWorkouts = useMemo(() => {
        if (!currentCategory) return [];
        if (!searchQuery.trim()) return currentCategory.workouts;

        const query = searchQuery.toLowerCase();
        return currentCategory.workouts.filter(w =>
            w.name.toLowerCase().includes(query) ||
            w.workout.title.toLowerCase().includes(query) ||
            w.workout.description?.toLowerCase().includes(query)
        );
    }, [currentCategory, searchQuery]);

    const handleSelectWorkout = (item: WorkoutLibraryItem) => {
        onSelectWorkout(item.workout);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Workout Library</h3>
                            <p className="text-xs text-gray-500">Select a workout to visualize</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Category Sidebar */}
                    <div className="w-56 border-r border-gray-700 p-3 flex-shrink-0">
                        <div className="space-y-1">
                            {workoutLibrary.map((category) => (
                                <CategoryButton
                                    key={category.id}
                                    category={category}
                                    isSelected={selectedCategory === category.id}
                                    onClick={() => {
                                        setSelectedCategory(category.id);
                                        setSearchQuery('');
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Workout List */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-gray-700/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search workouts..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Category Description */}
                        {currentCategory && (
                            <div className="px-4 py-2 bg-gray-900/30">
                                <p className="text-xs text-gray-500">{currentCategory.description}</p>
                            </div>
                        )}

                        {/* Workouts Grid */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {filteredWorkouts.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                    No workouts found
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredWorkouts.map((item) => (
                                        <WorkoutCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => handleSelectWorkout(item)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CategoryButtonProps {
    category: WorkoutCategory;
    isSelected: boolean;
    onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
            }`}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'
                }`}>
                    {category.workouts.length}
                </span>
            </div>
        </button>
    );
};

interface WorkoutCardProps {
    item: WorkoutLibraryItem;
    onClick: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ item, onClick }) => {
    const { workout } = item;
    const duration = workout.attributes.totalTimePlanned;
    const tss = workout.attributes.tssPlanned;
    const intensity = workout.attributes.ifPlanned;

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-4 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group"
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                    {item.name}
                </h4>
                <Zap className="w-4 h-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {workout.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {workout.description}
                </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{Math.round(tss)} TSS</span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span>IF {intensity.toFixed(2)}</span>
                </div>
            </div>
        </button>
    );
};
