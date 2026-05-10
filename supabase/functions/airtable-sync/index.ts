import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    const payload = await req.json();

    const AIRTABLE_TOKEN = Deno.env.get("AIRTABLE_TOKEN")!;
    const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID")!;
    const TABLES = JSON.parse(Deno.env.get("AIRTABLE_TABLES")!);

    const type = payload.type;
    const table = payload.table;
    const row = payload.record ?? payload.old_record;

    if (!TABLES[table]) {
        return new Response("unknown table", { status: 400 });
    }

    const airtableTable = TABLES[table];
    const supabaseId = row.id;

    const headers = {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
    };

    const findRecordId = async (id: string) => {
        const url =
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(airtableTable)}?filterByFormula=${encodeURIComponent(`{supabase_id}='${id}'`)}`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        return data.records?.[0]?.id;
    };

    const mapFields = () => {
        if (table === "slots") {
            return {
                supabase_id: row.id,
                start_time: row.start_time,
                end_time: row.end_time,
                max_capacity: row.max_capacity,
                is_active: row.is_active,
                created_at: row.created_at,
            };
        }

        return {
            supabase_id: row.id,
            slot_id: row.slot_id,
            name: row.name,
            phone: row.phone,
            license_plate: row.license_plate,
            vehicle_make_model: row.vehicle_make_model,
            vehicle_color: row.vehicle_color,
            email: row.email,
            status: row.status,
            donated: row.donated,
            created_at: row.created_at,
        };
    };

    const fields = mapFields();

    if (type === "INSERT") {
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(airtableTable)}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ records: [{ fields }] }),
        });
    }

    if (type === "UPDATE") {
        const recordId = await findRecordId(supabaseId);
        if (recordId) {
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(airtableTable)}/${recordId}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ fields }),
            });
        } else {
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(airtableTable)}`, {
                method: "POST",
                headers,
                body: JSON.stringify({ records: [{ fields }] }),
            });
        }
    }

    if (type === "DELETE") {
        const deletedId = payload.old_record?.id ?? supabaseId;
        const recordId = await findRecordId(deletedId);
        if (recordId) {
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(airtableTable)}/${recordId}`, {
                method: "DELETE",
                headers,
            });
        }
    }

    return new Response("ok", { status: 200 });
});