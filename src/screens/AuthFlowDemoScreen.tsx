import { useEffect, useMemo, useRef, useState } from "react";
import { Image, PanResponder, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../components/AppCard";
import { BottomActionBar, BottomActionButton, BottomActionSummary } from "../components/BottomActionBar";
import { InlineNotice } from "../components/InlineNotice";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { colors, radii, spacing, statusColors, typography } from "../theme";

type AuthMode = "signup" | "login";
type AuthChannel = "phone" | "email";
type AuthProvider = "google" | "apple";
type AuthStep = "onboarding" | "welcome" | "identifier" | "providerTransition" | "profile";

type DemoProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode: string;
  birthday: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
};

type AuthFlowDemoScreenProps = {
  profile: {
    name: string;
    email: string;
    phone: string;
  };
  onBack: () => void;
  onComplete: () => void;
  onImmersiveChange?: (isImmersive: boolean) => void;
};

const resendCountdownSeconds = 60;
const signupSteps: AuthStep[] = ["welcome", "identifier", "profile"];
const loginSteps: AuthStep[] = ["welcome", "identifier"];
const onboardingPages: Array<{
  caption: string;
  image: ImageSourcePropType;
  imageAspectRatio: number;
}> = [
  {
    caption: "Welcome to G&A Robot.",
    image: require("../../assets/onboarding/onboarding-1-welcome.png"),
    imageAspectRatio: 195 / 340
  },
  {
    caption: "Top up. Get bonus.",
    image: require("../../assets/onboarding/onboarding-2-topup.png"),
    imageAspectRatio: 195 / 340
  },
  {
    caption: "Earn rewards every time.",
    image: require("../../assets/onboarding/onboarding-3-rewards.png"),
    imageAspectRatio: 205 / 340
  },
  {
    caption: "Invite friends. Both win.",
    image: require("../../assets/onboarding/onboarding-4-invite.png"),
    imageAspectRatio: 208 / 340
  },
  {
    caption: "Find G&A Robot nearby.",
    image: require("../../assets/onboarding/onboarding-5-find.png"),
    imageAspectRatio: 205 / 340
  },
  {
    caption: "Create your account.",
    image: require("../../assets/onboarding/onboarding-6-started.png"),
    imageAspectRatio: 228 / 340
  }
];

export function AuthFlowDemoScreen({ profile, onBack, onComplete, onImmersiveChange }: AuthFlowDemoScreenProps) {
  const nameParts = profile.name.trim().split(/\s+/);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [channel, setChannel] = useState<AuthChannel>("phone");
  const [step, setStep] = useState<AuthStep>("onboarding");
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [identifier, setIdentifier] = useState(profile.phone || "+1 604 555 0188");
  const [password, setPassword] = useState("demo1234");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(resendCountdownSeconds);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [provider, setProvider] = useState<AuthProvider | null>(null);
  const [demoProfile, setDemoProfile] = useState<DemoProfile>({
    firstName: nameParts[0] ?? "Robert",
    lastName: nameParts.slice(1).join(" ") || "Hui",
    email: profile.email || "alex@example.com",
    phone: profile.phone || "+1 604 555 0188",
    postalCode: "V5K 0A1",
    birthday: "",
    marketingOptIn: false,
    termsAccepted: false
  });

  const steps = mode === "signup" ? signupSteps : loginSteps;
  const stepIndex = Math.max(steps.indexOf(step), 0);
  const isSignup = mode === "signup";
  const isLastStep = stepIndex === steps.length - 1;
  const canContinue = getCanContinue(step, identifier, otp, demoProfile);

  useEffect(() => {
    onImmersiveChange?.(true);

    return () => onImmersiveChange?.(false);
  }, [onImmersiveChange]);

  useEffect(() => {
    if (step !== "identifier" || !isVerificationSent || otpCountdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setOtpCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isVerificationSent, otpCountdown, step]);

  useEffect(() => {
    if (step !== "providerTransition") {
      return;
    }

    const timer = setTimeout(() => {
      setStep("profile");
    }, 950);

    return () => clearTimeout(timer);
  }, [step]);

  function start(nextMode: AuthMode) {
    setMode(nextMode);
    setProvider(null);
    setStep("identifier");
    setOtp("");
    setOtpError("");
    setOtpCountdown(resendCountdownSeconds);
    setIsVerificationSent(false);
    setIsVerifyingCode(false);
    setIdentifier(nextMode === "signup" ? "+1 604 555 0188" : profile.phone || "+1 604 555 0188");
  }

  function startProvider(nextProvider: AuthProvider) {
    setMode("signup");
    setProvider(nextProvider);
    setOtp("");
    setOtpError("");
    setIsVerificationSent(false);
    setIsVerifyingCode(false);
    setIdentifier(nextProvider === "google" ? "robert@gmail.com" : "private-relay@privaterelay.appleid.com");
    setDemoProfile((current) => ({
      ...current,
      email: nextProvider === "google" ? "robert@gmail.com" : "private-relay@privaterelay.appleid.com"
    }));

    setStep("providerTransition");
  }

  function continueFlow() {
    setOtpError("");
    if (isLastStep) {
      onComplete();
      return;
    }
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  }

  function goBack() {
    if (step === "onboarding") {
      if (onboardingIndex > 0) {
        setOnboardingIndex((current) => current - 1);
        return;
      }
      onBack();
      return;
    }
    if (step === "welcome") {
      setStep("onboarding");
      return;
    }
    if (step === "providerTransition") {
      setProvider(null);
      setStep("welcome");
      return;
    }
    if (step === "profile" && provider) {
      setProvider(null);
      setStep("welcome");
      return;
    }
    setStep(steps[Math.max(stepIndex - 1, 0)]);
  }

  function changeChannel(nextChannel: AuthChannel) {
    setChannel(nextChannel);
    setIdentifier(nextChannel === "phone" ? demoProfile.phone : demoProfile.email);
    setOtp("");
    setOtpError("");
    setOtpCountdown(resendCountdownSeconds);
    setIsVerificationSent(false);
    setIsVerifyingCode(false);
  }

  function completeIdentifierVerification() {
    setIsVerifyingCode(false);
    setOtpError("");
    if (isLastStep) {
      onComplete();
      return;
    }
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  }

  if (step === "onboarding") {
    return (
      <OnboardingStep
        index={onboardingIndex}
        onSelectIndex={setOnboardingIndex}
        onNext={() => {
          if (onboardingIndex >= onboardingPages.length - 1) {
            setStep("welcome");
            return;
          }
          setOnboardingIndex((current) => current + 1);
        }}
        onPrevious={() => setOnboardingIndex((current) => Math.max(current - 1, 0))}
        onSkip={() => setStep("welcome")}
      />
    );
  }

  return (
    <Screen
      title={step === "welcome" ? "Sign In" : step === "providerTransition" && provider ? `Continue with ${formatProvider(provider)}` : isSignup ? "Create Account" : "Log In"}
      eyebrow={step === "welcome" ? "GA Robot Account" : step === "providerTransition" ? "Secure sign-in" : "Auth Flow Demo"}
      scrollKey={`auth-workflow-${mode}-${step}-${provider ?? "code"}-${onboardingIndex}`}
      onBack={goBack}
      backLabel="Back"
      bottomAction={
        step === "welcome" || step === "identifier" || step === "providerTransition" ? undefined : (
          <BottomActionBar>
            <BottomActionSummary
              label={isSignup ? "Registration" : "Login"}
              value={`${stepIndex + 1} of ${steps.length}`}
              meta={getStepLabel(step)}
            />
            <BottomActionButton
              label={getPrimaryActionLabel(mode, isLastStep)}
              icon="arrow-forward"
              disabled={!canContinue}
              onPress={continueFlow}
            />
          </BottomActionBar>
        )
      }
    >
      {step === "welcome" ? (
        <WelcomeStep
          channel={channel}
          identifier={identifier}
          password={password}
          onChangeChannel={changeChannel}
          onChangeIdentifier={setIdentifier}
          onChangePassword={setPassword}
          onPasswordLogin={onComplete}
          onCodeLogin={() => start("login")}
          onCreateAccount={() => start("signup")}
          onProvider={startProvider}
        />
      ) : null}
      {step === "identifier" ? (
        <IdentifierStep
          mode={mode}
          channel={channel}
          identifier={identifier}
          otp={otp}
          countdown={otpCountdown}
          isVerificationSent={isVerificationSent}
          isVerifyingCode={isVerifyingCode}
          onChangeChannel={changeChannel}
          onChangeIdentifier={(value) => {
            setIdentifier(value);
            setOtp("");
            setOtpError("");
            setIsVerificationSent(false);
            setOtpCountdown(resendCountdownSeconds);
            setIsVerifyingCode(false);
          }}
          onSendCode={() => {
            setOtp("");
            setOtpError("");
            setIsVerificationSent(true);
            setOtpCountdown(resendCountdownSeconds);
            setIsVerifyingCode(false);
          }}
          onChangeOtp={(value) => {
            const nextOtp = value.replace(/\D/g, "").slice(0, 6);
            setOtp(nextOtp);
            setOtpError("");
            if (nextOtp.length === 6) {
              setIsVerifyingCode(true);
              setTimeout(completeIdentifierVerification, 650);
            } else {
              setIsVerifyingCode(false);
            }
          }}
          onResend={() => {
            setOtp("");
            setOtpError("");
            setIsVerificationSent(true);
            setOtpCountdown(resendCountdownSeconds);
            setIsVerifyingCode(false);
          }}
        />
      ) : null}
      {step === "providerTransition" && provider ? (
        <ProviderTransitionStep provider={provider} />
      ) : null}
      {step === "profile" ? (
        <ProfileStep
          profile={demoProfile}
          onChangeProfile={setDemoProfile}
        />
      ) : null}
    </Screen>
  );
}

function OnboardingStep({
  index,
  onSelectIndex,
  onNext,
  onPrevious,
  onSkip
}: {
  index: number;
  onSelectIndex: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}) {
  const page = onboardingPages[index];
  const isLast = index === onboardingPages.length - 1;
  const canGoPrevious = index > 0;
  const { height } = useWindowDimensions();
  const imageHeight = Math.min(height * 0.62, 590);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 54 && canGoPrevious) {
            onPrevious();
            return;
          }
          if (gestureState.dx < -54) {
            onNext();
          }
        }
      }),
    [canGoPrevious, onNext, onPrevious]
  );

  return (
    <View style={styles.onboardingStage} {...panResponder.panHandlers}>
      <View style={styles.onboardingTopBar}>
        <View style={styles.onboardingTopSide}>
          {canGoPrevious ? (
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.onboardingBackButton} onPress={onPrevious}>
              <Ionicons name="chevron-back" size={18} color={colors.muted} />
              <Text style={styles.onboardingBackText}>Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.onboardingCounter}>{index + 1} / {onboardingPages.length}</Text>
        <View style={[styles.onboardingTopSide, styles.onboardingTopSideRight]}>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.onboardingHero}>
        <Image
          source={page.image}
          resizeMode="contain"
          style={[
            styles.onboardingReferenceCard,
            {
              height: imageHeight,
              width: imageHeight * page.imageAspectRatio
            }
          ]}
        />
        <View style={styles.onboardingCaption}>
          <Text style={styles.onboardingText}>{page.caption}</Text>
        </View>
      </View>

      <View style={styles.onboardingFooter}>
        <View style={styles.onboardingDots}>
          {onboardingPages.map((pageItem, pageIndex) => (
            <TouchableOpacity
              key={pageItem.caption}
              accessibilityRole="button"
              activeOpacity={0.84}
              style={[styles.dot, pageIndex === index && styles.dotActive]}
              onPress={() => onSelectIndex(pageIndex)}
            />
          ))}
        </View>

        <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.onboardingPrimary} onPress={onNext}>
          <Text style={styles.onboardingPrimaryText}>{isLast ? "Get Started" : "Next"}</Text>
          <Ionicons name="arrow-forward" size={19} color={colors.onDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WelcomeStep({
  channel,
  identifier,
  password,
  onChangeChannel,
  onChangeIdentifier,
  onChangePassword,
  onPasswordLogin,
  onCodeLogin,
  onCreateAccount,
  onProvider
}: {
  channel: AuthChannel;
  identifier: string;
  password: string;
  onChangeChannel: (channel: AuthChannel) => void;
  onChangeIdentifier: (identifier: string) => void;
  onChangePassword: (password: string) => void;
  onPasswordLogin: () => void;
  onCodeLogin: () => void;
  onCreateAccount: () => void;
  onProvider: (provider: AuthProvider) => void;
}) {
  const canPasswordLogin = identifier.trim().length >= 5 && password.trim().length >= 4;

  return (
    <>
      <AppCard style={styles.authHero}>
        <View style={styles.brandMark}>
          <Ionicons name="cafe-outline" size={28} color={colors.onDark} />
        </View>
        <Text style={styles.authHeroTitle}>GA Robot Account</Text>
        <Text style={styles.authHeroText}>Save payments, earn rewards, send gifts, and keep app and VM receipts in one place.</Text>
      </AppCard>

      <SectionHeader title="Log In" />
      <AppCard style={styles.loginCard}>
        <View style={styles.segmented}>
          <SegmentButton label="Email" icon="mail-outline" selected={channel === "email"} onPress={() => onChangeChannel("email")} />
          <SegmentButton label="SMS" icon="phone-portrait-outline" selected={channel === "phone"} onPress={() => onChangeChannel("phone")} />
        </View>

        <DemoField
          label={channel === "phone" ? "Mobile number" : "Email address"}
          value={identifier}
          onChangeText={onChangeIdentifier}
          placeholder={channel === "phone" ? "+1 604 555 0188" : "name@example.com"}
          keyboardType={channel === "phone" ? "phone-pad" : "email-address"}
        />
        <View style={styles.inputBox}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            style={styles.fieldInput}
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPasswordLogin }}
          activeOpacity={0.84}
          disabled={!canPasswordLogin}
          style={[styles.primaryModeButton, !canPasswordLogin && styles.disabledButton]}
          onPress={onPasswordLogin}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.onDark} />
          <Text style={styles.primaryModeText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.codeLoginButton} onPress={onCodeLogin}>
          <Text style={styles.codeLoginText}>Use one-time code instead</Text>
        </TouchableOpacity>
      </AppCard>

      <SectionHeader title="Continue with" />
      <View style={styles.socialStack}>
        <SocialButton provider="google" label="Continue with Google" onPress={() => onProvider("google")} />
        <SocialButton provider="apple" label="Continue with Apple" onPress={() => onProvider("apple")} />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>New to GA Robot?</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.signupFooter}>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.secondaryModeButton} onPress={onCreateAccount}>
          <Ionicons name="person-add-outline" size={20} color={colors.ink} />
          <Text style={styles.secondaryModeText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <InlineNotice
        icon="flask-outline"
        title="Demo mode"
        meta="Simulated"
        text="Password login is simulated. One-time code accepts any 6 digits. Google and Apple verify identity, then require GA Robot account details."
        tone="info"
        style={styles.demoNotice}
      />
    </>
  );
}

function SocialButton({
  provider,
  label,
  onPress
}: {
  provider: AuthProvider;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.socialButton} onPress={onPress}>
      <View style={styles.socialIcon}>
        <Ionicons name={provider === "google" ? "logo-google" : "logo-apple"} size={21} color={colors.ink} />
      </View>
      <Text style={styles.socialText}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.muted} />
    </TouchableOpacity>
  );
}

function IdentifierStep({
  mode,
  channel,
  identifier,
  otp,
  countdown,
  isVerificationSent,
  isVerifyingCode,
  onChangeChannel,
  onChangeIdentifier,
  onSendCode,
  onChangeOtp,
  onResend
}: {
  mode: AuthMode;
  channel: AuthChannel;
  identifier: string;
  otp: string;
  countdown: number;
  isVerificationSent: boolean;
  isVerifyingCode: boolean;
  onChangeChannel: (channel: AuthChannel) => void;
  onChangeIdentifier: (identifier: string) => void;
  onSendCode: () => void;
  onChangeOtp: (otp: string) => void;
  onResend: () => void;
}) {
  const canResend = countdown <= 0;
  const canSendCode = identifier.trim().length >= 5;
  const maskedDestination = formatDestination(identifier, channel);

  return (
    <>
      <SectionHeader title={mode === "signup" ? "Create Account" : "One-Time Code"} />
      <AppCard style={styles.identityCard}>
        <View style={styles.identityHeader}>
          <View style={styles.identityIcon}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.success} />
          </View>
          <View style={styles.identityHeaderCopy}>
            <Text style={styles.identityTitle}>{mode === "signup" ? "Start with your phone or email" : "Verify it is you"}</Text>
            <Text style={styles.identitySubtitle}>
              {isVerificationSent ? `Code sent to ${maskedDestination}.` : "We will send a one-time code to verify your account."}
            </Text>
          </View>
        </View>

        <View style={styles.segmented}>
          <SegmentButton label="Phone" icon="phone-portrait-outline" selected={channel === "phone"} onPress={() => onChangeChannel("phone")} />
          <SegmentButton label="Email" icon="mail-outline" selected={channel === "email"} onPress={() => onChangeChannel("email")} />
        </View>

        <View style={styles.identityInputBox}>
          <Text style={styles.fieldLabel}>{channel === "phone" ? "Mobile number" : "Email address"}</Text>
          <TextInput
            value={identifier}
            onChangeText={onChangeIdentifier}
            placeholder={channel === "phone" ? "+1 604 555 0188" : "name@example.com"}
            placeholderTextColor={colors.muted}
            keyboardType={channel === "phone" ? "phone-pad" : "email-address"}
            autoCapitalize="none"
            style={styles.fieldInputLarge}
          />
        </View>

        {isVerificationSent ? (
          <View style={styles.sentNotice}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.sentNoticeText}>Verification code sent. Enter any 6-digit code for this demo.</Text>
          </View>
        ) : null}

        {!isVerificationSent ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSendCode }}
            activeOpacity={0.84}
            disabled={!canSendCode}
            style={[styles.sendCodeButton, !canSendCode && styles.disabledButton]}
            onPress={onSendCode}
          >
            <Text style={styles.onboardingPrimaryText}>Send Code</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.onDark} />
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.verificationDivider} />

            <View style={styles.otpHeader}>
              <View style={styles.otpIcon}>
                <Ionicons name={channel === "phone" ? "chatbubble-ellipses-outline" : "mail-open-outline"} size={22} color={colors.blue} />
              </View>
              <View style={styles.otpHeaderCopy}>
                <Text style={styles.cardTitle}>Enter the 6-digit code</Text>
                <Text style={styles.cardText}>
                  {isVerifyingCode ? "Verifying code..." : "The next step starts automatically once all 6 digits are entered."}
                </Text>
              </View>
            </View>

            <CodeInputBoxes
              value={otp}
              onChangeText={onChangeOtp}
              disabled={isVerifyingCode}
            />

            <View style={styles.otpActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: !canResend }}
                activeOpacity={0.84}
                disabled={!canResend}
                style={[styles.otpUtilityButton, !canResend && styles.otpUtilityButtonDisabled]}
                onPress={onResend}
              >
                <Ionicons name="refresh-outline" size={17} color={canResend ? colors.ink : colors.muted} />
                <Text style={[styles.otpUtilityText, !canResend && styles.otpUtilityTextDisabled]}>
                  {canResend ? "Resend code" : `Resend in ${countdown}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </AppCard>
    </>
  );
}

function CodeInputBoxes({
  value,
  onChangeText,
  disabled
}: {
  value: string;
  onChangeText: (value: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");
  const activeIndex = Math.min(value.length, 5);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      style={styles.codeBoxTouchArea}
      onPress={() => inputRef.current?.focus()}
    >
      <View style={styles.codeBoxRow}>
        {digits.map((digit, index) => (
          <View
            key={`${index}-${digit || "empty"}`}
            style={[
              styles.codeBox,
              index === activeIndex && !disabled && styles.codeBoxActive,
              digit ? styles.codeBoxFilled : null
            ]}
          >
            <Text style={styles.codeBoxDigit}>{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        style={styles.hiddenCodeInput}
      />
    </TouchableOpacity>
  );
}

function ProviderTransitionStep({ provider }: { provider: AuthProvider }) {
  return (
    <AppCard style={styles.providerTransitionCard}>
      <View style={styles.providerTransitionIcon}>
        <Ionicons name={provider === "google" ? "logo-google" : "logo-apple"} size={28} color={colors.onDark} />
      </View>
      <Text style={styles.providerTransitionTitle}>{formatProvider(provider)} verified</Text>
      <Text style={styles.providerTransitionText}>Taking you back to GA Robot to finish account setup.</Text>
      <View style={styles.providerTransitionProgress}>
        <View style={styles.providerTransitionProgressFill} />
      </View>
    </AppCard>
  );
}

function ProfileStep({
  profile,
  onChangeProfile
}: {
  profile: DemoProfile;
  onChangeProfile: (profile: DemoProfile) => void;
}) {
  return (
    <>
      <View style={styles.profileForm}>
        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.profileTitle}>Account details</Text>
            <Text style={styles.profileSubtitle}>Used for receipts, rewards, and account recovery.</Text>
          </View>
          <View style={styles.requiredPill}>
            <Text style={styles.requiredPillText}>Required</Text>
          </View>
        </View>

        <View style={styles.formStack}>
          <View style={styles.nameGrid}>
            <DemoField compact label="First name" value={profile.firstName} onChangeText={(firstName) => onChangeProfile({ ...profile, firstName })} placeholder="First" />
            <DemoField compact label="Last name" value={profile.lastName} onChangeText={(lastName) => onChangeProfile({ ...profile, lastName })} placeholder="Last" />
          </View>

          <DemoField label="Email" value={profile.email} onChangeText={(email) => onChangeProfile({ ...profile, email })} placeholder="name@example.com" keyboardType="email-address" />
          <DemoField label="Phone" value={profile.phone} onChangeText={(phone) => onChangeProfile({ ...profile, phone })} placeholder="+1 604 555 0188" keyboardType="phone-pad" />

          <View style={styles.nameGrid}>
            <DemoField compact label="Postal code" value={profile.postalCode} onChangeText={(postalCode) => onChangeProfile({ ...profile, postalCode })} placeholder="V5K 0A1" />
            <DemoField compact label="Birthday optional" value={profile.birthday} onChangeText={(birthday) => onChangeProfile({ ...profile, birthday })} placeholder="MM/DD" />
          </View>
        </View>

        <View style={styles.preferenceGroup}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: profile.termsAccepted }}
            activeOpacity={0.84}
            style={[styles.compactCheckRow, profile.termsAccepted && styles.checkRowSelected]}
            onPress={() => onChangeProfile({ ...profile, termsAccepted: !profile.termsAccepted })}
          >
            <Ionicons name={profile.termsAccepted ? "checkmark-circle" : "ellipse-outline"} size={22} color={profile.termsAccepted ? colors.success : colors.muted} />
            <Text style={styles.compactCheckText}>I agree to the Terms, Privacy Notice, and Rewards Program Rules.</Text>
          </TouchableOpacity>

          <View style={styles.compactToggleRow}>
            <View style={styles.compactToggleIcon}>
              <Ionicons name="megaphone-outline" size={18} color={colors.coffee} />
            </View>
            <View style={styles.compactToggleCopy}>
              <Text style={styles.compactToggleTitle}>Rewards and offers email</Text>
              <Text style={styles.compactToggleText}>Optional. Default off.</Text>
            </View>
            <DemoSwitch
              value={profile.marketingOptIn}
              onValueChange={(marketingOptIn) => onChangeProfile({ ...profile, marketingOptIn })}
            />
          </View>
        </View>
      </View>
    </>
  );
}

function DemoSwitch({
  value,
  onValueChange
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      activeOpacity={0.84}
      style={styles.demoSwitchSlot}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.demoSwitchTrack, value && styles.demoSwitchTrackOn]}>
        <View style={[styles.demoSwitchKnob, value && styles.demoSwitchKnobOn]} />
      </View>
    </TouchableOpacity>
  );
}

function SegmentButton({
  label,
  icon,
  selected,
  onPress
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected }} activeOpacity={0.84} style={[styles.segmentButton, selected && styles.segmentButtonSelected]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={selected ? colors.onDark : colors.muted} />
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DemoField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  compact = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  compact?: boolean;
}) {
  return (
    <View style={[styles.inputBox, compact && styles.inputBoxCompact]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        style={styles.fieldInput}
      />
    </View>
  );
}

function getCanContinue(step: AuthStep, identifier: string, otp: string, profile: DemoProfile) {
  if (step === "welcome") {
    return true;
  }
  if (step === "identifier") {
    return identifier.trim().length >= 5;
  }
  if (step === "profile") {
    return Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && profile.phone.trim() && profile.termsAccepted);
  }
  return true;
}

function getStepLabel(step: AuthStep) {
  switch (step) {
    case "onboarding":
      return "Intro";
    case "welcome":
      return "Start";
    case "identifier":
      return "Identity";
    case "providerTransition":
      return "Verified";
    case "profile":
      return "Profile";
  }
}

function getPrimaryActionLabel(mode: AuthMode, isLastStep: boolean) {
  if (isLastStep) {
    return mode === "signup" ? "Create Account" : "Log In";
  }
  return "Continue";
}

function formatProvider(provider: AuthProvider) {
  return provider === "google" ? "Google" : "Apple";
}

function formatDestination(identifier: string, channel: AuthChannel) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return channel === "phone" ? "your phone" : "your email";
  }
  if (channel === "email") {
    const [name, domain] = trimmed.split("@");
    if (!domain || name.length <= 2) {
      return trimmed;
    }
    return `${name.slice(0, 2)}***@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) {
    return trimmed;
  }
  return `*** ${digits.slice(-4)}`;
}

const styles = StyleSheet.create({
  onboardingStage: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: "space-between"
  },
  onboardingTopBar: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2
  },
  onboardingTopSide: {
    width: 86,
    minHeight: 32,
    justifyContent: "center"
  },
  onboardingTopSideRight: {
    alignItems: "flex-end"
  },
  onboardingBackButton: {
    minHeight: 32,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2
  },
  onboardingBackText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800"
  },
  onboardingCounter: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800"
  },
  skipButton: {
    minHeight: 32,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  skipButtonText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800"
  },
  onboardingHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg
  },
  onboardingReferenceCard: {
    alignSelf: "center",
    borderRadius: radii.md,
    overflow: "hidden"
  },
  onboardingCaption: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg
  },
  onboardingText: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "900"
  },
  onboardingFooter: {
    gap: spacing.lg
  },
  onboardingDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: 0
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.line
  },
  dotActive: {
    width: 30,
    backgroundColor: colors.ink
  },
  onboardingPrimary: {
    minHeight: 60,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.sm
  },
  onboardingPrimaryText: {
    color: colors.onDark,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900"
  },
  authHero: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    paddingVertical: spacing.xl
  },
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: spacing.md
  },
  authHeroTitle: {
    color: colors.onDark,
    ...typography.sectionTitle,
    textAlign: "center"
  },
  authHeroText: {
    color: "rgba(255,255,255,0.76)",
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.sm
  },
  loginCard: {
    gap: spacing.md,
    padding: spacing.md
  },
  disabledButton: {
    opacity: 0.46
  },
  codeLoginButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  codeLoginText: {
    color: colors.coffee,
    ...typography.bodySmall,
    fontWeight: "900"
  },
  socialStack: {
    gap: spacing.sm
  },
  socialButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center"
  },
  socialText: {
    flex: 1,
    color: colors.ink,
    ...typography.button
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line
  },
  dividerText: {
    color: colors.muted,
    ...typography.bodySmall,
    fontWeight: "700"
  },
  signupFooter: {
    gap: spacing.md
  },
  demoNotice: {
    marginTop: spacing.lg
  },
  providerTransitionCard: {
    minHeight: 280,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md
  },
  providerTransitionIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink
  },
  providerTransitionTitle: {
    color: colors.ink,
    ...typography.sectionTitle,
    textAlign: "center"
  },
  providerTransitionText: {
    color: colors.muted,
    ...typography.body,
    textAlign: "center"
  },
  providerTransitionProgress: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
    overflow: "hidden",
    marginTop: spacing.sm
  },
  providerTransitionProgressFill: {
    width: "72%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.success
  },
  profileForm: {
    gap: spacing.lg
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  profileTitle: {
    color: colors.ink,
    ...typography.label,
    fontWeight: "900"
  },
  profileSubtitle: {
    color: colors.muted,
    ...typography.bodySmall,
    marginTop: 2
  },
  requiredPill: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.info.subtleBackground
  },
  requiredPillText: {
    color: statusColors.info.text,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  nameGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  formStack: {
    gap: spacing.md
  },
  preferenceGroup: {
    gap: spacing.sm,
    paddingTop: spacing.xs
  },
  primaryModeButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  primaryModeText: {
    color: colors.onDark,
    ...typography.button
  },
  secondaryModeButton: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  secondaryModeText: {
    color: colors.ink,
    ...typography.button
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  segmentButtonSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  segmentText: {
    color: colors.muted,
    ...typography.button
  },
  segmentTextSelected: {
    color: colors.onDark
  },
  identityCard: {
    gap: spacing.md,
    padding: spacing.md
  },
  identityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  identityIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.success.subtleBackground
  },
  identityHeaderCopy: {
    flex: 1
  },
  identityTitle: {
    color: colors.ink,
    ...typography.label,
    fontWeight: "900"
  },
  identitySubtitle: {
    color: colors.muted,
    ...typography.bodySmall,
    marginTop: 2
  },
  identityInputBox: {
    minHeight: 72,
    borderRadius: radii.md,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center"
  },
  verificationDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line
  },
  sentNotice: {
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: statusColors.success.subtleBackground,
    borderColor: statusColors.success.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  sentNoticeText: {
    flex: 1,
    color: statusColors.success.text,
    ...typography.bodySmall,
    fontWeight: "800"
  },
  sendCodeButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  inputBox: {
    minHeight: 64,
    borderRadius: radii.md,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center"
  },
  inputBoxCompact: {
    flex: 1
  },
  fieldLabel: {
    color: colors.muted,
    ...typography.bodySmall,
    fontWeight: "800",
    marginBottom: 2
  },
  fieldInput: {
    minHeight: 28,
    color: colors.ink,
    ...typography.body,
    fontWeight: "700"
  },
  fieldInputLarge: {
    minHeight: 52,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  otpIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: statusColors.info.subtleBackground
  },
  otpHeaderCopy: {
    flex: 1
  },
  cardTitle: {
    color: colors.ink,
    ...typography.label,
    fontWeight: "900"
  },
  cardText: {
    color: colors.muted,
    ...typography.bodySmall,
    marginTop: 2
  },
  codeBoxTouchArea: {
    minHeight: 68,
    justifyContent: "center"
  },
  codeBoxRow: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  codeBox: {
    flex: 1,
    minWidth: 42,
    maxWidth: 52,
    aspectRatio: 0.82,
    borderRadius: radii.sm,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  codeBoxActive: {
    borderColor: colors.ink,
    borderWidth: 2
  },
  codeBoxFilled: {
    backgroundColor: colors.tint
  },
  codeBoxDigit: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900"
  },
  hiddenCodeInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0
  },
  codeInput: {
    width: "100%",
    minHeight: 64,
    borderRadius: radii.md,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.ink,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  otpActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  otpUtilityButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.tint,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  otpUtilityButtonDisabled: {
    backgroundColor: statusColors.neutral.background
  },
  otpUtilityText: {
    color: colors.ink,
    ...typography.bodySmall,
    fontWeight: "900"
  },
  otpUtilityTextDisabled: {
    color: colors.muted
  },
  compactCheckRow: {
    minHeight: 52,
    borderRadius: radii.sm,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.tint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  checkRowSelected: {
    backgroundColor: statusColors.success.subtleBackground,
    borderColor: statusColors.success.border
  },
  compactCheckText: {
    flex: 1,
    color: colors.ink,
    ...typography.bodySmall,
    fontWeight: "800"
  },
  compactToggleRow: {
    minHeight: 54,
    borderRadius: radii.sm,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  compactToggleIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tint
  },
  compactToggleCopy: {
    flex: 1
  },
  compactToggleTitle: {
    color: colors.ink,
    ...typography.bodySmall,
    fontWeight: "900"
  },
  compactToggleText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 1
  },
  demoSwitchSlot: {
    width: 52,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  demoSwitchTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.line,
    padding: 3,
    justifyContent: "center"
  },
  demoSwitchTrackOn: {
    backgroundColor: colors.success
  },
  demoSwitchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  demoSwitchKnobOn: {
    alignSelf: "flex-end"
  }
});
