import 'base_model.dart';
import 'package:crypto/crypto.dart';

class TouristIdModel extends BaseModel {
  final String digitalId;
  final String userId;
  final String fullName;
  final String nationality;
  final String documentType;
  final String documentNumber;
  final String phoneNumber;
  final String email;
  final List<String> emergencyContacts;
  final Map<String, dynamic> itinerary;
  final DateTime tripStartDate;
  final DateTime tripEndDate;
  final bool isActive;
  final bool isVerified;
  final String qrCodeData;
  final Map<String, dynamic> kycData;
  final String blockchainHash;

  TouristIdModel({
    String? id,
    DateTime? createdAt,
    DateTime? updatedAt,
    required this.digitalId,
    required this.userId,
    required this.fullName,
    required this.nationality,
    required this.documentType,
    required this.documentNumber,
    required this.phoneNumber,
    required this.email,
    required this.emergencyContacts,
    required this.itinerary,
    required this.tripStartDate,
    required this.tripEndDate,
    this.isActive = true,
    this.isVerified = false,
    required this.qrCodeData,
    required this.kycData,
    required this.blockchainHash,
  }) : super(id: id, createdAt: createdAt, updatedAt: updatedAt);

  static TouristIdModel fromMap(Map<String, dynamic> map, String documentId) {
    return TouristIdModel(
      id: documentId,
      digitalId: map['digitalId'] ?? '',
      userId: map['userId'] ?? '',
      fullName: map['fullName'] ?? '',
      nationality: map['nationality'] ?? '',
      documentType: map['documentType'] ?? '',
      documentNumber: map['documentNumber'] ?? '',
      phoneNumber: map['phoneNumber'] ?? '',
      email: map['email'] ?? '',
      emergencyContacts: List<String>.from(map['emergencyContacts'] ?? []),
      itinerary: Map<String, dynamic>.from(map['itinerary'] ?? {}),
      tripStartDate:
          BaseModel.timestampToDateTime(map['tripStartDate']) ?? DateTime.now(),
      tripEndDate:
          BaseModel.timestampToDateTime(map['tripEndDate']) ?? DateTime.now(),
      isActive: map['isActive'] ?? true,
      isVerified: map['isVerified'] ?? false,
      qrCodeData: map['qrCodeData'] ?? '',
      kycData: Map<String, dynamic>.from(map['kycData'] ?? {}),
      blockchainHash: map['blockchainHash'] ?? '',
      createdAt: BaseModel.timestampToDateTime(map['createdAt']),
      updatedAt: BaseModel.timestampToDateTime(map['updatedAt']),
    );
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      'digitalId': digitalId,
      'userId': userId,
      'fullName': fullName,
      'nationality': nationality,
      'documentType': documentType,
      'documentNumber': documentNumber, // In production, encrypt this
      'phoneNumber': phoneNumber,
      'email': email,
      'emergencyContacts': emergencyContacts,
      'itinerary': itinerary,
      'tripStartDate': tripStartDate.millisecondsSinceEpoch,
      'tripEndDate': tripEndDate.millisecondsSinceEpoch,
      'isActive': isActive,
      'isVerified': isVerified,
      'qrCodeData': qrCodeData,
      'kycData': kycData,
      'blockchainHash': blockchainHash,
      'createdAt': createdAt?.millisecondsSinceEpoch,
      'updatedAt': updatedAt?.millisecondsSinceEpoch,
    };
  }

  // Generate digital ID
  static String generateDigitalId(String userId) {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final input = '$userId$timestamp';
    final bytes = sha256.convert(input.codeUnits).bytes;
    final hash = bytes
        .take(6)
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    return 'TID${hash.toUpperCase()}';
  }

  // Generate blockchain hash (simulated)
  String generateBlockchainHash() {
    final data =
        '$digitalId$userId$documentNumber${DateTime.now().millisecondsSinceEpoch}';
    final bytes = sha256.convert(data.codeUnits);
    return bytes.toString();
  }

  // Check if ID is currently valid
  bool get isCurrentlyValid {
    final now = DateTime.now();
    return isActive &&
        isVerified &&
        now.isAfter(tripStartDate) &&
        now.isBefore(tripEndDate);
  }

  // Days remaining in trip
  int get daysRemaining {
    final now = DateTime.now();
    if (now.isAfter(tripEndDate)) return 0;
    return tripEndDate.difference(now).inDays;
  }

  // Trip progress percentage
  double get tripProgress {
    final now = DateTime.now();
    if (now.isBefore(tripStartDate)) return 0.0;
    if (now.isAfter(tripEndDate)) return 1.0;

    final totalDays = tripEndDate.difference(tripStartDate).inDays;
    final elapsedDays = now.difference(tripStartDate).inDays;
    return totalDays > 0 ? elapsedDays / totalDays : 0.0;
  }

  // Get ID status
  String get status {
    final now = DateTime.now();
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Pending Verification';
    if (now.isBefore(tripStartDate)) return 'Valid (Future Trip)';
    if (now.isAfter(tripEndDate)) return 'Expired';
    return 'Active';
  }

  TouristIdModel copyWith({
    String? fullName,
    String? nationality,
    String? phoneNumber,
    String? email,
    List<String>? emergencyContacts,
    Map<String, dynamic>? itinerary,
    DateTime? tripStartDate,
    DateTime? tripEndDate,
    bool? isActive,
    bool? isVerified,
  }) {
    return TouristIdModel(
      id: id,
      digitalId: digitalId,
      userId: userId,
      fullName: fullName ?? this.fullName,
      nationality: nationality ?? this.nationality,
      documentType: documentType,
      documentNumber: documentNumber,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      itinerary: itinerary ?? this.itinerary,
      tripStartDate: tripStartDate ?? this.tripStartDate,
      tripEndDate: tripEndDate ?? this.tripEndDate,
      isActive: isActive ?? this.isActive,
      isVerified: isVerified ?? this.isVerified,
      qrCodeData: qrCodeData,
      kycData: kycData,
      blockchainHash: blockchainHash,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  @override
  String toString() {
    return 'TouristIdModel(digitalId: $digitalId, fullName: $fullName, status: $status)';
  }
}
