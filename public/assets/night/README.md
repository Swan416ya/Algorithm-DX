# assets/night —— 夜版背景贴图

夜版背景用的素材：结构和参数都还是官网那份 `style.css`，只是把 `vendor/maimai/img/bg/` 里
那几张贴图按夜色重画了一遍。谁换哪一张写在 `public/theme-night.css` 里。

## 来源与做法

- 底图来自 `public/vendor/maimai/img/bg/**`（官方原图，未改动；字节与 MD5 见那份 MANIFEST）。
- 重上色是离线做的一次性步骤：按原图的亮度分层，把白/亮部压成夜蓝、保留原来的粉/橙描边，
  再按需要做无缝化（`aurora.png` 是「原图 + 水平镜像」的双宽图，`rainbow.png` 是降饱和的月虹）。
  做法写在 `theme-night.css` 的注释里；生成脚本是一次性的本地工具，没有进仓库。
- 月亮和流星直接用官方素材，没有派生版本（夜里它们本来就该是最亮的）。

## 文件

| 文件 | 对应官方贴图 | 说明 |
| --- | --- | --- |
| `sky-frame.png` | `bg/sky-frame.png` | `.bg` 圆角外那圈底色 |
| `sky.png` | `bg/sky.png` | `.bg--gradient` 的内层渐变 |
| `pattern.png` | `bg/pattern.png` | 渐变上的图案叠加 |
| `shines.png` | `bg/shines.png` | 闪点 |
| `cloud-back-{l,c,r}.png` | `bg/cloud-back-*.png` | 三片远云：白体换夜蓝，暖色描边保留 |
| `cloud-front-{l,c,r}.png` | `bg/cloud-front-*.png` | 三片近云，同上 |
| `rainbow-bottom.png` | `bg/rainbow-bottom.png` | 彩虹两端那两片云 |
| `rainbow.png` | `bg/rainbow.png` | 月虹（降饱和） |
| `aurora.png` | `bg/aurora.png` | 无缝双宽图，配合 `mix-blend-mode:screen` 与模糊 |

`MANIFEST.txt` 记录每个文件的字节数与 MD5，跟 `vendor/maimai/img/MANIFEST.txt` 同一个格式。