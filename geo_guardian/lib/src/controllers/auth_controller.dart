import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import '../controllers/base_controller.dart';
import '../services/firebase_service.dart';
import '../utils/constants.dart';

class AuthController extends BaseController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseService _firebaseService = FirebaseService();

  User? _currentUser;
  Map<String, dynamic>? _userProfile;
  
  User? get currentUser => _currentUser;
  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isAuthenticated => _currentUser != null;

  final StreamController<bool> _authStateController = StreamController<bool>.broadcast();
  Stream<bool> get authStateStream => _authStateController.stream;

  StreamSubscription<User?>? _authSubscription;

  // Initialize auth controller
  Future<void> init() async {
    await executeWithErrorHandling(() async {
      _authSubscription = _auth.authStateChanges().listen(_onAuthStateChanged);
      _currentUser = _auth.currentUser;
      
      if (_currentUser != null) {
        await _loadUserProfile();
      }
      
      _authStateController.add(_currentUser != null);
    });
  }

  void _onAuthStateChanged(User? user) {
    _currentUser = user;
    _authStateController.add(user != null);
    
    if (user != null) {
      _loadUserProfile();
    } else {
      _userProfile = null;
    }
    
    notifyListeners();
  }

  // Sign in with email and password
  Future<bool> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    return await executeBoolOperation(
      () async {
        final credential = await _auth.signInWithEmailAndPassword(
          email: email.trim(),
          password: password,
        );
        
        if (credential.user != null) {
          await _loadUserProfile();
          return true;
        }
        return false;
      },
      successMessage: AppConstants.loginSuccess,
      errorMessage: 'Invalid email or password.',
    );
  }

  // Register with email and password
  Future<bool> registerWithEmailAndPassword({
    required String email,
    required String password,
    required String name,
    String? phoneNumber,
    String userType = 'tourist',
  }) async {
    return await executeBoolOperation(
      () async {
        final credential = await _auth.createUserWithEmailAndPassword(
          email: email.trim(),
          password: password,
        );
        
        if (credential.user != null) {
          // Update display name
          await credential.user!.updateDisplayName(name);
          
          // Create user profile in Firestore
          await _firebaseService.createUserProfile(
            credential.user!.uid,
            {
              'name': name,
              'email': email.trim(),
              'phoneNumber': phoneNumber,
              'userType': userType,
              'createdAt': DateTime.now().toIso8601String(),
              'isActive': true,
            },
          );
          
          await _loadUserProfile();
          return true;
        }
        return false;
      },
      successMessage: AppConstants.accountCreated,
      errorMessage: 'Failed to create account.',
    );
  }

  // Reset password
  Future<bool> resetPassword(String email) async {
    return await executeBoolOperation(
      () async {
        await _auth.sendPasswordResetEmail(email: email.trim());
        return true;
      },
      successMessage: AppConstants.passwordResetSent,
      errorMessage: 'Failed to send reset email.',
    );
  }

  // Sign out
  Future<void> signOut() async {
    await executeWithErrorHandling(() async {
      await _auth.signOut();
      _currentUser = null;
      _userProfile = null;
      notifyListeners();
    });
  }

  // Load user profile from Firestore
  Future<void> _loadUserProfile() async {
    if (_currentUser?.uid != null) {
      try {
        _userProfile = await _firebaseService.getUserProfile(_currentUser!.uid);
        notifyListeners();
      } catch (e) {
        print('Failed to load user profile: $e');
      }
    }
  }

  // Update user profile
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    if (_currentUser?.uid == null) return false;

    return await executeBoolOperation(
      () async {
        await _firebaseService.updateUserProfile(_currentUser!.uid, data);
        await _loadUserProfile();
        return true;
      },
      successMessage: 'Profile updated successfully.',
      errorMessage: 'Failed to update profile.',
    );
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _authStateController.close();
    super.dispose();
  }

  Future signInWithGoogle() async {}

  Future signInWithPhone() async {}
}