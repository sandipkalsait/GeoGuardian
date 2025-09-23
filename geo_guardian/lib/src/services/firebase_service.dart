import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../utils/constants.dart';
import '../models/emergency_alert_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserId => _auth.currentUser?.uid;

  // User Profile Operations
  Future<void> createUserProfile(String uid, Map<String, dynamic> data) async {
    try {
      await _firestore.collection(AppConstants.usersCollection).doc(uid).set({
        ...data,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw 'Failed to create user profile: $e';
    }
  }

  Future<Map<String, dynamic>?> getUserProfile(String uid) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(uid)
          .get();

      if (doc.exists && doc.data() != null) {
        return {...doc.data()!, 'id': doc.id};
      }
      return null;
    } catch (e) {
      throw 'Failed to get user profile: $e';
    }
  }

  Future<void> updateUserProfile(String uid, Map<String, dynamic> data) async {
    try {
      await _firestore.collection(AppConstants.usersCollection).doc(uid).update(
        {...data, 'updatedAt': FieldValue.serverTimestamp()},
      );
    } catch (e) {
      throw 'Failed to update user profile: $e';
    }
  }

  // Tourist ID Operations
  Future<String> createTouristId(Map<String, dynamic> data) async {
    try {
      final docRef = await _firestore
          .collection(AppConstants.touristIdsCollection)
          .add({...data, 'createdAt': FieldValue.serverTimestamp()});
      return docRef.id;
    } catch (e) {
      throw 'Failed to create tourist ID: $e';
    }
  }

  Future<Map<String, dynamic>?> getTouristIdByUserId(String userId) async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.touristIdsCollection)
          .where('userId', isEqualTo: userId)
          .where('isActive', isEqualTo: true)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        final doc = querySnapshot.docs.first;
        return {...doc.data(), 'id': doc.id};
      }
      return null;
    } catch (e) {
      throw 'Failed to get tourist ID: $e';
    }
  }

  Future<Map<String, dynamic>?> getTouristIdByDigitalId(
    String digitalId,
  ) async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.touristIdsCollection)
          .where('digitalId', isEqualTo: digitalId)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        final doc = querySnapshot.docs.first;
        return {...doc.data(), 'id': doc.id};
      }
      return null;
    } catch (e) {
      throw 'Failed to get tourist ID by digital ID: $e';
    }
  }

  Future<void> updateTouristId(
    String documentId,
    Map<String, dynamic> data,
  ) async {
    try {
      await _firestore
          .collection(AppConstants.touristIdsCollection)
          .doc(documentId)
          .update({...data, 'updatedAt': FieldValue.serverTimestamp()});
    } catch (e) {
      throw 'Failed to update tourist ID: $e';
    }
  }

  // Emergency Alert Operations
  Future<String> createEmergencyAlert(Map<String, dynamic> data) async {
    try {
      final docRef = await _firestore
          .collection(AppConstants.emergencyAlertsCollection)
          .add({...data, 'createdAt': FieldValue.serverTimestamp()});
      return docRef.id;
    } catch (e) {
      throw 'Failed to create emergency alert: $e';
    }
  }

  Future<List<EmergencyAlertModel>> getUserEmergencyAlerts(
    String userId,
  ) async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.emergencyAlertsCollection)
          .where('userId', isEqualTo: userId)
          .orderBy('alertTime', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => EmergencyAlertModel.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw 'Failed to load emergency alerts: $e';
    }
  }

  Future<void> updateEmergencyAlert(
    String documentId,
    Map<String, dynamic> data,
  ) async {
    try {
      await _firestore
          .collection(AppConstants.emergencyAlertsCollection)
          .doc(documentId)
          .update({...data, 'updatedAt': FieldValue.serverTimestamp()});
    } catch (e) {
      throw 'Failed to update emergency alert: $e';
    }
  }

  // Location Operations
  Future<String> createLocation(Map<String, dynamic> data) async {
    try {
      final docRef = await _firestore
          .collection(AppConstants.locationsCollection)
          .add({...data, 'createdAt': FieldValue.serverTimestamp()});
      return docRef.id;
    } catch (e) {
      throw 'Failed to create location: $e';
    }
  }

  Future<List<Map<String, dynamic>>> getUserLocations(String userId) async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.locationsCollection)
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => {...doc.data(), 'id': doc.id})
          .toList();
    } catch (e) {
      throw 'Failed to load locations: $e';
    }
  }

  // Safety Score Operations
  Future<String> createSafetyScore(Map<String, dynamic> data) async {
    try {
      final docRef = await _firestore
          .collection(AppConstants.safetyScoresCollection)
          .add({...data, 'createdAt': FieldValue.serverTimestamp()});
      return docRef.id;
    } catch (e) {
      throw 'Failed to create safety score: $e';
    }
  }

  Future<Map<String, dynamic>?> getLatestSafetyScore(String touristId) async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.safetyScoresCollection)
          .where('touristId', isEqualTo: touristId)
          .orderBy('calculatedAt', descending: true)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        final doc = querySnapshot.docs.first;
        return {...doc.data(), 'id': doc.id};
      }
      return null;
    } catch (e) {
      throw 'Failed to get safety score: $e';
    }
  }

  // Geofence Operations
  Future<String> createGeofence(Map<String, dynamic> data) async {
    try {
      final docRef = await _firestore
          .collection(AppConstants.geofencesCollection)
          .add({...data, 'createdAt': FieldValue.serverTimestamp()});
      return docRef.id;
    } catch (e) {
      throw 'Failed to create geofence: $e';
    }
  }

  Future<List<Map<String, dynamic>>> getActiveGeofences() async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.geofencesCollection)
          .where('isActive', isEqualTo: true)
          .get();

      return querySnapshot.docs
          .map((doc) => {...doc.data(), 'id': doc.id})
          .toList();
    } catch (e) {
      throw 'Failed to load geofences: $e';
    }
  }

  // Risk Zone Operations
  Future<List<Map<String, dynamic>>> getRiskZones() async {
    try {
      final querySnapshot = await _firestore
          .collection(AppConstants.riskZonesCollection)
          .where('isActive', isEqualTo: true)
          .get();

      return querySnapshot.docs
          .map((doc) => {...doc.data(), 'id': doc.id})
          .toList();
    } catch (e) {
      throw 'Failed to load risk zones: $e';
    }
  }

  // Real-time streams
  Stream<DocumentSnapshot> getUserProfileStream(String uid) {
    return _firestore
        .collection(AppConstants.usersCollection)
        .doc(uid)
        .snapshots();
  }

  Stream<QuerySnapshot> getEmergencyAlertsStream({
    String? userId,
    EmergencyStatus? status,
  }) {
    Query query = _firestore.collection(AppConstants.emergencyAlertsCollection);

    if (userId != null) {
      query = query.where('userId', isEqualTo: userId);
    }

    if (status != null) {
      query = query.where('status', isEqualTo: status.toString());
    }

    return query.orderBy('alertTime', descending: true).snapshots();
  }

  Future getGeofences() async {}

  Future<double?> getSafetyScore(String userId) async {
    return null;
  }
}
