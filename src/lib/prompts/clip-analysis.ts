export function buildClipAnalysisPrompt(
  formattedTranscript: string,
  episodeTitle: string
): string {
  return `You are a podcast post-production analyst specializing in identifying viral short-form content from long-form podcast episodes.

## Episode: "${episodeTitle}"

## Task
Analyze this podcast transcript and provide:
1. The top 5-10 short-form clip recommendations (30-90 seconds each) ranked by viral potential
2. Longform editing notes including chapter markers, dead air, and weak segments

## Scoring Criteria (rate each 1-10)
- **Hook** (1-10): How strong is the opening moment? Would someone stop scrolling?
- **Relatability** (1-10): Can the target audience (Malaysian Chinese young adults 20-35) connect with this?
- **Emotion** (1-10): Does this evoke strong emotion — laughter, shock, vulnerability, inspiration?
- **Quotability** (1-10): Does this contain a memorable phrase or soundbite?
- **Curiosity** (1-10): Does this make the viewer want to hear more or watch the full episode?

## Important Notes
- This podcast features natural code-switching between Mandarin Chinese, English, and Cantonese
- Timestamps are in seconds from the start of the episode
- For each clip, add ~3 seconds of padding before and after the recommended timestamps
- Consider cultural context — references to Malaysian life, food, family dynamics, career pressure
- Clips should be self-contained — they must make sense without prior context
- The best clips capture a genuine moment: real laughter, a surprising admission, an uncomfortable truth said out loud
- Prioritize clips where the energy shifts — someone gets real, the group erupts in laughter, or a statement lands hard

## Transcript (timestamps in seconds)
${formattedTranscript}

## Required Output Format
Respond with ONLY valid JSON matching this exact structure. No markdown, no code fences, just JSON:
{
  "summary": "2-3 sentence summary of the full episode",
  "clipRecommendations": [
    {
      "rank": 1,
      "title": "Suggested clip title for social media",
      "startTime": 125.5,
      "endTime": 178.2,
      "transcript": "The exact transcript text for this segment",
      "scores": {
        "hook": 8,
        "relatability": 7,
        "emotion": 9,
        "quotability": 8,
        "curiosity": 7,
        "overall": 7.8
      },
      "reasoning": "Why this clip was selected and why it would perform well on TikTok/Reels",
      "suggestedCaption": "A suggested social media caption for this clip"
    }
  ],
  "longformNotes": {
    "chapters": [
      { "title": "Chapter title", "startTime": 0, "endTime": 600 }
    ],
    "deadAirMarkers": [
      { "startTime": 450.2, "endTime": 455.8, "durationSeconds": 5.6 }
    ],
    "weakSegments": [
      { "startTime": 1200, "endTime": 1320, "reason": "Tangential discussion with low energy" }
    ],
    "editSuggestions": [
      "Specific actionable editing suggestion"
    ],
    "overallAssessment": "Overall quality assessment and key themes of the episode"
  }
}`;
}
