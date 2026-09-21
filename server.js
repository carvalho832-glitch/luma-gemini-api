import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());

app.use(express.json({
  limit: "12mb"
}));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODELO_PRINCIPAL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const MODELO_FALLBACK = "gemini-2.5-flash";

async function gerarConteudoIA(config = {}) {
  const modelos = [...new Set([MODELO_PRINCIPAL, MODELO_FALLBACK].filter(Boolean))];
  let ultimoErro = null;

  for (const model of modelos) {
    try {
      return await ai.models.generateContent({
        ...config,
        model
      });
    } catch (erro) {
      ultimoErro = erro;
      console.error(`ERRO GEMINI NO MODELO ${model}:`, erro?.message || erro);
    }
  }

  throw ultimoErro || new Error("Falha ao consultar os modelos Gemini");
}

app.get("/", (req, res) => {
  res.send("API Luma Gemini funcionando 🚀");
});

app.get("/health", (req, res) => {
  res.json({
    sucesso: true,
    status: "online",
    mensagem: "API Luma saudável 🩺",
    geminiConfigurado: Boolean(process.env.GEMINI_API_KEY),
    modeloPrincipal: MODELO_PRINCIPAL,
    modeloFallback: MODELO_FALLBACK,
    data: new Date().toISOString()
  });
});

// ==========================================
// ANALISAR DIA
// ==========================================

app.post("/analisar-dia", async (req, res) => {
  try {
    const dados = req.body || {};

    const prompt = `
Você é a Luma, uma assistente brasileira de acompanhamento de saúde, alimentação, hidratação, atividade física e evolução corporal.

MISSÃO:
Criar um plano diário curto, útil e personalizado usando SOMENTE os dados realmente enviados pelo app.

DADOS QUE PODEM CHEGAR:
- dataHoje
- perfilUsuario: nome, idade, sexo, nível, objetivo, observações
- perfilUsuario.tratamentoPeso: medicação em uso, dose informada, frequência, início, dia habitual, última aplicação e efeitos percebidos
- altura, peso, meta de peso e histórico de peso
- metaKcalLuma
- diarioHoje: café, almoço, jantar, ceia, água, calorias e registrosFoto quando existirem
- horariosRefeicoesHoje: horários automáticos das análises por foto, quando existirem
- aguaConsumidaMl e metaAguaMl
- últimos treinos
- saudeHoje e últimos registros de saúde
- contextoSaudeLuma

REGRAS DE FIDELIDADE AOS DADOS:
1. Não invente fatos, sintomas, refeições, treinos, aplicações, horários, metas ou números.
2. Se um dado não estiver presente, diga de forma curta que ainda não há registro, quando isso for relevante.
3. Não diga que uma pressão está "ótima", "perfeita", "excelente" ou que garante ausência de problema. Prefira: "o valor registrado foi X/Y mmHg e não gerou alerta no app", quando o contexto realmente indicar nível normal.
4. Não repita a mesma informação de saúde em blocos diferentes.
5. Em registros de glicose, leia também glicose.observacao. Se momento for "outro" e houver observação, mencione esse contexto de forma curta para deixar claro que ele foi considerado. Não converta automaticamente a observação em "jejum", "pós-refeição" ou outra categoria padronizada e não invente o tempo transcorrido.
6. Se aguaConsumidaMl e metaAguaMl existirem, use EXATAMENTE esses números. Calcule o que falta sem inventar outra meta. Nunca troque a meta do app por 2 L, 2,5 L ou outro valor.
7. Em Alimentação, use os itens realmente presentes em diarioHoje. Se não houver refeições registradas, diga isso. Não presuma o que a pessoa comeu.
8. Se diarioHoje.registrosFoto ou horariosRefeicoesHoje trouxer horários, use SOMENTE esses horários registrados. Você pode comentar de forma descritiva sobre a distribuição das refeições e os intervalos entre registros quando houver dados suficientes. Não invente horário, não presuma que o horário da foto prova o horário exato em que a pessoa comeu e não classifique um horário isolado como "certo", "errado", "bom" ou "ruim".
9. Em Treino, considere nível, últimos treinos e contextoSaudeLuma. Sugestões de duração devem ser apresentadas como sugestão, nunca como necessidade médica.
10. Se tratamentoPeso.ativo for verdadeiro, você pode considerar o tratamento como contexto. Só diga que houve aplicação recente se ultimaAplicacao estiver preenchida. Só mencione náusea, refluxo, constipação, apetite reduzido, saciedade ou outro efeito se isso estiver explicitamente registrado em efeitos percebidos ou observações.
11. Nunca sugira aumentar, reduzir, interromper, trocar, antecipar ou atrasar medicamento. Não interprete dose como prescrição.
12. A presença de tirzepatida, semaglutida, liraglutida ou outro medicamento NÃO é motivo, por si só, para recomendar comer menos, pular refeições ou reduzir hidratação.

SEGURANÇA:
- Não faça diagnóstico.
- Não substitua médico ou nutricionista.
- Não recomende medicamentos.
- Não prometa emagrecimento.
- Não prescreva dieta extrema, jejum ou treino pesado.
- Se contextoSaudeLuma indicar alerta ou urgência, priorize a orientação de segurança já existente nesse contexto.
- Para sintomas importantes ou persistentes registrados pelo usuário, oriente avaliação profissional de forma breve.

ESTILO:
- Português do Brasil.
- Humano, claro e compacto.
- No máximo 2 bullets por seção.
- Evite frases genéricas que não acrescentem informação.
- Não use markdown com asteriscos.
- Não faça introdução antes de PLANO.
- Não repita avisos em todas as seções.

FORMATO OBRIGATÓRIO:
Responda EXATAMENTE neste formato:

PLANO:
🩺 Saúde de hoje
• 1 ou 2 observações curtas baseadas nos registros reais

🍽️ Alimentação
• 1 ou 2 orientações baseadas no diário real e objetivo

💧 Água
• diga quanto foi registrado, qual é a meta do app e quanto falta, se esses números estiverem disponíveis
• uma orientação curta e prática

🔥 Treino recomendado
• sugestão coerente com nível, histórico e saúde
• intensidade segura, se necessário

🎯 Meta do dia
• uma missão simples baseada no que ainda falta registrar ou cumprir hoje

DICA:
uma frase curta, humana e específica ao contexto do dia

Dados do usuário:
${JSON.stringify(dados, null, 2)}
`;

    const resposta = await gerarConteudoIA({
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

Analise os alimentos informados pelo usuário e estime as calorias consumidas em cada refeição: café da manhã, almoço, jantar e ceia quando houver. O campo total deve somar as quatro refeições.

Considere também, se vier nos dados:
- perfil do usuário
- objetivo
- meta de kcal
- água consumida
- dados de saúde do dia
- contextoSaudeLuma
- medicação em uso, apenas como contexto

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
- Não reduza calorias apenas porque existe medicação em uso.
- Se houver dados de pressão ou glicose, use apenas para deixar a observação mais cuidadosa.
- A observação deve ser curta.

Dados recebidos:
${JSON.stringify(dados, null, 2)}

Responda exatamente neste formato:

{
  "cafe": 0,
  "almoco": 0,
  "jantar": 0,
  "ceia": 0,
  "total": 0,
  "observacao": "estimativa aproximada"
}
`;

    const resposta = await gerarConteudoIA({
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
// ANALISAR FOTO DE REFEIÇÃO
// ==========================================

app.post("/analisar-foto-refeicao", async (req, res) => {
  try {
    const {
      imagemBase64,
      mimeType = "image/jpeg",
      refeicao = "cafe",
      contexto = {}
    } = req.body || {};

    if (!imagemBase64) {
      return res.status(400).json({
        sucesso: false,
        erro: "Envie a imagemBase64 da refeição."
      });
    }

    const imagemLimpa = String(imagemBase64).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");

    const prompt = `
Você é a Luma, uma assistente nutricional brasileira.

Analise a foto da refeição e identifique os alimentos visíveis.

A refeição selecionada no app é: ${refeicao}.

REGRAS IMPORTANTES:
- Responda somente em JSON válido.
- Não use markdown.
- Não use texto fora do JSON.
- Use português do Brasil.
- Estime as calorias com prudência.
- Considere que porções vistas em foto são aproximadas.
- Se não tiver certeza de um item, use um nome provável e marque confiança média ou baixa.
- Não invente alimentos que não aparecem.
- Não faça diagnóstico médico.
- Não recomende remédios.
- Não altere medicação.
- Use números inteiros para kcal.
- A observação deve ser curta e clara.
- O contexto pode trazer horarioLocal, dataDiario e registrosFotoAnteriores.
- Considere o horário apenas como contexto de rotina alimentar.
- Não diga que um horário é certo, errado, bom ou ruim apenas pelo relógio.
- Se houver registros anteriores no mesmo dia, você pode comentar brevemente sobre o intervalo entre eles, sem prescrever jejum ou frequência de refeições.
- Não invente horários. Use somente horarioLocal e registrosFotoAnteriores quando estiverem presentes.
- Preencha observacaoHorario com no máximo uma frase curta e útil. Se não houver informação suficiente, apenas registre o horário de forma neutra.

Contexto do usuário, se houver:
${JSON.stringify(contexto, null, 2)}

Responda exatamente neste formato:

{
  "refeicao": "${refeicao}",
  "itens": [
    {
      "nome": "alimento identificado",
      "quantidade": "porção estimada",
      "kcal": 0,
      "confianca": "alta"
    }
  ],
  "totalKcal": 0,
  "observacao": "Calorias estimadas pela foto. Ajuste as porções se necessário.",
  "observacaoHorario": "Horário do registro considerado como contexto da rotina alimentar."
}
`;

    const resposta = await gerarConteudoIA({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imagemLimpa
              }
            }
          ]
        }
      ]
    });

    const analise = extrairJsonDaResposta(resposta.text || "");

    res.json({
      sucesso: true,
      analise
    });

  } catch (erro) {
    console.error("ERRO FOTO REFEICAO:", erro);

    res.status(500).json({
      sucesso: false,
      erro: "Erro ao analisar foto da refeição"
    });
  }
});

// ==========================================
// CALCULAR META DIÁRIA DE KCAL
// ==========================================

app.post("/calcular-meta-kcal", async (req, res) => {
  const dados = req.body || {};

  try {
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
- tratamento ou medicação em uso, se informado, apenas como contexto

IMPORTANTE:
- Não faça diagnóstico médico.
- Não prometa resultado.
- Não seja agressiva na redução calórica.
- Não recomende dieta extrema.
- Use uma meta conservadora e realista.
- Não reduza a meta apenas porque o usuário informou tirzepatida, semaglutida, liraglutida ou outro medicamento.
- Se o IMC estiver baixo ou próximo do limite inferior da faixa usual, evite déficit calórico e sinalize acompanhamento profissional.
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

    const resposta = await gerarConteudoIA({
      contents: prompt
    });

    const meta = normalizarMetaKcal(extrairJsonDaResposta(resposta.text || ""));

    res.json({
      sucesso: true,
      fonte: "gemini",
      meta
    });

  } catch (erro) {
    console.error("ERRO META KCAL, USANDO FALLBACK:", erro?.message || erro);

    const meta = calcularMetaKcalFallback(dados);

    res.json({
      sucesso: true,
      fonte: "estimativa-temporaria",
      meta
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
- medicação em uso, apenas como contexto

REGRA DE SAÚDE:
Se existir "contextoSaudeLuma", ele tem prioridade.
Se contextoSaudeLuma.ajusteTreino indicar evitar treino intenso, descanso, caminhada leve ou não treinar, siga isso.
Se houver pressão muito alta, glicose baixa, batimentos muito altos ou alerta importante, não monte treino pesado.
Se o contexto indicar "Treino não recomendado agora", entregue uma rotina de descanso, respiração leve ou alongamento suave, sem esforço.
Se houver medicação informada, não faça qualquer orientação de dose, troca ou suspensão.

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

    const resposta = await gerarConteudoIA({
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

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function ultimoPeso(dados) {
  const direto = numero(dados?.pesoAtual);
  if (direto && direto > 20 && direto < 400) return direto;

  const lista = Array.isArray(dados?.historicoPeso) ? dados.historicoPeso : [];
  for (let i = lista.length - 1; i >= 0; i -= 1) {
    const item = lista[i] || {};
    const candidatos = [item.peso, item.valor, item.weight, item.kg];
    for (const candidato of candidatos) {
      const n = numero(candidato);
      if (n && n > 20 && n < 400) return n;
    }
  }

  return null;
}

function normalizarAlturaCm(valor) {
  const n = numero(valor);
  if (!n) return null;
  if (n >= 1.2 && n <= 2.3) return n * 100;
  if (n >= 120 && n <= 230) return n;
  return null;
}

function arredondar50(valor) {
  return Math.round(valor / 50) * 50;
}

function normalizarMetaKcal(meta = {}) {
  const metaKcal = numero(meta.metaKcal) || 1800;
  const faixaMin = numero(meta.faixaMin) || Math.max(1200, metaKcal - 100);
  const faixaMax = numero(meta.faixaMax) || metaKcal + 150;

  return {
    metaKcal: Math.round(metaKcal),
    faixaMin: Math.round(Math.min(faixaMin, metaKcal)),
    faixaMax: Math.round(Math.max(faixaMax, metaKcal)),
    status: String(meta.status || "Meta estimada pela Luma"),
    observacao: String(meta.observacao || "Meta aproximada para apoiar sua rotina. Ajuste com profissional de saúde se necessário.")
  };
}

function calcularMetaKcalFallback(dados = {}) {
  const perfil = dados.perfilUsuario && typeof dados.perfilUsuario === "object" ? dados.perfilUsuario : {};
  const idade = numero(perfil.idade ?? dados.idade);
  const peso = ultimoPeso(dados);
  const alturaCm = normalizarAlturaCm(dados.altura ?? perfil.altura);
  const sexo = String(perfil.sexo ?? dados.sexo ?? "").toLowerCase();
  const nivel = String(perfil.nivel ?? dados.nivel ?? "").toLowerCase();
  const objetivo = String(perfil.objetivo ?? dados.objetivo ?? "").toLowerCase();

  if (!idade || !peso || !alturaCm) {
    return {
      metaKcal: 1800,
      faixaMin: 1700,
      faixaMax: 2000,
      status: "Estimativa temporária",
      observacao: "A Luma está temporariamente indisponível. Complete idade, altura e peso para melhorar a estimativa e ajuste com um profissional de saúde quando necessário."
    };
  }

  let ajusteSexo = -78;
  if (sexo.includes("masc") || sexo === "m" || sexo === "homem") ajusteSexo = 5;
  if (sexo.includes("fem") || sexo === "f" || sexo === "mulher") ajusteSexo = -161;

  const tmb = (10 * peso) + (6.25 * alturaCm) - (5 * idade) + ajusteSexo;

  let fatorAtividade = 1.25;
  if (nivel.includes("inter") || nivel.includes("moder")) fatorAtividade = 1.4;
  if (nivel.includes("avan") || nivel.includes("alto")) fatorAtividade = 1.55;

  const gastoEstimado = tmb * fatorAtividade;
  const alturaM = alturaCm / 100;
  const imc = peso / (alturaM * alturaM);

  let alvo = gastoEstimado;
  const querEmagrecer = objetivo.includes("emag") || objetivo.includes("perda") || objetivo.includes("peso");

  if (querEmagrecer && imc >= 20.5) {
    alvo = Math.max(tmb * 1.25, gastoEstimado * 0.9);
  }

  alvo = arredondar50(Math.max(1200, Math.min(3200, alvo)));

  const imcBaixo = imc < 20.5;

  return {
    metaKcal: alvo,
    faixaMin: Math.max(1200, alvo - 100),
    faixaMax: alvo + 150,
    status: imcBaixo ? "Estimativa conservadora temporária" : "Estimativa temporária",
    observacao: imcBaixo
      ? "A Luma está temporariamente indisponível. Como o IMC calculado está próximo da faixa inferior, a estimativa não aplica déficit automático. Confirme sua meta com um profissional de saúde."
      : "A Luma está temporariamente indisponível. Esta meta foi estimada no servidor com seus dados e usa um ajuste conservador. Confirme individualmente com um profissional de saúde quando necessário."
  };
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});