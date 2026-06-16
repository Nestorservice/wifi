import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  PermissionsAndroid,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import WifiManager from 'react-native-wifi-reborn';

const { width } = Dimensions.get('window');

const NetworkCard = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const getSignalColor = (level) => {
    if (level > -50) return '#48BB78'; // Excellent
    if (level > -70) return '#ECC94B'; // Good
    return '#F56565'; // Weak
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.signalDot, { backgroundColor: getSignalColor(item.level) }]} />
        <Text style={styles.ssidText} numberOfLines={1}>{item.SSID || "Hidden Network"}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>BSSID</Text>
          <Text style={styles.infoValue}>{item.BSSID}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Signal Strength</Text>
          <Text style={styles.infoValue}>{item.level} dBm</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequency</Text>
          <Text style={styles.infoValue}>{item.frequency} MHz</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function App() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnim.stopAnimation();
  };

  const startWifiScan = async () => {
    setLoading(true);
    setError(null);
    startScanAnimation();

    try {
      const state = await NetInfo.fetch();
      if (!state.isWifiEnabled && Platform.OS === 'android') {
        throw new Error("Wi-Fi is disabled. Please turn it on.");
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const isGranted =
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        if (!isGranted) {
          throw new Error("Location permission denied. It is required to scan Wi-Fi.");
        }
      }

      const data = await WifiManager.reScanAndLoadWifiList();
      setNetworks(data || []);
      
      if (data && data.length === 0) {
        setError("No networks found. Try again or check your hardware.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      stopScanAnimation();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A202C" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wi-Fi Inspector</Text>
        <Text style={styles.headerSubtitle}>Scan nearby networks instantly</Text>
      </View>

      <View style={styles.scanContainer}>
        <Animated.View 
          style={[
            styles.scanCircle, 
            { 
              transform: [{ scale: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
              opacity: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.1] })
            }
          ]} 
        />
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={startWifiScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <Text style={styles.scanButtonText}>START SCAN</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={networks}
        keyExtractor={(item, index) => (item.BSSID || "") + index}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <NetworkCard item={item} index={index} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Ready to search?</Text>
              <Text style={styles.emptySubtitle}>Tap the button above to discover available Wi-Fi networks in your area.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C', // Deep Dark Blue
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  scanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  scanCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3182CE',
  },
  scanButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3182CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F56565',
    marginBottom: 20,
  },
  errorText: {
    color: '#F56565',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#2D3748',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ssidText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#4A5568',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});
