import { Octokit } from 'octokit';
import { PRIVATE_GITHUB_TOKEN } from '$env/static/private';

const octokit = new Octokit({ auth: PRIVATE_GITHUB_TOKEN });

export async function updateFileInBranch({
  repo,
  branch,
  filePath,
  replace,
  commitMessage
}: {
  repo: string;
  branch: string;
  filePath: string;
  replace: { oldText: string; newText: string };
  commitMessage: string;
}) {
  const [owner, repoName] = repo.split('/');

  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo: repoName,
    path: filePath,
    ref: branch
  });

  const content = Buffer.from((fileData as any).content, 'base64').toString('utf-8');
  const updated = content.replace(replace.oldText, replace.newText);

  const res = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(updated).toString('base64'),
    sha: (fileData as any).sha,
    branch
  });

  return {
    commit: res.data.commit?.html_url || '[no commit url]',
    file: filePath
  };
}
