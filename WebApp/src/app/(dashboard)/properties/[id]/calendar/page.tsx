"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Calendar, dateFnsLocalizer, SlotInfo, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { StayForm } from "@/components/stays/StayForm";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

interface Stay {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  welcomeNote: string | null;
  occasion: string | null;
  status: string;
}

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Stay;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#0d9488",
  upcoming: "#2563eb",
  completed: "#6b7280",
  cancelled: "#dc2626",
};

export default function CalendarPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStay, setEditingStay] = useState<Stay | null>(null);
  const [defaultDates, setDefaultDates] = useState<{
    checkIn: string;
    checkOut: string;
  } | null>(null);

  const fetchStays = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/stays`);
      if (res.ok) {
        const data = await res.json();
        setStays(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchStays();
  }, [fetchStays]);

  const events: CalendarEvent[] = useMemo(
    () =>
      stays.map((stay) => ({
        id: stay.id,
        title: stay.guestName,
        start: new Date(stay.checkIn),
        end: new Date(stay.checkOut),
        resource: stay,
      })),
    [stays]
  );

  function handleSelectSlot(slotInfo: SlotInfo) {
    const checkIn = format(slotInfo.start, "yyyy-MM-dd");
    const checkOut = format(slotInfo.end, "yyyy-MM-dd");
    setEditingStay(null);
    setDefaultDates({ checkIn, checkOut });
    setShowModal(true);
  }

  function handleSelectEvent(event: CalendarEvent) {
    setEditingStay(event.resource);
    setDefaultDates(null);
    setShowModal(true);
  }

  function handleSave() {
    setShowModal(false);
    setEditingStay(null);
    setDefaultDates(null);
    fetchStays();
  }

  function handleClose() {
    setShowModal(false);
    setEditingStay(null);
    setDefaultDates(null);
  }

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.resource.status] || "#0d9488",
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      fontSize: "0.8rem",
      padding: "2px 6px",
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
        <button
          onClick={() => {
            setEditingStay(null);
            setDefaultDates(null);
            setShowModal(true);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
        >
          Add Stay
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize text-gray-600">{status}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-gray-400">
          Loading calendar...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-hidden">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            style={{ height: 600 }}
            views={["month", "week", "agenda"]}
            defaultView="month"
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl mx-4">
            <StayForm
              propertyId={propertyId}
              stay={editingStay ?? undefined}
              defaultCheckIn={defaultDates?.checkIn}
              defaultCheckOut={defaultDates?.checkOut}
              onSave={handleSave}
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
