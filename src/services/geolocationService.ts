import { UserLocation } from '../types/map';

export class GeolocationService {
  private static instance: GeolocationService;
  private watchId: number | null = null;
  private lastKnownPosition: UserLocation | null = null;

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  async getCurrentLocation(): Promise<UserLocation> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          this.lastKnownPosition = location;
          
          // Log location access for analytics
          this.logLocationAccess('current_location');
          
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          let errorMessage = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          // Log geolocation error for analytics
          this.logLocationError(error.code, errorMessage);
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  startWatching(callback: (location: UserLocation) => void): void {
    if (!navigator.geolocation || this.watchId) {
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        this.lastKnownPosition = location;
        callback(location);
      },
      (error) => {
        console.warn('Watch position error:', error);
        this.logLocationError(error.code, `Watch position error: ${error.message}`);
      },
      options
    );
  }

  stopWatching(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getLastKnownPosition(): UserLocation | null {
    return this.lastKnownPosition;
  }

  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  private logLocationAccess(type: string): void {
    // Basic analytics logging
    console.log(`Location access: ${type}`, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      type
    });
    
    // In a production app, you would send this to your analytics service
    // analytics.track('location_accessed', { type });
  }

  private logLocationError(code: number, message: string): void {
    // Error logging for analytics
    console.error('Geolocation error logged:', {
      code,
      message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    // In a production app, you would send this to your error tracking service
    // errorTracker.captureException(new Error(message), { code });
  }
}

export const geolocationService = GeolocationService.getInstance();