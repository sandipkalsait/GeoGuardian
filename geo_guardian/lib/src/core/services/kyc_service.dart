import 'dart:io';
import 'dart:typed_data';
import 'package:firebase_storage/firebase_storage.dart';
import 'encryption_service.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:uuid/uuid.dart';

class KycService {
  final EncryptionService enc;
  final FirebaseStorage storage = FirebaseStorage.instance;

  KycService(this.enc);

  Future<Map<String, String>> uploadKycFile(File file, String digitalIdHash) async {
    // Read file bytes
    final bytes = await file.readAsBytes();

    // Compute SHA256 hash
    final fileHash = sha256.convert(bytes).toString();

    // Encrypt file bytes
    final encResult = await enc.encryptBytes(bytes);
    final cipher = encResult['cipher'] as Uint8List;

    // Generate unique file ID
    final fileId = const Uuid().v4();

    // Build storage path
    final path = 'kyc_blob/$digitalIdHash/$fileId.enc';

    // Upload encrypted bytes
    final ref = storage.ref(path);
    await ref.putData(cipher);

    return {
      'fileHash': fileHash,
      'storagePath': path,
    };
  }
}
