import Groq from "groq-sdk";

// ─── Client ───────────────────────────────────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createCompletion(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  options: { temperature: number; max_tokens: number },
): Promise<unknown> {
  const completion = await groq.chat.completions.create({
    messages,
    model: MODEL,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) throw new Error("No AI response");
  return JSON.parse(response);
}

// ─── Functions ────────────────────────────────────────────────────────────────

async function analyzeResumeMatch(resume: string, jobDescription: string) {
  const prompt = `You are an expert career coach helping job seekers optimize their applications.
  
  RESUME:
  ${resume}

  JOB DESCRIPTION:
  ${jobDescription}

  Please analyze this resume against the job description and provide:

  1. **Match Score**: Rate 0-100% how well the resume matches the job requirements
  2. **Strengths**: What aspects of the resume align well with the job
  3. **Gaps**: Missing skills, experiences, or keywords from the job description
  4. **Keyword Suggestions**: Important keywords from the job description
  5. **Tailoring Tips**: Specific suggestions to improve this resume for this job

  Format your response as JSON with these fields: matchScore, strengths (array), gaps (array), keywords (array), tips (array)`;

  return createCompletion(
    [
      {
        role: "system",
        content:
          "You are an expert career coach and ATS specialist. Provide actionable, specific advice.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.7, max_tokens: 2000 },
  );
}

async function generateInterviewQuestions(
  jobDescription: string,
  position: string,
) {
  const prompt = `You are an expert interviewer preparing interview questions.
  POSITION: ${position}
  JOB DESCRIPTION:
  ${jobDescription}
  
  Generate 10 interview questions that are:
  1. Specific to this role and job description
  2. A mix of technical, behavioral and situational questions
  3. Realistic questions that would actually be asked for this position
  
  For each question, also provide:
  - Question type (technical/behavioral/situational)
  - A brief tip on how to answer it well
  
  Format as JSON: questions array with objects containing: question, type, tip`;

  return createCompletion(
    [
      {
        role: "system",
        content:
          "You are an experienced technical interviewer and hiring manager.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.8, max_tokens: 2000 },
  );
}

async function generateCoverLetterTips(
  jobDescription: string,
  position: string,
  companyName: string,
  userBackground?: string,
) {
  const prompt = `You are a career coach helping write a compelling cover letter.
  POSITION: ${position}
  COMPANY: ${companyName}
  
  JOB DESCRIPTION:
  ${jobDescription}
  
  ${userBackground ? `CANDIDATE BACKGROUND:\n${userBackground}` : ""}
  
  Provide 5 specific tips for writing an excellent cover letter for this position:
  1. What company values or mission to highlight
  2. Which job requirements to emphasize
  3. Key accomplishments to mention (based on job description)
  4. How to show enthusiasm for this specific role
  5. Strong opening and closing sentence suggestions
  
  Format as JSON: tips array with objects containing: category, suggestion`;

  return createCompletion(
    [
      {
        role: "system",
        content:
          "You are an expert at writing compelling cover letters that get interviews.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.7, max_tokens: 1500 },
  );
}

async function analyzeJobPosting(jobDescription: string) {
  const prompt = `Analyze this job posting and extract key information: 
  ${jobDescription}
  
  Provide: 
  1. Required skills (array)
  2. Preferred/nice-to-have skills (array)
  3. Years of experience required
  4. Key responsibilities (array - top 5)
  5. Company culture indicators (array)
  6. Red flags if any (array)
  7. Application tips (array)
  
  Format as JSON with these fields.`;

  return createCompletion([{ role: "user", content: prompt }], {
    temperature: 0.5,
    max_tokens: 1500,
  });
}

export {
  analyzeJobPosting,
  generateInterviewQuestions,
  generateCoverLetterTips,
  analyzeResumeMatch,
};
