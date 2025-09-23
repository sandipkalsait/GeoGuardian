// TODO Implement this library.
import 'package:flutter/foundation.dart';

abstract class BaseController extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  bool get hasError => _errorMessage != null;

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void setError(String? error) {
    _errorMessage = error;
    _successMessage = null;
    notifyListeners();
  }

  void setSuccess(String? message) {
    _successMessage = message;
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearSuccess() {
    _successMessage = null;
    notifyListeners();
  }

  void clearMessages() {
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  @protected
  void handleError(dynamic error) {
    setError(error.toString());
    setLoading(false);
  }

  @protected
  void handleSuccess(String message) {
    setSuccess(message);
    setLoading(false);
  }

  // Helper method for async operations
  Future<T?> executeWithErrorHandling<T>(
    Future<T> Function() operation, {
    String? successMessage,
    bool showLoading = true,
  }) async {
    try {
      if (showLoading) setLoading(true);
      clearMessages();
      
      final result = await operation();
      
      if (successMessage != null) {
        handleSuccess(successMessage);
      } else {
        setLoading(false);
      }
      
      return result;
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  // Helper method for operations that return bool
  Future<bool> executeBoolOperation(
    Future<bool> Function() operation, {
    String? successMessage,
    String? errorMessage,
    bool showLoading = true,
  }) async {
    try {
      if (showLoading) setLoading(true);
      clearMessages();
      
      final result = await operation();
      
      if (result) {
        if (successMessage != null) {
          handleSuccess(successMessage);
        } else {
          setLoading(false);
        }
      } else {
        setError(errorMessage ?? 'Operation failed');
        setLoading(false);
      }
      
      return result;
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  void reset() {
    _isLoading = false;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }
}