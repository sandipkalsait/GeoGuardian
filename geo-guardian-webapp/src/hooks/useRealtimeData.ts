import { useEffect, useMemo, useState } from "react";
import {
  subscribeToEmergencyAlerts,
  subscribeToSafetyScores,
  subscribeToTouristIdentities,
  subscribeToUsers,
  type EmergencyAlertRecord,
  type SafetyScoreRecord,
  type TouristIdentityRecord,
  type UserProfileRecord,
} from "../Services/realtimeDataService";

type SubscribeFn<T> = (
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
) => () => void;

type RealtimeState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
};

const useRealtimeSubscription = <T,>(
  subscribeFn: SubscribeFn<T>,
): RealtimeState<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeFn(
      (items) => {
        if (!mounted) {
          return;
        }
        setData(items);
        setLoading(false);
      },
      (subscribeError) => {
        if (!mounted) {
          return;
        }
        setError(subscribeError.message || "Realtime subscription failed");
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [subscribeFn]);

  return { data, loading, error };
};

export const useEmergencyAlertsRealtime = (): RealtimeState<EmergencyAlertRecord> =>
  useRealtimeSubscription(subscribeToEmergencyAlerts);

export const useSafetyScoresRealtime = (): RealtimeState<SafetyScoreRecord> =>
  useRealtimeSubscription(subscribeToSafetyScores);

export const useTouristsRealtime = (): RealtimeState<TouristIdentityRecord> =>
  useRealtimeSubscription(subscribeToTouristIdentities);

export const useUsersRealtime = (): RealtimeState<UserProfileRecord> =>
  useRealtimeSubscription(subscribeToUsers);

export const useGeoGuardianRealtimeData = () => {
  const emergencyAlerts = useEmergencyAlertsRealtime();
  const safetyScores = useSafetyScoresRealtime();
  const tourists = useTouristsRealtime();
  const users = useUsersRealtime();

  return useMemo(
    () => ({
      emergencyAlerts,
      safetyScores,
      tourists,
      users,
      loading:
        emergencyAlerts.loading ||
        safetyScores.loading ||
        tourists.loading ||
        users.loading,
      error:
        emergencyAlerts.error ||
        safetyScores.error ||
        tourists.error ||
        users.error,
    }),
    [emergencyAlerts, safetyScores, tourists, users],
  );
};

