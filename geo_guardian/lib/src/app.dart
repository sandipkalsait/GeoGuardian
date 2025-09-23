import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Your existing imports
import 'theme/app_theme.dart';
import 'ui/screens/splash_screen.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/onboarding_screen.dart';
import 'ui/screens/home_screen.dart';
import 'localization/app_localizations.dart';

// New Smart Tourist Safety screens
import 'ui/screens/tourist_id_setup_screen.dart';
// import 'ui/screens/safety_dashboard_screen.dart';
// import 'ui/screens/police_dashboard_screen.dart';
import 'ui/screens/panic_button_screen.dart';

// Controllers
import 'controllers/auth_controller.dart';
import 'controllers/tourist_id_controller.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthController>(
      builder: (context, authController, child) {
        return MaterialApp(
          title: 'Geo Guardian',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: ThemeMode.system,
          
          // Your existing localization
          localizationsDelegates: AppLocalizations.delegates,
          supportedLocales: AppLocalizations.supportedLocales,
          
          home: const AuthWrapper(),
          
          routes: {
            // Your existing routes
            '/login': (ctx) => const LoginScreen(),
            '/onboarding': (ctx) => const OnboardingScreen(),
            '/home': (ctx) => const HomeScreen(),
            
            // New Smart Tourist Safety routes
            '/tourist-id-setup': (ctx) => const TouristIdSetupScreen(),
            // '/safety-dashboard': (ctx) => const SafetyDashboardScreen(), // Commented out
            // '/police-dashboard': (ctx) => const PoliceDashboardScreen(), // Commented out
            '/panic-button': (ctx) => const PanicButtonScreen(),
          },
        );
      },
    );
  }
}

// Enhanced Authentication Wrapper
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthController, TouristIdController>(
      builder: (context, authController, touristIdController, child) {
        return StreamBuilder<bool>(
          stream: authController.authStateStream,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SplashScreen(); // Your beautiful splash screen
            }

            final isAuthenticated = snapshot.data ?? false;

            if (!isAuthenticated) {
              return const SplashScreen(); // Will navigate to login/onboarding
            }

            // Check user type - if police, show police dashboard
            // if (authController.currentUser?.userType == 'police') {
            //   return const PoliceDashboardScreen();
            // }

            // For tourists, check if they have valid digital ID
            // if (touristIdController.hasValidDigitalId) {
            //   return const SafetyDashboardScreen(); // Enhanced home with safety features
            // }

            // Default: show TouristIdSetupScreen
            return const TouristIdSetupScreen(); // Digital ID setup
          },
        );
      },
    );
  }
}