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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
