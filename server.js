// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { FlowiseClient } = require('flowise-sdk'); // SDK oficial
const app = express();
app.use(bodyParser.json());

const FLOWISE_BASE = process.env.FLOWISE_BASE_URL || 'http://localhost:3000';
const CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID || ''; // tu chatflow id
const port = process.env.PORT || 4000;

const flowise = new FlowiseClient({ baseUrl: FLOWISE_BASE });

// Helper: genera prompt estructurado para el flow
function buildPrompt(profile, pretest) {
    return `
Actúa como mentor experto en formación para cuidadores de adultos mayores.
Datos del cuidador:
- Nombre: ${profile.name}
- Experiencia: ${profile.experience}
- Responsabilidades: ${profile.responsibilities}
- Estilos de aprendizaje: ${profile.learningStyles.join(', ') || 'no especificado'}
Resultados pretest:
- Correctas: ${pretest.correct}/${pretest.total}
- Brechas: ${pretest.gaps.join(', ') || 'ninguna'}

Genera:
1) Un plan de estudio de 4 semanas con objetivos semanales.
2) Actividades (explicación corta, ejercicio práctico, recursos: video/artículo/checklist).
3) Recomendaciones para adaptar materiales según estilo de aprendizaje.
4) Puntos de verificación para evaluar progreso.
Devuelve el resultado en texto estructurado en español.
  `;
}

app.post('/generate-plan', async (req, res) => {
    try {
        const { profile, pretest } = req.body;
        const prompt = buildPrompt(profile, pretest);

        // Usamos el SDK: createPrediction (streaming=false)
        const prediction = await flowise.createPrediction({
            chatflowId: CHATFLOW_ID,
            question: prompt,
            streaming: false
        });

        // prediction puede venir con estructura: .data / .result - ajusta según versión del SDK
        // intentamos leer prediction.result o prediction
        const planText = prediction?.result || prediction?.data || JSON.stringify(prediction);

        res.json({ ok: true, plan: String(planText) });
    } catch (err) {
        console.error('generate-plan error', err);
        res.status(500).json({ ok: false, error: String(err) });
    }
});

app.listen(port, () => console.log(`Backend listo en http://localhost:${port}`));