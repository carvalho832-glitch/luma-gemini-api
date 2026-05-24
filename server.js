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
Você é a Luma, uma treinadora virtual brasileira especialista em:

- emagrecimento
- alimentação
- caminhada
- corrida leve
- hidratação
- evolução corporal

Você responde sempre em português do Brasil.

Use os dados do usuário para criar uma orientação simples, prática e motivadora.

IMPORTANTE:
- Não faça diagnóstico médico.
- Não use texto longo.
- Não use markdown com asteriscos.
- Não use explicações grandes.
- Escreva como um app premium: direto, limpo e elegante.
- Use frases curtas.
- Seja humana, positiva e prática.

Dados do usuário:
${JSON.stringify(dados, null, 2)}

Responda EXATAMENTE neste formato, sem adicionar texto fora dele:

PLANO:
• orientação curta
• orientação curta
• orientação curta

DICA:
frase motivadora curta
`;

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const texto = limparTextoIA(resposta.text || "");

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
// CALCULAR CALORIAS DAS REFEIÇÕES
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
// CALCULAR META DIÁRIA DE KCAL
// ==========================================

app.post("/calcular-meta-kcal", async (req, res) => {
  try {
    const dados = req.body;

    const prompt = `
Você é a Luma, uma assistente nutricional brasileira focada em emagrecimento saudável e orientação prática.

Sua missão é estimar uma meta diária de calorias para o usuário com base nos dados recebidos.

Considere:
- nome, se houver
- idade
- sexo
- peso atual
- altura
- IMC
- meta de peso
- objetivo principal
- nível de treino
- histórico de peso
- observações ou restrições

IMPORTANTE:
- Não faça diagnóstico médico.
- Não prometa resultado.
- Não seja agressiva na redução calórica.
- Não recomende dieta extrema.
- Use uma meta segura e realista.
- Se faltarem dados, use uma estimativa conservadora.
- Responda somente em JSON válido.
- Não use markdown.
- Não use explicações fora do JSON.
- Use números inteiros.

Dados recebidos:
${JSON.stringify(dados, null, 2)}

Responda exatamente neste formato:

{
  "metaKcal": 1800,
  "faixaMin": 1700,
  "faixaMax": 2000,
  "status": "Meta estimada pela Luma",
  "observacao": "Meta aproximada para apoiar sua rotina. Ajuste com profissional de saúde se necessário."
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

    const meta = JSON.parse(texto);

    res.json({
      sucesso: true,
      meta
    });

  } catch (erro) {
    console.error("ERRO META KCAL:", erro);

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao calcular meta de calorias"
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
Você é a Luma, uma treinadora virtual brasileira especializada em emagrecimento, caminhada, corrida leve e exercícios para iniciantes.

Sua missão é montar um treino CURTO, PRÁTICO, SEGURO e com cara de app premium.

Considere:
- nome do usuário, se houver
- idade, se houver
- sexo, se houver
- nível de treino, se houver
- objetivo principal, se houver
- observações ou restrições, se houver
- peso atual
- altura
- IMC
- meta de peso
- histórico de peso
- calorias do diário alimentar
- água consumida
- últimos treinos
- tipo de atividade escolhida
- segurança articular
- foco em perda de gordura

REGRAS IMPORTANTES:
- Não faça diagnóstico médico.
- Não recomende treino pesado.
- Não use texto longo.
- Não escreva explicações grandes.
- Não use parágrafos enormes.
- Não diga que analisou dados detalhadamente.
- Não use markdown com asteriscos.
- Use frases curtas.
- O treino precisa caber bem na tela do celular.
- Máximo de 4 exercícios.
- Cada exercício deve ter série e repetição.
- Se houver pouco histórico, monte treino iniciante.
- Se houver muitos treinos recentes, sugira recuperação ativa.
- Se o usuário escolher caminhada, priorize caminhada.
- Se escolher corrida, use corrida leve ou intercalada.
- Se houver observação de dor ou limitação, reduza impacto.

Dados do usuário:
${JSON.stringify(dados, null, 2)}

Responda EXATAMENTE neste formato, sem adicionar textos fora dele:

🏃 AQUECIMENTO
• item curto

💪 EXERCÍCIOS
• exercício - séries/repetições
• exercício - séries/repetições
• exercício - séries/repetições
• exercício - séries/repetições

🔥 CARDIO
• orientação curta

🧘 ALONGAMENTO
• orientação curta

💜 FOCO DA LUMA
frase motivadora curta
`;

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const texto = limparTextoIA(resposta.text || "");

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

// ==========================================
// UTILITÁRIOS
// ==========================================

function limparTextoIA(texto) {
  return String(texto || "")
    .replace(/\*\*/g, "")
    .replace(/```/g, "")
    .trim();
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});