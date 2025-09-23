import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final List<GeofenceLocation> _geofences = [
    GeofenceLocation(
      name: 'Home',
      address: 'Sector 62, Noida',
      lat: 28.6139,
      lng: 77.2090,
      isActive: true,
      type: 'Safe Zone',
    ),
    GeofenceLocation(
      name: 'Office',
      address: 'Cyber City, Gurgaon',
      lat: 28.4595,
      lng: 77.0266,
      isActive: true,
      type: 'Work Zone',
    ),
    GeofenceLocation(
      name: 'School',
      address: 'Connaught Place, Delhi',
      lat: 28.6315,
      lng: 77.2167,
      isActive: false,
      type: 'Education Zone',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Current Location',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.green,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Safe Zone - Home',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.green,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
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
                      icon: const Icon(Icons.my_location),
                      onPressed: () {
                        // Center map on current location
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Map placeholder
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                decoration: BoxDecoration(
                  color: AppTheme.lightGray,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.mediumGray,
                    width: 1,
                  ),
                ),
                child: Stack(
                  children: [
                    // Map placeholder
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.map,
                            size: 80,
                            color: AppTheme.darkGray.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Google Maps Integration',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppTheme.darkGray.withOpacity(0.7),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Real-time location tracking',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.darkGray.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Floating action buttons
                    Positioned(
                      top: 20,
                      right: 20,
                      child: Column(
                        children: [
                          _MapActionButton(
                            icon: Icons.layers,
                            onPressed: () {
                              _showLayersBottomSheet();
                            },
                          ),
                          const SizedBox(height: 12),
                          _MapActionButton(
                            icon: Icons.filter_list,
                            onPressed: () {
                              _showFiltersBottomSheet();
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Geofences list
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Text(
                    'Geofences',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      // Show all geofences
                    },
                    child: const Text(
                      'View All',
                      style: TextStyle(
                        color: AppTheme.primaryTeal,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(
              height: 140,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                scrollDirection: Axis.horizontal,
                itemCount: _geofences.length,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  final geofence = _geofences[index];
                  return _GeofenceCard(geofence: geofence);
                },
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showLayersBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Map Layers',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            _LayerOption('Satellite View', false),
            _LayerOption('Traffic', true),
            _LayerOption('Transit', false),
            _LayerOption('Geofences', true),
          ],
        ),
      ),
    );
  }

  void _showFiltersBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filter Geofences',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            _LayerOption('Safe Zones', true),
            _LayerOption('Work Zones', true),
            _LayerOption('Education Zones', false),
            _LayerOption('Emergency Zones', true),
          ],
        ),
      ),
    );
  }

  Widget _LayerOption(String title, bool isEnabled) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const Spacer(),
          Switch(
            value: isEnabled,
            onChanged: (value) {
              // Handle layer toggle
            },
            activeThumbColor: AppTheme.primaryTeal,
          ),
        ],
      ),
    );
  }
}

class _MapActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;

  const _MapActionButton({
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(icon, size: 20),
        onPressed: onPressed,
      ),
    );
  }
}

class _GeofenceCard extends StatelessWidget {
  final GeofenceLocation geofence;

  const _GeofenceCard({required this.geofence});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
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
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: geofence.isActive 
                      ? Colors.green.withOpacity(0.1)
                      : AppTheme.mediumGray.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.location_on,
                  size: 18,
                  color: geofence.isActive ? Colors.green : AppTheme.darkGray,
                ),
              ),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: geofence.isActive ? Colors.green : AppTheme.darkGray,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Text(
            geofence.name,
            style: Theme.of(context).textTheme.titleMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 4),

          Text(
            geofence.type,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.primaryTeal,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 8),

          Text(
            geofence.address,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.darkGray,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class GeofenceLocation {
  final String name;
  final String address;
  final double lat;
  final double lng;
  final bool isActive;
  final String type;

  GeofenceLocation({
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    required this.isActive,
    required this.type,
  });
}