'use client'

import { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  Target,
  ChevronRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { DiscoveredPillar } from '@/lib/ai/pillar-discovery'
import type { ScoredTrend } from '@/lib/trends/scanner'

interface TopicSuggestion {
  topic: string
  pillar: string
  reasoning: string
  relevanceScore: number
  trendinessScore: number
  overallScore: number
}

export default function DiscoverPage() {
  // Step 1: Discover Pillars
  const [postLinks, setPostLinks] = useState<string[]>([''])
  const [deckFiles, setDeckFiles] = useState<File[]>([])
  const [showPostsInput, setShowPostsInput] = useState(true)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [pillars, setPillars] = useState<DiscoveredPillar[]>([])
  const [voiceSummary, setVoiceSummary] = useState('')

  // Step 2: Topic Suggestions
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([])

  // Step 3: Trends
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)
  const [trends, setTrends] = useState<ScoredTrend[]>([])

  const [error, setError] = useState<string | null>(null)

  const addPostLink = () => {
    setPostLinks([...postLinks, ''])
  }

  const updatePostLink = (index: number, value: string) => {
    const newLinks = [...postLinks]
    newLinks[index] = value
    setPostLinks(newLinks)
  }

  const removePostLink = (index: number) => {
    if (postLinks.length > 1) {
      setPostLinks(postLinks.filter((_, i) => i !== index))
    }
  }

  const handleDeckUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDeckFiles(Array.from(e.target.files))
    }
  }

  // Discover pillars from posts and decks
  const handleDiscoverPillars = async () => {
    const validLinks = postLinks.filter((link) => link.trim().length > 0)

    if (validLinks.length < 3) {
      setError('Please provide at least 3 post links')
      return
    }

    setIsDiscovering(true)
    setError(null)

    try {
      // TODO: Fetch content from links using a scraper/API
      // For now, we'll send the links as-is
      const response = await fetch('/api/discover/pillars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postLinks: validLinks,
          // TODO: Handle deck file uploads
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setPillars(result.data.pillars)
        setVoiceSummary(result.data.summary)
        setShowPostsInput(false)
      }
    } catch (err) {
      setError('Failed to discover pillars. Please try again.')
      console.error(err)
    } finally {
      setIsDiscovering(false)
    }
  }

  // Generate topic suggestions
  const handleGenerateTopics = async () => {
    setIsGeneratingTopics(true)
    setError(null)

    try {
      const response = await fetch('/api/discover/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillars: pillars.map((p) => ({
            name: p.name,
            description: p.description,
            example_topics: p.example_topics,
          })),
          voiceSummary,
          count: 10,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setTopicSuggestions(result.data)
      }
    } catch (err) {
      setError('Failed to generate topics. Please try again.')
      console.error(err)
    } finally {
      setIsGeneratingTopics(false)
    }
  }

  // Load trending topics
  const handleLoadTrends = async () => {
    setIsLoadingTrends(true)
    setError(null)

    try {
      const response = await fetch('/api/discover/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillars: pillars.map((p) => ({
            name: p.name,
            description: p.description,
          })),
          voiceSummary,
          minRelevanceScore: 60,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
      } else {
        setTrends(result.data)
      }
    } catch (err) {
      setError('Failed to load trends. Please try again.')
      console.error(err)
    } finally {
      setIsLoadingTrends(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl">ContentTwin</span>
          <span className="text-muted-foreground ml-2">/ Discover Topics</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Discover Pillars */}
        <section className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPostsInput(!showPostsInput)}
            className="w-full px-6 py-4 bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div className="text-left">
                <h2 className="font-semibold text-lg">Step 1: Discover Your Content Pillars</h2>
                <p className="text-sm text-muted-foreground">
                  {pillars.length > 0
                    ? `Found ${pillars.length} pillars`
                    : 'Paste your posts to identify your core themes'}
                </p>
              </div>
            </div>
            {showPostsInput ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {showPostsInput && (
            <div className="p-6 space-y-6">
              {/* Post Links Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Your Posts</label>
                <p className="text-sm text-muted-foreground">
                  Add links to your LinkedIn posts or articles (minimum 3)
                </p>
                {postLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updatePostLink(index, e.target.value)}
                      placeholder="https://www.linkedin.com/posts/..."
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    {postLinks.length > 1 && (
                      <button
                        onClick={() => removePostLink(index)}
                        className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPostLink}
                  className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                >
                  + Add another link
                </button>
              </div>

              {/* Deck PDF Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Your Presentation Decks{' '}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <p className="text-sm text-muted-foreground">
                  Upload PDF files of your presentation decks
                </p>
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleDeckUpload}
                    className="hidden"
                    id="deck-upload"
                  />
                  <label
                    htmlFor="deck-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium mb-1">Click to upload PDFs</p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </label>
                </div>
                {deckFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Uploaded files:</p>
                    {deckFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs bg-muted px-3 py-2 rounded"
                      >
                        <span className="flex-1">{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleDiscoverPillars}
                disabled={isDiscovering || postLinks.filter((l) => l.trim()).length < 3}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing your content...
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    Discover My Pillars
                  </>
                )}
              </button>
            </div>
          )}

          {/* Display Pillars */}
          {pillars.length > 0 && (
            <div className="p-6 border-t border-border space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary mb-2">Your Content Strategy:</p>
                <p className="text-sm">{voiceSummary}</p>
              </div>

              <div className="grid gap-3">
                {pillars.map((pillar, index) => (
                  <PillarCard key={index} pillar={pillar} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Topic Suggestions */}
        {pillars.length > 0 && (
          <section className="border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-6 w-6 text-accent" />
                <div>
                  <h2 className="font-semibold text-lg">Step 2: Topic Suggestions</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-generated topics based on your pillars
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateTopics}
                disabled={isGeneratingTopics}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingTopics ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGeneratingTopics ? 'Generating...' : 'Generate Topics'}
              </button>
            </div>

            {topicSuggestions.length > 0 && (
              <div className="p-6 space-y-3">
                {topicSuggestions.map((topic, index) => (
                  <TopicCard key={index} topic={topic} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Trending Topics */}
        {pillars.length > 0 && (
          <section className="border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-success" />
                <div>
                  <h2 className="font-semibold text-lg">Step 3: Trending Topics</h2>
                  <p className="text-sm text-muted-foreground">
                    What's trending + relevant to your pillars
                  </p>
                </div>
              </div>
              <button
                onClick={handleLoadTrends}
                disabled={isLoadingTrends}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingTrends ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {isLoadingTrends ? 'Loading...' : 'Load Trends'}
              </button>
            </div>

            {trends.length > 0 && (
              <div className="p-6 space-y-3">
                {trends.map((trend, index) => (
                  <TrendCard key={index} trend={trend} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

// Pillar Card Component
function PillarCard({ pillar }: { pillar: DiscoveredPillar & { sources?: string[]; deckEvidence?: string[] } }) {
  return (
    <div className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{pillar.name}</h3>
          {pillar.sources && pillar.sources.length > 1 && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
              posts + decks
            </span>
          )}
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
          {pillar.confidence}% confidence
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{pillar.description}</p>

      {pillar.deckEvidence && pillar.deckEvidence.length > 0 && (
        <div className="mb-3 p-2 bg-accent/5 rounded border border-accent/10">
          <p className="text-xs font-medium text-accent mb-1">From your decks:</p>
          <p className="text-xs text-muted-foreground italic">"{pillar.deckEvidence[0]}"</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {pillar.example_topics.map((topic, i) => (
          <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
            {topic}
          </span>
        ))}
      </div>
    </div>
  )
}

// Topic Card Component
function TopicCard({ topic }: { topic: TopicSuggestion }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const scoreColor =
    topic.overallScore >= 80 ? 'text-success' : topic.overallScore >= 60 ? 'text-warning' : 'text-muted-foreground'

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 text-left">
          <p className="font-medium">{topic.topic}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{topic.pillar}</span>
            <span className={`text-xs font-medium ${scoreColor}`}>{topic.overallScore}% match</span>
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 space-y-3">
          <p className="text-sm text-muted-foreground">{topic.reasoning}</p>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Relevance:</span>{' '}
              <span className="font-medium">{topic.relevanceScore}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Trendiness:</span>{' '}
              <span className="font-medium">{topic.trendinessScore}%</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 py-2 bg-success/10 text-success rounded-lg text-sm font-medium hover:bg-success/20 transition-colors flex items-center justify-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Use This Topic
            </button>
            <button className="flex-1 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
              <ThumbsDown className="h-4 w-4" />
              Not Interested
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Trend Card Component
function TrendCard({ trend }: { trend: ScoredTrend }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-success/50 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="font-medium">{trend.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{trend.source_name}</span>
            {trend.matched_pillars.length > 0 && (
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                {trend.matched_pillars.join(', ')}
              </span>
            )}
            <span className="text-xs font-medium text-success">{trend.relevance_score}% relevant</span>
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 space-y-3">
          <p className="text-sm">{trend.summary}</p>
          {trend.suggested_angle && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">Your Unique Angle:</p>
              <p className="text-sm">{trend.suggested_angle}</p>
            </div>
          )}
          {trend.has_conflict && trend.conflict_reason && (
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-xs font-medium text-destructive mb-1">⚠️ Potential Conflict:</p>
              <p className="text-sm text-destructive">{trend.conflict_reason}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <a
              href={trend.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-center"
            >
              Read More
            </a>
            <button className="flex-1 py-2 bg-success/10 text-success rounded-lg text-sm font-medium hover:bg-success/20 transition-colors">
              Write About This
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
