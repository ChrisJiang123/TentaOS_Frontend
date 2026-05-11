import React from 'react';
import { Swords, FileText, Mail, Code2, Bug, Globe } from 'lucide-react';

const commands = [
  { cmd: '/compete', icon: Swords, label: '竞品分析', placeholder: '竞品名称', color: '#F59E0B', desc: '3步竞品深度分析' },
  { cmd: '/blog', icon: FileText, label: '博客文章', placeholder: '主题', color: '#8B5CF6', desc: '调研→大纲→写作→SEO' },
  { cmd: '/email', icon: Mail, label: '邮件起草', placeholder: '场景描述', color: '#10B981', desc: '理解场景→生成3版' },
  { cmd: '/code', icon: Code2, label: '代码生成', placeholder: '功能描述', color: '#3B82F6', desc: '设计→编码→审查' },
  { cmd: '/debug', icon: Bug, label: '调试修复', placeholder: '错误信息', color: '#EF4444', desc: '定位→修复方案' },
  { cmd: '/landing', icon: Globe, label: '落地页', placeholder: '产品描述', color: '#EC4899', desc: '文案→设计→代码→SEO' },
];

export default function QuickCommands({ onSelect, visible }) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0c0c14] border border-white/[0.1] rounded-xl shadow-2xl z-50 p-2 max-h-[300px] overflow-auto">
      <p className="text-[10px] text-white/30 px-3 py-1.5 uppercase tracking-wider">快捷指令</p>
      {commands.map(c => (
        <button
          key={c.cmd}
          onClick={() => onSelect(c)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors text-left group"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: c.color + '15' }}
          >
            <c.icon className="w-4 h-4" style={{ color: c.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/70">{c.cmd}</span>
              <span className="text-[10px] text-white/30">{c.label}</span>
            </div>
            <p className="text-[10px] text-white/25 mt-0.5">{c.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export { commands };