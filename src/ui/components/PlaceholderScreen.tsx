import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { strings } from '@content/strings';

type NavLink = {
  href: string;
  label: string;
};

type PlaceholderScreenProps = {
  title: string;
  description?: string;
  links?: NavLink[];
};

export function PlaceholderScreen({ title, description, links = [] }: PlaceholderScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-center text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </Text>
        <Text className="text-center text-base text-slate-600 dark:text-slate-300">
          {description ?? strings.common.placeholder}
        </Text>
        <View className="mt-4 gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href as never} asChild>
              <Pressable className="rounded-xl bg-blue-500 px-4 py-3">
                <Text className="text-center text-base font-semibold text-white">{link.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
