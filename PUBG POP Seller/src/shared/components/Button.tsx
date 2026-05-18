import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-surface-200',
  danger: 'bg-red-500/20 border border-red-500/30',
  ghost: 'bg-transparent border border-surface-200',
};

const textClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  danger: 'text-red-400',
  ghost: 'text-surface-300',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-2 px-3 rounded-lg',
  md: 'py-3 px-4 rounded-xl',
  lg: 'py-4 px-6 rounded-xl',
};

const textSizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${sizeClass[size]} items-center justify-center flex-row gap-2 ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60' : ''}`}
    >
      {loading && <ActivityIndicator size="small" color="#fff" />}
      <Text className={`${textClass[variant]} ${textSizeClass[size]} font-semibold`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
