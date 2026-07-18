export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { question, notes } = req.body ?? {};
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY no está configurada en el servidor." });
  }

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Pregunta inválida." });
  }

  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: "Notas inválidas." });
  }

  try {
    const prompt = `Responde brevemente a la siguiente pregunta en español usando únicamente la información disponible en estas notas. Si no hay datos suficientes, explica que no está en las notas.\n\nNotas:\n${notes
      .map((nota, index) => `Nota ${index + 1}: Título: ${nota.titulo}. Categoría: ${nota.categoria}. Contenido: ${nota.contenido}`)
      .join("\n")}\n\nPregunta: ${question}`;

    const response = await fetch("https://api.groq.com/v1/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "groq-1",
        prompt,
        max_output_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    const answer = result?.output?.[0]?.content?.[0] || result?.output_text || "No se pudo procesar la respuesta.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Error interno del servidor." });
  }
}
