import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';

final Logger logger = Logger();

class NotificationService {
  NotificationService._internal();
  static final NotificationService instance = NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
  FlutterLocalNotificationsPlugin();

  /// Initialize notifications
  Future<void> initialize() async {
    try {
      // Request permission for notifications
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      logger.i('Notification permission status: ${settings.authorizationStatus}');

      // Initialize local notifications
      const AndroidInitializationSettings androidSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();

      const InitializationSettings initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _flutterLocalNotificationsPlugin.initialize(initSettings,
          onDidReceiveNotificationResponse: (payload) {
            logger.i('Notification clicked: $payload');
          });

      // Configure Android notification channels
      await configureNotificationChannels();

      // Get FCM token
      final token = await _messaging.getToken();
      logger.i('FCM Token: $token');

      // Foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Notification taps when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundNotificationTap);

      // Notification tap when app terminated
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleBackgroundNotificationTap(initialMessage);
      }

    } catch (e, st) {
      logger.e('Error initializing notifications', error: e, stackTrace: st);
    }
  }

  Future<void> configureNotificationChannels() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'default_channel', // id
      'Default Notifications', // name
      description: 'General notifications',
      importance: Importance.high,
    );

    await _flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    logger.i("Notification channels configured");
  }

  Future<void> showNotificationFromMessage(RemoteMessage message) async {
    if (message.notification == null) return;

    await _flutterLocalNotificationsPlugin.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'default_channel',
          'Default Notifications',
          channelDescription: 'General notifications',
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
    );

    logger.i("Notification displayed from message: ${message.messageId}");
  }

  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e, st) {
      logger.e('Error getting FCM token', error: e, stackTrace: st);
      return null;
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      logger.i('Subscribed to topic: $topic');
    } catch (e, st) {
      logger.e('Error subscribing to topic $topic', error: e, stackTrace: st);
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      logger.i('Unsubscribed from topic: $topic');
    } catch (e, st) {
      logger.e('Error unsubscribing from topic $topic', error: e, stackTrace: st);
    }
  }

  // Foreground message handler
  void _handleForegroundMessage(RemoteMessage message) async {
    logger.i('Foreground message received: ${message.messageId}');
    await showNotificationFromMessage(message);

    if (message.data.isNotEmpty) {
      _handleNotificationData(message.data);
    }
  }

  void _handleBackgroundNotificationTap(RemoteMessage message) {
    logger.i('Notification opened app: ${message.messageId}');
    if (message.data.isNotEmpty) {
      _handleNotificationData(message.data);
    }
  }

  void _handleNotificationData(Map<String, dynamic> data) {
    final type = data['type'];
    switch (type) {
      case 'emergency':
        logger.i('Emergency notification: $data');
        break;
      case 'geofence':
        logger.i('Geofence notification: $data');
        break;
      case 'safety_update':
        logger.i('Safety update notification: $data');
        break;
      default:
        logger.w('Unknown notification type: $type');
    }
  }

  Future<void> sendNotification({
    required String title,
    required String body,
    required Map<String, String> data,
    required String topic,
  }) async {
    try {
      // Example: Using Firebase Cloud Messaging HTTP v1 API via your server
      // Replace this URL with your backend endpoint that sends FCM messages
      // final uri = Uri.parse('https://your-backend.com/sendNotification');

      // final payload = {
      //   "title": title,
      //   "body": body,
      //   "topic": topic,
      //   "data": data,
      // };
      print('Sending notification:');
      print('Title: $title');
      print('Body: $body');
      print('Topic: $topic');
      // print('UserId: $userId');
      print('Data: $data');

      // final response = await http.post(
      //   uri,
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode(payload),
      // );

      // if (response.statusCode == 200) {
      //   logger.i('Notification sent successfully to topic $topic');
      // } else {
      //   logger.w(
      //       'Failed to send notification. Status code: ${response.statusCode}, body: ${response.body}');
      // }
    } catch (e, st) {
      logger.e('Error sending notification to topic $topic', error: e, stackTrace: st);
    }
  }
}
