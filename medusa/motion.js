"use strict";

const clips = {
  joy: {
    title: "开怀舒展", tag: "喜",
    description: "微笑渐起，肩臂舒展，视线随着手势转动，再缓缓收回。"
  },
  anger: {
    title: "凝眉收势", tag: "怒",
    description: "眉眼收紧，肩臂和手势逐渐用力，停顿一拍后放松。"
  },
  sorrow: {
    title: "垂眼停顿", tag: "哀",
    description: "视线下垂，头肩内收，手靠近身前，停顿后缓缓抬眼。"
  },
  delight: {
    title: "会心一笑", tag: "乐",
    description: "眉眼放松，嘴角抬起，侧头后自然回正。"
  },
  reflect: {
    title: "低头沉思", tag: "沉思",
    description: "抬手靠近面部，微微侧头停留，再放下手臂。"
  },
  greet: {
    title: "挥手问候", tag: "打招呼",
    description: "抬起一只手，轻摆两次，微笑着收回手臂。"
  },
  drowse: {
    title: "低头打盹", tag: "打瞌睡",
    description: "眼皮缓缓合上，头往下点，随后抬头睁眼，回到待机。"
  }
};
const mediaPath = "assets/medusa";
const tabs = [...document.querySelectorAll("#emotion-tabs [role=tab]")];
const panel = document.querySelector("#motion-panel");
const video = document.querySelector("#case-video");
const directLink = document.querySelector("#video-link");
const message = document.querySelector("#video-status");
const duration = document.querySelector("#clip-duration");

function select(tab) {
  const key = tab.dataset.emotion;
  if (tab.getAttribute("aria-selected") === "true") return;
  const clip = clips[key];
  for (const item of tabs) {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  }
  panel.setAttribute("aria-labelledby", tab.id);
  document.querySelector("#motion-tag").textContent = clip.tag;
  document.querySelector("#motion-title").textContent = clip.title;
  document.querySelector("#motion-description").textContent = clip.description;
  duration.textContent = "";
  message.hidden = true;
  video.pause();
  video.poster = `${mediaPath}/${key}.webp`;
  video.src = `${mediaPath}/${key}.mp4`;
  video.setAttribute("aria-label", `美杜莎动作 · ${clip.title}`);
  directLink.href = video.src;
}

for (const tab of tabs) tab.addEventListener("click", () => select(tab));
document.querySelector("#emotion-tabs").addEventListener("keydown", (event) => {
  const current = tabs.indexOf(event.target);
  const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (current < 0 || (offset === undefined && !["Home", "End"].includes(event.key))) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + offset + tabs.length) % tabs.length;
  tabs[next].focus();
  select(tabs[next]);
});
function showDuration() {
  if (Number.isFinite(video.duration)) {
    duration.textContent = `${video.duration.toFixed(1)} 秒`;
  }
}
video.addEventListener("loadedmetadata", showDuration);
showDuration();
video.addEventListener("error", () => {
  duration.textContent = "";
  message.hidden = false;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) video.pause();
});
