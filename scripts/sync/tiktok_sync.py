#!/usr/bin/env python3
"""Castmog Ladies — TikTok sync, step 2.
Reads a list of TikTok video URLs on stdin (one per line, output of
tiktok_sync.mjs), fetches each video's public metadata, downloads the
cover image into assets/uploads/tiktok/, merges everything into
data/tiktok.json and commits + pushes to GitHub.

Usage:
    node tiktok_sync.mjs "$WSS" | python3 -c 'import json,sys;print("\\n".join(json.load(sys.stdin)))' | python3 tiktok_sync.py
"""
import json, re, os, sys, subprocess, datetime, urllib.request, html

HANDLE = "castmog.fa"
PROFILE_URL = f"https://www.tiktok.com/@{HANDLE}"
REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo root
DATA_FILE = os.path.join(REPO_DIR, "data", "tiktok.json")
COVER_DIR = os.path.join(REPO_DIR, "assets", "uploads", "tiktok")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
MAX_VIDEOS = 30

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()

def state_json(page_html):
    m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', page_html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None

def clean_desc(d):
    d = html.unescape(d or "")
    d = re.sub(r"\s+created by .*$", "", d, flags=re.I).strip()
    return d

def main():
    urls = [l.strip() for l in sys.stdin if re.search(r"/video/\d{6,}", l.strip())]
    if not urls:
        print("no video urls given on stdin")
        return

    # existing data (merge, never lose old videos)
    data = {}
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f: data = json.load(f)
        except Exception:
            data = {}
    videos = {v["id"]: v for v in (data.get("videos") or [])}

    fresh = []
    for url in urls[:MAX_VIDEOS]:
        vid = re.search(r"/video/(\d{6,})", url).group(1)
        try:
            d = state_json(fetch(url).decode("utf-8", "ignore"))
            item = d["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"]["itemStruct"]
        except Exception as e:
            print(f"skip {vid}: {e}")
            continue
        rec = {
            "id": str(item.get("id") or vid),
            "url": f"https://www.tiktok.com/@{HANDLE}/video/{item.get('id') or vid}",
            "desc": clean_desc(item.get("desc")),
            "ts": int(item.get("createTime") or 0),
            "date": datetime.datetime.fromtimestamp(int(item.get("createTime") or 0)).strftime("%Y-%m-%d"),
            "duration": int((item.get("video") or {}).get("duration") or 0),
            "plays": (item.get("stats") or {}).get("playCount") or 0,
            "likes": (item.get("stats") or {}).get("diggCount") or 0,
            "comments": (item.get("stats") or {}).get("commentCount") or 0,
        }
        # cover: download locally (TikTok CDN URLs are signed and expire)
        cover = ((item.get("video") or {}).get("cover") or (item.get("video") or {}).get("originCover") or "")
        local = f"assets/uploads/tiktok/{rec['id']}.jpg"
        abs_local = os.path.join(REPO_DIR, local)
        if cover and not os.path.exists(abs_local):
            try:
                os.makedirs(COVER_DIR, exist_ok=True)
                with open(abs_local, "wb") as f: f.write(fetch(cover))
                print("cover saved:", local)
            except Exception as e:
                print(f"cover failed {vid}: {e}")
        rec["cover"] = local if os.path.exists(abs_local) else ""
        videos[rec["id"]] = rec
        fresh.append(rec["id"])

    # profile stats
    user = data.get("user") or {}
    try:
        ph = fetch(PROFILE_URL).decode("utf-8", "ignore")
        d = state_json(ph)
        st = d["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"]["stats"]
        bio = re.search(r'property="og:description" content="([^"]*)"', ph)
        user = {
            "handle": HANDLE,
            "followers": st.get("followerCount"),
            "likes": st.get("heartCount"),
            "videos": st.get("videoCount"),
            "bio": html.unescape(bio.group(1)) if bio else user.get("bio", ""),
        }
    except Exception as e:
        print(f"profile stats failed: {e}")

    out = {
        "user": user,
        "lastSync": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "videos": sorted(videos.values(), key=lambda v: v.get("ts", 0), reverse=True)[:MAX_VIDEOS],
    }
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    n_new = len(set(fresh) - set(v["id"] for v in (data.get("videos") or [])))
    print(f"data/tiktok.json written: {len(out['videos'])} videos, {n_new} new")

    # commit + push
    token = os.environ.get("GITHUB_TOKEN_4") or os.environ.get("GITHUB_TOKEN")
    if not token:
        print("no token — committed locally only")
    subprocess.run(["git", "add", "data/tiktok.json", "assets/uploads/tiktok"], cwd=REPO_DIR)
    r = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_DIR)
    if r.returncode != 0:
        subprocess.run(["git", "-c", "user.name=TikTok Sync", "-c", "user.email=sync@castmog.local",
                        "commit", "-q", "-m", "sync: TikTok auto-update"], cwd=REPO_DIR)
        push = subprocess.run(["git", "push", f"https://x-access-token:{token}@github.com/iremide188/Castmog-Ladies.git", "main"],
                              cwd=REPO_DIR, capture_output=True, text=True)
        print("pushed:" if push.returncode == 0 else f"push failed: {push.stderr[-200:]}")
    else:
        print("nothing new to commit")

if __name__ == "__main__":
    main()
