import { useColorScheme } from 'react-native';

import { theme } from '../theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    ...theme,
    isDark,
    colorScheme,
  };
};
