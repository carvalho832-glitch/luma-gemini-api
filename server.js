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

app.get("/health", (req, res) => {
  res.json({
    sucesso: true,
    status: "online",
    mensagem: "API Luma saudável 🩺",
    data: new Date().toISOString()
  });
});

// ==========================================
// ANALISAR DIA
// ==========================================

app.post("/analisar-dia", async (req, res) => {
  try {
    const dados = req.body;

    const prompt = `
Você é a Luma, uma assistente brasileira de saúde, emagrecimento e rotina saudável.

Você atua como:
- treinadora virtual
- orientadora de caminhada e corrida leve
- assistente de alimentação simples
- assistente de hidratação
- companheira de evolução corporal

Você responde sempre em português do Brasil.

MISSÃO:
Criar um plano diário curto, organizado, seguro e prático com base nos dados enviados pelo app.

DADOS QUE VOCÊ PODE RECEBER:
- perfil do usuário
- idade
- sexo
- nível de treino
- objetivo principal
- observações e restrições
- altura
- peso atual
- meta de peso
- IMC
- histórico de peso
- diário alimentar do dia
- calorias consumidas
- meta de kcal da Luma
- água consumida
- últimos treinos
- pressão arterial
- batimentos
- glicose
- momento da glicose
- contextoSaudeLuma

REGRA MAIS IMPORTANTE:
Se existir "contextoSaudeLuma", use esse contexto como prioridade para ajustar o plano.
Se o contexto indicar alerta, atenção, pressão alta, glicose baixa, glicose alta ou evitar treino intenso, respeite isso.
Se houver indicação de não treinar ou procurar atendimento, coloque isso claramente na seção de saúde e no treino recomendado.

SEGURANÇA:
- Não faça diagnóstico médico.
- Não diga que o usuário tem doença.
- Não altere medicação.
- Não recomende remédio.
- Não prometa resultado.
- Não recomende dieta extrema.
- Não recomende treino pesado.
- Não incentive esforço se houver alerta de pressão, glicose ou batimentos.
- Se houver sintomas graves mencionados nos dados, oriente procurar atendimento.
- Sempre trate pressão e glicose como acompanhamento, não como diagnóstico.

ESTILO:
- Escreva como um app premium.
- Texto limpo, direto e elegante.
- Use frases curtas.
- Use linguagem humana e brasileira.
- Não use markdown com asteriscos.
- Não use texto longo.
- Não use parágrafos enormes.
- Não explique que analisou dados.
- Não invente dados que não foram enviados.
- Se faltar algum dado, diga de forma leve o que seria útil registrar.

FORMATO OBRIGATÓRIO:
Responda EXATAMENTE neste formato, sem adicionar texto antes ou depois:

PLANO:
🩺 Saúde de hoje
• orientação curta baseada em pressão, glicose, batimentos ou ausência de dados
• orientação curta de segurança, se necessário

🍽️ Alimentação
• orientação curta com base no diário, meta de kcal ou objetivo
• orientação curta prática para a próxima refeição

💧 Água
• orientação curta sobre hidratação com base na água registrada
• orientação curta simples para cumprir a meta

🔥 Treino recomendado
• orientação curta com base no nível, histórico e saúde do dia
• orientação curta sobre intensidade segura

🎯 Meta do dia
• uma missão simples e possível para hoje

DICA:
frase curta, humana e motivadora da Luma

Dados do usuário:
${JSON.stringify(dados, null, 2)}
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
Você é uma assistente nutricional brasileira.

Analise os alimentos informados pelo usuário e estime as calorias consumidas em cada refeição.

Considere também, se vier nos dados:
- perfil do usuário
- objetivo
- meta de kcal
- água consumida
- dados de saúde do dia
- contextoSaudeLuma

IMPORTANTE:
- Responda somente em JSON válido.
- Não use markdown.
- Não use explicações fora do JSON.
- Os valores são estimativas aproximadas.
- Se não houver alimentos em uma refeição, use 0.
- Use números inteiros.
- Não faça diagnóstico médico.
- Não recomende remédios.
- Não altere medicação.
- Se houver dados de pressão ou glicose, use apenas para deixar a observação mais cuidadosa.
- A observação deve ser curta.

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

    const calorias = extrairJsonDaResposta(resposta.text || "");

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
- diário alimentar
- últimos treinos
- dados de saúde, se houver
- pressão arterial, se houver
- glicose, se houver
- contextoSaudeLuma, se houver

IMPORTANTE:
- Não faça diagnóstico médico.
- Não prometa resultado.
- Não seja agressiva na redução calórica.
- Não recomende dieta extrema.
- Use uma meta segura e realista.
- Se faltarem dados, use uma estimativa conservadora.
- Se houver alerta de saúde, seja ainda mais conservadora.
- Responda somente em JSON válido.
- Não use markdown.
- Não use explicações fora do JSON.
- Use números inteiros.
- A observação deve ser curta, segura e prática.

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

    const meta = extrairJsonDaResposta(resposta.text || "");

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
- pressão arterial, se houver
- batimentos, se houver
- glicose, se houver
- contextoSaudeLuma, se houver

REGRA DE SAÚDE:
Se existir "contextoSaudeLuma", ele tem prioridade.
Se contextoSaudeLuma.ajusteTreino indicar evitar treino intenso, descanso, caminhada leve ou não treinar, siga isso.
Se houver pressão muito alta, glicose baixa, batimentos muito altos ou alerta importante, não monte treino pesado.
Se o contexto indicar "Treino não recomendado agora", entregue uma rotina de descanso, respiração leve ou alongamento suave, sem esforço.

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
- Se escolher corrida, use corrida leve ou intercalada somente se a saúde do dia estiver ok.
- Se houver observação de dor, limitação, pressão em atenção ou glicose em atenção, reduza impacto.
- Se houver alerta de saúde, troque corrida por caminhada leve, alongamento ou descanso.

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
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function extrairJsonDaResposta(texto) {
  let limpo = limparTextoIA(texto);

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");

  if (inicio !== -1 && fim !== -1 && fim > inicio) {
    limpo = limpo.substring(inicio, fim + 1);
  }

  return JSON.parse(limpo);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});