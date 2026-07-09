import { NextRequest, NextResponse } from "next/server";

const API_ROOT = "https://api.x.com/2";
const TWITTER_API_ROOT = "https://api.twitter.com/2";
const DEFAULT_MAX_RESULTS = 12;

type XUser = {
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

type XTweet = {
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

type XError = {
  title?: string;
  detail?: string;
  status?: number;
};

type XResponse<T> = {
  data?: T;
  errors?: XError[];
};

class XApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "XApiError";
    this.status = status;
  }
}

function embeddedTimelineResponse(username: string, fallbackReason: string) {
  return NextResponse.json({
    mode: "embed",
    fallbackReason,
    user: {
      id: `embed-${username}`,
      name: `@${username}`,
      username
    },
    tweets: []
  });
}

async function fetchFromX<T>(path: string, token: string): Promise<XResponse<T>> {
  const url = `${API_ROOT}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    next: { revalidate: 60 }
  });

  if (response.status === 404 || response.status === 403) {
    const fallbackResponse = await fetch(`${TWITTER_API_ROOT}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 60 }
    });

    return parseXResponse<T>(fallbackResponse);
  }

  return parseXResponse<T>(response);
}

async function parseXResponse<T>(response: Response): Promise<XResponse<T>> {
  const payload = (await response.json().catch(() => ({}))) as XResponse<T>;

  if (!response.ok) {
    if (response.status === 402) {
      throw new XApiError(
        response.status,
        "X API returned 402 Payment Required. Your developer app needs API credits or an access level that allows public read requests."
      );
    }

    const errorMessage =
      payload.errors?.map((error) => error.detail || error.title).filter(Boolean).join(" ") ||
      `X API request failed with status ${response.status}.`;

    throw new XApiError(response.status, errorMessage);
  }

  return payload;
}

function normalizeUsername(value: string | null): string {
  return (value || "").replace(/^@/, "").trim();
}

export async function GET(request: NextRequest) {
  const username = normalizeUsername(request.nextUrl.searchParams.get("username"));
  const maxResults = Number(request.nextUrl.searchParams.get("maxResults") || DEFAULT_MAX_RESULTS);
  const token = process.env.X_BEARER_TOKEN;

  if (!username) {
    return NextResponse.json({ error: "Choose an X username to view." }, { status: 400 });
  }

  if (!/^[A-Za-z0-9_]{1,15}$/.test(username)) {
    return NextResponse.json({ error: "X usernames can use letters, numbers, and underscores." }, { status: 400 });
  }

  if (!token) {
    return embeddedTimelineResponse(username, "No X API token is configured, so real posts are shown with X's public embedded timeline.");
  }

  try {
    const userResponse = await fetchFromX<XUser>(
      `/users/by/username/${encodeURIComponent(username)}?user.fields=profile_image_url,public_metrics`,
      token
    );

    if (!userResponse.data) {
      return NextResponse.json({ error: `No public X user found for @${username}.` }, { status: 404 });
    }

    const tweetParams = new URLSearchParams({
      max_results: String(Math.min(Math.max(maxResults, 5), 100)),
      "tweet.fields": "created_at,public_metrics,source",
      exclude: "retweets,replies"
    });

    const tweetsResponse = await fetchFromX<XTweet[]>(
      `/users/${userResponse.data.id}/tweets?${tweetParams.toString()}`,
      token
    );

    return NextResponse.json({
      mode: "live",
      user: userResponse.data,
      tweets: tweetsResponse.data || []
    });
  } catch (error) {
    if (error instanceof XApiError && error.status === 402) {
      return embeddedTimelineResponse(
        username,
        "The X API requires paid credits for this request, so real posts are shown with X's public embedded timeline."
      );
    }

    const message = error instanceof Error ? error.message : "Could not load posts from X.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
