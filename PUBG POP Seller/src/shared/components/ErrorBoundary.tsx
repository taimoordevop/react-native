import { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message);
    console.error('[ErrorBoundary] Stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
          <ScrollView style={styles.stack}>
            <Text style={styles.stackText}>
              {this.state.errorInfo?.componentStack ?? ''}
            </Text>
          </ScrollView>
          <TouchableOpacity onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#f87171', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  message: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  stack: { maxHeight: 200, width: '100%', marginBottom: 24 },
  stackText: { color: '#475569', fontSize: 11, fontFamily: 'monospace' },
  button: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
