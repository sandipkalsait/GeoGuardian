import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class FirebaseService {
  static Future<void> init() async {
    await Firebase.initializeApp();
    // Additional config (Crashlytics, Messaging) to be added per-environment
    if (!kIsWeb) {
      // Platform-specific initializations
    }
  }
}
