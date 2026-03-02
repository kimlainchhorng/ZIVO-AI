import OpenAI from "openai";
import BaseAgent from "./base-agent";
import {
  generateImage,
  buildHeroImagePrompt,
  buildLogoPrompt,
  buildSocialMediaPrompt,
  buildMarketingPrompt,
  type ImageStyle,
  type ImageSize,
} from "@/lib/image-generator";
import { addMedia, type MediaCategory } from "@/lib/media-store";

interface ImageGenerationTask {
  taskType: "hero" | "logo" | "social" | "marketing" | "custom";
  appName: string;
  description?: string;
  message?: string;
  content?: string;
  platform?: string;
  materialType?: string;
  style?: ImageStyle;
  size?: ImageSize;
  projectId?: string;
  customPrompt?: string;
}

class ImageGenerationAgent extends BaseAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    super("ImageGenerationAgent");
    this.client = new OpenAI({ apiKey });
  }

  async generateForTask(task: ImageGenerationTask) {
    this.start();

    let prompt = "";
    let category: MediaCategory = "hero";
    const size: ImageSize = task.size ?? "1024x1024";
    const style: ImageStyle = task.style ?? "modern";

    switch (task.taskType) {
      case "hero":
        prompt = buildHeroImagePrompt(task.appName, task.description ?? "");
        category = "hero";
        break;
      case "logo":
        prompt = buildLogoPrompt(task.appName, task.description ?? "");
        category = "logo";
        break;
      case "social":
        prompt = buildSocialMediaPrompt(
          task.platform ?? "twitter",
          task.appName,
          task.message ?? ""
        );
        category = "social";
        break;
      case "marketing":
        prompt = buildMarketingPrompt(
          task.materialType ?? "promotional",
          task.appName,
          task.content ?? ""
        );
        category = "marketing";
        break;
      case "custom":
        prompt = task.customPrompt ?? task.description ?? "";
        category = "product";
        break;
    }

    const images = await generateImage(this.client, { prompt, style, size });

    return images.map((img) =>
      addMedia({
        type: "image",
        category,
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId: task.projectId,
        metadata: { task, style, size },
      })
    );
  }

  async generateBatch(tasks: ImageGenerationTask[]) {
    return Promise.all(tasks.map((task) => this.generateForTask(task)));
  }
}

export default ImageGenerationAgent;
