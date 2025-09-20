import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';

class EncryptionService {
  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  static const _keyStorageKey = 'geo_guardian_aes_key_v1';

  Future<Uint8List> _getOrCreateKey() async {
    final existing = await _secure.read(key: _keyStorageKey);
    if (existing != null) {
      return base64Decode(existing);
    }
    final key = Uint8List.fromList(List<int>.generate(32, (_) => Random.secure().nextInt(256)));
    await _secure.write(key: _keyStorageKey, value: base64Encode(key));
    return key;
  }

  Future<Map<String, dynamic>> encryptBytes(Uint8List plain) async {
    final keyBytes = await _getOrCreateKey();
    final key = Key(keyBytes);
    final iv = IV.fromSecureRandom(12);
    final encrypter = Encrypter(AES(key, mode: AESMode.gcm));
    final encrypted = encrypter.encryptBytes(plain, iv: iv);
    return {
      'cipher': encrypted.bytes,
      'iv': iv.bytes,
    };
  }

  Future<Uint8List> decryptBytes(Uint8List cipher, Uint8List ivBytes) async {
    final keyBytes = await _getOrCreateKey();
    final key = Key(keyBytes);
    final iv = IV(ivBytes);
    final encrypter = Encrypter(AES(key, mode: AESMode.gcm));
    final decrypted = encrypter.decryptBytes(Encrypted(cipher), iv: iv);
    return Uint8List.fromList(decrypted);
  }

  String hashWithSalt(String input, {required String salt}) {
    final h = sha256.convert(utf8.encode('\$salt|\$input'));
    return h.toString();
  }
}
