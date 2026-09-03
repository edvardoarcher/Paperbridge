# PaperBridge

PaperBridge turns a photo of handwritten notes into a structured Markdown file in your Obsidian vault — automatically. You drop an image into a watched folder (or run it manually from your iPhone), and it uses GPT-4o to read your handwriting, format it, suggest tags, and save it as a `.md` note.

---

## How It Works

1. A photo of your notes lands in a watched folder
2. A Mac Automator Folder Action fires the Apple Shortcut
3. The Shortcut sends the image to a Cloudflare Worker
4. The Worker sends it to GPT-4o for OCR and formatting
5. The result saves as a `.md` file in your Obsidian vault

---

## What You Need Before Starting

- A Mac (for the Automator workflows)
- An iPhone with the **Shortcuts** app and **Obsidian** installed
- A free [Cloudflare account](https://cloudflare.com)
- An [OpenAI API key](https://platform.openai.com) (requires a paid OpenAI account)

---

## Step 1 — Deploy the Cloudflare Worker

This is the backend that processes your images.

1. Log in to [Cloudflare](https://cloudflare.com) and go to **Workers & Pages**
2. Click **Create** → **Create Worker**
3. Give it a name (e.g. `paperbridge`) and click **Deploy**
4. Click **Edit code**
5. Delete all the default code and paste in the contents of `worker.js` from this repo
6. Click **Deploy**
7. Copy your worker's URL — it will look like `https://paperbridge.YOUR-NAME.workers.dev`

---

## Step 2 — Add Your OpenAI API Key

The worker needs your OpenAI key to call GPT-4o. This is stored as a secret (never visible in the code).

1. In your Cloudflare Worker, go to **Settings** → **Variables and Secrets**
2. Click **Add** under **Secret**
3. Set the name to exactly: `OPENAI_API_KEY`
4. Paste in your OpenAI API key as the value
5. Click **Deploy**

---

## Step 3 — Install the Apple Shortcut

The Shortcut is the bridge between your photo and the Cloudflare Worker.

1. Open this link on your iPhone: [Download PaperBridge Shortcut](https://www.icloud.com/shortcuts/d0a1a8ac427a450cb99071f048b7c91c)
2. Tap **Add Shortcut**
3. Open the Shortcut and tap the three dots (•••) to edit it
4. Find the step that contains your worker URL and replace it with your own URL from Step 1
5. Find the step that saves the file and update the folder path to match your Obsidian vault location

---

## Step 4 — Install the Automator Folder Actions (Mac)

These watch a folder on your Mac and automatically fire the Shortcut when a new file arrives.

### Folder Trigger (runs the Shortcut automatically)

1. Open the `automations/` folder in this repo
2. Double-click **Trigger PaperBridge on Scan.workflow** — this opens it in Automator
3. Go to **File** → **Save**
4. Open **System Settings** → **Privacy & Security** → **Automation** and make sure Automator has permission to control Shortcuts
5. Right-click the folder you want to watch in Finder → **Folder Actions Setup**
6. Attach **Trigger PaperBridge on Scan** to that folder

> The workflow is currently set to watch `~/iCloud/PaperBridge Scans`. You can keep that folder or reassign it to any folder you prefer — just update it in Automator before saving.

### TXT to MD Converter (renames output files)

1. Double-click **script for txt to md.workflow** to open it in Automator
2. Go to **File** → **Save**
3. Right-click the same watched folder in Finder → **Folder Actions Setup**
4. Attach **script for txt to md** to the same folder

> This workflow watches `~/Documents/Bridge OS/PaperBridge` by default. Reassign it to match the folder where your Shortcut saves its output.

---

## Step 5 — Test It

1. Drop a photo of handwritten notes into your watched folder
2. Within a few seconds, a `.md` file should appear in your Obsidian vault
3. If nothing happens, check: Folder Actions are enabled in Finder preferences, and Automator has Shortcuts permission in System Settings

---

## Repo Structure

```
paperbridge/
├── automations/
│   ├── Trigger PaperBridge on Scan.workflow   # fires Shortcut when file arrives
│   └── script for txt to md.workflow          # renames .txt output to .md
├── .github/workflows/deploy.yml               # auto-deploys worker on git push
├── worker.js                                  # the Cloudflare Worker code
└── wrangler.toml                              # Cloudflare config
```

---

## Optional: Auto-Deploy via GitHub

If you want code changes to deploy automatically (instead of pasting into the Cloudflare dashboard):

1. Fork this repo
2. In your Cloudflare dashboard, create an **API Token** with Workers edit permissions
3. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**
4. Add a secret named `CLOUDFLARE_API_TOKEN` with that token as the value
5. Now any push to `main` will auto-deploy your worker
