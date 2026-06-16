import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  PermissionsAndroid, 
  ActivityIndicator,
  Platform
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { scanWifi } from 'react-native-simple-wifi-scanner';

export default function App() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWifiScan = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Vérifier si le Wi-Fi est activé
      const state = await NetInfo.fetch();
      if (!state.isWifiEnabled && Platform.OS === 'android') {
        setError("Le Wi-Fi est désactivé. Veuillez l'activer pour scanner les réseaux.");
        setLoading(false);
        return;
      }

      if (Platform.OS === 'android') {
        // 2. Demande des permissions de localisation (nécessaire pour scanner le Wi-Fi)
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const isGranted = 
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        if (!isGranted) {
          setError("Permission de localisation refusée. Elle est nécessaire pour scanner les réseaux Wi-Fi.");
          setLoading(false);
          return;
        }
      }

      // 3. Lancement du scan
      const data = await scanWifi();
      console.log('Wifi data:', data);
      setNetworks(data || []);
      
      if (data && data.length === 0) {
        setError("Aucun réseau trouvé. Vérifiez que le Wi-Fi et la Localisation (GPS) sont activés sur votre appareil.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors du scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Scanner Wi-Fi 🚀</Text>
      
      {/* LE GROS BOUTON */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={startWifiScan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>SCANNER LE WI-FI</Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* LISTE DES RÉSULTATS */}
      <FlatList
        data={networks}
        keyExtractor={(item, index) => (item.BSSID || "") + index}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.networkName}>{item.SSID || "Réseau masqué"}</Text>
            <Text style={styles.networkDetails}>BSSID : {item.BSSID}</Text>
            <Text style={styles.networkDetails}>Signal : {item.level} dBm</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Aucun réseau détecté. Cliquez sur le bouton.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', alignItems: 'center', paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A202C', marginBottom: 20 },
  button: { 
    backgroundColor: '#3182CE', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 30, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84,
    marginBottom: 20
  },
  buttonDisabled: { backgroundColor: '#A0AEC0' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  errorText: { color: '#E53E3E', marginHorizontal: 20, marginBottom: 10, textAlign: 'center' },
  listContainer: { width: '100%', paddingHorizontal: 20, paddingBottom: 30 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginVertical: 6, elevation: 1 },
  networkName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  networkDetails: { fontSize: 12, color: '#718096', marginTop: 2 },
  emptyText: { color: '#A0AEC0', marginTop: 40, fontSize: 14, textAlign: 'center' }
});