// @ts-nocheck
import { useEffect } from 'react';

/**
 * Sets document title and meta description/keywords for SEO.
 * Since Base44 is a SPA (no SSR), this helps with crawlers that execute JS.
 */
export default function useSEO({ title, description, keywords }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;

      // Also update OG description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.content = description;
    }

    if (keywords) {
      let meta = document.querySelector('meta[name="keywords"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'keywords';
        document.head.appendChild(meta);
      }
      meta.content = keywords;
    }

    // Update OG title
    if (title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.content = title;
    }

    return () => {
      // Reset to defaults on unmount
      document.title = 'TentaOS — Visual AI Operating System';
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.content = 'TentaOS — Visual AI Operating System. Launch AI tasks, monitor multi-agent workflows, approve actions, and track costs with full visibility and control.';
      const kw = document.querySelector('meta[name="keywords"]');
      if (kw) kw.content = 'AI agents, AI workflow automation, multi-agent system, visual AI OS, AI task management, LLM orchestration, AI pipeline builder';
    };
  }, [title, description, keywords]);
}