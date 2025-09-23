import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controllers/tourist_id_controller.dart';
import '../../controllers/auth_controller.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';
import '../widgets/app_text_field.dart';
import '../../theme/app_theme.dart';
import '../../utils/constants.dart';

class TouristIdSetupScreen extends StatefulWidget {
  const TouristIdSetupScreen({super.key});

  @override
  State<TouristIdSetupScreen> createState() => _TouristIdSetupScreenState();
}

class _TouristIdSetupScreenState extends State<TouristIdSetupScreen> {
  void _onGenerateDigitalIdPressed() {
    _generateDigitalId();
  }

  final PageController _pageController = PageController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  int _currentStep = 0;
  final int _totalSteps = 4;

  // Form controllers
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _nationalityController = TextEditingController();
  final TextEditingController _documentNumberController =
      TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _emergencyContact1Controller =
      TextEditingController();
  final TextEditingController _emergencyContact2Controller =
      TextEditingController();

  String _selectedDocumentType = 'passport';
  DateTime _tripStartDate = DateTime.now();
  DateTime _tripEndDate = DateTime.now().add(const Duration(days: 30));
  final List<String> _selectedDestinations = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Digital Tourist ID Setup'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousStep,
              )
            : null,
      ),
      body: Column(
        children: [
          // Progress indicator
          _buildProgressIndicator(),

          // Form content
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildPersonalInfoStep(),
                _buildDocumentVerificationStep(),
                _buildEmergencyContactsStep(),
                _buildItineraryStep(),
              ],
            ),
          ),

          // Navigation buttons
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            children: List.generate(_totalSteps, (index) {
              final isActive = index <= _currentStep;
              final isCompleted = index < _currentStep;

              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(
                    right: index < _totalSteps - 1 ? 8 : 0,
                  ),
                  decoration: BoxDecoration(
                    color: isCompleted
                        ? Colors.green
                        : isActive
                        ? AppTheme.primaryTeal
                        : Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 12),
          Text(
            'Step ${_currentStep + 1} of $_totalSteps',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Personal Information',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Enter your basic personal details for ID verification',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: 32),

            AppTextField(
              controller: _fullNameController,
              hint: 'Full Name',
              prefixIcon: Icons.person_outline,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Full name is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            AppTextField(
              controller: _nationalityController,
              hint: 'Nationality',
              prefixIcon: Icons.flag_outlined,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Nationality is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            AppTextField(
              controller: _phoneController,
              hint: 'Phone Number',
              prefixIcon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Phone number is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),

            AppTextField(
              controller: _emailController,
              hint: 'Email Address',
              prefixIcon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Email is required';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentVerificationStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Document Verification',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Provide your identity document for verification',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),

          // Document type selector
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Document Type',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),

                ...AppConstants.acceptedDocuments.map((docType) {
                  return RadioListTile<String>(
                    title: Text(_getDocumentDisplayName(docType)),
                    value: docType,
                    groupValue: _selectedDocumentType,
                    onChanged: (value) {
                      setState(() {
                        _selectedDocumentType = value!;
                      });
                    },
                    activeColor: AppTheme.primaryTeal,
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 20),

          AppTextField(
            controller: _documentNumberController,
            hint: '${_getDocumentDisplayName(_selectedDocumentType)} Number',
            prefixIcon: Icons.badge_outlined,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Document number is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 32),

          // Trip duration
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trip Duration',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: _buildDateSelector(
                        label: 'Start Date',
                        date: _tripStartDate,
                        onDateSelected: (date) {
                          setState(() {
                            _tripStartDate = date;
                            if (_tripEndDate.isBefore(date)) {
                              _tripEndDate = date.add(const Duration(days: 1));
                            }
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildDateSelector(
                        label: 'End Date',
                        date: _tripEndDate,
                        onDateSelected: (date) {
                          if (date.isAfter(_tripStartDate)) {
                            setState(() {
                              _tripEndDate = date;
                            });
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyContactsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Emergency Contacts',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Add emergency contacts who will be notified in case of emergency',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),

          AppTextField(
            controller: _emergencyContact1Controller,
            hint: 'Emergency Contact 1 (Required)',
            prefixIcon: Icons.contact_emergency_outlined,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'At least one emergency contact is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),

          AppTextField(
            controller: _emergencyContact2Controller,
            hint: 'Emergency Contact 2 (Optional)',
            prefixIcon: Icons.contact_emergency_outlined,
            keyboardType: TextInputType.phone,
          ),

          const SizedBox(height: 32),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue[600]),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Emergency contacts will be notified via SMS and call in case of emergency alerts.',
                    style: TextStyle(color: Colors.blue[800], fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItineraryStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Travel Itinerary',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Select your planned destinations (optional)',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),

          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Planned Destinations',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),

                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _getPopularDestinations().map((destination) {
                    final isSelected = _selectedDestinations.contains(
                      destination,
                    );
                    return FilterChip(
                      label: Text(destination),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedDestinations.add(destination);
                          } else {
                            _selectedDestinations.remove(destination);
                          }
                        });
                      },
                      selectedColor: AppTheme.primaryTeal.withOpacity(0.2),
                      checkmarkColor: AppTheme.primaryTeal,
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Summary
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.summarize_outlined, color: AppTheme.primaryTeal),
                    const SizedBox(width: 12),
                    Text(
                      'Setup Summary',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                _buildSummaryItem(
                  'Duration',
                  '${_tripEndDate.difference(_tripStartDate).inDays} days',
                ),
                _buildSummaryItem(
                  'Destinations',
                  '${_selectedDestinations.length} selected',
                ),
                _buildSummaryItem(
                  'Emergency Contacts',
                  '${_getEmergencyContactCount()}',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          if (_currentStep < _totalSteps - 1)
            AppButton(text: 'Continue', onPressed: _nextStep, isFullWidth: true)
          else
            Consumer<TouristIdController>(
              builder: (context, controller, child) {
                return AppButton(
                  text: 'Generate Digital ID',
                  onPressed: controller.isLoading
                      ? () {}
                      : () {
                          _generateDigitalId();
                        },
                  isFullWidth: true,
                  isLoading: controller.isLoading,
                );
              },
            ),

          const SizedBox(height: 12),

          if (_currentStep > 0)
            TextButton(onPressed: _previousStep, child: const Text('Back')),
        ],
      ),
    );
  }

  Widget _buildDateSelector({
    required String label,
    required DateTime date,
    required Function(DateTime) onDateSelected,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: InkWell(
            onTap: () => _selectDate(date, onDateSelected),
            child: Text(
              '${date.day}/${date.month}/${date.year}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    if (_currentStep == 0 && !_formKey.currentState!.validate()) {
      return;
    }

    if (_currentStep < _totalSteps - 1) {
      setState(() {
        _currentStep++;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _selectDate(
    DateTime currentDate,
    Function(DateTime) onDateSelected,
  ) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: currentDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null && picked != currentDate) {
      onDateSelected(picked);
    }
  }

  Future<void> _generateDigitalId() async {
    final authController = Provider.of<AuthController>(context, listen: false);
    final touristIdController = Provider.of<TouristIdController>(
      context,
      listen: false,
    );

    if (authController.currentUser == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('User not authenticated')));
      return;
    }

    final emergencyContacts = <String>[];
    if (_emergencyContact1Controller.text.isNotEmpty) {
      emergencyContacts.add(_emergencyContact1Controller.text.trim());
    }
    if (_emergencyContact2Controller.text.isNotEmpty) {
      emergencyContacts.add(_emergencyContact2Controller.text.trim());
    }

    final itinerary = {
      'destinations': _selectedDestinations,
      'startDate': _tripStartDate.toIso8601String(),
      'endDate': _tripEndDate.toIso8601String(),
      'duration': _tripEndDate.difference(_tripStartDate).inDays,
    };

    final success = await touristIdController.generateDigitalId(
      userId: authController.currentUser!.uid,
      fullName: _fullNameController.text.trim(),
      nationality: _nationalityController.text.trim(),
      documentType: _selectedDocumentType,
      documentNumber: _documentNumberController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      email: _emailController.text.trim(),
      emergencyContacts: emergencyContacts,
      itinerary: itinerary,
      tripStartDate: _tripStartDate,
      tripEndDate: _tripEndDate,
    );

    if (success && mounted) {
      Navigator.of(
        context,
      ).pushNamedAndRemoveUntil('/safety-dashboard', (route) => false);
    }
  }

  String _getDocumentDisplayName(String docType) {
    switch (docType) {
      case 'aadhaar':
        return 'Aadhaar Card';
      case 'passport':
        return 'Passport';
      case 'voter_id':
        return 'Voter ID';
      case 'driving_license':
        return 'Driving License';
      case 'pan_card':
        return 'PAN Card';
      default:
        return docType.toUpperCase();
    }
  }

  List<String> _getPopularDestinations() {
    return [
      'Delhi',
      'Mumbai',
      'Bangalore',
      'Chennai',
      'Kolkata',
      'Jaipur',
      'Goa',
      'Kerala',
      'Himachal Pradesh',
      'Rajasthan',
      'Uttar Pradesh',
      'Karnataka',
      'Tamil Nadu',
      'Maharashtra',
    ];
  }

  int _getEmergencyContactCount() {
    int count = 0;
    if (_emergencyContact1Controller.text.isNotEmpty) count++;
    if (_emergencyContact2Controller.text.isNotEmpty) count++;
    return count;
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fullNameController.dispose();
    _nationalityController.dispose();
    _documentNumberController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _emergencyContact1Controller.dispose();
    _emergencyContact2Controller.dispose();
    super.dispose();
  }
}
