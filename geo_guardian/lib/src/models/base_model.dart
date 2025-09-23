import 'package:cloud_firestore/cloud_firestore.dart';

abstract class BaseModel {
  String? id;
  DateTime? createdAt;
  DateTime? updatedAt;

  BaseModel({this.id, this.createdAt, this.updatedAt});

  // Abstract methods that must be implemented by subclasses
  Map<String, dynamic> toMap();

  // Common Firestore operations
  Map<String, dynamic> toFirestore() {
    final map = toMap();
    map['updatedAt'] = FieldValue.serverTimestamp();
    if (createdAt == null) {
      map['createdAt'] = FieldValue.serverTimestamp();
    }
    return map;
  }

  // Helper method to convert Firestore timestamp
  static DateTime? timestampToDateTime(dynamic timestamp) {
    if (timestamp == null) return null;
    if (timestamp is Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp is int) {
      return DateTime.fromMillisecondsSinceEpoch(timestamp);
    }
    if (timestamp is String) {
      try {
        return DateTime.parse(timestamp);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Helper method to format date for display
  String formatDate(DateTime? date) {
    if (date == null) return '';

    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BaseModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
