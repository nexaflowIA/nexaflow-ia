exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido. Usa POST." }) };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: "No hay una IA externa configurada. La web seguirá ofreciendo la ayuda básica local." }) };
  }
  let message;
  try {
    const body = JSON.parse(event.body || "{}");
    message = typeof body.message === "string" ? body.message.trim() : "";
  } catch (_) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "El mensaje enviado no es válido." }) };
  }
  if (!message) return { statusCode: 400, headers, body: JSON.stringify({ error: "Escribe una pregunta antes de enviar." }) };
  if (message.length > 6000) return { statusCode: 413, headers, body: JSON.stringify({ error: "El mensaje es demasiado largo. Resume la pregunta e inténtalo de nuevo." }) };
  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: "Eres el asistente de NexaFlow IA. Responde en español con tono profesional, cercano y claro. Ayuda con tareas empresariales generales. No inventes datos específicos sobre NexaFlow IA ni afirmes haber realizado acciones externas. No pidas contraseñas ni datos bancarios.",
        input: message, max_output_tokens: 700
      })
    });
    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const detail = result.error && result.error.message ? result.error.message : "El servicio de IA ha devuelto un error.";
      return { statusCode: 502, headers, body: JSON.stringify({ error: detail }) };
    }
    const reply = (result.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("\n").trim();
    return { statusCode: 200, headers, body: JSON.stringify({ reply: reply || "No he podido generar una respuesta. Prueba con otra pregunta." }) };
  } catch (_) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: "No se ha podido contactar con el servicio de IA. Inténtalo de nuevo." }) };
  }
};
