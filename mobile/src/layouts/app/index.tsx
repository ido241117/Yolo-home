import type { PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Home, ShieldAlert, User, UserRoundCheck } from 'lucide-react-native';
import { styles, theme } from '../../styles';

export type AppTabKey = 'home' | 'identity' | 'alerts' | 'profile';

interface AppLayoutProps extends PropsWithChildren {
  activeTab?: AppTabKey;
  onTabPress?: (tab: AppTabKey) => void;
  title?: string;
}

const navItems = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'identity', label: 'Identity', Icon: UserRoundCheck },
  { key: 'alerts', label: 'Alerts', Icon: ShieldAlert, hasBadge: true },
  { key: 'profile', label: 'Profile', Icon: User },
] as const;

export default function AppLayout({ activeTab = 'home', children, onTabPress, title = 'My Room' }: AppLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        <View style={styles.topSpacer} />

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        <View style={styles.bottomNavBar}>
          {navItems.map((item) => {
            const { Icon, key, label } = item;
            const isActive = key === activeTab;
            const iconColor = isActive ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;

            return (
              <Pressable
                key={key}
                onPress={() => onTabPress?.(key)}
                style={[styles.navItem, isActive && styles.navItemActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <View>
                  <Icon size={22} color={iconColor} fill={isActive ? iconColor : 'transparent'} strokeWidth={2.2} />
                  {'hasBadge' in item && item.hasBadge ? <View style={styles.navBadge} /> : null}
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
