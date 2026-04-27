import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialButton } from "@/components/MaterialButton";
import { TapestryLogo } from "@/components/TapestryLogo";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type Mode = "signIn" | "signUp" | "verifySignUp" | "verifySignIn";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tapHaptic = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSignIn = async () => {
    if (!signInLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        strategy: "email_code",
      });

      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
        return;
      }

      if (result.status === "needs_first_factor") {
        const emailCodeFactor = result.supportedFirstFactors?.find(
          (factor): factor is Extract<typeof factor, { strategy: "email_code" }> =>
            factor.strategy === "email_code",
        );
        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        }
        setCode("");
        setMode("verifySignIn");
        return;
      }

      console.warn("[sign-in] unexpected status", { status: result.status });
      setError(`Couldn't send a sign-in code. Status: ${result.status}.`);
    } catch (err: unknown) {
      console.warn("[sign-in] threw", err);
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email.trim() });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      setMode("verifySignUp");
    } catch (err: unknown) {
      console.warn("[sign-up] threw", err);
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "verifySignUp") {
        if (!signUpLoaded) return;
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setActiveSignUp({ session: result.createdSessionId });
        } else {
          setError("Couldn't verify the code. Please try again.");
        }
      } else if (mode === "verifySignIn") {
        if (!signInLoaded) return;
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
        if (result.status === "complete") {
          await setActiveSignIn({ session: result.createdSessionId });
        } else {
          setError("Couldn't verify the code. Please try again.");
        }
      }
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = () => {
    tapHaptic();
    if (mode === "signIn") return handleSignIn();
    if (mode === "signUp") return handleSignUp();
    return handleVerify();
  };

  const isVerify = mode === "verifySignUp" || mode === "verifySignIn";
  const isSignUp = mode === "signUp";

  const submitLabel = isVerify
    ? "Verify and continue"
    : isSignUp
      ? "Create account"
      : "Send sign-in code";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={styles.header}>
          <TapestryLogo size="lg" />
          <Text
            style={[
              type.bodyLarge,
              { color: colors.textSecondary, marginTop: 12, textAlign: "center" },
            ]}
          >
            Where great design hires begin.
          </Text>
        </View>

        <View style={styles.form}>
          {!isVerify ? (
            <>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@studio.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                colors={colors}
              />
              <Text
                style={[
                  type.small,
                  { color: colors.textSecondary, marginTop: -4 },
                ]}
              >
                We'll email you a 6-digit code to sign in.
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  type.body,
                  { color: colors.textSecondary, marginBottom: 8, textAlign: "center" },
                ]}
              >
                We sent a 6-digit code to {email}.
              </Text>
              <Field
                label="Verification code"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                colors={colors}
              />
            </>
          )}

          {error ? (
            <Text style={[type.small, { color: colors.destructive, marginTop: 4 }]}>
              {error}
            </Text>
          ) : null}

          {colors.skin === "android" ? (
            <View style={{ marginTop: 8 }}>
              {submitting ? (
                <View
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 100,
                    },
                  ]}
                >
                  <ActivityIndicator color={colors.primaryForeground} />
                </View>
              ) : (
                <MaterialButton
                  label={submitLabel}
                  onPress={onSubmit}
                  variant="filled"
                  disabled={submitting}
                />
              )}
            </View>
          ) : (
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: submitting ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[type.button, { color: colors.primaryForeground }]}
                >
                  {submitLabel}
                </Text>
              )}
            </Pressable>
          )}

          {!isVerify ? (
            <Pressable
              onPress={() => {
                tapHaptic();
                setError(null);
                setMode(isSignUp ? "signIn" : "signUp");
              }}
              style={styles.switchLink}
            >
              <Text style={[type.small, { color: colors.textSecondary }]}>
                {isSignUp ? "Already have an account?" : "New to Tapestry?"}{" "}
                <Text
                  style={{
                    color: colors.primary,
                    fontFamily:
                      colors.skin === "android" ? fonts.sansMedium : fonts.serifSemiBold,
                  }}
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </Text>
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setMode(mode === "verifySignIn" ? "signIn" : "signUp");
                setCode("");
                setError(null);
              }}
              style={styles.switchLink}
            >
              <Feather name="arrow-left" size={14} color={colors.textSecondary} />
              <Text style={[type.small, { color: colors.textSecondary, marginLeft: 6 }]}>
                Back
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

type TextInputAutoComplete = React.ComponentProps<typeof TextInput>["autoComplete"];

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "sentences";
  autoComplete?: TextInputAutoComplete;
  colors: ReturnType<typeof useColors>;
};

function Field({
  label,
  colors,
  autoComplete,
  ...rest
}: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        {...rest}
        autoComplete={autoComplete}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          colors.skin === "android"
            ? {
                color: colors.foreground,
                backgroundColor: colors.material.surfaceContainerHigh,
                borderColor: "transparent",
                borderRadius: 12,
                fontFamily: fonts.sansRegular,
              }
            : {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                fontFamily: fonts.serifRegular,
              },
        ]}
      />
    </View>
  );
}

function extractError(err: unknown): string {
  if (typeof err === "object" && err && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
    if (errors && errors.length > 0) {
      return errors[0]?.longMessage ?? errors[0]?.message ?? "Something went wrong.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 32,
  },
  header: { alignItems: "center", gap: 4 },
  form: { gap: 16 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  switchLink: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 6,
  },
});
