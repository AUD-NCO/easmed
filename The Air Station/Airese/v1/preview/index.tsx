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
import { RegisterScreen } from '../src/screens/RegisterScreen';
import { AboutYouScreen } from '../src/screens/AboutYouScreen';
import { setProfile } from '../src/lib/profile';
import { LegalScreen, type LegalDoc } from '../src/screens/LegalScreen';
import { HomeScreen, type RecordOrigin } from '../src/screens/HomeScreen';
import { RecordingScreen } from '../src/screens/RecordingScreen';
import { ReportsScreen } from '../src/screens/ReportsScreen';
import { NightNotesScreen } from '../src/screens/NightNotesScreen';
import { finishNight, optionsOf, useNightNotes } from '../src/lib/nightNotes';
import { endAnalysing, startAnalysing, useNights, type Night } from '../src/lib/recordings';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';
import { UpdateScreen } from '../src/screens/UpdateScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { CentresScreen } from '../src/screens/CentresScreen';
import { EditDetailsScreen } from '../src/screens/EditDetailsScreen';
import { deleteAccount, finishSetup, startRoute } from '../src/lib/account';
import { LoginScreen } from '../src/screens/LoginScreen';
import { ForgotPasswordScreen } from '../src/screens/ForgotPasswordScreen';
import type { ProfileSheet } from '../src/screens/ProfileScreen';
import { setDemoLastNightStopped, setDemoStartProblem, type StartProblem } from '../src/lib/recordingIssues';
import { StartProblemScreen } from '../src/screens/ProblemScreen';

type Step = 'splash' | 'onboarding' | 'register' | 'microphone' | 'notifications' | 'details' | 'about-you' | 'home' | 'recording' | 'update' | 'problem' | 'login' | 'forgot-password';

const STEPS: Step[] = ['splash', 'onboarding', 'register', 'microphone', 'notifications', 'details', 'about-you', 'home', 'recording', 'update', 'problem', 'login', 'forgot-password'];

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  const [tab, setTab] = useState('home');
  const [recording, setRecording] = useState<{ startedAt: Date; from?: RecordOrigin; pausedAt?: Date }>(() => ({ startedAt: new Date() }));
  const [reportState, setReportState] = useState<string | undefined>(); // demo menu: last night's report in a given state
  const [openProfile, setOpenProfile] = useState(false); // demo menu: Profile, over Home
  const [profileSheet, setProfileSheet] = useState<ProfileSheet>(); // demo menu: Profile, open on one of its sheets
  const [loggedOut, setLoggedOut] = useState(false); // Log in after logging out: no back
  const [resetDemo, setResetDemo] = useState(false); // demo menu: Forgot password's new-password step
  const [loginEmail, setLoginEmail] = useState('');
  const [openRemedies, setOpenRemedies] = useState(false); // demo menu: the latest night's remedies, over Reports
  const [recordingNotes, setRecordingNotes] = useState(false); // Before sleeping, opened from Recording's banner
  const nightNotes = useNightNotes();
  const latest = useNights()[0]; // the night just recorded shows as the latest sample night
  const [registerDemo, setRegisterDemo] = useState<'mail' | null>(null); // demo nav: the email step
  const [legal, setLegal] = useState<LegalDoc | null>(null); // Terms / Privacy, over Create account
  const [problem, setProblem] = useState<StartProblem>('space'); // recording can't start: which problem
  const [run, setRun] = useState(0); // remounts the screen when the demo menu picks it again

  // Demo nav beside the phone frame (public/iphone.html): jump to any screen, and keep the nav in step.
  useEffect(() => {
    const onJump = (e: Event) => {
      let key = (e as CustomEvent<string>).detail;
      endAnalysing(); // a jump leaves the report that was being looked through
      // The email step plays inside Create account
      setRegisterDemo(key === 'email-code' ? 'mail' : null);
      if (key === 'register') setProfile({ verifiedEmail: '' }); // starts unverified, like the app
      if (key === 'email-code') key = 'register';
      setReportState(undefined);
      // Profile's sheets (demo nav): Profile, open on the sheet
      const sheet = ({ 'delete-recordings': 'delete-recordings', 'delete-account': 'delete-account', 'log-out': 'log-out' } as Record<string, ProfileSheet>)[key];
      setProfileSheet(sheet);
      if (sheet) key = 'profile';
      setOpenProfile(key === 'profile');
      setLoggedOut(false);
      setResetDemo(key === 'forgot-password-new');
      if (key === 'forgot-password-new') key = 'forgot-password';
      if (key === 'reports-empty') key = 'night-empty';
      // Night Notes pages: Before sleeping over Recording, remedies over the latest report
      setRecordingNotes(key === 'notes-before');
      setOpenRemedies(key === 'notes-remedies');
      if (key === 'notes-before') key = 'recording';
      if (key === 'notes-remedies') key = 'reports';
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
      } else if (key === 'home' || key === 'reports') {
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
        {step === 'splash' && (
          <SplashScreen
            onFinish={() => {
              // As the app: Home when logged in, Log in when logged out, else the walkthrough
              const to = startRoute();
              setLoggedOut(to === 'login');
              setStep(to === 'home' ? 'home' : to === 'setup' ? 'microphone' : to);
            }}
          />
        )}
        {step === 'onboarding' && <OnboardingScreen onContinue={() => setStep('register')} onLogIn={() => setStep('login')} />}
        {step === 'register' && (
          <RegisterScreen demo={registerDemo} onBack={() => setStep('onboarding')} onDone={() => setStep('microphone')} onOpenLegal={setLegal} />
        )}
        {step === 'microphone' && <MicrophonePermissionScreen onDone={() => setStep('notifications')} />}
        {step === 'notifications' && <NotificationsPermissionScreen onDone={() => setStep('details')} />}
        {step === 'details' && <DetailsScreen onDone={() => setStep('about-you')} />}
        {step === 'about-you' && <AboutYouScreen onDone={() => (finishSetup(), setStep('home'), setTab('home'))} />}
        {step === 'login' && (
          <LoginScreen
            onBack={loggedOut ? undefined : () => setStep('onboarding')}
            onLoggedIn={() => (setStep('home'), setTab('home'))}
            onForgot={(email) => (setLoginEmail(email), setStep('forgot-password'))}
            onSignUp={() => setStep('register')}
          />
        )}
        {step === 'forgot-password' && <ForgotPasswordScreen email={loginEmail} demo={resetDemo} onBack={() => setStep('login')} onDone={() => (setStep('home'), setTab('home'))} />}
        {step === 'register' && legal && (
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
            profileSheet={profileSheet}
            onLoggedOut={() => {
              setLoggedOut(true);
              setStep('login');
            }}
            initialRemedies={openRemedies}
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
              notesTonight={optionsOf(nightNotes.tonight)}
              onOpenNotes={() => setRecordingNotes(true)}
              onStop={() => {
                // Stopping in the morning goes straight to the night, as in the app: looked through, then the report
                if (latest) finishNight(latest.id);
                startAnalysing();
                setStep('home');
                setTab('reports');
                setReportState(undefined);
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
  initialRemedies,
  onAccountDeleted,
  onLoggedOut,
  profileSheet,
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
  initialRemedies: boolean;
  onAccountDeleted: () => void;
  onLoggedOut: () => void;
  profileSheet?: ProfileSheet;
}) {
  const latest = useNights()[0];
  const [notes, setNotes] = useState<Night | null>(initialRemedies ? latest : null); // a night's Night Notes, from its report
  const [profile, setProfile] = useState<'profile' | 'details' | 'centres' | null>(initialProfile ? 'profile' : null);
  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' ? (
        <HomeScreen onStartRecording={onStartRecording} onOpenProfile={() => setProfile('profile')} onOpenLastNight={onOpenLastNight} onCantStart={onCantStart} />
      ) : (
        <ReportsScreen key={reportState ?? 'default'} demoState={reportState} onRecordAgain={() => onTab('home')} onOpenNotes={setNotes} />
      )}
      <TabBar items={HOME_TABS} selected={tab} onSelect={onTab} />
      {notes && <NightNotesScreen key={notes.id} night={notes} backLabel="Back" onClose={() => setNotes(null)} slideIn />}
      {/* Profile, and its pages over it */}
      {profile && (
        <ProfileScreen
          backLabel="Home"
          onBack={() => setProfile(null)}
          onOpenDetails={() => setProfile('details')}
          onOpenCentres={() => setProfile('centres')}
          demoSheet={profileSheet}
          onLoggedOut={onLoggedOut}
          onAccountDeleted={() => {
            deleteAccount(); // already done by Profile; kept so a demo run always starts clean
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
