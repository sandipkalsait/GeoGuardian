import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;

  final List<FamilyMember> _familyMembers = [
    FamilyMember(
      name: 'Mom',
      avatar: 'M',
      isOnline: true,
      location: 'Home - Sector 62',
      lastSeen: 'Active now',
      safetyStatus: SafetyStatus.safe,
      batteryLevel: 85,
    ),
    FamilyMember(
      name: 'Dad',
      avatar: 'D',
      isOnline: true,
      location: 'Office - Cyber City',
      lastSeen: '2 min ago',
      safetyStatus: SafetyStatus.safe,
      batteryLevel: 62,
    ),
    FamilyMember(
      name: 'Sister',
      avatar: 'S',
      isOnline: false,
      location: 'College - DU',
      lastSeen: '1 hour ago',
      safetyStatus: SafetyStatus.away,
      batteryLevel: 45,
    ),
    FamilyMember(
      name: 'Brother',
      avatar: 'B',
      isOnline: true,
      location: 'Gym - Local',
      lastSeen: 'Active now',
      safetyStatus: SafetyStatus.safe,
      batteryLevel: 78,
    ),
  ];

  final List<Friend> _friends = [
    Friend(
      name: 'Priya',
      avatar: 'P',
      isOnline: true,
      location: 'Mall - Select City',
      mutualFriends: 12,
    ),
    Friend(
      name: 'Arjun',
      avatar: 'A',
      isOnline: false,
      location: 'Home',
      mutualFriends: 8,
    ),
    Friend(
      name: 'Kavya',
      avatar: 'K',
      isOnline: true,
      location: 'Office - Gurgaon',
      mutualFriends: 15,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

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
                        'Family & Friends',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_familyMembers.where((m) => m.isOnline).length + _friends.where((f) => f.isOnline).length} online',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                        ),
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
                      icon: const Icon(Icons.person_add),
                      onPressed: _showAddContactDialog,
                    ),
                  ),
                ],
              ),
            ),

            // Tab bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                color: AppTheme.lightGray,
                borderRadius: BorderRadius.circular(16),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                indicatorPadding: const EdgeInsets.all(4),
                labelColor: AppTheme.darkBlue,
                unselectedLabelColor: AppTheme.darkGray,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                ),
                tabs: const [
                  Tab(text: 'Family'),
                  Tab(text: 'Friends'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Tab views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildFamilyList(),
                  _buildFriendsList(),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _startFamilySession,
        backgroundColor: AppTheme.primaryTeal,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.group_add),
        label: const Text(
          'Start Session',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _buildFamilyList() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: _familyMembers.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final member = _familyMembers[index];
        return _FamilyMemberCard(
          member: member,
          onTap: () => _showMemberDetails(member),
        );
      },
    );
  }

  Widget _buildFriendsList() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: _friends.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final friend = _friends[index];
        return _FriendCard(
          friend: friend,
          onTap: () => _showFriendDetails(friend),
        );
      },
    );
  }

  void _showAddContactDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Add Contact'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primaryTeal.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.family_restroom,
                  color: AppTheme.primaryTeal,
                ),
              ),
              title: const Text('Add Family Member'),
              subtitle: const Text('Invite via phone number'),
              onTap: () {
                Navigator.pop(context);
                // Handle add family member
              },
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.people,
                  color: Colors.blue,
                ),
              ),
              title: const Text('Add Friend'),
              subtitle: const Text('Send invitation link'),
              onTap: () {
                Navigator.pop(context);
                // Handle add friend
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showMemberDetails(FamilyMember member) {
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
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: member.safetyStatus.color,
                  child: Text(
                    member.avatar,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        member.name,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        member.location,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.darkGray,
                        ),
                      ),
                      Text(
                        'Battery: ${member.batteryLevel}%',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.darkGray,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Start tracking
                    },
                    icon: const Icon(Icons.my_location),
                    label: const Text('Track'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Send message
                    },
                    icon: const Icon(Icons.message),
                    label: const Text('Message'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showFriendDetails(Friend friend) {
    // Similar to member details but for friends
  }

  void _startFamilySession() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Start Family Session'),
        content: const Text(
          'This will start a live tracking session where all family members can see each other\'s locations in real-time.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Start session
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Family session started'),
                  backgroundColor: AppTheme.primaryTeal,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              );
            },
            child: const Text('Start Session'),
          ),
        ],
      ),
    );
  }
}

class _FamilyMemberCard extends StatelessWidget {
  final FamilyMember member;
  final VoidCallback onTap;

  const _FamilyMemberCard({
    required this.member,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
            child: Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: member.safetyStatus.color,
                      child: Text(
                        member.avatar,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    if (member.isOnline)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(width: 16),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            member.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: member.safetyStatus.color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              member.safetyStatus.name.toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: member.safetyStatus.color,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 4),

                      Text(
                        member.location,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.darkGray,
                        ),
                      ),

                      const SizedBox(height: 4),

                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: AppTheme.darkGray.withOpacity(0.7),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            member.lastSeen,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.darkGray.withOpacity(0.7),
                            ),
                          ),
                          const Spacer(),
                          Icon(
                            Icons.battery_std,
                            size: 14,
                            color: member.batteryLevel > 20 
                                ? Colors.green 
                                : AppTheme.emergencyRed,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${member.batteryLevel}%',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: member.batteryLevel > 20 
                                  ? Colors.green 
                                  : AppTheme.emergencyRed,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: AppTheme.darkGray.withOpacity(0.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FriendCard extends StatelessWidget {
  final Friend friend;
  final VoidCallback onTap;

  const _FriendCard({
    required this.friend,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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
            child: Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.blue,
                      child: Text(
                        friend.avatar,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    if (friend.isOnline)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(width: 16),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        friend.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),

                      const SizedBox(height: 4),

                      Text(
                        friend.location,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.darkGray,
                        ),
                      ),

                      const SizedBox(height: 4),

                      Text(
                        '${friend.mutualFriends} mutual friends',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.primaryTeal,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                Icon(
                  friend.isOnline ? Icons.circle : Icons.circle_outlined,
                  size: 12,
                  color: friend.isOnline ? Colors.green : AppTheme.darkGray,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class FamilyMember {
  final String name;
  final String avatar;
  final bool isOnline;
  final String location;
  final String lastSeen;
  final SafetyStatus safetyStatus;
  final int batteryLevel;

  FamilyMember({
    required this.name,
    required this.avatar,
    required this.isOnline,
    required this.location,
    required this.lastSeen,
    required this.safetyStatus,
    required this.batteryLevel,
  });
}

class Friend {
  final String name;
  final String avatar;
  final bool isOnline;
  final String location;
  final int mutualFriends;

  Friend({
    required this.name,
    required this.avatar,
    required this.isOnline,
    required this.location,
    required this.mutualFriends,
  });
}

enum SafetyStatus {
  safe(Colors.green, 'Safe'),
  away(Colors.orange, 'Away'),
  emergency(Color(0xFFE74C3C), 'Emergency');

  const SafetyStatus(this.color, this.name);
  final Color color;
  final String name;
}