import type {
    TrainingPeaksWorkout,
    WorkoutStepData,
    WorkoutRepetition,
    WorkoutStructureItem,
    FlatSegment,
    ParsedWorkout
} from '../types/workout';

export const parseWorkout = (data: TrainingPeaksWorkout): ParsedWorkout => {
    const segments: FlatSegment[] = [];
    let currentTime = 0;

    const processStepData = (step: WorkoutStepData) => {
        const duration = step.length.unit === 'second'
            ? step.length.value
            : step.length.unit === 'minute'
                ? step.length.value * 60
                : step.length.value; // repetition unit, use value as-is

        // Handle Open Duration (indefinite)
        // For visualization, we assign a fixed "visual" duration (e.g., 5 mins) but mark it
        const visualDuration = step.openDuration ? 300 : duration;

        const targetMin = step.targets[0]?.minValue || 0;
        const targetMax = step.targets[0]?.maxValue || 0;

        segments.push({
            startTime: currentTime,
            endTime: currentTime + visualDuration,
            duration: visualDuration,
            targetMin,
            targetMax,
            type: step.intensityClass,
            name: step.name || 'Interval',
            openDuration: step.openDuration,
        });

        currentTime += visualDuration;
    };

    const isRepetition = (item: WorkoutStepData | WorkoutRepetition): item is WorkoutRepetition => {
        return item.type === 'repetition';
    };

    const processRepetition = (rep: WorkoutRepetition) => {
        const repeatCount = rep.length.value;
        for (let i = 0; i < repeatCount; i++) {
            rep.steps.forEach(subItem => {
                if (isRepetition(subItem)) {
                    processRepetition(subItem);
                } else {
                    processStepData(subItem);
                }
            });
        }
    };

    const processStructureItem = (item: WorkoutStructureItem) => {
        if (item.type === 'step') {
            // This is a wrapper step with steps array inside
            item.steps.forEach(stepData => {
                processStepData(stepData);
            });
        } else if (item.type === 'repetition') {
            processRepetition(item);
        }
    };

    // Navigate through: data.attributes.structure.structure
    data.attributes.structure.structure.forEach(item => {
        processStructureItem(item);
    });

    return {
        segments,
        totalDuration: currentTime,
        metadata: {
            title: data.title,
            description: data.description,
            tss: data.attributes.tssPlanned,
            if: data.attributes.ifPlanned,
        }
    };
};
