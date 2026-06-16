import { strings } from '@content/strings';
import { PlaceholderScreen } from '@ui/components/PlaceholderScreen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title={strings.appName}
      description="Офлайн українська гра «Капелюх» — один пристрій, три тури."
      links={[
        { href: '/game/setup', label: strings.home.newGame },
        { href: '/rules', label: strings.home.rules },
        { href: '/settings', label: strings.home.settings },
        { href: '/about', label: 'Про гру' },
      ]}
    />
  );
}
