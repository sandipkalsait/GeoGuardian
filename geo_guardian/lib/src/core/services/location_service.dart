import 'package:geolocator/geolocator.dart';

class LocationService {
  Position? last;

  Future<Position?> getLastLocation() async {
    try {
      last = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.best);
      return last;
    } catch (e) {
      return last;
    }
  }

  void startHighFrequencyStreaming(Function(Map<String, dynamic>) callback) {
    Geolocator.getPositionStream(
      locationSettings: LocationSettings(accuracy: LocationAccuracy.best, distanceFilter: 5),
    ).listen((pos) {
      final payload = {
        'lat': pos.latitude,
        'lng': pos.longitude,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        'acc': pos.accuracy,
      };
      callback(payload);
    });
  }
}
