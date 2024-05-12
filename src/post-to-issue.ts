import * as core from "@actions/core";
import * as ioUtil from "@actions/io/lib/io-util";
import * as github from "@actions/github";
import { Post, createPost } from "./post";

// title: 2023-05-12_TITLE.md
const POST_REG = /^(\d{4}-\d{2}-\d{2})_(.+)\.md$/;

export async function postToIssue(): Promise<void> {
  const token = core.getInput("token");
  const branch = core.getInput("branch");
  const assetsPrefix = core.getInput("assets-prefix");
  const docDir = core.getInput("doc-dir");

  const octokit = github.getOctokit(token);

  const { owner, repo } = github.context.repo;
  const repoGlobURL = `https://github.com/${owner}/${repo}/blob/${branch}/${docDir}/`;

  const existingIssues = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open"
  });

  const files = await ioUtil.readdir(docDir);
  const posts = await Promise.all(
    files
      .filter(file => POST_REG.test(file))
      .map(file => {
        return createPost({
          file: `${docDir}/${file}`,
          globURL: repoGlobURL,
          assetsPrefix
        });
      })
  );

  if (posts.length === 0) {
    core.info("No posts found");
    return;
  }

  const publishPost = async (post: Post) => {
    if (existingIssues.data.some(it => it.title === post.title)) {
      core.info(`Post already exists: ${post.title}`);
      return;
    }

    core.info(`Publishing post: ${post.title}`);
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title: post.title,
      body: post.paragraphs[0],
      labels: post.tags
    });
    for (const p of post.paragraphs.slice(1)) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issue.data.number,
        body: p
      });
    }
  };

  for (const post of posts) {
    core.info(`Post: ${post.title}, Date: ${post.date}, Tags: ${post.tags}`);
    for (const p of post.paragraphs) {
      core.info(p);
    }
    await publishPost(post);
  }

  core.info("Post to issue done");
}
