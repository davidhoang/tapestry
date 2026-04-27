import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Alert, Platform, Share } from "react-native";

import type { DesignerDetails } from "@/lib/api";

/**
 * Open the OS share sheet with a prefilled message about a designer.
 * Uses React Native's built-in `Share` (which is universally available)
 * and falls back to `expo-sharing` if needed.
 */
export async function shareDesigner(designer: Pick<
  DesignerDetails,
  "name" | "title" | "company" | "linkedIn" | "website" | "email"
>) {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  const titleLine = [designer.title, designer.company].filter(Boolean).join(" at ");
  const lines = [
    `${designer.name}${titleLine ? ` — ${titleLine}` : ""}`,
    designer.website ? `Site: ${designer.website}` : null,
    designer.linkedIn ? `LinkedIn: ${designer.linkedIn}` : null,
    designer.email ? `Email: ${designer.email}` : null,
  ].filter(Boolean) as string[];

  const message = lines.join("\n");

  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message, url: designer.website ?? designer.linkedIn ?? "" }
        : { message, title: designer.name },
    );
  } catch {
    // Fall back to expo-sharing for environments where Share fails.
    if (await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(designer.website ?? designer.linkedIn ?? "");
      } catch {
        /* user dismissed */
      }
    }
  }
}

/**
 * Save the designer to the device's address book. Prompts for permission
 * the first time, then writes a Contact with email/phone/url filled in
 * where available.
 */
export async function saveDesignerToContacts(designer: Pick<
  DesignerDetails,
  "name" | "title" | "company" | "email" | "phoneNumber" | "linkedIn" | "website"
>): Promise<{ ok: boolean; reason?: string }> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "Contacts aren't available on web." };
  }

  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, reason: "Permission was declined." };
  }

  const [firstName, ...rest] = designer.name.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const contact: Contacts.Contact = {
    contactType: Contacts.ContactTypes.Person,
    name: designer.name,
    firstName: firstName ?? designer.name,
    lastName,
    company: designer.company ?? undefined,
    jobTitle: designer.title ?? undefined,
    emails: designer.email
      ? [{ email: designer.email, label: "work", isPrimary: true }]
      : undefined,
    phoneNumbers: designer.phoneNumber
      ? [{ number: designer.phoneNumber, label: "mobile", isPrimary: true }]
      : undefined,
    urlAddresses: [
      designer.website ? { url: designer.website, label: "homepage" } : null,
      designer.linkedIn ? { url: designer.linkedIn, label: "LinkedIn" } : null,
    ].filter((u): u is { url: string; label: string } => u !== null),
  } as Contacts.Contact;

  try {
    await Contacts.addContactAsync(contact);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Couldn't save the contact.",
    };
  }
}

/** Convenience wrapper that shows a native alert with the result. */
export async function saveDesignerToContactsWithAlert(designer: Parameters<typeof saveDesignerToContacts>[0]) {
  const result = await saveDesignerToContacts(designer);
  if (result.ok) {
    Alert.alert("Saved to contacts", `${designer.name} is now in your address book.`);
  } else if (result.reason) {
    Alert.alert("Couldn't save contact", result.reason);
  }
}
