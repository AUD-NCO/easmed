/**
 * Browser preview entry (not part of the shipped app).
 * Plays the same screens, in the same order as the app, inside an iPhone 17 Pro
 * frame for review, without expo-router (the preview is one self-contained HTML file).
 * Built with `npm run preview`.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HOME_TABS, SystemAlertHost, TabBar } from '../src/components';
import { DetailsScreen } from '../src/screens/DetailsScreen';
import { LegalScreen, type LegalDoc } from '../src/screens/LegalScreen';
import { HomeScreen, type RecordOrigin } from '../src/screens/HomeScreen';
import { RecordingScreen } from '../src/screens/RecordingScreen';
import { ReportsScreen } from '../src/screens/ReportsScreen';
import { NightNotesScreen } from '../src/screens/NightNotesScreen';
import { demoAfterFirstNight, finishNight, summarize, useNightNotes } from '../src/lib/nightNotes';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';
import { UpdateScreen } from '../src/screens/UpdateScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { CentresScreen } from '../src/screens/CentresScreen';
import { EditDetailsScreen } from '../src/screens/EditDetailsScreen';
import { eraseEverything } from '../src/lib/account';
import { setDemoLastNightStopped, setDemoStartProblem, type StartProblem } from '../src/lib/recordingIssues';
import { StartProblemScreen } from '../src/screens/ProblemScreen';

type Step = 'splash' | 'onboarding' | 'microphone' | 'notifications' | 'details' | 'home' | 'recording' | 'update' | 'problem';

const STEPS: Step[] = ['splash', 'onboarding', 'microphone', 'notifications', 'details', 'home', 'recording', 'update', 'problem'];

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  const [tab, setTab] = useState('home');
  const [recording, setRecording] = useState<{ startedAt: Date; from?: RecordOrigin; pausedAt?: Date }>(() => ({ startedAt: new Date() }));
  const [reportState, setReportState] = useState<string | undefined>(); // demo menu: last night's report in a given state
  const [openProfile, setOpenProfile] = useState(false); // demo menu: Profile, over Home
  const [recordingNotes, setRecordingNotes] = useState(false); // Night Notes, opened from the Recording carousel
  const nightNotes = useNightNotes();
  const [legal, setLegal] = useState<LegalDoc | null>(null); // Terms / Privacy, over the details screen
  const [problem, setProblem] = useState<StartProblem>('space'); // recording can't start: which problem
  const [run, setRun] = useState(0); // remounts the screen when the demo menu picks it again

  // Demo nav beside the phone frame (public/iphone.html): jump to any screen, and keep the nav in step.
  useEffect(() => {
    const onJump = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      setReportState(undefined);
      setOpenProfile(key === 'profile');
      // Recording problems (see src/lib/recordingIssues.ts)
      const cantStart: StartProblem | null = key === 'no-space' ? 'space' : key === 'start-failed' ? 'start' : null;
      setDemoStartProblem(cantStart);
      setDemoLastNightStopped(key === 'home-after-stopped-night' ? 'stopped-phone' : null);
      if (cantStart) {
        setProblem(cantStart);
        setStep('problem');
      } else if (key === 'home-after-stopped-night') {
        setStep('home');
        setTab('home');
      } else if (key === 'recording-paused') {
        // Stopped five minutes ago, two and a half hours in
        setRecording({ startedAt: new Date(Date.now() - 150 * 60_000), pausedAt: new Date(Date.now() - 5 * 60_000) });
        setStep('recording');
      } else if (key === 'profile') {
        setStep('home');
        setTab('home');
      } else if (key.startsWith('night-')) {
        // Last night's report, in a given state, on the Reports tab
        setStep('home');
        setTab('reports');
        setReportState(key.slice('night-'.length));
      } else if (key === 'home' || key === 'reports' || key === 'home-after-first-night') {
        if (key === 'home-after-first-night') demoAfterFirstNight();
        setStep('home');
        setTab(key === 'reports' ? 'reports' : 'home');
      } else if ((STEPS as string[]).includes(key)) {
        if (key === 'recording') setRecording({ startedAt: new Date() });
        setStep(key as Step);
      }
      setRun((n) => n + 1);
    };
    window.addEventListener('airese:jump', onJump);
    return () => window.removeEventListener('airese:jump', onJump);
  }, []);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('airese:screen', { detail: step === 'home' ? tab : step }));
  }, [step, tab]);

  return (
    <SafeAreaProvider>
      <View key={run} style={{ flex: 1 }}>
        {step === 'splash' && <SplashScreen onFinish={() => setStep('onboarding')} />}
        {step === 'onboarding' && <OnboardingScreen onContinue={() => setStep('microphone')} />}
        {step === 'microphone' && <MicrophonePermissionScreen onDone={() => setStep('notifications')} />}
        {step === 'notifications' && <NotificationsPermissionScreen onDone={() => setStep('details')} />}
        {step === 'details' && <DetailsScreen onDone={() => setStep('home')} onOpenLegal={setLegal} />}
        {step === 'details' && legal && (
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
            <LegalScreen doc={legal} onBack={() => setLegal(null)} />
          </View>
        )}
        {/* Update prompt, outside the usual flow (demo nav only). Forced: no way past it. */}
        {step === 'update' && <UpdateScreen />}
        {step === 'problem' && (
          <StartProblemScreen
            problem={problem}
            onRecord={() => {
              setRecording({ startedAt: new Date() });
              setStep('recording');
            }}
            onClose={() => setStep('home')}
          />
        )}
        {(step === 'home' || step === 'recording') && (
          <HomeTabs
            tab={tab}
            onTab={setTab}
            reportState={reportState}
            initialProfile={openProfile}
            onAccountDeleted={() => {
              setStep('splash');
              setRun((n) => n + 1);
            }}
            onCantStart={(kind) => {
              setProblem(kind);
              setStep('problem');
            }}
            onOpenLastNight={(night) => {
              setDemoLastNightStopped(null);
              setTab('reports');
              setReportState(night);
            }}
            onStartRecording={(from) => {
              setRecording({ startedAt: new Date(), from });
              setStep('recording');
            }}
          />
        )}
        {/* Over Home, like the app's transparent modal, so the button's blue grows out of Home */}
        {step === 'recording' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <RecordingScreen
              startedAt={recording.startedAt}
              pausedAt={recording.pausedAt}
              from={recording.from}
              notesTonight={summarize(nightNotes.tonight)}
              onOpenNotes={() => setRecordingNotes(true)}
              onStop={() => {
                // Stopping in the morning goes straight to the night, as in the app
                finishNight();
                setStep('home');
                setTab('reports');
                setReportState('processing');
                setRun((n) => n + 1);
              }}
            />
          </View>
        )}
        {step === 'recording' && recordingNotes && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <NightNotesScreen onClose={() => setRecordingNotes(false)} slideIn backLabel="Recording" />
          </View>
        )}
        <SystemAlertHost />
      </View>
    </SafeAreaProvider>
  );
}

// Home: same two tabs as src/app/(tabs), without the router.
function HomeTabs({
  tab,
  onTab,
  onStartRecording,
  reportState,
  initialProfile,
  onAccountDeleted,
  onOpenLastNight,
  onCantStart,
}: {
  tab: string;
  onOpenLastNight: (state: string) => void;
  onCantStart: (problem: StartProblem) => void;
  onTab: (key: string) => void;
  onStartRecording: (from: RecordOrigin) => void;
  reportState?: string;
  initialProfile: boolean;
  onAccountDeleted: () => void;
}) {
  const [notes, setNotes] = useState(false);
  const [profile, setProfile] = useState<'profile' | 'details' | 'centres' | null>(initialProfile ? 'profile' : null);
  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' ? (
        <HomeScreen onStartRecording={onStartRecording} onOpenNotes={() => setNotes(true)} onOpenProfile={() => setProfile('profile')} onOpenLastNight={onOpenLastNight} onCantStart={onCantStart} />
      ) : (
        <ReportsScreen key={reportState ?? 'default'} demoState={reportState} onRecordAgain={() => onTab('home')} />
      )}
      <TabBar items={HOME_TABS} selected={tab} onSelect={onTab} />
      {notes && <NightNotesScreen onClose={() => setNotes(false)} slideIn />}
      {/* Profile, and its pages over it */}
      {profile && (
        <ProfileScreen
          backLabel="Home"
          onBack={() => setProfile(null)}
          onOpenDetails={() => setProfile('details')}
          onOpenCentres={() => setProfile('centres')}
          onErased={() => {
            eraseEverything();
            onAccountDeleted();
          }}
        />
      )}
      {profile === 'details' && <EditDetailsScreen onBack={() => setProfile('profile')} />}
      {profile === 'centres' && <CentresScreen onBack={() => setProfile('profile')} />}
    </View>
  );
}

registerRootComponent(PreviewApp);
