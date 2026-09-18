/* ------------------------------------------------------------------ */
/* 主题注册表：ThemeId、展示名、状态栏颜色与图表色板的唯一事实来源。      */
/* 新增主题两步：此处登记 THEMES/THEME_LIST，                          */
/* styles.css 增加 html[data-theme='xxx'] { … } 变量段。               */
/* 注意：index.html 的防闪烁内联脚本里维护了一份 themeColor 映射，       */
/* 修改 themeColor 时需同步（脚本无法读 TS 模块，属有意复制）。          */
/* ------------------------------------------------------------------ */

export type ThemeId = 'light' | 'dark' | 'candy' | 'sakura' | 'journal';

export interface ChartPalette {
  muted: string;
  line: string;
  ink: string;
  border: string;
  green: string;
  red: string;
  primary: string;
  /** 空态占位灰环（比网格线深一档，白底卡片上可辨） */
  ring: string;
  /** 面积渐变用的 rgb 三元组，与 primary/green/red 一一对应 */
  rgb: { primary: string; green: string; red: string };
  /** 分类饼图系列色 */
  series: string[];
}

export interface ThemeMeta {
  id: ThemeId;
  /** 设置页展示名 */
  name: string;
  /** 深色底主题（浅色系风格主题为 false） */
  dark: boolean;
  /** 移动端状态栏 / PWA meta theme-color */
  themeColor: string;
  /** 设置页预览色块 */
  swatch: { bg: string; surface: string; primary: string };
  charts: ChartPalette;
}

/* 简约浅色/深色：图表色板与重构前 StatsPage 写死的两套完全一致，勿改值 */
const LIGHT_CHARTS: ChartPalette = {
  muted: '#7a8194',
  line: '#eef0f4',
  ink: '#1b2231',
  border: '#ffffff',
  green: '#22c55e',
  red: '#ef5350',
  primary: '#5b7cfa',
  ring: '#e4e7ee',
  rgb: { primary: '91,124,250', green: '34,197,94', red: '239,83,80' },
  series: ['#5b7cfa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'],
};

const DARK_CHARTS: ChartPalette = {
  muted: '#8f99ad',
  line: '#232b3a',
  ink: '#e9ecf4',
  border: '#1c222e',
  green: '#34d399',
  red: '#f26d6a',
  primary: '#8091ff',
  ring: '#2a3448',
  rgb: { primary: '128,145,255', green: '52,211,153', red: '242,109,106' },
  series: LIGHT_CHARTS.series,
};

export const THEMES: Record<ThemeId, ThemeMeta> = {
  light: {
    id: 'light',
    name: '简约浅色',
    dark: false,
    themeColor: '#5b7cfa',
    swatch: { bg: '#f4f5f7', surface: '#ffffff', primary: '#5b7cfa' },
    charts: LIGHT_CHARTS,
  },
  dark: {
    id: 'dark',
    name: '简约深色',
    dark: true,
    themeColor: '#12151c',
    swatch: { bg: '#0e1118', surface: '#171c26', primary: '#8091ff' },
    charts: DARK_CHARTS,
  },
  candy: {
    id: 'candy',
    name: '糖果卡通',
    dark: false,
    themeColor: '#ff7096',
    swatch: { bg: '#fdf2f7', surface: '#ffffff', primary: '#ff7096' },
    charts: {
      muted: '#a08598',
      line: '#ffe3ec',
      ink: '#3d2c3e',
      border: '#ffffff',
      green: '#1fc08e',
      red: '#f45b69',
      primary: '#ff7096',
      ring: '#f9dbe7',
      rgb: { primary: '255,112,150', green: '31,192,142', red: '244,91,105' },
      series: ['#ff7096', '#ffc24b', '#4cc9f0', '#9d6bff', '#2ecf9a', '#ff9f43', '#f278b5', '#59b8ff', '#a8d94e'],
    },
  },
  sakura: {
    id: 'sakura',
    name: '樱花少女',
    dark: false,
    themeColor: '#d98cc0',
    swatch: { bg: '#fbf3f8', surface: '#ffffff', primary: '#d97fb8' },
    charts: {
      muted: '#a893a3',
      line: '#f3e2ec',
      ink: '#4a3a47',
      border: '#ffffff',
      green: '#6faf78',
      red: '#e57373',
      primary: '#d97fb8',
      ring: '#f0dce8',
      rgb: { primary: '217,127,184', green: '111,175,120', red: '229,115,115' },
      series: ['#d97fb8', '#9d8cff', '#f2a65a', '#6fc7b9', '#e57373', '#b5cc6e', '#8fb7e8', '#e8a2c8', '#c9a2e8'],
    },
  },
  journal: {
    id: 'journal',
    name: '手账时光',
    dark: false,
    themeColor: '#a97c50',
    swatch: { bg: '#f5efe3', surface: '#fffdf7', primary: '#a97c50' },
    charts: {
      muted: '#9a8c78',
      line: '#e8ddc6',
      ink: '#4a3f33',
      border: '#ffffff',
      green: '#7a9455',
      red: '#c25b4e',
      primary: '#a97c50',
      ring: '#ddcfae',
      rgb: { primary: '169,124,80', green: '122,148,85', red: '194,91,78' },
      series: ['#a97c50', '#7a9455', '#c25b4e', '#6b8cae', '#b98a2f', '#8a6f9e', '#c97b63', '#5f8a72', '#b5547c'],
    },
  },
};

/** 设置页宫格顺序 */
export const THEME_LIST: ThemeMeta[] = [THEMES.light, THEMES.dark, THEMES.candy, THEMES.sakura, THEMES.journal];

/** 兜底取主题：localStorage 被手动改坏时按浅色渲染，避免 undefined 崩溃 */
export function getTheme(id: ThemeId | string): ThemeMeta {
  return THEMES[id as ThemeId] ?? THEMES.light;
}
