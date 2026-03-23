import simpleGit, { type SimpleGit } from "simple-git";

export class DeployManager {
  private readonly git: SimpleGit;

  constructor(private readonly repoRoot: string) {
    this.git = simpleGit(repoRoot);
  }

  async deploy(description: string, approved: boolean): Promise<{ deployed: boolean; message: string }> {
    if (!approved) {
      return { deployed: false, message: "Deployment blocked: approval required" };
    }

    if (String(process.env.AUTO_DEPLOY ?? "false").toLowerCase() !== "true") {
      return { deployed: false, message: "Deployment blocked: AUTO_DEPLOY is false" };
    }

    return {
      deployed: true,
      message: `Ready to commit and push: ${description}`
    };
  }

  async currentRemote(): Promise<string> {
    const result = await this.git.remote(["get-url", "origin"]);
    return typeof result === "string" ? result : "";
  }
}
