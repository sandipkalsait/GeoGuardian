import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../utils/constants.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  // Check and request location permissions
  Future<bool> handleLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw AppConstants.locationServiceDisabled;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw AppConstants.locationPermissionDenied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw 'Location permissions are permanently denied. Please enable them in device settings.';
    }

    return true;
  }

  // Get current position
  Future<Position?> getCurrentPosition({
    Duration? timeout,
    LocationAccuracy accuracy = LocationAccuracy.high,
  }) async {
    try {
      await handleLocationPermission();
      
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: accuracy,
        timeLimit: timeout ?? const Duration(seconds: 15),
      );
    } catch (e) {
      throw 'Failed to get current location: $e';
    }
  }

  // Get address from coordinates
  Future<String> getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      
      if (placemarks.isNotEmpty) {
        final Placemark place = placemarks[0];
        
        final List<String> addressComponents = [];
        
        if (place.street?.isNotEmpty == true) {
          addressComponents.add(place.street!);
        }
        if (place.locality?.isNotEmpty == true) {
          addressComponents.add(place.locality!);
        }
        if (place.administrativeArea?.isNotEmpty == true) {
          addressComponents.add(place.administrativeArea!);
        }
        if (place.country?.isNotEmpty == true) {
          addressComponents.add(place.country!);
        }
        
        if (addressComponents.isNotEmpty) {
          return addressComponents.join(', ');
        }
      }
      
      return 'Latitude: ${latitude.toStringAsFixed(6)}, Longitude: ${longitude.toStringAsFixed(6)}';
    } catch (e) {
      return 'Latitude: ${latitude.toStringAsFixed(6)}, Longitude: ${longitude.toStringAsFixed(6)}';
    }
  }

  // Get comprehensive location data
  Future<Map<String, dynamic>?> getCurrentLocationData() async {
    try {
      final position = await getCurrentPosition();
      if (position == null) return null;

      final address = await getAddressFromCoordinates(position.latitude, position.longitude);
      final batteryLevel = await _getBatteryLevel();
      final networkInfo = await _getNetworkInfo();

      return {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'altitude': position.altitude,
        'speed': position.speed,
        'timestamp': position.timestamp.toIso8601String() ?? DateTime.now().toIso8601String(),
        'address': address,
        'batteryLevel': batteryLevel,
        'networkInfo': networkInfo,
      };
    } catch (e) {
      return null;
    }
  }

  // Calculate distance between two points
  double calculateDistance(
    double startLatitude,
    double startLongitude,
    double endLatitude,
    double endLongitude,
  ) {
    return Geolocator.distanceBetween(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    );
  }

  // Get location stream for real-time tracking
  Stream<Position> getPositionStream({
    LocationAccuracy accuracy = LocationAccuracy.high,
    int distanceFilter = 10,
  }) {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    return Geolocator.getPositionStream(locationSettings: locationSettings);
  }

  // Check if coordinates are in a geofence
  bool isInGeofence({
    required double latitude,
    required double longitude,
    required double centerLatitude,
    required double centerLongitude,
    required double radiusInMeters,
  }) {
    final distance = calculateDistance(
      latitude,
      longitude,
      centerLatitude,
      centerLongitude,
    );
    return distance <= radiusInMeters;
  }

  // Get last known position
  Future<Position?> getLastKnownPosition() async {
    try {
      await handleLocationPermission();
      return await Geolocator.getLastKnownPosition();
    } catch (e) {
      return null;
    }
  }

  // Private helper methods
  Future<double> _getBatteryLevel() async {
    try {
      // This is a placeholder - in a real app you'd use battery_plus package
      // For now, simulate battery level
      return 85.0;
    } catch (e) {
      return 100.0;
    }
  }

  Future<Map<String, dynamic>> _getNetworkInfo() async {
    try {
      final connectivity = Connectivity();
      final connectivityResult = await connectivity.checkConnectivity();
      
      String networkType = 'unknown';
      String quality = 'unknown';
      
      if (connectivityResult.contains(ConnectivityResult.wifi)) {
        networkType = 'wifi';
        quality = 'excellent';
      } else if (connectivityResult.contains(ConnectivityResult.mobile)) {
        networkType = 'mobile';
        quality = 'good';
      } else if (connectivityResult.contains(ConnectivityResult.none)) {
        networkType = 'none';
        quality = 'poor';
      }

      return {
        'type': networkType,
        'quality': quality,
        'timestamp': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      return {
        'type': 'unknown',
        'quality': 'unknown',
        'timestamp': DateTime.now().toIso8601String(),
      };
    }
  }

  // Format distance for display
  String formatDistance(double distanceInMeters) {
    if (distanceInMeters < 1000) {
      return '${distanceInMeters.round()}m';
    } else if (distanceInMeters < 10000) {
      return '${(distanceInMeters / 1000).toStringAsFixed(1)}km';
    } else {
      return '${(distanceInMeters / 1000).round()}km';
    }
  }

  Future<String?> getAddressFromLatLng(double latitude, double longitude) async {}
}