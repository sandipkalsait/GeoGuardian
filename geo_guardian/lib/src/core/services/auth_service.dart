import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FlutterSecureStorage _secure = const FlutterSecureStorage();

  Stream<User?> get userChanges => _auth.userChanges();

  Future<String?> getIdToken() async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    final token = await user.getIdToken(true);
    await _secure.write(key: 'id_token', value: token);
    return token;
  }

  Future<void> signOut() => _auth.signOut();
}
