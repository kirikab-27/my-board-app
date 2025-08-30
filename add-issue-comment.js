const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

async function addIssueComment() {
  try {
    // GitHubトークンを環境変数から取得
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('GITHUB_TOKEN environment variable is required');
      process.exit(1);
    }

    const octokit = new Octokit({
      auth: token,
    });

    // コメント内容を読み込み
    const commentPath = path.join(__dirname, 'issue40_completion_comment.md');
    const commentBody = fs.readFileSync(commentPath, 'utf8');

    // Issue #40にコメントを追加
    const response = await octokit.rest.issues.createComment({
      owner: 'kirikab-27',
      repo: 'my-board-app',
      issue_number: 40,
      body: commentBody,
    });

    console.log('✅ Issue #40にコメントが正常に追加されました');
    console.log(`コメントURL: ${response.data.html_url}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.status) {
      console.error(`ステータス: ${error.status}`);
    }
    process.exit(1);
  }
}

addIssueComment();
