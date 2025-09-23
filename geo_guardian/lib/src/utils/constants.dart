class AppConstants {
  // App Info
  static const String appName = 'Smart Tourist Safety';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Comprehensive Tourist Safety Monitoring System';
  
  // Firebase Collections
  static const String usersCollection = 'users';
  static const String touristIdsCollection = 'tourist_ids';
  static const String locationsCollection = 'locations';
  static const String geofencesCollection = 'geofences';
  static const String emergencyAlertsCollection = 'emergency_alerts';
  static const String safetyScoresCollection = 'safety_scores';
  static const String trackingDataCollection = 'tracking_data';
  static const String riskZonesCollection = 'risk_zones';
  static const String anomaliesCollection = 'anomalies';
  static const String efirsCollection = 'efirs';
  
  // Digital ID Constants
  static const String digitalIdPrefix = 'TID';
  static const int digitalIdLength = 12;
  static const int maxTripDuration = 365; // days
  
  // Safety Score Thresholds
  static const double safetyScoreExcellent = 90.0;
  static const double safetyScoreGood = 70.0;
  static const double safetyScoreFair = 50.0;
  static const double safetyScorePoor = 30.0;
  
  // Risk Levels
  static const String riskLevelLow = 'low';
  static const String riskLevelMedium = 'medium';
  static const String riskLevelHigh = 'high';
  static const String riskLevelCritical = 'critical';
  
  // Emergency Numbers
  static const String emergencyNumber = '112';
  static const String policeNumber = '100';
  static const String ambulanceNumber = '108';
  static const String fireServiceNumber = '101';
  static const String touristHelplineNumber = '1363';
  
  // Geofencing
  static const double defaultGeofenceRadius = 500.0; // meters
  static const double criticalZoneRadius = 100.0; // meters
  
  // Location Tracking
  static const int locationUpdateInterval = 30; // seconds
  static const int highRiskUpdateInterval = 10; // seconds
  
  // Anomaly Detection
  static const int inactivityThreshold = 30; // minutes
  static const double speedAnomalyThreshold = 100.0; // kmph
  static const double routeDeviationThreshold = 1000.0; // meters
  
  // Panic Button
  static const int panicButtonHoldTime = 3; // seconds
  static const int maxEmergencyContacts = 5;
  
  // Languages (matching your existing l10n structure)
  static const Map<String, String> supportedLanguages = {
    'en': 'English',
    'hi': 'हिंदी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'bn': 'বাংলা',
    'mr': 'मराठी',
    'gu': 'ગુજરાતી',
    'kn': 'ಕನ್ನಡ',
    'ml': 'മലയാളം',
    'pa': 'ਪੰਜਾਬੀ',
    'or': 'ଓଡ଼ିଆ',
  };
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxNameLength = 50;
  static const int minPhoneLength = 10;
  
  // Document Types
  static const List<String> acceptedDocuments = [
    'aadhaar',
    'passport',
    'voter_id',
    'driving_license',
    'pan_card',
  ];
  
  // Error Messages
  static const String networkError = 'Network error. Please check your connection.';
  static const String unknownError = 'An unexpected error occurred. Please try again.';
  static const String invalidEmail = 'Please enter a valid email address.';
  static const String passwordTooShort = 'Password must be at least 8 characters long.';
  static const String fieldsRequired = 'Please fill in all required fields.';
  static const String locationPermissionDenied = 'Location permission is required for safety monitoring.';
  static const String locationServiceDisabled = 'Location services are disabled. Please enable them.';
  static const String invalidDigitalId = 'Invalid or expired digital tourist ID.';
  
  // Success Messages
  static const String passwordResetSent = 'Password reset email sent successfully.';
  static const String accountCreated = 'Account created successfully!';
  static const String loginSuccess = 'Login successful!';
  static const String digitalIdGenerated = 'Digital Tourist ID generated successfully.';
  static const String emergencyAlertSent = 'Emergency alert sent to authorities and contacts.';
  
  // Push Notification Topics
  static const String emergencyTopic = 'emergency_alerts';
  static const String geofenceTopic = 'geofence_alerts';
  static const String safetyTopic = 'safety_updates';
  static const String policeTopic = 'police_notifications';
  
  // Default Coordinates (India Gate, New Delhi)
  static const double defaultLatitude = 28.6129;
  static const double defaultLongitude = 77.2295;
  
  // UI Constants
  static const double cardBorderRadius = 16.0;
  static const double buttonBorderRadius = 12.0;
  static const double avatarRadius = 25.0;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Local Storage Keys
  static const String userPrefsKey = 'user_preferences';
  static const String languageKey = 'selected_language';
  static const String onboardingKey = 'onboarding_complete';
  static const String trackingKey = 'tracking_enabled';
  static const String notificationsKey = 'notifications_enabled';
  
  // Tourist Categories
  static const List<String> touristCategories = [
    'domestic',
    'international',
    'business',
    'leisure',
    'pilgrimage',
    'medical',
    'adventure',
  ];
}