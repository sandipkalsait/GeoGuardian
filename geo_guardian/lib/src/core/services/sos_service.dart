import 'package:uuid/uuid.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'realtime_service.dart';
import 'offline_queue_service.dart';
import 'location_service.dart';

class SosService {
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final RealtimeService realtime;
  final OfflineQueueService queue;
  final LocationService locationService;

  SosService(this.realtime, this.queue, this.locationService);

  Future<String> createPanic() async {
    final alertId = Uuid().v4();
    final now = Timestamp.now();

    final doc = {
      'alertId': alertId,
      'digitalIdHash': await _getDigitalIdHash(),
      'createdAt': now,
      'status': 'pending',
      'lastLocation': await locationService.getLastLocation()?.toString(),
    };

    await queue.enqueueAlert(alertId, doc);

    try {
      await firestore.collection('alerts').doc(alertId).set(doc);
      locationService.startHighFrequencyStreaming((loc) => realtime.pushLocation(alertId, loc));
    } catch (e) {
      // leave in queue
    }

    return alertId;
  }

  Future<String> _getDigitalIdHash() async {
    return 'digital_hash_placeholder';
  }
}
