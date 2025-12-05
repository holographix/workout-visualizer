import type { Workout } from '../types/workout';

export const sampleWorkout: Workout = {
    "id": 7183973,
    "type": "LIBRARY_EXERCISE",
    "attributes": {
        "polyline": "0 1000, 0 833, 167 833, 167 1000, 167 0, 168 0, 168 1000, 168 800, 193 800, 193 1000, 193 0, 194 0, 194 1000, 194 800, 219 800, 219 1000, 219 0, 221 0, 221 1000, 221 800, 246 800, 246 1000, 246 0, 247 0, 247 1000, 247 800, 272 800, 272 1000, 272 800, 728 800, 728 1000, 728 0, 729 0, 729 1000, 729 800, 754 800, 754 1000, 754 0, 756 0, 756 1000, 756 800, 781 800, 781 1000, 781 0, 782 0, 782 1000, 782 800, 807 800, 807 1000, 807 0, 808 0, 808 1000, 808 800, 833 800, 833 1000, 833 833, 1000 833, 1000 1000",
        "allKeyStats": {
            "duration": { "value": "2:00:00", "units": "", "key": "totalTimePlanned" },
            "distance": { "value": "", "units": "km", "key": "distancePlanned" },
            "tss": { "value": "73", "units": "TSS", "key": "tssPlanned" }
        },
        "workoutTypeName": "Bike",
        "ifPlanned": 0.6,
        "velocityPlanned": null,
        "elevationGainPlanned": null,
        "activityType": "WORKOUT",
        "hasPlannedValues": true,
        "isFuture": true,
        "coachComments": null,
        "distancePlanned": null,
        "startTime": { "value": "", "units": "" },
        "tssPlanned": 72.9,
        "exerciseLibraryItemType": "WorkoutTemplate",
        "exerciseLibraryItemId": 7183973,
        "workoutTypeId": 2,
        "fromLegacy": false,
        "totalTimePlanned": 2,
        "structure": {
            "structure": [
                {
                    "type": "step",
                    "length": { "value": 1, "unit": "repetition" },
                    "steps": [
                        { "name": "Warm up", "length": { "value": 1200, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "warmUp", "openDuration": true }
                    ],
                    "begin": 0,
                    "end": 1200
                },
                {
                    "type": "repetition",
                    "length": { "value": 4, "unit": "repetition" },
                    "steps": [
                        { "type": "step", "name": "Hard", "length": { "unit": "second", "value": 10 }, "targets": [{ "minValue": 200, "maxValue": 300 }], "intensityClass": "active", "openDuration": false },
                        { "type": "step", "name": "Easy", "length": { "unit": "second", "value": 180 }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                    ],
                    "begin": 1200,
                    "end": 1960
                },
                {
                    "type": "step",
                    "length": { "value": 1, "unit": "repetition" },
                    "steps": [
                        { "name": "Recovery", "length": { "value": 3280, "unit": "second" }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                    ],
                    "begin": 1960,
                    "end": 5240
                },
                {
                    "type": "repetition",
                    "length": { "value": 4, "unit": "repetition" },
                    "steps": [
                        { "type": "step", "name": "Hard", "length": { "unit": "second", "value": 10 }, "targets": [{ "minValue": 200, "maxValue": 300 }], "intensityClass": "active", "openDuration": false },
                        { "type": "step", "name": "Easy", "length": { "unit": "second", "value": 180 }, "targets": [{ "minValue": 50, "maxValue": 60 }], "intensityClass": "rest", "openDuration": false }
                    ],
                    "begin": 5240,
                    "end": 6000
                },
                {
                    "type": "step",
                    "length": { "value": 1, "unit": "repetition" },
                    "steps": [
                        { "name": "Cool Down", "length": { "value": 1200, "unit": "second" }, "targets": [{ "minValue": 40, "maxValue": 50 }], "intensityClass": "coolDown", "openDuration": false }
                    ],
                    "begin": 6000,
                    "end": 7200
                }
            ]
        },
        "primaryLengthMetric": "duration",
        "primaryIntensityMetric": "percentOfFtp",
        "primaryIntensityTargetOrRange": "range"
    },
    "fileAttachments": null,
    "startTimePlanned": { "value": "", "units": "" },
    "workoutTypeValueId": 2,
    "isToday": false,
    "title": "anaerobic capacity - SPIN1 - 8 x 10'' SRT 20km/h",
    "hasDeviceData": false,
    "isPast": false,
    "energyPlanned": null,
    "activityTime": "",
    "description": "20' warm up progressive\n\n\n- 2 serie di volate cosi composte:\n\nstart 20km/h - rapporto libero\n\n4 x (10'' max sprint - 3' rec)",
    "activityDate": "",
    "exerciseLibraryId": 2832713,
    "itemName": "anaerobic capacity - SPIN1 - 8 x 10'' SRT 20km/h",
    "caloriesPlanned": null,
    "workoutDay": { "value": "", "units": "" }
} as unknown as Workout;
