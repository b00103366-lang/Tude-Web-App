import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 * Request a presigned URL for file upload.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body ?? {};
  if (!name || !contentType) {
    res.status(400).json({ error: "Missing required fields: name, contentType" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 * Serve public assets unconditionally (no auth).
 */
router.get("/storage/public-objects/*splat", async (req: Request, res: Response) => {
  const filePath = (req.params as any).splat as string;
  try {
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    const response = await objectStorageService.downloadObject(file);
    const headers = Object.fromEntries(response.headers.entries());
    res.set(headers);
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.status(204).end();
    }
  } catch (error) {
    console.error("Error serving public object:", error);
    res.status(500).json({ error: "Failed to serve object" });
  }
});

/**
 * GET /storage/objects/*
 * Serve private uploaded objects.
 */
router.get("/storage/objects/*splat", async (req: Request, res: Response) => {
  const objectPath = `/objects/${(req.params as any).splat}`;
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(file);
    const headers = Object.fromEntries(response.headers.entries());
    res.set(headers);
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.status(204).end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
    } else {
      console.error("Error serving object:", error);
      res.status(500).json({ error: "Failed to serve object" });
    }
  }
});

export default router;
