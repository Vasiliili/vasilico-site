// Retrieve only reports belonging to this exact checked source and completed build.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const repo = process.env.GITHUB_REPOSITORY;
const sha = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const report = {repository: repo, sha, runId: process.env.BUILD_RUN_ID || null, status: 'checking'};
function gh(args) { return execFileSync('gh', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}); }
function api(path) { return JSON.parse(gh(['api', `repos/${repo}/${path}`])); }
function requireThat(ok, message) { if (!ok) throw Error(message); }
try {
  requireThat(repo && sha, 'GITHUB_REPOSITORY and GITHUB_SHA are required');
  if (!report.runId) {
    const runs = api(`actions/workflows/site-quality.yml/runs?branch=main&head_sha=${sha}&status=success&per_page=20`).workflow_runs;
    report.runId = runs.find(run => run.head_sha === sha && run.event !== 'pull_request')?.id;
    requireThat(report.runId, `No successful checked build exists for ${sha}; run Check and publish site first`);
  }
  const run = api(`actions/runs/${report.runId}`);
  requireThat(run.path === '.github/workflows/site-quality.yml', 'Artifact source is not the site-quality workflow');
  requireThat(run.head_sha === sha && run.head_branch === 'main' && run.event !== 'pull_request', 'Build source differs from the verified main commit');
  requireThat(run.status === 'completed' && run.conclusion === 'success', `Build ${report.runId} is ${run.status}/${run.conclusion}; cannot verify or notify`);
  report.artifacts = api(`actions/runs/${report.runId}/artifacts?per_page=100`).artifacts.map(a => ({id: a.id, name: a.name, expired: a.expired, size: a.size_in_bytes}));
  const artifact = report.artifacts.find(a => a.name === 'technical-checks');
  requireThat(artifact, `Build ${report.runId} has no technical-checks artifact. Available: ${report.artifacts.map(a => a.name).join(', ') || '(none)'}. Ensure .reports upload uses include-hidden-files: true`);
  requireThat(!artifact.expired && artifact.size > 0, `technical-checks artifact ${artifact.id} is expired or empty; create a fresh build`);
  // No stale local fallback if retrieval fails.
  fs.rmSync('.reports/build', {recursive: true, force: true});
  gh(['run', 'download', String(report.runId), '--repo', repo, '--name', 'technical-checks', '--dir', '.reports/build']);
  function read(name) { return JSON.parse(fs.readFileSync('.reports/build/' + name, 'utf8')); }
  const manifest = read('build-manifest.json');
  requireThat(String(manifest.runId) === String(report.runId) && manifest.sha === sha && manifest.repository === repo, 'Downloaded build manifest does not match the source SHA/run/repository');
  requireThat(typeof manifest.actionsPages === 'boolean', 'Build manifest lacks publishing mode');
  if (manifest.actionsPages) {
    const jobs = api(`actions/runs/${report.runId}/jobs?per_page=100`).jobs;
    requireThat(jobs.some(j => j.name === 'deploy' && j.conclusion === 'success'), 'Pages deployment did not succeed; live verification and IndexNow stopped');
  }
  report.publishingMode = manifest.actionsPages ? 'GitHub Pages Actions' : 'legacy Pages (exact live-content verification still required)';
  const pending = read('indexnow-pending.json');
  requireThat(Array.isArray(pending.urls) && pending.urls.every(url => typeof url === 'string' && url.startsWith('https://vasilico.ru/')), 'Pending IndexNow URL list is invalid');
  read('seo-check.json');
  report.status = 'verified';
  report.pendingUrlCount = pending.urls.length;
  console.log(`Verified technical-checks from build ${report.runId}, source ${sha}, ${report.publishingMode}. Pending URLs: ${pending.urls.length}. Live-content checks must pass before IndexNow.`);
} catch (error) {
  report.status = 'error';
  report.error = error.message;
  if (error.stderr) report.details = String(error.stderr).slice(0, 2000);
  console.error(`::error::Artifact handoff failed: ${report.error.replace(/[\r\n]/g, ' ')}`);
  process.exitCode = 1;
} finally {
  fs.mkdirSync('.reports', {recursive: true});
  fs.writeFileSync('.reports/retrieve-build.json', JSON.stringify(report, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n### Checked build artifact handoff\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
}
