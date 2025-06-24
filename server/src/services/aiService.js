const OpenAI = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Medical safety system prompt
const MEDICAL_SYSTEM_PROMPT = `You are MedGPT, a medical AI assistant designed to provide helpful, accurate, and safe medical information. 

IMPORTANT SAFETY GUIDELINES:
1. Always provide medical disclaimers and encourage professional consultation
2. Never provide specific dosages for medications
3. Never diagnose medical conditions
4. Never provide treatment plans without medical supervision
5. Always recommend appropriate care levels (self-care, urgent care, emergency)
6. Provide evidence-based information with citations when possible

RESPONSE FORMAT:
- Provide clear, plain-language explanations
- Include relevant medical disclaimers
- Suggest appropriate care level (self-care/urgent care/emergency)
- Include numbered citations [1], [2], etc. when referencing medical sources
- Flag any safety concerns

CARE LEVEL GUIDELINES:
- Self-care: Minor symptoms, home remedies, general information
- Urgent care: Moderate symptoms, should see doctor soon
- Emergency: Severe symptoms, immediate medical attention needed

Remember: You are not a substitute for professional medical care. Always encourage users to consult healthcare providers for medical concerns.`;

// Safety keywords that should trigger warnings
const SAFETY_KEYWORDS = {
  critical: [
    'suicide', 'self-harm', 'kill myself', 'end my life', 'overdose',
    'controlled substance', 'prescription drug', 'dosage', 'how much to take',
    'illegal drug', 'recreational drug'
  ],
  moderate: [
    'diagnose', 'diagnosis', 'treatment plan', 'medical procedure',
    'surgery', 'invasive', 'experimental treatment'
  ]
};

// Medical citation sources
const MEDICAL_SOURCES = {
  'pubmed': 'https://pubmed.ncbi.nlm.nih.gov/',
  'uptodate': 'https://www.uptodate.com/',
  'mayoclinic': 'https://www.mayoclinic.org/',
  'webmd': 'https://www.webmd.com/',
  'cdc': 'https://www.cdc.gov/',
  'who': 'https://www.who.int/'
};

class AIService {
  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
  }

  // Check for safety concerns in user input
  checkSafety(userInput) {
    const input = userInput.toLowerCase();
    const flags = [];

    // Check for critical safety keywords
    for (const keyword of SAFETY_KEYWORDS.critical) {
      if (input.includes(keyword)) {
        flags.push({
          type: 'critical',
          keyword: keyword,
          message: 'This request involves potentially harmful content'
        });
      }
    }

    // Check for moderate safety keywords
    for (const keyword of SAFETY_KEYWORDS.moderate) {
      if (input.includes(keyword)) {
        flags.push({
          type: 'moderate',
          keyword: keyword,
          message: 'This request may require professional medical guidance'
        });
      }
    }

    return flags;
  }

  // Determine triage level based on content
  determineTriageLevel(content, safetyFlags) {
    if (safetyFlags.some(flag => flag.type === 'critical')) {
      return 'emergency';
    }

    const emergencyKeywords = [
      'chest pain', 'shortness of breath', 'severe bleeding', 'unconscious',
      'stroke', 'heart attack', 'seizure', 'severe allergic reaction'
    ];

    const urgentKeywords = [
      'fever', 'pain', 'infection', 'injury', 'swelling', 'rash',
      'nausea', 'vomiting', 'diarrhea', 'headache'
    ];

    const contentLower = content.toLowerCase();

    if (emergencyKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'emergency';
    } else if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
      return 'urgent_care';
    }

    return 'self_care';
  }

  // Generate medical response with safety features
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      // Check for safety concerns
      const safetyFlags = this.checkSafety(userMessage);
      
      // If critical safety flags, return safety warning
      if (safetyFlags.some(flag => flag.type === 'critical')) {
        return {
          content: `I cannot provide assistance with this request as it involves potentially harmful content. Please contact a healthcare professional or emergency services if you're experiencing a medical emergency.`,
          safetyFlags,
          triageLevel: 'emergency',
          citations: [],
          tokensUsed: 0
        };
      }

      // Prepare conversation context
      const messages = [
        { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Generate response from AI
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false
      });

      const aiResponse = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      // Determine triage level
      const triageLevel = this.determineTriageLevel(userMessage, safetyFlags);

      // Extract citations from response
      const citations = this.extractCitations(aiResponse);

      // Add safety disclaimer if needed
      let finalResponse = aiResponse;
      if (safetyFlags.length > 0 || triageLevel !== 'self_care') {
        finalResponse += `\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only and should not replace professional medical advice. Please consult a healthcare provider for medical concerns.`;
      }

      return {
        content: finalResponse,
        safetyFlags,
        triageLevel,
        citations,
        tokensUsed
      };

    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  // Extract citations from AI response
  extractCitations(content) {
    const citations = [];
    const citationRegex = /\[(\d+)\]/g;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      citations.push({
        number: parseInt(match[1]),
        source: this.getCitationSource(match[1])
      });
    }

    return citations;
  }

  // Get citation source (placeholder - in real implementation, this would link to actual sources)
  getCitationSource(number) {
    const sources = [
      { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
      { name: 'UpToDate', url: 'https://www.uptodate.com/' },
      { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' },
      { name: 'CDC', url: 'https://www.cdc.gov/' },
      { name: 'WHO', url: 'https://www.who.int/' }
    ];

    return sources[(number - 1) % sources.length];
  }

  // Stream response for real-time chat experience
  async *streamResponse(userMessage, conversationHistory = []) {
    try {
      const safetyFlags = this.checkSafety(userMessage);
      
      if (safetyFlags.some(flag => flag.type === 'critical')) {
        yield {
          content: `I cannot provide assistance with this request as it involves potentially harmful content. Please contact a healthcare professional or emergency services if you're experiencing a medical emergency.`,
          safetyFlags,
          triageLevel: 'emergency',
          citations: [],
          done: true
        };
        return;
      }

      const messages = [
        { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      const stream = await openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true
      });

      let fullContent = '';
      let tokensUsed = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        tokensUsed++;

        yield {
          content: content,
          done: false,
          tokensUsed
        };
      }

      // Final yield with complete information
      const triageLevel = this.determineTriageLevel(userMessage, safetyFlags);
      const citations = this.extractCitations(fullContent);

      yield {
        content: '',
        safetyFlags,
        triageLevel,
        citations,
        tokensUsed,
        done: true
      };

    } catch (error) {
      logger.error('Error streaming AI response:', error);
      yield {
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
        done: true
      };
    }
  }
}

module.exports = new AIService(); 