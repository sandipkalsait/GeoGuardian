import 'package:hive/hive.dart';

class OfflineQueueService {
  static const _boxName = 'offline_queue';

  Future<void> init() async {
    await Hive.openBox(_boxName);
  }

  Future<void> enqueueAlert(String id, Map<String, dynamic> payload) async {
    final box = Hive.box(_boxName);
    await box.put('alert_\$id', payload);
  }

  Future<Map<String, dynamic>?> dequeueAlert(String id) async {
    final box = Hive.box(_boxName);
    final payload = box.get('alert_\$id');
    if (payload != null) {
      await box.delete('alert_\$id');
    }
    return payload;
  }

  Future<List<Map>> pendingAlerts() async {
    final box = Hive.box(_boxName);
    return box.keys
        .where((k) => k.toString().startsWith('alert_'))
        .map((k) => box.get(k) as Map)
        .toList();
  }
}
