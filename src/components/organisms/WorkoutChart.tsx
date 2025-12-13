import { useMemo, useState, useCallback } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinearGradient } from '@visx/gradient';
import type { ParsedWorkout, FlatSegment } from '../../types/workout';

interface WorkoutChartProps {
    workout: ParsedWorkout;
    width: number;
    height: number;
    hoveredIndex: number | null;
    onSegmentHover: (index: number | null) => void;
    onSegmentClick: (index: number | null) => void;
    selectedIndex: number | null;
}

const MARGIN = { top: 20, right: 30, bottom: 40, left: 50 };

const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
};

interface TooltipData {
    segment: FlatSegment;
    index: number;
    x: number;
    y: number;
    barWidth: number;
}

export const WorkoutChart: React.FC<WorkoutChartProps> = ({
    workout,
    width,
    height,
    hoveredIndex,
    onSegmentHover,
    onSegmentClick,
    selectedIndex
}) => {
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

    const xMax = width - MARGIN.left - MARGIN.right;
    const yMax = height - MARGIN.top - MARGIN.bottom;

    const xScale = useMemo(
        () =>
            scaleLinear<number>({
                domain: [0, workout.totalDuration],
                range: [0, xMax],
            }),
        [workout.totalDuration, xMax],
    );

    const maxIntensity = useMemo(
        () => Math.max(...workout.segments.map((s: FlatSegment) => s.targetMax), 100) * 1.1,
        [workout.segments],
    );

    const yScale = useMemo(
        () =>
            scaleLinear<number>({
                domain: [0, maxIntensity],
                range: [yMax, 0],
            }),
        [maxIntensity, yMax],
    );

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h${remainingMins}m` : `${hours}h`;
    };

    // Calculate bar positions for all segments
    const barPositions = useMemo(() => {
        return workout.segments.map((segment: FlatSegment) => {
            const barWidth = Math.max(xScale(segment.endTime) - xScale(segment.startTime) - 1, 1);
            const barHeight = yMax - yScale(segment.targetMax);
            const x = xScale(segment.startTime);
            const y = yScale(segment.targetMax);
            return { x, y, barWidth, barHeight };
        });
    }, [workout.segments, xScale, yScale, yMax]);

    const handleMouseEnter = useCallback(
        (segment: FlatSegment, index: number) => {
            const pos = barPositions[index];
            setTooltipData({
                segment,
                index,
                x: pos.x + pos.barWidth / 2,
                y: pos.y,
                barWidth: pos.barWidth,
            });
            onSegmentHover(index);
        },
        [barPositions, onSegmentHover],
    );

    const handleMouseLeave = useCallback(() => {
        setTooltipData(null);
        onSegmentHover(null);
    }, [onSegmentHover]);

    if (width < 10) return null;

    // Calculate tooltip position with screen awareness
    const getTooltipStyle = () => {
        if (!tooltipData) return {};

        const tooltipWidth = 180;
        const tooltipHeight = 80;
        const padding = 8;

        // Center X position of the bar (in SVG coordinates)
        let tooltipX = tooltipData.x + MARGIN.left;
        let tooltipY = tooltipData.y + MARGIN.top - tooltipHeight - padding;

        // Horizontal bounds checking
        if (tooltipX - tooltipWidth / 2 < padding) {
            tooltipX = tooltipWidth / 2 + padding;
        } else if (tooltipX + tooltipWidth / 2 > width - padding) {
            tooltipX = width - tooltipWidth / 2 - padding;
        }

        // If tooltip would go above the chart, show it below the bar instead
        if (tooltipY < padding) {
            const barHeight = barPositions[tooltipData.index].barHeight;
            tooltipY = tooltipData.y + MARGIN.top + barHeight + padding;
        }

        return {
            left: tooltipX,
            top: tooltipY,
            transform: 'translateX(-50%)',
        };
    };

    return (
        <div className="relative" style={{ width, height }}>
            <svg width={width} height={height} className="overflow-visible">
                {/* Gradient definitions */}
                <defs>
                    <LinearGradient id="warmUp" from="#60a5fa" to="#3b82f6" vertical />
                    <LinearGradient id="active" from="#f87171" to="#dc2626" vertical />
                    <LinearGradient id="rest" from="#4ade80" to="#22c55e" vertical />
                    <LinearGradient id="coolDown" from="#a78bfa" to="#8b5cf6" vertical />

                    {/* Dimmed versions for non-hovered state */}
                    <LinearGradient id="warmUp-dim" from="#60a5fa55" to="#3b82f655" vertical />
                    <LinearGradient id="active-dim" from="#f8717155" to="#dc262655" vertical />
                    <LinearGradient id="rest-dim" from="#4ade8055" to="#22c55e55" vertical />
                    <LinearGradient id="coolDown-dim" from="#a78bfa55" to="#8b5cf655" vertical />

                    {/* Open duration pattern */}
                    <pattern id="openDurationPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="1.5"/>
                    </pattern>
                </defs>

                <Group left={MARGIN.left} top={MARGIN.top}>
                    {/* Background grid lines */}
                    {yScale.ticks(5).map((tick, i) => (
                        <line
                            key={`grid-${i}`}
                            x1={0}
                            x2={xMax}
                            y1={yScale(tick)}
                            y2={yScale(tick)}
                            stroke="#374151"
                            strokeOpacity={0.5}
                            strokeDasharray="4,4"
                        />
                    ))}

                    {/* FTP reference line at 100% */}
                    <line
                        x1={0}
                        x2={xMax}
                        y1={yScale(100)}
                        y2={yScale(100)}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="6,3"
                        strokeOpacity={0.8}
                    />
                    <text
                        x={xMax + 5}
                        y={yScale(100)}
                        fill="#f59e0b"
                        fontSize={10}
                        dy={3}
                    >
                        FTP
                    </text>

                    {/* Workout segments */}
                    {workout.segments.map((segment: FlatSegment, i: number) => {
                        const { x, y, barWidth, barHeight } = barPositions[i];
                        const isHovered = hoveredIndex === i;
                        const isSelected = selectedIndex === i;
                        const isDimmed = (hoveredIndex !== null || selectedIndex !== null) && !isHovered && !isSelected;

                        return (
                            <g key={i}>
                                {/* Main bar with gradient */}
                                <Bar
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={isDimmed ? `url(#${segment.type}-dim)` : `url(#${segment.type})`}
                                    rx={3}
                                    style={{
                                        transition: 'all 0.15s ease-out',
                                        transform: isHovered || isSelected ? 'scaleY(1.02)' : 'scaleY(1)',
                                        transformOrigin: `center bottom`,
                                        transformBox: 'fill-box',
                                    }}
                                />

                                {/* Intensity range indicator (min to max) */}
                                {segment.targetMin !== segment.targetMax && (
                                    <rect
                                        x={x}
                                        y={yScale(segment.targetMax)}
                                        width={barWidth}
                                        height={yScale(segment.targetMin) - yScale(segment.targetMax)}
                                        fill="rgba(255,255,255,0.1)"
                                        rx={3}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}

                                {/* Open duration indicator */}
                                {segment.openDuration && (
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight}
                                        fill="url(#openDurationPattern)"
                                        rx={3}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}

                                {/* Highlight border for hovered/selected */}
                                <Bar
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="transparent"
                                    stroke={isHovered || isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}
                                    strokeWidth={isHovered || isSelected ? 2 : 1}
                                    rx={3}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Invisible hit area for mouse events */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => handleMouseEnter(segment, i)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => onSegmentClick(selectedIndex === i ? null : i)}
                                />
                            </g>
                        );
                    })}

                    {/* X Axis */}
                    <AxisBottom
                        scale={xScale}
                        top={yMax}
                        stroke="#4b5563"
                        tickStroke="#4b5563"
                        tickLength={4}
                        numTicks={Math.min(10, Math.floor(workout.totalDuration / 300))}
                        tickLabelProps={() => ({
                            fill: '#9ca3af',
                            fontSize: 11,
                            fontFamily: 'system-ui',
                            textAnchor: 'middle',
                            dy: 4,
                        })}
                        tickFormat={(v) => formatTime(v as number)}
                    />

                    {/* Y Axis */}
                    <AxisLeft
                        scale={yScale}
                        stroke="#4b5563"
                        tickStroke="#4b5563"
                        tickLength={4}
                        numTicks={5}
                        tickLabelProps={() => ({
                            fill: '#9ca3af',
                            fontSize: 11,
                            fontFamily: 'system-ui',
                            textAnchor: 'end',
                            dx: -4,
                            dy: 3,
                        })}
                        tickFormat={(v) => `${v}%`}
                    />
                </Group>
            </svg>

            {/* Tooltip - positioned absolutely within the chart container */}
            {tooltipData && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        ...getTooltipStyle(),
                        zIndex: 1000,
                    }}
                >
                    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-2xl px-3 py-2 min-w-[160px]">
                        {/* Arrow indicator */}
                        <div
                            className="absolute w-3 h-3 bg-gray-900/95 border-l border-b border-gray-600 transform rotate-[-135deg]"
                            style={{
                                left: '50%',
                                bottom: '-6px',
                                marginLeft: '-6px',
                            }}
                        />
                        <div className="font-semibold text-white text-sm mb-1">
                            {tooltipData.segment.name}
                        </div>
                        <div className="text-gray-400 text-xs space-y-0.5">
                            <div className="flex justify-between gap-4">
                                <span>Duration:</span>
                                <span className="text-white font-mono">
                                    {formatDuration(tooltipData.segment.duration)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span>Target:</span>
                                <span className="text-white font-mono">
                                    {tooltipData.segment.targetMin === tooltipData.segment.targetMax
                                        ? `${tooltipData.segment.targetMax}%`
                                        : `${tooltipData.segment.targetMin}-${tooltipData.segment.targetMax}%`
                                    }
                                    <span className="text-gray-500 ml-1">FTP</span>
                                </span>
                            </div>
                            {tooltipData.segment.openDuration && (
                                <div className="text-yellow-400 mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Open duration
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
