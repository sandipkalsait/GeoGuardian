import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:geo_guardian/src/app.dart';

void main() {
  testWidgets('GeoGuardianApp loads home screen', (WidgetTester tester) async {
    // Pump the GeoGuardianApp widget
    await tester.pumpWidget(GeoGuardianApp());

    // Verify that MaterialApp renders
    expect(find.byType(MaterialApp), findsOneWidget);

    // Check that your app’s home widget loads (replace with actual home widget text)
    expect(find.textContaining('GeoGuardian'), findsWidgets);
  });
}
