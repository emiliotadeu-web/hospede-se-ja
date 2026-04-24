import { createClient } from "npm:@supabase/supabase-js@2";

type ExternalCalendar = {
  id: string;
  property_id: string;
  platform: string;
  ical_url: string;
  is_active: boolean;
};

type ParsedEvent = {
  uid: string;
  start_date: string;
  end_date: string;
  notes?: string | null;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function formatICSDateToISO(value: string): string | null {
  const clean = value.trim();

  if (/^\d{8}$/.test(clean)) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  if (/^\d{8}T\d{6}Z?$/.test(clean)) {
    const year = clean.slice(0, 4);
    const month = clean.slice(4, 6);
    const day = clean.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  return null;
}

function unfoldICSLines(icsText: string): string[] {
  const rawLines = icsText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of rawLines) {
    if (!line) continue;

    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function parseICS(icsText: string): ParsedEvent[] {
  const lines = unfoldICSLines(icsText);
  const events: ParsedEvent[] = [];

  let inEvent = false;
  let current: {
    uid?: string;
    start?: string;
    end?: string;
    summary?: string;
  } = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current.uid && current.start && current.end) {
        const startDate = formatICSDateToISO(current.start);
        const endDate = formatICSDateToISO(current.end);

        if (startDate && endDate) {
          events.push({
            uid: current.uid,
            start_date: startDate,
            end_date: endDate,
            notes: current.summary ?? null,
          });
        }
      }

      inEvent = false;
      current = {};
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith("UID:")) {
      current.uid = line.slice(4).trim();
      continue;
    }

    if (line.startsWith("DTSTART")) {
      const idx = line.indexOf(":");
      if (idx !== -1) current.start = line.slice(idx + 1).trim();
      continue;
    }

    if (line.startsWith("DTEND")) {
      const idx = line.indexOf(":");
      if (idx !== -1) current.end = line.slice(idx + 1).trim();
      continue;
    }

    if (line.startsWith("SUMMARY:")) {
      current.summary = line.slice(8).trim();
      continue;
    }
  }

  return events;
}

async function syncOneCalendar(calendar: ExternalCalendar) {
  const response = await fetch(calendar.ical_url, {
    method: "GET",
    headers: {
      "User-Agent": "HospedeSeJa-CalendarSync/1.0",
      Accept: "text/calendar,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ICS (${response.status})`);
  }

  const icsText = await response.text();
  const events = parseICS(icsText);

  const { error: deleteError } = await supabase
    .from("property_blocks")
    .delete()
    .eq("external_calendar_id", calendar.id);

  if (deleteError) {
    throw new Error(`Erro ao limpar bloqueios antigos: ${deleteError.message}`);
  }

  if (events.length > 0) {
    const rows = events.map((event) => ({
      property_id: calendar.property_id,
      source: calendar.platform,
      external_calendar_id: calendar.id,
      start_date: event.start_date,
      end_date: event.end_date,
      external_event_uid: event.uid,
      notes: event.notes ?? null,
    }));

    const { error: insertError } = await supabase
      .from("property_blocks")
      .insert(rows);

    if (insertError) {
      throw new Error(`Erro ao inserir bloqueios: ${insertError.message}`);
    }
  }

  const { error: updateError } = await supabase
    .from("property_external_calendars")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", calendar.id);

  if (updateError) {
    throw new Error(`Erro ao atualizar last_synced_at: ${updateError.message}`);
  }

  return {
    calendar_id: calendar.id,
    property_id: calendar.property_id,
    platform: calendar.platform,
    imported_events: events.length,
  };
}

Deno.serve(async () => {
  try {
    const { data: calendars, error } = await supabase
      .from("property_external_calendars")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const results: Array<Record<string, unknown>> = [];

    for (const calendar of (calendars ?? []) as ExternalCalendar[]) {
      try {
        const result = await syncOneCalendar(calendar);
        results.push({ ok: true, ...result });
      } catch (err) {
        results.push({
          ok: false,
          calendar_id: calendar.id,
          property_id: calendar.property_id,
          platform: calendar.platform,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Erro inesperado",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});