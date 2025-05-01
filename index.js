import express from "express";
import { Client } from "@notionhq/client";
import { config } from "dotenv";

config();

const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const musicDBid = process.env.NOTION_MUSIC_DATABASE;

// Root route for testing
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
});

// Webhook route
app.post("/new-song", async (req, res) => {
  const {
    trackName,
    artist,
    album,
    url,
    time_liked,
    album_cover,
    track_id,
    genre,
    year,
    idea,
    similarSongs = [],
  } = req.body;

  const properties = {
    TrackName: {
      title: [{ text: { content: `${trackName} – ${artist}` } }],
    },
    URL: {
      url: url,
    },
    TimeSaved: {
      date: { start: time_liked },
    },
    AlbumCover: {
      files: [
        {
          name: "AlbumCover",
          type: "external",
          external: {
            url: album_cover
          }
        }
      ]
    },
    TrackId: {
      rich_text: [{ text: { content: track_id } }],
    },
    Genre: {
      select: { name: genre || "Unknown" },
    },
    Year: {
      number: parseInt(year) || undefined,
    },
    PlaylistSuggestion: {
      rich_text: [{ text: { content: idea || "" } }],
    },
    SimilarSongs: {
      rich_text: [
        {
          text: {
            content: Array.isArray(similarSongs)
              ? similarSongs.join(", ")
              : "",
          },
        },
      ],
    },
    // Optional: Tag relation if using a tag database
    // Tag: {
    //   relation: [{ id: "1e56d62fd29c80e1a034da16409da817" }],
    // },
  };

  const pageBody = `
🎵 Track: ${trackName}
👤 Artist: ${artist}
💽 Album: ${album}
🕒 Liked at: ${time_liked}
🖼️ Album Cover: ${album_cover}
🆔 Track ID: ${track_id}
🎧 Genre: ${genre}
📆 Year: ${year}
💡 Playlist Idea: ${idea}
🎶 Similar Songs:
${(similarSongs || []).join("\n")}
🔗 ${url}
`.trim();

  try {
    const newPage = await notion.pages.create({
      parent: { database_id: musicDBid },
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

