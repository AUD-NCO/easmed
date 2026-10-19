import { router } from 'expo-router';
import { DetailsScreen } from '../screens/DetailsScreen';

export default function Details() {
  return <DetailsScreen onDone={() => router.replace('/home')} onOpenLegal={(doc) => router.push({ pathname: '/legal/[doc]', params: { doc } })} />;
}
