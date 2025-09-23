import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';
import '../utils/constants.dart';

class LocationController extends ChangeNotifier {
	final LocationService _locationService = LocationService();

	bool _isLoading = false;
	String? _errorMessage;
	Position? _currentPosition;
	String? _currentAddress;

	bool get isLoading => _isLoading;
	String? get errorMessage => _errorMessage;
	Position? get currentPosition => _currentPosition;
	String? get currentAddress => _currentAddress;

	Future<void> updateLocation() async {
		_isLoading = true;
		_errorMessage = null;
		notifyListeners();
		try {
			final hasPermission = await _locationService.handleLocationPermission();
			if (!hasPermission) throw AppConstants.locationPermissionDenied;
			_currentPosition = await _locationService.getCurrentPosition();
			_currentAddress = await _locationService.getAddressFromLatLng(
				_currentPosition!.latitude, _currentPosition!.longitude);
			_isLoading = false;
			notifyListeners();
		} catch (e) {
			_errorMessage = e.toString();
			_isLoading = false;
			notifyListeners();
		}
	}

	void reset() {
		_isLoading = false;
		_errorMessage = null;
		_currentPosition = null;
		_currentAddress = null;
		notifyListeners();
	}
}