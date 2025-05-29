// src/lib/agents/test_label_swap_agent.ts
import { updateFileInBranch } from '$lib/github/githubFileUtils';

export default async function test_label_swap_agent({
  run_id,
  branch_name,
  service_id,
  manifest
}: {
  run_id: string;
  branch_name: string;
  service_id: string;
  manifest: any;
}) {
  const filePath = 'src/routes/service/store/+page.svelte'; // Example file
  const oldText = 'Store Name';
  const newText = 'Location';

  const updateResult = await updateFileInBranch({
    repo: 'tlofrisco/osp',
    branch: branch_name,
    filePath,
    replace: { oldText, newText },
    commitMessage: `🤖 Agent updated label: "${oldText}" → "${newText}" for run ${run_id}`
  });

  return {
    summary: 'Label updated in test file.',
    updated_file: filePath,
    ...updateResult
  };
}
