import 'package:flutter/foundation.dart';
import '../services/location_service.dart';
import '../services/firebase_service.dart';

class GeofenceController extends ChangeNotifier {
	final LocationService _locationService = LocationService();
	final FirebaseService _firebaseService = FirebaseService();

	bool _isInsideGeofence = false;
	String? _currentGeofenceId;
	String? get currentGeofenceId => _currentGeofenceId;
	bool get isInsideGeofence => _isInsideGeofence;

	Future<void> checkGeofence(double latitude, double longitude) async {
		// Example: Query geofences from Firestore and check if user is inside any
		try {
			final geofences = await _firebaseService.getGeofences();
			for (final geofence in geofences) {
				if (_isPointInsideGeofence(latitude, longitude, geofence)) {
					_isInsideGeofence = true;
					_currentGeofenceId = geofence['id'];
					notifyListeners();
					return;
				}
			}
			_isInsideGeofence = false;
			_currentGeofenceId = null;
			notifyListeners();
		} catch (e) {
			// Handle error
		}
	}

	bool _isPointInsideGeofence(double lat, double lng, Map<String, dynamic> geofence) {
		// Simple circular geofence check
		final double centerLat = geofence['centerLat'];
		final double centerLng = geofence['centerLng'];
		final double radius = geofence['radius']; // meters
		final double distance = _locationService.calculateDistance(lat, lng, centerLat, centerLng);
		return distance <= radius;
	}

	void reset() {
		_isInsideGeofence = false;
		_currentGeofenceId = null;
		notifyListeners();
	}
}