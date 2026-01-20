import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODELS = {
  SONNET: 'claude-sonnet-4-20250514',
  HAIKU: 'claude-3-5-haiku-20241022',
} as const

export type ModelId = (typeof MODELS)[keyof typeof MODELS]

interface GenerateOptions {
  model?: ModelId
  maxTokens?: number
  temperature?: number
  system?: string
}

/**
 * Generate text completion with Claude
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    model = MODELS.SONNET,
    maxTokens = 4096,
    temperature = 0.7,
    system,
  } = options

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}

/**
 * Generate JSON response with Claude
 */
export async function generateJSON<T>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T | null> {
  const text = await generateText(prompt, options)

  try {
    // Try to parse directly first
    return JSON.parse(text) as T
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T
      } catch {
        console.error('[Claude] Failed to parse JSON from code block:', text)
        return null
      }
    }
    console.error('[Claude] Failed to parse JSON response:', text)
    return null
  }
}

export { anthropic }
