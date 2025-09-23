import 'package:flutter/foundation.dart';
import '../services/firebase_service.dart';

class SafetyScoreController extends ChangeNotifier {
	final FirebaseService _firebaseService = FirebaseService();

	double? _safetyScore;
	bool _isLoading = false;
	String? _errorMessage;

	double? get safetyScore => _safetyScore;
	bool get isLoading => _isLoading;
	String? get errorMessage => _errorMessage;

	Future<void> fetchSafetyScore(String userId) async {
		_isLoading = true;
		_errorMessage = null;
		notifyListeners();
		try {
			_safetyScore = await _firebaseService.getSafetyScore(userId);
			_isLoading = false;
			notifyListeners();
		} catch (e) {
			_errorMessage = e.toString();
			_isLoading = false;
			notifyListeners();
		}
	}

	void reset() {
		_safetyScore = null;
		_isLoading = false;
		_errorMessage = null;
		notifyListeners();
	}
}