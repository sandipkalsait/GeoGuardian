import '../controllers/base_controller.dart';
import '../models/tourist_id_model.dart';
import '../services/firebase_service.dart';
import '../utils/constants.dart';

class TouristIdController extends BaseController {
  final FirebaseService _firebaseService = FirebaseService();

  TouristIdModel? _touristId;
  TouristIdModel? get touristId => _touristId;
  bool get hasValidDigitalId => _touristId?.isCurrentlyValid ?? false;

  // Initialize controller
  Future<void> init(String userId) async {
    await executeWithErrorHandling(() async {
      await _loadTouristId(userId);
    });
  }

  // Generate new digital tourist ID
  Future<bool> generateDigitalId({
    required String userId,
    required String fullName,
    required String nationality,
    required String documentType,
    required String documentNumber,
    required String phoneNumber,
    required String email,
    required List<String> emergencyContacts,
    required Map<String, dynamic> itinerary,
    required DateTime tripStartDate,
    required DateTime tripEndDate,
  }) async {
    return await executeBoolOperation(() async {
      // Generate unique digital ID
      final digitalId = TouristIdModel.generateDigitalId(userId);
      
      // Generate QR code data
      final qrCodeData = _generateQrCodeData(digitalId, fullName, nationality);
      
      // Create tourist ID model
      final touristIdModel = TouristIdModel(
        digitalId: digitalId,
        userId: userId,
        fullName: fullName,
        nationality: nationality,
        documentType: documentType,
        documentNumber: documentNumber,
        phoneNumber: phoneNumber,
        email: email,
        emergencyContacts: emergencyContacts,
        itinerary: itinerary,
        tripStartDate: tripStartDate,
        tripEndDate: tripEndDate,
        qrCodeData: qrCodeData,
        kycData: {
          'documentType': documentType,
          'verificationDate': DateTime.now().toIso8601String(),
          'verificationStatus': 'pending',
        },
        blockchainHash: '', // Will be generated after save
      );
      
      // Save to Firestore
      final savedId = await _firebaseService.createTouristId(touristIdModel.toFirestore());
      
      // Generate blockchain hash and update
      final updatedModel = touristIdModel.copyWith();
      final blockchainHash = updatedModel.generateBlockchainHash();
      
      await _firebaseService.updateTouristId(savedId, {
        'blockchainHash': blockchainHash,
      });
      
      // Load the complete model
      await _loadTouristId(userId);
      
      return true;
    }, 
    successMessage: AppConstants.digitalIdGenerated,
    errorMessage: 'Failed to generate digital tourist ID.');
  }

  // Verify digital ID
  Future<bool> verifyDigitalId(String digitalId) async {
    return await executeBoolOperation(() async {
      // Verify format
      if (!RegExp(r'^TID[A-F0-9]{9}$').hasMatch(digitalId)) {
        throw Exception('Invalid digital ID format');
      }
      
      // Check in Firestore
      final touristIdData = await _firebaseService.getTouristIdByDigitalId(digitalId);
      if (touristIdData == null) {
        throw Exception('Digital ID not found');
      }
      
      // Verify blockchain hash (simulated)
      final touristId = TouristIdModel.fromMap(touristIdData, touristIdData['id']);
      final expectedHash = touristId.generateBlockchainHash();
      
      if (touristId.blockchainHash != expectedHash) {
        throw Exception('Blockchain verification failed');
      }
      
      return touristId.isCurrentlyValid;
    },
    successMessage: 'Digital ID verified successfully.',
    errorMessage: 'Digital ID verification failed.');
  }

  // Update tourist ID
  Future<bool> updateTouristId({
    String? fullName,
    String? nationality,
    String? phoneNumber,
    String? email,
    List<String>? emergencyContacts,
    Map<String, dynamic>? itinerary,
    DateTime? tripStartDate,
    DateTime? tripEndDate,
  }) async {
    if (_touristId == null) return false;

    return await executeBoolOperation(() async {
      final updatedModel = _touristId!.copyWith(
        fullName: fullName,
        nationality: nationality,
        phoneNumber: phoneNumber,
        email: email,
        emergencyContacts: emergencyContacts,
        itinerary: itinerary,
        tripStartDate: tripStartDate,
        tripEndDate: tripEndDate,
      );
      
      await _firebaseService.updateTouristId(_touristId!.id!, {
        ...updatedModel.toMap(),
        'blockchainHash': updatedModel.generateBlockchainHash(),
      });
      
      _touristId = updatedModel;
      notifyListeners();
      
      return true;
    },
    successMessage: 'Tourist ID updated successfully.',
    errorMessage: 'Failed to update tourist ID.');
  }

  // Load tourist ID from Firestore
  Future<void> _loadTouristId(String userId) async {

    try {
      final touristIdData = await _firebaseService.getTouristIdByUserId(userId);
      if (touristIdData != null) {
        _touristId = TouristIdModel.fromMap(touristIdData, touristIdData['id']);
        notifyListeners();
      }
    } catch (e) {
      print('No tourist ID found for user: $userId');
    }
  }

  // Generate QR code data
  String _generateQrCodeData(String digitalId, String fullName, String nationality) {
    final data = {
      'id': digitalId,
      'name': fullName,
      'nationality': nationality,
      'issued': DateTime.now().toIso8601String(),
      'app': AppConstants.appName,
    };
    
    return data.entries.map((e) => '${e.key}:${e.value}').join('|');
  }

}