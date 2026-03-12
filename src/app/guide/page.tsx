import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-violet-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Workflow Guide</h1>
              <p className="text-sm text-slate-500">From raw podcast recording to finished video</p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed">
            This guide walks you through the entire process — from uploading your raw podcast episode to PodcastOS,
            all the way to exporting the final edited video from Premiere Pro with styled captions.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-10 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Contents</h2>
          <nav className="space-y-1.5">
            <a href="#part1" className="block text-sm text-violet-600 hover:text-violet-700">Part 1 — Upload to PodcastOS</a>
            <a href="#part2" className="block text-sm text-violet-600 hover:text-violet-700">Part 2 — Download Your Export Files</a>
            <a href="#part3" className="block text-sm text-violet-600 hover:text-violet-700">Part 3 — Import into Premiere Pro</a>
            <a href="#part4" className="block text-sm text-violet-600 hover:text-violet-700">Part 4 — Style Your Captions</a>
            <a href="#part5" className="block text-sm text-violet-600 hover:text-violet-700">Part 5 — Edit the Longform Episode</a>
            <a href="#part6" className="block text-sm text-violet-600 hover:text-violet-700">Part 6 — Create Shortform Clips</a>
            <a href="#part7" className="block text-sm text-violet-600 hover:text-violet-700">Part 7 — Export Final Videos</a>
            <a href="#files" className="block text-sm text-slate-400 hover:text-slate-600">Reference: What Each File Does</a>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-12">

          {/* PART 1 */}
          <section id="part1">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">1</span>
              <h2 className="text-lg font-semibold text-slate-900">Upload to PodcastOS</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Go to the PodcastOS dashboard and click <span className="font-semibold text-violet-600">New Episode</span></li>
                  <li>Drag and drop your raw podcast video file (MP4, MOV, MKV) or audio file (MP3, WAV)</li>
                  <li>Give it a title and click <span className="font-semibold text-violet-600">Upload &amp; Process</span></li>
                  <li>Wait for the upload to complete — after that, everything is automatic:
                    <ul className="mt-2 ml-5 space-y-1 text-slate-400">
                      <li>• Audio extraction (a few seconds)</li>
                      <li>• Transcription with AI (2-5 minutes depending on episode length)</li>
                      <li>• AI clip analysis and scoring (1-2 minutes)</li>
                    </ul>
                  </li>
                  <li>When the status shows <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-600">✓ Ready</span> — your exports are ready</li>
                </ol>
              </div>
              <div className="bg-amber-50/50 rounded-lg border border-amber-100 px-4 py-3">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Tip:</span> You can close the browser tab while processing — the AI pipeline runs on the server. Just come back and check later.
                </p>
              </div>
            </div>
          </section>

          {/* PART 2 */}
          <section id="part2">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">2</span>
              <h2 className="text-lg font-semibold text-slate-900">Download Your Export Files</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>Click into your episode and you&apos;ll see the <span className="font-semibold text-emerald-600">Your exports are ready</span> section. Download these files:</p>
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-violet-600">EDL</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Longform Edit (EDL)</p>
                      <p className="text-slate-400 mt-0.5">An edit decision list that tells Premiere Pro where to cut. Dead air, awkward pauses, and weak segments are automatically marked for removal.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-violet-600">EDL</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Shortform Clips (EDL)</p>
                      <p className="text-slate-400 mt-0.5">Each AI-selected clip as a cut point. These are the most viral-worthy moments scored by the AI.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600">SRT</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Full Subtitles (SRT)</p>
                      <p className="text-slate-400 mt-0.5">Complete episode subtitles with accurate timestamps. This becomes your captions track in Premiere.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-amber-600">TXT</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Chapter Markers</p>
                      <p className="text-slate-400 mt-0.5">YouTube-ready chapter timestamps. Copy-paste directly into your YouTube description.</p>
                    </div>
                  </div>
                </div>
              </div>
              <p>Each individual clip also has its own <span className="font-semibold text-emerald-600">per-clip SRT</span> you can download — these have timestamps starting from 0:00 so they match the clip duration.</p>
            </div>
          </section>

          {/* PART 3 */}
          <section id="part3">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">3</span>
              <h2 className="text-lg font-semibold text-slate-900">Import into Premiere Pro</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Step-by-step:</h3>
                <ol className="space-y-4 list-decimal list-inside">
                  <li>
                    <span className="font-medium text-slate-800">Create a new Premiere Pro project</span>
                    <p className="ml-5 mt-1 text-slate-400">Match your recording settings (e.g., 1920x1080, 25fps)</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Import your raw video file</span>
                    <p className="ml-5 mt-1 text-slate-400">File → Import → select your original MP4/MOV file. Don&apos;t drag it to the timeline yet.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Import the SRT file</span>
                    <p className="ml-5 mt-1 text-slate-400">File → Import → select the <span className="text-emerald-600 font-medium">.srt</span> file. Premiere will recognize it as a captions file.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Import the EDL file</span>
                    <p className="ml-5 mt-1 text-slate-400">File → Import → select the <span className="text-violet-600 font-medium">.edl</span> file. Premiere will ask you to link the media source:</p>
                    <ul className="ml-5 mt-2 space-y-1 text-slate-400">
                      <li>• Click <span className="font-medium text-slate-600">Link Media</span> when prompted</li>
                      <li>• Select your raw video file as the source</li>
                      <li>• Premiere creates a new sequence/timeline with the cuts already applied</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Add captions to the timeline</span>
                    <p className="ml-5 mt-1 text-slate-400">Drag the imported SRT captions onto the captions track (CC) in your timeline. The timestamps will align with the source video automatically.</p>
                  </li>
                </ol>
              </div>
              <div className="bg-violet-50/50 rounded-lg border border-violet-100 px-4 py-3">
                <p className="text-xs text-violet-700">
                  <span className="font-semibold">How it works:</span> The SRT timestamps match the raw video timecodes. When the EDL cuts the video, Premiere also trims the captions to match — so everything stays in sync.
                </p>
              </div>
            </div>
          </section>

          {/* PART 4 */}
          <section id="part4">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">4</span>
              <h2 className="text-lg font-semibold text-slate-900">Style Your Captions</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>The SRT file only contains text and timing — the visual design is done in Premiere Pro. Here&apos;s how to make them look good:</p>

              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Caption Styling in Premiere Pro:</h3>
                <ol className="space-y-4 list-decimal list-inside">
                  <li>
                    <span className="font-medium text-slate-800">Open the Captions panel</span>
                    <p className="ml-5 mt-1 text-slate-400">Window → Captions and Graphics (or Essential Graphics)</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Select all caption blocks</span>
                    <p className="ml-5 mt-1 text-slate-400">Click one caption in the timeline, then Ctrl+A (Cmd+A on Mac) to select all</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Set your brand font</span>
                    <p className="ml-5 mt-1 text-slate-400">In the Essential Graphics panel, change the font family, size, and weight. Good choices for podcasts:</p>
                    <ul className="ml-5 mt-2 space-y-1 text-slate-400">
                      <li>• <span className="font-medium text-slate-600">Bold sans-serif</span> (Montserrat Bold, Noto Sans CJK Bold) for readability</li>
                      <li>• Size 60-80 for 1080p, bigger for shortform vertical</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Set colors</span>
                    <p className="ml-5 mt-1 text-slate-400">Font color: white. Add a dark background box or drop shadow for readability.</p>
                    <ul className="ml-5 mt-2 space-y-1 text-slate-400">
                      <li>• <span className="font-medium text-slate-600">Background box:</span> Enable in the Appearance section → Background → dark color with ~80% opacity</li>
                      <li>• <span className="font-medium text-slate-600">Drop shadow:</span> Or use a black drop shadow instead for a cleaner look</li>
                      <li>• <span className="font-medium text-slate-600">Stroke/outline:</span> Add a thin black outline (2-3px) for text over busy backgrounds</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Position the captions</span>
                    <p className="ml-5 mt-1 text-slate-400">For longform (16:9): bottom center, with some padding from the edge</p>
                    <p className="ml-5 mt-1 text-slate-400">For shortform (9:16): center or lower-center of the frame</p>
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50/50 rounded-lg border border-amber-100 px-4 py-3">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Pro tip:</span> Style one caption block first, then right-click → &quot;Copy Attributes&quot; and paste to all others. Or create a caption style template and apply it to all. This saves hours of formatting.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Will the captions stay synced after EDL cuts?</h3>
                <p className="text-slate-500 leading-relaxed">
                  <span className="font-semibold text-emerald-600">Yes.</span> The SRT timestamps are based on the raw source video&apos;s timecodes. When the EDL tells Premiere to cut at specific points, it trims both the video and the caption track together. As long as you import the SRT onto the same timeline as the EDL, everything stays perfectly synced — even after cuts.
                </p>
              </div>
            </div>
          </section>

          {/* PART 5 */}
          <section id="part5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">5</span>
              <h2 className="text-lg font-semibold text-slate-900">Edit the Longform Episode</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <p className="text-slate-500 mb-3">After importing the Longform EDL, your timeline already has the boring parts cut out. Now you refine it:</p>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>
                    <span className="font-medium text-slate-800">Review the AI cuts</span>
                    <p className="ml-5 mt-1 text-slate-400">Scrub through the timeline. The AI removed dead air and weak segments, but you might want to add some back or make additional cuts.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Add transitions</span>
                    <p className="ml-5 mt-1 text-slate-400">Add crossfades or dip-to-black between cuts if you want smoother transitions.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Color grade</span>
                    <p className="ml-5 mt-1 text-slate-400">Apply your brand color grade/LUT to the video track. This is why we don&apos;t burn captions before editing — you need the raw video for color work.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Add branding</span>
                    <p className="ml-5 mt-1 text-slate-400">Add your podcast logo, intro/outro, lower thirds, background music, etc.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Style the captions</span>
                    <p className="ml-5 mt-1 text-slate-400">Follow the caption styling guide in Part 4 above.</p>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* PART 6 */}
          <section id="part6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">6</span>
              <h2 className="text-lg font-semibold text-slate-900">Create Shortform Clips</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <ol className="space-y-4 list-decimal list-inside">
                  <li>
                    <span className="font-medium text-slate-800">Import the Clips EDL</span>
                    <p className="ml-5 mt-1 text-slate-400">This creates a timeline where each clip is a separate event. Link it to your raw video when prompted.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Create a new sequence for each clip</span>
                    <p className="ml-5 mt-1 text-slate-400">For each clip you want to post, create a new 9:16 (vertical) sequence: 1080x1920 for TikTok/Reels/Shorts.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Copy the clip to the vertical sequence</span>
                    <p className="ml-5 mt-1 text-slate-400">Copy the clip segment from the Clips EDL timeline and paste it into your vertical sequence. Scale/crop the video to fit 9:16.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Import the per-clip SRT</span>
                    <p className="ml-5 mt-1 text-slate-400">Each clip has its own SRT file (download from PodcastOS). These have timestamps starting from 0:00, so they match the clip perfectly. Import and drag onto the captions track.</p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Style for social media</span>
                    <p className="ml-5 mt-1 text-slate-400">For shortform clips, go bigger and bolder with captions:</p>
                    <ul className="ml-5 mt-2 space-y-1 text-slate-400">
                      <li>• Bigger font size (80-100 for 1080p vertical)</li>
                      <li>• Center of frame (not bottom — social media UI covers the bottom)</li>
                      <li>• Bold, high-contrast colors</li>
                      <li>• Consider highlighting key words in a different color</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium text-slate-800">Add a hook</span>
                    <p className="ml-5 mt-1 text-slate-400">Add a text overlay or title card at the start to grab attention. PodcastOS shows you the AI-suggested caption for each clip — use that as inspiration.</p>
                  </li>
                </ol>
              </div>
              <div className="bg-violet-50/50 rounded-lg border border-violet-100 px-4 py-3">
                <p className="text-xs text-violet-700">
                  <span className="font-semibold">AI Scores:</span> PodcastOS scores each clip on Hook, Relatability, Emotion, Quotability, and Curiosity (1-10). Focus on clips with 8+ overall score — those have the highest viral potential.
                </p>
              </div>
            </div>
          </section>

          {/* PART 7 */}
          <section id="part7">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">7</span>
              <h2 className="text-lg font-semibold text-slate-900">Export Final Videos</h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-3">For YouTube (longform):</h3>
                <ol className="space-y-2 list-decimal list-inside text-slate-500">
                  <li>File → Export → Media</li>
                  <li>Format: <span className="font-medium text-slate-700">H.264</span></li>
                  <li>Preset: <span className="font-medium text-slate-700">YouTube 1080p HD</span></li>
                  <li>Make sure <span className="font-medium text-slate-700">Burn Captions Into Video</span> is checked if you want hardcoded subtitles, or leave unchecked and upload the SRT separately to YouTube</li>
                  <li>Click Export</li>
                </ol>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-800 mb-3">For TikTok/Reels/Shorts (shortform):</h3>
                <ol className="space-y-2 list-decimal list-inside text-slate-500">
                  <li>File → Export → Media</li>
                  <li>Format: <span className="font-medium text-slate-700">H.264</span></li>
                  <li>Resolution: <span className="font-medium text-slate-700">1080x1920</span> (vertical)</li>
                  <li>Bitrate: <span className="font-medium text-slate-700">10-15 Mbps</span> for good quality</li>
                  <li><span className="font-medium text-slate-700">Burn captions into video</span> — social media captions should be hardcoded so they show without the viewer enabling CC</li>
                  <li>Click Export</li>
                </ol>
              </div>
              <div className="bg-amber-50/50 rounded-lg border border-amber-100 px-4 py-3">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">YouTube chapters:</span> Don&apos;t forget to paste the Chapter Markers from PodcastOS into your YouTube video description. This creates clickable chapters for viewers.
                </p>
              </div>
            </div>
          </section>

          {/* FILE REFERENCE */}
          <section id="files" className="pt-8 border-t border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Reference: What Each File Does</h2>
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">File</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">What It Does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Longform Edit</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-xs font-medium">EDL</span></td>
                    <td className="px-4 py-3 text-slate-500">Creates a timeline with dead air and weak segments cut out</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Shortform Clips</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-xs font-medium">EDL</span></td>
                    <td className="px-4 py-3 text-slate-500">Each viral-worthy clip as a separate timeline event</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Full Subtitles</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs font-medium">SRT</span></td>
                    <td className="px-4 py-3 text-slate-500">Complete episode captions — timestamps match the raw video</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Per-Clip SRT</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs font-medium">SRT</span></td>
                    <td className="px-4 py-3 text-slate-500">Individual clip captions — timestamps start from 0:00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-800">Chapter Markers</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-xs font-medium">TXT</span></td>
                    <td className="px-4 py-3 text-slate-500">YouTube chapter timestamps — paste into video description</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Back to dashboard */}
          <div className="text-center pt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
