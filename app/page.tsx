"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AtSign, ExternalLink, Heart, MessageCircle, Repeat2, Search, Sparkles } from "lucide-react";

type TimelineUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
  };
};

type TimelineTweet = {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    repost_count?: number;
    reply_count?: number;
    quote_count?: number;
  };
};

type TimelineResponse = {
  mode?: "embed" | "live";
  fallbackReason?: string;
  user?: TimelineUser;
  tweets?: TimelineTweet[];
  error?: string;
};

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

const numberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

function formatCount(value?: number) {
  if (typeof value !== "number") {
    return "0";
  }

  return numberFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Now";
  }

  return dateFormatter.format(new Date(value));
}

function cleanUsername(value: string) {
  return value.replace(/^@/, "").trim();
}

export default function Home() {
  const [username, setUsername] = useState("openai");
  const [submittedUsername, setSubmittedUsername] = useState("");
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileUrl = useMemo(() => {
    const handle = timeline?.user?.username || submittedUsername;
    return handle ? `https://x.com/${handle}` : "https://x.com";
  }, [submittedUsername, timeline?.user?.username]);

  useEffect(() => {
    if (timeline?.mode !== "embed") {
      return;
    }

    if (window.twttr?.widgets) {
      window.twttr.widgets.load();
      return;
    }

    const scriptId = "x-widgets-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [timeline?.mode, timeline?.user?.username]);

  async function loadTimeline(handle: string) {
    const normalized = cleanUsername(handle);

    if (!normalized) {
      setTimeline({ error: "Enter an X username first." });
      return;
    }

    setIsLoading(true);
    setSubmittedUsername(normalized);

    try {
      const response = await fetch(`/api/tweets?username=${encodeURIComponent(normalized)}&maxResults=12`);
      const payload = (await response.json()) as TimelineResponse;
      setTimeline(payload);
    } catch {
      setTimeline({ error: "Something went wrong while loading the timeline." });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTimeline(username);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200/80 bg-white/82 p-4 shadow-soft-line backdrop-blur sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Focused X viewer
              </p>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Clean X Timeline
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Pick one public username and read their posts without the rest of the feed.
              </p>
            </div>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open on X
            </a>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <label className="relative flex-1">
              <span className="sr-only">X username</span>
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-12 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                value={username}
                placeholder="username"
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isLoading}
              type="submit"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {isLoading ? "Loading" : "Show posts"}
            </button>
          </form>
        </div>

        {timeline?.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-900">
            {timeline.error}
          </div>
        ) : null}

        {timeline?.mode === "embed" ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-medium leading-6 text-teal-950">
            {timeline.fallbackReason || "Real posts are shown with X's public embedded timeline."}
          </div>
        ) : null}

        {timeline?.user ? (
          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <aside className="h-fit rounded-lg border border-slate-200/80 bg-white/86 p-4 shadow-soft-line backdrop-blur">
              <div className="flex items-center gap-3">
                {timeline.user.profile_image_url ? (
                  <img
                    alt=""
                    className="h-14 w-14 rounded-md object-cover"
                    src={timeline.user.profile_image_url}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-teal-100 text-lg font-semibold text-teal-900">
                    {timeline.user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-950">{timeline.user.name}</h2>
                  <p className="truncate text-sm text-slate-500">@{timeline.user.username}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatCount(timeline.user.public_metrics?.followers_count)}
                  </p>
                  <p className="text-xs text-slate-500">Followers</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatCount(timeline.user.public_metrics?.following_count)}
                  </p>
                  <p className="text-xs text-slate-500">Following</p>
                </div>
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {formatCount(timeline.user.public_metrics?.tweet_count)}
                  </p>
                  <p className="text-xs text-slate-500">Posts</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                {timeline.mode === "live"
                  ? "Live public data from X API v2."
                  : timeline.mode === "embed"
                    ? "Live public profile embed from X."
                    : "Search a username to load posts."}
              </div>
            </aside>

            <section className="flex flex-col gap-3" aria-label="Timeline posts">
              {timeline.mode === "embed" && timeline.user ? (
                <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white/90 p-3 shadow-soft-line backdrop-blur">
                  <a
                    className="twitter-timeline"
                    data-chrome="noheader nofooter noborders transparent"
                    data-height="720"
                    href={`https://twitter.com/${timeline.user.username}?ref_src=twsrc%5Etfw`}
                  >
                    Posts by @{timeline.user.username}
                  </a>
                </div>
              ) : timeline.tweets?.length ? (
                timeline.tweets.map((tweet) => (
                  <article
                    className="rounded-lg border border-slate-200/80 bg-white/90 p-4 shadow-soft-line backdrop-blur transition hover:border-slate-300"
                    key={tweet.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-500">{formatDate(tweet.created_at)}</p>
                      <a
                        className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
                        href={`https://x.com/${timeline.user?.username}/status/${tweet.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View post
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-900">{tweet.text}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Heart className="h-4 w-4" aria-hidden="true" />
                        {formatCount(tweet.public_metrics?.like_count)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Repeat2 className="h-4 w-4" aria-hidden="true" />
                        {formatCount(tweet.public_metrics?.repost_count)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        {formatCount(tweet.public_metrics?.reply_count)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-slate-200/80 bg-white/86 p-6 text-center text-sm font-medium text-slate-600 shadow-soft-line">
                  No original public posts found for this username.
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm font-medium text-slate-600">
            Search a username to load a clean timeline.
          </div>
        )}
      </section>
    </main>
  );
}
