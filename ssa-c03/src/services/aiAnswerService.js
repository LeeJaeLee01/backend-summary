const config = require('../config');

function buildPrompt(question) {
  const optionsText = question.options
    .map((o) => `${o.key}. ${o.text?.en || o.text || ''}`)
    .join('\n');

  const chooseHint =
    question.questionType === 'multiple' ||
    /choose two|choose three/i.test(question.question?.en || '')
      ? 'This may require MULTIPLE correct answers (Choose TWO/THREE).'
      : 'Usually exactly ONE correct answer unless the stem says Choose TWO/THREE.';

  return `You are an AWS Certified Solutions Architect Associate (SAA-C03) expert.

Analyze this exam question and respond with ONLY valid JSON (no markdown fences).

${chooseHint}

QUESTION:
${question.question?.en || question.stem || ''}

OPTIONS:
${optionsText}

Return JSON schema:
{
  "correctAnswers": ["A"],
  "summaryNote": "Short Vietnamese summary why the answer is correct (2-3 sentences)",
  "questionVi": "Vietnamese translation of the question",
  "options": {
    "A": { "vi": "Vietnamese translation of option A", "explanation": "Vietnamese: why correct OR why wrong" },
    "B": { "vi": "...", "explanation": "..." }
  }
}

Rules:
- correctAnswers: array of letters A-F, uppercase
- Include ALL option keys present in the question
- explanation for correct option explains why it meets requirements
- explanation for wrong options explains why they are eliminated
- Be concise, exam-focused`;
}

async function callLlm(prompt) {
  if (!config.openaiApiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY in .env — add your API key to run AI enrichment.',
    );
  }

  const res = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You answer AWS SAA-C03 questions accurately. Output JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return JSON.parse(content);
}

function mergeAiIntoQuestion(question, ai) {
  const correctAnswers = (ai.correctAnswers || [])
    .map((k) => String(k).toUpperCase())
    .filter((k) => /^[A-F]$/.test(k))
    .sort();

  const options = question.options.map((opt) => {
    const aiOpt = ai.options?.[opt.key] || {};
    return {
      key: opt.key,
      text: {
        en: opt.text?.en || opt.text || '',
        vi: aiOpt.vi || opt.text?.vi || '',
      },
      explanation: aiOpt.explanation || opt.explanation || '',
    };
  });

  return {
    correctAnswers,
    summaryNote: ai.summaryNote || question.summaryNote || '',
    question: {
      en: question.question?.en || '',
      vi: ai.questionVi || question.question?.vi || '',
    },
    options,
    questionType: correctAnswers.length > 1 ? 'multiple' : 'single',
    importStatus: 'ai_enriched',
    enrichedBy: 'openai',
    enrichedAt: new Date(),
    enrichedModel: config.openaiModel,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  buildPrompt,
  callLlm,
  mergeAiIntoQuestion,
  sleep,
};
