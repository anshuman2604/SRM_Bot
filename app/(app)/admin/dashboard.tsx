import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/Config';
import { AdminProtectedRoute } from '../../../components/AdminProtectedRoute';

/**
 * Admin Dashboard Screen
 * This is protected by the AdminProtectedRoute component
 * Only users with admin privileges can access this page
 */
export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <AdminProtectedRoute>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your college AI assistant</Text>
        </View>

        <ScrollView style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Content Management</Title>
              <Paragraph>Manage events, resources, and other content</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={() => router.push('/admin/content')}
              >
                Manage Content
              </Button>
            </Card.Actions>
          </Card>

          <Divider style={styles.divider} />

          <Button 
            mode="outlined" 
            icon="arrow-left"
            onPress={() => router.push('/')}
            style={styles.backButton}
          >
            Back to Home
          </Button>
        </ScrollView>
      </View>
    </AdminProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginBottom: 40,
  },
});
