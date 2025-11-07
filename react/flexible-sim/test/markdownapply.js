npm install react-markdown@5.0.3 remark-gfm rehype-raw

import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

class MarkdownViewer extends Component {
  render() {
    const markdownText = `
# Cube AI Assistant
- **Bold Text**
- _Italic Text_
- [Link](https://cube.ai)
\`\`\`js
console.log('Hello Cube!');
\`\`\`
    `;

    return (
      <div className="markdown-viewer">
        <ReactMarkdown
          children={markdownText}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        />
      </div>
    );
  }
}

export default MarkdownViewer;