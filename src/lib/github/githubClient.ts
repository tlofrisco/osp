import { Octokit } from "octokit";
import { GITHUB_TOKEN } from '$env/static/private';

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN environment variable is not set!");
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error
  }
});

const owner = "tlofrisco";
const repo = "osp";

interface RepositoryResponse {
  data: {
    repository: {
      name: string;
      defaultBranchRef: {
        name: string;
        target: {
          oid: string;
        };
      } | null;
      viewerPermission: string;
      isPrivate: boolean;
    } | null;
  }
}

export async function createAgentBranch(branchName: string, fromBranch = "main") {
  try {
    if (!GITHUB_TOKEN) {
      throw new Error("GitHub token is not configured");
    }

    console.log("🔍 Attempting to connect to GitHub with token:", GITHUB_TOKEN ? "Token exists" : "No token found");
    console.log("🔍 Using owner:", owner, "repo:", repo);
    
    // First verify the repository exists and get its details
    try {
      console.log("🔍 Checking repository access...");
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo
      });
      
      console.log("✅ Repository found:", {
        name: repoData.name,
        defaultBranch: repoData.default_branch,
        visibility: repoData.visibility,
        permissions: repoData.permissions
      });
      
      if (!repoData.permissions?.push) {
        throw new Error("Token does not have write access to the repository");
      }

      // Get the default branch SHA
      console.log("🔍 Getting default branch SHA...");
      const { data: defaultBranch } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: repoData.default_branch
      });

      console.log("🔧 Default branch SHA:", defaultBranch.commit.sha);

      // Create the new branch
      console.log("🔍 Creating new branch...");
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: defaultBranch.commit.sha
      });

      console.log("✅ Branch created successfully!");
      return { success: true, branchName };
    } catch (err: any) {
      console.error("❌ Repository access error:", err?.message);
      if (err?.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        console.error("Response headers:", err.response.headers);
      }
      throw new Error(`Repository access error: ${err?.message}`);
    }
  } catch (err: any) {
    console.error("❌ GitHub createAgentBranch failed:", err);
    console.error("❌ Error details:", {
      status: err?.status,
      message: err?.message,
      documentation_url: err?.documentation_url,
      response: err?.response?.data
    });
    throw err;
  }
}
