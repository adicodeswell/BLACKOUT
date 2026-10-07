import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useServices } from '../services/ServiceContext';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EmergencyReportScreen } from '../screens/EmergencyReportScreen';
import { IncidentDetailScreen } from '../screens/IncidentDetailScreen';
import { ResourcesScreen } from '../screens/ResourcesScreen';
import { ResourceDetailScreen } from '../screens/ResourceDetailScreen';
import { AddResourceScreen } from '../screens/AddResourceScreen';
import { PeopleScreen } from '../screens/PeopleScreen';
import { PeerDetailScreen } from '../screens/PeerDetailScreen';
import { DirectMessageScreen } from '../screens/DirectMessageScreen';
import { NavIcon, MoreMenuModal } from '../components';
import type { EmergencyReportService } from '../services/EmergencyReportService';
import type { IncidentService } from '../services/IncidentService';
import type { ResourceService } from '../services/ResourceService';
import type { MapService } from '../services/MapService';
import type { PeopleService } from '../services/PeopleService';

type TabName = 'Home' | 'Map' | 'Alerts' | 'Resources' | 'People' | 'Profile' | 'Settings';
type ScreenState = TabName | 'EmergencyReport' | 'IncidentDetail' | 'ResourceDetail' | 'AddResource' | 'PeerDetail' | 'DirectMessage';

interface RootNavigatorProps {
  reportService?: EmergencyReportService;
  incidentService?: IncidentService;
  resourceService?: ResourceService;
  mapService?: MapService;
  peopleService?: PeopleService;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({
  reportService: injectedReportService,
  incidentService: injectedIncidentService,
  resourceService: injectedResourceService,
  mapService: injectedMapService,
  peopleService: injectedPeopleService,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const contextServices = useServices();

  const reportService = injectedReportService || contextServices.reportService;
  const incidentService = injectedIncidentService || contextServices.incidentService;
  const resourceService = injectedResourceService || contextServices.resourceService;
  const mapService = injectedMapService || contextServices.mapService;
  const peopleService = injectedPeopleService || contextServices.peopleService;
  const networkAdapter = contextServices.networkEngine;

  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('Home');

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>(undefined);
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(undefined);
  const [selectedPeerId, setSelectedPeerId] = useState<string | undefined>(undefined);

  const navigateTo = (screen: ScreenState, id?: string) => {
    if (screen === 'EmergencyReport') {
      setCurrentScreen('EmergencyReport');
    } else if (screen === 'IncidentDetail' && id) {
      setSelectedIncidentId(id);
      setCurrentScreen('IncidentDetail');
    } else if (screen === 'ResourceDetail' && id) {
      setSelectedResourceId(id);
      setCurrentScreen('ResourceDetail');
    } else if (screen === 'AddResource') {
      setCurrentScreen('AddResource');
    } else if (screen === 'PeerDetail' && id) {
      setSelectedPeerId(id);
      setCurrentScreen('PeerDetail');
    } else if (screen === 'DirectMessage' && id) {
      setSelectedPeerId(id);
      setCurrentScreen('DirectMessage');
    } else {
      setActiveTab(screen as TabName);
      setCurrentScreen(screen as TabName);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'EmergencyReport') {
      setCurrentScreen('Home');
      setActiveTab('Home');
      return true;
    }
    if (currentScreen === 'IncidentDetail') {
      setCurrentScreen('Alerts');
      setActiveTab('Alerts');
      setSelectedIncidentId(undefined);
      return true;
    }
    if (currentScreen === 'ResourceDetail' || currentScreen === 'AddResource') {
      setCurrentScreen('Resources');
      setActiveTab('Resources');
      setSelectedResourceId(undefined);
      return true;
    }
    if (currentScreen === 'PeerDetail' || currentScreen === 'DirectMessage') {
      setCurrentScreen('People');
      setActiveTab('People');
      setSelectedPeerId(undefined);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [currentScreen]);

  const renderActiveScreen = () => {
    if (currentScreen === 'EmergencyReport') {
      return (
        <EmergencyReportScreen
          reportService={reportService}
          onBack={handleBack}
        />
      );
    }

    if (currentScreen === 'IncidentDetail' && selectedIncidentId) {
      return (
        <IncidentDetailScreen
          incidentId={selectedIncidentId}
          incidentService={incidentService}
          onBack={handleBack}
        />
      );
    }

    if (currentScreen === 'ResourceDetail' && selectedResourceId) {
      return (
        <ResourceDetailScreen
          resourceId={selectedResourceId}
          resourceService={resourceService}
          onBack={handleBack}
        />
      );
    }

    if (currentScreen === 'AddResource') {
      return (
        <AddResourceScreen
          resourceService={resourceService}
          onBack={handleBack}
          onSuccess={() => {
            setCurrentScreen('Resources');
            setActiveTab('Resources');
          }}
        />
      );
    }

    if (currentScreen === 'PeerDetail' && selectedPeerId) {
      return (
        <PeerDetailScreen
          peerId={selectedPeerId}
          onBack={handleBack}
          onStartChat={(peerId) => navigateTo('DirectMessage', peerId)}
        />
      );
    }

    if (currentScreen === 'DirectMessage' && selectedPeerId) {
      return (
        <DirectMessageScreen
          peerId={selectedPeerId}
          peopleService={peopleService}
          onBack={handleBack}
        />
      );
    }

    switch (activeTab) {
      case 'Home':
        return (
          <HomeScreen
            onReportEmergency={() => navigateTo('EmergencyReport')}
            onNavigateToMap={() => navigateTo('Map')}
            onNavigateToAlerts={() => navigateTo('Alerts')}
            onNavigateToResources={() => navigateTo('Resources')}
            onNavigateToPeople={() => navigateTo('People')}
            networkEngine={networkAdapter}
            incidentService={incidentService}
          />
        );
      case 'Map':
        return (
          <MapScreen
            mapService={mapService}
            onSelectIncident={(id) => navigateTo('IncidentDetail', id)}
            onSelectResource={(id) => navigateTo('ResourceDetail', id)}
          />
        );
      case 'Alerts':
        return (
          <AlertsScreen
            incidentService={incidentService}
            onSelectIncident={(id) => navigateTo('IncidentDetail', id)}
          />
        );
      case 'Resources':
        return (
          <ResourcesScreen
            resourceService={resourceService}
            onSelectResource={(id) => navigateTo('ResourceDetail', id)}
            onAddResource={() => navigateTo('AddResource')}
          />
        );
      case 'People':
        return (
          <PeopleScreen
            peopleService={peopleService}
            onSelectPeer={(id) => navigateTo('PeerDetail', id)}
            onStartChat={(id) => navigateTo('DirectMessage', id)}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            networkEngine={networkAdapter}
            onNavigateToMesh={() => navigateTo('People')}
            onNavigateToSettings={() => navigateTo('Settings')}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen
            onNavigateToProfile={() => navigateTo('Profile')}
            onNavigateToMesh={() => navigateTo('People')}
          />
        );
      default:
        return <HomeScreen onReportEmergency={() => navigateTo('EmergencyReport')} />;
    }
  };

  const primaryTabs: Array<'Home' | 'Map' | 'Alerts' | 'People' | 'More'> = [
    'Home',
    'Map',
    'Alerts',
    'People',
    'More',
  ];

  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  const isStackOpen =
    currentScreen === 'EmergencyReport' ||
    currentScreen === 'IncidentDetail' ||
    currentScreen === 'ResourceDetail' ||
    currentScreen === 'AddResource' ||
    currentScreen === 'PeerDetail' ||
    currentScreen === 'DirectMessage';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      <MoreMenuModal
        visible={isMoreMenuVisible}
        onClose={() => setIsMoreMenuVisible(false)}
        onSelectDestination={(dest) => navigateTo(dest)}
      />

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.tabBarBorder,
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
          },
        ]}
      >
        {primaryTabs.map((tab) => {
          let isActive = false;
          if (!isStackOpen) {
            if (tab === 'More') {
              isActive = activeTab === 'Resources' || activeTab === 'Profile' || activeTab === 'Settings';
            } else {
              isActive = activeTab === tab;
            }
          }

          const iconColor = isActive ? theme.colors.tabBarActive : theme.colors.tabBarInactive;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                isActive && { backgroundColor: `${theme.colors.tabBarActive}15`, borderRadius: theme.radius.md },
              ]}
              onPress={() => {
                if (tab === 'More') {
                  setIsMoreMenuVisible(true);
                } else {
                  navigateTo(tab);
                }
              }}
              activeOpacity={0.7}
            >
              <NavIcon name={tab as any} color={iconColor} size={20} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontWeight: isActive ? '700' : '500',
                    marginTop: 4,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
  },
});




