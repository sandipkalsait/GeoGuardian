import 'package:encrypt/encrypt.dart';

class EncryptionService {
  static final EncryptionService _instance = EncryptionService._internal();
  static EncryptionService get instance => _instance;
  EncryptionService._internal();

  late final Encrypter _encrypter;
  late final Key _key;

  Future<void> initialize() async {
    try {
      // In production, this key should be stored securely and managed properly
      _key = Key.fromSecureRandom(32);
      _encrypter = Encrypter(AES(_key));
      
      print('Encryption service initialized');
    } catch (e) {
      print('Error initializing encryption service: $e');
    }
  }

  String encrypt(String plainText) {
    try {
      final iv = IV.fromSecureRandom(16);
      final encrypted = _encrypter.encrypt(plainText, iv: iv);
      
      // Return encrypted data with IV prepended
      return '${iv.base64}:${encrypted.base64}';
    } catch (e) {
      print('Error encrypting data: $e');
      return plainText; // Return original if encryption fails
    }
  }

  String decrypt(String encryptedText) {
    try {
      final parts = encryptedText.split(':');
      if (parts.length != 2) return encryptedText;
      
      final iv = IV.fromBase64(parts[0]);
      final encrypted = Encrypted.fromBase64(parts[1]);
      
      return _encrypter.decrypt(encrypted, iv: iv);
    } catch (e) {
      print('Error decrypting data: $e');
      return encryptedText; // Return original if decryption fails
    }
  }

  Map<String, dynamic> encryptSensitiveData(Map<String, dynamic> data) {
    final sensitiveFields = [
      'documentNumber',
      'phoneNumber',
      'emergencyContacts',
      'address',
    ];

    final encryptedData = <String, dynamic>{};
    
    for (final entry in data.entries) {
      if (sensitiveFields.contains(entry.key) && entry.value is String) {
        encryptedData[entry.key] = encrypt(entry.value as String);
      } else if (sensitiveFields.contains(entry.key) && entry.value is List) {
        encryptedData[entry.key] = (entry.value as List)
            .map((item) => item is String ? encrypt(item) : item)
            .toList();
      } else {
        encryptedData[entry.key] = entry.value;
      }
    }
    
    return encryptedData;
  }

  Map<String, dynamic> decryptSensitiveData(Map<String, dynamic> data) {
    final sensitiveFields = [
      'documentNumber',
      'phoneNumber',
      'emergencyContacts',
      'address',
    ];

    final decryptedData = <String, dynamic>{};
    
    for (final entry in data.entries) {
      if (sensitiveFields.contains(entry.key) && entry.value is String) {
        decryptedData[entry.key] = decrypt(entry.value as String);
      } else if (sensitiveFields.contains(entry.key) && entry.value is List) {
        decryptedData[entry.key] = (entry.value as List)
            .map((item) => item is String ? decrypt(item) : item)
            .toList();
      } else {
        decryptedData[entry.key] = entry.value;
      }
    }
    
    return decryptedData;
  }

  String generateSecureHash(String input) {
    try {
      final iv = IV.fromSecureRandom(16);
      final encrypted = _encrypter.encrypt(input, iv: iv);
      return encrypted.base64;
    } catch (e) {
      print('Error generating secure hash: $e');
      return input.hashCode.toString();
    }
  }
}