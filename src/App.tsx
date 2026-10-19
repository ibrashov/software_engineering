import { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  DoorClosed,
  CalendarRange,
  Info,
} from "lucide-react";
import {
  type RoomState,
  checkAvailability,
  minutesToLabel,
  labelToMinutes,
} from "@/lib/booking";

const DEFAULT_ROOM: RoomState = {
  name: "Library Study Room B-12",
  blocked: false,
  bookings: [{ start: 600, end: 660 }],
};

const CURRENT_TIME = 540;

function makeTimeOptions(everyMinutes = 15): string[] {
  const options: string[] = [];
  for (let m = 0; m <= 1440; m += everyMinutes) {
    options.push(minutesToLabel(m));
  }
  return options;
}

function App() {
  const [room, setRoom] = useState<RoomState>(DEFAULT_ROOM);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("12:00");
  const [result, setResult] = useState<
    ReturnType<typeof checkAvailability> | null
  >(null);

  const timeOptions = useMemo(() => makeTimeOptions(15), []);
  const startMin = labelToMinutes(startTime);
  const endMin = labelToMinutes(endTime);

  const handleCheck = () => {
    setResult(checkAvailability(room, CURRENT_TIME, startMin, endMin));
  };

  const duration = Math.max(0, endMin - startMin);
  const durationWarn = duration > 120;
  const orderWarn = startMin >= endMin;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <DoorClosed className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Smart Campus Room Checker
            </h1>
          </div>
          <p className="text-sm text-slate-500 sm:text-base">
            Check whether a study room is available for your requested time
            interval.
          </p>
        </header>

        {/* Room summary card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Current time:{" "}
                <span className="font-medium text-slate-700">
                  {minutesToLabel(CURRENT_TIME)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRoom((r) => ({ ...r, blocked: !r.blocked }));
                setResult(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                room.blocked
                  ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {room.blocked ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {room.blocked ? "Blocked" : "Open"}
            </button>
          </div>

          {/* Existing bookings */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <CalendarRange className="h-3.5 w-3.5" />
              Existing bookings today
            </p>
            {room.bookings.length === 0 ? (
              <p className="text-sm text-slate-400">No existing bookings.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {room.bookings.map((b, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                  >
                    {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Booking form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Check availability</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Start time
              </span>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                End time
              </span>
              <select
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {orderWarn && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600">
              <Info className="h-4 w-4 shrink-0" />
              End time must be later than start time.
            </p>
          )}

          {/* Duration hint */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">
              Duration:{" "}
              <span
                className={`font-medium ${
                  durationWarn ? "text-amber-600" : "text-slate-700"
                }`}
              >
                {duration} min
              </span>
              {durationWarn && (
                <span className="text-amber-600">
                  {" "}
                  — exceeds the 120-minute limit.
                </span>
              )}
            </span>
          </div>

          <button
            onClick={handleCheck}
            className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] sm:w-auto sm:px-8"
          >
            Check availability
          </button>
        </section>

        {/* Result */}
        {result && (
          <section className="mt-5">
            <div
              className={`flex items-start gap-3 rounded-2xl border p-5 shadow-sm transition ${
                result.available
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {result.available ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
              )}
              <div>
                <p
                  className={`text-lg font-bold ${
                    result.available ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  {result.available ? "Available" : "Unavailable"}
                </p>
                {!result.available && (
                  <div className="mt-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-red-500">
                      Reason
                    </span>
                    <p className="mt-0.5 text-sm text-red-700">
                      {result.reason}
                    </p>
                  </div>
                )}
                {result.available && (
                  <p className="mt-0.5 text-sm text-emerald-700">
                    Room {room.name} is free from{" "}
                    {minutesToLabel(startMin)} to {minutesToLabel(endMin)}.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Footer note */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          Prototype only — no data is saved or modified.
        </footer>
      </div>
    </div>
  );
}

export default App;
