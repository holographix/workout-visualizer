import type { Workout } from '../types/workout';

export interface WorkoutLibraryItem {
    id: string;
    name: string;
    workout: Workout;
}

export interface WorkoutCategory {
    id: string;
    name: string;
    description: string;
    workouts: WorkoutLibraryItem[];
}

export const workoutLibrary: WorkoutCategory[] = [
    {
        id: 'anaerobic-capacity',
        name: 'Anaerobic Capacity',
        description: 'High-intensity sprint intervals for neuromuscular power',
        workouts: [
            {
                id: 'ac-spin1-8x10',
                name: '8 x 10" SRT 20km/h',
                workout: {
                    "id": 7183973,
                    "title": "anaerobic capacity - SPIN1 - 8 x 10'' SRT 20km/h",
                    "description": "20' warm up progressive\n\n\n- 2 serie di volate cosi composte:\n\nstart 20km/h - rapporto libero\n\n4 x (10'' max sprint - 3' rec)",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.6,
                        "tssPlanned": 72.9,
                        "totalTimePlanned": 2,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 1200, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "warmUp", "openDuration": true }
                                    ]
                                },
                                {
                                    "type": "repetition",
                                    "length": { "value": 4, "unit": "repetition" },
                                    "steps": [
                                        { "type": "step", "name": "Hard", "length": { "unit": "second", "value": 10 }, "targets": [{ "minValue": 200, "maxValue": 300 }], "intensityClass": "active", "openDuration": false },
                                        { "type": "step", "name": "Easy", "length": { "unit": "second", "value": 180 }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Recovery", "length": { "value": 3280, "unit": "second" }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "repetition",
                                    "length": { "value": 4, "unit": "repetition" },
                                    "steps": [
                                        { "type": "step", "name": "Hard", "length": { "unit": "second", "value": 10 }, "targets": [{ "minValue": 200, "maxValue": 300 }], "intensityClass": "active", "openDuration": false },
                                        { "type": "step", "name": "Easy", "length": { "unit": "second", "value": 180 }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 1200, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            }
        ]
    },
    {
        id: 'easy-ride',
        name: 'Easy Ride',
        description: 'Low-intensity recovery and endurance rides',
        workouts: [
            {
                id: 'easy-z1-60',
                name: 'Zone 1 Recovery - 60min',
                workout: {
                    "id": 1001,
                    "title": "Easy Ride - Zone 1 Recovery",
                    "description": "Easy recovery spin. Keep power in Zone 1 throughout. Focus on smooth pedaling and staying relaxed.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.55,
                        "tssPlanned": 30,
                        "totalTimePlanned": 1,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Easy Spin", "length": { "value": 3600, "unit": "second" }, "targets": [{ "minValue": 45, "maxValue": 55 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            },
            {
                id: 'easy-z2-90',
                name: 'Zone 2 Endurance - 90min',
                workout: {
                    "id": 1002,
                    "title": "Easy Ride - Zone 2 Endurance",
                    "description": "Aerobic endurance ride. Maintain Zone 2 power with a brief warm-up and cool-down.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.65,
                        "tssPlanned": 60,
                        "totalTimePlanned": 1.5,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 600, "unit": "second" }, "targets": [{ "minValue": 45, "maxValue": 55 }], "intensityClass": "warmUp", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Zone 2", "length": { "value": 4200, "unit": "second" }, "targets": [{ "minValue": 56, "maxValue": 75 }], "intensityClass": "active", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 600, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            }
        ]
    },
    {
        id: 'fatmax',
        name: 'FatMax',
        description: 'Fat oxidation training in the optimal aerobic zone',
        workouts: [
            {
                id: 'fatmax-2h',
                name: 'FatMax 2 Hours',
                workout: {
                    "id": 2001,
                    "title": "FatMax - 2 Hour Fat Burning",
                    "description": "Long aerobic ride in the FatMax zone (60-70% FTP). Maintain steady effort to maximize fat oxidation. Stay fueled with water and light carbs.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.65,
                        "tssPlanned": 85,
                        "totalTimePlanned": 2,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 900, "unit": "second" }, "targets": [{ "minValue": 45, "maxValue": 55 }], "intensityClass": "warmUp", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "FatMax Zone", "length": { "value": 5400, "unit": "second" }, "targets": [{ "minValue": 60, "maxValue": 70 }], "intensityClass": "active", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 900, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            }
        ]
    },
    {
        id: 'general-ride',
        name: 'General Ride',
        description: 'Mixed intensity rides for overall fitness',
        workouts: [
            {
                id: 'general-sweetspot-60',
                name: 'Sweet Spot 3x10',
                workout: {
                    "id": 3001,
                    "title": "General - Sweet Spot 3x10min",
                    "description": "Sweet spot intervals at 88-94% FTP. Great for building FTP with manageable fatigue. 5min recovery between intervals.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.85,
                        "tssPlanned": 75,
                        "totalTimePlanned": 1.25,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 900, "unit": "second" }, "targets": [{ "minValue": 50, "maxValue": 65 }], "intensityClass": "warmUp", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "repetition",
                                    "length": { "value": 3, "unit": "repetition" },
                                    "steps": [
                                        { "type": "step", "name": "Sweet Spot", "length": { "unit": "second", "value": 600 }, "targets": [{ "minValue": 88, "maxValue": 94 }], "intensityClass": "active", "openDuration": false },
                                        { "type": "step", "name": "Recovery", "length": { "unit": "second", "value": 300 }, "targets": [{ "minValue": 50, "maxValue": 55 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 600, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            },
            {
                id: 'general-vo2-4x4',
                name: 'VO2 Max 4x4min',
                workout: {
                    "id": 3002,
                    "title": "General - VO2 Max 4x4min",
                    "description": "VO2 max intervals at 106-120% FTP. Hard but short. Full recovery between efforts to ensure quality.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.92,
                        "tssPlanned": 85,
                        "totalTimePlanned": 1.25,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 900, "unit": "second" }, "targets": [{ "minValue": 50, "maxValue": 70 }], "intensityClass": "warmUp", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "repetition",
                                    "length": { "value": 4, "unit": "repetition" },
                                    "steps": [
                                        { "type": "step", "name": "VO2 Max", "length": { "unit": "second", "value": 240 }, "targets": [{ "minValue": 106, "maxValue": 120 }], "intensityClass": "active", "openDuration": false },
                                        { "type": "step", "name": "Recovery", "length": { "unit": "second", "value": 240 }, "targets": [{ "minValue": 45, "maxValue": 55 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 600, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            },
            {
                id: 'general-threshold-2x20',
                name: 'Threshold 2x20min',
                workout: {
                    "id": 3003,
                    "title": "General - Threshold 2x20min",
                    "description": "Classic threshold work. Two 20-minute efforts at 95-105% FTP with 10min recovery between. The gold standard for FTP development.",
                    "attributes": {
                        "workoutTypeName": "Bike",
                        "ifPlanned": 0.88,
                        "tssPlanned": 90,
                        "totalTimePlanned": 1.5,
                        "structure": {
                            "structure": [
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Warm up", "length": { "value": 900, "unit": "second" }, "targets": [{ "minValue": 50, "maxValue": 70 }], "intensityClass": "warmUp", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "repetition",
                                    "length": { "value": 2, "unit": "repetition" },
                                    "steps": [
                                        { "type": "step", "name": "Threshold", "length": { "unit": "second", "value": 1200 }, "targets": [{ "minValue": 95, "maxValue": 105 }], "intensityClass": "active", "openDuration": false },
                                        { "type": "step", "name": "Recovery", "length": { "unit": "second", "value": 600 }, "targets": [{ "minValue": 50, "maxValue": 55 }], "intensityClass": "rest", "openDuration": false }
                                    ]
                                },
                                {
                                    "type": "step",
                                    "length": { "value": 1, "unit": "repetition" },
                                    "steps": [
                                        { "name": "Cool Down", "length": { "value": 600, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                                    ]
                                }
                            ]
                        }
                    }
                } as Workout
            }
        ]
    }
];

// Helper to get all workouts flat
export const getAllWorkouts = (): WorkoutLibraryItem[] => {
    return workoutLibrary.flatMap(category => category.workouts);
};

// Helper to find workout by id
export const findWorkoutById = (id: string): WorkoutLibraryItem | undefined => {
    return getAllWorkouts().find(w => w.id === id);
};
