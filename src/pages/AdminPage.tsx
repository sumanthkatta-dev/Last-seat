import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { off, onValue, ref, set, type DataSnapshot } from 'firebase/database';
import { ChevronLeft, Loader2, Lock, MapPin, Plus, Trash2 } from 'lucide-react';
import { database } from '../config/firebase';

type RouteDirection = 'to' | 'from';
type RouteMode = 'replace' | 'add';

interface AdminStop {
  name: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface AdminRouteNode {
  mode?: RouteMode;
  stops?: Record<string, { name?: string; location?: { lat?: number; lng?: number } }> | Array<{ name?: string; location?: { lat?: number; lng?: number } }>;
}

const defaultModes: Record<RouteDirection, RouteMode> = {
  to: 'add',
  from: 'add'
};

const parseStops = (rawStops?: AdminRouteNode['stops']): AdminStop[] => {
  if (!rawStops) {
    return [];
  }

  const entries = Array.isArray(rawStops)
    ? rawStops.map((stop, index) => [String(index), stop] as const)
    : Object.entries(rawStops);

  return entries
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, stop], index) => {
      const name = typeof stop?.name === 'string' && stop.name.trim().length > 0
        ? stop.name
        : `Stop ${index + 1}`;

      const lat = stop?.location?.lat;
      const lng = stop?.location?.lng;

      const hasLocation = typeof lat === 'number' && typeof lng === 'number';

      return {
        name,
        location: hasLocation ? { lat, lng } : undefined
      };
    });
};

const toStopsPayload = (stops: AdminStop[]) =>
  stops.reduce<Record<number, { name: string; location?: { lat: number; lng: number } }>>((acc, stop, index) => {
    const name = stop.name.trim() || `Stop ${index + 1}`;
    acc[index] = {
      name,
      ...(stop.location ? { location: stop.location } : {})
    };
    return acc;
  }, {});

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<RouteDirection>('to');
  const [routeModes, setRouteModes] = useState<Record<RouteDirection, RouteMode>>(defaultModes);
  const [stopsByDirection, setStopsByDirection] = useState<Record<RouteDirection, AdminStop[]>>({
    to: [],
    from: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const configuredPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();
  const selectedStops = useMemo(() => stopsByDirection[selectedDirection], [stopsByDirection, selectedDirection]);
  const selectedMode = routeModes[selectedDirection];

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const adminRoutesRef = ref(database, 'adminRoutes');

    onValue(adminRoutesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val() as { to?: AdminRouteNode; from?: AdminRouteNode } | null;

      setRouteModes({
        to: data?.to?.mode === 'replace' ? 'replace' : 'add',
        from: data?.from?.mode === 'replace' ? 'replace' : 'add'
      });

      setStopsByDirection({
        to: parseStops(data?.to?.stops),
        from: parseStops(data?.from?.stops)
      });

      setIsLoading(false);
      setActionError('');
    }, () => {
      setIsLoading(false);
      setActionError('Unable to load admin routes. Please check Firebase connection.');
    });

    return () => {
      off(adminRoutesRef);
    };
  }, [isAuthorized]);

  const persistDirection = async (direction: RouteDirection, nextStops: AdminStop[], nextMode: RouteMode) => {
    await set(ref(database, `adminRoutes/${direction}`), {
      mode: nextMode,
      stops: toStopsPayload(nextStops)
    });
  };

  const handleUnlock = () => {
    if (!configuredPassword) {
      setPasswordError('Admin password is not configured. Set VITE_ADMIN_PASSWORD in your .env file.');
      return;
    }

    if (passwordInput === configuredPassword) {
      setIsAuthorized(true);
      setPasswordInput('');
      setPasswordError('');
      return;
    }

    setPasswordError('Invalid password. Access denied.');
    setPasswordInput('');
  };

  const updateStopName = (index: number, name: string) => {
    setStopsByDirection((prev) => ({
      ...prev,
      [selectedDirection]: prev[selectedDirection].map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, name } : stop
      )
    }));
  };

  const saveStopName = async () => {
    setIsSaving(true);
    setActionError('');
    try {
      const nextStops = [...selectedStops];
      await persistDirection(selectedDirection, nextStops, selectedMode);
    } catch {
      setActionError('Failed to save stop name. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = async (mode: RouteMode) => {
    setIsSaving(true);
    setActionError('');

    const previousMode = routeModes[selectedDirection];
    setRouteModes((prev) => ({ ...prev, [selectedDirection]: mode }));

    try {
      await persistDirection(selectedDirection, selectedStops, mode);
    } catch {
      setRouteModes((prev) => ({ ...prev, [selectedDirection]: previousMode }));
      setActionError('Failed to update route mode. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const addNewStop = async () => {
    const nextStops = [...selectedStops, { name: `Stop ${selectedStops.length + 1}` }];
    setStopsByDirection((prev) => ({ ...prev, [selectedDirection]: nextStops }));

    setIsSaving(true);
    setActionError('');
    try {
      await persistDirection(selectedDirection, nextStops, selectedMode);
    } catch {
      setActionError('Failed to add stop. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStop = async (index: number) => {
    const nextStops = selectedStops.filter((_, stopIndex) => stopIndex !== index);
    setStopsByDirection((prev) => ({ ...prev, [selectedDirection]: nextStops }));

    setIsSaving(true);
    setActionError('');
    try {
      await persistDirection(selectedDirection, nextStops, selectedMode);
    } catch {
      setActionError('Failed to delete stop. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const setLocationForStop = async (index: number) => {
    if (!navigator.geolocation) {
      setActionError('Geolocation is not supported on this device/browser.');
      return;
    }

    setActionError('');
    setActiveLocationIndex(index);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const nextStops = selectedStops.map((stop, stopIndex) =>
          stopIndex === index ? { ...stop, location } : stop
        );

        setStopsByDirection((prev) => ({ ...prev, [selectedDirection]: nextStops }));

        try {
          await persistDirection(selectedDirection, nextStops, selectedMode);
        } catch {
          setActionError('Location save failed. Please try again.');
        } finally {
          setActiveLocationIndex(null);
        }
      },
      () => {
        setActionError('Unable to capture location. Check permissions and GPS signal.');
        setActiveLocationIndex(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">Admin Access</h1>
          </div>
          <p className="text-sm text-gray-600 mb-4">Enter the admin password to access route builder.</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleUnlock();
              }
            }}
            placeholder="Admin password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {passwordError && <p className="text-sm text-red-600 mb-3">{passwordError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={handleUnlock}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
            Home
          </button>
          {isSaving && (
            <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Route Builder</h1>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Route Direction</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedDirection('to')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold ${
                selectedDirection === 'to' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              To College
            </button>
            <button
              onClick={() => setSelectedDirection('from')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold ${
                selectedDirection === 'from' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              From College
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Merge Mode ({selectedDirection === 'to' ? 'To College' : 'From College'})</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleModeChange('replace')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold ${
                selectedMode === 'replace' ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              Replace existing stops
            </button>
            <button
              onClick={() => handleModeChange('add')}
              className={`py-2 px-3 rounded-lg text-sm font-semibold ${
                selectedMode === 'add' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              Add on top of existing stops
            </button>
          </div>
        </div>

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">Loading admin routes...</div>
          ) : selectedStops.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
              No admin stops added for this route yet.
            </div>
          ) : (
            selectedStops.map((stop, index) => (
              <div key={`${selectedDirection}-${index}`} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-[60px_1fr_auto_auto] gap-3 items-start">
                  <div className="text-sm font-bold text-gray-600">#{index + 1}</div>

                  <div>
                    <input
                      value={stop.name}
                      onChange={(event) => updateStopName(index, event.target.value)}
                      onBlur={saveStopName}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {stop.location
                        ? `Lat: ${stop.location.lat.toFixed(6)}, Lng: ${stop.location.lng.toFixed(6)}`
                        : 'Location not set'}
                    </p>
                  </div>

                  <button
                    onClick={() => setLocationForStop(index)}
                    disabled={activeLocationIndex === index}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                      activeLocationIndex === index
                        ? 'bg-gray-200 text-gray-500 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {activeLocationIndex === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Set Location
                  </button>

                  <button
                    onClick={() => deleteStop(index)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={addNewStop}
          className="mt-4 w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Stop
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
