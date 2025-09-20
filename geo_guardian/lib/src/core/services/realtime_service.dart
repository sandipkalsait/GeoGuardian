import 'package:firebase_database/firebase_database.dart';

class RealtimeService {
  final db = FirebaseDatabase.instance.ref();

  DatabaseReference alertStreamRef(String alertId) => db.child('alerts_stream/\$alertId/locations');

  Future<void> pushLocation(String alertId, Map<String, dynamic> location) async {
    final ref = alertStreamRef(alertId).push();
    await ref.set(location);
  }

  Stream<DatabaseEvent> listenToAlertStream(String alertId) {
    return alertStreamRef(alertId).onChildAdded;
  }
}
