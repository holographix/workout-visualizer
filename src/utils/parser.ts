import type {
    Workout,
    WorkoutStepData,
    WorkoutRepetition,
    WorkoutStructureItem,
    FlatSegment,
    ParsedWorkout
} from '../types/workout';

export const parseWorkout = (data: Workout): ParsedWorkout => {
    const segments: FlatSegment[] = [];
    let currentTime = 0;

    const processStepData = (step: WorkoutStepData) => {
        // Convert duration to seconds - exact from JSON
        let duration: number;
        switch (step.length.unit) {
            case 'second':
                duration = step.length.value;
                break;
            case 'minute':
                duration = step.length.value * 60;
                break;
            default:
                // For any other unit, use value as-is (in seconds)
                duration = step.length.value;
        }

        // Extract targets exactly as they appear in JSON
        const target = step.targets[0];
        const targetMin = target?.minValue ?? 0;
        const targetMax = target?.maxValue ?? 0;

        segments.push({
            startTime: currentTime,
            endTime: currentTime + duration,
            duration,
            targetMin,
            targetMax,
            type: step.intensityClass,
            name: step.name ?? '', // Exact name from JSON, empty if not present
            openDuration: step.openDuration,
        });

        currentTime += duration;
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
            // Wrapper step containing actual steps
            item.steps.forEach(stepData => {
                processStepData(stepData);
            });
        } else if (item.type === 'repetition') {
            processRepetition(item);
        }
    };

    // Process structure exactly as defined in JSON
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
