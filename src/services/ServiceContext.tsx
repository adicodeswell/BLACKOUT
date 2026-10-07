import React, { createContext, useContext, useMemo } from 'react';
import { Platform, NativeModules } from 'react-native';
import type { DataEngine } from '../contracts/data/DataEngine';
import type { GeoEngine } from '../contracts/geo/GeoEngine';
import type { NetworkEngine } from '../contracts/network/NetworkEngine';
import type { AIEngine } from '../contracts/ai/AIEngine';
import { DevDataEngine } from '../adapters/data/DevDataEngine';
import { RoomDataEngineAdapter } from '../adapters/data/RoomDataEngineAdapter';
import { DevGeoEngine } from '../adapters/geo/DevGeoEngine';
import { GeoEngineAdapter } from '../adapters/geo/GeoEngineAdapter';
import { NetworkEngineAdapter } from '../adapters/network/NetworkEngineAdapter';
import { NativeNetworkEngineAdapter } from '../adapters/network/NativeNetworkEngineAdapter';
import { RuleBasedAIEngine } from './RuleBasedAIEngine';
import { EmergencyReportService } from './EmergencyReportService';
import { IncidentService } from './IncidentService';
import { ResourceService } from './ResourceService';
import { MapService } from './MapService';
import { PeopleService } from './PeopleService';

export interface ServiceContainer {
  dataEngine: DataEngine;
  geoEngine: GeoEngine;
  networkEngine: NetworkEngine;
  aiEngine: AIEngine;
  reportService: EmergencyReportService;
  incidentService: IncidentService;
  resourceService: ResourceService;
  mapService: MapService;
  peopleService: PeopleService;
}

const ServiceContext = createContext<ServiceContainer | null>(null);

export interface ServiceProviderProps {
  children: React.ReactNode;
  overrides?: Partial<ServiceContainer>;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children, overrides }) => {
  const services = useMemo<ServiceContainer>(() => {
    const dataEngine: DataEngine =
      overrides?.dataEngine ||
      (Platform.OS === 'android' && NativeModules.BlackoutDataModule
        ? new RoomDataEngineAdapter()
        : new DevDataEngine());

    const devGeoEngine = new DevGeoEngine();
    const geoEngine: GeoEngine = overrides?.geoEngine || new GeoEngineAdapter(devGeoEngine);

    const networkEngine: NetworkEngine =
      overrides?.networkEngine ||
      (Platform.OS === 'android' && NativeModules.BlackoutNativeModule
        ? new NativeNetworkEngineAdapter()
        : new NetworkEngineAdapter({} as any));

    const aiEngine: AIEngine = overrides?.aiEngine || new RuleBasedAIEngine();

    const reportService =
      overrides?.reportService || new EmergencyReportService(dataEngine, geoEngine, networkEngine);

    const incidentService = overrides?.incidentService || new IncidentService(dataEngine);

    const resourceService = overrides?.resourceService || new ResourceService(dataEngine);

    const mapService = overrides?.mapService || new MapService(geoEngine, dataEngine);

    const peopleService = overrides?.peopleService || new PeopleService(networkEngine, dataEngine);

    return {
      dataEngine,
      geoEngine,
      networkEngine,
      aiEngine,
      reportService,
      incidentService,
      resourceService,
      mapService,
      peopleService,
    };
  }, [overrides]);

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>;
};

export const useServices = (): ServiceContainer => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
