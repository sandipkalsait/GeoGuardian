import 'base_model.dart';

enum EmergencyType {
  panic,
  medical,
  accident,
  theft,
  harassment,
  lost,
  natural_disaster,
  fire,
  other,
}

enum EmergencyStatus { active, acknowledged, responding, resolved, cancelled }

enum AlertSeverity { low, medium, high, critical }

class EmergencyAlertModel extends BaseModel {
  final String alertId;
  final String touristId;
  final String userId;
  final EmergencyType type;
  final EmergencyStatus status;
  final AlertSeverity severity;
  final String title;
  final String description;
  final double latitude;
  final double longitude;
  final String address;
  final DateTime alertTime;
  final List<String> notifiedContacts;
  final List<String> respondingUnits;
  final String? assignedOfficerId;
  final DateTime? responseTime;
  final DateTime? resolutionTime;
  final Map<String, dynamic> metadata;

  EmergencyAlertModel({
    super.id,
    super.createdAt,
    super.updatedAt,
    required this.alertId,
    required this.touristId,
    required this.userId,
    required this.type,
    this.status = EmergencyStatus.active,
    this.severity = AlertSeverity.high,
    required this.title,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.alertTime,
    this.notifiedContacts = const [],
    this.respondingUnits = const [],
    this.assignedOfficerId,
    this.responseTime,
    this.resolutionTime,
    this.metadata = const {},
  });

  @override
  Map<String, dynamic> toMap() {
    return {
      'alertId': alertId,
      'touristId': touristId,
      'userId': userId,
      'type': type.toString(),
      'status': status.toString(),
      'severity': severity.toString(),
      'title': title,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'alertTime': alertTime.millisecondsSinceEpoch,
      'notifiedContacts': notifiedContacts,
      'respondingUnits': respondingUnits,
      'assignedOfficerId': assignedOfficerId,
      'responseTime': responseTime?.millisecondsSinceEpoch,
      'resolutionTime': resolutionTime?.millisecondsSinceEpoch,
      'metadata': metadata,
      'createdAt': createdAt?.millisecondsSinceEpoch,
      'updatedAt': updatedAt?.millisecondsSinceEpoch,
    };
  }

  static EmergencyAlertModel fromMap(
    Map<String, dynamic> map,
    String documentId,
  ) {
    return EmergencyAlertModel(
      id: documentId,
      alertId: map['alertId'] ?? '',
      touristId: map['touristId'] ?? '',
      userId: map['userId'] ?? '',
      type: _parseEmergencyType(map['type']),
      status: _parseEmergencyStatus(map['status']),
      severity: _parseAlertSeverity(map['severity']),
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      latitude: map['latitude']?.toDouble() ?? 0.0,
      longitude: map['longitude']?.toDouble() ?? 0.0,
      address: map['address'] ?? '',
      alertTime:
          BaseModel.timestampToDateTime(map['alertTime']) ?? DateTime.now(),
      notifiedContacts: List<String>.from(map['notifiedContacts'] ?? []),
      respondingUnits: List<String>.from(map['respondingUnits'] ?? []),
      assignedOfficerId: map['assignedOfficerId'],
      responseTime: map['responseTime'] != null
          ? BaseModel.timestampToDateTime(map['responseTime'])
          : null,
      resolutionTime: map['resolutionTime'] != null
          ? BaseModel.timestampToDateTime(map['resolutionTime'])
          : null,
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
      createdAt: BaseModel.timestampToDateTime(map['createdAt']),
      updatedAt: BaseModel.timestampToDateTime(map['updatedAt']),
    );
  }

  static EmergencyType _parseEmergencyType(dynamic value) {
    if (value == null) return EmergencyType.other;
    return EmergencyType.values.firstWhere(
      (e) => e.toString() == value,
      orElse: () => EmergencyType.other,
    );
  }

  static EmergencyStatus _parseEmergencyStatus(dynamic value) {
    if (value == null) return EmergencyStatus.active;
    return EmergencyStatus.values.firstWhere(
      (e) => e.toString() == value,
      orElse: () => EmergencyStatus.active,
    );
  }

  static AlertSeverity _parseAlertSeverity(dynamic value) {
    if (value == null) return AlertSeverity.high;
    return AlertSeverity.values.firstWhere(
      (e) => e.toString() == value,
      orElse: () => AlertSeverity.high,
    );
  }

  // Helper methods
  String get typeDisplayName {
    switch (type) {
      case EmergencyType.panic:
        return 'Panic Alert';
      case EmergencyType.medical:
        return 'Medical Emergency';
      case EmergencyType.accident:
        return 'Accident';
      case EmergencyType.theft:
        return 'Theft/Robbery';
      case EmergencyType.harassment:
        return 'Harassment';
      case EmergencyType.lost:
        return 'Lost Tourist';
      case EmergencyType.natural_disaster:
        return 'Natural Disaster';
      case EmergencyType.fire:
        return 'Fire Emergency';
      case EmergencyType.other:
        return 'Other Emergency';
    }
  }

  String get statusDisplayName {
    switch (status) {
      case EmergencyStatus.active:
        return 'Active';
      case EmergencyStatus.acknowledged:
        return 'Acknowledged';
      case EmergencyStatus.responding:
        return 'Responding';
      case EmergencyStatus.resolved:
        return 'Resolved';
      case EmergencyStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get severityColor {
    switch (severity) {
      case AlertSeverity.low:
        return '#4CAF50';
      case AlertSeverity.medium:
        return '#FF9800';
      case AlertSeverity.high:
        return '#FF5722';
      case AlertSeverity.critical:
        return '#F44336';
    }
  }

  bool get isActive => status == EmergencyStatus.active;
  bool get isResolved => status == EmergencyStatus.resolved;
  bool get needsResponse =>
      status == EmergencyStatus.active ||
      status == EmergencyStatus.acknowledged;

  EmergencyAlertModel copyWith({
    EmergencyType? type,
    EmergencyStatus? status,
    AlertSeverity? severity,
    String? title,
    String? description,
    List<String>? respondingUnits,
    String? assignedOfficerId,
    DateTime? responseTime,
    DateTime? resolutionTime,
  }) {
    return EmergencyAlertModel(
      id: id,
      alertId: alertId,
      touristId: touristId,
      userId: userId,
      type: type ?? this.type,
      status: status ?? this.status,
      severity: severity ?? this.severity,
      title: title ?? this.title,
      description: description ?? this.description,
      latitude: latitude,
      longitude: longitude,
      address: address,
      alertTime: alertTime,
      notifiedContacts: notifiedContacts,
      respondingUnits: respondingUnits ?? this.respondingUnits,
      assignedOfficerId: assignedOfficerId ?? this.assignedOfficerId,
      responseTime: responseTime ?? this.responseTime,
      resolutionTime: resolutionTime ?? this.resolutionTime,
      metadata: metadata,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  @override
  String toString() {
    return 'EmergencyAlertModel(alertId: $alertId, type: $typeDisplayName, status: $statusDisplayName)';
  }
}
