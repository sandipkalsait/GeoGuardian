// src/services/PoliceService.ts
import {
  ref as dbRef,
  push,
  set,
  update,
  get,
  onValue,
  remove,
  child,
} from "firebase/database";
import { db } from "./firebase.ts";
import { generateId } from "../utils/generateId.ts";

export type IncidentStatus = "unassigned" | "dispatched" | "resolved";
export interface Incident {
  id: string;
  touristId?: string | null;
  type: string;
  description?: string;
  lat?: number | null;
  lng?: number | null;
  severity?: "Low" | "Medium" | "High" | "Critical";
  timestamp: string; // ISO string
  status: IncidentStatus;
  assignedUnitId?: string | null;
  responseTimeMin?: number | null;
}

export type UnitStatus = "available" | "responding" | "offline";
export interface Unit {
  id: string;
  name: string;
  type?: string;
  lat?: number | null;
  lng?: number | null;
  status: UnitStatus;
  lastUpdated?: string; // ISO
}

// LocalStorage keys
const LS_INCIDENTS = "geo_incidents_v1";
const LS_UNITS = "geo_units_v1";

// Simple detection whether Firebase is configured
const useFirebase = () => Boolean(db);

// ----- helpers for local storage ----- //
const readLS = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (err) {
    console.error("LS read error", err);
    return [];
  }
};

const writeLS = <T>(key: string, arr: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    console.error("LS write error", err);
  }
};

// ----- Firebase <> Local helpers ----- //
const snapshotToArray = (obj: Record<string, any> | null) => {
  if (!obj) return [];
  return Object.entries(obj).map(([key, val]) => ({ id: key, ...val }));
};

// ----- Public Service ----- //
class PoliceService {
  // real-time listeners
  listenIncidents(cb: (incidents: Incident[]) => void) {
    if (useFirebase()) {
      const ref = dbRef(db!, "incidents");
      const unsub = onValue(ref, (snap) => {
        const data = snap.val() || null;
        const arr = snapshotToArray(data).map((i) => ({ ...(i as any) } as Incident));
        // sort by timestamp desc
        arr.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
        cb(arr);
      });
      return unsub;
    } else {
      // local storage fallback (emit once)
      const arr = readLS<Incident>(LS_INCIDENTS).sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      cb(arr);
      // Return a noop unsubscribe
      return () => {};
    }
  }

  listenUnits(cb: (units: Unit[]) => void) {
    if (useFirebase()) {
      const ref = dbRef(db!, "units");
      const unsub = onValue(ref, (snap) => {
        const data = snap.val() || null;
        const arr = snapshotToArray(data).map((u) => ({ ...(u as any) } as Unit));
        cb(arr);
      });
      return unsub;
    } else {
      const arr = readLS<Unit>(LS_UNITS);
      cb(arr);
      return () => {};
    }
  }

  // create a new incident (SOS)
  async createIncident(payload: Partial<Incident>) {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: payload.id || generateId("INC"),
      type: payload.type || "SOS",
      description: payload.description || "",
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      severity: payload.severity || "Medium",
      timestamp: payload.timestamp || now,
      status: "unassigned",
      assignedUnitId: payload.assignedUnitId ?? null,
      responseTimeMin: payload.responseTimeMin ?? null,
    };

    if (useFirebase()) {
      // push to firebase so key matches node key
      const listRef = dbRef(db!, "incidents");
      // Use push to generate a key, but we want to use our id as key for predictable ids, so set at id.
      await set(dbRef(db!, `incidents/${incident.id}`), incident);
      return incident;
    } else {
      const arr = readLS<Incident>(LS_INCIDENTS);
      arr.unshift(incident);
      writeLS(LS_INCIDENTS, arr);
      return incident;
    }
  }

  // assign unit to incident (updates both incident & unit)
  async assignUnit(incidentId: string, unitId: string) {
    const now = new Date().toISOString();

    if (useFirebase()) {
      // Try to get current incident to read assignedUnitId (if any)
      const incidentSnap = await get(dbRef(db!, `incidents/${incidentId}`));
      const incidentVal = incidentSnap.val() || null;

      const updates: Record<string, any> = {};
      updates[`incidents/${incidentId}/assignedUnitId`] = unitId;
      updates[`incidents/${incidentId}/status`] = "dispatched";
      updates[`incidents/${incidentId}/dispatchedAt`] = now;
      updates[`units/${unitId}/status`] = "responding";
      updates[`units/${unitId}/lastUpdated`] = now;

      await update(dbRef(db!, "/"), updates);
      // return updated incident (best-effort)
      const updatedSnap = await get(dbRef(db!, `incidents/${incidentId}`));
      return { id: incidentId, ...(updatedSnap.val() || {}) } as Incident;
    } else {
      // local storage fallback
      const incs = readLS<Incident>(LS_INCIDENTS);
      const units = readLS<Unit>(LS_UNITS);
      const incIndex = incs.findIndex((i) => i.id === incidentId);
      const unitIndex = units.findIndex((u) => u.id === unitId);

      if (incIndex >= 0) {
        incs[incIndex] = { ...incs[incIndex], assignedUnitId: unitId, status: "dispatched" };
      }
      if (unitIndex >= 0) {
        units[unitIndex] = { ...units[unitIndex], status: "responding", lastUpdated: now };
      }
      writeLS(LS_INCIDENTS, incs);
      writeLS(LS_UNITS, units);
      return incs[incIndex];
    }
  }

  // resolve incident, optionally free assigned unit (set unit to available)
  async resolveIncident(incidentId: string) {
    const now = new Date().toISOString();

    if (useFirebase()) {
      // Get incident to find assignedUnitId
      const snap = await get(dbRef(db!, `incidents/${incidentId}`));
      const incident = snap.val() || null;
      const updates: Record<string, any> = {};
      updates[`incidents/${incidentId}/status`] = "resolved";
      updates[`incidents/${incidentId}/resolvedAt`] = now;
      if (incident && incident.assignedUnitId) {
        updates[`units/${incident.assignedUnitId}/status`] = "available";
        updates[`units/${incident.assignedUnitId}/lastUpdated`] = now;
      }
      await update(dbRef(db!, "/"), updates);
      const updated = await get(dbRef(db!, `incidents/${incidentId}`));
      return { id: incidentId, ...(updated.val() || {}) } as Incident;
    } else {
      const incs = readLS<Incident>(LS_INCIDENTS);
      const units = readLS<Unit>(LS_UNITS);
      const incIndex = incs.findIndex((i) => i.id === incidentId);
      if (incIndex === -1) throw new Error("Incident not found in local storage");
      const assignedUnitId = incs[incIndex].assignedUnitId;
      incs[incIndex] = { ...incs[incIndex], status: "resolved", resolvedAt: now } as any;
      if (assignedUnitId) {
        const uidx = units.findIndex((u) => u.id === assignedUnitId);
        if (uidx >= 0) units[uidx] = { ...units[uidx], status: "available", lastUpdated: now };
      }
      writeLS(LS_INCIDENTS, incs);
      writeLS(LS_UNITS, units);
      return incs[incIndex];
    }
  }

  async updateUnitStatus(unitId: string, status: UnitStatus) {
    const now = new Date().toISOString();
    if (useFirebase()) {
      await update(dbRef(db!, `units/${unitId}`), { status, lastUpdated: now });
      const updated = await get(dbRef(db!, `units/${unitId}`));
      return { id: unitId, ...(updated.val() || {}) } as Unit;
    } else {
      const units = readLS<Unit>(LS_UNITS);
      const idx = units.findIndex((u) => u.id === unitId);
      if (idx === -1) throw new Error("Unit not found");
      units[idx] = { ...units[idx], status, lastUpdated: now };
      writeLS(LS_UNITS, units);
      return units[idx];
    }
  }

  // utility: create a unit (for admin / initial seed)
  async createUnit(u: Partial<Unit>) {
    const now = new Date().toISOString();
    const unit: Unit = {
      id: u.id || generateId("U"),
      name: u.name || "Unit",
      type: u.type || "unknown",
      lat: u.lat ?? null,
      lng: u.lng ?? null,
      status: u.status || "available",
      lastUpdated: now,
    };

    if (useFirebase()) {
      await set(dbRef(db!, `units/${unit.id}`), unit);
      return unit;
    } else {
      const units = readLS<Unit>(LS_UNITS);
      units.push(unit);
      writeLS(LS_UNITS, units);
      return unit;
    }
  }

  // optional helper: seed demo data (only if none exists)
  async seedIfEmpty() {
    if (useFirebase()) {
      // check units and incidents
      const unitsSnap = await get(dbRef(db!, "units"));
      const incSnap = await get(dbRef(db!, "incidents"));
      if (!unitsSnap.exists()) {
        const demoUnits: Record<string, Unit> = {
          "U-10": { id: "U-10", name: "Patrol Car 10", type: "car", lat: 19.9345, lng: 73.8555, status: "available", lastUpdated: new Date().toISOString() },
          "U-11": { id: "U-11", name: "Patrol Bike 11", type: "bike", lat: 19.9320, lng: 73.8570, status: "responding", lastUpdated: new Date().toISOString() },
          "U-12": { id: "U-12", name: "Foot Patrol 12", type: "foot", lat: 19.9305, lng: 73.8530, status: "available", lastUpdated: new Date().toISOString() },
        };
        await update(dbRef(db!, "units"), demoUnits);
      }
      if (!incSnap.exists()) {
        const demoIncidents: Record<string, Incident> = {
          "INC-1001": { id: "INC-1001", touristId: "T-501" as any, type: "SOS", severity: "Critical", description: "Solo tourist pressed panic near Old Fort", lat: 19.9315, lng: 73.8567, timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), status: "unassigned", assignedUnitId: null, responseTimeMin: null },
          "INC-1002": { id: "INC-1002", touristId: "T-502" as any, type: "Geo-fence breach", severity: "High", description: "Group entered restricted zone near heritage site", lat: 19.9340, lng: 73.8540, timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(), status: "dispatched", assignedUnitId: "U-11", responseTimeMin: 18 },
        };
        await update(dbRef(db!, "incidents"), demoIncidents);
      }
    } else {
      const incs = readLS<Incident>(LS_INCIDENTS);
      const units = readLS<Unit>(LS_UNITS);
      if (units.length === 0) {
        await this.createUnit({ id: "U-10", name: "Patrol Car 10", type: "car" });
        await this.createUnit({ id: "U-11", name: "Patrol Bike 11", type: "bike", status: "responding" });
      }
      if (incs.length === 0) {
        await this.createIncident({ id: "INC-1001", type: "SOS", description: "Demo incident", severity: "Critical", timestamp: new Date().toISOString() });
      }
    }
  }
}

export const policeService = new PoliceService();
