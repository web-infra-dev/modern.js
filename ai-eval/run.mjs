#!/usr/bin/env node
// Modern.js AI 基建 — 最小 eval 运行器（P0 脚手架）
//
// 作用：把「三组 A/B 条件 × 任务集」展开成可复跑的运行矩阵，为每个 cell
// 产出结果文件与汇总，作为复测 14PP 收益的入口（不照搬 EdenX 数据）。
//
// P0 范围：本运行器负责「编排 + 产出结果路径 + 汇总打分」。真正驱动 Agent
// 的执行交给可插拔 adapter；默认 adapter 为 `manual`，把每个 cell 标记为
// pending 并落盘待填的 prompt 与评分模板。接入真实 Agent 后，用 --scores
// 合并指标即可得到三组对比。
//
// 用法：
//   node ai-eval/run.mjs                      # 全部 group × task，输出到 results/<时间戳>
//   node ai-eval/run.mjs --groups=baseline    # 只跑指定 group（逗号分隔）
//   node ai-eval/run.mjs --tasks=docs-qa-bff  # 只跑指定 task（逗号分隔）
//   node ai-eval/run.mjs --scores=scores.json # 合并实测指标，产出对比汇总
//   node ai-eval/run.mjs --out=path/to/dir    # 自定义输出目录

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function loadTasks() {
  const dir = path.join(ROOT, 'tasks');
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => loadJson(path.join(dir, f)));
}

function main() {
  const args = parseArgs(process.argv);

  const { groups, metrics } = loadJson(path.join(ROOT, 'groups.json'));
  let tasks = loadTasks();

  let selectedGroups = groups;
  if (typeof args.groups === 'string') {
    const ids = args.groups.split(',');
    selectedGroups = groups.filter(g => ids.includes(g.id));
  }
  if (typeof args.tasks === 'string') {
    const ids = args.tasks.split(',');
    tasks = tasks.filter(t => ids.includes(t.id));
  }

  if (selectedGroups.length === 0 || tasks.length === 0) {
    console.error(
      '没有可运行的 group 或 task，请检查 --groups / --tasks 参数。',
    );
    process.exit(1);
  }

  // 可选：合并实测指标。scores 形如 { "<groupId>/<taskId>": { taskPass: 1, ... } }
  const scores = typeof args.scores === 'string' ? loadJson(args.scores) : {};

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir =
    typeof args.out === 'string'
      ? path.resolve(args.out)
      : path.join(ROOT, 'results', stamp);

  const matrix = [];
  for (const group of selectedGroups) {
    const groupDir = path.join(outDir, group.id);
    fs.mkdirSync(groupDir, { recursive: true });
    for (const task of tasks) {
      const key = `${group.id}/${task.id}`;
      const measured = scores[key] || null;
      const record = {
        group: group.id,
        groupLabel: group.label,
        context: group.context,
        taskId: task.id,
        category: task.category,
        prompt: task.prompt,
        fixture: task.fixture,
        successCriteria: task.successCriteria,
        status: measured ? 'measured' : 'pending',
        metrics:
          measured ||
          Object.fromEntries((task.record || metrics).map(m => [m, null])),
      };
      fs.writeFileSync(
        path.join(groupDir, `${task.id}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
      );
      matrix.push(record);
    }
  }

  // 按 group 聚合：对已实测的数值指标取平均，记录 pending 数量
  const byGroup = {};
  for (const r of matrix) {
    const g = (byGroup[r.group] ||= {
      label: r.groupLabel,
      total: 0,
      measured: 0,
      sums: {},
      counts: {},
    });
    g.total += 1;
    if (r.status === 'measured') {
      g.measured += 1;
      for (const [k, v] of Object.entries(r.metrics)) {
        if (typeof v === 'number') {
          g.sums[k] = (g.sums[k] || 0) + v;
          g.counts[k] = (g.counts[k] || 0) + 1;
        }
      }
    }
  }
  const summary = {
    generatedAt: stamp,
    groups: selectedGroups.map(g => g.id),
    tasks: tasks.map(t => t.id),
    cells: matrix.length,
    aggregate: Object.fromEntries(
      Object.entries(byGroup).map(([id, g]) => [
        id,
        {
          label: g.label,
          measured: `${g.measured}/${g.total}`,
          averages: Object.fromEntries(
            Object.keys(g.sums).map(k => [k, g.sums[k] / g.counts[k]]),
          ),
        },
      ]),
    ),
  };
  fs.writeFileSync(
    path.join(outDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
  );

  console.log('✅ eval 运行矩阵已生成');
  console.log(`   groups: ${summary.groups.join(', ')}`);
  console.log(`   tasks:  ${summary.tasks.join(', ')}`);
  console.log(`   cells:  ${summary.cells}`);
  console.log(`   输出:   ${outDir}`);
  if (Object.keys(scores).length === 0) {
    console.log(
      '\n下一步：用真实 Agent 跑每个 cell 的 prompt，把指标写入 scores.json，',
    );
    console.log(
      '再执行 `node ai-eval/run.mjs --scores=scores.json` 得到三组对比。',
    );
  }
}

main();
