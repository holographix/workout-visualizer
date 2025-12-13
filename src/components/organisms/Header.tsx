import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu as ChakraMenu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  Badge,
  Skeleton,
  useColorModeValue,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Calendar, Settings, Menu, Users, ChevronDown, User } from 'lucide-react';
import { Logo, ColorModeToggle } from '../atoms';
import { AuthHeader } from './AuthHeader';
import { useUser } from '../../contexts';

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, isLoading, isCoach, availableUsers, switchUser, currentUserId } = useUser();

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');
  const menuBg = useColorModeValue('white', 'gray.800');

  const isDashboardPage = location.pathname === '/' || location.pathname === '/dashboard';
  const isCalendarPage = location.pathname === '/calendar';
  const isSettingsPage = location.pathname === '/settings';
  const isCoachPage = location.pathname === '/coach';

  // Build nav items based on user role
  const navItems = [
    { to: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, isActive: isDashboardPage, show: true, dataTour: 'nav-dashboard' },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar, isActive: isCalendarPage, show: true, dataTour: 'nav-calendar' },
    // Only show Coach tab if user has coaching relationships (is a coach)
    { to: '/coach', label: t('nav.coach'), icon: Users, isActive: isCoachPage, show: isCoach, dataTour: 'nav-coach' },
    { to: '/settings', label: t('nav.settings'), icon: Settings, isActive: isSettingsPage, show: true, dataTour: 'nav-settings' },
  ].filter((item) => item.show);

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={10}
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      backdropFilter="blur(10px)"
      flexShrink={0}
    >
      <Container maxW="full" px={{ base: 3, md: 6 }} py={{ base: 2, md: 4 }}>
        <Flex justify="space-between" align="center">
          <HStack spacing={{ base: 2, md: 6 }}>
            <Logo size={isMobile ? 'sm' : 'md'} showText={!isMobile} />

            {/* Desktop Navigation */}
            {!isMobile && (
              <HStack spacing={1}>
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    as={Link}
                    to={item.to}
                    leftIcon={<item.icon size={16} />}
                    variant={item.isActive ? 'solid' : 'ghost'}
                    colorScheme={item.isActive ? 'brand' : undefined}
                    bg={item.isActive ? activeBg : undefined}
                    color={item.isActive ? activeColor : undefined}
                    size="sm"
                    data-tour={item.dataTour}
                  >
                    {item.label}
                  </Button>
                ))}
              </HStack>
            )}
          </HStack>

          <HStack spacing={{ base: 1, md: 3 }}>
            <ColorModeToggle />

            {/* User Switcher (for testing) */}
            {availableUsers.length > 0 && (
              <ChakraMenu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronDown size={14} />}
                  px={2}
                >
                  {isLoading ? (
                    <Skeleton height="20px" width="100px" />
                  ) : (
                    <HStack spacing={2}>
                      <Avatar
                        size="xs"
                        name={user?.fullName}
                        icon={<User size={14} />}
                      />
                      {!isMobile && (
                        <VStack spacing={0} align="start">
                          <Text fontSize="xs" fontWeight="medium" lineHeight="1.2">
                            {user?.fullName || 'Select User'}
                          </Text>
                          <HStack spacing={1}>
                            {isCoach && (
                              <Badge size="sm" colorScheme="purple" fontSize="9px" px={1}>
                                Coach
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      )}
                    </HStack>
                  )}
                </MenuButton>
                <MenuList bg={menuBg} zIndex={20}>
                  <Text px={3} py={2} fontSize="xs" color="gray.500" fontWeight="medium">
                    {t('nav.switchUser')}
                  </Text>
                  <MenuDivider />
                  {availableUsers.map((u) => {
                    // Check both array length and _count (list endpoint returns _count)
                    const countObj = u as { _count?: { coachingRelationships?: number } };
                    const userIsCoach = (u.coachingRelationships?.length ?? countObj._count?.coachingRelationships ?? 0) > 0;
                    return (
                      <MenuItem
                        key={u.id}
                        onClick={() => switchUser(u.id)}
                        bg={u.id === currentUserId ? activeBg : undefined}
                      >
                        <HStack spacing={3} w="full">
                          <Avatar size="sm" name={u.fullName} icon={<User size={16} />} />
                          <VStack spacing={0} align="start" flex={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {u.fullName}
                            </Text>
                            <HStack spacing={1}>
                              {userIsCoach && (
                                <Badge colorScheme="purple" fontSize="9px">Coach</Badge>
                              )}
                              {!userIsCoach && (
                                <Badge colorScheme="blue" fontSize="9px">Athlete</Badge>
                              )}
                            </HStack>
                          </VStack>
                        </HStack>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ChakraMenu>
            )}

            {!isMobile && <AuthHeader />}
            {isMobile && (
              <IconButton
                aria-label={t('nav.openMenu')}
                icon={<Menu size={20} />}
                variant="ghost"
                onClick={onOpen}
              />
            )}
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={bgColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Logo size="md" showText />
          </DrawerHeader>
          <DrawerBody py={4}>
            <VStack spacing={2} align="stretch">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  as={Link}
                  to={item.to}
                  leftIcon={<item.icon size={18} />}
                  variant={item.isActive ? 'solid' : 'ghost'}
                  colorScheme={item.isActive ? 'brand' : undefined}
                  bg={item.isActive ? activeBg : undefined}
                  color={item.isActive ? activeColor : undefined}
                  size="lg"
                  justifyContent="flex-start"
                  onClick={onClose}
                >
                  {item.label}
                </Button>
              ))}
            </VStack>
            <Box mt={6} pt={6} borderTopWidth="1px">
              <AuthHeader />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
