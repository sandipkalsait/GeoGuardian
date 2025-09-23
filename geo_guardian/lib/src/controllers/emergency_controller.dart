import 'dart:async';
import '../controllers/base_controller.dart';
import '../models/emergency_alert_model.dart';
import '../services/firebase_service.dart';
import '../services/location_service.dart';
import '../services/notification_service.dart';
import '../utils/constants.dart';

class EmergencyController extends BaseController {
  final FirebaseService _firebaseService = FirebaseService();
  final LocationService _locationService = LocationService();
  final NotificationService _notificationService = NotificationService.instance;

  List<EmergencyAlertModel> _activeAlerts = [];
  List<EmergencyAlertModel> _allAlerts = [];
  EmergencyAlertModel? _currentEmergency;

  List<EmergencyAlertModel> get activeAlerts => _activeAlerts;
  List<EmergencyAlertModel> get allAlerts => _allAlerts;
  EmergencyAlertModel? get currentEmergency => _currentEmergency;
  bool get hasActiveEmergency => _currentEmergency?.isActive ?? false;

  // Initialize controller
  Future<void> init(String userId) async {
    await executeWithErrorHandling(() async {
      await _loadEmergencyAlerts(userId);
    });
  }

  // Trigger panic button emergency
  Future<bool> triggerPanicButton({
    String? customMessage,
    EmergencyType type = EmergencyType.panic,
    AlertSeverity severity = AlertSeverity.critical,
  }) async {
    return await executeBoolOperation(() async {
      // Check if there's already an active emergency
      if (hasActiveEmergency) {
        throw Exception('Emergency is already active');
      }

      // Get current location
      final locationData = await _locationService.getCurrentLocationData();
      if (locationData == null) {
        throw Exception('Unable to determine current location for emergency alert');
      }

      // Create emergency alert
      final alertId = _generateAlertId();
      final alert = EmergencyAlertModel(
        alertId: alertId,
        touristId: 'TID123', // This should come from tourist ID controller
        userId: _firebaseService.currentUserId ?? '',
        type: type,
        severity: severity,
        title: _getEmergencyTitle(type),
        description: customMessage ?? _getDefaultEmergencyMessage(type),
        latitude: locationData['latitude'],
        longitude: locationData['longitude'],
        address: locationData['address'],
        alertTime: DateTime.now(),
        metadata: {
          'triggeredBy': 'panic_button',
          'batteryLevel': locationData['batteryLevel'],
          'networkInfo': locationData['networkInfo'],
        },
      );

      // Save to Firestore
      await _firebaseService.createEmergencyAlert(alert.toFirestore());
      final savedAlert = alert.copyWith();
      
      // Notify emergency contacts and authorities
      await _notifyEmergencyContacts(savedAlert);
      await _notifyAuthorities(savedAlert);
      
      // Send push notifications
      await _sendEmergencyNotifications(savedAlert);
      
      _currentEmergency = savedAlert;
      _activeAlerts.insert(0, savedAlert);
      _allAlerts.insert(0, savedAlert);
      notifyListeners();
      
      return true;
    },
    successMessage: AppConstants.emergencyAlertSent,
    errorMessage: 'Failed to send emergency alert.');
  }

  // Update alert status
  Future<bool> updateAlertStatus({
    required String alertId,
    required EmergencyStatus status,
    String? assignedOfficerId,
    String? updateNote,
  }) async {
    return await executeBoolOperation(() async {
      final alertIndex = _allAlerts.indexWhere((alert) => alert.alertId == alertId);
      if (alertIndex == -1) {
        throw Exception('Emergency alert not found');
      }

      final currentAlert = _allAlerts[alertIndex];
      final now = DateTime.now();
      
      DateTime? responseTime = currentAlert.responseTime;
      DateTime? resolutionTime = currentAlert.resolutionTime;
      
      // Set response time if acknowledging for first time
      if (status == EmergencyStatus.acknowledged && responseTime == null) {
        responseTime = now;
      }
      
      // Set resolution time if resolving
      if (status == EmergencyStatus.resolved || status == EmergencyStatus.cancelled) {
        resolutionTime = now;
      }

      final updatedAlert = currentAlert.copyWith(
        status: status,
        assignedOfficerId: assignedOfficerId,
        responseTime: responseTime,
        resolutionTime: resolutionTime,
      );

      await _firebaseService.updateEmergencyAlert(currentAlert.id!, updatedAlert.toFirestore());
      
      _allAlerts[alertIndex] = updatedAlert;
      
      // Update active alerts list
      if (updatedAlert.isResolved) {
        _activeAlerts.removeWhere((alert) => alert.alertId == alertId);
        
        if (_currentEmergency?.alertId == alertId) {
          _currentEmergency = null;
        }
      } else {
        final activeIndex = _activeAlerts.indexWhere((alert) => alert.alertId == alertId);
        if (activeIndex != -1) {
          _activeAlerts[activeIndex] = updatedAlert;
        }
      }
      
      notifyListeners();
      
      return true;
    },
    successMessage: 'Alert status updated successfully.',
    errorMessage: 'Failed to update alert status.');
  }

  // Cancel current emergency
  Future<bool> cancelEmergency({String? reason}) async {
    if (_currentEmergency == null) return false;

    return await updateAlertStatus(
      alertId: _currentEmergency!.alertId,
      status: EmergencyStatus.cancelled,
      updateNote: reason ?? 'Emergency cancelled by user',
    );
  }

  // Private helper methods
  Future<void> _loadEmergencyAlerts(String userId) async {
    try {
      _allAlerts = await _firebaseService.getUserEmergencyAlerts(userId);
      _activeAlerts = _allAlerts.where((alert) => alert.needsResponse).toList();
      
      _currentEmergency = _activeAlerts.isNotEmpty ? _activeAlerts.first : null;
      
      notifyListeners();
    } catch (e) {
      setError('Failed to load emergency alerts: $e');
    }
  }

  String _generateAlertId() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return 'EA${timestamp.toString().substring(8)}';
  }

  String _getEmergencyTitle(EmergencyType type) {
    switch (type) {
      case EmergencyType.panic:
        return 'Panic Alert';
      case EmergencyType.medical:
        return 'Medical Emergency';
      case EmergencyType.accident:
        return 'Accident Report';
      case EmergencyType.theft:
        return 'Theft/Robbery Alert';
      case EmergencyType.harassment:
        return 'Harassment Report';
      case EmergencyType.lost:
        return 'Lost Tourist';
      default:
        return 'Emergency Alert';
    }
  }

  String _getDefaultEmergencyMessage(EmergencyType type) {
    switch (type) {
      case EmergencyType.panic:
        return 'Tourist has triggered panic button and needs immediate assistance.';
      case EmergencyType.medical:
        return 'Medical emergency reported. Immediate medical assistance required.';
      case EmergencyType.accident:
        return 'Accident reported. Emergency response needed.';
      default:
        return 'Emergency situation reported. Assistance required.';
    }
  }

  Future<void> _notifyEmergencyContacts(EmergencyAlertModel alert) async {
    // Implementation for notifying emergency contacts
    try {
      // This would integrate with SMS/call services
      print('Notifying emergency contacts for alert: ${alert.alertId}');
    } catch (e) {
      print('Failed to notify emergency contacts: $e');
    }
  }

  Future<void> _notifyAuthorities(EmergencyAlertModel alert) async {
    try {
      // This would notify police/emergency services
      print('Notifying authorities for alert: ${alert.alertId}');
    } catch (e) {
      print('Failed to notify authorities: $e');
    }
  }

  Future<void> _sendEmergencyNotifications(EmergencyAlertModel alert) async {
    try {
      await _notificationService.sendNotification(
        title: alert.title,
        body: alert.description,
        data: {
          'alertId': alert.alertId,
          'type': 'emergency',
          'severity': alert.severity.toString(),
        },
        topic: AppConstants.emergencyTopic,
      );
    } catch (e) {
      print('Failed to send emergency notification: $e');
    }
  }

}