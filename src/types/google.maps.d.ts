declare namespace google.maps {
  class Geocoder {
    geocode(
      request: {
        address?: string;
        location?: { lat: number; lng: number };
      },
      callback: (
        results: GeocoderResult[],
        status: GeocoderStatus
      ) => void
    ): void;
  }

  namespace places {
    class PlacesService {
      constructor(attrContainer: Element | Map);
      nearbySearch(
        request: {
          location: { lat: number; lng: number };
          radius?: number;
          type?: string;
          keyword?: string;
        },
        callback: (
          results: PlaceResult[],
          status: PlacesServiceStatus,
          pagination: { hasNextPage: boolean; nextPage: () => void }
        ) => void
      ): void;
    }

    interface PlaceResult {
      place_id: string;
      name: string;
      formatted_address: string;
      vicinity?: string;
      types?: string[];
      rating: number;
      photos?: PhotoResult[];
      geometry?: {
        location: {
          lat: () => number;
          lng: () => number;
        };
      };
    }

    interface PhotoResult {
      getUrl(): string;
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }
  }

  interface GeocoderResult {
    geometry: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
  }

  enum GeocoderStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    INVALID_REQUEST = 'INVALID_REQUEST',
  }
}