import express from "express";
import { Client } from "@notionhq/client";
import { config } from "dotenv";

config();

const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const notesDBid = process.env.NOTION_NOTE_DATABASE;

// Add a homepage route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
});

app.post("/new-song", async (req, res) => {
  const { trackName, artist, album, url } = req.body;

  const properties = {
    Name: {
      title: [{ text: { content: `${trackName} – ${artist}` } }],
    },
    Type: {
      select: { name: "Music" },
    },
    URL: {
      url: url,
    },
    // Optional: add relation if needed
    Tag: {
      relation: [{ id: "1e56d62fd29c80e1a034da16409da817" }],
    },
  };

  const pageBody = `🎵 Track: ${trackName}\n👤 Artist: ${artist}\n💽 Album: ${album}\n🔗 ${url}`;

  try {
    const newPage = await notion.pages.create({
      parent: { database_id: notesDBid },
      properties: properties,
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: pageBody } }],
          },
        },
      ],
    });

    console.log("✅ Added:", trackName);
    res.status(200).json({ message: "Page created", url: newPage.url });
  } catch (error) {
    console.error("❌ Notion error:", error.body || error);
    res.status(500).json({ error: error.body || error });
  }
});
