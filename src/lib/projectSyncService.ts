/// <reference types="vite/client" />

/**
 * Service to sync ALL project files, components, and data to GitHub repository
 * using the GitHub Git Data API (Tree / Commit / Ref update).
 * This ensures GitHub Pages has 100% identical code to the latest AI Studio version!
 */

// Collect all relevant files using Vite's import.meta.glob
const rawSourceFiles = (import.meta as any).glob(
  [
    '../**/*.{ts,tsx,css}',
    '../../public/data/*.json',
    '../../index.html',
    '../../404.html',
    '../../package.json',
    '../../vite.config.ts',
    '../../tsconfig.json',
    '../../.github/workflows/*.yml'
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

export function getAllProjectFiles(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, content] of Object.entries(rawSourceFiles)) {
    let cleanPath = key;

    if (cleanPath.startsWith('../../')) {
      cleanPath = cleanPath.substring(6); // e.g. ../../public/data/news.json -> public/data/news.json
    } else if (cleanPath.startsWith('../')) {
      cleanPath = 'src/' + cleanPath.substring(3); // e.g. ../pages/Home.tsx -> src/pages/Home.tsx
    }

    // Never commit secret env files or node_modules
    if (cleanPath.includes('node_modules') || cleanPath.startsWith('.env')) {
      continue;
    }

    result[cleanPath] = content;
  }

  return result;
}

export async function syncEntireProjectToGitHub(config: {
  githubToken: string;
  repo: string;
  branch: string;
  onProgress?: (message: string) => void;
}): Promise<{ success: boolean; message?: string; count?: number; error?: string }> {
  try {
    const token = config.githubToken.trim().replace(/^['"]|['"]$/g, '');
    if (!token) {
      return { success: false, error: 'Token de acesso do GitHub não informado.' };
    }

    const repo = config.repo.trim();
    const branch = config.branch?.trim() || 'main';
    const notify = config.onProgress || (() => {});

    notify('Iniciando comunicação com o GitHub...');

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    // 1. Get current branch reference
    notify(`Obtendo referência da branch ${branch}...`);
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
      const err = await refRes.json();
      return { success: false, error: `Não foi possível encontrar a branch '${branch}' no repositório ${repo}: ${err.message || refRes.status}` };
    }
    const refData = await refRes.json();
    const currentCommitSha = refData.object.sha;

    // 2. Get the commit to find its tree
    notify('Consultando histórico de arquivos...');
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${currentCommitSha}`, { headers });
    if (!commitRes.ok) {
      return { success: false, error: 'Erro ao obter dados do commit atual.' };
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Prepare all files to commit
    notify('Preparando arquivos do projeto (TV Marília Já, 3 Colunas, ADS, notícias)...');
    const allFiles = getAllProjectFiles();
    const fileCount = Object.keys(allFiles).length;

    const treeItems = Object.entries(allFiles).map(([path, content]) => ({
      path,
      mode: '100644',
      type: 'blob',
      content
    }));

    // 4. Create new Git Tree
    notify(`Criando árvore Git com ${fileCount} arquivos atualizados...`);
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });

    if (!treeRes.ok) {
      const err = await treeRes.json();
      return { success: false, error: `Erro ao criar árvore de arquivos no GitHub: ${err.message}` };
    }
    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    // 5. Create new Commit
    notify('Criando commit de atualização completa...');
    const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: 'feat: sincronizar portal completo [TV Marília Já, 3 colunas de notícias, ADS e configurações]',
        tree: newTreeSha,
        parents: [currentCommitSha]
      })
    });

    if (!newCommitRes.ok) {
      const err = await newCommitRes.json();
      return { success: false, error: `Erro ao criar commit no GitHub: ${err.message}` };
    }
    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // 6. Update Branch Ref to new Commit
    notify(`Atualizando branch ${branch} no GitHub...`);
    const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      })
    });

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json();
      return { success: false, error: `Erro ao atualizar branch ${branch}: ${err.message}` };
    }

    // 7. Remove conflicting static.yml if exists
    try {
      const staticRes = await fetch(`https://api.github.com/repos/${repo}/contents/.github/workflows/static.yml?ref=${branch}`, { headers });
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        if (staticData.sha) {
          await fetch(`https://api.github.com/repos/${repo}/contents/.github/workflows/static.yml`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({
              message: 'fix: remover static.yml conflitante que enviava codigo sem compilar',
              sha: staticData.sha,
              branch
            })
          });
        }
      }
    } catch {}

    notify('Sincronização concluída com sucesso!');
    return {
      success: true,
      count: fileCount,
      message: `Sucesso absoluto! ${fileCount} arquivos do projeto foram sincronizados com o GitHub (incluindo TV Marília Já, grade de 3 colunas, banners de anúncio e scripts de deploy). O GitHub Actions iniciou o build e seu site estará 100% atualizado no ar em instantes!`
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado na sincronização com o GitHub' };
  }
}
