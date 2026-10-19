import { router } from 'expo-router';
import { MicrophonePermissionScreen } from '../../screens/PermissionScreen';

export default function Microphone() {
  return <MicrophonePermissionScreen onDone={() => router.push('/permissions/notifications')} />;
}
