import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../controllers/emergency_controller.dart';
import '../../controllers/location_controller.dart';
import '../../controllers/tourist_id_controller.dart';
import '../../models/emergency_alert_model.dart';
import '../../theme/app_theme.dart';
import '../widgets/sos_button.dart';

class PanicButtonScreen extends StatefulWidget {
  const PanicButtonScreen({super.key});

  @override
  State<PanicButtonScreen> createState() => _PanicButtonScreenState();
}

class _PanicButtonScreenState extends State<PanicButtonScreen> 
    with TickerProviderStateMixin {
  
  late AnimationController _pulseController;
  late AnimationController _breathingController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _breathingAnimation;
  
  bool _isEmergencyActive = false;
  bool _showBreathingExercise = false;
  int _breathingCount = 0;
  
  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _checkExistingEmergency();
  }

  void _initializeAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _breathingController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _breathingAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _breathingController,
      curve: Curves.easeInOut,
    ));

    _pulseController.repeat(reverse: true);
  }

  void _checkExistingEmergency() {
    final emergencyController = Provider.of<EmergencyController>(context, listen: false);
    setState(() {
      _isEmergencyActive = emergencyController.hasActiveEmergency;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _isEmergencyActive 
          ? AppTheme.emergencyRed.withOpacity(0.05)
          : Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: _showBreathingExercise 
            ? _buildBreathingExercise()
            : _buildEmergencyInterface(),
      ),
    );
  }

  Widget _buildEmergencyInterface() {
    return Consumer3<EmergencyController, LocationController, TouristIdController>(
      builder: (context, emergencyController, locationController, touristIdController, child) {
        return Column(
          children: [
            // Header
            _buildHeader(),
            
            // Main content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Emergency status
                    if (_isEmergencyActive)
                      _buildEmergencyActiveStatus(emergencyController.currentEmergency)
                    else
                      _buildReadyStatus(),
                    
                    const SizedBox(height: 40),
                    
                    // SOS Button
                    _buildSOSButton(emergencyController),
                    
                    const SizedBox(height: 40),
                    
                    // Quick actions
                    if (!_isEmergencyActive) ...[
                      _buildQuickActions(),
                      const SizedBox(height: 32),
                    ],
                    
                    // Instructions/Status
                    _buildInstructions(),
                    
                    const SizedBox(height: 32),
                    
                    // Emergency contacts & info
                    _buildEmergencyInfo(touristIdController.touristId),
                  ],
                ),
              ),
            ),
            
            // Bottom actions
            if (_isEmergencyActive)
              _buildActiveEmergencyActions(emergencyController),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isEmergencyActive 
                      ? 'Emergency Active'
                      : 'Emergency Alert',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: _isEmergencyActive ? AppTheme.emergencyRed : null,
                  ),
                ),
                Text(
                  _isEmergencyActive 
                      ? 'Help is on the way'
                      : 'Tap the button if you need help',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          if (_isEmergencyActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.emergencyRed.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppTheme.emergencyRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'ACTIVE',
                    style: TextStyle(
                      color: AppTheme.emergencyRed,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReadyStatus() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.shield_outlined, color: Colors.green, size: 20),
          const SizedBox(width: 12),
          Text(
            'System Ready',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.green[700],
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyActiveStatus(EmergencyAlertModel? emergency) {
    if (emergency == null) return const SizedBox.shrink();
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.emergencyRed.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.emergencyRed.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.emergencyRed.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.warning_rounded,
                  color: AppTheme.emergencyRed,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      emergency.typeDisplayName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.emergencyRed,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Alert sent at ${emergency.alertTime.hour}:${emergency.alertTime.minute.toString().padLeft(2, '0')}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.emergencyRed.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  'Authorities have been notified',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Stay calm and help is on the way',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSOSButton(EmergencyController controller) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _isEmergencyActive ? _pulseAnimation.value : 1.0,
          child: SosButton(
            onPressed: () => _handleSOSPressed(controller),
            isActive: _isEmergencyActive,
            size: 200,
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.local_hospital_outlined,
                title: 'Medical',
                subtitle: 'Medical Emergency',
                color: Colors.red,
                onTap: () => _triggerSpecificEmergency(EmergencyType.medical),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.directions_car_outlined,
                title: 'Accident',
                subtitle: 'Traffic Accident',
                color: Colors.orange,
                onTap: () => _triggerSpecificEmergency(EmergencyType.accident),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.psychology_outlined,
                title: 'Calm Down',
                subtitle: 'Breathing Exercise',
                color: Colors.blue,
                onTap: _showBreathingExerciseDialog,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.phone_outlined,
                title: 'Call Police',
                subtitle: '100',
                color: Colors.green,
                onTap: _callPolice,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInstructions() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _isEmergencyActive 
            ? AppTheme.emergencyRed.withOpacity(0.05)
            : AppTheme.primaryTeal.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            _isEmergencyActive ? Icons.access_time : Icons.touch_app,
            size: 32,
            color: _isEmergencyActive ? AppTheme.emergencyRed : AppTheme.primaryTeal,
          ),
          const SizedBox(height: 16),
          Text(
            _isEmergencyActive 
                ? 'Stay where you are. Emergency services are on their way. Keep your phone with you and stay connected.'
                : 'Hold the SOS button for 3 seconds to trigger emergency alert. This will notify authorities and your emergency contacts.',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyInfo(dynamic touristId) {
    final emergencyContacts = touristId?.emergencyContacts as List<String>? ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Emergency Numbers',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        
        _buildEmergencyNumber('Police', '100', Icons.local_police_outlined),
        _buildEmergencyNumber('Ambulance', '108', Icons.local_hospital_outlined),
        _buildEmergencyNumber('Fire Service', '101', Icons.local_fire_department_outlined),
        _buildEmergencyNumber('Tourist Helpline', '1363', Icons.support_agent_outlined),
        
        if (emergencyContacts.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Your Emergency Contacts',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          ...emergencyContacts.take(3).map((contact) => 
            _buildEmergencyNumber('Emergency Contact', contact, Icons.contact_emergency_outlined),
          ),
        ],
      ],
    );
  }

  Widget _buildEmergencyNumber(String title, String number, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryTeal, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  number,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.phone, color: Colors.green),
            onPressed: () => _makePhoneCall(number),
            tooltip: 'Call',
          ),
        ],
      ),
    );
  }

  Widget _buildActiveEmergencyActions(EmergencyController controller) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _callPolice,
                  icon: const Icon(Icons.phone, size: 18),
                  label: const Text('Call Emergency'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showCancelDialog(controller),
                  icon: const Icon(Icons.close, size: 18),
                  label: const Text('Cancel'),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.emergencyRed),
                    foregroundColor: AppTheme.emergencyRed,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Emergency services have been notified. Use call button to speak directly with authorities.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBreathingExercise() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _showBreathingExercise = false;
                    _breathingController.stop();
                  });
                },
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Breathing Exercise',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
            ],
          ),
          
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _breathingAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _breathingAnimation.value,
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                AppTheme.primaryTeal.withOpacity(0.3),
                                AppTheme.primaryTeal.withOpacity(0.1),
                              ],
                            ),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.self_improvement,
                              size: 80,
                              color: AppTheme.primaryTeal,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  
                  const SizedBox(height: 40),
                  
                  Text(
                    _getBreathingInstruction(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppTheme.primaryTeal,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Text(
                    'Cycle ${(_breathingCount / 2).ceil()}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          ElevatedButton(
            onPressed: _startBreathingExercise,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryTeal,
              minimumSize: const Size(double.infinity, 48),
            ),
            child: Text(
              _breathingController.isAnimating ? 'Stop' : 'Start',
            ),
          ),
        ],
      ),
    );
  }

  void _handleSOSPressed(EmergencyController controller) {
    if (_isEmergencyActive) {
      return; // Prevent multiple activations
    }

    HapticFeedback.heavyImpact();
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppTheme.emergencyRed.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.warning_rounded,
                color: AppTheme.emergencyRed,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Text(
                'Confirm Emergency',
                style: TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
        content: const Text(
          'This will immediately alert emergency services and your emergency contacts. Are you sure you need help?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.grey),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _triggerEmergency(controller, EmergencyType.panic);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.emergencyRed,
              foregroundColor: Colors.white,
            ),
            child: const Text('Send Alert'),
          ),
        ],
      ),
    );
  }

  Future<void> _triggerEmergency(EmergencyController controller, EmergencyType type) async {
    final success = await controller.triggerPanicButton(
      type: type,
      severity: AlertSeverity.critical,
    );

    if (success && mounted) {
      setState(() {
        _isEmergencyActive = true;
      });
      
      HapticFeedback.heavyImpact();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Emergency alert sent successfully',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  void _triggerSpecificEmergency(EmergencyType type) {
    final controller = Provider.of<EmergencyController>(context, listen: false);
    _triggerEmergency(controller, type);
  }

  void _showBreathingExerciseDialog() {
    setState(() {
      _showBreathingExercise = true;
      _breathingCount = 0;
    });
  }

  void _startBreathingExercise() {
    if (_breathingController.isAnimating) {
      _breathingController.stop();
    } else {
      _breathingCount = 0;
      _breathingController.repeat(reverse: true);
      
      // Count breathing cycles
      _breathingController.addStatusListener((status) {
        if (status == AnimationStatus.completed || status == AnimationStatus.dismissed) {
          setState(() {
            _breathingCount++;
          });
        }
      });
    }
  }

  String _getBreathingInstruction() {
    if (!_breathingController.isAnimating) {
      return 'Tap Start to begin';
    }
    
    return _breathingController.value > 0.5 ? 'Breathe In' : 'Breathe Out';
  }

  void _showCancelDialog(EmergencyController controller) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Emergency'),
        content: const Text('Are you sure you want to cancel the emergency alert? This will notify authorities that help is no longer needed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Keep Active'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              
              final success = await controller.cancelEmergency(
                reason: 'Cancelled by user - false alarm',
              );
              
              if (success && mounted) {
                setState(() {
                  _isEmergencyActive = false;
                });
                
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        const Icon(Icons.info, color: Colors.white),
                        const SizedBox(width: 12),
                        const Text('Emergency alert cancelled'),
                      ],
                    ),
                    backgroundColor: Colors.grey[700],
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.emergencyRed,
              foregroundColor: Colors.white,
            ),
            child: const Text('Cancel Alert'),
          ),
        ],
      ),
    );
  }

  void _callPolice() {
    _makePhoneCall('100');
  }

  void _makePhoneCall(String phoneNumber) {
    // Implementation would use url_launcher to make phone calls
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Calling $phoneNumber'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _breathingController.dispose();
    super.dispose();
  }
}