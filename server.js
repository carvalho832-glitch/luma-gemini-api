import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());

app.use(express.json({
  limit: "2mb"
}));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.send("API Luma Gemini funcionando 🚀");
});

app.post("/analisar-dia", async (req, res) => {
  try {
    const dados = req.body;

    const prompt = `
Você é uma treinadora virtual especialista em:

- emagrecimento
- alimentação
- caminhada
- corrida
- hidratação
- evolução corporal

Você responde sempre em português do Brasil.

NUNCA faça diagnóstico médico.

Crie uma resposta motivadora, humana e prática.

Dados do usuário:
${JSON.stringify(dados, null, 2)}

Responda EXATAMENTE neste formato:

PLANO:
• item
• item
• item

DICA:
texto motivador curto
`;

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const texto = resposta.text;

    res.json({
      sucesso: true,
      resposta: texto
    });

  } catch (erro) {
    console.error("ERRO GEMINI:", erro);

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao gerar resposta da IA"
    });
  }
});

app.post("/calcular-calorias", async (req, res) => {
  try {
    const dados = req.body;

    const prompt = `
Você é uma assistente nutricional.

Analise os alimentos informados pelo usuário e estime as calorias consumidas em cada refeição.

IMPORTANTE:
- Responda somente em JSON válido.
- Não use markdown.
- Não use explicações fora do JSON.
- Os valores são estimativas aproximadas.
- Se não houver alimentos em uma refeição, use 0.
- Use números inteiros.

Dados recebidos:
${JSON.stringify(dados, null, 2)}

Responda exatamente neste formato:

{
  "cafe": 0,
  "almoco": 0,
  "jantar": 0,
  "total": 0,
  "observacao": "estimativa aproximada"
}
`;

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    let texto = resposta.text || "";

    texto = texto
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const calorias = JSON.parse(texto);

    res.json({
      sucesso: true,
      calorias
    });

  } catch (erro) {
    console.error("ERRO CALORIAS:", erro);

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao calcular calorias"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});