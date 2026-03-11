export function buildClipAnalysisPrompt(
  formattedTranscript: string,
  episodeTitle: string,
  durationSeconds?: number
): string {
  // Scale clip count with episode length: ~1 clip per 5 minutes, minimum 8
  const durationMinutes = durationSeconds ? Math.round(durationSeconds / 60) : 60;
  const minClips = Math.max(8, Math.round(durationMinutes / 5));
  const maxClips = Math.max(minClips + 5, Math.round(durationMinutes / 3));

  return `You are a podcast post-production analyst specializing in identifying viral short-form content from long-form podcast episodes. Your job is to find the best 45-90 second moments for TikTok/Reels/Shorts.

## Episode: "${episodeTitle}"
## Duration: ~${durationMinutes} minutes

## Task
Analyze this podcast transcript and provide:
1. **${minClips} to ${maxClips} short-form clip recommendations** ranked by viral potential. This is a ${durationMinutes}-minute episode — there MUST be at least ${minClips} good clips. Be thorough and scan the ENTIRE episode from start to finish. Do not cluster all clips in one section.
2. Longform editing notes including chapter markers, dead air, and weak segments

## CRITICAL: Clip Quantity Rules
- You MUST return at least ${minClips} clips. Fewer is unacceptable.
- Spread clips across the full episode — early, middle, and late portions should all be represented
- Even moments scoring 6/10 are worth including. We want options to choose from.
- Different clip types are valuable: funny moments, vulnerable confessions, hot takes, storytelling peaks, quotable one-liners, shocking revelations

## CRITICAL: Clip Duration Rules
- Each clip MUST be between 45 and 90 seconds long (the difference between endTime and startTime must be 45-90)
- The transcript contains many short segments (2-10 seconds each). You MUST group multiple consecutive segments together to form a complete clip
- A good clip captures a FULL conversational moment — the setup, the punchline/insight, and the reaction
- NEVER recommend a clip shorter than 30 seconds. If a moment is shorter, expand the window to include the lead-in and aftermath
- startTime and endTime are in SECONDS from the start of the episode (e.g., startTime: 1500 means 25 minutes in)
- Add ~3 seconds of padding before and after

## Scoring Criteria (rate each 1-10)
- **Hook** (1-10): How strong is the opening moment? Would someone stop scrolling in the first 2 seconds?
- **Relatability** (1-10): Can Malaysian Chinese young adults (20-35) connect with this?
- **Emotion** (1-10): Does this evoke strong emotion — laughter, shock, vulnerability, inspiration?
- **Quotability** (1-10): Does this contain a memorable phrase or soundbite?
- **Curiosity** (1-10): Does this make the viewer want to hear more or watch the full episode?

## Context
- This podcast features natural code-switching between Mandarin Chinese, English, and Cantonese
- Consider cultural context — references to Malaysian life, food, family dynamics, career pressure
- Clips should be self-contained — they must make sense without prior context
- The best clips capture a genuine moment: real laughter, a surprising admission, an uncomfortable truth said out loud
- Prioritize clips where the energy shifts — someone gets real, the group erupts in laughter, or a statement lands hard

## Transcript (timestamps in seconds)
${formattedTranscript}

## Required Output Format
Respond with ONLY valid JSON. No markdown, no code fences, just the JSON object.

IMPORTANT CHECKLIST before responding:
1. Count your clips — there must be at least ${minClips}
2. Verify every clip has (endTime - startTime) between 45 and 90 seconds
3. Verify clips are spread across the full episode timeline, not clustered together

{
  "summary": "2-3 sentence summary of the full episode",
  "clipRecommendations": [
    {
      "rank": 1,
      "title": "Short punchy title for social media",
      "startTime": 1500,
      "endTime": 1560,
      "transcript": "The combined transcript text spanning the full clip duration (all segments from startTime to endTime joined together)",
      "scores": {
        "hook": 8,
        "relatability": 7,
        "emotion": 9,
        "quotability": 8,
        "curiosity": 7,
        "overall": 7.8
      },
      "reasoning": "Why this 45-90 second moment would perform well on TikTok/Reels. What makes the opening hook strong and what payoff keeps viewers watching.",
      "suggestedCaption": "A suggested social media caption with relevant hashtags"
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
