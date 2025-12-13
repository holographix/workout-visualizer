import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  IconButton,
  Input,
  Button,
  Badge,
  useColorModeValue,
  Wrap,
  WrapItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CalendarX, Plus, X, Calendar } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays, startOfMonth, endOfMonth, startOfWeek, addMonths, subMonths } from 'date-fns';
import type { UnavailableDate } from '../../../types/availability';

interface UnavailableDatesEditorProps {
  dates: UnavailableDate[];
  onChange: (dates: UnavailableDate[]) => void;
}

// Mini calendar for date picking
function MiniCalendar({
  selectedDates,
  onDateSelect
}: {
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const todayBg = useColorModeValue('brand.500', 'brand.400');
  const selectedBg = useColorModeValue('red.100', 'red.800');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const outsideMonthColor = useColorModeValue('gray.400', 'gray.500');

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  for (let i = 0; i < 42; i++) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDateSelected = (date: Date) =>
    selectedDates.some(d => isSameDay(d, date));

  const isToday = (date: Date) =>
    isSameDay(date, new Date());

  const isOutsideMonth = (date: Date) =>
    date < monthStart || date > monthEnd;

  return (
    <Box p={2}>
      {/* Month navigation */}
      <Flex justify="space-between" align="center" mb={2}>
        <IconButton
          aria-label="Previous month"
          icon={<Text fontSize="lg">&lt;</Text>}
          size="xs"
          variant="ghost"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
        />
        <Text fontSize="sm" fontWeight="medium">
          {format(viewMonth, 'MMMM yyyy')}
        </Text>
        <IconButton
          aria-label="Next month"
          icon={<Text fontSize="lg">&gt;</Text>}
          size="xs"
          variant="ghost"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
        />
      </Flex>

      {/* Weekday headers */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap={0}
        mb={1}
      >
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Box key={i} textAlign="center">
            <Text fontSize="xs" color="gray.500">{d}</Text>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        gap={0}
      >
        {days.map((date, i) => {
          const selected = isDateSelected(date);
          const today = isToday(date);
          const outside = isOutsideMonth(date);

          return (
            <Box
              key={i}
              as="button"
              type="button"
              h="28px"
              fontSize="xs"
              borderRadius="md"
              bg={today ? todayBg : selected ? selectedBg : 'transparent'}
              color={today ? 'white' : outside ? outsideMonthColor : undefined}
              fontWeight={today || selected ? 'bold' : 'normal'}
              _hover={{ bg: today ? todayBg : hoverBg }}
              onClick={() => onDateSelect(date)}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {format(date, 'd')}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function UnavailableDatesEditor({ dates, onChange }: UnavailableDatesEditorProps) {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newReason, setNewReason] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const dateBg = useColorModeValue('red.50', 'red.900');
  const dateColor = useColorModeValue('red.700', 'red.200');

  const handleDateSelect = (date: Date) => {
    const normalizedDate = startOfDay(date);
    const existingIndex = dates.findIndex(d => isSameDay(d.date, normalizedDate));

    if (existingIndex >= 0) {
      // Remove if already selected
      const newDates = dates.filter((_, i) => i !== existingIndex);
      onChange(newDates);
    } else {
      // Add new unavailable date
      const newDate: UnavailableDate = {
        id: `unavail-${Date.now()}`,
        date: normalizedDate,
        reason: newReason || undefined,
      };
      onChange([...dates, newDate].sort((a, b) => a.date.getTime() - b.date.getTime()));
    }
  };

  const handleRemoveDate = (id: string) => {
    onChange(dates.filter(d => d.id !== id));
  };

  // Group dates by month for display
  const groupedDates = dates.reduce<Record<string, UnavailableDate[]>>((acc, date) => {
    const monthKey = format(date.date, 'yyyy-MM');
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(date);
    return acc;
  }, {});

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        justify="space-between"
        align="center"
      >
        <HStack spacing={2}>
          <CalendarX size={18} />
          <Heading size="sm">{t('availability.unavailableDates')}</Heading>
        </HStack>
        <Badge colorScheme="red" fontSize="sm" px={2} py={1}>
          {dates.length} {t('availability.datesMarked')}
        </Badge>
      </Flex>

      {/* Content */}
      <Box p={4}>
        {/* Add Date Section */}
        <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start">
          <PopoverTrigger>
            <Button
              leftIcon={<Plus size={16} />}
              size="sm"
              colorScheme="red"
              variant="outline"
              mb={4}
            >
              {t('availability.addUnavailableDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent w="auto" shadow="lg">
            <PopoverArrow />
            <PopoverBody p={0}>
              <MiniCalendar
                selectedDates={dates.map(d => d.date)}
                onDateSelect={handleDateSelect}
              />
              <Box px={3} pb={3}>
                <Input
                  size="sm"
                  placeholder={t('availability.reasonOptional')}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </Box>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        {/* Dates List */}
        {dates.length === 0 ? (
          <Text color={mutedColor} fontSize="sm" textAlign="center" py={4}>
            {t('availability.noUnavailableDates')}
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {Object.entries(groupedDates).map(([monthKey, monthDates]) => (
              <Box key={monthKey}>
                <Text fontSize="xs" fontWeight="medium" color={mutedColor} mb={2} textTransform="uppercase">
                  {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
                </Text>
                <Wrap spacing={2}>
                  {monthDates.map((unavailDate) => (
                    <WrapItem key={unavailDate.id}>
                      <HStack
                        bg={dateBg}
                        color={dateColor}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        fontSize="sm"
                        spacing={2}
                      >
                        <Calendar size={14} />
                        <Text fontWeight="medium">
                          {format(unavailDate.date, 'EEE, MMM d')}
                        </Text>
                        {unavailDate.reason && (
                          <Text fontSize="xs" opacity={0.8}>
                            ({unavailDate.reason})
                          </Text>
                        )}
                        <IconButton
                          aria-label={t('availability.removeDate')}
                          icon={<X size={12} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleRemoveDate(unavailDate.id)}
                        />
                      </HStack>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
