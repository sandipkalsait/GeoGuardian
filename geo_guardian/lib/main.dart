import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:logger/logger.dart';
import 'firebase_options.dart';

// App and controllers
import 'src/app.dart';
import 'src/controllers/auth_controller.dart';
import 'src/controllers/tourist_id_controller.dart';
import 'src/controllers/emergency_controller.dart';
import 'src/controllers/location_controller.dart';
import 'src/controllers/safety_score_controller.dart';
import 'src/controllers/geofence_controller.dart';

// Services
import 'src/services/notification_service.dart';
import 'src/services/encryption_service.dart';

/// Global logger
final Logger logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0, // No stack trace by default
    colors: true,
    printTime: true,
  ),
);

/// Background FCM handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  logger.i("Handling background message: ${message.messageId}");
  await NotificationService.instance.showNotificationFromMessage(message);
}

/// Request all critical permissions
Future<void> requestAllPermissions() async {
  Map<Permission, PermissionStatus> statuses = await [
    Permission.location,
    Permission.camera,
    Permission.microphone,
    Permission.storage,
    Permission.sms,
    Permission.phone,
  ].request();

  statuses.forEach((permission, status) {
    if (status.isDenied) {
      logger.w('Permission denied: $permission');
    } else if (status.isPermanentlyDenied) {
      logger.e('Permission permanently denied: $permission. Opening settings...');
      openAppSettings();
    } else {
      logger.i('Permission granted: $permission');
    }
  });
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase initialization
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  logger.i("Firebase initialized");

  // Firebase App Check
  await FirebaseAppCheck.instance.activate(
    androidProvider: AndroidProvider.playIntegrity,
  );
  logger.i("Firebase App Check activated");

  // Request necessary permissions
  await requestAllPermissions();

  // Background messaging
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  logger.i("Background FCM handler registered");

  // Initialize services
  await EncryptionService.instance.initialize();
  logger.i("EncryptionService initialized");

  await NotificationService.instance.initialize();
  logger.i("NotificationService initialized");

  // Configure Android notification channels
  await NotificationService.instance.configureNotificationChannels();
  logger.i("Notification channels configured");

  runApp(const SmartTouristSafetyApp());
}

class SmartTouristSafetyApp extends StatelessWidget {
  const SmartTouristSafetyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()..init()),
        ChangeNotifierProvider(create: (_) => TouristIdController()),
        ChangeNotifierProvider(create: (_) => EmergencyController()),
        ChangeNotifierProvider(create: (_) => LocationController()),
        ChangeNotifierProvider(create: (_) => SafetyScoreController()),
        ChangeNotifierProvider(create: (_) => GeofenceController()),
      ],
      child: Consumer<AuthController>(
        builder: (context, authController, child) {
          return const MyApp();
        },
      ),
    );
  }
}
