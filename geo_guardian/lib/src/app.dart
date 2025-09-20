import 'package:flutter/material.dart';

class GeoGuardianApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoGuardian',
      home: Scaffold(
        appBar: AppBar(title: Text('GeoGuardian')),
        body: Center(child: Text('GeoGuardian skeleton installed.')),
      ),
    );
  }
}
