import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Platform, NativeModules } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
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
import { EmergencyReportService } from '../services/EmergencyReportService';
import { IncidentService } from '../services/IncidentService';
import { ResourceService } from '../services/ResourceService';
import { MapService } from '../services/MapService';
import { PeopleService } from '../services/PeopleService';
import { DevDataEngine } from '../adapters/data/DevDataEngine';
import { RoomDataEngineAdapter } from '../adapters/data/RoomDataEngineAdapter';
import { DevGeoEngine } from '../adapters/geo/DevGeoEngine';
import { GeoEngineAdapter } from '../adapters/geo/GeoEngineAdapter';
import { NetworkEngineAdapter } from '../adapters/network/NetworkEngineAdapter';
import { NativeNetworkEngineAdapter } from '../adapters/network/NativeNetworkEngineAdapter';

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
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('Home');

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>(undefined);
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(undefined);
  const [selectedPeerId, setSelectedPeerId] = useState<string | undefined>(undefined);

  // Initialize DataEngine & GeoEngine fallback and Services lazily
  const { reportService, incidentService, resourceService, mapService, peopleService, networkAdapter } = React.useMemo(() => {
    const dataEngine = (Platform.OS === 'android' && NativeModules.BlackoutDataModule)
      ? new RoomDataEngineAdapter()
      : new DevDataEngine();
    
    const devGeoEngine = new DevGeoEngine();
    const geoAdapter = new GeoEngineAdapter(devGeoEngine);
    const nAdapter = (Platform.OS === 'android' && NativeModules.BlackoutNativeModule)
      ? new NativeNetworkEngineAdapter()
      : new NetworkEngineAdapter({} as any);

    const rService = injectedReportService || new EmergencyReportService(dataEngine, geoAdapter, nAdapter);
    const iService = injectedIncidentService || new IncidentService(dataEngine);
    const resService = injectedResourceService || new ResourceService(dataEngine);
    const mService = injectedMapService || new MapService(geoAdapter, dataEngine);
    const pService = injectedPeopleService || new PeopleService(nAdapter, dataEngine);

    return {
      reportService: rService,
      incidentService: iService,
      resourceService: resService,
      mapService: mService,
      peopleService: pService,
      networkAdapter: nAdapter,
    };
  }, [injectedReportService, injectedIncidentService, injectedResourceService, injectedMapService, injectedPeopleService]);

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
            networkEngine={networkAdapter}
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
        return <ProfileScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onReportEmergency={() => navigateTo('EmergencyReport')} />;
    }
  };

  const tabs: TabName[] = ['Home', 'Map', 'Alerts', 'Resources', 'People', 'Profile', 'Settings'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.tabBarBorder,
            paddingBottom: insets.bottom,
            height: 56 + insets.bottom,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive =
            currentScreen !== 'EmergencyReport' &&
            currentScreen !== 'IncidentDetail' &&
            currentScreen !== 'ResourceDetail' &&
            currentScreen !== 'AddResource' &&
            currentScreen !== 'PeerDetail' &&
            currentScreen !== 'DirectMessage' &&
            activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => navigateTo(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.colors.tabBarActive : theme.colors.tabBarInactive,
                    fontWeight: isActive ? '700' : '400',
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




