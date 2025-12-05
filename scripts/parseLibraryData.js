#!/usr/bin/env node

/**
 * Parse library_raw_data file and generate individual JSON files per category
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_DATA_PATH = path.join(ROOT_DIR, 'src/data/library_raw_data');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/workouts');

// Category metadata for descriptions
const categoryDescriptions = {
    'Anaerobic Capacity': 'High-intensity sprint intervals for neuromuscular power',
    'Easy Ride': 'Low-intensity recovery and endurance rides',
    'FatMax': 'Fat oxidation training in the optimal aerobic zone',
    'General Ride': 'Mixed intensity rides for overall fitness',
    'Muscolar Elasticity': 'Neuromuscular coordination and pedaling efficiency',
    'RacePace': 'Race simulation and pacing practice',
    'Resistence': 'Muscular endurance and strength endurance work',
    'Strength': 'Low cadence, high force pedaling for leg strength',
    'Vo2Max': 'High-intensity intervals to improve maximum oxygen uptake',
    'Test': 'Assessment and testing protocols',
    'Activaction': 'Pre-race activation and opener workouts',
    'WarmUp': 'Structured warm-up protocols',
    'Riposo': 'Rest and recovery days',
};

// Convert category name to a valid ID
function categoryToId(name) {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

// Convert workout name to a valid ID
function workoutToId(name, categoryId) {
    const base = name.toLowerCase()
        .replace(/['']/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `${categoryId}-${base}`;
}

function parseRawData() {
    const content = fs.readFileSync(RAW_DATA_PATH, 'utf-8');
    const lines = content.split('\n');

    const categories = [];
    let currentCategory = null;
    let currentWorkoutName = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Check for category
        if (line.startsWith('CATEGORY:')) {
            const categoryName = line.replace('CATEGORY:', '').trim();
            currentCategory = {
                id: categoryToId(categoryName),
                name: categoryName,
                description: categoryDescriptions[categoryName] || `${categoryName} workouts`,
                workouts: []
            };
            categories.push(currentCategory);
            continue;
        }

        // Check for workout name
        if (line.startsWith('name:')) {
            currentWorkoutName = line.replace('name:', '').trim();
            continue;
        }

        // Check for JSON data
        if (line.startsWith('json:')) {
            if (!currentCategory || !currentWorkoutName) {
                console.warn(`Skipping orphan JSON at line ${i + 1}`);
                continue;
            }

            let jsonStr = line.replace('json:', '').trim();

            try {
                const workout = JSON.parse(jsonStr);
                const workoutId = workoutToId(currentWorkoutName, currentCategory.id);

                currentCategory.workouts.push({
                    id: workoutId,
                    name: currentWorkoutName,
                    workout: workout
                });
            } catch (err) {
                console.error(`Failed to parse JSON for "${currentWorkoutName}" in "${currentCategory.name}": ${err.message}`);
            }

            currentWorkoutName = null;
            continue;
        }
    }

    return categories;
}

function writeOutput(categories) {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write individual category files
    for (const category of categories) {
        const filename = `${category.id}.json`;
        const filepath = path.join(OUTPUT_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(category, null, 2));
        console.log(`✓ ${filename} (${category.workouts.length} workouts)`);
    }

    // Write index file with all categories
    const index = categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        workoutCount: c.workouts.length,
        file: `${c.id}.json`
    }));

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'index.json'),
        JSON.stringify(index, null, 2)
    );
    console.log(`✓ index.json (${categories.length} categories)`);

    // Print summary
    const totalWorkouts = categories.reduce((sum, c) => sum + c.workouts.length, 0);
    console.log(`\n✅ Generated ${categories.length} categories with ${totalWorkouts} total workouts`);
}

// Run
const categories = parseRawData();
writeOutput(categories);
