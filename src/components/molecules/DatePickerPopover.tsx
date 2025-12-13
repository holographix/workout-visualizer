import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  addYears,
  format,
  getYear,
  isToday,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns';

type PickerMode = 'day' | 'month' | 'year';

interface DatePickerPopoverProps {
  /** Current selected date or week start */
  selectedDate: Date;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Display mode - 'week' highlights entire week, 'month' for month picker */
  mode?: 'week' | 'month';
  /** Trigger element (usually the date range text) */
  children: React.ReactNode;
}

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DatePickerPopover({
  selectedDate,
  onDateSelect,
  mode = 'week',
  children,
}: DatePickerPopoverProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewDate, setViewDate] = useState(selectedDate);
  const [pickerMode, setPickerMode] = useState<PickerMode>('day');

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const todayBg = useColorModeValue('brand.500', 'brand.400');
  const selectedBg = useColorModeValue('brand.100', 'brand.800');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const outsideMonthColor = useColorModeValue('gray.400', 'gray.500');
  const weekHighlightBg = useColorModeValue('brand.50', 'brand.900');

  // Generate calendar days for the current view month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;

    // Generate 6 weeks of days
    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [viewDate]);

  // Generate year range for year picker
  const yearRange = useMemo(() => {
    const currentYear = getYear(viewDate);
    const startYear = currentYear - 6;
    return Array.from({ length: 12 }, (_, i) => startYear + i);
  }, [viewDate]);

  // Check if date is in the selected week
  const isInSelectedWeek = (date: Date) => {
    if (mode !== 'week') return false;
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return date >= weekStart && date <= weekEnd;
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    if (mode === 'week') {
      // For week mode, select the week containing this date
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      onDateSelect(weekStart);
    } else {
      onDateSelect(date);
    }
    onClose();
  };

  // Handle month click
  const handleMonthClick = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex);
    if (mode === 'month') {
      onDateSelect(startOfMonth(newDate));
      onClose();
    } else {
      setViewDate(newDate);
      setPickerMode('day');
    }
  };

  // Handle year click
  const handleYearClick = (year: number) => {
    const newDate = setYear(viewDate, year);
    setViewDate(newDate);
    setPickerMode(mode === 'month' ? 'month' : 'day');
  };

  // Navigation handlers
  const handlePrev = () => {
    if (pickerMode === 'day') {
      setViewDate(subMonths(viewDate, 1));
    } else if (pickerMode === 'month') {
      setViewDate(subYears(viewDate, 1));
    } else {
      setViewDate(subYears(viewDate, 12));
    }
  };

  const handleNext = () => {
    if (pickerMode === 'day') {
      setViewDate(addMonths(viewDate, 1));
    } else if (pickerMode === 'month') {
      setViewDate(addYears(viewDate, 1));
    } else {
      setViewDate(addYears(viewDate, 12));
    }
  };

  // Handle opening - reset view date to selected date
  const handleOpen = () => {
    setViewDate(selectedDate);
    setPickerMode(mode === 'month' ? 'month' : 'day');
    onOpen();
  };

  // Go to today
  const handleToday = () => {
    const today = new Date();
    if (mode === 'week') {
      onDateSelect(startOfWeek(today, { weekStartsOn: 1 }));
    } else {
      onDateSelect(startOfMonth(today));
    }
    onClose();
  };

  // Render header title based on mode
  const renderHeaderTitle = () => {
    if (pickerMode === 'day') {
      return format(viewDate, 'MMMM yyyy');
    } else if (pickerMode === 'month') {
      return format(viewDate, 'yyyy');
    } else {
      const startYear = yearRange[0];
      const endYear = yearRange[yearRange.length - 1];
      return `${startYear} - ${endYear}`;
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={handleOpen}
      onClose={onClose}
      placement="bottom"
      closeOnBlur
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        bg={bgColor}
        borderColor={borderColor}
        w="280px"
        shadow="lg"
      >
        <PopoverArrow bg={bgColor} />
        <PopoverBody p={0}>
          {/* Header */}
          <HStack
            bg={headerBg}
            px={2}
            py={2}
            justify="space-between"
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <IconButton
              aria-label="Previous"
              icon={<ChevronLeft size={16} />}
              size="xs"
              variant="ghost"
              onClick={handlePrev}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (pickerMode === 'day') setPickerMode('month');
                else if (pickerMode === 'month') setPickerMode('year');
              }}
              fontWeight="medium"
            >
              {renderHeaderTitle()}
            </Button>
            <IconButton
              aria-label="Next"
              icon={<ChevronRight size={16} />}
              size="xs"
              variant="ghost"
              onClick={handleNext}
            />
          </HStack>

          {/* Day View */}
          {pickerMode === 'day' && (
            <VStack spacing={1} p={2}>
              {/* Weekday headers */}
              <Grid templateColumns="repeat(7, 1fr)" w="full" gap={0}>
                {WEEKDAY_HEADERS.map((day, i) => (
                  <GridItem key={i} textAlign="center">
                    <Text fontSize="xs" fontWeight="medium" color="gray.500">
                      {day}
                    </Text>
                  </GridItem>
                ))}
              </Grid>

              {/* Calendar days */}
              <Grid templateColumns="repeat(7, 1fr)" w="full" gap={0}>
                {calendarDays.map((day, i) => {
                  const isOutsideMonth = !isSameMonth(day, viewDate);
                  const isTodayDate = isToday(day);
                  const isSelected = mode === 'week'
                    ? isInSelectedWeek(day)
                    : isSameDay(day, selectedDate);

                  return (
                    <GridItem key={i}>
                      <Box
                        as="button"
                        w="full"
                        py={1}
                        fontSize="sm"
                        borderRadius={mode === 'week' ? 0 : 'md'}
                        bg={
                          isTodayDate
                            ? todayBg
                            : isSelected && mode === 'week'
                            ? weekHighlightBg
                            : isSelected
                            ? selectedBg
                            : 'transparent'
                        }
                        color={
                          isTodayDate
                            ? 'white'
                            : isOutsideMonth
                            ? outsideMonthColor
                            : undefined
                        }
                        fontWeight={isTodayDate ? 'bold' : 'normal'}
                        _hover={{ bg: isTodayDate ? todayBg : hoverBg }}
                        onClick={() => handleDayClick(day)}
                      >
                        {format(day, 'd')}
                      </Box>
                    </GridItem>
                  );
                })}
              </Grid>
            </VStack>
          )}

          {/* Month View */}
          {pickerMode === 'month' && (
            <Grid templateColumns="repeat(3, 1fr)" p={2} gap={1}>
              {MONTHS.map((month, i) => {
                const isCurrentMonth = i === new Date().getMonth() &&
                  getYear(viewDate) === new Date().getFullYear();
                const isSelected = mode === 'month' &&
                  i === selectedDate.getMonth() &&
                  getYear(viewDate) === getYear(selectedDate);

                return (
                  <Button
                    key={month}
                    size="sm"
                    variant={isSelected ? 'solid' : 'ghost'}
                    colorScheme={isSelected ? 'brand' : undefined}
                    fontWeight={isCurrentMonth ? 'bold' : 'normal'}
                    onClick={() => handleMonthClick(i)}
                  >
                    {month}
                  </Button>
                );
              })}
            </Grid>
          )}

          {/* Year View */}
          {pickerMode === 'year' && (
            <Grid templateColumns="repeat(3, 1fr)" p={2} gap={1}>
              {yearRange.map((year) => {
                const isCurrentYear = year === new Date().getFullYear();
                const isSelected = year === getYear(selectedDate);

                return (
                  <Button
                    key={year}
                    size="sm"
                    variant={isSelected ? 'solid' : 'ghost'}
                    colorScheme={isSelected ? 'brand' : undefined}
                    fontWeight={isCurrentYear ? 'bold' : 'normal'}
                    onClick={() => handleYearClick(year)}
                  >
                    {year}
                  </Button>
                );
              })}
            </Grid>
          )}

          {/* Footer */}
          <HStack
            px={2}
            py={2}
            justify="center"
            borderTopWidth="1px"
            borderColor={borderColor}
          >
            <Button size="xs" variant="ghost" onClick={handleToday}>
              Today
            </Button>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
