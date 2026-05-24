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

// ==========================================
// ANALISAR DIA
// ==========================================

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

// ==========================================
// CALCULAR CALORIAS
// ==========================================

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

// ==========================================
// GERAR TREINO COM IA
// ==========================================

app.post("/gerar-treino", async (req, res) => {
  try {
    const dados = req.body;

    const prompt = `
Você é uma treinadora virtual especialista em emagrecimento, caminhada, corrida leve e exercícios para iniciantes.

Sua missão é criar um treino REALISTA, SEGURO, MOTIVADOR e adequado ao contexto do usuário.

Considere cuidadosamente:
- peso atual
- altura
- IMC
- meta de peso
- histórico de peso
- consumo de água
- calorias do diário alimentar
- últimos treinos registrados
- nível provável do usuário
- foco em perda de gordura
- segurança articular

IMPORTANTE:
- Não faça diagnóstico médico.
- Não prescreva treino extremo.
- Não use linguagem técnica demais.
- Não recomende carga pesada.
- Priorize caminhada, corrida leve e exercícios com peso corporal.
- Caso os dados indiquem pouco histórico, monte um treino iniciante.
- Caso haja muitos treinos recentes, sugira recuperação ativa.
- Se houver sinais de excesso, reduza intensidade.
- Seja direto, humano e motivador.

Dados do usuário:
${JSON.stringify(dados, null, 2)}

Responda EXATAMENTE neste formato:

TREINO:
🏃 Aquecimento:
texto curto

💪 Exercícios:
• exercício 1
• exercício 2
• exercício 3
• exercício 4

🔥 Cardio:
texto curto

🧘 Alongamento:
texto curto

MOTIVAÇÃO:
frase motivadora curta
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
    console.error("ERRO TREINO:", erro);

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao gerar treino"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});