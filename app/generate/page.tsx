'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, ThumbsUp, ThumbsDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { GeneratedVariation } from '@/types/database'

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState<'short' | 'long'>('long')
  const [creativityLevel, setCreativityLevel] = useState(30)
  const [samplePosts, setSamplePosts] = useState('')
  const [showSamples, setShowSamples] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [variations, setVariations] = useState<GeneratedVariation[]>([])
  const [generationTime, setGenerationTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    setError(null)
    setVariations([])

    try {
      const posts = samplePosts
        .split('---')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          contentType,
          creativityLevel,
          samplePosts: posts,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setVariations(result.data.variations)
        setGenerationTime(result.data.generationTimeMs)
      }
    } catch (err) {
      setError('Failed to generate content. Please try again.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl">ContentTwin</span>
          <span className="text-muted-foreground ml-2">/ Generate</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What do you want to write about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Why most startups fail at hiring in the first year"
              className="w-full h-24 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-wrap gap-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setContentType('short')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    contentType === 'short'
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Short (&lt;500 chars)
                </button>
                <button
                  onClick={() => setContentType('long')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    contentType === 'long'
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  Long-form
                </button>
              </div>
            </div>

            {/* Creativity Slider */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">
                Creativity: {creativityLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={creativityLevel}
                onChange={(e) => setCreativityLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Safe</span>
                <span>Balanced</span>
                <span>Bold</span>
              </div>
            </div>
          </div>

          {/* Sample Posts (Collapsible) */}
          <div className="border border-border rounded-lg">
            <button
              onClick={() => setShowSamples(!showSamples)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">
                Add sample posts to learn your voice
                {samplePosts && (
                  <span className="text-success ml-2 text-sm">
                    ({samplePosts.split('---').filter((p) => p.trim()).length} posts)
                  </span>
                )}
              </span>
              {showSamples ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {showSamples && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Paste your existing posts below, separated by --- (three dashes)
                </p>
                <textarea
                  value={samplePosts}
                  onChange={(e) => setSamplePosts(e.target.value)}
                  placeholder={`First post goes here...

---

Second post goes here...

---

Third post goes here...`}
                  className="w-full h-48 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating 3 variations...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Content
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {variations.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Generated Variations</h2>
              {generationTime && (
                <span className="text-sm text-muted-foreground">
                  Generated in {(generationTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
            <div className="space-y-6">
              {variations.map((variation, index) => (
                <VariationCard
                  key={variation.id}
                  variation={variation}
                  index={index + 1}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function VariationCard({
  variation,
  index,
}: {
  variation: GeneratedVariation
  index: number
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(variation.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scoreColor =
    variation.voice_match_score >= 85
      ? 'text-success'
      : variation.voice_match_score >= 70
      ? 'text-warning'
      : 'text-muted-foreground'

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">Variation {index}</span>
          <span className={`text-sm font-medium ${scoreColor}`}>
            {variation.voice_match_score}% voice match
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors text-success"
            title="Accept this variation"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
            title="Reject this variation"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="whitespace-pre-wrap">{variation.content}</p>
      </div>

      {/* Score Breakdown */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Structure:</span>{' '}
            <span className="font-medium">
              {variation.voice_match_breakdown.structure}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Tone:</span>{' '}
            <span className="font-medium">
              {variation.voice_match_breakdown.tone}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Vocabulary:</span>{' '}
            <span className="font-medium">
              {variation.voice_match_breakdown.vocabulary}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
