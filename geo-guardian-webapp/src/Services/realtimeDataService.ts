import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "./firebase";

type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds?: number;
};

type DateLikeObject = {
  toDate: () => Date;
};

export type FirestoreDateInput =
  | Date
  | string
  | number
  | FirestoreTimestampLike
  | DateLikeObject
  | null
  | undefined;

type SourceDoc = {
  sourceCollection: string;
  docId: string;
  data: DocumentData;
};

type SubscriptionOptions<T> = {
  collections: string[];
  mapDoc: (doc: SourceDoc) => T | null;
  onData: (data: T[]) => void;
  onError?: (error: Error) => void;
  getMergeKey?: (item: T) => string;
};

export type EmergencyAlertRecord = {
  id: string;
  alertId: string;
  docId: string;
  sourceCollection: string;
  title: string;
  description: string;
  type: string;
  status: string;
  severity: string;
  triggeredBy: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  alertTime: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  touristId: string;
  userId: string;
  assignedOfficerId: string | null;
  raw: DocumentData;
};

export type SafetyScoreRecord = {
  id: string;
  docId: string;
  sourceCollection: string;
  userId: string;
  overallScore: number | null;
  factorScores: Record<string, number>;
  recommendations: string;
  algo: string;
  activeAlerts: string[];
  calculatedAt: Date | null;
  updatedAt: Date | null;
  raw: DocumentData;
};

export type TouristIdentityRecord = {
  id: string;
  touristId: string;
  digitalId: string;
  docId: string;
  sourceCollection: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  emergencyContacts: string[];
  address: string;
  isActive: boolean;
  isVerified: boolean;
  itineraryStartDate: string;
  itineraryEndDate: string;
  itineraryDuration: number | null;
  tripStartDate: Date | null;
  tripEndDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  raw: DocumentData;
};

export type UserProfileRecord = {
  id: string;
  docId: string;
  sourceCollection: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  userType: string;
  isActive: boolean;
  darkMode: boolean;
  locationSharing: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  raw: DocumentData;
};

export type NewUserProfileInput = {
  userId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  userType?: string;
  isActive?: boolean;
  dark_mode?: boolean;
  location_sharing?: boolean;
  [key: string]: unknown;
};

const EMERGENCY_ALERT_COLLECTIONS = [
  "emergency_alerts",
  "emergencyAlerts",
] as const;
const SAFETY_SCORE_COLLECTIONS = ["safety_scores", "safetyScores"] as const;
const TOURIST_ID_COLLECTIONS = [
  "tourist_ids",
  "tourists_ids",
  "touristIds",
  "tourists",
] as const;
const USER_COLLECTIONS = ["users"] as const;

const canUseFirestore = (): boolean =>
  Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID && firestore);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const toBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry : null))
    .filter((entry): entry is string => Boolean(entry));
};

const isTimestampLike = (value: unknown): value is FirestoreTimestampLike =>
  isObject(value) && typeof value.seconds === "number";

const isDateLikeObject = (value: unknown): value is DateLikeObject =>
  isObject(value) && typeof value.toDate === "function";

export const toDate = (value: FirestoreDateInput): Date | null => {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (isDateLikeObject(value)) {
    const converted = value.toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (isTimestampLike(value)) {
    const millis = value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6);
    const converted = new Date(millis);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (typeof value === "number") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (typeof value === "string") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  return null;
};

const toIsoDateString = (value: FirestoreDateInput): string => {
  const parsed = toDate(value);
  if (!parsed) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

const subscribeToAliasedCollections = <T>({
  collections,
  mapDoc,
  onData,
  onError,
  getMergeKey,
}: SubscriptionOptions<T>): Unsubscribe => {
  if (!canUseFirestore()) {
    onData([]);
    return () => {};
  }

  const keySelector = getMergeKey ?? ((item: T) => JSON.stringify(item));
  const stateByCollection = new Map<string, T[]>();

  const emit = () => {
    const merged = new Map<string, T>();
    for (const collectionName of collections) {
      const list = stateByCollection.get(collectionName) ?? [];
      for (const item of list) {
        const mergeKey = keySelector(item);
        if (!merged.has(mergeKey)) {
          merged.set(mergeKey, item);
        }
      }
    }
    onData(Array.from(merged.values()));
  };

  const unsubscribeList = collections.map((collectionName) =>
    onSnapshot(
      collection(firestore, collectionName),
      (snapshot) => {
        const mapped: T[] = snapshot.docs
          .map((docSnapshot) =>
            mapDoc({
              sourceCollection: collectionName,
              docId: docSnapshot.id,
              data: docSnapshot.data(),
            }),
          )
          .filter((item): item is T => item !== null);

        stateByCollection.set(collectionName, mapped);
        emit();
      },
      (error) => {
        if (onError) {
          onError(error as Error);
        }
      },
    ),
  );

  return () => {
    unsubscribeList.forEach((unsubscribe) => unsubscribe());
  };
};

export const subscribeToEmergencyAlerts = (
  onData: (alerts: EmergencyAlertRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  subscribeToAliasedCollections<EmergencyAlertRecord>({
    collections: [...EMERGENCY_ALERT_COLLECTIONS],
    onData,
    onError,
    getMergeKey: (alert) => alert.id,
    mapDoc: ({ sourceCollection, docId, data }) => {
      const alertId =
        toStringValue(data.alertId) ||
        toStringValue(data.id) ||
        toStringValue(data.alert_id) ||
        docId;

      return {
        id: alertId,
        alertId,
        docId,
        sourceCollection,
        title: toStringValue(data.title, "Alert"),
        description: toStringValue(data.description),
        type: toStringValue(data.type, "unknown"),
        status: toStringValue(data.status, "active"),
        severity: toStringValue(data.severity, "medium"),
        triggeredBy: toStringValue(data.triggeredBy),
        address: toStringValue(data.address),
        latitude: toNumber(data.latitude),
        longitude: toNumber(data.longitude),
        alertTime: toDate(data.alertTime ?? data.createdAt),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        touristId: toStringValue(data.touristId),
        userId: toStringValue(data.userId),
        assignedOfficerId: data.assignedOfficerId
          ? toStringValue(data.assignedOfficerId)
          : null,
        raw: data,
      };
    },
  });

export const subscribeToSafetyScores = (
  onData: (scores: SafetyScoreRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  subscribeToAliasedCollections<SafetyScoreRecord>({
    collections: [...SAFETY_SCORE_COLLECTIONS],
    onData,
    onError,
    getMergeKey: (score) => score.id,
    mapDoc: ({ sourceCollection, docId, data }) => {
      const scoreId =
        toStringValue(data.id) ||
        toStringValue(data.scoreId) ||
        toStringValue(data.userId) ||
        docId;

      const factorScores: Record<string, number> = {};
      if (isObject(data.factorScores)) {
        Object.entries(data.factorScores).forEach(([key, value]) => {
          const normalized = toNumber(value);
          if (normalized !== null) {
            factorScores[key] = normalized;
          }
        });
      }

      return {
        id: scoreId,
        docId,
        sourceCollection,
        userId: toStringValue(data.userId),
        overallScore: toNumber(data.overallScore),
        factorScores,
        recommendations: toStringValue(data.recommendations),
        algo: toStringValue(data?.metadata?.algo),
        activeAlerts: toStringArray(data.activeAlerts),
        calculatedAt: toDate(data.calculatedAt),
        updatedAt: toDate(data.updatedAt),
        raw: data,
      };
    },
  });

export const subscribeToTouristIdentities = (
  onData: (tourists: TouristIdentityRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  subscribeToAliasedCollections<TouristIdentityRecord>({
    collections: [...TOURIST_ID_COLLECTIONS],
    onData,
    onError,
    getMergeKey: (tourist) => tourist.id,
    mapDoc: ({ sourceCollection, docId, data }) => {
      const itinerary = isObject(data.itinerary) ? data.itinerary : {};
      const touristId =
        toStringValue(data.touristId) ||
        toStringValue(data.digitalId) ||
        toStringValue(data.id) ||
        docId;

      return {
        id: touristId,
        touristId,
        digitalId: toStringValue(data.digitalId, touristId),
        docId,
        sourceCollection,
        userId: toStringValue(data.userId),
        fullName: toStringValue(data.fullName),
        email: toStringValue(data.email),
        phoneNumber: toStringValue(data.phoneNumber),
        nationality: toStringValue(data.nationality),
        documentType: toStringValue(data.documentType),
        documentNumber: toStringValue(data.documentNumber),
        emergencyContacts: toStringArray(data.emergencyContacts),
        address: toStringValue(data.address),
        isActive: toBoolean(data.isActive, true),
        isVerified: toBoolean(data.isVerified, false),
        itineraryStartDate: toIsoDateString(
          itinerary.startDate ?? data.tripStartDate ?? data.createdAt,
        ),
        itineraryEndDate: toIsoDateString(
          itinerary.endDate ?? data.tripEndDate ?? data.updatedAt,
        ),
        itineraryDuration: toNumber(itinerary.duration),
        tripStartDate: toDate(data.tripStartDate),
        tripEndDate: toDate(data.tripEndDate),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        raw: data,
      };
    },
  });

export const subscribeToUsers = (
  onData: (users: UserProfileRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  subscribeToAliasedCollections<UserProfileRecord>({
    collections: [...USER_COLLECTIONS],
    onData,
    onError,
    getMergeKey: (user) => user.id,
    mapDoc: ({ sourceCollection, docId, data }) => {
      const userId =
        toStringValue(data.userId) || toStringValue(data.id) || docId;

      return {
        id: userId,
        docId,
        sourceCollection,
        userId,
        name: toStringValue(data.name || data.fullName, "Unknown"),
        email: toStringValue(data.email),
        phoneNumber: toStringValue(data.phoneNumber),
        userType: toStringValue(data.userType, "user"),
        isActive: toBoolean(data.isActive, true),
        darkMode: toBoolean(data.dark_mode),
        locationSharing: toBoolean(data.location_sharing, true),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        raw: data,
      };
    },
  });

export const updateEmergencyAlertStatus = async (
  alert: Pick<EmergencyAlertRecord, "sourceCollection" | "docId">,
  status: string,
): Promise<void> => {
  if (!canUseFirestore()) {
    return;
  }
  await updateDoc(doc(firestore, alert.sourceCollection, alert.docId), {
    status,
    updatedAt: new Date(),
  });
};

export const assignEmergencyAlertOfficer = async (
  alert: Pick<EmergencyAlertRecord, "sourceCollection" | "docId">,
  officerId: string,
): Promise<void> => {
  if (!canUseFirestore()) {
    return;
  }
  await updateDoc(doc(firestore, alert.sourceCollection, alert.docId), {
    assignedOfficerId: officerId,
    updatedAt: new Date(),
  });
};

export const createUserProfile = async (
  userInput: NewUserProfileInput,
): Promise<void> => {
  if (!canUseFirestore()) {
    return;
  }

  const now = new Date();
  const payload: DocumentData = {
    userId: toStringValue(userInput.userId) || `USR-${now.getTime()}`,
    name: toStringValue(userInput.name, "Unknown"),
    email: toStringValue(userInput.email),
    phoneNumber: toStringValue(userInput.phoneNumber),
    userType: toStringValue(userInput.userType, "user"),
    isActive:
      typeof userInput.isActive === "boolean" ? userInput.isActive : true,
    dark_mode:
      typeof userInput.dark_mode === "boolean" ? userInput.dark_mode : false,
    location_sharing:
      typeof userInput.location_sharing === "boolean"
        ? userInput.location_sharing
        : true,
    createdAt: now,
    updatedAt: now,
  };

  Object.entries(userInput).forEach(([key, value]) => {
    if (payload[key] === undefined && value !== undefined) {
      payload[key] = value;
    }
  });

  await addDoc(collection(firestore, "users"), payload);
};

export const updateUserActiveStatus = async (
  user: Pick<UserProfileRecord, "sourceCollection" | "docId">,
  isActive: boolean,
): Promise<void> => {
  if (!canUseFirestore()) {
    return;
  }

  await updateDoc(doc(firestore, user.sourceCollection, user.docId), {
    isActive,
    updatedAt: new Date(),
  });
};

export type UserSettingsUpdate = Partial<
  Pick<UserProfileRecord, "darkMode" | "locationSharing">
> & {
  alertThreshold?: number;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  integrationUrls?: {
    lawEnforcementApi?: string;
    emergencyServicesApi?: string;
  };
};

export const updateUserSettings = async (
  user: Pick<UserProfileRecord, "sourceCollection" | "docId">,
  settings: UserSettingsUpdate,
): Promise<void> => {
  if (!canUseFirestore()) {
    return;
  }

  const updates: DocumentData = {
    updatedAt: new Date(),
  };

  if (typeof settings.darkMode === "boolean") {
    updates.dark_mode = settings.darkMode;
  }
  if (typeof settings.locationSharing === "boolean") {
    updates.location_sharing = settings.locationSharing;
  }
  if (typeof settings.alertThreshold === "number") {
    updates.alertThreshold = settings.alertThreshold;
  }
  if (settings.notifications) {
    updates.notifications = {
      email: Boolean(settings.notifications.email),
      sms: Boolean(settings.notifications.sms),
      push: Boolean(settings.notifications.push),
    };
  }
  if (settings.integrationUrls) {
    updates.integrationUrls = {
      lawEnforcementApi:
        typeof settings.integrationUrls.lawEnforcementApi === "string"
          ? settings.integrationUrls.lawEnforcementApi
          : "",
      emergencyServicesApi:
        typeof settings.integrationUrls.emergencyServicesApi === "string"
          ? settings.integrationUrls.emergencyServicesApi
          : "",
    };
  }

  await updateDoc(doc(firestore, user.sourceCollection, user.docId), updates);
};
