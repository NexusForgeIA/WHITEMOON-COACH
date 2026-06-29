import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// alejandr-notify — notifica por WhatsApp un nuevo lead del chatbot de Alejandra Mencias.
// Mantiene la CALLMEBOT_APIKEY EXCLUSIVAMENTE server-side. Mismo patron que chefka-notify.
//
// La CALLMEBOT_APIKEY del proyecto esta vinculada al numero de Cristobal (WhiteMoon),
// por eso el aviso se entrega a WA_NUMBER (34643199580 por defecto).
//
// Recibe (POST JSON): { nombre, telefono, servicio }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const data = (payload.args ?? payload) as Record<string, unknown>;
  const nombre = String(data.nombre ?? "").trim() || "-";
  const telefono = String(data.telefono ?? "").trim() || "-";
  const servicio = String(data.servicio ?? "").trim() || "-";

  const message =
    `LEAD ALEJANDRA MENCIAS\n` +
    `Nombre: ${nombre}\n` +
    `Telefono: ${telefono}\n` +
    `Servicio: ${servicio}`;

  const waNumber = Deno.env.get("WA_NUMBER") ?? "34643199580";

  let notified = false;
  try {
    const callmebotKey = Deno.env.get("CALLMEBOT_APIKEY");
    if (callmebotKey) {
      const notifyUrl =
        `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(waNumber)}` +
        `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(callmebotKey)}`;
      const r = await fetch(notifyUrl);
      notified = r.ok;
      if (!r.ok) {
        console.warn("[alejandr-notify] CallMeBot fallo:", r.status);
      }
    } else {
      console.warn("[alejandr-notify] sin CALLMEBOT_APIKEY, mensaje:", message);
    }
  } catch (e) {
    console.warn("[alejandr-notify] error enviando WhatsApp:", e);
  }

  return json({ ok: true, notified });
});
