import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = false;
  bool _notifications = true;
  bool _locationSharing = true;
  bool _biometricAuth = true;
  String _language = 'English';
  final String _emergencyNumber = '+91 112';

  final List<String> _languages = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Bengali',
    'Gujarati',
    'Marathi',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header with profile
              Container(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text(
                          'Settings',
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const Spacer(),
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppTheme.lightGray,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.help_outline),
                            onPressed: () {
                              // Show help
                            },
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Profile section
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppTheme.primaryTeal, Colors.blue],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(
                              Icons.person,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),

                          const SizedBox(width: 16),

                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'John Doe',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '+91 98765 43210',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.darkGray,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.verified,
                                        size: 14,
                                        color: Colors.green,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Verified',
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: Colors.green,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          IconButton(
                            onPressed: () {
                              _showEditProfileDialog();
                            },
                            icon: const Icon(Icons.edit_outlined),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Settings sections
              _buildSettingsSection(
                'Security & Privacy',
                [
                  _SettingsItem(
                    icon: Icons.fingerprint,
                    title: 'Biometric Authentication',
                    subtitle: 'Use fingerprint or face recognition',
                    trailing: Switch(
                      value: _biometricAuth,
                      onChanged: (value) {
                        setState(() => _biometricAuth = value);
                      },
                      activeThumbColor: AppTheme.primaryTeal,
                    ),
                  ),
                  _SettingsItem(
                    icon: Icons.location_on,
                    title: 'Location Sharing',
                    subtitle: 'Share location with family members',
                    trailing: Switch(
                      value: _locationSharing,
                      onChanged: (value) {
                        setState(() => _locationSharing = value);
                      },
                      activeThumbColor: AppTheme.primaryTeal,
                    ),
                  ),
                  _SettingsItem(
                    icon: Icons.security,
                    title: 'Privacy Settings',
                    subtitle: 'Manage data sharing preferences',
                    onTap: () {
                      // Navigate to privacy settings
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.key,
                    title: 'Change Password',
                    subtitle: 'Update your account password',
                    onTap: () {
                      _showChangePasswordDialog();
                    },
                  ),
                ],
              ),

              _buildSettingsSection(
                'Emergency',
                [
                  _SettingsItem(
                    icon: Icons.contact_emergency,
                    title: 'Emergency Contacts',
                    subtitle: '3 contacts added',
                    onTap: () {
                      // Navigate to emergency contacts
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.local_hospital,
                    title: 'Medical Information',
                    subtitle: 'Blood type, allergies, medications',
                    onTap: () {
                      // Navigate to medical info
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.phone,
                    title: 'Emergency Number',
                    subtitle: _emergencyNumber,
                    onTap: () {
                      _showEmergencyNumberDialog();
                    },
                  ),
                ],
              ),

              _buildSettingsSection(
                'App Preferences',
                [
                  _SettingsItem(
                    icon: Icons.language,
                    title: 'Language',
                    subtitle: _language,
                    onTap: () {
                      _showLanguageDialog();
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.notifications,
                    title: 'Notifications',
                    subtitle: 'Push notifications and alerts',
                    trailing: Switch(
                      value: _notifications,
                      onChanged: (value) {
                        setState(() => _notifications = value);
                      },
                      activeThumbColor: AppTheme.primaryTeal,
                    ),
                  ),
                  _SettingsItem(
                    icon: Icons.dark_mode,
                    title: 'Dark Mode',
                    subtitle: 'Switch to dark theme',
                    trailing: Switch(
                      value: _darkMode,
                      onChanged: (value) {
                        setState(() => _darkMode = value);
                      },
                      activeThumbColor: AppTheme.primaryTeal,
                    ),
                  ),
                ],
              ),

              _buildSettingsSection(
                'About',
                [
                  _SettingsItem(
                    icon: Icons.info,
                    title: 'App Version',
                    subtitle: 'Version 1.0.0',
                    onTap: () {
                      // Show version info
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.description,
                    title: 'Terms of Service',
                    subtitle: 'Read our terms and conditions',
                    onTap: () {
                      // Show terms
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.privacy_tip,
                    title: 'Privacy Policy',
                    subtitle: 'How we handle your data',
                    onTap: () {
                      // Show privacy policy
                    },
                  ),
                  _SettingsItem(
                    icon: Icons.support,
                    title: 'Support',
                    subtitle: 'Get help and contact us',
                    onTap: () {
                      // Show support options
                    },
                  ),
                ],
              ),

              // Logout button
              Padding(
                padding: const EdgeInsets.all(24),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _showLogoutDialog,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.emergencyRed),
                      foregroundColor: AppTheme.emergencyRed,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.logout),
                        const SizedBox(width: 8),
                        Text(
                          'Sign Out',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.emergencyRed,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<_SettingsItem> items) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.primaryTeal,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          Container(
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
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                color: AppTheme.mediumGray.withOpacity(0.3),
                indent: 60,
                endIndent: 16,
              ),
              itemBuilder: (context, index) {
                final item = items[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 4,
                  ),
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryTeal.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      item.icon,
                      color: AppTheme.primaryTeal,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    item.title,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: item.subtitle != null
                      ? Text(
                          item.subtitle!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.darkGray,
                          ),
                        )
                      : null,
                  trailing: item.trailing ??
                      (item.onTap != null
                          ? const Icon(
                              Icons.arrow_forward_ios,
                              size: 16,
                              color: AppTheme.darkGray,
                            )
                          : null),
                  onTap: item.onTap,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showEditProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Edit Profile'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(
                labelText: 'Full Name',
                prefixIcon: Icon(Icons.person),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Select Language'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _languages.length,
            itemBuilder: (context, index) {
              final language = _languages[index];
              return RadioListTile<String>(
                title: Text(language),
                value: language,
                groupValue: _language,
                activeColor: AppTheme.primaryTeal,
                onChanged: (value) {
                  setState(() => _language = value!);
                  Navigator.pop(context);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showEmergencyNumberDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Emergency Number'),
        content: TextField(
          decoration: const InputDecoration(
            labelText: 'Emergency Number',
            prefixIcon: Icon(Icons.phone),
            hintText: '+91 112',
          ),
          controller: TextEditingController(text: _emergencyNumber),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Change Password'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Current Password',
                prefixIcon: Icon(Icons.lock),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'New Password',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Confirm New Password',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Change Password'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out of your account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle logout
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.emergencyRed,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}

class _SettingsItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  _SettingsItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });
}