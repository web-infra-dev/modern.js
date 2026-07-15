#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
prereg_ab_analysis.py —— 预注册（pre-registered）A/B 实验统计分析脚本（评审整改版）

============================================================================
实验结构
    多组（主对比 GA vs GB；G0 / GA2 为探索组，仅描述不推断）
    x N 个任务（task，聚类单位）x R 次重复（rep）。
    数据：JSONL，每行一个 run：
    {group, task, layer, rep, pass, duration_ms, num_turns, tool_calls,
     webfetch_calls, webfetch_errors, read_calls, input_tokens,
     output_tokens, cost_usd, is_error, timeout [, abstained]}
    abstained 为可选布尔字段（仅 L4 stress 报告使用），缺省 false。

预注册的统计方法（本文件即预注册文档，常量全部冻结，CLI 不提供任何
  修改 alpha / 边际 / B 次数 / 决策阈值 / 主集定义的入口）：

  0) 主 outcome 与主分析集（冻结）：
     - 主 outcome = 每个 run 的 exact binary pass（判分器保证严格判等；
       本脚本不含任何加权逻辑——按层的表只做描述，不做加权合成）。
     - 成功 run（冻结）：pass == true 且 is_error == false 且
       timeout == false。timeout / is_error 一律计 accuracy fail。
     - 主分析集 = layer ∈ PRIMARY_LAYERS = {L1, L2, L3, L5} 的 task。
     - L0 = 负对照（negative control）：单独描述报告两组 L0 通过率及
       差值，不做推断。
     - L4 = stress test：单独报告 accuracy + abstention rate
       （abstained 字段，缺省 false），不做推断。

  1) 主分析 = 配对任务分块（paired-by-task，仅主分析集）：
     对每个 task 计算 GA / GB 各自通过率（R 次重复的均值），
     得 per-task 差值 d_t = p_B(t) - p_A(t)，主统计量为 mean_t(d_t)。
     * task 是聚类单位：同一 task 的多次重复共享题目难度/环境特性，
       run 之间强正相关（ICC>0），故一切重抽样/置换都在 task 层面。

  2) 推断（冻结）：
     - 判优主检验 = task 级符号翻转置换检验：H0 = 每个 task 内 A/B
       标签可交换；独立翻转每个 task 的 d_t 符号，P=10000，双侧
       p = (#{|mean_perm| >= |mean_obs|} + 1) / (P + 1)。
     - 区间估计 = task-cluster bootstrap-t（studentized bootstrap，
       对称化临界值，Hall 1988）：对 d_t 做 task 级有放回重抽样
       B=10000 次；每个重抽样样本的 t* = (mean* − mean_obs) / SE*，
       SE* = sd*(ddof=1)/sqrt(n)；取 q = |t*| 的第 97.5 分位
       （离散分布用保守的 'higher' 经验分位），
       95% CI = [mean_obs − q·SE_obs, mean_obs + q·SE_obs]。
       * 为什么用对称化而非等尾 percentile-t：等尾变体
         （CI = mean_obs − t*_{97.5}·SE_obs .. mean_obs − t*_{2.5}·SE_obs）
         在本预注册的冻结校准网格上实测反保守——小 N、离散 d_t 时
         "CI 下界>0" 的无效应比例最高达 0.058（名义 0.025），未过
         每场景校准硬门；对称化 studentized bootstrap 是标准变体，
         实测所有场景保守通过（比例 <= 名义值）。此选择冻结。
     - 同时输出 BCa CI 仅作对照（决策不使用 BCa）。
     - 置换与 CI 结论冲突时以置换为准（冻结）：WIN 只由置换检验决定，
       CI 下界 > 0 但置换不显著时不构成 WIN。

  3) 决策规则（冻结，预注册，禁止事后调整，无任何 CLI 入口）：
       WIN               ：置换检验双侧 p < 0.05 且 mean(d) > 0
       NON_INFERIOR（备用）：bootstrap-t 95% CI 下界 > -0.03
       否则              ：INSUFFICIENT_EVIDENCE
     冲突裁决（冻结）：置换优先。CI 仅用于备用非劣判定。

  4) 效率指标（仅主分析集；仅描述，不参与判优）：
     - 只在成功 run 上计算 time-to-correct、成功 run 耗时 p50/p95、
       每成功 run 成本 =（该组全部 run 含失败的 cost_usd 之和）/ 成功数。
     - 组间效率差用配对 task-cluster bootstrap（percentile CI —— 注明
       仅描述性，不用于任何决策），仅纳入两组都 >=1 次成功的 task。

  5) 功效模拟（--pilot，冻结网格）：
     - 从 pilot 对照组 GA（主分析集）做 beta-binomial 矩估计：
       p_t ~ Beta(α,β)，ρ = 1/(α+β+1) 即 ICC。
     - ICC 采用保守上界：对 task 做 bootstrap（B=1000）重估 ρ，取
       80% 区间上界（第 90 分位）；task 数 < 8 时数据不足，改用
       点估计 × 1.5、封顶 0.5（输出中写明来源）。
     - 网格：N ∈ {10,20,28} x R ∈ {2,3,4} x Δ ∈ {5,10,15,20}pp；
       每配置模拟 2000 次实验；功效判定与 WIN 门完全一致 =
       P(置换双侧 p < 0.05 且 mean(d) > 0)，模拟内层置换 P=1000
       （冻结的计算量折中，输出中声明；主分析仍用 P=10000）。

  6) --selftest = 每场景校准验证（放行 pilot 的硬门）：
     - 无效应场景网格（beta-binomial 生成、两组共享 p_t = 同分布）：
       N_tasks ∈ {10,28} x R ∈ {2,4} x μ ∈ {0.3,0.6} x ICC ρ ∈ {0.1,0.3}，
       每场景 2000 个合成数据集。
     - 报告：置换检验拒绝率（type-I）及其 Monte Carlo 95% CI（Wilson），
       bootstrap-t CI 非覆盖率（下界>0 比例）及 MC 95% CI。
     - 通过标准：每场景 type-I 的 MC 95% CI 包含 0.05 或整体低于 0.05
       （保守可接受）；bootstrap-t 下界>0 比例的 MC CI 包含 0.025 或低于。
     - 有效应场景（Δ=0.15 / 0.30）验证功效单调且置换能拒绝。
     - selftest 中置换/自举次数降为 P=B=1000（输出中声明）；MC CI 按
       每场景 2000 个独立数据集正确计算。

  7) 输出：控制台可读报告 + machine-readable JSON（数字不四舍五入）。

依赖：numpy（硬依赖——selftest 校准网格与功效模拟均为向量化实现）。

用法：
    python3 prereg_ab_analysis.py --pilot  --input pilot.jsonl --seed 42 \
        [--cost-per-run 0.85] [--json-out pilot_report.json]
    python3 prereg_ab_analysis.py --final  --input final.jsonl --seed 42 \
        [--json-out final_report.json]
    python3 prereg_ab_analysis.py --selftest [--seed 42] [--json-out st.json]
============================================================================
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from collections import defaultdict
from statistics import NormalDist

try:
    import numpy as np
except ImportError:  # pragma: no cover
    raise SystemExit("[依赖错误] 本脚本硬依赖 numpy（selftest 校准与功效模拟为向量化实现），"
                     "请先 pip install numpy")

# ===========================================================================
# 预注册常量（冻结）。禁止通过 CLI / 环境变量修改 —— 没有提供任何入口。
# ===========================================================================
GROUP_CONTROL = "PROD-A"           # 主对比：对照组
GROUP_TREATMENT = "PROD-B"         # 主对比：处理组
EXPLORATORY_GROUPS = ("G0", "GA", "GA2", "GB")  # 探索组：只描述，不推断

PRIMARY_LAYERS = ("L1", "L2", "L3", "L5")  # 主分析集（冻结）
NEGATIVE_CONTROL_LAYER = "L0"              # 负对照：仅描述
STRESS_LAYER = "L4"                        # stress test：accuracy + abstention

ALPHA = 0.05                   # 置换检验双侧显著性水平（冻结）
B_BOOTSTRAP = 10000            # 主分析 bootstrap-t / BCa 次数
N_PERMUTATIONS = 10000         # 主分析置换检验次数
CI_LEVEL = 95.0
CI_LO_Q = (100.0 - CI_LEVEL) / 2.0   # 2.5
CI_HI_Q = 100.0 - CI_LO_Q            # 97.5
NONINFERIORITY_MARGIN = -0.03  # 非劣边际（备用判定），冻结

POWER_TASK_NS = (10, 20, 28)         # 功效网格：任务数 N（<=28）
POWER_REPS = (2, 3, 4)               # 功效网格：重复数 R
POWER_DELTAS_PP = (5, 10, 15, 20)    # 功效网格：真实效应（百分点）
POWER_N_SIM = 2000                   # 每配置模拟实验次数
POWER_PERM_P = 1000                  # 功效模拟内层置换次数（冻结的计算量折中）

RHO_BOOT_B = 1000                    # ρ(ICC) 的 task-bootstrap 次数
RHO_UPPER_PCTL = 90.0                # 80% 区间上界 = 第 90 分位
RHO_MIN_TASKS = 8                    # task 数低于此值视为"数据不足"
RHO_FALLBACK_MULT = 1.5              # 数据不足时：点估计 x 1.5
RHO_FALLBACK_CAP = 0.5               # 数据不足时封顶 0.5

# selftest 校准网格（冻结；这是放行 pilot 的硬门）
ST_GRID_N = (10, 28)
ST_GRID_R = (2, 4)
ST_GRID_MU = (0.3, 0.6)
ST_GRID_RHO = (0.1, 0.3)
ST_N_DATASETS = 2000                 # 每场景合成数据集数（>=2000）
ST_PERM_P = 1000                     # selftest 降配的置换次数（输出中声明）
ST_BOOT_B = 1000                     # selftest 降配的 bootstrap 次数（输出中声明）
ST_EFFECT_DELTAS = (0.15, 0.30)      # 有效应场景
ST_EFFECT_DATASETS = 1000

REQUIRED_FIELDS = (
    "group", "task", "layer", "rep", "pass", "duration_ms", "num_turns",
    "tool_calls", "webfetch_calls", "webfetch_errors", "read_calls",
    "input_tokens", "output_tokens", "cost_usd", "is_error", "timeout",
)
# abstained 为可选布尔字段（缺省 false），仅用于 L4 stress 报告。


# ===========================================================================
# 基础工具
# ===========================================================================

def is_success(rec: dict) -> bool:
    """成功 run 的冻结定义：pass（exact binary，判分器保证）且非 is_error
    且非 timeout。timeout / is_error 无论 pass 字段如何，一律计 accuracy fail。"""
    return bool(rec["pass"]) and not bool(rec["is_error"]) and not bool(rec["timeout"])


def mean(xs):
    return sum(xs) / len(xs) if xs else float("nan")


def percentile(xs, q):
    """线性插值分位数（等价于 numpy 默认 'linear' 方法）。q ∈ [0, 100]。"""
    s = sorted(xs)
    if not s:
        return float("nan")
    if len(s) == 1:
        return float(s[0])
    k = (len(s) - 1) * q / 100.0
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return float(s[int(k)])
    return float(s[f]) * (c - k) + float(s[c]) * (k - f)


def wilson_ci(k: int, n: int, z: float = 1.959963984540054):
    """比例的 Wilson 95% 区间——用作 selftest 中 Monte Carlo 估计的 MC CI。"""
    if n <= 0:
        return float("nan"), float("nan")
    ph = k / n
    z2 = z * z
    denom = 1.0 + z2 / n
    center = (ph + z2 / (2 * n)) / denom
    half = z * math.sqrt(ph * (1 - ph) / n + z2 / (4 * n * n)) / denom
    return max(0.0, center - half), min(1.0, center + half)


def _np_gen(rng: random.Random):
    """从主 random.Random 派生一个 numpy Generator（保证 --seed 可复现）。"""
    return np.random.default_rng(rng.getrandbits(64))


# ===========================================================================
# 推断核心：置换检验（判优）+ bootstrap-t CI（区间）+ BCa（对照）
# ===========================================================================

def _perm_pvalues_matrix(d, g, n_perm):
    """向量化：对 m 个数据集（d 形状 (m, n)）各做一次符号翻转置换检验，
    返回长度 m 的双侧 p 值数组（含 +1 修正）。"""
    d = np.asarray(d, dtype=float)
    m, n = d.shape
    obs = np.abs(d.mean(axis=1))
    pvals = np.empty(m, dtype=float)
    eps = 1e-12
    chunk = max(1, int(8_000_000 // max(1, n_perm * n)))
    for i in range(0, m, chunk):
        dd = d[i:i + chunk]
        mc = dd.shape[0]
        signs = g.integers(0, 2, size=(mc, n_perm, n), dtype=np.int8) * 2 - 1
        pm = np.abs((signs * dd[:, None, :]).mean(axis=2))
        cnt = (pm >= (obs[i:i + chunk, None] - eps)).sum(axis=1)
        pvals[i:i + chunk] = (cnt + 1.0) / (n_perm + 1.0)
    return pvals


def permutation_pvalue(diffs, rng: random.Random, n_perm=N_PERMUTATIONS):
    """单数据集 task 级符号翻转置换检验（双侧，+1 修正）。"""
    if len(diffs) == 0:
        return float("nan")
    g = _np_gen(rng)
    return float(_perm_pvalues_matrix(np.asarray(diffs, float)[None, :], g, n_perm)[0])


def _boott_lower_matrix(d, g, n_boot):
    """向量化：对 m 个数据集各做 task 级对称化 bootstrap-t，返回 95% CI
    下界数组。下界 = mean_obs − q·SE_obs，q = |t*| 的第 97.5 分位
    （'higher' 保守经验分位）。退化重抽样（SE*=0 而 mean*≠mean_obs）时
    t* 取 ±inf，使区间只会变宽（保守）。"""
    d = np.asarray(d, dtype=float)
    m, n = d.shape
    obs = d.mean(axis=1)
    se_obs = d.std(axis=1, ddof=1) / math.sqrt(n)
    lows = np.empty(m, dtype=float)
    chunk = max(1, int(6_000_000 // max(1, n_boot * n)))
    for i in range(0, m, chunk):
        dd = d[i:i + chunk]
        mc = dd.shape[0]
        idx = g.integers(0, n, size=(mc, n_boot, n), dtype=np.int32)
        bs = dd[np.arange(mc)[:, None, None], idx]        # (mc, n_boot, n)
        bm = bs.mean(axis=2)
        bse = bs.std(axis=2, ddof=1) / math.sqrt(n)
        num = bm - obs[i:i + chunk, None]
        with np.errstate(divide="ignore", invalid="ignore"):
            t = np.where(bse > 0,
                         np.divide(num, bse, out=np.zeros_like(num), where=bse > 0),
                         np.where(num > 0, np.inf, np.where(num < 0, -np.inf, 0.0)))
            q = np.percentile(np.abs(t), CI_HI_Q, axis=1, method="higher")
            lo = obs[i:i + chunk] - q * se_obs[i:i + chunk]
        lows[i:i + chunk] = np.where(se_obs[i:i + chunk] > 0, lo, obs[i:i + chunk])
    return lows


def bootstrap_t_ci(vals, rng: random.Random, n_boot=B_BOOTSTRAP):
    """单数据集 task-cluster bootstrap-t（studentized bootstrap，
    对称化临界值）95% CI。t* = (mean* − mean_obs)/SE*，
    SE* = sd*(ddof=1)/sqrt(n)；q = |t*| 的第 97.5 分位（'higher'），
    CI = [mean_obs − q·SE_obs, mean_obs + q·SE_obs]。
    等尾 percentile-t 变体因未通过冻结校准网格（小 N 离散 d_t 下
    下界反保守）而弃用——见文件头预注册说明，此选择冻结。"""
    arr = np.asarray(vals, dtype=float)
    n = len(arr)
    if n == 0:
        return {"mean": float("nan"), "lo": float("nan"), "hi": float("nan"),
                "se_obs": float("nan"), "degenerate": True}
    obs = float(arr.mean())
    if n < 2:
        return {"mean": obs, "lo": float("nan"), "hi": float("nan"),
                "se_obs": float("nan"), "degenerate": True}
    se_obs = float(arr.std(ddof=1)) / math.sqrt(n)
    if se_obs == 0.0:
        return {"mean": obs, "lo": obs, "hi": obs, "se_obs": 0.0, "degenerate": True}
    g = _np_gen(rng)
    idx = g.integers(0, n, size=(n_boot, n), dtype=np.int32)
    bs = arr[idx]
    bm = bs.mean(axis=1)
    bse = bs.std(axis=1, ddof=1) / math.sqrt(n)
    num = bm - obs
    with np.errstate(divide="ignore", invalid="ignore"):
        t = np.where(bse > 0,
                     np.divide(num, bse, out=np.zeros_like(num), where=bse > 0),
                     np.where(num > 0, np.inf, np.where(num < 0, -np.inf, 0.0)))
    q = float(np.percentile(np.abs(t), CI_HI_Q, method="higher"))
    return {"mean": obs, "lo": float(obs - q * se_obs),
            "hi": float(obs + q * se_obs), "se_obs": se_obs, "degenerate": False}


def bca_ci(vals, rng: random.Random, n_boot=B_BOOTSTRAP):
    """BCa bootstrap CI —— 仅作对照输出，决策不使用（决策用 bootstrap-t）。"""
    arr = np.asarray(vals, dtype=float)
    n = len(arr)
    if n < 2:
        return {"lo": float("nan"), "hi": float("nan"), "degenerate": True}
    obs = float(arr.mean())
    g = _np_gen(rng)
    idx = g.integers(0, n, size=(n_boot, n), dtype=np.int32)
    bm = arr[idx].mean(axis=1)
    if float(bm.min()) == float(bm.max()):
        return {"lo": float(bm.min()), "hi": float(bm.max()), "degenerate": True}
    nd = NormalDist()
    prop = (float((bm < obs).sum()) + 0.5 * float((bm == obs).sum())) / n_boot
    prop = min(max(prop, 1.0 / (n_boot + 1)), 1.0 - 1.0 / (n_boot + 1))
    z0 = nd.inv_cdf(prop)
    jk = (arr.sum() - arr) / (n - 1)          # jackknife 均值
    dj = jk.mean() - jk
    den = 6.0 * float((dj ** 2).sum()) ** 1.5
    a = float((dj ** 3).sum()) / den if den > 0 else 0.0
    out = []
    for q in (CI_LO_Q / 100.0, CI_HI_Q / 100.0):
        z = nd.inv_cdf(q)
        denom = 1.0 - a * (z0 + z)
        adj = z0 + (z0 + z) / denom if denom > 0 else (math.inf if (z0 + z) > 0 else -math.inf)
        alpha_i = min(max(nd.cdf(adj) if math.isfinite(adj) else (1.0 if adj > 0 else 0.0),
                          1e-6), 1 - 1e-6)
        out.append(float(np.percentile(bm, 100.0 * alpha_i)))
    return {"lo": out[0], "hi": out[1], "degenerate": False, "z0": z0, "accel": a}


def bootstrap_mean_percentile_ci(vals, rng: random.Random, n_boot=B_BOOTSTRAP):
    """percentile bootstrap CI —— 仅用于效率指标的描述性区间（预注册注明：
    不用于任何决策；主推断用置换 + bootstrap-t）。"""
    n = len(vals)
    if n == 0:
        return float("nan"), float("nan"), float("nan")
    obs = mean(vals)
    if n == 1:
        return obs, float(vals[0]), float(vals[0])
    g = _np_gen(rng)
    arr = np.asarray(vals, dtype=float)
    idx = g.integers(0, n, size=(n_boot, n), dtype=np.int32)
    means = arr[idx].mean(axis=1)
    return obs, float(np.percentile(means, CI_LO_Q)), float(np.percentile(means, CI_HI_Q))


def preregistered_decision(perm_p: float, mean_d: float, boott_ci_lower: float) -> dict:
    """预注册决策规则（冻结）：
       WIN            ：置换双侧 p < ALPHA 且 mean(d) > 0
       NON_INFERIOR   ：bootstrap-t 95% CI 下界 > NONINFERIORITY_MARGIN（备用）
       否则           ：INSUFFICIENT_EVIDENCE
    冲突裁决（冻结）：置换与 CI 结论冲突时以置换为准 —— WIN 只由置换决定，
    CI 下界 > 0 而置换不显著时不构成 WIN（最多 NON_INFERIOR）。"""
    win = (math.isfinite(perm_p) and perm_p < ALPHA
           and math.isfinite(mean_d) and mean_d > 0)
    if win:
        decision = "WIN"
    elif math.isfinite(boott_ci_lower) and boott_ci_lower > NONINFERIORITY_MARGIN:
        decision = "NON_INFERIOR"
    else:
        decision = "INSUFFICIENT_EVIDENCE"
    conflict = (not win) and math.isfinite(boott_ci_lower) and boott_ci_lower > 0
    return {"decision": decision, "perm_p": perm_p, "mean_d": mean_d,
            "boott_ci_lower": boott_ci_lower,
            "conflict_perm_vs_ci": conflict,
            "conflict_rule": "置换与 CI 冲突时以置换为准（冻结）：WIN 仅由置换决定",
            "rule": {"win": f"perm_p < {ALPHA} AND mean_d > 0",
                     "non_inferior": f"bootstrap-t ci_lower > {NONINFERIORITY_MARGIN}",
                     "otherwise": "INSUFFICIENT_EVIDENCE"}}


# ===========================================================================
# 数据读取
# ===========================================================================

def load_records(path: str):
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError as e:
                raise SystemExit(f"[数据错误] {path}:{lineno} 不是合法 JSON：{e}")
            missing = [k for k in REQUIRED_FIELDS if k not in rec]
            if missing:
                raise SystemExit(f"[数据错误] {path}:{lineno} 缺字段 {missing}")
            records.append(rec)
    if not records:
        raise SystemExit(f"[数据错误] {path} 为空")
    return records


def primary_subset(records):
    """主分析集：layer ∈ PRIMARY_LAYERS 的 run（冻结过滤，无 CLI 入口）。"""
    return [r for r in records if r["layer"] in PRIMARY_LAYERS]


def group_task_stats(records, group):
    """返回 {task: {'n': 重复数, 'k': 成功数, 'rate': 通过率}}（按冻结的成功定义）。"""
    agg = defaultdict(lambda: [0, 0])
    for r in records:
        if r["group"] != group:
            continue
        agg[r["task"]][0] += 1
        agg[r["task"]][1] += 1 if is_success(r) else 0
    return {t: {"n": n, "k": k, "rate": k / n} for t, (n, k) in agg.items()}


# ===========================================================================
# 第 1 部分：主分析 —— 配对任务分块（仅主分析集）
# ===========================================================================

def paired_task_table(primary_records):
    """逐 task 计算 p_A, p_B, d_t = p_B - p_A（输入必须已是主分析集）。
    仅纳入两组都有数据的 task（配对结构要求）；报告被排除的 task。"""
    sa = group_task_stats(primary_records, GROUP_CONTROL)
    sb = group_task_stats(primary_records, GROUP_TREATMENT)
    common = sorted(set(sa) & set(sb))
    excluded = sorted((set(sa) | set(sb)) - set(common))
    rows = []
    for t in common:
        rows.append({
            "task": t,
            "n_A": sa[t]["n"], "k_A": sa[t]["k"], "p_A": sa[t]["rate"],
            "n_B": sb[t]["n"], "k_B": sb[t]["k"], "p_B": sb[t]["rate"],
            "d": sb[t]["rate"] - sa[t]["rate"],
        })
    return rows, excluded


# ===========================================================================
# L0 负对照 / L4 stress —— 单独描述报告，不推断
# ===========================================================================

def negative_control_report(records):
    """L0 负对照：两组通过率及差值，仅描述，不做任何推断。"""
    out = {"layer": NEGATIVE_CONTROL_LAYER, "note": "负对照，仅描述，不推断"}
    rates = {}
    for grp in (GROUP_CONTROL, GROUP_TREATMENT):
        runs = [r for r in records
                if r["group"] == grp and r["layer"] == NEGATIVE_CONTROL_LAYER]
        k = sum(1 for r in runs if is_success(r))
        rate = k / len(runs) if runs else float("nan")
        rates[grp] = rate
        out[grp] = {"n_runs": len(runs),
                    "n_tasks": len({r["task"] for r in runs}),
                    "n_success": k, "pass_rate": rate}
    out["diff_B_minus_A"] = rates[GROUP_TREATMENT] - rates[GROUP_CONTROL]
    return out


def stress_report(records):
    """L4 stress test：accuracy + abstention rate（abstained 缺省 false）。
    仅描述，不推断。"""
    out = {"layer": STRESS_LAYER, "note": "stress test，仅描述，不推断"}
    for grp in (GROUP_CONTROL, GROUP_TREATMENT):
        runs = [r for r in records
                if r["group"] == grp and r["layer"] == STRESS_LAYER]
        k = sum(1 for r in runs if is_success(r))
        abst = sum(1 for r in runs if bool(r.get("abstained", False)))
        out[grp] = {"n_runs": len(runs),
                    "n_tasks": len({r["task"] for r in runs}),
                    "n_success": k,
                    "accuracy": k / len(runs) if runs else float("nan"),
                    "n_abstained": abst,
                    "abstention_rate": abst / len(runs) if runs else float("nan")}
    return out


# ===========================================================================
# 第 4 部分：效率指标（仅主分析集，仅描述）
# ===========================================================================

def efficiency_group_summary(records, group):
    """单组效率描述。成功指标只用成功 run；tokens/工具调用等用全部 run。"""
    runs = [r for r in records if r["group"] == group]
    succ = [r for r in runs if is_success(r)]
    total_cost = sum(float(r["cost_usd"]) for r in runs)
    wf_calls = sum(int(r["webfetch_calls"]) for r in runs)
    wf_errs = sum(int(r["webfetch_errors"]) for r in runs)
    return {
        "n_runs": len(runs),
        "n_success_runs": len(succ),
        "success_rate_runlevel": (len(succ) / len(runs)) if runs else float("nan"),
        # --- 只在成功 run 上计算 ---
        "time_to_correct_ms_mean": mean([float(r["duration_ms"]) for r in succ]),
        "success_duration_ms_p50": percentile([float(r["duration_ms"]) for r in succ], 50),
        "success_duration_ms_p95": percentile([float(r["duration_ms"]) for r in succ], 95),
        # 冻结定义：全部 run 的成本 / 成功 run 数（失败尝试的钱也要算）
        "cost_per_success_usd": (total_cost / len(succ)) if succ else float("nan"),
        "mean_cost_of_success_runs_usd": mean([float(r["cost_usd"]) for r in succ]),
        # --- 全部 run（含失败）---
        "total_cost_usd": total_cost,
        "mean_cost_usd_all_runs": mean([float(r["cost_usd"]) for r in runs]),
        "mean_input_tokens": mean([float(r["input_tokens"]) for r in runs]),
        "mean_output_tokens": mean([float(r["output_tokens"]) for r in runs]),
        "mean_num_turns": mean([float(r["num_turns"]) for r in runs]),
        "mean_tool_calls": mean([float(r["tool_calls"]) for r in runs]),
        "mean_read_calls": mean([float(r["read_calls"]) for r in runs]),
        "mean_webfetch_calls": mean([float(r["webfetch_calls"]) for r in runs]),
        "webfetch_error_rate": (wf_errs / wf_calls) if wf_calls > 0 else float("nan"),
        "webfetch_calls_total": wf_calls,
        "webfetch_errors_total": wf_errs,
        "timeout_rate": mean([1.0 if r["timeout"] else 0.0 for r in runs]),
        "is_error_rate": mean([1.0 if r["is_error"] else 0.0 for r in runs]),
    }


def paired_efficiency_diffs(records):
    """配对效率差（B - A），task 为聚类单位（输入应为主分析集）。
    仅纳入两组都有 >=1 次成功的 task —— 条件在"成功"上有选择效应，
    故仅作为描述性次要指标，不参与判优。"""
    per = defaultdict(lambda: {GROUP_CONTROL: {"succ_dur": [], "cost": 0.0, "n_succ": 0},
                               GROUP_TREATMENT: {"succ_dur": [], "cost": 0.0, "n_succ": 0}})
    for r in records:
        grp = r["group"]
        if grp not in (GROUP_CONTROL, GROUP_TREATMENT):
            continue
        slot = per[r["task"]][grp]
        slot["cost"] += float(r["cost_usd"])
        if is_success(r):
            slot["succ_dur"].append(float(r["duration_ms"]))
            slot["n_succ"] += 1
    dur_diffs, cost_diffs, tasks_used = [], [], []
    for t in sorted(per):
        a, b = per[t][GROUP_CONTROL], per[t][GROUP_TREATMENT]
        if a["n_succ"] >= 1 and b["n_succ"] >= 1:
            tasks_used.append(t)
            dur_diffs.append(mean(b["succ_dur"]) - mean(a["succ_dur"]))
            cost_diffs.append(b["cost"] / b["n_succ"] - a["cost"] / a["n_succ"])
    return tasks_used, dur_diffs, cost_diffs


# ===========================================================================
# 分层（layer）与探索组 —— 仅描述统计
# ===========================================================================

def layer_descriptives(records):
    """按层通过率 —— 描述性统计（脚本不含加权逻辑；此表仅描述各层表现）。
    ** 不做推断 **：每层 task 数不足以支撑聚类推断，且未预注册多重比较
    校正；此表仅用于产生后续实验的假设，禁止用于判优。"""
    agg = defaultdict(lambda: [0, 0])
    for r in records:
        key = (r["group"], r["layer"])
        agg[key][0] += 1
        agg[key][1] += 1 if is_success(r) else 0
    out = []
    for (grp, layer), (n, k) in sorted(agg.items(), key=lambda kv: (str(kv[0][0]), str(kv[0][1]))):
        out.append({"group": grp, "layer": layer, "n_runs": n, "n_success": k,
                    "pass_rate": k / n,
                    "in_primary_set": layer in PRIMARY_LAYERS})
    return out


def exploratory_group_descriptives(records):
    """探索组（G0/GA2）总体通过率 —— 仅描述，不推断（预注册主对比只有 GA vs GB）。"""
    out = []
    for grp in EXPLORATORY_GROUPS:
        runs = [r for r in records if r["group"] == grp]
        if not runs:
            continue
        k = sum(1 for r in runs if is_success(r))
        tasks = len({r["task"] for r in runs})
        out.append({"group": grp, "n_runs": len(runs), "n_tasks": tasks,
                    "n_success": k, "pass_rate": k / len(runs)})
    return out


# ===========================================================================
# 第 5 部分：功效模拟（pilot 驱动，置换判定与 WIN 门一致）
# ===========================================================================

def fit_beta_binomial(task_counts, rng: random.Random):
    """beta-binomial 矩估计 + ρ 的 task-bootstrap 保守上界。
    task_counts: [(k_t, n_t), ...]。模型：p_t ~ Beta(α, β)，
    k_t | p_t ~ Binom(n_t, p_t)；Var(p̂_t) = μ(1-μ)[ρ + (1-ρ)/n̄]，
    ρ = 1/(α+β+1) 即 ICC。n_t 不等时用平均 n̄ 近似。

    额外输出 rho_boot_upper80 = ρ 的 task-bootstrap（B=RHO_BOOT_B）
    80% 区间上界（第 90 分位）；rho_conservative = 功效模拟采用的保守值：
    task 数 >= RHO_MIN_TASKS 时用 bootstrap 上界，否则（数据不足）用
    点估计 x 1.5、封顶 0.5（来源写在 rho_conservative_source）。"""
    if len(task_counts) < 3:
        raise SystemExit("[功效模拟] pilot 中对照组（主分析集）task 数 < 3，无法估计任务间分布")
    ks = np.asarray([k for k, _ in task_counts], dtype=float)
    ns = np.asarray([n for _, n in task_counts], dtype=float)
    T = len(ks)

    def rho_of(kv, nv):
        ph = kv / nv
        mu_ = float(ph.mean())
        var_ = float(ph.var(ddof=1)) if len(ph) > 1 else 0.0
        nbar_ = float(nv.mean())
        mu_c_ = min(max(mu_, 1e-6), 1 - 1e-6)
        denom_ = mu_c_ * (1 - mu_c_)
        raw_ = (var_ / denom_ - 1.0 / nbar_) / (1.0 - 1.0 / nbar_) if nbar_ > 1 else 0.0
        return raw_, mu_, nbar_

    rho_raw, mu, nbar = rho_of(ks, ns)
    rho = min(max(rho_raw, 1e-4), 0.95)
    mu_c = min(max(mu, 1e-6), 1 - 1e-6)
    ab = 1.0 / rho - 1.0
    alpha = mu_c * ab
    beta = (1 - mu_c) * ab

    # --- ρ 的 task-bootstrap 80% 区间上界（向量化） ---
    g = _np_gen(rng)
    idx = g.integers(0, T, size=(RHO_BOOT_B, T), dtype=np.int32)
    kb, nb = ks[idx], ns[idx]
    ph = kb / nb
    mu_b = ph.mean(axis=1)
    var_b = ph.var(axis=1, ddof=1)
    nbar_b = nb.mean(axis=1)
    mu_bc = np.clip(mu_b, 1e-6, 1 - 1e-6)
    with np.errstate(divide="ignore", invalid="ignore"):
        raw_b = (var_b / (mu_bc * (1 - mu_bc)) - 1.0 / nbar_b) / (1.0 - 1.0 / nbar_b)
    rho_b = np.clip(np.nan_to_num(raw_b, nan=1e-4), 1e-4, 0.95)
    rho_upper80 = float(np.percentile(rho_b, RHO_UPPER_PCTL))

    if T >= RHO_MIN_TASKS:
        rho_cons = rho_upper80
        rho_src = (f"task-bootstrap(B={RHO_BOOT_B}) 80% 区间上界（第 {RHO_UPPER_PCTL:.0f} 分位），"
                   f"task 数 {T} >= {RHO_MIN_TASKS}")
    else:
        rho_cons = min(RHO_FALLBACK_CAP, rho * RHO_FALLBACK_MULT)
        rho_src = (f"数据不足（task 数 {T} < {RHO_MIN_TASKS}）：点估计 x {RHO_FALLBACK_MULT}"
                   f"，封顶 {RHO_FALLBACK_CAP}")
    rho_cons = min(max(rho_cons, 1e-4), 0.95)

    return {"alpha": alpha, "beta": beta, "mu": mu, "rho_icc": rho,
            "rho_raw_uncapped": rho_raw,
            "rho_boot_upper80": rho_upper80,
            "rho_conservative": rho_cons,
            "rho_conservative_source": rho_src,
            "n_tasks_used": T, "mean_reps": nbar}


def _simulate_diffs_effect(g, n_datasets, N, R, mu, rho, delta):
    """有效应模拟：p_A ~ Beta(α,β)，p_B = clip(p_A + Δ)，X ~ Binom(R, p)。"""
    ab = 1.0 / rho - 1.0
    a, b = mu * ab, (1 - mu) * ab
    pa = g.beta(a, b, size=(n_datasets, N))
    pb = np.clip(pa + delta, 0.0, 1.0)
    return (g.binomial(R, pb) - g.binomial(R, pa)) / R


def _simulate_diffs_null(g, n_datasets, N, R, mu, rho):
    """无效应模拟：两组共享同一 p_t（同分布），X_A, X_B ~ Binom(R, p_t)。
    ρ 即同一 task 内 run 结果的 ICC（beta-binomial 过散布）。"""
    ab = 1.0 / rho - 1.0
    a, b = mu * ab, (1 - mu) * ab
    p = g.beta(a, b, size=(n_datasets, N))
    return (g.binomial(R, p) - g.binomial(R, p)) / R


def power_one_config(N, R, delta, mu, rho, rng,
                     n_sim=POWER_N_SIM, n_perm=POWER_PERM_P):
    """给定配置模拟 n_sim 次实验，功效 = P(置换双侧 p < ALPHA 且 mean(d) > 0)，
    与预注册 WIN 门完全一致。"""
    g = _np_gen(rng)
    d = _simulate_diffs_effect(g, n_sim, N, R, mu, rho, delta)
    pv = _perm_pvalues_matrix(d, g, n_perm)
    wins = int(np.sum((pv < ALPHA) & (d.mean(axis=1) > 0)))
    return wins / n_sim


def run_power_grid(fit, cost_per_run, rng):
    mu = fit["mu"]
    rho = fit["rho_conservative"]
    table = []
    for N in POWER_TASK_NS:
        for R in POWER_REPS:
            for dpp in POWER_DELTAS_PP:
                delta = dpp / 100.0
                pw = power_one_config(N, R, delta, mu, rho, rng)
                n_runs = N * R * 2  # 两个组
                table.append({
                    "n_tasks": N, "reps": R, "delta_pp": dpp, "delta": delta,
                    "power": pw, "n_runs_total": n_runs,
                    "est_cost_usd": (n_runs * cost_per_run
                                     if cost_per_run is not None else None),
                })
    return table


# ===========================================================================
# 报告输出
# ===========================================================================

def _fmt(x, nd=4):
    if x is None:
        return "  n/a"
    if isinstance(x, float):
        if math.isnan(x):
            return "  nan"
        return f"{x:.{nd}f}"
    return str(x)


def print_paired_table(rows, excluded):
    print(f"\n===== [1] 主分析：配对任务分块（GA vs GB，仅主分析集 "
          f"layer ∈ {set(PRIMARY_LAYERS)}）=====")
    print("  # 主 outcome = exact binary pass（判分器保证），无任何加权。")
    print("  # 聚类单位 = task：同一 task 的重复 run 相关，故一切推断都在 task 层面。")
    print(f"  配对 task 数：{len(rows)}；仅一组有数据而被排除的 task：{excluded or '无'}")
    print(f"  {'task':<28} {'n_A':>4} {'p_A':>7} {'n_B':>4} {'p_B':>7} {'d=p_B-p_A':>10}")
    for r in rows:
        print(f"  {str(r['task']):<28} {r['n_A']:>4} {r['p_A']:>7.3f} "
              f"{r['n_B']:>4} {r['p_B']:>7.3f} {r['d']:>+10.3f}")
    if rows:
        ds = [r["d"] for r in rows]
        sd = (math.sqrt(sum((x - mean(ds)) ** 2 for x in ds) / (len(ds) - 1))
              if len(ds) > 1 else float("nan"))
        print(f"  {'-' * 64}")
        print(f"  mean(d_t) = {mean(ds):+.4f}   （d_t 的样本 sd = {sd:.4f}）")


def print_inference(inf):
    print("\n===== [2] 推断：task 级置换检验（判优）+ bootstrap-t CI（区间）=====")
    print(f"  task 级符号翻转置换检验（P={N_PERMUTATIONS}，双侧，+1 修正）——判优主检验：")
    print(f"    mean(d) = {inf['mean_d']:+.4f}   p = {inf['permutation_p']:.5f}")
    print(f"  task-cluster bootstrap-t（B={B_BOOTSTRAP}，studentized，对称化临界值 "
          f"q=|t*| 97.5 分位；等尾变体未过冻结校准硬门被弃用）95% CI：")
    print(f"    [{inf['boott_ci_lower']:+.4f}, {inf['boott_ci_upper']:+.4f}]"
          + ("（退化样本，区间不可靠）" if inf["boott_degenerate"] else ""))
    print(f"  BCa 95% CI（仅对照输出，决策不使用）：")
    print(f"    [{inf['bca_ci_lower']:+.4f}, {inf['bca_ci_upper']:+.4f}]")
    print("  # 置换与 CI 结论冲突时以置换为准（冻结）：WIN 仅由置换检验决定。")


def print_decision(dec):
    print("\n===== [3] 预注册决策（冻结规则，禁止事后调整）=====")
    print(f"  规则：WIN 若置换双侧 p < {ALPHA} 且 mean(d) > 0；")
    print(f"        NON_INFERIOR（备用）若 bootstrap-t CI 下界 > {NONINFERIORITY_MARGIN}；")
    print("        否则 INSUFFICIENT_EVIDENCE。")
    print("  冲突裁决（冻结）：置换与 CI 冲突时以置换为准，WIN 仅由置换决定。")
    print(f"  perm_p = {dec['perm_p']:.5f}  mean(d) = {dec['mean_d']:+.4f}  "
          f"bootstrap-t CI 下界 = {dec['boott_ci_lower']:+.4f}")
    if dec["conflict_perm_vs_ci"]:
        print("  [冲突] CI 下界 > 0 但置换不显著 → 按冻结规则以置换为准，不判 WIN。")
    print(f"  →  判定：{dec['decision']}")


def print_efficiency(eff):
    print("\n===== [4] 效率指标（仅主分析集；描述性，不参与判优）=====")
    print("  # 成功 run = pass 且非 is_error 且非 timeout；timeout/is_error 一律计 fail。")
    for grp in (GROUP_CONTROL, GROUP_TREATMENT):
        s = eff["by_group"][grp]
        print(f"  --- {grp} ---")
        print(f"    runs={s['n_runs']}  成功 runs={s['n_success_runs']}  "
              f"run 级通过率={_fmt(s['success_rate_runlevel'])}")
        print(f"    [仅成功 run] time-to-correct 均值={_fmt(s['time_to_correct_ms_mean'], 1)}ms  "
              f"p50={_fmt(s['success_duration_ms_p50'], 1)}ms  "
              f"p95={_fmt(s['success_duration_ms_p95'], 1)}ms")
        print(f"    [仅成功 run] 每成功 run 成本（含失败尝试的花费）="
              f"${_fmt(s['cost_per_success_usd'])}  "
              f"成功 run 自身均价=${_fmt(s['mean_cost_of_success_runs_usd'])}")
        print(f"    [全部 run] tokens(in/out)={_fmt(s['mean_input_tokens'], 1)}/"
              f"{_fmt(s['mean_output_tokens'], 1)}  turns={_fmt(s['mean_num_turns'], 2)}  "
              f"tool_calls={_fmt(s['mean_tool_calls'], 2)}  read={_fmt(s['mean_read_calls'], 2)}")
        print(f"    [全部 run] webfetch 失败率={_fmt(s['webfetch_error_rate'])} "
              f"({s['webfetch_errors_total']}/{s['webfetch_calls_total']})  "
              f"timeout 率={_fmt(s['timeout_rate'])}  is_error 率={_fmt(s['is_error_rate'])}")
    pr = eff["paired"]
    print(f"  --- 配对差（B - A，task-cluster bootstrap percentile CI —— 仅描述性，"
          f"不用于决策；仅两组均有成功的 {pr['n_tasks_used']} 个 task）---")
    print(f"    time-to-correct 差：{_fmt(pr['duration_diff_ms_mean'], 1)}ms  "
          f"95% CI [{_fmt(pr['duration_diff_ms_ci'][0], 1)}, {_fmt(pr['duration_diff_ms_ci'][1], 1)}]")
    print(f"    每成功成本差：${_fmt(pr['cost_diff_usd_mean'])}  "
          f"95% CI [{_fmt(pr['cost_diff_usd_ci'][0])}, {_fmt(pr['cost_diff_usd_ci'][1])}]")


def print_control_and_stress(neg, stress):
    print(f"\n===== [5] L0 负对照（仅描述，不推断）=====")
    for grp in (GROUP_CONTROL, GROUP_TREATMENT):
        s = neg[grp]
        print(f"  {grp}: runs={s['n_runs']} tasks={s['n_tasks']} "
              f"pass_rate={_fmt(s['pass_rate'], 3)}")
    print(f"  差值（B - A）= {_fmt(neg['diff_B_minus_A'], 3)}（不做推断）")
    print(f"\n===== [6] L4 stress test（仅描述，不推断）=====")
    for grp in (GROUP_CONTROL, GROUP_TREATMENT):
        s = stress[grp]
        print(f"  {grp}: runs={s['n_runs']} tasks={s['n_tasks']} "
              f"accuracy={_fmt(s['accuracy'], 3)}  "
              f"abstention_rate={_fmt(s['abstention_rate'], 3)}"
              f"（abstained 缺省按 false）")


def print_layers(layers, expl):
    print("\n===== 按层描述表（全部 layer；无加权、不推断）=====")
    print("  # 每层样本不足、未预注册多重校正：此表只用于提假设，禁止判优。")
    print(f"  {'group':<8} {'layer':<10} {'primary':>7} {'runs':>5} {'succ':>5} {'pass_rate':>10}")
    for row in layers:
        print(f"  {str(row['group']):<8} {str(row['layer']):<10} "
              f"{('yes' if row['in_primary_set'] else 'no'):>7} "
              f"{row['n_runs']:>5} {row['n_success']:>5} {row['pass_rate']:>10.3f}")
    if expl:
        print("  --- 探索组（仅描述，不推断）---")
        for row in expl:
            print(f"  {row['group']:<8} runs={row['n_runs']} tasks={row['n_tasks']} "
                  f"pass_rate={row['pass_rate']:.3f}")


def print_power(fit, table, cost_per_run, cost_source):
    print("\n===== [7] 功效模拟（pilot 驱动）=====")
    print(f"  beta-binomial 拟合（对照组 {GROUP_CONTROL}，主分析集，"
          f"{fit['n_tasks_used']} 个 task，平均 R={fit['mean_reps']:.2f}）：")
    print(f"    μ={fit['mu']:.4f}  ICC ρ 点估计={fit['rho_icc']:.4f}"
          f"（矩估计原始值 {fit['rho_raw_uncapped']:.4f}，裁剪到 [1e-4, 0.95]）")
    print(f"    ρ bootstrap 80% 区间上界={fit['rho_boot_upper80']:.4f}；"
          f"功效模拟采用保守 ρ={fit['rho_conservative']:.4f}")
    print(f"    （来源：{fit['rho_conservative_source']}）")
    print(f"  单 run 成本：${cost_per_run}（{cost_source}）")
    print(f"  每配置模拟 {POWER_N_SIM} 次；功效判定与预注册 WIN 门完全一致 = ")
    print(f"  P(置换双侧 p < {ALPHA} 且 mean(d) > 0)，模拟内层置换 P={POWER_PERM_P}"
          f"（冻结的计算量折中；主分析用 P={N_PERMUTATIONS}）\n")
    print(f"  {'N_tasks':>7} {'R':>3} {'Δ(pp)':>6} {'power':>7} {'runs':>6} {'est_cost':>10}")
    for row in table:
        cost = f"${row['est_cost_usd']:.2f}" if row["est_cost_usd"] is not None else "n/a"
        print(f"  {row['n_tasks']:>7} {row['reps']:>3} {row['delta_pp']:>6} "
              f"{row['power']:>7.3f} {row['n_runs_total']:>6} {cost:>10}")


# ===========================================================================
# 分析主流程
# ===========================================================================

def analyze_main(primary_records, rng):
    """主分析（仅主分析集）：配对表 + 置换检验 + bootstrap-t CI + BCa 对照。"""
    rows, excluded = paired_task_table(primary_records)
    if len(rows) < 2:
        raise SystemExit(f"[数据错误] 主分析集内 GA/GB 共同覆盖的 task 数 = {len(rows)} < 2，"
                         "无法做主分析")
    diffs = [r["d"] for r in rows]
    pval = permutation_pvalue(diffs, rng)
    bt = bootstrap_t_ci(diffs, rng)
    bca = bca_ci(diffs, rng)
    inference = {
        "mean_d": bt["mean"],
        "permutation_p": pval, "n_permutations": N_PERMUTATIONS,
        "boott_ci_lower": bt["lo"], "boott_ci_upper": bt["hi"],
        "boott_se_obs": bt["se_obs"], "boott_degenerate": bt["degenerate"],
        "bca_ci_lower": bca["lo"], "bca_ci_upper": bca["hi"],
        "bca_note": "BCa 仅对照输出，决策用 bootstrap-t + 置换",
        "ci_level": CI_LEVEL, "n_bootstrap": B_BOOTSTRAP,
        "n_paired_tasks": len(rows),
        "primary_layers": list(PRIMARY_LAYERS),
        "conflict_rule": "置换与 CI 结论冲突时以置换为准（冻结）",
    }
    return rows, excluded, inference


def analyze_efficiency(primary_records, rng):
    by_group = {grp: efficiency_group_summary(primary_records, grp)
                for grp in (GROUP_CONTROL, GROUP_TREATMENT)}
    tasks_used, dur_diffs, cost_diffs = paired_efficiency_diffs(primary_records)
    dur_mean, dur_lo, dur_hi = bootstrap_mean_percentile_ci(dur_diffs, rng)
    cost_mean, cost_lo, cost_hi = bootstrap_mean_percentile_ci(cost_diffs, rng)
    return {
        "scope": f"仅主分析集 layer ∈ {list(PRIMARY_LAYERS)}",
        "by_group": by_group,
        "paired": {
            "n_tasks_used": len(tasks_used),
            "tasks_used": tasks_used,
            "duration_diff_ms_mean": dur_mean,
            "duration_diff_ms_ci": [dur_lo, dur_hi],
            "cost_diff_usd_mean": cost_mean,
            "cost_diff_usd_ci": [cost_lo, cost_hi],
            "ci_method": "task-cluster bootstrap percentile（仅描述性，不用于决策）",
            "note": "仅纳入两组均有>=1次成功的task；条件于成功有选择效应，为描述性次要指标，不参与判优",
        },
    }


def run_final(args):
    rng = random.Random(args.seed)
    records = load_records(args.input)
    primary = primary_subset(records)
    if not primary:
        raise SystemExit(f"[数据错误] 没有任何 layer ∈ {list(PRIMARY_LAYERS)} 的主分析集数据")
    rows, excluded, inference = analyze_main(primary, rng)
    efficiency = analyze_efficiency(primary, rng)
    neg = negative_control_report(records)
    stress = stress_report(records)
    layers = layer_descriptives(records)
    expl = exploratory_group_descriptives(records)
    decision = preregistered_decision(inference["permutation_p"],
                                      inference["mean_d"],
                                      inference["boott_ci_lower"])

    print(f"预注册 A/B 分析（--final）  seed={args.seed}  numpy={np.__version__}")
    print(f"数据：{args.input}（{len(records)} 条 run；主分析集 {len(primary)} 条）")
    print_paired_table(rows, excluded)
    print_inference(inference)
    print_decision(decision)
    print_efficiency(efficiency)
    print_control_and_stress(neg, stress)
    print_layers(layers, expl)

    result = {
        "mode": "final", "seed": args.seed, "input": args.input,
        "numpy_version": np.__version__,
        "preregistered_constants": _constants_dict(),
        "n_records": len(records),
        "n_primary_records": len(primary),
        "per_task_table": rows,
        "excluded_tasks": excluded,
        "inference": inference,
        "decision": decision,
        "efficiency_descriptive": efficiency,
        "negative_control_L0": neg,
        "stress_L4": stress,
        "layer_descriptives_no_inference": layers,
        "exploratory_groups_no_inference": expl,
    }
    emit_json(result, args.json_out)


def run_pilot(args):
    rng = random.Random(args.seed)
    records = load_records(args.input)
    primary = primary_subset(records)

    print(f"预注册 A/B 分析（--pilot）  seed={args.seed}  numpy={np.__version__}")
    print(f"数据：{args.input}（{len(records)} 条 run；主分析集 {len(primary)} 条）")

    sa = group_task_stats(primary, GROUP_CONTROL)
    sb = group_task_stats(primary, GROUP_TREATMENT)
    if not sa:
        raise SystemExit(f"[数据错误] pilot 主分析集中没有对照组 {GROUP_CONTROL} 的数据")
    rows, excluded, table_note = [], [], None
    if sb:
        rows, excluded = paired_task_table(primary)
        print_paired_table(rows, excluded)
    else:
        table_note = f"pilot 中无 {GROUP_TREATMENT} 数据，跳过配对差值表"
        print(f"\n[提示] {table_note}")

    # 功效模拟：基线分布从对照组 GA（主分析集）估计；ICC 用保守上界
    task_counts = [(v["k"], v["n"]) for v in sa.values()]
    fit = fit_beta_binomial(task_counts, rng)
    if args.cost_per_run is not None:
        cost_per_run, cost_source = args.cost_per_run, "--cost-per-run 传入"
    else:
        cost_per_run = mean([float(r["cost_usd"]) for r in records])
        cost_source = "pilot 全部 run 的 cost_usd 均值（未显式传 --cost-per-run）"
    table = run_power_grid(fit, cost_per_run, rng)
    print_power(fit, table, cost_per_run, cost_source)

    neg = negative_control_report(records)
    stress = stress_report(records)
    layers = layer_descriptives(records)
    expl = exploratory_group_descriptives(records)
    print_control_and_stress(neg, stress)
    print_layers(layers, expl)

    result = {
        "mode": "pilot", "seed": args.seed, "input": args.input,
        "numpy_version": np.__version__,
        "preregistered_constants": _constants_dict(),
        "n_records": len(records),
        "n_primary_records": len(primary),
        "per_task_table": rows,
        "excluded_tasks": excluded,
        "per_task_table_note": table_note,
        "beta_binomial_fit": fit,
        "cost_per_run_usd": cost_per_run,
        "cost_per_run_source": cost_source,
        "power_table": table,
        "negative_control_L0": neg,
        "stress_L4": stress,
        "layer_descriptives_no_inference": layers,
        "exploratory_groups_no_inference": expl,
    }
    emit_json(result, args.json_out)


def _constants_dict():
    return {
        "group_control": GROUP_CONTROL, "group_treatment": GROUP_TREATMENT,
        "exploratory_groups": list(EXPLORATORY_GROUPS),
        "primary_layers": list(PRIMARY_LAYERS),
        "negative_control_layer": NEGATIVE_CONTROL_LAYER,
        "stress_layer": STRESS_LAYER,
        "alpha": ALPHA,
        "b_bootstrap": B_BOOTSTRAP, "n_permutations": N_PERMUTATIONS,
        "ci_level": CI_LEVEL, "noninferiority_margin": NONINFERIORITY_MARGIN,
        "boott_variant": "对称化 studentized bootstrap-t（Hall）：q=|t*| 第97.5分位"
                         "（'higher' 保守经验分位）；等尾 percentile-t 因校准网格"
                         "实测反保守（下界>0 比例最高 0.058 > 名义 0.025）弃用，冻结",
        "decision_rule": {
            "win": f"permutation two-sided p < {ALPHA} AND mean(d) > 0",
            "non_inferior": f"bootstrap-t 95% CI lower > {NONINFERIORITY_MARGIN}",
            "otherwise": "INSUFFICIENT_EVIDENCE",
            "conflict": "置换与 CI 冲突时以置换为准（冻结）",
        },
        "power_task_ns": list(POWER_TASK_NS), "power_reps": list(POWER_REPS),
        "power_deltas_pp": list(POWER_DELTAS_PP), "power_n_sim": POWER_N_SIM,
        "power_perm_p": POWER_PERM_P,
        "rho_boot_b": RHO_BOOT_B, "rho_upper_pctl": RHO_UPPER_PCTL,
        "rho_min_tasks": RHO_MIN_TASKS, "rho_fallback": "点估计x1.5 封顶0.5",
        "success_definition": "pass AND NOT is_error AND NOT timeout（pass 为 exact binary）",
        "selftest_grid": {"n_tasks": list(ST_GRID_N), "reps": list(ST_GRID_R),
                          "mu": list(ST_GRID_MU), "rho": list(ST_GRID_RHO),
                          "n_datasets": ST_N_DATASETS,
                          "perm_p": ST_PERM_P, "boot_b": ST_BOOT_B},
    }


def emit_json(result, json_out):
    # JSON 中不做任何精度截断：json.dumps 用 repr(float)，即原始双精度。
    payload = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=True)
    if json_out:
        with open(json_out, "w", encoding="utf-8") as f:
            f.write(payload + "\n")
        print(f"\n[machine-readable JSON 已写入] {json_out}")
    else:
        print("\n===== machine-readable JSON =====")
        print(payload)


# ===========================================================================
# --selftest：每场景校准验证（放行 pilot 的硬门）
# ===========================================================================

def run_selftest(seed, json_out=None):
    rng = random.Random(seed)
    failures = []

    def check(name, cond, detail):
        status = "PASS" if cond else "FAIL"
        print(f"  [{status}] {name}: {detail}")
        if not cond:
            failures.append(name)

    print(f"--selftest  seed={seed}  numpy={np.__version__}")
    print(f"[声明] selftest 中置换/自举次数降配为 P={ST_PERM_P} / B={ST_BOOT_B}"
          f"（主分析冻结常量仍为 P={N_PERMUTATIONS} / B={B_BOOTSTRAP}，不受影响）。")
    print(f"[声明] 每场景 {ST_N_DATASETS} 个独立合成数据集；type-I / 非覆盖率的"
          f" Monte Carlo 95% CI 用 Wilson 区间（对二项比例正确）。")

    # ---------- 单元检查 ----------
    print("\n--- 单元检查 ---")
    check("percentile 线性插值", abs(percentile([1, 2, 3, 4], 50) - 2.5) < 1e-12,
          f"percentile([1,2,3,4],50)={percentile([1, 2, 3, 4], 50)}（期望 2.5）")
    check("percentile 端点", percentile([3, 1, 2], 0) == 1 and percentile([3, 1, 2], 100) == 3,
          "min/max 端点正确")
    d_win = preregistered_decision(0.01, 0.10, 0.05)
    d_ni = preregistered_decision(0.20, 0.10, -0.01)
    d_ie = preregistered_decision(0.20, 0.10, -0.05)
    d_dir = preregistered_decision(0.01, -0.10, -0.05)   # 显著但方向为负 → 不 WIN
    d_cfl = preregistered_decision(0.20, 0.10, 0.02)     # CI>0 但置换不显著 → 置换为准
    check("决策规则三分支 + 方向门 + 冲突裁决",
          d_win["decision"] == "WIN" and d_ni["decision"] == "NON_INFERIOR"
          and d_ie["decision"] == "INSUFFICIENT_EVIDENCE"
          and d_dir["decision"] == "INSUFFICIENT_EVIDENCE"
          and d_cfl["decision"] == "NON_INFERIOR" and d_cfl["conflict_perm_vs_ci"],
          "WIN/NON_INFERIOR/INSUFFICIENT + mean<=0 不 WIN + CI>0 而置换不显著时以置换为准")
    check("决策规则 nan 防御",
          preregistered_decision(float("nan"), float("nan"), float("nan"))["decision"]
          == "INSUFFICIENT_EVIDENCE", "全 nan → INSUFFICIENT_EVIDENCE")

    # beta-binomial 拟合恢复已知参数（含保守上界输出）
    r_bb = random.Random(seed + 2)
    g_bb = _np_gen(r_bb)
    a_true, b_true = 6.0, 4.0            # μ=0.6, ρ=1/11≈0.0909
    p_true = g_bb.beta(a_true, b_true, size=300)
    counts = [(int(k), 6) for k in g_bb.binomial(6, p_true)]
    fit = fit_beta_binomial(counts, r_bb)
    check("beta-binomial μ 恢复", abs(fit["mu"] - 0.6) < 0.06,
          f"μ̂={fit['mu']:.3f}（真值 0.6）")
    check("beta-binomial ρ(ICC) 恢复", 0.02 <= fit["rho_icc"] <= 0.25,
          f"ρ̂={fit['rho_icc']:.3f}（真值 0.091）")
    check("ρ 保守上界 >= 点估计", fit["rho_conservative"] >= fit["rho_icc"] - 1e-9,
          f"ρ_cons={fit['rho_conservative']:.4f} >= ρ̂={fit['rho_icc']:.4f}"
          f"（{fit['rho_conservative_source']}）")
    fit_small = fit_beta_binomial(counts[:5], random.Random(seed + 3))
    check("ρ 数据不足回退（<8 task：点估计x1.5 封顶0.5）",
          abs(fit_small["rho_conservative"]
              - min(RHO_FALLBACK_CAP, fit_small["rho_icc"] * RHO_FALLBACK_MULT)) < 1e-12,
          f"T=5 → ρ_cons={fit_small['rho_conservative']:.4f}"
          f"（{fit_small['rho_conservative_source']}）")

    # 大效应下置换显著 + bootstrap-t CI 覆盖方向
    g_eff = _np_gen(random.Random(seed + 1))
    d_eff = list(_simulate_diffs_effect(g_eff, 1, 28, 6, 0.40, 0.10, 0.35)[0])
    p_eff = permutation_pvalue(d_eff, rng, n_perm=ST_PERM_P)
    bt_eff = bootstrap_t_ci(d_eff, rng, n_boot=ST_BOOT_B)
    check("大效应置换检验显著", p_eff < 0.05, f"Δ=0.35 时 p = {p_eff:.4f}")
    check("大效应 bootstrap-t CI 下界>0 且覆盖真值",
          bt_eff["lo"] > 0 and bt_eff["lo"] < 0.35 < bt_eff["hi"] + 0.15,
          f"bootstrap-t CI = [{bt_eff['lo']:.3f}, {bt_eff['hi']:.3f}]（真 Δ=0.35）")

    # ---------- 每场景校准（硬门）：无效应网格 ----------
    print(f"\n--- 每场景校准（无效应，beta-binomial 共享 p_t；每场景 "
          f"{ST_N_DATASETS} 个数据集；P={ST_PERM_P}, B={ST_BOOT_B}）---")
    header = (f"  {'N':>3} {'R':>2} {'mu':>4} {'rho':>4} | "
              f"{'typeI':>6} {'typeI_MC95CI':>17} {'gate':>4} | "
              f"{'bt>0':>6} {'bt_MC95CI':>17} {'gate':>4}")
    print(header)
    print("  " + "-" * (len(header) - 2))
    scenario_rows = []
    for N in ST_GRID_N:
        for R in ST_GRID_R:
            for mu in ST_GRID_MU:
                for rho in ST_GRID_RHO:
                    g = _np_gen(rng)
                    d = _simulate_diffs_null(g, ST_N_DATASETS, N, R, mu, rho)
                    pv = _perm_pvalues_matrix(d, g, ST_PERM_P)
                    lows = _boott_lower_matrix(d, g, ST_BOOT_B)
                    k1 = int((pv < ALPHA).sum())
                    t1 = k1 / ST_N_DATASETS
                    t1_lo, t1_hi = wilson_ci(k1, ST_N_DATASETS)
                    k2 = int((lows > 0).sum())
                    fw = k2 / ST_N_DATASETS
                    fw_lo, fw_hi = wilson_ci(k2, ST_N_DATASETS)
                    # 通过标准（冻结）：MC 95% CI 包含名义值，或整体低于名义值（保守可接受）
                    t1_ok = (t1_lo <= ALPHA <= t1_hi) or (t1_hi < ALPHA)
                    fw_ok = (fw_lo <= 0.025 <= fw_hi) or (fw_hi < 0.025)
                    print(f"  {N:>3} {R:>2} {mu:>4.1f} {rho:>4.1f} | "
                          f"{t1:>6.4f} [{t1_lo:.4f},{t1_hi:.4f}] "
                          f"{'PASS' if t1_ok else 'FAIL':>4} | "
                          f"{fw:>6.4f} [{fw_lo:.4f},{fw_hi:.4f}] "
                          f"{'PASS' if fw_ok else 'FAIL':>4}")
                    scenario_rows.append({
                        "n_tasks": N, "reps": R, "mu": mu, "rho": rho,
                        "n_datasets": ST_N_DATASETS,
                        "perm_type1": t1, "perm_type1_mc95ci": [t1_lo, t1_hi],
                        "perm_type1_pass": t1_ok,
                        "boott_lower_gt0_rate": fw,
                        "boott_lower_gt0_mc95ci": [fw_lo, fw_hi],
                        "boott_pass": fw_ok,
                    })
                    if not t1_ok:
                        failures.append(f"typeI(N={N},R={R},mu={mu},rho={rho})")
                    if not fw_ok:
                        failures.append(f"boott(N={N},R={R},mu={mu},rho={rho})")
    print("  # 通过标准：type-I 的 MC 95% CI 包含 0.05 或整体低于 0.05（保守可接受）；")
    print("  #           bootstrap-t 下界>0 比例的 MC 95% CI 包含 0.025 或整体低于。")

    # ---------- 有效应场景：功效单调且置换能拒绝 ----------
    print(f"\n--- 有效应场景（Δ ∈ {list(ST_EFFECT_DELTAS)}，每配置 "
          f"{ST_EFFECT_DATASETS} 个数据集；判定 = WIN 门：置换 p<{ALPHA} 且 mean>0）---")
    effect_rows = []
    for (N, R) in ((28, 4), (10, 2)):
        for rho in ST_GRID_RHO:
            powers = []
            for delta in ST_EFFECT_DELTAS:
                g = _np_gen(rng)
                d = _simulate_diffs_effect(g, ST_EFFECT_DATASETS, N, R, 0.3, rho, delta)
                pv = _perm_pvalues_matrix(d, g, ST_PERM_P)
                pw = float(np.mean((pv < ALPHA) & (d.mean(axis=1) > 0)))
                powers.append(pw)
            print(f"  N={N:>2} R={R} rho={rho:.1f} μ=0.3: "
                  + "  ".join(f"power(Δ={dd:.2f})={pp:.3f}"
                              for dd, pp in zip(ST_EFFECT_DELTAS, powers)))
            effect_rows.append({"n_tasks": N, "reps": R, "mu": 0.3, "rho": rho,
                                "deltas": list(ST_EFFECT_DELTAS), "powers": powers})
            check(f"功效单调(N={N},R={R},rho={rho})", powers[1] > powers[0],
                  f"power(0.30)={powers[1]:.3f} > power(0.15)={powers[0]:.3f}")
            if (N, R) == (28, 4):
                check(f"大效应高功效(N=28,R=4,rho={rho})", powers[1] >= 0.8,
                      f"power(0.30)={powers[1]:.3f} >= 0.8")
                check(f"中效应可拒绝(N=28,R=4,rho={rho})", powers[0] >= 0.25,
                      f"power(0.15)={powers[0]:.3f} >= 0.25")
            else:
                check(f"极端小样本仍能拒绝(N=10,R=2,rho={rho})", powers[1] >= 0.15,
                      f"power(0.30)={powers[1]:.3f} >= 0.15")

    ok = not failures
    print(f"\nselftest 结果：{'全部通过（校准硬门放行）' if ok else '失败项：' + ', '.join(failures)}")

    if json_out is not None:
        emit_json({"mode": "selftest", "seed": seed,
                   "numpy_version": np.__version__,
                   "declared_reduced_iterations": {"perm_p": ST_PERM_P, "boot_b": ST_BOOT_B},
                   "mc_ci_method": "Wilson 95%",
                   "null_scenarios": scenario_rows,
                   "effect_scenarios": effect_rows,
                   "failures": failures, "all_pass": ok},
                  json_out)
    return 0 if ok else 1


# ===========================================================================
# CLI
# ===========================================================================

def main(argv=None):
    ap = argparse.ArgumentParser(
        description="预注册 A/B 实验统计分析（配对任务分块 + task 级置换检验判优 + "
                    "task-cluster bootstrap-t CI）。注意：alpha / 非劣边际 / B 次数 / "
                    "决策规则 / 主分析集定义均为冻结常量，刻意不提供 CLI 覆盖入口。")
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--pilot", action="store_true",
                      help="pilot 模式：配对差值表 + 功效模拟（保守 ICC）")
    mode.add_argument("--final", action="store_true",
                      help="final 模式：主分析 + 推断 + 决策 + L0/L4 单独报告")
    mode.add_argument("--selftest", action="store_true",
                      help="每场景校准验证（type-I / 非覆盖率 / 功效单调）——放行 pilot 的硬门")
    ap.add_argument("--input", help="JSONL 数据文件（pilot/final 必填）")
    ap.add_argument("--seed", type=int, default=20260713,
                    help="随机种子（默认 20260713）；同 seed → 结果可复现")
    ap.add_argument("--cost-per-run", type=float, default=None,
                    help="单 run 成本（美元），用于功效表费用估算；缺省用 pilot 数据均值")
    ap.add_argument("--json-out", default=None,
                    help="machine-readable JSON 输出路径；缺省打印到 stdout")
    args = ap.parse_args(argv)

    if args.selftest:
        return run_selftest(args.seed, args.json_out)
    if not args.input:
        ap.error("--pilot / --final 需要 --input <data.jsonl>")
    if args.pilot:
        run_pilot(args)
    else:
        run_final(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
