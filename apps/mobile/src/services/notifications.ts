import Constants from "expo-constants";
import i18n from "@/lib/i18n";

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const isExpoGo = Constants.appOwnership === "expo";

const getNotifications = () => {
  return require("expo-notifications") as any;
};

/**
 * Register device for push notifications
 */
export async function registerForPushNotifications() {
  if (isExpoGo) {
    return null;
  }
  try {
    const Notifications = getNotifications();
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Send token to backend
    await fetch(`${API_URL}/notifications/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token.data,
        platform: Constants.platform?.ios ? "ios" : "android",
      }),
    });

    return token.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Send local notification for wicket
 */
export async function notifyWicket(batsmanName: string) {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("match.wicket"),
      body: i18n.t("notification.wicket", { batsman: batsmanName }),
      sound: true,
      data: { type: "wicket" },
    },
    trigger: null,
  });
}

/**
 * Send local notification for match start
 */
export async function notifyMatchStart(team1Name: string, team2Name: string, matchId: string) {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("match.start"),
      body: i18n.t("notification.matchStart", { team1: team1Name, team2: team2Name }),
      sound: true,
      data: { type: "match_start", matchId },
    },
    trigger: null,
  });
}

/**
 * Send local notification for match update
 */
export async function notifyMatchUpdate(teamName: string, score: string) {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("liveScore"),
      body: i18n.t("notification.matchUpdate", { team: teamName, score }),
      sound: false,
      data: { type: "match_update" },
    },
    trigger: null,
  });
}

