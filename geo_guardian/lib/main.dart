import 'package:flutter/material.dart';
import 'src/core/services/firebase_service.dart';
import 'src/core/services/offline_queue_service.dart';
import 'src/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseService.init();
  final queue = OfflineQueueService();
  await queue.init();
  runApp(GeoGuardianApp());
}
