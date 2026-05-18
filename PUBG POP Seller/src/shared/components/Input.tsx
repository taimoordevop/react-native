import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-surface-300 text-sm mb-2">{label}</Text>}
      <TextInput
        className={`bg-surface-100 text-white rounded-xl px-4 py-4 text-base ${error ? 'border border-red-500' : ''}`}
        placeholderTextColor="#475569"
        {...props}
      />
      {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
      {hint && !error && <Text className="text-surface-300 text-xs mt-1">{hint}</Text>}
    </View>
  );
}
